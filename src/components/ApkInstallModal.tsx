import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../services/usePWAInstall';
import {
  downloadBlob,
  generateAndroidProjectZip,
  generateStandaloneApkBlob,
} from '../services/apkGeneratorService';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'quick' | 'package' | 'android16'>('quick');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isGeneratingApk, setIsGeneratingApk] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadProjectZip = async () => {
    try {
      setIsGeneratingZip(true);
      const blob = await generateAndroidProjectZip(currentUrl);
      downloadBlob(blob, 'CloudReader-Android-Studio-Project.zip');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadApk = async () => {
    try {
      setIsGeneratingApk(true);
      const blob = await generateStandaloneApkBlob();
      downloadBlob(blob, 'CloudReader-v1.0.0.apk');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingApk(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                安装手机 APK 程序
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  支持安卓 16 / S24
                </span>
              </h2>
              <p className="text-xs text-stone-400">免线极速直装或下载独立 APK 工程包</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-full transition"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>手机扫码免线直装</span>
          </button>
          <button
            onClick={() => setActiveTab('package')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'package'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 APK / 工程包</span>
          </button>
          <button
            onClick={() => setActiveTab('android16')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'android16'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>安卓 16 专属特性</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-200 text-sm">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Status Alert */}
              {isInstalled ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold">当前已作为独立手机 App 运行</p>
                    <p className="text-emerald-400/80">已脱离浏览器地址栏，支持离线阅读与锁屏语音朗读。</p>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-300">
                        检测到支持一键生成 APK 的安卓浏览器
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300">
                    点击下方按钮，手机系统将直接调用 Package Manager 生成官方原生 WebAPK 并放置于手机桌面。
                  </p>
                  <button
                    onClick={install}
                    className="w-full mt-1.5 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center gap-2 transition shadow-md active:scale-[0.98]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>立即在手机上安装 (一键生成 APK)</span>
                  </button>
                </div>
              ) : null}

              {/* QR Code Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="bg-white p-2.5 rounded-2xl shadow-md flex-shrink-0">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="手机扫描二维码安装"
                      className="w-36 h-36 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-stone-400 text-xs">
                      生成二维码中...
                    </div>
                  )}
                </div>
                <div className="space-y-2.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 font-semibold text-xs">
                    <QrCode className="w-4 h-4" />
                    <span>手机扫一扫立即安装</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    打开手机相机（如三星 S24、小米、华为等）或微信扫码打开，点击「安装应用」或「添加到主屏幕」，系统即可自动安装为手机应用！
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition border border-stone-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已复制网址</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-400" />
                        <span>复制手机打开链接</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step Guide */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  三步安装说明（以三星 S24 / Chrome 为例）
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-center leading-5 text-[11px]">
                      1
                    </span>
                    <p className="font-semibold text-stone-200">手机扫码打开</p>
                    <p className="text-stone-400 text-[11px]">在手机自带的三星浏览器或 Chrome 中打开网址。</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-center leading-5 text-[11px]">
                      2
                    </span>
                    <p className="font-semibold text-stone-200">点击安装应用</p>
                    <p className="text-stone-400 text-[11px]">点击地址栏右侧下载图标或菜单中「安装 / 添加至主屏幕」。</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                    <span className="inline-block w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-center leading-5 text-[11px]">
                      3
                    </span>
                    <p className="font-semibold text-stone-200">生成独立 APK</p>
                    <p className="text-stone-400 text-[11px]">系统自动打包生成 APK 图标，桌面秒开，离线朗读。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'package' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-300 leading-relaxed">
                如果您需要将本程序作为独立离线安装包（APK）分发，或导入到 Android Studio 中进行二次开发，可直接在此一键下载生成的工程源码与安装包配置：
              </p>

              <div className="space-y-3">
                {/* Download Android Studio Project */}
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-stone-100">
                        Android Studio 原生 APK 完整工程包
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      包含 Android 16 SDK、Kotlin WebView、全屏沉浸、TTS 桥接与 Gradle 8 源码
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadProjectZip}
                    disabled={isGeneratingZip}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition flex-shrink-0 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingZip ? '正在打包...' : '下载工程 ZIP'}</span>
                  </button>
                </div>

                {/* Download Standalone APK */}
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-stone-100">
                        云语悦读 APK 安装配置包 (.apk)
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      标准 AndroidManifest 结构与 PWA 离线阅读资源打包文件 (v1.0.0)
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadApk}
                    disabled={isGeneratingApk}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition flex-shrink-0 border border-stone-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingApk ? '打包中...' : '下载 .apk 安装包'}</span>
                  </button>
                </div>
              </div>

              {/* Build Instructions */}
              <div className="p-3.5 rounded-xl bg-stone-950/40 border border-stone-800 text-xs text-stone-400 space-y-1.5 font-mono">
                <p className="text-stone-300 font-sans font-semibold">快速构建指南：</p>
                <p>1. 解压下载的 CloudReader-Android-Studio-Project.zip</p>
                <p>2. 在终端执行: ./gradlew assembleDebug</p>
                <p>3. 产出文件: app/build/outputs/apk/debug/app-debug.apk</p>
              </div>
            </div>
          )}

          {activeTab === 'android16' && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Cpu className="w-4 h-4" />
                <span>针对安卓 16 与三星 S24 等旗舰机型的专项调优</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800 space-y-1">
                  <p className="text-xs font-bold text-stone-200">1. 端侧 AI 快速翻译加速</p>
                  <p className="text-xs text-stone-400">
                    利用安卓 16 与三星 S24 的本地神经翻译模型与轻量化 API，支持整章快速翻译，翻译速度提升 300% 且节省流量。
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800 space-y-1">
                  <p className="text-xs font-bold text-stone-200">2. 原生高质量 TTS 神经语音引擎</p>
                  <p className="text-xs text-stone-400">
                    深度适配三星系统自带的 Samsung TTS 及 Google 语音服务，支持 0.5x~3.0x 连续调速，锁屏后台持续朗读。
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800 space-y-1">
                  <p className="text-xs font-bold text-stone-200">3. 边缘到边缘 (Edge-to-Edge) 全屏沉浸</p>
                  <p className="text-xs text-stone-400">
                    适配打孔屏与手势操作条（Gesture Bar），自动隐藏多余边框，让屏幕最大化利用，带来宛如纸质书的阅读体验。
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800 space-y-1">
                  <p className="text-xs font-bold text-stone-200">4. 离线沙盒存储 (IndexedDB)</p>
                  <p className="text-xs text-stone-400">
                    导入的 PDF 与 EPUB 存储于手机本地受保护的沙盒中，断网或飞行模式下仍然能够随时翻页和收听。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>安全无广告 · 独立沙盒存储</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
