import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  Volume2,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Globe2,
  X,
  Languages,
} from 'lucide-react';
import { Paragraph, TtsMode, TtsSettings } from '../types/book';
import { ttsService, TtsState } from '../services/ttsService';

interface TtsPlayerBarProps {
  paragraphs: Paragraph[];
  currentParagraphIndex: number;
  bookTitle: string;
  chapterTitle: string;
  onParagraphChange?: (index: number) => void;
}

const SPEED_PRESETS = [0.5, 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];

export const TtsPlayerBar: React.FC<TtsPlayerBarProps> = ({
  paragraphs,
  currentParagraphIndex,
  bookTitle,
  chapterTitle,
  onParagraphChange,
}) => {
  const [ttsState, setTtsState] = useState<TtsState>(ttsService.getState());
  const [settings, setSettings] = useState<TtsSettings>({
    ttsMode: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
  });

  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState<boolean>(false);
  const [showTimerMenu, setShowTimerMenu] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [chineseVoices, setChineseVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const unsub = ttsService.subscribe((state) => {
      setTtsState(state);
      if (onParagraphChange && state.currentParagraphIndex !== currentParagraphIndex) {
        onParagraphChange(state.currentParagraphIndex);
      }
    });

    const updateVoices = () => {
      setChineseVoices(ttsService.getChineseVoices());
      setEnglishVoices(ttsService.getEnglishVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => unsub();
  }, [onParagraphChange, currentParagraphIndex]);

  // Keep ttsService queue in sync when paragraphs or chapter change
  useEffect(() => {
    if (paragraphs.length > 0) {
      ttsService.setQueue(paragraphs, currentParagraphIndex, { bookTitle, chapterTitle });
    }
  }, [paragraphs, chapterTitle, bookTitle]);

  const handlePlayToggle = () => {
    if (ttsState.isPlaying) {
      ttsService.pause();
    } else {
      ttsService.play();
    }
  };

  const handleSpeedSelect = (speed: number) => {
    const rounded = Math.round(speed * 100) / 100;
    const newSettings = { ...settings, rate: rounded };
    setSettings(newSettings);
    ttsService.updateSettings({ rate: rounded });
    // If currently playing, restart utterance with new rate
    if (ttsState.isPlaying) {
      ttsService.play();
    }
  };

  const handleModeChange = (mode: TtsMode) => {
    const newSettings = { ...settings, ttsMode: mode };
    setSettings(newSettings);
    ttsService.updateSettings({ ttsMode: mode });
    if (ttsState.isPlaying) {
      ttsService.play();
    }
  };

  const handleVoiceSelect = (voiceName: string, isZh: boolean) => {
    if (isZh) {
      setSettings((s) => ({ ...s, voiceZh: voiceName }));
      ttsService.updateSettings({ voiceZh: voiceName });
    } else {
      setSettings((s) => ({ ...s, voiceEn: voiceName }));
      ttsService.updateSettings({ voiceEn: voiceName });
    }
    if (ttsState.isPlaying) {
      ttsService.play();
    }
  };

  const handleSetTimer = (minutes: number | null) => {
    setTimerMinutes(minutes);
    ttsService.setSleepTimer(minutes, () => {
      setTimerMinutes(null);
      setTimerRemaining(null);
    });
    setShowTimerMenu(false);
  };

  // Timer countdown updater
  useEffect(() => {
    if (!timerMinutes) {
      setTimerRemaining(null);
      return;
    }
    const endTime = Date.now() + timerMinutes * 60 * 1000;
    const interval = setInterval(() => {
      const left = Math.max(0, endTime - Date.now());
      if (left <= 0) {
        setTimerRemaining(null);
        setTimerMinutes(null);
        clearInterval(interval);
      } else {
        const mins = Math.floor(left / 60000);
        const secs = Math.floor((left % 60000) / 1000);
        setTimerRemaining(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMinutes]);

  const playerBarRef = useRef<HTMLDivElement>(null);

  // Automatically hide playback settings menu and dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (playerBarRef.current && !playerBarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowSpeedMenu(false);
        setShowVoiceMenu(false);
        setShowTimerMenu(false);
      }
    };

    if (isExpanded || showSpeedMenu || showVoiceMenu || showTimerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded, showSpeedMenu, showVoiceMenu, showTimerMenu]);

  const currentPara = paragraphs[ttsState.currentParagraphIndex];

  return (
    <>
      {/* Click outside overlay when playback settings or menus are active */}
      {(isExpanded || showSpeedMenu || showTimerMenu) && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[0.5px] transition-opacity animate-in fade-in"
          onClick={() => {
            setIsExpanded(false);
            setShowSpeedMenu(false);
            setShowVoiceMenu(false);
            setShowTimerMenu(false);
          }}
        />
      )}

      <div
        ref={playerBarRef}
        className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 max-w-xl mx-auto pointer-events-none"
      >
        <div className="bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto text-stone-100 transition-all duration-300">
          {/* Expanded Top Details */}
          {isExpanded && (
            <div className="p-4 border-b border-stone-800/80 space-y-3 bg-stone-950/60 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-medium text-amber-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>
                    {settings.ttsMode === 'zh-CN'
                      ? '正在朗读中文译文'
                      : settings.ttsMode === 'en-US'
                      ? '正在朗读英文原文'
                      : ttsState.currentPhase === 'original'
                      ? '中英双语：正在读英文'
                      : '中英双语：正在读中文'}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-stone-400">
                    {ttsState.currentParagraphIndex + 1} / {paragraphs.length} 段
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                    title="收起播放设置"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Current speaking text quote */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-1.5 font-serif max-h-28 overflow-y-auto">
              {currentPara?.original && (
                <p className="text-stone-300 italic">
                  "{currentPara.original}"
                </p>
              )}
              {currentPara?.translation && (
                <p className="text-amber-300/90 font-sans pt-1 border-t border-stone-800/80">
                  {currentPara.translation}
                </p>
              )}
            </div>

            {/* Detailed Speed Slider & Presets in Expanded View */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>语速调节 (当前：{settings.rate}x)</span>
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {settings.rate >= 1.5 ? '快速' : settings.rate <= 0.85 ? '慢速' : '正常'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stone-500 font-mono">0.5x</span>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  value={settings.rate}
                  onChange={(e) => handleSpeedSelect(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-[10px] text-stone-500 font-mono">2.5x</span>
              </div>
              <div className="flex justify-between gap-1 overflow-x-auto py-1">
                {SPEED_PRESETS.map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedSelect(spd)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono transition ${
                      settings.rate === spd
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-800/60 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Voice Selector */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800/60">
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
                <button
                  onClick={() => handleModeChange('zh-CN')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    settings.ttsMode === 'zh-CN'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  读译文
                </button>
                <button
                  onClick={() => handleModeChange('bilingual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    settings.ttsMode === 'bilingual'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  双语朗读
                </button>
                <button
                  onClick={() => handleModeChange('en-US')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    settings.ttsMode === 'en-US'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  读原文
                </button>
              </div>

              {/* Voice select button */}
              <button
                onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1.5 transition"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[90px]">
                  {settings.ttsMode === 'zh-CN'
                    ? settings.voiceZh || '中文发音'
                    : settings.ttsMode === 'en-US'
                    ? settings.voiceEn || '英语发音'
                    : '发音人'}
                </span>
              </button>
            </div>

            {/* Voice Dropdown if open */}
            {showVoiceMenu && (
              <div className="p-2 bg-stone-900 rounded-xl border border-stone-800 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                <div className="text-[10px] text-stone-400 px-2 py-0.5">中文播报语音</div>
                {chineseVoices.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => {
                      handleVoiceSelect(v.name, true);
                      setShowVoiceMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                      settings.voiceZh === v.name
                        ? 'bg-amber-500/20 text-amber-300 font-medium'
                        : 'text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span className="truncate">{v.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{v.lang}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compact Main Bar */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          {/* Left: Text preview & expand toggle */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 min-w-0 cursor-pointer group flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              {ttsState.isPlaying ? (
                <span className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 h-2 bg-amber-400 animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-amber-400 animate-bounce" />
                  <span className="w-0.5 h-2.5 bg-amber-400 animate-pulse" />
                </span>
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400/80" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0">
                  {settings.ttsMode === 'zh-CN' ? '中文' : settings.ttsMode === 'en-US' ? '英文' : '双语'}
                </span>
                <span className="text-xs font-medium text-stone-200 truncate">
                  {ttsState.activeText || currentPara?.translation || currentPara?.original || '点击播放语音朗读'}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5">
                {chapterTitle} · 第 {ttsState.currentParagraphIndex + 1}/{paragraphs.length} 段
              </div>
            </div>

            <button className="text-stone-400 hover:text-stone-200 p-1">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Speed quick button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`px-2 py-1 rounded-xl text-xs font-mono font-semibold transition border flex items-center gap-0.5 ${
                  showSpeedMenu
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700/80'
                }`}
                title="调节播放语速"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{settings.rate}x</span>
              </button>

              {/* Speed dropdown menu */}
              {showSpeedMenu && (
                <div
                  className="absolute bottom-11 right-0 w-44 p-2 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl text-xs space-y-2 z-50 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-1 text-[11px] text-stone-400 font-medium">
                    <span>语速快捷选择</span>
                    <button onClick={() => setShowSpeedMenu(false)} className="text-stone-500 hover:text-stone-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {SPEED_PRESETS.map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          handleSpeedSelect(spd);
                          setShowSpeedMenu(false);
                        }}
                        className={`py-1.5 rounded-lg font-mono text-center transition ${
                          settings.rate === spd
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400 px-1">
                    <span>当前倍速</span>
                    <span className="font-mono text-amber-400">{settings.rate} 倍速</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sleep timer button */}
            <div className="relative">
              <button
                onClick={() => setShowTimerMenu(!showTimerMenu)}
                className={`p-2 rounded-xl transition ${
                  timerMinutes
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
                }`}
                title={timerRemaining ? `定时剩余 ${timerRemaining}` : '定时关闭'}
              >
                <Clock className="w-4 h-4" />
                {timerRemaining && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 text-[9px] font-bold font-mono px-1 rounded-full">
                    {timerRemaining}
                  </span>
                )}
              </button>

              {/* Timer Menu */}
              {showTimerMenu && (
                <div className="absolute bottom-11 right-0 w-36 p-1.5 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl text-xs space-y-1 z-50 animate-in fade-in">
                  <div className="text-[10px] text-stone-400 px-2 py-1">定时关闭播放</div>
                  {[
                    { m: 15, label: '15 分钟' },
                    { m: 30, label: '30 分钟' },
                    { m: 45, label: '45 分钟' },
                    { m: 60, label: '60 分钟' },
                    { m: null, label: '不开启定时' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleSetTimer(item.m)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition ${
                        timerMinutes === item.m
                          ? 'bg-amber-500 text-stone-950 font-medium'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prev */}
            <button
              onClick={() => ttsService.prev()}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
              title="上一段"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause main button */}
            <button
              onClick={handlePlayToggle}
              className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition shadow-lg shadow-amber-500/25 active:scale-95"
              title={ttsState.isPlaying ? '暂停' : '开始朗读'}
            >
              {ttsState.isPlaying ? (
                <Pause className="w-5 h-5 fill-stone-950" />
              ) : (
                <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => ttsService.next()}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
              title="下一段"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
};
