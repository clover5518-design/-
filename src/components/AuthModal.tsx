import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types/book';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSyncCompleted }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getUser());
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = authService.subscribeAuth((u) => setCurrentUser(u));
    const unsubSync = authService.subscribeSync((status, time) => {
      setSyncStatus(status);
      if (time) setLastSyncTime(time);
    });

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await authService.register(email, password, name);
      } else {
        await authService.login(email, password);
      }
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.login('reader@demo.com', '123456');
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      setError(err.message || '演示登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    setSyncSuccessMsg(null);
    try {
      const pulled = await authService.pullSync();
      if (pulled) {
        setSyncSuccessMsg('云端进度、书签和笔记同步成功！');
        if (onSyncCompleted) onSyncCompleted();
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError('同步失败: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Cloud className="w-5 h-5" />
            <h2 className="text-base font-semibold text-stone-100">
              {currentUser ? '云同步与账号中心' : isRegister ? '创建云端账号' : '登录云读书账号'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-100 text-sm truncate">
                      {currentUser.name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      多端同步中
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Sync Status Card */}
              <div className="p-4 rounded-2xl bg-stone-800/40 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">跨设备同步状态</span>
                  <div className="flex items-center gap-1.5">
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span className="text-amber-400 font-medium">正在同步...</span>
                      </>
                    ) : syncStatus === 'synced' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">已与云端同步</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-stone-400">离线缓存中</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1 border-t border-stone-800/60">
                  <span>最近同步时间</span>
                  <span className="font-mono text-stone-300">
                    {lastSyncTime > 0 ? new Date(lastSyncTime).toLocaleTimeString() : '刚刚'}
                  </span>
                </div>

                {syncSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleManualSync}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>立即检查并拉取最新云端数据</span>
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                <span>您的阅读进度、书签和批注将在手机、平板与电脑间自动实时无缝同步。</span>
              </div>

              <button
                onClick={() => authService.logout()}
                className="w-full py-2 px-4 rounded-xl text-stone-400 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-2 hover:bg-stone-800 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录当前账号</span>
              </button>
            </div>
          ) : (
            /* Login / Register form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-400">昵称</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="你的阅读昵称"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-stone-400">邮箱账号</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-400">密码</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? '立即注册并同步' : '登录并同步阅读数据'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-800" />
                </div>
                <span className="relative px-3 bg-stone-900 text-[11px] text-stone-500">
                  或者快速测试
                </span>
              </div>

              {/* Quick Demo Login */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-medium flex items-center justify-center gap-1.5 transition border border-stone-700/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>一键体验测试账号 (免输入快速登录)</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  {isRegister ? '已有账号？点击直接登录' : '没有账号？点击快速注册'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
