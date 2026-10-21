import React from 'react';
import {
  ChevronLeft,
  List,
  Sliders,
  Bookmark as BookmarkIcon,
  FileText,
  User as UserIcon,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { User } from '../types/book';

interface ReaderNavbarProps {
  bookTitle: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  isBookmarked: boolean;
  notesCount: number;
  bookmarksCount: number;
  currentUser: User | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  isTranslatingChapter: boolean;
  isChineseBook?: boolean;
  translateProgress?: { done: number; total: number } | null;
  onBack: () => void;
  onOpenToc: () => void;
  onOpenSettings: () => void;
  onToggleBookmark: () => void;
  onOpenNotes: () => void;
  onOpenAuth: () => void;
  onTranslateChapter: () => void;
  onOpenApkModal?: () => void;
}

export const ReaderNavbar: React.FC<ReaderNavbarProps> = ({
  bookTitle,
  chapterTitle,
  chapterIndex,
  totalChapters,
  isBookmarked,
  notesCount,
  bookmarksCount,
  currentUser,
  syncStatus,
  isTranslatingChapter,
  isChineseBook,
  translateProgress,
  onBack,
  onOpenToc,
  onOpenSettings,
  onToggleBookmark,
  onOpenNotes,
  onOpenAuth,
  onTranslateChapter,
  onOpenApkModal,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 text-stone-100 safe-top">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-stone-300 hover:text-stone-100 hover:bg-stone-800/80 transition"
            title="返回书架"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenToc}
            className="flex flex-col text-left min-w-0 hover:opacity-85 transition pr-1"
          >
            <span className="text-xs font-semibold text-stone-100 truncate max-w-[130px] sm:max-w-[200px]">
              {bookTitle}
            </span>
            <span className="text-[10px] text-amber-400 truncate max-w-[130px] sm:max-w-[200px]">
              {chapterTitle} ({chapterIndex + 1}/{totalChapters})
            </span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Entire Chapter Translate button (only shown for non-Chinese books) */}
          {!isChineseBook && (
            <button
              onClick={onTranslateChapter}
              disabled={isTranslatingChapter}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow-sm ${
                isTranslatingChapter
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
              }`}
              title="整章极速翻译（调用安卓16/三星S24端侧系统翻译）"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isTranslatingChapter ? 'animate-spin' : ''}`} />
              <span className="font-semibold">
                {isTranslatingChapter
                  ? translateProgress
                    ? `${Math.round((translateProgress.done / (translateProgress.total || 1)) * 100)}%`
                    : '翻译中'
                  : '整章翻译'}
              </span>
            </button>
          )}

          {/* Quick Bookmark Toggle */}
          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl transition ${
              isBookmarked
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
            }`}
            title={isBookmarked ? '已添加书签' : '添加书签'}
          >
            <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Notes & Bookmarks list */}
          <button
            onClick={onOpenNotes}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition relative"
            title="书签与读书笔记"
          >
            <FileText className="w-4 h-4" />
            {notesCount + bookmarksCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-stone-900" />
            )}
          </button>

          {/* TOC Chapter Drawer */}
          <button
            onClick={onOpenToc}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition"
            title="目录"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Mobile APK Modal Button */}
          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-400 hover:bg-stone-800/80 transition"
              title="生成/安装手机 APK (支持安卓 16 / 三星 S24)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          {/* Custom Aa Styling Modal */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition font-serif font-bold text-sm"
            title="排版与主题设置"
          >
            Aa
          </button>

          {/* User Account & Sync Status */}
          <button
            onClick={onOpenAuth}
            className={`p-1.5 sm:p-2 rounded-xl transition flex items-center gap-1.5 ${
              currentUser
                ? 'text-stone-200 hover:bg-stone-800'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            title={currentUser ? `${currentUser.name} (已同步)` : '登录账号以同步进度'}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/50"
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
            {currentUser && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-stone-500'
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
