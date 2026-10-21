import JSZip from 'jszip';
import { Book, Chapter, Paragraph } from '../types/book';

export async function parseEpubFile(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml to find OPF path
  const containerXmlStr = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXmlStr) {
    throw new Error('无效的 EPUB 电子书文件：未找到 META-INF/container.xml');
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXmlStr, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('无法解析 EPUB 规范描述文件 (rootfile)');
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfContent = await zip.file(opfPath)?.async('string');
  if (!opfContent) {
    throw new Error(`未找到主元数据文件：${opfPath}`);
  }

  const opfDoc = parser.parseFromString(opfContent, 'application/xml');

  // Metadata: Title, Author
  const title = opfDoc.querySelector('title')?.textContent?.trim() || file.name.replace(/\.epub$/i, '');
  const author = opfDoc.querySelector('creator')?.textContent?.trim() || '未知作者';

  // Manifest items: id -> href
  const manifestItems = new Map<string, { href: string; mediaType: string }>();
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    if (id && href) {
      manifestItems.set(id, { href, mediaType });
    }
  });

  // Extract cover image if present
  let coverUrl: string | undefined;
  let coverHref: string | null = null;

  // Search for cover in meta or manifest
  const coverMeta = opfDoc.querySelector('meta[name="cover"]');
  if (coverMeta) {
    const coverId = coverMeta.getAttribute('content');
    if (coverId && manifestItems.has(coverId)) {
      coverHref = manifestItems.get(coverId)!.href;
    }
  }

  if (!coverHref) {
    for (const [id, val] of manifestItems.entries()) {
      if (id.toLowerCase().includes('cover') && val.mediaType.startsWith('image/')) {
        coverHref = val.href;
        break;
      }
    }
  }

  if (coverHref) {
    const fullCoverPath = resolveRelativePath(opfDir, coverHref);
    const coverZipFile = zip.file(fullCoverPath);
    if (coverZipFile) {
      try {
        const coverBlob = await coverZipFile.async('blob');
        coverUrl = URL.createObjectURL(coverBlob);
      } catch (err) {
        console.warn('Failed to extract cover image:', err);
      }
    }
  }

  // Spine: ordered chapter ids
  const spineItemRefs = Array.from(opfDoc.querySelectorAll('spine > itemref'))
    .map((el) => el.getAttribute('idref'))
    .filter(Boolean) as string[];

  const chapters: Chapter[] = [];
  let chapterIndex = 1;

  for (const idref of spineItemRefs) {
    const item = manifestItems.get(idref);
    if (!item) continue;

    const chapterPath = resolveRelativePath(opfDir, item.href);
    const chapterZipFile = zip.file(chapterPath);
    if (!chapterZipFile) continue;

    try {
      const xhtml = await chapterZipFile.async('string');
      const doc = parser.parseFromString(xhtml, 'text/html');

      // Strip non-content elements
      doc.querySelectorAll('script, style, link, meta').forEach((el) => el.remove());

      // Find chapter title
      const headingEl = doc.querySelector('h1, h2, h3, title');
      let chapterTitle = headingEl?.textContent?.trim() || `第 ${chapterIndex} 章`;

      // Extract text content paragraphs
      const paragraphs: Paragraph[] = [];
      const blockElements = doc.querySelectorAll('p, div, li, blockquote, h1, h2, h3, h4');

      if (blockElements.length > 0) {
        blockElements.forEach((el) => {
          const text = cleanText(el.textContent || '');
          if (text.length > 0) {
            // Check if text is just a repeat of chapter title
            if (paragraphs.length === 0 && text === chapterTitle && text.length < 50) {
              return;
            }
            // If paragraph is extraordinarily long, split into sentences
            if (text.length > 600) {
              const subPars = splitLongParagraph(text);
              subPars.forEach((sp) => {
                paragraphs.push({
                  id: `p-${chapterIndex}-${paragraphs.length + 1}`,
                  original: sp,
                });
              });
            } else {
              paragraphs.push({
                id: `p-${chapterIndex}-${paragraphs.length + 1}`,
                original: text,
              });
            }
          }
        });
      } else {
        // Fallback: body text
        const bodyText = cleanText(doc.body?.textContent || '');
        if (bodyText) {
          const lines = bodyText.split(/\n\s*\n/);
          lines.forEach((l) => {
            const cleanL = cleanText(l);
            if (cleanL) {
              paragraphs.push({
                id: `p-${chapterIndex}-${paragraphs.length + 1}`,
                original: cleanL,
              });
            }
          });
        }
      }

      if (paragraphs.length > 0) {
        chapters.push({
          id: `chap-${chapterIndex}`,
          title: chapterTitle.length > 40 ? chapterTitle.slice(0, 37) + '...' : chapterTitle,
          paragraphs,
        });
        chapterIndex++;
      }
    } catch (e) {
      console.warn(`Error parsing chapter ${item.href}:`, e);
    }
  }

  if (chapters.length === 0) {
    throw new Error('未能在该 EPUB 文件中提取到有效章节内容');
  }

  return {
    id: 'epub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    author,
    format: 'epub',
    coverUrl,
    chapters,
    currentChapterIndex: 0,
    currentParagraphIndex: 0,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    fileSize: file.size,
  };
}

function resolveRelativePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath.slice(1);
  const parts = (baseDir + relativePath).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function splitLongParagraph(text: string): string[] {
  // Split on sentence boundaries (. ! ?) while keeping punctuation
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!matches || matches.length <= 1) return [text];

  const chunks: string[] = [];
  let current = '';

  for (const sentence of matches) {
    if ((current + ' ' + sentence).length > 400 && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}
