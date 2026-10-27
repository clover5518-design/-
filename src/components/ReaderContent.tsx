import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  Bookmark as BookmarkIcon,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Languages,
  Check,
  Plus,
} from 'lucide-react';
import { Bookmark, Note, Paragraph, ReadingSettings } from '../types/book';

interface ReaderContentProps {
  paragraphs: Paragraph[];
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  settings: ReadingSettings;
  activeParagraphIndex: number;
  isPlaying: boolean;
  bookmarks: Bookmark[];
  notes: Note[];
  bookId: string;
  onPlayFromParagraph: (index: number) => void;
  onToggleBookmark: (index: number, excerpt: string) => void;
  onAddNote: (index: number, paragraph: Paragraph) => void;
  onTranslateParagraph: (index: number) => void;
  onLookupWord: (word: string, sentence: string) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  isChineseBook?: boolean;
  onTranslateChapter?: () => void;
  isTranslatingChapter?: boolean;
  translateProgress?: { done: number; total: number } | null;
  onOcrParagraph?: (index: number) => void;
}

export const ReaderContent: React.FC<ReaderContentProps> = ({
  paragraphs,
  chapterTitle,
  chapterIndex,
  totalChapters,
  settings,
  activeParagraphIndex,
  isPlaying,
  bookmarks,
  notes,
  bookId,
  isChineseBook: propIsChineseBook,
  onTranslateChapter,
  isTranslatingChapter,
  translateProgress,
  onOcrParagraph,
  onPlayFromParagraph,
  onToggleBookmark,
  onAddNote,
  onTranslateParagraph,
  onLookupWord,
  onPrevChapter,
  onNextChapter,
}) => {
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentTopRef = useRef<HTMLDivElement>(null);
  const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(null);

  // Automatically scroll to the top of the new chapter whenever chapterIndex changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (contentTopRef.current) {
      contentTopRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [chapterIndex]);

  // Automatically detect if current chapter / book is Chinese
  const isBookChinese = React.useMemo(() => {
    if (propIsChineseBook !== undefined) return propIsChineseBook;
    if (paragraphs.length === 0) return false;
    const sample = paragraphs.slice(0, 15).map((p) => p.original).join('');
    const chineseChars = sample.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseChars.length >= 10 && (chineseChars.length / (sample.replace(/\s+/g, '').length || 1) > 0.3);
  }, [paragraphs, propIsChineseBook]);

  // Helper to test if an individual paragraph is Chinese
  const isParagraphChinese = (text: string) => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseChars.length >= 10 && (chineseChars.length / (text.replace(/\s+/g, '').length || 1) > 0.3);
  };

  // Auto-scroll to active speaking paragraph smoothly
  useEffect(() => {
    if (isPlaying && activeParagraphIndex >= 0 && paragraphRefs.current[activeParagraphIndex]) {
      paragraphRefs.current[activeParagraphIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeParagraphIndex, isPlaying]);

  const handlePrevChapter = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    onPrevChapter();
  };

  const handleNextChapter = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    onNextChapter();
  };

  // Handle word double click or selection
  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, sentence: string) => {
    const target = e.target as HTMLElement;
    const text = target.innerText || target.textContent || '';
    const clean = text.replace(/^[^\w]+|[^\w]+$/g, '');
    if (clean && clean.length >= 2 && /^[a-zA-Z]+$/.test(clean)) {
      onLookupWord(clean, sentence);
    }
  };

  // Helper to split paragraph text into clickable words for the English original
  const renderInteractiveEnglish = (text: string) => {
    // Split preserving spaces and punctuation
    const tokens = text.split(/(\s+|[.,!?:;"'()—]+)/);
    return (
      <span>
        {tokens.map((token, i) => {
          const isWord = /^[a-zA-Z]+$/.test(token);
          if (isWord) {
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordClick(e, text);
                }}
                className="hover:underline hover:decoration-amber-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer rounded-xs transition-colors"
                title="点击查询词义与发音"
              >
                {token}
              </span>
            );
          }
          return <span key={i}>{token}</span>;
        })}
      </span>
    );
  };

  // Margin styling
  const marginClasses =
    settings.margin === 'narrow'
      ? 'px-3 sm:px-6'
      : settings.margin === 'wide'
      ? 'px-7 sm:px-14'
      : 'px-5 sm:px-10';

  // Font family class
  const fontClass =
    settings.fontFamily === 'serif'
      ? 'font-read-serif'
      : settings.fontFamily === 'kaiti'
      ? 'font-read-kaiti'
      : settings.fontFamily === 'mono'
      ? 'font-read-mono'
      : 'font-read-sans';

  return (
    <main
      className={`min-h-screen pb-40 pt-6 transition-colors duration-200 theme-${settings.theme} ${fontClass}`}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
      }}
    >
      <div className={`max-w-3xl mx-auto ${marginClasses} space-y-8`}>
        {/* Top Anchor for instant scroll to beginning of chapter */}
        <div ref={contentTopRef} className="h-0 w-0 -mt-6" />

        {/* Chapter Title Heading */}
        <header className="pt-2 pb-6 border-b border-current/15 text-center space-y-2">
          <div className="text-xs uppercase tracking-widest opacity-60 font-mono">
            Chapter {chapterIndex + 1} of {totalChapters}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            {chapterTitle}
          </h1>
          <div className="w-12 h-1 bg-amber-500/50 mx-auto rounded-full mt-3" />
        </header>

        {/* Whole-Chapter Rapid Translation Action Card (for foreign / English books) */}
        {!isBookChinese && onTranslateChapter && (
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="font-semibold text-stone-100 text-sm flex items-center gap-1.5">
                    <span>整章极速翻译</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-normal">
                      安卓16 / 三星S24 系统端侧加速
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-stone-400">
                  {(() => {
                    const translatedCount = paragraphs.filter((p) => Boolean(p.translation && /[\u4e00-\u9fa5]/.test(p.translation))).length;
                    if (translatedCount === paragraphs.length) {
                      return `✅ 本章全部 ${paragraphs.length} 段已完成中文翻译，已自动保存入库。再次翻看无需重新翻译。`;
                    }
                    if (translatedCount > 0) {
                      return `本章共 ${paragraphs.length} 段英文，已翻译 ${translatedCount} 段，剩余 ${paragraphs.length - translatedCount} 段。点击继续从未完成处翻译（支持切后台不中断）。`;
                    }
                    return `本章共 ${paragraphs.length} 段英文。点击一键开始翻译，逐段实时显示译文并自动保存。`;
                  })()}
                </p>
              </div>

              <button
                onClick={onTranslateChapter}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shrink-0 cursor-pointer ${
                  isTranslatingChapter
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20 active:scale-95'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20 active:scale-95'
                }`}
                title={isTranslatingChapter ? "点击暂停翻译（已完成部分全部自动保存）" : "整章极速翻译"}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isTranslatingChapter ? 'animate-spin text-white' : ''}`} />
                <span>
                  {(() => {
                    const translatedCount = paragraphs.filter((p) => Boolean(p.translation && /[\u4e00-\u9fa5]/.test(p.translation))).length;
                    if (isTranslatingChapter) {
                      return translateProgress
                        ? `⏸ 暂停翻译 (${translateProgress.done}/${translateProgress.total} 段)`
                        : '⏸ 暂停翻译';
                    }
                    if (translatedCount === paragraphs.length) {
                      return '重新刷新整章翻译';
                    }
                    if (translatedCount > 0) {
                      return `⚡ 继续翻译未完成部分 (${translatedCount}/${paragraphs.length} 已翻)`;
                    }
                    return '⚡ 一键翻译整章 (逐段实时呈现)';
                  })()}
                </span>
              </button>
            </div>

            {/* Translation Progress Bar if active or finished */}
            {translateProgress && (
              <div className="space-y-1.5 pt-2 border-t border-stone-800 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-amber-300 font-mono">
                  <span>
                    {isTranslatingChapter ? '⚡ 正在极速翻译整章为纯正中文...' : '✅ 翻译完成！已全部更新为流畅中文'}
                  </span>
                  <span>
                    {translateProgress.done} / {translateProgress.total} 段 (
                    {Math.round((translateProgress.done / (translateProgress.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 shadow-sm shadow-amber-500/50"
                    style={{
                      width: `${Math.round((translateProgress.done / (translateProgress.total || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paragraphs List */}
        <div className="space-y-6">
          {paragraphs.map((p, index) => {
            const isActive = isPlaying && activeParagraphIndex === index;
            const isSelected = selectedParaIndex === index;
            const isBookmarked = bookmarks.some(
              (b) => b.bookId === bookId && b.chapterIndex === chapterIndex && b.paragraphIndex === index
            );
            const paraNotes = notes.filter(
              (n) => n.bookId === bookId && n.chapterIndex === chapterIndex && n.paragraphIndex === index
            );

            return (
              <div
                key={p.id || index}
                ref={(el) => {
                  paragraphRefs.current[index] = el;
                }}
                onClick={() => setSelectedParaIndex(isSelected ? null : index)}
                className={`relative rounded-2xl p-3 sm:p-4 transition-all duration-200 group border ${
                  isActive
                    ? 'border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : isSelected
                    ? 'border-amber-400/50 bg-current/5 shadow-md'
                    : 'border-transparent hover:border-current/10 hover:bg-current/5'
                }`}
              >
                {/* Ribbon if Bookmarked */}
                {isBookmarked && (
                  <div
                    className="absolute -top-2 right-4 bg-amber-500 text-stone-950 p-1 rounded-b-md shadow-md"
                    title="此段已加入书签"
                  >
                    <BookmarkIcon className="w-3.5 h-3.5 fill-stone-950" />
                  </div>
                )}

                {/* Scanned PDF page image or illustration */}
                {p.imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-stone-800/80 bg-stone-900/60 shadow-lg relative group/img">
                    <img
                      src={p.imageUrl}
                      alt={p.original || `第 ${index + 1} 页`}
                      className="max-h-[680px] w-full object-contain mx-auto select-none"
                      loading="lazy"
                    />
                    <div className="p-2.5 bg-stone-950/80 backdrop-blur border-t border-stone-800/60 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>高清扫描书页原图</span>
                      </span>
                      {onOcrParagraph && (!p.original || p.original.startsWith('[第')) && (
                        <button
                          disabled={p.isOcrProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOcrParagraph(index);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${p.isOcrProcessing ? 'animate-spin' : ''}`} />
                          <span>{p.isOcrProcessing ? '正在智能识别文字...' : '⚡ 提取此页文字 (OCR)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Book Original Content */}
                <div className="relative">
                  <p className="select-text leading-relaxed tracking-normal">
                    {isBookChinese || isParagraphChinese(p.original)
                      ? p.original
                      : renderInteractiveEnglish(p.original)}
                  </p>
                </div>

                {/* Chinese Translation (Only rendered for non-Chinese/English original books) */}
                {!isBookChinese && !isParagraphChinese(p.original) && settings.layoutMode !== 'original' && (
                  <div
                    className={`mt-2.5 pt-2.5 transition-opacity ${
                      settings.layoutMode === 'bilingual'
                        ? 'border-t border-current/15 opacity-90'
                        : ''
                    }`}
                  >
                    {p.translation ? (
                      <p className="font-sans leading-relaxed text-[0.96em]">
                        {p.translation}
                      </p>
                    ) : p.translating ? (
                      <div className="flex items-center gap-2 text-xs text-amber-500 animate-pulse font-sans">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>正在进行高质量 AI 翻译...</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTranslateParagraph(index);
                        }}
                        className="text-xs text-amber-500 hover:text-amber-400 font-sans flex items-center gap-1 opacity-70 hover:opacity-100 transition py-1"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>点击翻译此段</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Notes badges if any */}
                {paraNotes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-current/10">
                    {paraNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNote(index, p);
                        }}
                        className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/25 transition"
                        title={note.noteText}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{note.noteText}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Floating quick actions on selection or active */}
                {(isSelected || isActive) && (
                  <div
                    className="mt-3 pt-3 border-t border-current/15 flex flex-wrap items-center justify-between gap-2 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      {/* Play from this sentence */}
                      <button
                        onClick={() => onPlayFromParagraph(index)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-medium flex items-center gap-1 hover:bg-amber-400 transition shadow-sm active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>从此段朗读</span>
                      </button>

                      {/* Bookmark toggle */}
                      <button
                        onClick={() => onToggleBookmark(index, p.original)}
                        className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition ${
                          isBookmarked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                            : 'border-current/20 hover:bg-current/10'
                        }`}
                      >
                        <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        <span>{isBookmarked ? '已收藏' : '书签'}</span>
                      </button>

                      {/* Add Note */}
                      <button
                        onClick={() => onAddNote(index, p)}
                        className="px-2.5 py-1.5 rounded-xl border border-current/20 hover:bg-current/10 flex items-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>写笔记</span>
                      </button>
                    </div>

                    {/* Single Translate (only shown for foreign/English text) */}
                    {!isBookChinese && !isParagraphChinese(p.original) && !p.translation && (
                      <button
                        onClick={() => onTranslateParagraph(index)}
                        className="px-2.5 py-1.5 rounded-xl border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>翻译</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chapter Navigation Footer */}
        <div className="pt-8 pb-12 border-t border-current/15 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevChapter}
            disabled={chapterIndex === 0}
            className="flex-1 py-3 px-4 rounded-2xl border border-current/20 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一章</span>
          </button>

          <div className="text-xs font-mono opacity-60 text-center shrink-0">
            {chapterIndex + 1} / {totalChapters}
          </div>

          <button
            onClick={handleNextChapter}
            disabled={chapterIndex >= totalChapters - 1}
            className="flex-1 py-3 px-4 rounded-2xl border border-current/20 hover:bg-current/10 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <span>下一章</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
};
