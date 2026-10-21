import React, { useState } from 'react';
import { List, X, Search, Check, BookOpen } from 'lucide-react';
import { Chapter } from '../types/book';

interface TocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  bookTitle: string;
}

export const TocDrawer: React.FC<TocDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterIndex,
  onSelectChapter,
  bookTitle,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = chapters.map((c, i) => ({ ...c, originalIndex: i })).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-80 max-w-[85vw] bg-stone-900 border-r border-stone-800 text-stone-100 flex flex-col h-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div className="min-w-0">
              <h2 className="font-semibold text-stone-100 text-sm">目录章节</h2>
              <p className="text-[11px] text-stone-400 truncate max-w-[180px]">{bookTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-stone-800 bg-stone-950/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索章节..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">无匹配章节</div>
          ) : (
            filtered.map((chap) => {
              const isCurrent = chap.originalIndex === currentChapterIndex;
              return (
                <button
                  key={chap.id}
                  onClick={() => {
                    onSelectChapter(chap.originalIndex);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition text-xs ${
                    isCurrent
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold'
                      : 'hover:bg-stone-800/60 text-stone-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate">{chap.title}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      {chap.paragraphs.length} 个段落
                    </div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-stone-800 bg-stone-950 text-[11px] text-stone-500 flex items-center justify-between">
          <span>共 {chapters.length} 章节</span>
          <span>当前: 第 {currentChapterIndex + 1} 章</span>
        </div>
      </div>
    </div>
  );
};
