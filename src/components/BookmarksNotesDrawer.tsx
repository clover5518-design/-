import React, { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  FileText,
  X,
  Trash2,
  ExternalLink,
  Edit3,
  Check,
  Share2,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Bookmark, Note, NoteColor } from '../types/book';
import { notesService } from '../services/notesService';

interface BookmarksNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  bookmarks: Bookmark[];
  notes: Note[];
  onNavigate: (chapterIndex: number, paragraphIndex: number) => void;
}

const COLOR_STYLES: Record<NoteColor, { label: string; bg: string; text: string; border: string }> = {
  amber: { label: '重点高亮', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  emerald: { label: '心得感悟', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  blue: { label: '翻译润色', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  purple: { label: '生词重点', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  rose: { label: '金句摘录', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const BookmarksNotesDrawer: React.FC<BookmarksNotesDrawerProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  bookmarks,
  notes,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [editColor, setEditColor] = useState<NoteColor>('amber');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentBookBookmarks = bookmarks.filter((b) => b.bookId === bookId);
  const currentBookNotes = notes.filter((n) => n.bookId === bookId);

  const handleStartEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.noteText);
    setEditColor(note.color);
  };

  const handleSaveEditNote = (noteId: string) => {
    if (editNoteText.trim()) {
      notesService.updateNote(noteId, editNoteText.trim(), editColor);
      setEditingNoteId(null);
    }
  };

  const handleExportNotes = () => {
    if (currentBookNotes.length === 0) return;
    const text = currentBookNotes
      .map(
        (n, i) =>
          `### 笔记 ${i + 1} (${n.chapterTitle})\n` +
          `> 原文：${n.originalText}\n` +
          (n.translatedText ? `> 译文：${n.translatedText}\n` : '') +
          `**我的想法**：${n.noteText}\n` +
          `*时间：${new Date(n.updatedAt).toLocaleString()}*\n`
      )
      .join('\n---\n\n');

    navigator.clipboard.writeText(`# 《${bookTitle}》读书笔记\n\n` + text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 max-w-full bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col h-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-stone-100 text-base">书签与读书笔记</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-stone-950/60 border-b border-stone-800 gap-1">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'bookmarks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>书签 ({currentBookBookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === 'notes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>笔记与批注 ({currentBookNotes.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'bookmarks' ? (
            currentBookBookmarks.length === 0 ? (
              <div className="py-16 text-center text-stone-500 space-y-2">
                <BookmarkIcon className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                <p className="text-sm">暂无书签</p>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  阅读时点击顶栏书签图标或段落菜单，随时记录当前阅读位置
                </p>
              </div>
            ) : (
              currentBookBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-800 hover:border-amber-500/40 transition group space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        onNavigate(bm.chapterIndex, bm.paragraphIndex);
                        onClose();
                      }}
                      className="text-left font-medium text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 truncate"
                    >
                      <BookmarkIcon className="w-3.5 h-3.5 shrink-0 fill-amber-400/30" />
                      <span className="truncate">{bm.chapterTitle}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        #段落 {bm.paragraphIndex + 1}
                      </span>
                    </button>
                    <button
                      onClick={() => notesService.removeBookmark(bm.id)}
                      className="text-stone-500 hover:text-red-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition"
                      title="删除书签"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p
                    onClick={() => {
                      onNavigate(bm.chapterIndex, bm.paragraphIndex);
                      onClose();
                    }}
                    className="text-xs text-stone-300 line-clamp-2 italic cursor-pointer font-serif"
                  >
                    "{bm.excerpt}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        onNavigate(bm.chapterIndex, bm.paragraphIndex);
                        onClose();
                      }}
                      className="text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <span>前往阅读</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : currentBookNotes.length === 0 ? (
            <div className="py-16 text-center text-stone-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
              <p className="text-sm">暂无读书笔记</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                点击阅读界面的任一段落，点击“写笔记”添加思考、感悟或重点批注
              </p>
            </div>
          ) : (
            currentBookNotes.map((n) => {
              const isEditing = editingNoteId === n.id;
              const colorInfo = COLOR_STYLES[n.color] || COLOR_STYLES.amber;

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl bg-stone-800/40 border transition space-y-2.5 ${colorInfo.border}`}
                >
                  {/* Note header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorInfo.bg} ${colorInfo.text}`}
                    >
                      {colorInfo.label} · {n.chapterTitle}
                    </span>
                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEditNote(n)}
                          className="p-1 text-stone-400 hover:text-stone-200 transition"
                          title="编辑笔记"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => notesService.deleteNote(n.id)}
                        className="p-1 text-stone-500 hover:text-red-400 transition"
                        title="删除笔记"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quoted original text */}
                  <div
                    onClick={() => {
                      onNavigate(n.chapterIndex, n.paragraphIndex);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-stone-900/60 border border-stone-800 text-xs text-stone-400 cursor-pointer hover:border-stone-700 transition space-y-1 font-serif"
                  >
                    <p className="italic line-clamp-2">"{n.originalText}"</p>
                    {n.translatedText && (
                      <p className="text-[11px] text-stone-400 opacity-80 line-clamp-1">
                        译：{n.translatedText}
                      </p>
                    )}
                  </div>

                  {/* Note content or Editor */}
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full p-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-100 focus:outline-hidden focus:border-amber-400 resize-none h-20"
                        placeholder="修改你的笔记感悟..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {(Object.keys(COLOR_STYLES) as NoteColor[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setEditColor(c)}
                              className={`w-4 h-4 rounded-full border transition ${
                                editColor === c ? 'ring-2 ring-amber-400 scale-110' : 'opacity-70'
                              } ${COLOR_STYLES[c].bg.replace('/10', '')}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 text-[11px] rounded bg-stone-800 text-stone-300 hover:bg-stone-700"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleSaveEditNote(n.id)}
                            className="px-2.5 py-1 text-[11px] rounded bg-amber-500 text-stone-950 font-medium hover:bg-amber-400"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-200 font-medium leading-relaxed whitespace-pre-wrap">
                      {n.noteText}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/40">
                    <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        onNavigate(n.chapterIndex, n.paragraphIndex);
                        onClose();
                      }}
                      className="text-amber-400/90 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <span>定位段落</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Export Button */}
        {activeTab === 'notes' && currentBookNotes.length > 0 && (
          <div className="p-3 border-t border-stone-800 bg-stone-950 flex justify-end">
            <button
              onClick={handleExportNotes}
              className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">已成功复制全部笔记至剪贴板</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>导出全部笔记 (Markdown格式)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
