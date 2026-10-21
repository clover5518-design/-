import { DictionaryResult, Paragraph } from '../types/book';
import { onDeviceTranslator } from './onDeviceTranslation';

// In-memory cache for fast repeat lookups
const translationCache = new Map<string, string>();
const dictionaryCache = new Map<string, DictionaryResult>();

export async function translateSingleText(text: string, context?: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  if (translationCache.has(clean)) {
    return translationCache.get(clean)!;
  }

  try {
    const { translation } = await onDeviceTranslator.translateText(clean);
    const result = translation || clean;
    translationCache.set(clean, result);
    return result;
  } catch (err) {
    console.warn('Translate error, trying direct fallback:', err);
    try {
      const fbRes = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(clean)}`
      );
      const fbData = await fbRes.json();
      if (Array.isArray(fbData) && Array.isArray(fbData[0])) {
        const trans = fbData[0].map((item: any) => item[0]).join('');
        translationCache.set(clean, trans);
        return trans;
      }
    } catch (fbErr) {
      console.error('All translation attempts failed:', fbErr);
    }
    return clean;
  }
}

export async function translateParagraphsBatch(
  paragraphs: Paragraph[],
  onProgress?: (completed: number, total: number) => void
): Promise<Paragraph[]> {
  const toTranslate = paragraphs.filter((p) => !p.translation);
  if (toTranslate.length === 0) return paragraphs;

  const total = toTranslate.length;
  const updatedParagraphs = [...paragraphs];
  const texts = toTranslate.map((p) => p.original);

  try {
    // Utilize Android 16 / S24 / Chromium on-device translator with batch acceleration
    const translations = await onDeviceTranslator.translateBatch(texts, onProgress);

    translations.forEach((trans, idx) => {
      const orig = toTranslate[idx];
      if (orig && trans) {
        const targetIdx = updatedParagraphs.findIndex((p) => p.id === orig.id);
        if (targetIdx !== -1) {
          updatedParagraphs[targetIdx] = {
            ...updatedParagraphs[targetIdx],
            translation: trans,
          };
          translationCache.set(orig.original, trans);
        }
      }
    });
  } catch (err) {
    console.warn('Batch translation error, fallback to individual translation:', err);
    let done = 0;
    for (const p of toTranslate) {
      const trans = await translateSingleText(p.original);
      const targetIdx = updatedParagraphs.findIndex((item) => item.id === p.id);
      if (targetIdx !== -1) {
        updatedParagraphs[targetIdx] = {
          ...updatedParagraphs[targetIdx],
          translation: trans,
        };
      }
      done++;
      if (onProgress) onProgress(done, total);
    }
  }

  return updatedParagraphs;
}

export async function lookupWord(word: string, sentence?: string): Promise<DictionaryResult> {
  const cleanWord = word.trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!cleanWord) throw new Error('Empty word');

  const cacheKey = `${cleanWord.toLowerCase()}_${sentence ? sentence.slice(0, 30) : ''}`;
  if (dictionaryCache.has(cacheKey)) {
    return dictionaryCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: cleanWord, sentence }),
    });

    if (!res.ok) throw new Error('Lookup failed');
    const data: DictionaryResult = await res.json();
    dictionaryCache.set(cacheKey, data);
    return data;
  } catch (err) {
    // Basic translation fallback
    const def = await translateSingleText(cleanWord);
    const fallbackResult: DictionaryResult = {
      word: cleanWord,
      definition: def,
      explanation: `释义: ${def}`,
      example: sentence,
    };
    dictionaryCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
