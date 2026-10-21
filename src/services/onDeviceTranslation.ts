/**
 * Service for Android 16 / Samsung Galaxy S24 / Chromium On-Device Translation.
 * Supports:
 * 1. W3C Translation API: window.translation.createTranslator(...)
 * 2. Chromium On-Device AI: window.ai.translator.create(...)
 * 3. Samsung Galaxy AI / Android System Bridge: window.AndroidBridge / window.SamsungTranslator
 * 4. High-speed cloud fallback: Gemini 3.8 Flash batch acceleration
 */

export interface OnDeviceTranslationInfo {
  isAvailable: boolean;
  engineName: string;
  source: 'android_system' | 'chromium_ondevice' | 'samsung_galaxy_ai' | 'gemini_cloud_fast';
}

class OnDeviceTranslationManager {
  private translatorInstance: any = null;
  private initPromise: Promise<boolean> | null = null;
  private engineInfo: OnDeviceTranslationInfo = {
    isAvailable: false,
    engineName: '云端 Gemini 3.8 Flash 高速并发引擎',
    source: 'gemini_cloud_fast',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectEngine();
    }
  }

  public async detectEngine(): Promise<OnDeviceTranslationInfo> {
    if (typeof window === 'undefined') return this.engineInfo;

    try {
      const win = window as any;

      // 1. Check Samsung S24 / Android System Bridge if injected
      if (win.SamsungGalaxyAI || win.SamsungTranslator || (win.AndroidBridge && win.AndroidBridge.translate)) {
        this.engineInfo = {
          isAvailable: true,
          engineName: '三星 Galaxy S24 / 安卓系统自带端侧翻译',
          source: 'samsung_galaxy_ai',
        };
        return this.engineInfo;
      }

      // 2. Check W3C Translation API (Chromium / Android 16 Webview native translation)
      if (win.translation && typeof win.translation.createTranslator === 'function') {
        const canTranslate = win.translation.canTranslate
          ? await win.translation.canTranslate({ sourceLanguage: 'en', targetLanguage: 'zh' })
          : 'readily';

        if (canTranslate !== 'no') {
          this.engineInfo = {
            isAvailable: true,
            engineName: '安卓16系统端侧硬件加速翻译 (W3C On-Device API)',
            source: 'android_system',
          };
          return this.engineInfo;
        }
      }

      // 3. Check Chromium / Gemini Nano On-Device AI Translator API
      if (win.ai && win.ai.translator && typeof win.ai.translator.create === 'function') {
        this.engineInfo = {
          isAvailable: true,
          engineName: '安卓系统内置端侧 AI 翻译引擎 (Gemini Nano)',
          source: 'chromium_ondevice',
        };
        return this.engineInfo;
      }
    } catch (e) {
      console.warn('On-device translation detection note:', e);
    }

    // Default high-performance cloud accelerated engine
    this.engineInfo = {
      isAvailable: false,
      engineName: '云端 Gemini 3.8 Flash 极速并发引擎',
      source: 'gemini_cloud_fast',
    };
    return this.engineInfo;
  }

  public async getEngineInfo(): Promise<OnDeviceTranslationInfo> {
    await this.detectEngine();
    return this.engineInfo;
  }

  private async getTranslator() {
    if (this.translatorInstance) return this.translatorInstance;
    if (this.initPromise) {
      await this.initPromise;
      return this.translatorInstance;
    }

    this.initPromise = (async () => {
      try {
        const win = window as any;
        if (win.translation && typeof win.translation.createTranslator === 'function') {
          this.translatorInstance = await win.translation.createTranslator({
            sourceLanguage: 'en',
            targetLanguage: 'zh',
          });
          return true;
        }

        if (win.ai && win.ai.translator && typeof win.ai.translator.create === 'function') {
          this.translatorInstance = await win.ai.translator.create({
            sourceLanguage: 'en',
            targetLanguage: 'zh',
          });
          return true;
        }
      } catch (err) {
        console.warn('Failed to initialize local translator:', err);
      }
      return false;
    })();

    await this.initPromise;
    return this.translatorInstance;
  }

  public async translateText(text: string): Promise<{ translation: string; source: string }> {
    const clean = text.trim();
    if (!clean) return { translation: '', source: 'empty' };

    const win = window as any;

    // 1. Try Samsung Galaxy S24 / Android System Bridge if available
    if (win.SamsungGalaxyAI && typeof win.SamsungGalaxyAI.translate === 'function') {
      try {
        const res = await win.SamsungGalaxyAI.translate(clean, 'en', 'zh');
        if (res) return { translation: res, source: 'samsung_galaxy_ai' };
      } catch (err) {
        console.warn('Samsung Galaxy AI translate error:', err);
      }
    }

    if (win.AndroidBridge && typeof win.AndroidBridge.translate === 'function') {
      try {
        const res = await win.AndroidBridge.translate(clean, 'en', 'zh');
        if (res) return { translation: res, source: 'android_system' };
      } catch (err) {
        console.warn('AndroidBridge translate error:', err);
      }
    }

    // 2. Try W3C / Android 16 On-Device Translator API
    try {
      const translator = await this.getTranslator();
      if (translator && typeof translator.translate === 'function') {
        const res = await translator.translate(clean);
        if (res && typeof res === 'string') {
          return { translation: res, source: 'android_ondevice' };
        }
      }
    } catch (err) {
      console.warn('On-device translation call failed, falling back:', err);
    }

    // 3. Ultra-fast Cloud Fallback: calls server /api/translate
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    });

    if (!response.ok) throw new Error('Translation failed');
    const data = await response.json();
    return { translation: data.translation || clean, source: data.source || 'gemini' };
  }

  public async translateBatch(
    texts: string[],
    onProgress?: (done: number, total: number) => void
  ): Promise<string[]> {
    if (texts.length === 0) return [];
    const total = texts.length;
    let completed = 0;

    // If on-device translator is active, translate locally with near-zero latency
    const translator = await this.getTranslator();
    if (translator && typeof translator.translate === 'function') {
      const results: string[] = [];
      for (const text of texts) {
        if (!text || !text.trim()) {
          results.push('');
        } else {
          try {
            const translated = await translator.translate(text);
            results.push(translated);
          } catch {
            results.push(text);
          }
        }
        completed++;
        if (onProgress) onProgress(completed, total);
      }
      return results;
    }

    // Otherwise, fast chunked cloud translation (batch of 8 items concurrently)
    const results: string[] = new Array(total).fill('');
    const batchSize = 8;

    for (let i = 0; i < texts.length; i += batchSize) {
      const chunk = texts.slice(i, i + batchSize);
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: chunk }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.translations)) {
            data.translations.forEach((t: string, idx: number) => {
              results[i + idx] = t;
            });
          }
        } else {
          // Individual fallback for this chunk
          const singleResults = await Promise.all(
            chunk.map((item) => (item.trim() ? this.translateText(item).then((r) => r.translation) : ''))
          );
          singleResults.forEach((t, idx) => {
            results[i + idx] = t;
          });
        }
      } catch {
        // Fallback
        const singleResults = await Promise.all(
          chunk.map((item) => (item.trim() ? this.translateText(item).then((r) => r.translation) : ''))
        );
        singleResults.forEach((t, idx) => {
          results[i + idx] = t;
        });
      }

      completed += chunk.length;
      if (onProgress) onProgress(Math.min(completed, total), total);
    }

    return results;
  }
}

export const onDeviceTranslator = new OnDeviceTranslationManager();
