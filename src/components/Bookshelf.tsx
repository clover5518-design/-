import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  FileText,
  FileCode,
  Trash2,
  Clock,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Search,
  Bookmark as BookmarkIcon,
  User as UserIcon,
  Sliders,
  Check,
  Smartphone,
  Download,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParsingPercent(null);
    setErrorMsg(null);

    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.epub')) {
        setParsingMsg(`正在解析 EPUB 电子书: ${file.name}...`);
        const book = await parseEpubFile(file);
        onAddBook(book);
      } else if (name.endsWith('.pdf')) {
        setParsingMsg(`正在解析 PDF 电子书: ${file.name}...`);
        const book = await parsePdfFile(file, (percent, curr, tot) => {
          setParsingPercent(percent);
          setParsingMsg(`正在解析 PDF 页面 (${curr}/${tot} 页)...`);
        });
        onAddBook(book);
      } else if (name.endsWith('.txt')) {
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
        throw new Error('不支持的文件格式，请导入 .pdf, .epub 或 .txt 格式的图书文件');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20 safe-top">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                <span>云语悦读</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-normal">
                  双语朗读
                </span>
              </h1>
              <p className="text-[10px] text-stone-400">PDF · EPUB · AI 翻译 · 智能语音</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile APK Install / Generate Button */}
            <button
              onClick={onOpenApkModal}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="生成并在手机安装 APK 程序 (支持安卓 16 / 三星 S24)"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>安装 APK</span>
            </button>

            {/* User Account / Sync status button */}
            <button
              onClick={onOpenAuth}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 border border-stone-700/60 text-xs font-medium flex items-center gap-2 transition"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/50"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {currentUser ? currentUser.name : '登录同步'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-stone-500'
                }`}
                title={syncStatus === 'synced' ? '云端已同步' : '离线状态'}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {/* Mobile APK Quick Install Hero Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-stone-900 to-indigo-950/40 border border-amber-500/30 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-100">
                  生成手机安装 APK 程序
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  安卓 16 / S24
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                支持扫码免线秒装为原生 WebAPK，或下载 Android Studio 独立工程包与离线安装包。
              </p>
            </div>
          </div>

          <button
            onClick={onOpenApkModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20 flex-shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>获取手机 APK 程序</span>
          </button>
        </div>

        {/* Cloud Sync Announcement Banner */}
        <div
          onClick={onOpenAuth}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-stone-900 to-amber-500/5 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              {currentUser ? (
                <p className="text-stone-200">
                  已登录为 <span className="font-semibold text-amber-300">{currentUser.name}</span>
                  ，阅读进度、书签和批注在多端实时同步中
                </p>
              ) : (
                <p className="text-stone-300">
                  <span className="font-semibold text-amber-400">阅读进度多设备同步</span>
                  ：点击登录账号，随时在手机与电脑间同步书签与笔记
                </p>
              )}
            </div>
          </div>
          <span className="text-[11px] text-amber-400 shrink-0 flex items-center gap-0.5">
            {currentUser ? '管理同步' : '立即登录'} &rarr;
          </span>
        </div>

        {/* Import Action & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="p-5 rounded-3xl border-2 border-dashed border-stone-800 hover:border-amber-500/50 bg-stone-900/40 text-center space-y-3 transition group"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-stone-200 text-sm">
              导入 PDF 或 EPUB 格式图书
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              支持点击导入或直接拖拽文件到此处，自动解析章节结构、提供高质量英文转中文翻译及中英双语语音播放
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>选择图书文件导入</span>
            </button>
            <span className="text-[11px] text-stone-500">
              (支持 .pdf, .epub, .txt)
            </span>
          </div>
        </div>

        {/* Error notification if parsing failed */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center justify-between gap-2">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-stone-400 hover:text-stone-200 text-xs underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* Bookshelf Section Header */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-100">我的书架</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {books.length} 本图书
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-40 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索书名/作者..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Book Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredBooks.map((book) => {
            const currentChap = book.chapters[book.currentChapterIndex] || book.chapters[0];
            const percent =
              book.chapters.length > 0
                ? Math.round(((book.currentChapterIndex + 1) / book.chapters.length) * 100)
                : 0;

            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="p-4 rounded-2xl bg-stone-900 border border-stone-800/80 hover:border-amber-500/40 hover:bg-stone-850 transition cursor-pointer group flex flex-col justify-between relative shadow-sm"
              >
                <div>
                  {/* Format tag & Delete */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md ${
                        book.format === 'epub'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : book.format === 'pdf'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {book.format}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要从书架移除《${book.title}》吗？`)) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="p-1 text-stone-500 hover:text-red-400 rounded-md opacity-0 group-hover:opacity-100 transition"
                      title="删除图书"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Book Title & Author */}
                  <h3 className="font-bold text-stone-100 text-sm leading-snug line-clamp-2 group-hover:text-amber-300 transition">
                    {book.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 truncate">
                    {book.author || '未知作者'}
                  </p>

                  {/* Chapter info */}
                  <p className="text-[11px] text-amber-400/80 mt-2 truncate font-serif">
                    {currentChap?.title || '开始阅读'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                    <span>
                      第 {book.currentChapterIndex + 1}/{book.chapters.length} 章
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* If empty or wanting sample reset */}
        {books.length <= 1 && (
          <div className="text-center pt-4">
            <button
              onClick={onResetSamples}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline"
            >
              恢复内置经典英文名著示范图书 (小王子、爱丽丝梦游仙境)
            </button>
          </div>
        )}
      </div>

      {/* Parsing Loading Modal */}
      {isParsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-stone-100 text-sm">正在导入并解析图书</h3>
              <p className="text-xs text-stone-400">{parsingMsg}</p>
            </div>
            {parsingPercent !== null && (
              <div className="space-y-1">
                <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
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
