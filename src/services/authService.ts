import { Bookmark, Note, ReadingProgressRecord, ReadingSettings, User } from '../types/book';

const TOKEN_KEY = 'cloud_reader_token';
const USER_KEY = 'cloud_reader_user_info';

type AuthListener = (user: User | null) => void;
type SyncStatusListener = (status: 'synced' | 'syncing' | 'offline' | 'error', lastSyncTime?: number) => void;

class AuthService {
  private user: User | null = null;
  private authListeners: Set<AuthListener> = new Set();
  private syncListeners: Set<SyncStatusListener> = new Set();
  private syncStatus: 'synced' | 'syncing' | 'offline' | 'error' = 'offline';
  private lastSyncTime: number = 0;

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        this.user = JSON.parse(storedUser);
        this.notifyAuth();
        this.syncStatus = 'synced';
        this.notifySync();

        // Verify token with backend
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Token expired');
          })
          .then((data) => {
            if (data.user) {
              this.user = data.user;
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              this.notifyAuth();
            }
          })
          .catch(() => {
            // Keep local cached user for offline usage
          });
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
  }

  public getUser(): User | null {
    return this.user;
  }

  public isLoggedIn(): boolean {
    return Boolean(this.user && this.user.token);
  }

  public subscribeAuth(listener: AuthListener): () => void {
    this.authListeners.add(listener);
    listener(this.user);
    return () => this.authListeners.delete(listener);
  }

  public subscribeSync(listener: SyncStatusListener): () => void {
    this.syncListeners.add(listener);
    listener(this.syncStatus, this.lastSyncTime);
    return () => this.syncListeners.delete(listener);
  }

  private notifyAuth() {
    this.authListeners.forEach((l) => l(this.user));
  }

  private notifySync() {
    this.syncListeners.forEach((l) => l(this.syncStatus, this.lastSyncTime));
  }

  public async login(email: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');

    this.user = data.user;
    if (this.user?.token) {
      localStorage.setItem(TOKEN_KEY, this.user.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    }
    this.syncStatus = 'synced';
    this.lastSyncTime = Date.now();
    this.notifyAuth();
    this.notifySync();
    return this.user!;
  }

  public async register(email: string, password: string, name?: string): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '注册失败');

    this.user = data.user;
    if (this.user?.token) {
      localStorage.setItem(TOKEN_KEY, this.user.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    }
    this.syncStatus = 'synced';
    this.lastSyncTime = Date.now();
    this.notifyAuth();
    this.notifySync();
    return this.user!;
  }

  public logout() {
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.syncStatus = 'offline';
    this.notifyAuth();
    this.notifySync();
  }

  // Push local progress, bookmarks, notes, settings to cloud
  public async pushSync(payload: {
    progressList?: ReadingProgressRecord[];
    bookmarks?: Bookmark[];
    notes?: Note[];
    settings?: ReadingSettings;
  }): Promise<boolean> {
    if (!this.user?.token) {
      this.syncStatus = 'offline';
      this.notifySync();
      return false;
    }

    try {
      this.syncStatus = 'syncing';
      this.notifySync();

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('同步请求失败');

      this.syncStatus = 'synced';
      this.lastSyncTime = Date.now();
      this.notifySync();
      return true;
    } catch (e) {
      console.warn('Sync push error:', e);
      this.syncStatus = 'error';
      this.notifySync();
      return false;
    }
  }

  // Pull latest cloud data
  public async pullSync(): Promise<{
    progressList: ReadingProgressRecord[];
    bookmarks: Bookmark[];
    notes: Note[];
    settings?: ReadingSettings;
  } | null> {
    if (!this.user?.token) return null;

    try {
      this.syncStatus = 'syncing';
      this.notifySync();

      const res = await fetch('/api/sync/pull', {
        headers: { Authorization: `Bearer ${this.user.token}` },
      });

      if (!res.ok) throw new Error('拉取云端数据失败');
      const data = await res.json();

      this.syncStatus = 'synced';
      this.lastSyncTime = Date.now();
      this.notifySync();

      return data.syncData || null;
    } catch (e) {
      console.warn('Sync pull error:', e);
      this.syncStatus = 'error';
      this.notifySync();
      return null;
    }
  }
}

export const authService = new AuthService();
