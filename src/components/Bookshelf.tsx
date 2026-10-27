import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  Search,
  User as UserIcon,
  Smartphone,
  Download,
  RefreshCw,
  FolderOpen,
  SlidersHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Book, User } from '../types/book';
import { parseEpubFile } from '../services/epubParser';
import { parsePdfFile } from '../services/pdfParser';

interface BookshelfProps {
  books: Book[];
  currentUser: User | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onSelectBook: (book: Book) => void;
  onAddBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onOpenAuth: () => void;
  onResetSamples: () => void;
  onOpenApkModal: () => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  currentUser,
  syncStatus,
  onSelectBook,
  onAddBook,
  onDeleteBook,
  onOpenAuth,
  onResetSamples,
  onOpenApkModal,
}) => {
  const [search, setSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingMsg, setParsingMsg] = useState('');
  const [parsingPercent, setParsingPercent] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manage / Delete mode state (100% friendly on touch devices)
  const [isManageMode, setIsManageMode] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParsingPercent(null);
    setErrorMsg(null);

    const name = file.name.toLowerCase();
    const isEpub = name.endsWith('.epub') || file.type.includes('epub');
    const isPdf = name.endsWith('.pdf') || file.type.includes('pdf');
    const isTxt = name.endsWith('.txt') || file.type.includes('text');

    try {
      if (isEpub) {
        setParsingMsg(`正在解析 EPUB 电子书: ${file.name}...`);
        const book = await parseEpubFile(file);
        onAddBook(book);
      } else if (isPdf) {
        setParsingMsg(`正在解析 PDF 电子书: ${file.name}（支持文字版与图片扫描版）...`);
        const book = await parsePdfFile(file, (percent, curr, tot) => {
          setParsingPercent(percent);
          setParsingMsg(`正在解析 PDF 页面 (${curr}/${tot} 页)...`);
        });
        onAddBook(book);
      } else if (isTxt) {
        setParsingMsg(`正在读取 TXT 文件: ${file.name}...`);
        const text = await file.text();
        const lines = text.split(/\n\s*\n/).filter((l) => l.trim());
        const paragraphs = lines.map((l, idx) => ({
          id: `p-txt-${idx + 1}`,
          original: l.trim(),
        }));
        const book: Book = {
          id: 'txt_' + Date.now(),
          title: file.name.replace(/\.txt$/i, ''),
          author: '本地文本',
          format: 'txt',
          chapters: [
            {
              id: 'chap-txt-1',
              title: '全文',
              paragraphs,
            },
          ],
          currentChapterIndex: 0,
          currentParagraphIndex: 0,
          createdAt: Date.now(),
          lastReadAt: Date.now(),
          fileSize: file.size,
        };
        onAddBook(book);
      } else {
        setParsingMsg(`正在尝试自适应解析: ${file.name}...`);
        try {
          const book = await parseEpubFile(file);
          onAddBook(book);
        } catch {
          const book = await parsePdfFile(file);
          onAddBook(book);
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || '解析图书失败，请检查文件是否损坏或受密码保护');
    } finally {
      setIsParsing(false);
      setParsingMsg('');
      setParsingPercent(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-black text-stone-100 flex flex-col overflow-hidden select-none">
      {/* Hidden file input for importing custom EPUB/PDF/TXT */}
      <input
        ref={fileInputRef}
        id="bookshelf-file-input"
        type="file"
        accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,application/octet-stream,text/*,*/*"
        className="sr-only opacity-0 absolute pointer-events-none"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Top Navbar */}
      <header className="shrink-0 z-30 bg-black/95 backdrop-blur-md border-b border-stone-850 px-3.5 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  云语悦读
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                  v1.0.3
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Manage / Delete Mode Toggle Button (Mobile-First) */}
            <button
              onClick={() => setIsManageMode(!isManageMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs ${
                isManageMode
                  ? 'bg-amber-500 text-stone-950 font-bold border border-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-750'
              }`}
              title={isManageMode ? '退出管理模式' : '管理与删除书架中的书籍'}
            >
              {isManageMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>完成</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>管理</span>
                </>
              )}
            </button>

            {/* Import file button */}
            <label
              htmlFor="bookshelf-file-input"
              className="px-2.5 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-200 border border-stone-700/60 text-xs font-medium flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
              title="导入本地 EPUB / PDF / TXT 电子书"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs">导入</span>
            </label>

            {/* APK Install button */}
            <button
              onClick={onOpenApkModal}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 text-amber-400 border border-amber-500/35 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs"
              title="获取手机 Android 安装包 (v1.0.3)"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs">APK</span>
            </button>

            {/* User Login & Sync button */}
            <button
              onClick={onOpenAuth}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-750 text-xs flex items-center gap-1.5 transition active:scale-95"
              title={currentUser ? `已登录: ${currentUser.name}` : '登录同步阅读进度'}
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-stone-500'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Manage Mode Tip Banner */}
      {isManageMode && (
        <div className="bg-red-950/70 border-b border-red-800/80 px-4 py-2 flex items-center justify-between text-xs text-red-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>已开启管理模式：点击书籍右上角的红色 ✕ 即可移除书籍</span>
          </div>
          <button
            onClick={() => setIsManageMode(false)}
            className="px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-850 text-white font-medium text-xs"
          >
            完成
          </button>
        </div>
      )}

      {/* Vertically Scrollable Bookshelf Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 sm:px-4 py-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Search & Stats Bar */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-medium">
                书架 · {books.length} 本
              </span>
              {isManageMode && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  管理中
                </span>
              )}
            </div>
            <div className="relative w-40 sm:w-48">
              <Search className="w-3 h-3 text-stone-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索书籍..."
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-stone-600"
              />
            </div>
          </div>

          {/* Error notification if parsing failed */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-stone-400 hover:text-stone-200 text-xs underline"
              >
                关闭
              </button>
            </div>
          )}

          {/* 3-Column Bookshelf Grid matching the reference screenshot */}
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
            {filteredBooks.map((book) => {
              return (
                <div
                  key={book.id}
                  onClick={() => {
                    if (isManageMode) {
                      setBookToDelete(book);
                    } else {
                      onSelectBook(book);
                    }
                  }}
                  className={`flex flex-col group cursor-pointer active:scale-98 transition-transform duration-150 relative ${
                    isManageMode ? 'ring-1 ring-red-500/40 rounded-lg p-0.5' : ''
                  }`}
                >
                  {/* Portrait Book Cover */}
                  <div className="relative aspect-[1/1.42] w-full rounded-md sm:rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shadow-md">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      /* Fallback elegant typography cover for imported books without image */
                      <div className="w-full h-full p-2.5 flex flex-col justify-between bg-gradient-to-br from-stone-850 via-stone-900 to-stone-950 text-stone-200 border border-stone-800">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono font-bold">
                            {book.format}
                          </span>
                          <h4 className="font-serif text-xs font-bold leading-tight line-clamp-3 text-stone-100 mt-1">
                            {book.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">
                          {book.author || '本地书目'}
                        </p>
                      </div>
                    )}

                    {/* Bottom-left corner fold badge with reading mask emblem (as in user screenshot) */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-7 sm:h-7 pointer-events-none select-none">
                      <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[24px] sm:border-b-[28px] border-b-white/30 border-r-[24px] sm:border-r-[28px] border-r-transparent backdrop-blur-xs" />
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white absolute bottom-0.5 left-0.5 opacity-90 drop-shadow-xs"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                    </div>

                    {/* Prominent Delete Button (Always visible in Manage Mode, visible on hover/tap) */}
                    {isManageMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookToDelete(book);
                        }}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-black z-20 active:scale-90 transition"
                        title="删除此书"
                      >
                        <X className="w-4 h-4 stroke-[3]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookToDelete(book);
                        }}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-stone-300 hover:text-white transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                        title="从书架移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Under cover: Check circle icon + Truncated book title (matching screenshot) */}
                  <div className="flex items-center gap-1.5 mt-2 px-0.5 min-w-0">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-stone-700/80 text-stone-300 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                    <span className="text-stone-100 text-xs sm:text-sm font-medium tracking-tight truncate">
                      {book.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset / Restore sample books prompt */}
          <div className="pt-6 pb-2 text-center space-y-2">
            <button
              onClick={onResetSamples}
              className="text-xs text-stone-500 hover:text-stone-300 transition underline underline-offset-4"
            >
              恢复推荐书目 (Broken China, 行业研究, 心理学, Dynamic Hedging 等)
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Native Touch & Mobile Friendly) */}
      {bookToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setBookToDelete(null)}
        >
          <div
            className="w-full max-w-xs bg-stone-900 border border-stone-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-stone-100 text-sm">确定从书架移除此书？</h3>
              <p className="text-xs text-amber-400 font-medium truncate px-2">
                《{bookToDelete.title}》
              </p>
              <p className="text-[11px] text-stone-400">
                移除后此书籍将从本地书架移除，您可以随时通过「导入」重新添加。
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition active:scale-95"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBook(bookToDelete.id);
                  setBookToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/30 active:scale-95 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parsing Loading Modal */}
      {isParsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-5 text-center space-y-3.5 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-stone-100 text-sm">正在导入并解析图书</h3>
              <p className="text-xs text-stone-400">{parsingMsg}</p>
            </div>
            {parsingPercent !== null && (
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-200"
                    style={{ width: `${parsingPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-stone-400 font-mono">{parsingPercent}%</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
