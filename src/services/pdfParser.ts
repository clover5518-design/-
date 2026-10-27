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

/**
 * Call backend OCR API to recognize text from scanned book page
 */
export async function performPageOcr(imageBase64: string): Promise<string> {
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    console.warn('OCR request error:', err);
    return '';
  }
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
  let coverUrl: string | undefined;

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

  // Guard for mobile memory
  const maxPagesToProcess = Math.min(numPages, 120);

  // First pass: inspect first 3 pages to check whether this is a scanned/image-only PDF
  let sampleTextCount = 0;
  const samplePagesToCheck = Math.min(numPages, 3);
  for (let i = 1; i <= samplePagesToCheck; i++) {
    try {
      const p = await pdfDoc.getPage(i);
      const tc = await p.getTextContent();
      const text = tc.items.map((item: any) => item.str || '').join('');
      sampleTextCount += text.replace(/\s+/g, '').length;
    } catch {
      // ignore
    }
  }

  const isScannedImagePdf = sampleTextCount < 15;

  const chapters: Chapter[] = [];

  if (isScannedImagePdf) {
    // === SCANNED / IMAGE-BASED PDF MODE ===
    // Render each page into an image canvas and extract high-resolution data URLs
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      if (onProgress) {
        onProgress(Math.round((pageNum / maxPagesToProcess) * 100), pageNum, maxPagesToProcess);
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
        const pageImgUrl = canvas.toDataURL('image/jpeg', 0.85);

        if (pageNum === 1) {
          coverUrl = pageImgUrl;
        }

        // On the first 2 pages, try quick OCR automatically if available
        let initialText = `[第 ${pageNum} 页 · 图片扫描版]`;
        if (pageNum <= 2) {
          try {
            const ocr = await performPageOcr(pageImgUrl);
            if (ocr && ocr.trim()) {
              initialText = ocr.trim();
            }
          } catch {
            // ignore
          }
        }

        chapters.push({
          id: `chap-pdf-img-${pageNum}`,
          title: `第 ${pageNum} 页 (图片扫描版)`,
          paragraphs: [
            {
              id: `p-${pageNum}-1`,
              original: initialText,
              imageUrl: pageImgUrl,
            },
          ],
        });
      }
    }
  } else {
    // === NORMAL TEXT-BASED PDF MODE ===
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
  }

  if (chapters.length === 0) {
    throw new Error('未能在该 PDF 文件中生成有效页面，请确认文件完整性。');
  }

  return {
    id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    author,
    format: 'pdf',
    coverUrl,
    isScannedPdf: isScannedImagePdf,
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
      // Check if previous line ended with period, question mark, colon, or Chinese full stop
      const endsWithPunct = /[.!?:"'\u201d。！？：”]$/.test(currentPara.trim());
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
