import { DictionaryResult, Paragraph, Book } from "../types/book";
import { onDeviceTranslator } from "./onDeviceTranslation";

// In-memory cache for fast repeat lookups
const translationCache = new Map<string, string>();
const dictionaryCache = new Map<string, DictionaryResult>();

// Check if a string contains Chinese characters
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

// Check if a book or chapter content is Chinese original
export function isChineseBookContent(title?: string, paragraphs?: Paragraph[]): boolean {
  if (paragraphs && paragraphs.length > 0) {
    const sample = paragraphs.slice(0, 15).map((p) => p.original).join("");
    const chineseChars = sample.match(/[\u4e00-\u9fa5]/g) || [];
    const nonSpaceLength = sample.replace(/\s+/g, "").length || 1;
    return chineseChars.length >= 10 && (chineseChars.length / nonSpaceLength > 0.3);
  }
  if (title) {
    const titleChinese = title.match(/[\u4e00-\u9fa5]/g) || [];
    const nonSpaceLength = title.replace(/\s+/g, "").length || 1;
    return titleChinese.length >= 4 && (titleChinese.length / nonSpaceLength > 0.6);
  }
  return false;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return "";
    }
  }
  return "https://ais-dev-lymd5v6hkdzbhifx7he3lf-345030997997.asia-northeast1.run.app";
}

// Translate a single English text to Chinese with robust multi-tiered fallbacks
export async function translateSingleText(text: string, context?: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";

  // 1. In-memory cache
  if (translationCache.has(clean)) {
    const cached = translationCache.get(clean)!;
    if (containsChinese(cached) || containsChinese(clean)) {
      return cached;
    }
  }

  // 2. High-speed server translate API (/api/translate)
  const baseUrl = getApiBaseUrl();
  const apiUrls = baseUrl
    ? ["/api/translate", `${baseUrl}/api/translate`, "https://ais-dev-lymd5v6hkdzbhifx7he3lf-345030997997.asia-northeast1.run.app/api/translate"]
    : ["/api/translate"];
  const uniqueUrls = Array.from(new Set(apiUrls.filter(Boolean)));

  for (const url of uniqueUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, context }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.translation && containsChinese(data.translation)) {
          const result = data.translation.trim();
          translationCache.set(clean, result);
          return result;
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 3. Direct Google GTX API call from client (super-fast ~150ms, works in browser & APK)
  try {
    const fbRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(clean)}`
    );
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      if (Array.isArray(fbData) && Array.isArray(fbData[0])) {
        const trans = fbData[0].map((item: any) => item[0]).join("").trim();
        if (trans && containsChinese(trans)) {
          translationCache.set(clean, trans);
          return trans;
        }
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 4. On-device Android / Samsung S24 local bridge
  try {
    const { translation } = await onDeviceTranslator.translateText(clean);
    if (translation && containsChinese(translation)) {
      const result = translation.trim();
      translationCache.set(clean, result);
      return result;
    }
  } catch {
    // Continue to next fallback
  }

  // 5. MyMemory Translation API fallback
  try {
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|zh-CN`;
    const mmRes = await fetch(mmUrl);
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      const trans = mmData?.responseData?.translatedText?.trim();
      if (trans && containsChinese(trans)) {
        translationCache.set(clean, trans);
        return trans;
      }
    }
  } catch {
    // End of fallbacks
  }

  // Never return original English text! Return empty string so UI knows it is not translated
  return "";
}

/**
 * Background keep-alive utility to prevent mobile WebViews / browsers from sleeping
 * or pausing fetch requests when the user switches to other apps.
 */
export class BackgroundKeepAlive {
  private wakeLock: any = null;
  private audioContext: AudioContext | null = null;
  private isRunning: boolean = false;

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 1. Request Screen Wake Lock if available
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
      }
    } catch {
      // Non-critical if wakeLock is denied or not supported
    }

    // 2. Start silent AudioContext keep-alive so OS does not throttle background tasks
    try {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") {
            await ctx.resume().catch(() => {});
          }
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.00001; // Inaudible
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          this.audioContext = ctx;
        }
      }
    } catch {
      // Audio fallback note
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}

export interface ProgressiveTranslateOptions {
  context?: string;
  forceAll?: boolean;
  signal?: AbortSignal;
  onParagraphStart?: (paraId: string, index: number) => void;
  onParagraphDone?: (
    paraId: string,
    translation: string,
    index: number,
    doneCount: number,
    totalCount: number
  ) => void;
  onProgress?: (doneCount: number, totalCount: number) => void;
}

/**
 * High-performance Progressive Translation:
 * 1. Checks which paragraphs are already translated and skips them, enabling instant resume.
 * 2. Translates with a concurrent pipeline (concurrency 3) so whole chapters translate in seconds.
 * 3. Emits each translated paragraph immediately as it arrives so UI displays it without waiting.
 * 4. Steady progress incrementation ensures progress bar never freezes at 0.
 * 5. Keeps background execution alive when user switches to other mobile apps.
 */
export async function translateChapterProgressive(
  paragraphs: Paragraph[],
  options?: ProgressiveTranslateOptions
): Promise<Paragraph[]> {
  const forceAll = options?.forceAll ?? false;
  const keepAlive = new BackgroundKeepAlive();
  await keepAlive.start();

  try {
    const updatedParagraphs = [...paragraphs];

    const needsTranslation = (p: Paragraph) => {
      if (!p.original || !p.original.trim()) return false;
      if (forceAll) return true;
      if (!p.translation || !p.translation.trim()) return true;
      if (p.translation.trim() === p.original.trim()) return true;
      if (!containsChinese(p.translation)) return true;
      return false;
    };

    const toTranslateIndices: number[] = [];
    paragraphs.forEach((p, idx) => {
      if (needsTranslation(p)) {
        toTranslateIndices.push(idx);
      }
    });

    const totalParas = paragraphs.length;
    const totalToTranslate = toTranslateIndices.length;
    const alreadyDone = totalParas - totalToTranslate;

    // If all are already translated, notify full progress and return immediately
    if (totalToTranslate === 0) {
      options?.onProgress?.(totalParas, totalParas);
      return updatedParagraphs;
    }

    // Initial progress report
    options?.onProgress?.(alreadyDone, totalParas);

    let completedInRun = 0;
    let nextQueueIdx = 0;
    const CONCURRENCY = 4;

    async function worker() {
      while (nextQueueIdx < toTranslateIndices.length) {
        if (options?.signal?.aborted) break;
        const currentQueuePos = nextQueueIdx++;
        const idx = toTranslateIndices[currentQueuePos];
        const p = updatedParagraphs[idx];

        options?.onParagraphStart?.(p.id, idx);

        let trans = "";
        try {
          trans = await translateSingleText(p.original, options?.context);
        } catch {
          trans = "";
        }

        if (options?.signal?.aborted) break;

        completedInRun++;
        const currentDone = alreadyDone + completedInRun;

        if (trans && containsChinese(trans)) {
          const cleanTrans = trans.trim();
          updatedParagraphs[idx] = {
            ...p,
            translation: cleanTrans,
            translating: false,
          };
          options?.onParagraphDone?.(p.id, cleanTrans, idx, currentDone, totalParas);
        } else {
          updatedParagraphs[idx] = {
            ...p,
            translating: false,
          };
          options?.onParagraphDone?.(p.id, "", idx, currentDone, totalParas);
        }

        options?.onProgress?.(currentDone, totalParas);
      }
    }

    const workerCount = Math.min(CONCURRENCY, toTranslateIndices.length);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    return updatedParagraphs;
  } finally {
    keepAlive.stop();
  }
}

/**
 * Backward-compatible batch wrapper calling progressive translation
 */
export async function translateParagraphsBatch(
  paragraphs: Paragraph[],
  onProgress?: (completed: number, total: number) => void,
  forceAll: boolean = false
): Promise<Paragraph[]> {
  return translateChapterProgressive(paragraphs, {
    forceAll,
    onProgress,
  });
}

// Translate all chapters of a book with progress tracking
export async function translateBookAllChapters(
  book: Book,
  onChapterProgress?: (currentChap: number, totalChaps: number, chapTitle: string) => void,
  onParagraphProgress?: (done: number, total: number) => void
): Promise<Book> {
  const totalChaps = book.chapters.length;
  const updatedChapters = [...book.chapters];

  for (let cIdx = 0; cIdx < totalChaps; cIdx++) {
    const chap = updatedChapters[cIdx];
    if (onChapterProgress) {
      onChapterProgress(cIdx + 1, totalChaps, chap.title);
    }

    const translatedParas = await translateChapterProgressive(chap.paragraphs, {
      forceAll: false,
      onProgress: (done, total) => {
        if (onParagraphProgress) onParagraphProgress(done, total);
      },
    });

    updatedChapters[cIdx] = {
      ...chap,
      paragraphs: translatedParas,
    };
  }

  return {
    ...book,
    chapters: updatedChapters,
  };
}

export async function lookupWord(word: string, sentence?: string): Promise<DictionaryResult> {
  const cleanWord = word.trim().replace(/^[^\w]+|[^\w]+$/g, "");
  if (!cleanWord) throw new Error("Empty word");

  const cacheKey = `${cleanWord.toLowerCase()}_${sentence ? sentence.slice(0, 30) : ""}`;
  if (dictionaryCache.has(cacheKey)) {
    return dictionaryCache.get(cacheKey)!;
  }

  try {
    const res = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: cleanWord, sentence }),
    });
    if (!res.ok) throw new Error("Lookup failed");
    const data: DictionaryResult = await res.json();
    dictionaryCache.set(cacheKey, data);
    return data;
  } catch {
    const def = await translateSingleText(cleanWord);
    const fallbackResult: DictionaryResult = {
      word: cleanWord,
      definition: def || "查词暂不可用",
      explanation: `中文释义: ${def || cleanWord}`,
      example: sentence,
    };
    dictionaryCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
