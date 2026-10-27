import React, { useState } from 'react';
import {
  X,
  Type,
  Maximize2,
  Sliders,
  Check,
  Columns,
  AlignJustify,
  Sun,
  Moon,
  Smartphone,
  Languages,
  Volume1,
} from 'lucide-react';
import { FontFamilyType, LayoutMode, MarginType, ReaderTheme, ReadingSettings } from '../types/book';
import { ttsService, CHINESE_VOICE_PRESETS } from '../services/ttsService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ReadingSettings;
  onUpdate: (updated: Partial<ReadingSettings>) => void;
  onClose: () => void;
  isChineseBook?: boolean;
  onOpenApkModal?: () => void;
}

const THEME_OPTIONS: { id: ReaderTheme; name: string; bg: string; text: string; border: string }[] = [
  { id: 'sepia', name: '经典羊皮', bg: '#F6EFE2', text: '#382C1E', border: '#D8C6AE' },
  { id: 'paper', name: '水墨纯白', bg: '#FAF8F5', text: '#212529', border: '#E2DCD5' },
  { id: 'mint', name: '柔和护眼', bg: '#E8F2EA', text: '#1F3824', border: '#C7DEC9' },
  { id: 'bamboo', name: '幽谷竹青', bg: '#E2EDE3', text: '#1A3821', border: '#BFD6C2' },
  { id: 'mist', name: '雅致雾灰', bg: '#ECEEEF', text: '#2D3748', border: '#D0D5DD' },
  { id: 'dark', name: '深邃夜间', bg: '#1A1C20', text: '#E2E4E9', border: '#2D323A' },
  { id: 'night', name: '纯黑极夜', bg: '#000000', text: '#D1D5DB', border: '#262626' },
];

const FONT_OPTIONS: { id: FontFamilyType; name: string; sample: string; className: string }[] = [
  { id: 'serif', name: '宋体/明朝', sample: '经典思源宋体', className: 'font-read-serif' },
  { id: 'sans', name: '黑体/系统', sample: '现代屏幕黑体', className: 'font-read-sans' },
  { id: 'kaiti', name: '楷体韵味', sample: '传统书法楷体', className: 'font-read-kaiti' },
  { id: 'mono', name: '等宽工整', sample: '清晰等宽代码', className: 'font-read-mono' },
];

const LINE_HEIGHT_OPTIONS = [
  { val: 1.4, label: '紧凑 (1.4)' },
  { val: 1.8, label: '适中 (1.8)' },
  { val: 2.2, label: '宽松 (2.2)' },
  { val: 2.6, label: '开阔 (2.6)' },
];

const MARGIN_OPTIONS: { val: MarginType; label: string }[] = [
  { val: 'narrow', label: '紧凑窄' },
  { val: 'normal', label: '标准' },
  { val: 'wide', label: '沉浸宽' },
];

const LAYOUT_OPTIONS: { val: LayoutMode; label: string; desc: string }[] = [
  { val: 'bilingual', label: '中英双语对照', desc: '英文原文下方紧跟中文译文' },
  { val: 'original', label: '仅英文原文', desc: '沉浸原版阅读，点击段落看译文' },
  { val: 'translation', label: '仅中文译文', desc: '快速通读高质量中文全译' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdate,
  onClose,
  isChineseBook,
  onOpenApkModal,
}) => {
  const [currentVoiceId, setCurrentVoiceId] = useState<string>(
    ttsService.getState().chineseVoiceId || 'taiwan-female'
  );
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectVoice = (id: string) => {
    setCurrentVoiceId(id);
    ttsService.setChineseVoice(id);
  };

  const handleAudition = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPreviewingVoiceId(id);
    ttsService.previewVoice(id);
    setTimeout(() => {
      setPreviewingVoiceId((cur) => (cur === id ? null : cur));
    }, 4500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl text-stone-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80">
          <div className="flex items-center gap-2 text-amber-400">
            <Sliders className="w-5 h-5" />
            <h2 className="text-base font-semibold text-stone-100">阅读界面偏好设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable controls */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Preview Card */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-stone-400 flex items-center justify-between">
              <span>实时效果预览</span>
              <span className="text-[11px] text-amber-400/90 font-mono">
                {settings.fontSize}px · {settings.lineHeight}x · {settings.theme}
              </span>
            </div>
            <div
              className={`p-4 rounded-xl border transition-all duration-200 theme-${settings.theme} ${
                settings.fontFamily === 'serif'
                  ? 'font-read-serif'
                  : settings.fontFamily === 'kaiti'
                  ? 'font-read-kaiti'
                  : settings.fontFamily === 'mono'
                  ? 'font-read-mono'
                  : 'font-read-sans'
              }`}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
              }}
            >
              {settings.layoutMode !== 'translation' && (
                <p className="mb-1">
                  "It is only with the heart that one can see rightly; what is essential is invisible to the eye."
                </p>
              )}
              {settings.layoutMode !== 'original' && (
                <p className={`${settings.layoutMode === 'bilingual' ? 'opacity-85 text-[0.9em]' : ''}`}>
                  “唯有用心才能看得清实质；真正重要的东西，肉眼是看不见的。”
                </p>
              )}
            </div>
          </div>

          {/* Theme Preset Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase block">
              阅读背景与主题
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {THEME_OPTIONS.map((th) => {
                const isActive = settings.theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => onUpdate({ theme: th.id })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition group relative ${
                      isActive ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center border"
                      style={{ backgroundColor: th.bg, borderColor: th.border }}
                    >
                      {isActive && <Check className="w-4 h-4" style={{ color: th.text }} />}
                    </div>
                    <span className="text-[11px] text-stone-300 truncate">{th.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase block">
              排版字体
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isActive = settings.fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdate({ fontFamily: f.id })}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/30'
                        : 'border-stone-800 hover:border-stone-700 bg-stone-800/40 text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm text-stone-100">{f.name}</div>
                      <div className={`text-xs text-stone-400 mt-0.5 ${f.className}`}>{f.sample}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size & Steppers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase">
                文字字号
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdate({ fontSize: Math.max(12, settings.fontSize - 1) })}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold transition"
                >
                  A -
                </button>
                <span className="text-sm font-semibold font-mono text-amber-400 w-12 text-center">
                  {settings.fontSize} px
                </span>
                <button
                  onClick={() => onUpdate({ fontSize: Math.min(32, settings.fontSize + 1) })}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold transition"
                >
                  A +
                </button>
              </div>
            </div>
            <input
              type="range"
              min={12}
              max={32}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Line Height Spacing */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase block">
              行间距
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LINE_HEIGHT_OPTIONS.map((lh) => {
                const isActive = settings.lineHeight === lh.val;
                return (
                  <button
                    key={lh.val}
                    onClick={() => onUpdate({ lineHeight: lh.val })}
                    className={`py-2 px-1 text-xs rounded-xl border text-center transition font-medium ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                        : 'border-stone-800 hover:border-stone-700 bg-stone-800/40 text-stone-300'
                    }`}
                  >
                    {lh.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Margins */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase block">
              页面边距
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MARGIN_OPTIONS.map((m) => {
                const isActive = settings.margin === m.val;
                return (
                  <button
                    key={m.val}
                    onClick={() => onUpdate({ margin: m.val })}
                    className={`py-2 px-2 text-xs rounded-xl border text-center transition font-medium ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                        : 'border-stone-800 hover:border-stone-700 bg-stone-800/40 text-stone-300'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout Mode (Bilingual / Original / Translation) - only for foreign/bilingual books */}
          {!isChineseBook && (
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase block">
                翻译版式模式
              </label>
              <div className="space-y-2">
                {LAYOUT_OPTIONS.map((lo) => {
                  const isActive = settings.layoutMode === lo.val;
                  return (
                    <button
                      key={lo.val}
                      onClick={() => onUpdate({ layoutMode: lo.val })}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                          : 'border-stone-800 hover:border-stone-700 bg-stone-800/40 text-stone-300'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-stone-100">{lo.label}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{lo.desc}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TTS Voice Selection Section */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-400 tracking-wider uppercase flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>朗读语音音色选择</span>
              </label>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                新增台湾普通话 & 柔和轻语
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {CHINESE_VOICE_PRESETS.map((preset) => {
                const isSelected = currentVoiceId === preset.id;
                const isAuditioning = previewingVoiceId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectVoice(preset.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/70 shadow-sm shadow-amber-500/10'
                        : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-stone-200'}`}>
                          {preset.name.split('·')[0].trim()}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                            preset.tag.includes('台湾')
                              ? 'bg-rose-500/20 text-rose-300'
                              : preset.tag.includes('助眠')
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : preset.tag.includes('治愈')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {preset.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">
                        {preset.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAudition(e, preset.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition ${
                        isAuditioning
                          ? 'bg-amber-500 text-stone-950 animate-pulse'
                          : 'bg-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-700'
                      }`}
                      title="试听发音"
                    >
                      <Volume1 className={`w-3 h-3 ${isAuditioning ? 'animate-bounce' : ''}`} />
                      <span>{isAuditioning ? '试听中' : '试听'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile APK Program Entry */}
          {onOpenApkModal && (
            <div className="pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApkModal();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-stone-800 to-indigo-950/40 border border-amber-500/30 text-left flex items-center justify-between gap-3 hover:border-amber-500/60 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                      <span>生成并在手机安装 APK 程序</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full">
                        安卓 16 / S24
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      支持手机扫码秒级直装或导出完整 Android Studio 工程包
                    </div>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition">
                  立即生成 &rarr;
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-semibold text-sm transition text-center shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.98]"
          >
            完成设置
          </button>
        </div>
      </div>
    </div>
  );
};
