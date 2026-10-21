import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../services/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  className = '',
  variant = 'compact',
}) => {
  const { isInstalled, isInstallable } = usePWAInstall();

  if (variant === 'compact') {
    return (
      <button
        onClick={onOpenModal}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition shadow-sm active:scale-95 ${className}`}
        title="生成/安装手机 APK"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{isInstalled ? '手机应用已就绪' : '安装 APK'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenModal}
      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition active:scale-[0.98] ${className}`}
    >
      <Smartphone className="w-4 h-4" />
      <span>{isInstalled ? '查看手机 APK 安装信息' : '生成可在手机安装的 APK 程序'}</span>
    </button>
  );
};
