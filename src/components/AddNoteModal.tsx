import React, { useState } from 'react';
import { X, FileText, Check, Sparkles } from 'lucide-react';
import { NoteColor, Paragraph } from '../types/book';
import { notesService } from '../services/notesService';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  chapterIndex: number;
  paragraphIndex: number;
  chapterTitle: string;
  paragraph: Paragraph;
}

const COLOR_OPTIONS: { id: NoteColor; label: string; bg: string; dot: string }[] = [
  { id: 'amber', label: '重点标记', bg: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
  { id: 'emerald', label: '心得感悟', bg: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400' },
  { id: 'blue', label: '翻译润色', bg: 'bg-sky-500/20 text-sky-300', dot: 'bg-sky-400' },
  { id: 'purple', label: '生词解析', bg: 'bg-purple-500/20 text-purple-300', dot: 'bg-purple-400' },
  { id: 'rose', label: '经典金句', bg: 'bg-rose-500/20 text-rose-300', dot: 'bg-rose-400' },
];

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  bookId,
  chapterIndex,
  paragraphIndex,
  chapterTitle,
  paragraph,
}) => {
  const [noteText, setNoteText] = useState('');
  const [color, setColor] = useState<NoteColor>('amber');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!noteText.trim()) return;
    notesService.addNote(
      bookId,
      chapterIndex,
      paragraphIndex,
      chapterTitle,
      paragraph.original,
      noteText.trim(),
      color,
      paragraph.translation
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-400">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              添加读书笔记与批注
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quote Excerpt */}
          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs space-y-1.5 font-serif">
            <div className="text-[10px] text-amber-400/90 font-mono tracking-wider">
              {chapterTitle} · 段落 {paragraphIndex + 1}
            </div>
            <p className="italic text-stone-300 line-clamp-3">"{paragraph.original}"</p>
            {paragraph.translation && (
              <p className="text-stone-400 text-[11px] line-clamp-2 pt-1 border-t border-stone-800/60 font-sans">
                译：{paragraph.translation}
              </p>
            )}
          </div>

          {/* Color tag picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-stone-400">笔记分类标签</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((c) => {
                const isActive = color === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
                      isActive
                        ? `${c.bg} border-amber-400/50 ring-1 ring-amber-400/30`
                        : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-stone-400">思考感悟 / 重点批注</label>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="在此记录对此段文字的思考、生词笔记、写作灵感或翻译讨论..."
              className="w-full h-28 p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-medium hover:bg-stone-800 transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!noteText.trim()}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
          >
            保存笔记
          </button>
        </div>
      </div>
    </div>
  );
};
