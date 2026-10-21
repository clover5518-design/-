import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-start">
      {/* Top Desktop toolbar toggle (only visible on wide screens) */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-5xl px-6 py-2.5 text-xs text-stone-400 border-b border-stone-800/60 bg-stone-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-stone-300">云语悦读 · 手机读书程序</span>
          <span className="text-stone-500">| PDF · EPUB · AI 翻译 · 双语语音朗读</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFrame(true)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
              isMobileFrame
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>手机真机视图 (420px)</span>
          </button>

          <button
            onClick={() => setIsMobileFrame(false)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
              !isMobileFrame
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'hover:text-stone-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>宽屏全幅模式</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'lg:max-w-[430px] lg:my-6 lg:rounded-[44px] lg:border-8 lg:border-stone-800 lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] lg:overflow-hidden lg:ring-1 lg:ring-stone-700/50'
            : 'max-w-full'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
