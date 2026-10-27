import JSZip from 'jszip';
import { Book, Chapter, Paragraph } from '../types/book';

/**
 * Robust, fault-tolerant EPUB parser supporting EPUB 2 & EPUB 3,
 * non-standard XML namespaces, URI encoding, illustrated/comic EPUBs, and Chinese/English books.
 */
export async function parseEpubFile(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml with case-insensitive search
  const containerFile = findZipEntry(zip, 'META-INF/container.xml');
  if (!containerFile) {
    // If container.xml is missing, attempt direct search for any .opf file in the archive
    const directOpfFile = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.opf'));
    if (!directOpfFile) {
      throw new Error('无效的 EPUB 电子书文件：未找到 META-INF/container.xml 或 OPF 描述文件');
    }
  }

  let opfPath = '';
  if (containerFile) {
    const containerXmlStr = await containerFile.async('string');
    // Extract rootfile full-path via DOMParser or regex
    try {
      const parser = new DOMParser();
      const containerDoc = parser.parseFromString(containerXmlStr, 'text/xml');
      const rootfileEl =
        containerDoc.getElementsByTagName('rootfile')[0] ||
        containerDoc.querySelector('rootfile');
      opfPath = rootfileEl?.getAttribute('full-path') || '';
    } catch {
      // fallback
    }

    if (!opfPath) {
      const match = containerXmlStr.match(/full-path=["']([^"']+)["']/i);
      if (match) opfPath = match[1];
    }
  }

  if (!opfPath) {
    // Search any .opf in zip
    const candidate = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.opf'));
    if (candidate) {
      opfPath = candidate;
    } else {
      throw new Error('无法在 EPUB 压缩包中定位 OPF 主元数据文件');
    }
  }

  opfPath = decodeURIComponent(opfPath.trim());
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfEntry = findZipEntry(zip, opfPath);
  if (!opfEntry) {
    throw new Error(`未能在 EPUB 中读取元数据文件：${opfPath}`);
  }

  const opfContent = await opfEntry.async('string');
  const parser = new DOMParser();
  let opfDoc: Document;
  try {
    opfDoc = parser.parseFromString(opfContent, 'application/xml');
    if (opfDoc.querySelector('parsererror')) {
      opfDoc = parser.parseFromString(opfContent, 'text/html');
    }
  } catch {
    opfDoc = parser.parseFromString(opfContent, 'text/html');
  }

  // Extract Title (Support dc:title, title, and regex)
  let title =
    opfDoc.getElementsByTagName('dc:title')[0]?.textContent?.trim() ||
    opfDoc.getElementsByTagName('title')[0]?.textContent?.trim() ||
    opfContent.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1]?.trim() ||
    file.name.replace(/\.epub$/i, '');

  // Strip XML tags if present in title
  title = title.replace(/<[^>]+>/g, '').trim();

  // Extract Author
  let author =
    opfDoc.getElementsByTagName('dc:creator')[0]?.textContent?.trim() ||
    opfDoc.getElementsByTagName('creator')[0]?.textContent?.trim() ||
    opfContent.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i)?.[1]?.trim() ||
    '未知作者';
  author = author.replace(/<[^>]+>/g, '').trim();

  // Manifest items: id -> { href, mediaType }
  const manifestItems = new Map<string, { href: string; mediaType: string }>();
  const itemElements = Array.from(opfDoc.getElementsByTagName('item'));

  if (itemElements.length > 0) {
    itemElements.forEach((el) => {
      const id = el.getAttribute('id');
      const href = el.getAttribute('href');
      const mediaType = el.getAttribute('media-type') || '';
      if (id && href) {
        manifestItems.set(id, {
          href: decodeURIComponent(href.split('#')[0]),
          mediaType: mediaType.toLowerCase(),
        });
      }
    });
  } else {
    // Regex parsing fallback for item tags
    const itemRegex = /<item\s+[^>]*?id=["']([^"']+)["'][^>]*?href=["']([^"']+)["'][^>]*?(?:media-type=["']([^"']+)["'])?[^>]*?>/gi;
    let match;
    while ((match = itemRegex.exec(opfContent)) !== null) {
      manifestItems.set(match[1], {
        href: decodeURIComponent(match[2].split('#')[0]),
        mediaType: (match[3] || '').toLowerCase(),
      });
    }
  }

  // Cover image extraction
  let coverUrl: string | undefined;
  let coverHref: string | null = null;

  const coverMeta =
    opfDoc.querySelector('meta[name="cover"]') ||
    Array.from(opfDoc.getElementsByTagName('meta')).find(
      (m) => m.getAttribute('name')?.toLowerCase() === 'cover'
    );

  if (coverMeta) {
    const coverId = coverMeta.getAttribute('content');
    if (coverId && manifestItems.has(coverId)) {
      coverHref = manifestItems.get(coverId)!.href;
    }
  }

  if (!coverHref) {
    for (const [id, val] of manifestItems.entries()) {
      if (
        (id.toLowerCase().includes('cover') || val.href.toLowerCase().includes('cover')) &&
        val.mediaType.startsWith('image/')
      ) {
        coverHref = val.href;
        break;
      }
    }
  }

  if (coverHref) {
    const fullCoverPath = resolveRelativePath(opfDir, coverHref);
    const coverZipEntry = findZipEntry(zip, fullCoverPath);
    if (coverZipEntry) {
      try {
        const coverBlob = await coverZipEntry.async('blob');
        coverUrl = URL.createObjectURL(coverBlob);
      } catch (err) {
        console.warn('Failed to extract cover image:', err);
      }
    }
  }

  // Spine: ordered chapter ids
  const spineItemRefs = Array.from(opfDoc.getElementsByTagName('itemref'))
    .map((el) => el.getAttribute('idref'))
    .filter(Boolean) as string[];

  // Fallback: If spine is empty, take all XHTML/HTML items from manifest
  let targetHrefs: string[] = [];
  if (spineItemRefs.length > 0) {
    targetHrefs = spineItemRefs
      .map((id) => manifestItems.get(id)?.href)
      .filter(Boolean) as string[];
  }

  if (targetHrefs.length === 0) {
    // Collect all html/xhtml/xml manifest items
    for (const val of manifestItems.values()) {
      if (
        val.mediaType.includes('html') ||
        val.mediaType.includes('xhtml') ||
        val.href.toLowerCase().endsWith('.html') ||
        val.href.toLowerCase().endsWith('.xhtml') ||
        val.href.toLowerCase().endsWith('.htm')
      ) {
        targetHrefs.push(val.href);
      }
    }
  }

  // Second fallback: Search zip directly for all .html/.xhtml/.htm files
  if (targetHrefs.length === 0) {
    targetHrefs = Object.keys(zip.files)
      .filter((k) => /\.(x?html?|xml)$/i.test(k) && !k.toLowerCase().includes('container.xml'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }

  const chapters: Chapter[] = [];
  let chapterIndex = 1;

  for (const rawHref of targetHrefs) {
    const chapterPath = resolveRelativePath(opfDir, rawHref);
    const chapterZipFile = findZipEntry(zip, chapterPath) || findZipEntry(zip, rawHref);
    if (!chapterZipFile) continue;

    try {
      const contentStr = await chapterZipFile.async('string');
      let doc: Document;
      try {
        doc = parser.parseFromString(contentStr, 'text/html');
      } catch {
        doc = parser.parseFromString(contentStr, 'application/xhtml+xml');
      }

      // Strip non-content elements
      doc.querySelectorAll('script, style, link, meta').forEach((el) => el.remove());

      // Find chapter title
      const headingEl = doc.querySelector('h1, h2, h3, h4, title');
      let chapterTitle = cleanText(headingEl?.textContent || '');
      if (!chapterTitle || chapterTitle.length > 50) {
        chapterTitle = `第 ${chapterIndex} 章`;
      }

      // Extract text content paragraphs
      const paragraphs: Paragraph[] = [];
      const blockElements = doc.querySelectorAll('p, div, li, blockquote, h1, h2, h3, h4, section, article');

      if (blockElements.length > 0) {
        blockElements.forEach((el) => {
          // If the element has embedded <img>, try to extract image
          const imgEl = el.querySelector('img');
          let inlineImgUrl: string | undefined;

          if (imgEl) {
            const src = imgEl.getAttribute('src');
            if (src) {
              const currentChapterDir = chapterPath.includes('/')
                ? chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1)
                : '';
              const imgResolved = resolveRelativePath(currentChapterDir, decodeURIComponent(src.split('#')[0]));
              const imgEntry = findZipEntry(zip, imgResolved);
              if (imgEntry) {
                try {
                  // We can create Blob URL or let it be handled
                  imgEntry.async('blob').then((b) => {
                    inlineImgUrl = URL.createObjectURL(b);
                  });
                } catch {
                  // ignore
                }
              }
            }
          }

          const text = cleanText(el.textContent || '');
          if (text.length > 0) {
            // Avoid duplicate if text is identical to title
            if (paragraphs.length === 0 && text === chapterTitle && text.length < 50) {
              return;
            }
            if (text.length > 600) {
              const subPars = splitLongParagraph(text);
              subPars.forEach((sp) => {
                paragraphs.push({
                  id: `p-${chapterIndex}-${paragraphs.length + 1}`,
                  original: sp,
                  imageUrl: inlineImgUrl,
                });
              });
            } else {
              paragraphs.push({
                id: `p-${chapterIndex}-${paragraphs.length + 1}`,
                original: text,
                imageUrl: inlineImgUrl,
              });
            }
          }
        });
      }

      // Fallback: body text
      if (paragraphs.length === 0) {
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
      console.warn(`Error parsing chapter ${rawHref}:`, e);
    }
  }

  // If no text chapters were found, check if it's an image/manga/comic EPUB
  if (chapters.length === 0) {
    const imageFiles = Object.keys(zip.files)
      .filter((k) => /\.(jpe?g|png|webp|gif)$/i.test(k) && !k.toLowerCase().includes('cover'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (imageFiles.length > 0) {
      let pageNum = 1;
      for (const imgPath of imageFiles) {
        const imgEntry = zip.files[imgPath];
        if (!imgEntry) continue;
        try {
          const blob = await imgEntry.async('blob');
          const imgUrl = URL.createObjectURL(blob);
          chapters.push({
            id: `chap-img-${pageNum}`,
            title: `第 ${pageNum} 页`,
            paragraphs: [
              {
                id: `p-img-${pageNum}-1`,
                original: `[第 ${pageNum} 页 · 插图/画页]`,
                imageUrl: imgUrl,
              },
            ],
          });
          pageNum++;
        } catch {
          // ignore
        }
      }
    }
  }

  if (chapters.length === 0) {
    throw new Error('未能在该 EPUB 文件中提取到有效章节或页面内容，请确认电子书是否受 DRM 保护。');
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

/**
 * Case-insensitive & slash-normalized zip entry finder
 */
function findZipEntry(zip: JSZip, targetPath: string): JSZip.JSZipObject | null {
  if (!targetPath) return null;
  const normalized = targetPath.replace(/\\/g, '/').toLowerCase();

  // 1. Exact match
  if (zip.files[targetPath]) return zip.files[targetPath];

  // 2. Case-insensitive exact match
  for (const path of Object.keys(zip.files)) {
    if (path.replace(/\\/g, '/').toLowerCase() === normalized) {
      return zip.files[path];
    }
  }

  // 3. Basename match fallback
  const targetBase = normalized.split('/').pop();
  if (targetBase) {
    for (const path of Object.keys(zip.files)) {
      if (path.replace(/\\/g, '/').toLowerCase().endsWith('/' + targetBase) || path.toLowerCase() === targetBase) {
        return zip.files[path];
      }
    }
  }

  return null;
}

function resolveRelativePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath.slice(1);
  const parts = (baseDir + relativePath).replace(/\\/g, '/').split('/');
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
  const matches = text.match(/[^.!?。！？]+[.!?。！？]+(\s+|$)|[^.!?。！？]+$/g);
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
