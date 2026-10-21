import React, { useEffect, useState } from 'react';
import { Volume2, X, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { DictionaryResult } from '../types/book';
import { lookupWord } from '../services/translateService';

interface WordLookupModalProps {
  word: string | null;
  sentence?: string;
  onClose: () => void;
}

export const WordLookupModal: React.FC<WordLookupModalProps> = ({
  word,
  sentence,
  onClose,
}) => {
  const [data, setData] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    lookupWord(word, sentence)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || '查询失败');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [word, sentence]);

  if (!word) return null;

  const handleSpeak = (textToSpeak: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(textToSpeak);
      utt.lang = lang;
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-800/80">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wider uppercase">智能单词释义</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold text-stone-100 font-serif">{word}</h3>
                {data?.phonetic && (
                  <span className="text-sm text-stone-400 font-mono">[{data.phonetic}]</span>
                )}
                {data?.partOfSpeech && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                    {data.partOfSpeech}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSpeak(word, 'en-US')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition flex items-center justify-center"
              title="朗读发音"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">正在分析词义与语境...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-stone-800/70 border border-stone-700/50">
                <div className="text-xs text-stone-400 mb-1">中文释义</div>
                <div className="text-base font-medium text-stone-100 leading-relaxed">
                  {data.definition}
                </div>
              </div>

              {data.explanation && (
                <div className="p-3 rounded-xl bg-stone-800/40 text-sm text-stone-300 leading-relaxed">
                  <span className="text-amber-400/90 font-medium">语境解析：</span>
                  {data.explanation}
                </div>
              )}

              {data.example && (
                <div className="p-3 rounded-xl bg-stone-800/30 border border-stone-800 text-xs text-stone-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>例句用法</span>
                  </div>
                  <p className="italic text-stone-300 font-serif">"{data.example}"</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-sm transition text-center"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
