export interface Paragraph {
  id: string;
  original: string;
  translation?: string;
  translating?: boolean;
  imageUrl?: string;
  isOcrProcessing?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  paragraphs: Paragraph[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  format: 'pdf' | 'epub' | 'txt';
  isScannedPdf?: boolean;
  coverUrl?: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  currentParagraphIndex: number;
  createdAt: number;
  lastReadAt: number;
  fileSize?: number;
  pageCount?: number;
}

export type ReaderTheme =
  | 'sepia' // 经典羊皮纸
  | 'paper' // 纯白水墨
  | 'mint' // 柔和护眼绿
  | 'bamboo' // 幽谷青竹
  | 'mist' // 雅致雾灰
  | 'dark' // 深邃夜空
  | 'night'; // 纯黑省电

export type LayoutMode = 'bilingual' | 'original' | 'translation';
export type TtsMode = 'zh-CN' | 'en-US' | 'bilingual';
export type FontFamilyType = 'serif' | 'sans' | 'kaiti' | 'mono';
export type MarginType = 'narrow' | 'normal' | 'wide';

export interface ReadingSettings {
  theme: ReaderTheme;
  fontSize: number; // 12px to 32px
  lineHeight: number; // 1.4, 1.8, 2.2, 2.6
  fontFamily: FontFamilyType;
  layoutMode: LayoutMode;
  margin: MarginType;
  paragraphSpacing: number; // 8 to 28
  autoScroll: boolean;
}

export interface ChineseVoicePreset {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  gender: 'female' | 'male' | 'special';
  pitch: number;
  rate: number;
  lang: string;
  sampleText: string;
}

export interface TtsSettings {
  ttsMode: TtsMode;
  rate: number; // 0.7 to 2.0
  pitch: number; // 0.8 to 1.2
  voiceZh?: string;
  voiceEn?: string;
  chineseVoiceId?: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  chapterTitle: string;
  excerpt: string;
  createdAt: number;
}

export type NoteColor = 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';

export interface Note {
  id: string;
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  chapterTitle: string;
  originalText: string;
  translatedText?: string;
  noteText: string;
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  token?: string;
}

export interface ReadingProgressRecord {
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  chapterTitle: string;
  percent: number;
  updatedAt: number;
}

export interface SyncPayload {
  progressList: ReadingProgressRecord[];
  bookmarks: Bookmark[];
  notes: Note[];
  settings?: ReadingSettings;
  timestamp: number;
}

export interface DictionaryResult {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  explanation?: string;
  example?: string;
}
