import * as pdfjsLib from 'pdfjs-dist';
import { Book, Chapter, Paragraph } from '../types/book';

// Set worker source for PDF.js to avoid worker loading issues in browser Vite
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export async function parsePdfFile(
  file: File,
  onProgress?: (percent: number, current: number, total: number) => void
): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let title = file.name.replace(/\.pdf$/i, '');
  let author = 'PDF 文档';

  try {
    const meta: any = await pdfDoc.getMetadata();
    if (meta?.info?.Title && meta.info.Title.trim()) {
      title = meta.info.Title.trim();
    }
    if (meta?.info?.Author && meta.info.Author.trim()) {
      author = meta.info.Author.trim();
    }
  } catch (err) {
    console.warn('Failed to extract PDF metadata:', err);
  }

  // Extract pages and group into chapters
  const chapters: Chapter[] = [];
  const maxPagesToProcess = Math.min(numPages, 100); // Guard for mobile memory

  // We can group 5 pages per chapter for easier navigation if numPages > 10, or page by page
  const pagesPerChapter = numPages > 15 ? 5 : 1;

  let currentChapterParagraphs: Paragraph[] = [];
  let currentChapterStartPage = 1;
  let chapterIndex = 1;

  for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
    if (onProgress) {
      onProgress(Math.round((pageNum / maxPagesToProcess) * 100), pageNum, maxPagesToProcess);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageParagraphs = extractParagraphsFromPdfPage(textContent, pageNum);

    currentChapterParagraphs.push(...pageParagraphs);

    const isEndOfChapterGroup = pageNum % pagesPerChapter === 0 || pageNum === maxPagesToProcess;

    if (isEndOfChapterGroup && currentChapterParagraphs.length > 0) {
      const chapterTitle =
        pagesPerChapter === 1
          ? `第 ${pageNum} 页`
          : `第 ${currentChapterStartPage} - ${pageNum} 页`;

      chapters.push({
        id: `chap-pdf-${chapterIndex}`,
        title: chapterTitle,
        paragraphs: currentChapterParagraphs,
      });

      chapterIndex++;
      currentChapterParagraphs = [];
      currentChapterStartPage = pageNum + 1;
    }
  }

  if (chapters.length === 0) {
    throw new Error('未能在该 PDF 文件中提取到文字内容，可能是扫描图片型 PDF');
  }

  return {
    id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    author,
    format: 'pdf',
    chapters,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    fileSize: file.size,
    pageCount: numPages,
  };
}

function extractParagraphsFromPdfPage(textContent: any, pageNum: number): Paragraph[] {
  const items = textContent.items || [];
  if (items.length === 0) return [];

  const lines: string[] = [];
  let currentLine = '';
  let lastY: number | null = null;

  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;

    const y = item.transform ? Math.round(item.transform[5]) : null;

    if (lastY !== null && y !== null && Math.abs(y - lastY) > 8) {
      // New line detected
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = item.str;
    } else {
      currentLine += (currentLine.endsWith('-') ? '' : ' ') + item.str;
    }
    lastY = y;
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  // Merge lines into coherent paragraphs
  const paragraphs: Paragraph[] = [];
  let currentPara = '';
  let pIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like a header, page number, or end of sentence
    const isPageNumber = /^\d{1,4}$/.test(line);
    if (isPageNumber) continue;

    if (!currentPara) {
      currentPara = line;
    } else {
      // Check if previous line ended with period, question mark, or colon
      const endsWithPunct = /[.!?:"'\u201d]$/.test(currentPara.trim());
      const isShortLine = line.length < 30;

      if (endsWithPunct && (isShortLine || currentPara.length > 250)) {
        paragraphs.push({
          id: `p-${pageNum}-${pIndex++}`,
          original: cleanPdfText(currentPara),
        });
        currentPara = line;
      } else {
        // Hyphen continuation e.g. "connec-" + "tion"
        if (currentPara.endsWith('-')) {
          currentPara = currentPara.slice(0, -1) + line;
        } else {
          currentPara += ' ' + line;
        }
      }
    }
  }

  if (currentPara.trim()) {
    paragraphs.push({
      id: `p-${pageNum}-${pIndex++}`,
      original: cleanPdfText(currentPara),
    });
  }

  return paragraphs;
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}
