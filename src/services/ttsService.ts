import { Paragraph, TtsMode, TtsSettings } from '../types/book';

export interface TtsState {
  isPlaying: boolean;
  isPaused: boolean;
  currentParagraphIndex: number;
  currentPhase: 'original' | 'translation'; // In bilingual mode, whether speaking English or Chinese
  activeText: string;
}

export type TtsStateListener = (state: TtsState) => void;

class TtsEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<TtsStateListener> = new Set();

  private paragraphs: Paragraph[] = [];
  private currentIndex: number = 0;
  private currentPhase: 'original' | 'translation' = 'translation';
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private sleepTimerTimeout: any = null;

  private settings: TtsSettings = {
    ttsMode: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
  };

  private bookTitle: string = '';
  private chapterTitle: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public getChineseVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter((v) => v.lang.startsWith('zh') || v.name.toLowerCase().includes('chinese'));
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter((v) => v.lang.startsWith('en') || v.name.toLowerCase().includes('english'));
  }

  public updateSettings(newSettings: Partial<TtsSettings>) {
    this.settings = { ...this.settings, ...newSettings };
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
      if (this.currentPhase === 'original') {
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
    };
  }

  public setQueue(
    paragraphs: Paragraph[],
    startIndex: number = 0,
    meta?: { bookTitle: string; chapterTitle: string }
  ) {
    this.paragraphs = paragraphs;
    this.currentIndex = Math.max(0, Math.min(startIndex, paragraphs.length - 1));
    this.bookTitle = meta?.bookTitle || this.bookTitle;
    this.chapterTitle = meta?.chapterTitle || this.chapterTitle;
    this.currentPhase = this.settings.ttsMode === 'en-US' ? 'original' : 'translation';
    this.notify();
  }

  public play() {
    if (!this.synth || this.paragraphs.length === 0) return;

    if (this.isPaused && this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
      this.isPaused = false;
      this.notify();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.speakCurrent();
  }

  public pause() {
    if (!this.synth) return;
    this.synth.pause();
    this.isPlaying = false;
    this.isPaused = true;
    this.notify();
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.notify();
  }

  public next() {
    if (this.currentIndex < this.paragraphs.length - 1) {
      this.currentIndex++;
      this.currentPhase = this.settings.ttsMode === 'en-US' ? 'original' : 'translation';
      if (this.isPlaying) {
        this.synth?.cancel();
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  public prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentPhase = this.settings.ttsMode === 'en-US' ? 'original' : 'translation';
      if (this.isPlaying) {
        this.synth?.cancel();
        this.speakCurrent();
      } else {
        this.notify();
      }
    }
  }

  public jumpTo(index: number) {
    if (index >= 0 && index < this.paragraphs.length) {
      this.currentIndex = index;
      this.currentPhase = this.settings.ttsMode === 'en-US' ? 'original' : 'translation';
      if (this.isPlaying) {
        this.synth?.cancel();
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
    if (!this.synth || !this.isPlaying || this.currentIndex >= this.paragraphs.length) {
      this.stop();
      return;
    }

    const para = this.paragraphs[this.currentIndex];
    if (!para) {
      this.stop();
      return;
    }

    let textToSpeak = '';
    let lang = 'zh-CN';
    let voiceToUse: SpeechSynthesisVoice | undefined;

    const mode = this.settings.ttsMode;

    if (mode === 'zh-CN') {
      // Speak Chinese translation
      textToSpeak = para.translation || para.original;
      lang = 'zh-CN';
      this.currentPhase = 'translation';
      voiceToUse = this.pickVoice('zh');
    } else if (mode === 'en-US') {
      // Speak English original
      textToSpeak = para.original;
      lang = 'en-US';
      this.currentPhase = 'original';
      voiceToUse = this.pickVoice('en');
    } else {
      // Bilingual mode: alternates original -> translation
      if (this.currentPhase === 'original') {
        textToSpeak = para.original;
        lang = 'en-US';
        voiceToUse = this.pickVoice('en');
      } else {
        textToSpeak = para.translation || para.original;
        lang = 'zh-CN';
        voiceToUse = this.pickVoice('zh');
      }
    }

    if (!textToSpeak.trim()) {
      this.advanceQueue();
      return;
    }

    this.synth.cancel(); // Cancel any lingering speech

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onend = () => {
      if (!this.isPlaying) return;
      this.advanceQueue();
    };

    utterance.onerror = (e) => {
      console.warn('TTS utterance error:', e);
      if (e.error !== 'interrupted' && e.error !== 'canceled' && this.isPlaying) {
        this.advanceQueue();
      }
    };

    this.currentUtterance = utterance;
    this.notify();

    // Chrome/Android workaround for garbage collection of utterance
    (window as any).__currentUtterance = utterance;

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Failed to speak utterance:', err);
      this.stop();
    }
  }

  private advanceQueue() {
    const mode = this.settings.ttsMode;

    if (mode === 'bilingual') {
      if (this.currentPhase === 'original') {
        // Move to Chinese translation for the same paragraph
        this.currentPhase = 'translation';
        this.speakCurrent();
        return;
      } else {
        // Done with translation, move to next paragraph original
        this.currentPhase = 'original';
        this.currentIndex++;
      }
    } else {
      this.currentIndex++;
    }

    if (this.currentIndex < this.paragraphs.length) {
      this.speakCurrent();
    } else {
      // Reached the end of the chapter
      this.stop();
    }
  }

  private pickVoice(targetLang: 'zh' | 'en'): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    if (targetLang === 'zh') {
      if (this.settings.voiceZh) {
        const found = voices.find((v) => v.name === this.settings.voiceZh);
        if (found) return found;
      }
      return voices.find((v) => v.lang.startsWith('zh-CN')) ||
        voices.find((v) => v.lang.startsWith('zh')) ||
        voices[0];
    } else {
      if (this.settings.voiceEn) {
        const found = voices.find((v) => v.name === this.settings.voiceEn);
        if (found) return found;
      }
      return voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    }
  }

  private updateMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const para = this.paragraphs[this.currentIndex];
        const titleText = this.currentPhase === 'translation'
          ? (para?.translation || this.chapterTitle)
          : (para?.original || this.chapterTitle);

        navigator.mediaSession.metadata = new MediaMetadata({
          title: titleText.slice(0, 50) + (titleText.length > 50 ? '...' : ''),
          artist: this.bookTitle,
          album: this.chapterTitle,
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      } catch (err) {
        // Ignore media session errors
      }
    }
  }
}

export const ttsService = new TtsEngine();
