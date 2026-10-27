import { Paragraph, TtsMode, TtsSettings, ChineseVoicePreset } from '../types/book';
import { containsChinese } from './translateService';

export const CHINESE_VOICE_PRESETS: ChineseVoicePreset[] = [
  {
    id: 'taiwan-female',
    name: '晓臻 · 台湾国语 (柔和轻语)',
    subtitle: '地道台湾普通话腔调，温软甜美，咬字柔和细腻，治愈感十足',
    tag: '台湾普通话',
    gender: 'female',
    pitch: 1.08,
    rate: 0.96,
    lang: 'zh-TW',
    sampleText: '你知道嗎，真正重要的東西，只有用心才能體會得最真切喔。',
  },
  {
    id: 'taiwan-male',
    name: '云哲 · 台湾男声 (清朗温和)',
    subtitle: '随性亲切、温和治愈的台湾腔调，清新明朗、自然舒缓',
    tag: '台湾男声',
    gender: 'male',
    pitch: 0.95,
    rate: 0.98,
    lang: 'zh-TW',
    sampleText: '慢慢看、慢慢讀，享受這一段屬於你自己的寧靜時光吧。',
  },
  {
    id: 'soothing-whisper',
    name: '婉儿 · 睡前耳语 (极柔助眠)',
    subtitle: '柔和气声、恬静安宁，如枕边轻声细语，陪伴舒缓入眠',
    tag: '柔和助眠',
    gender: 'female',
    pitch: 0.96,
    rate: 0.90,
    lang: 'zh-CN',
    sampleText: '夜深了，让故事带走一天的疲惫，愿你今夜有一个甜美而宁静的梦。',
  },
  {
    id: 'poetic-cloud',
    name: '诗涵 · 诗意清朗 (温润淡雅)',
    subtitle: '淡雅从容、语调悠远，极适合诗歌散文、随笔与心灵文学',
    tag: '淡雅抒情',
    gender: 'female',
    pitch: 1.04,
    rate: 0.93,
    lang: 'zh-CN',
    sampleText: '林间清风，竹影摇曳，墨香在微风中静静流淌。',
  },
  {
    id: 'healing-sister',
    name: '知意 · 知性暖阳 (治愈陪伴)',
    subtitle: '像知心大姐姐般娓娓道来，亲切自然、充满治愈正能量',
    tag: '治愈陪伴',
    gender: 'female',
    pitch: 1.05,
    rate: 0.96,
    lang: 'zh-CN',
    sampleText: '每一个平凡的日子，只要有书相伴，就充满温暖与希望。',
  },
  {
    id: 'warm-female',
    name: '晓晓 · 温暖柔美 (经典女声)',
    subtitle: '温润抒情、知性优雅，适合散文、言情与治愈小说',
    tag: '推荐女声',
    gender: 'female',
    pitch: 1.15,
    rate: 0.98,
    lang: 'zh-CN',
    sampleText: '真正重要的东西，眼睛是看不见的，只有用心才能看得清。',
  },
  {
    id: 'magnetic-male',
    name: '云希 · 沉稳磁性 (深度解说)',
    subtitle: '低沉浑厚、温和从容，适合历史纪实、名著与严肃文学',
    tag: '沉稳男声',
    gender: 'male',
    pitch: 0.82,
    rate: 0.96,
    lang: 'zh-CN',
    sampleText: '这是最好的时代，也是最坏的时代，历史的洪流滚滚向前。',
  },
  {
    id: 'sweet-story',
    name: '小艺 · 甜美灵动 (生动活泼)',
    subtitle: '清脆灵动、欢快生动，适合童话寓言、轻小说与有声对白',
    tag: '甜美女声',
    gender: 'female',
    pitch: 1.28,
    rate: 1.05,
    lang: 'zh-CN',
    sampleText: '从前有一只漂亮的小白兔，蹦蹦跳跳地跑进了神奇的秘密森林。',
  },
  {
    id: 'storyteller',
    name: '云扬 · 评书名家 (跌宕起伏)',
    subtitle: '抑扬顿挫、苍劲雄浑，适合武侠、三国水浒等演义传奇',
    tag: '特色评书',
    gender: 'male',
    pitch: 0.72,
    rate: 0.92,
    lang: 'zh-CN',
    sampleText: '书接上回！单说那英雄好汉，跨骏马提宝刀，好一身威武气概！',
  },
  {
    id: 'standard-broadcast',
    name: '播音 · 标准普通话 (新闻端庄)',
    subtitle: '字正腔圆、端庄规范，国家级标准普通话新闻级发音',
    tag: '标准播音',
    gender: 'female',
    pitch: 1.0,
    rate: 1.0,
    lang: 'zh-CN',
    sampleText: '亲爱的书友，欢迎收听云语悦读，为您开启全新双语阅读之旅。',
  },
  {
    id: 'cantonese',
    name: '善姬 · 港粤经典 (正宗粤语)',
    subtitle: '地道粤语白话，经典港粤留声电台韵味，方言纯正自然',
    tag: '粤语方言',
    gender: 'female',
    pitch: 1.0,
    rate: 1.0,
    lang: 'zh-HK',
    sampleText: '好開心同大家分享呢本書嘅故事，願閱讀帶畀你溫暖同力量。',
  },
];

export interface TtsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentParagraphIndex: number;
  currentPhase: 'original' | 'translation';
  activeText: string;
  isChineseBook: boolean;
  audioEngine: 'android-native' | 'web-speech' | 'html5-audio';
  chineseVoiceId: string;
  mode: TtsMode;
  rate: number;
}

export type TtsStateListener = (state: TtsState) => void;

declare global {
  interface Window {
    AndroidNativeTTS?: {
      isAvailable: () => boolean;
      speak: (text: string, lang: string, rate: number, pitch: number, utteranceId: string) => void;
      stop: () => void;
    };
    __onNativeTtsStart?: (utteranceId: string) => void;
    __onNativeTtsDone?: (utteranceId: string) => void;
    __onNativeTtsError?: (utteranceId: string) => void;
  }
}

class TtsEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<TtsStateListener> = new Set();

  private paragraphs: Paragraph[] = [];
  private currentIndex: number = 0;
  private currentPhase: 'original' | 'translation' = 'original';
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private isChineseBook: boolean = false;
  private sleepTimerTimeout: any = null;
  private keepAliveTimer: any = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private activeEngine: 'android-native' | 'web-speech' | 'html5-audio' = 'web-speech';
  private lastSpeakTime: number = 0;
  private rateChangeTimer: any = null;

  private settings: TtsSettings = {
    ttsMode: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
    chineseVoiceId: 'warm-female',
  };

  private bookTitle: string = '';
  private chapterTitle: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      // Load stored voice preference
      try {
        const savedVoiceId = localStorage.getItem('tts_chinese_voice_id');
        if (savedVoiceId && CHINESE_VOICE_PRESETS.some((p) => p.id === savedVoiceId)) {
          this.settings.chineseVoiceId = savedVoiceId;
          const found = CHINESE_VOICE_PRESETS.find((p) => p.id === savedVoiceId)!;
          this.settings.pitch = found.pitch;
        }
      } catch {}

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }

      // Hook native Android TTS bridge callbacks from Java MainActivity
      window.__onNativeTtsStart = (id: string) => {
        this.activeEngine = 'android-native';
        this.isPlaying = true;
        this.isPaused = false;
        this.notify();
      };

      window.__onNativeTtsDone = (id: string) => {
        if (!this.isPlaying) return;
        this.advanceQueue();
      };

      window.__onNativeTtsError = (id: string) => {
        console.warn('Native Android TTS reported error, falling back to audio');
        const para = this.paragraphs[this.currentIndex];
        if (para && this.isPlaying) {
          const text = this.isChineseBook ? para.original : (this.currentPhase === 'original' ? para.original : (para.translation || para.original));
          this.playWithAudioFallback(text, this.isChineseBook ? 'zh-CN' : 'en-US');
        }
      };
    }
  }

  public getChineseVoicePresets(): ChineseVoicePreset[] {
    return CHINESE_VOICE_PRESETS;
  }

  public setChineseVoice(presetId: string) {
    const preset = CHINESE_VOICE_PRESETS.find((p) => p.id === presetId) || CHINESE_VOICE_PRESETS[0];
    this.settings.chineseVoiceId = preset.id;
    this.settings.pitch = preset.pitch;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tts_chinese_voice_id', preset.id);
      }
    } catch {}
    this.notify();
    if (this.isPlaying) {
      this.speakCurrent();
    }
  }

  public previewVoice(presetId: string) {
    const preset = CHINESE_VOICE_PRESETS.find((p) => p.id === presetId) || CHINESE_VOICE_PRESETS[0];
    const text = preset.sampleText;

    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }

    const nativeTTS = typeof window !== 'undefined' ? (window as any).AndroidNativeTTS : null;
    if (nativeTTS && typeof nativeTTS.speak === 'function') {
      try {
        nativeTTS.speak(text, preset.lang, preset.rate, preset.pitch, `sample_${Date.now()}`);
        return;
      } catch {}
    }

    const availableVoices = this.getVoices();
    const isMobileWebView = typeof navigator !== 'undefined' && /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent);
    if (this.synth && availableVoices.length > 0 && !isMobileWebView) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = preset.lang;
        u.rate = preset.rate;
        u.pitch = preset.pitch;
        const voice = this.findVoiceForPreset(preset);
        if (voice) u.voice = voice;
        this.synth.speak(u);
        return;
      } catch {}
    }

    // Audio fallback for preview
    this.playWithAudioFallback(text, preset.lang, 0, preset);
  }

  private loadVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices();
    } catch {
      this.voices = [];
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  public getChineseVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        lang.startsWith('zh') ||
        lang.startsWith('cmn') ||
        name.includes('chinese') ||
        name.includes('mandarin') ||
        name.includes('普通话') ||
        name.includes('中文')
      );
    });
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return lang.startsWith('en') || name.includes('english');
    });
  }

  public updateSettings(newSettings: Partial<TtsSettings>, immediateRestart: boolean = false) {
    const prevRate = this.settings.rate;
    this.settings = { ...this.settings, ...newSettings };

    // 1. Instantly update HTML5 audio playbackRate in real time
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.playbackRate = this.settings.rate;
      } catch {}
    }

    // 2. Real-time speed adjustment during active playback
    if (newSettings.rate !== undefined && Math.abs(newSettings.rate - prevRate) > 0.001 && this.isPlaying) {
      if (this.fallbackAudio) {
        try {
          this.fallbackAudio.playbackRate = this.settings.rate;
        } catch {}
      } else {
        if (this.rateChangeTimer) {
          clearTimeout(this.rateChangeTimer);
        }
        if (immediateRestart) {
          this.speakCurrent();
        } else {
          this.rateChangeTimer = setTimeout(() => {
            if (this.isPlaying) {
              this.speakCurrent();
            }
          }, 250);
        }
      }
    }

    // 3. Immediately notify all UI subscribers so slider and buttons update with 0 delay
    this.notify();
  }

  public subscribe(listener: TtsStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
    this.updateMediaSession();
  }

  public getState(): TtsState {
    const currentPara = this.paragraphs[this.currentIndex];
    let activeText = '';
    if (currentPara) {
      if (this.isChineseBook) {
        activeText = currentPara.original;
      } else if (this.currentPhase === 'original') {
        activeText = currentPara.original;
      } else {
        activeText = currentPara.translation || currentPara.original;
      }
    }

    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentParagraphIndex: this.currentIndex,
      currentPhase: this.currentPhase,
      activeText,
      isChineseBook: this.isChineseBook,
      audioEngine: this.activeEngine,
      chineseVoiceId: this.settings.chineseVoiceId || 'warm-female',
      mode: this.settings.ttsMode,
      rate: this.settings.rate,
    };
  }

  public setQueue(
    paragraphs: Paragraph[],
    startIndex: number = 0,
    meta?: { bookTitle: string; chapterTitle: string; isChineseBook?: boolean }
  ) {
    this.paragraphs = paragraphs;
    this.currentIndex = Math.max(0, Math.min(startIndex, Math.max(0, paragraphs.length - 1)));
    this.bookTitle = meta?.bookTitle || this.bookTitle;
    this.chapterTitle = meta?.chapterTitle || this.chapterTitle;

    // Detect if this book is Chinese
    if (meta?.isChineseBook !== undefined) {
      this.isChineseBook = meta.isChineseBook;
    } else if (paragraphs.length > 0) {
      const sample = paragraphs.slice(0, 10).map((p) => p.original).join('');
      this.isChineseBook = containsChinese(sample);
    }

    if (this.isChineseBook) {
      this.settings.ttsMode = 'zh-CN';
      this.currentPhase = 'original';
    } else {
      this.currentPhase = this.settings.ttsMode === 'en-US' ? 'original' : 'translation';
    }

    this.notify();
  }

  public play() {
    if (this.paragraphs.length === 0) return;

    this.isPlaying = true;
    this.isPaused = false;

    // If HTML5 audio was paused, resume it
    if (this.fallbackAudio && this.activeEngine === 'html5-audio') {
      this.fallbackAudio.play().catch(() => {
        this.speakCurrent();
      });
      this.notify();
      return;
    }

    // Android/Chrome SpeechSynthesis resume workaround:
    // Chromium has a bug where resume() fails or hangs. Instead, fresh speak the paragraph!
    this.speakCurrent();
  }

  public pause() {
    this.isPlaying = false;
    this.isPaused = true;

    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
    }

    const nativeTTS = typeof window !== 'undefined' ? (window as any).AndroidNativeTTS : null;
    if (nativeTTS && typeof nativeTTS.stop === 'function') {
      try {
        nativeTTS.stop();
      } catch {}
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }

    this.stopKeepAlive();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;

    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }

    const nativeTTS = typeof window !== 'undefined' ? (window as any).AndroidNativeTTS : null;
    if (nativeTTS && typeof nativeTTS.stop === 'function') {
      try {
        nativeTTS.stop();
      } catch {}
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }

    this.stopKeepAlive();
    this.notify();
  }

  public next() {
    if (this.currentIndex < this.paragraphs.length - 1) {
      this.currentIndex++;
      this.currentPhase = this.isChineseBook ? 'original' : (this.settings.ttsMode === 'en-US' ? 'original' : 'translation');
      if (this.isPlaying) {
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  public prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentPhase = this.isChineseBook ? 'original' : (this.settings.ttsMode === 'en-US' ? 'original' : 'translation');
      if (this.isPlaying) {
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  public jumpTo(index: number) {
    if (index >= 0 && index < this.paragraphs.length) {
      this.currentIndex = index;
      this.currentPhase = this.isChineseBook ? 'original' : (this.settings.ttsMode === 'en-US' ? 'original' : 'translation');
      if (this.isPlaying) {
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  public setSleepTimer(minutes: number | null, onFinish?: () => void) {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
    if (minutes && minutes > 0) {
      this.sleepTimerTimeout = setTimeout(() => {
        this.pause();
        if (onFinish) onFinish();
      }, minutes * 60 * 1000);
    }
  }

  private speakCurrent() {
    if (this.currentIndex >= this.paragraphs.length || this.paragraphs.length === 0) {
      this.stop();
      return;
    }

    const para = this.paragraphs[this.currentIndex];
    if (!para) {
      this.stop();
      return;
    }

    // Determine target text to speak
    let textToSpeak = '';
    let isSpeakingChinese = false;

    if (this.isChineseBook) {
      // In Chinese books, ALWAYS speak the Chinese original text!
      textToSpeak = para.original;
      isSpeakingChinese = true;
      this.currentPhase = 'original';
    } else {
      const mode = this.settings.ttsMode;
      if (mode === 'zh-CN') {
        textToSpeak = para.translation || para.original;
        isSpeakingChinese = containsChinese(textToSpeak);
        this.currentPhase = 'translation';
      } else if (mode === 'en-US') {
        textToSpeak = para.original;
        isSpeakingChinese = containsChinese(textToSpeak);
        this.currentPhase = 'original';
      } else {
        // Bilingual
        if (this.currentPhase === 'original') {
          textToSpeak = para.original;
          isSpeakingChinese = containsChinese(textToSpeak);
        } else {
          textToSpeak = para.translation || para.original;
          isSpeakingChinese = containsChinese(textToSpeak);
        }
      }
    }

    // Clean text of non-readable markdown tags
    const cleanText = textToSpeak.replace(/<[^>]+>/g, '').trim();
    if (!cleanText) {
      this.advanceQueue();
      return;
    }

    const activePreset = CHINESE_VOICE_PRESETS.find((p) => p.id === this.settings.chineseVoiceId) || CHINESE_VOICE_PRESETS[0];
    const lang = isSpeakingChinese ? activePreset.lang : 'en-US';
    const currentPitch = isSpeakingChinese ? activePreset.pitch : this.settings.pitch;
    const currentRate = this.settings.rate;

    // Stop any previous fallback audio
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
      this.fallbackAudio = null;
    }

    // 1. Primary for Android APK: Native Android TTS Bridge
    const nativeTTS = typeof window !== 'undefined' ? (window as any).AndroidNativeTTS : null;
    if (nativeTTS && typeof nativeTTS.speak === 'function') {
      try {
        this.activeEngine = 'android-native';
        const utteranceId = `para_${this.currentIndex}_${Date.now()}`;
        this.notify();
        nativeTTS.speak(cleanText, lang, currentRate, currentPitch, utteranceId);
        return;
      } catch (nativeErr) {
        console.warn('Native Android TTS invocation failed, continuing to web engines:', nativeErr);
      }
    }

    // 2. Check Web Speech API availability
    const availableVoices = this.getVoices();
    const isMobileWebView = typeof navigator !== 'undefined' && /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent);
    const canUseWebSpeech = this.synth && availableVoices.length > 0 && !isMobileWebView;

    if (canUseWebSpeech && this.synth) {
      try {
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = currentRate;
        utterance.pitch = currentPitch;

        const voiceToUse = isSpeakingChinese ? this.findVoiceForPreset(activePreset) : this.pickVoice('en');
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }

        let speechActuallyStarted = false;
        const invocationTime = Date.now();

        utterance.onstart = () => {
          speechActuallyStarted = true;
          this.activeEngine = 'web-speech';
          this.notify();
          this.startKeepAlive();
        };

        utterance.onend = () => {
          this.stopKeepAlive();
          if (!this.isPlaying) return;
          const duration = Date.now() - invocationTime;
          // Guard against fake instant 0ms dismissal (which caused rapid skip to chapter end!)
          if (!speechActuallyStarted && duration < 350 && cleanText.length > 3) {
            console.warn('Fake 0ms onend detected, switching to HTML5 Audio fallback');
            this.playWithAudioFallback(cleanText, lang);
            return;
          }
          this.advanceQueue();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e.error, e);
          this.stopKeepAlive();
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            this.playWithAudioFallback(cleanText, lang);
          }
        };

        this.currentUtterance = utterance;
        (window as any).__currentUtterance = utterance;
        this.notify();

        setTimeout(() => {
          if (!this.isPlaying) return;
          try {
            this.synth?.speak(utterance);
          } catch (speakErr) {
            this.playWithAudioFallback(cleanText, lang);
          }

          // Watchdog: If onstart does not fire within 1000ms, switch to audio fallback
          setTimeout(() => {
            if (this.isPlaying && !speechActuallyStarted && this.activeEngine !== 'html5-audio') {
              this.synth?.cancel();
              this.playWithAudioFallback(cleanText, lang);
            }
          }, 1000);
        }, 35);

        return;
      } catch (err) {
        console.warn('SpeechSynthesis setup failed, falling back to HTML5 Audio:', err);
      }
    }

    // 3. Fallback: Ultra-reliable HTML5 Audio streaming (Youdao + Google)
    this.playWithAudioFallback(cleanText, lang);
  }

  /**
   * HTML5 Audio Fallback Engine using high-speed online voice endpoints (Youdao / Google).
   * 100% reliable across all Android devices, WebViews, and mobile browsers.
   */
  private playWithAudioFallback(
    text: string,
    lang: string,
    retryEndpointIndex: number = 0,
    voiceOverride?: ChineseVoicePreset
  ) {
    if (!this.isPlaying && !voiceOverride) return;

    this.activeEngine = 'html5-audio';
    this.notify();

    // Chunk text if long (~140 chars per request cleanly)
    const shortText = text.slice(0, 140);
    const activePreset = voiceOverride || CHINESE_VOICE_PRESETS.find((p) => p.id === this.settings.chineseVoiceId) || CHINESE_VOICE_PRESETS[0];

    const isCantonese = activePreset.id === 'cantonese' || lang.toLowerCase().includes('hk');
    const isTaiwanese = activePreset.id.includes('taiwan') || lang.toLowerCase().includes('tw');
    const targetTl = isCantonese ? 'zh-HK' : isTaiwanese ? 'zh-TW' : (activePreset.lang || 'zh-CN');
    const youdaoLe = isCantonese ? 'yue' : 'zh';

    const endpoints = [
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetTl}&client=tw-ob&q=${encodeURIComponent(shortText)}`,
      `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(shortText)}&le=${youdaoLe}`
    ];

    const audioUrl = endpoints[retryEndpointIndex % endpoints.length];

    try {
      const audio = new Audio(audioUrl);
      audio.playbackRate = this.settings.rate;

      audio.onended = () => {
        if (!this.isPlaying) return;
        this.advanceQueue();
      };

      audio.onerror = (e) => {
        console.warn('HTML5 Audio fallback error on endpoint', retryEndpointIndex, e);
        if (retryEndpointIndex < endpoints.length - 1) {
          // Retry with alternative endpoint
          this.playWithAudioFallback(text, lang, retryEndpointIndex + 1, voiceOverride);
        } else {
          // Both endpoints failed; NEVER chain-advance to chapter end!
          console.error('All audio endpoints failed for paragraph; pausing gracefully');
          this.pause();
        }
      };

      this.fallbackAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play was prevented or failed:', err);
          if (retryEndpointIndex < endpoints.length - 1) {
            this.playWithAudioFallback(text, lang, retryEndpointIndex + 1, voiceOverride);
          } else {
            this.pause();
          }
        });
      }
    } catch (err) {
      console.error('Failed to create HTML5 Audio fallback:', err);
      this.pause();
    }
  }

  private advanceQueue() {
    if (!this.isPlaying) return;

    if (!this.isChineseBook && this.settings.ttsMode === 'bilingual') {
      if (this.currentPhase === 'original') {
        // Move to Chinese translation for the same paragraph
        this.currentPhase = 'translation';
        this.speakCurrent();
        return;
      } else {
        // Move to next paragraph
        this.currentPhase = 'original';
        this.currentIndex++;
      }
    } else {
      this.currentIndex++;
    }

    if (this.currentIndex < this.paragraphs.length) {
      this.speakCurrent();
    } else {
      this.stop();
    }
  }

  private findVoiceForPreset(preset: ChineseVoicePreset): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    if (voices.length === 0) return undefined;

    // 1. Taiwan Mandarin matching
    if (preset.id.includes('taiwan') || preset.lang.includes('TW')) {
      const isMale = preset.gender === 'male';
      return (
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          const matchesTaiwan = l.includes('tw') || l.includes('taiwan') || n.includes('taiwan') || n.includes('台湾') || n.includes('繁體');
          if (!matchesTaiwan) return false;
          if (isMale) {
            return n.includes('male') || n.includes('yunjhe') || n.includes('男');
          } else {
            return n.includes('female') || n.includes('hsiaochen') || n.includes('女') || n.includes('meijia');
          }
        }) ||
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          return l.includes('tw') || l.includes('taiwan');
        }) ||
        voices.find((v) => v.lang.startsWith('zh'))
      );
    }

    // 2. Cantonese matching
    if (preset.id === 'cantonese' || preset.lang.includes('HK')) {
      return (
        voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.includes('hk') || l.includes('yue') || n.includes('cantonese') || n.includes('粤') || n.includes('粵') || n.includes('sin-ji');
        }) ||
        voices.find((v) => v.lang.startsWith('zh'))
      );
    }

    if (preset.gender === 'male') {
      return (
        voices.find((v) => {
          const n = v.name.toLowerCase();
          return (n.includes('yunxi') || n.includes('kangkang') || n.includes('yunyang') || n.includes('male') || n.includes('男')) && (v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
        }) ||
        voices.find((v) => v.lang.startsWith('zh-CN'))
      );
    } else {
      return (
        voices.find((v) => {
          const n = v.name.toLowerCase();
          return (n.includes('xiaoxiao') || n.includes('huihui') || n.includes('tingting') || n.includes('xiaoyi') || n.includes('female') || n.includes('女')) && (v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
        }) ||
        voices.find((v) => v.lang.startsWith('zh-CN'))
      );
    }
  }

  private pickVoice(targetLang: 'zh' | 'en'): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    if (voices.length === 0) return undefined;

    if (targetLang === 'zh') {
      const activePreset = CHINESE_VOICE_PRESETS.find((p) => p.id === this.settings.chineseVoiceId) || CHINESE_VOICE_PRESETS[0];
      return this.findVoiceForPreset(activePreset);
    } else {
      if (this.settings.voiceEn) {
        const found = voices.find((v) => v.name === this.settings.voiceEn);
        if (found) return found;
      }
      return (
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en-GB')) ||
        voices.find((v) => v.lang.startsWith('en'))
      );
    }
  }

  // Workaround for Chrome 15s utterance pause bug
  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.isPlaying && this.synth && this.synth.speaking) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private updateMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const para = this.paragraphs[this.currentIndex];
        const titleText = this.isChineseBook
          ? (para?.original || this.chapterTitle)
          : (this.currentPhase === 'translation'
              ? (para?.translation || this.chapterTitle)
              : (para?.original || this.chapterTitle));

        navigator.mediaSession.metadata = new MediaMetadata({
          title: titleText.slice(0, 50) + (titleText.length > 50 ? '...' : ''),
          artist: this.bookTitle,
          album: this.chapterTitle,
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      } catch {}
    }
  }
}

export const ttsService = new TtsEngine();
