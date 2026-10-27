import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  Headphones,
  Languages,
  Sliders,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { ttsService, CHINESE_VOICE_PRESETS } from "../services/ttsService";
import { Paragraph, ChineseVoicePreset, TtsMode } from "../types/book";

interface TtsPlayerBarProps {
  paragraphs: Paragraph[];
  currentParagraphIndex: number;
  bookTitle?: string;
  chapterTitle?: string;
  isChineseBook?: boolean;
  onParagraphChange?: (index: number) => void;
}

const SPEED_PRESETS = [0.8, 1.0, 1.25, 1.5, 2.0];

export const TtsPlayerBar: React.FC<TtsPlayerBarProps> = ({
  paragraphs,
  currentParagraphIndex,
  bookTitle = "",
  chapterTitle = "",
  isChineseBook = false,
  onParagraphChange,
}) => {
  const [ttsState, setTtsState] = useState(ttsService.getState());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<string | null>(null);
  const [currentRate, setCurrentRate] = useState<number>(ttsState.rate || 1.0);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const playerBarRef = useRef<HTMLDivElement>(null);

  // Sync currentRate whenever ttsState.rate changes
  useEffect(() => {
    if (ttsState.rate) {
      setCurrentRate(ttsState.rate);
    }
  }, [ttsState.rate]);

  // Subscribe to TTS state
  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setTtsState(state);
      if (onParagraphChange && state.currentParagraphIndex !== currentParagraphIndex) {
        onParagraphChange(state.currentParagraphIndex);
      }
    });
    return () => unsubscribe();
  }, [currentParagraphIndex, onParagraphChange]);

  // Synchronize paragraphs and chapter info with TTS queue
  useEffect(() => {
    ttsService.setQueue(
      paragraphs,
      currentParagraphIndex,
      { bookTitle, chapterTitle, isChineseBook }
    );
  }, [paragraphs, bookTitle, chapterTitle, isChineseBook]);

  // Sync external index changes
  useEffect(() => {
    if (Math.abs(ttsState.currentParagraphIndex - currentParagraphIndex) > 0 && !ttsState.isPlaying) {
      ttsService.jumpTo(currentParagraphIndex);
    }
  }, [currentParagraphIndex]);

  // Close language popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    if (showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLangMenu]);

  // Sleep timer interval countdown
  useEffect(() => {
    if (!timerMinutes) {
      setTimerRemaining(null);
      return;
    }

    const endTime = Date.now() + timerMinutes * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        ttsService.pause();
        setTimerMinutes(null);
        setTimerRemaining(null);
        clearInterval(interval);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimerRemaining(`${m}:${s < 10 ? "0" : ""}${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMinutes]);

  const handlePlayToggle = () => {
    if (ttsState.isPlaying) {
      ttsService.pause();
    } else {
      ttsService.play();
    }
  };

  const handleModeChange = (mode: TtsMode) => {
    ttsService.updateSettings({ ttsMode: mode });
  };

  const handleSpeedSliderChange = (newRate: number) => {
    const rounded = Math.round(newRate * 20) / 20;
    setCurrentRate(rounded);
    ttsService.updateSettings({ rate: rounded }, false);
  };

  const handleSpeedPresetClick = (spd: number) => {
    setCurrentRate(spd);
    ttsService.updateSettings({ rate: spd }, true);
  };

  const handleSelectChinesePreset = (presetId: string) => {
    ttsService.setChineseVoice(presetId);
  };

  const handlePreviewChineseVoice = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    if (previewingVoiceId === presetId) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(presetId);
    ttsService.previewVoice(presetId);
    // Reset preview state after brief duration
    setTimeout(() => {
      setPreviewingVoiceId(null);
    }, 4500);
  };

  const handleSetTimer = (minutes: number | null) => {
    setTimerMinutes(minutes);
    ttsService.setSleepTimer(minutes, () => {
      setTimerMinutes(null);
      setTimerRemaining(null);
    });
  };

  const activeChinesePreset = useMemo(() => {
    const currentId = ttsState.chineseVoiceId || "taiwan-female";
    return (
      CHINESE_VOICE_PRESETS.find((p) => p.id === currentId) || CHINESE_VOICE_PRESETS[0]
    );
  }, [ttsState.chineseVoiceId]);

  const currentPara = paragraphs[ttsState.currentParagraphIndex];

  return (
    <>
      {/* Background click overlay when secondary drawer is expanded */}
      {isExpanded && !showVoiceMenu && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] transition-opacity animate-in fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main Bottom Player Bar (Completely omitted from DOM when Voice Modal is open to prevent ANY overlap) */}
      {!showVoiceMenu && (
        <div
          ref={playerBarRef}
          className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 max-w-xl mx-auto pointer-events-none transition-all duration-300"
        >
          <div className="bg-stone-900/98 backdrop-blur-md border border-stone-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto text-stone-100">
            {/* Secondary Drawer (展开二级菜单：音色卡片入口、倍速滑块、定时关闭) */}
            {isExpanded && (
              <div className="p-4 border-b border-stone-800/80 space-y-3.5 bg-stone-950/80 animate-in fade-in slide-in-from-bottom-2">
                {/* Drawer Title Bar */}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>朗读音色与倍速设置</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-stone-400 text-[11px]">
                      第 {ttsState.currentParagraphIndex + 1} / {paragraphs.length} 段
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                      title="收起设置"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 1. Voice Library Entrance Card */}
                <div
                  onClick={() => setShowVoiceMenu(true)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-stone-800/60 to-stone-800/40 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Headphones className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-stone-100">
                          {activeChinesePreset.name.split("·")[0].trim()}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          {activeChinesePreset.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {activeChinesePreset.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow-sm shadow-amber-500/20 group-hover:bg-amber-400 transition">
                    <span>切换音色库</span>
                    <span className="text-[10px] opacity-75 font-mono">(11款)</span>
                  </div>
                </div>

                {/* 2. Reading Speed Slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>朗读语速 (当前：{currentRate}x)</span>
                    </span>
                    <span className="text-[11px] font-mono text-amber-400">
                      {currentRate >= 1.5 ? "快速" : currentRate <= 0.85 ? "慢速" : "正常"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-500 font-mono">0.5x</span>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={currentRate}
                      onChange={(e) => handleSpeedSliderChange(Number(e.target.value))}
                      className="flex-1 h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400 touch-pan-x"
                    />
                    <span className="text-[10px] text-stone-500 font-mono">2.5x</span>
                  </div>
                  <div className="flex justify-between gap-1 overflow-x-auto py-1">
                    {SPEED_PRESETS.map((spd) => {
                      const isSelected = Math.abs(currentRate - spd) < 0.03;
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedPresetClick(spd)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400"
                              : "bg-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-700"
                          }`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Sleep Timer */}
                <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="text-xs text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>定时关闭：</span>
                    <strong className="text-amber-300 font-mono">
                      {timerRemaining ? `还剩 ${timerRemaining}` : timerMinutes ? `${timerMinutes} 分钟` : "未开启"}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { m: 15, label: "15分" },
                      { m: 30, label: "30分" },
                      { m: 60, label: "60分" },
                      { m: null, label: "关闭" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleSetTimer(item.m)}
                        className={`px-2 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                          timerMinutes === item.m
                            ? "bg-amber-500 text-stone-950 font-bold"
                            : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Compact Main Bar: 3 Clean, Non-Overlapping Zones */}
            <div className="px-3 py-2 flex items-center justify-between gap-1.5 sm:gap-2">
              {/* Zone 1: Language Mode Switcher Button (译文原文切换) */}
              {!isChineseBook ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLangMenu(!showLangMenu);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1 cursor-pointer shrink-0 ${
                      showLangMenu
                        ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-sm"
                        : "bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700/80"
                    }`}
                    title="切换中英文朗读模式"
                  >
                    <Languages className={`w-3.5 h-3.5 ${showLangMenu ? "text-stone-950" : "text-amber-400"}`} />
                    <span className="text-[11px]">
                      {ttsState.mode === "zh-CN" ? "读译文" : ttsState.mode === "bilingual" ? "双语" : "读原文"}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${showLangMenu ? "rotate-180" : ""}`} />
                  </button>

                  {/* Language Mode Popover */}
                  {showLangMenu && (
                    <div
                      ref={langMenuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-12 left-0 w-44 p-2 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl text-xs space-y-1 z-50 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between px-1 text-[11px] text-stone-400 font-medium pb-1 border-b border-stone-800">
                        <span>朗读内容模式</span>
                        <button
                          type="button"
                          onClick={() => setShowLangMenu(false)}
                          className="text-stone-500 hover:text-stone-300 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {[
                        { mode: "zh-CN" as const, label: "读中文译文 (推荐)", desc: "纯中文流畅朗读" },
                        { mode: "bilingual" as const, label: "中英双语朗读", desc: "英文读完跟读中文" },
                        { mode: "en-US" as const, label: "读英文原文", desc: "原著英语原音" },
                      ].map((item) => (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => {
                            handleModeChange(item.mode);
                            setShowLangMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                            ttsState.mode === item.mode
                              ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                              : "text-stone-200 hover:bg-stone-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            {ttsState.mode === item.mode && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className={`text-[10px] ${ttsState.mode === item.mode ? "text-stone-900/80" : "text-stone-400"}`}>
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold shrink-0">
                  中文原著
                </div>
              )}

              {/* Zone 2: Centered Core Playback Controls (上一段、播放/暂停、下一段) - 永不隐藏与遮挡 */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => ttsService.prev()}
                  className="w-8.5 h-8.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition active:scale-95 cursor-pointer border border-stone-700/60"
                  title="上一段"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer shrink-0"
                  title={ttsState.isPlaying ? "暂停朗读" : "开始朗读"}
                >
                  {ttsState.isPlaying ? (
                    <Pause className="w-5 h-5 fill-stone-950" />
                  ) : (
                    <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => ttsService.next()}
                  className="w-8.5 h-8.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition active:scale-95 cursor-pointer border border-stone-700/60"
                  title="下一段"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Zone 3: Secondary Menu Trigger Button (音色与倍速入口) */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition border flex items-center gap-1 cursor-pointer shrink-0 ${
                  isExpanded
                    ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-sm"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700/80 hover:text-amber-300"
                }`}
                title="展开音色与倍速设置（二级菜单）"
              >
                <Headphones className={`w-3.5 h-3.5 ${isExpanded ? "text-stone-950" : "text-amber-400"}`} />
                <span className="text-[11px] font-semibold">
                  设置
                </span>
                <span className={`text-[10px] font-mono ${isExpanded ? "text-stone-900" : "text-amber-400"}`}>
                  {currentRate}x
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                ) : (
                  <ChevronUp className="w-3 h-3 text-stone-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Voice Selection Modal (11 款精选朗读音色库) */}
      {/* Positioned at z-[100] with full backdrop isolation so no bottom-bar buttons can interfere */}
      {showVoiceMenu && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVoiceMenu(false);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-stone-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-800 bg-stone-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    朗读音色库
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                      新增台湾普通话 & 柔和轻语
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">共 11 款精选音色 · 点击任意声音试听并切换</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceMenu(false)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Voice List Body (Native touch scrolling with overscroll-contain) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
              {/* Category 1: Taiwan Mandarin & Gentle Whisper */}
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-rose-500/30">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                    <span>🌸 台湾普通话与柔和轻语 (新增 5 款)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">温软甜美 · 助眠解压</span>
                </div>
                <div className="space-y-1.5">
                  {CHINESE_VOICE_PRESETS.slice(0, 5).map((preset) => {
                    const isSelected = (ttsState.chineseVoiceId || "taiwan-female") === preset.id;
                    const isPreviewing = previewingVoiceId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectChinesePreset(preset.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/70 shadow-sm shadow-amber-500/15 ring-1 ring-amber-500/30"
                            : "bg-stone-950/60 border-stone-800 hover:bg-stone-800/60 hover:border-stone-700"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? "bg-amber-500 border-amber-500 text-stone-950"
                                : "border-stone-700 bg-stone-900"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold text-xs ${isSelected ? "text-amber-300" : "text-stone-100"}`}>
                                {preset.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  preset.id.startsWith("taiwan")
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}
                              >
                                {preset.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 line-clamp-1">
                              {preset.subtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handlePreviewChineseVoice(e, preset.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shrink-0 font-medium transition cursor-pointer ${
                            isPreviewing
                              ? "bg-amber-500 text-stone-950 font-bold animate-pulse"
                              : "bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700"
                          }`}
                          title="试听该声音发音示范"
                        >
                          <Volume1 className={`w-3.5 h-3.5 ${isPreviewing ? "animate-bounce" : ""}`} />
                          <span>{isPreviewing ? "播放中..." : "试听"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Classic Novel & Feature Voices */}
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-500/20 pt-2">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <span>🎙️ 经典小说与特色朗读 (6 款)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">名著 · 评书 · 粤语</span>
                </div>
                <div className="space-y-1.5">
                  {CHINESE_VOICE_PRESETS.slice(5).map((preset) => {
                    const isSelected = (ttsState.chineseVoiceId || "taiwan-female") === preset.id;
                    const isPreviewing = previewingVoiceId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectChinesePreset(preset.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/70 shadow-sm shadow-amber-500/15 ring-1 ring-amber-500/30"
                            : "bg-stone-950/60 border-stone-800 hover:bg-stone-800/60 hover:border-stone-700"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? "bg-amber-500 border-amber-500 text-stone-950"
                                : "border-stone-700 bg-stone-900"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-semibold text-xs ${isSelected ? "text-amber-300" : "text-stone-100"}`}>
                                {preset.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  preset.id === "cantonese"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : preset.gender === "male"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {preset.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 line-clamp-1">
                              {preset.subtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handlePreviewChineseVoice(e, preset.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shrink-0 font-medium transition cursor-pointer ${
                            isPreviewing
                              ? "bg-amber-500 text-stone-950 font-bold animate-pulse"
                              : "bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700"
                          }`}
                          title="试听该声音发音示范"
                        >
                          <Volume1 className={`w-3.5 h-3.5 ${isPreviewing ? "animate-bounce" : ""}`} />
                          <span>{isPreviewing ? "播放中..." : "试听"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/95 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-400">
                当前选择：<strong className="text-amber-400">{activeChinesePreset.name.split("·")[0].trim()}</strong> ({activeChinesePreset.tag})
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceMenu(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
