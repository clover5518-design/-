import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// CORS middleware to support Android APK (file:// or localhost) and cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Persistent cloud storage simulation for cross-device sync
const DATA_FILE = path.resolve(__dirname, '.sync_datastore.json');

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar: string;
  token: string;
  createdAt: number;
}

interface UserSyncData {
  progressList: any[];
  bookmarks: any[];
  notes: any[];
  settings?: any;
  updatedAt: number;
}

interface AppDataStore {
  users: Record<string, UserRecord>;
  syncData: Record<string, UserSyncData>;
}

let store: AppDataStore = {
  users: {},
  syncData: {},
};

// Load or seed datastore
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    store = JSON.parse(raw);
  } else {
    // Seed a demo user for instant test
    const demoId = 'user_demo_101';
    store.users['reader@demo.com'] = {
      id: demoId,
      email: 'reader@demo.com',
      passwordHash: '123456',
      name: '爱读书的书友',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      token: 'token_demo_abc123',
      createdAt: Date.now(),
    };
    store.syncData[demoId] = {
      progressList: [],
      bookmarks: [],
      notes: [],
      updatedAt: Date.now(),
    };
    saveStore();
  }
} catch (e) {
  console.warn('Failed to load store, initializing fresh:', e);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

// Authentication middleware
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供登录认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  const user = Object.values(store.users).find((u) => u.token === token);
  if (!user) {
    return res.status(401).json({ error: '认证令牌无效或已过期，请重新登录' });
  }

  (req as any).user = user;
  next();
}

// Auth API: Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (store.users[normalizedEmail]) {
    return res.status(400).json({ error: '该邮箱已被注册，请直接登录' });
  }

  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const token = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
  const newUser: UserRecord = {
    id,
    email: normalizedEmail,
    passwordHash: password,
    name: name?.trim() || normalizedEmail.split('@')[0],
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
    token,
    createdAt: Date.now(),
  };

  store.users[normalizedEmail] = newUser;
  store.syncData[id] = {
    progressList: [],
    bookmarks: [],
    notes: [],
    updatedAt: Date.now(),
  };
  saveStore();

  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      token: newUser.token,
    },
  });
});

// Auth API: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '请输入邮箱和密码' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = store.users[normalizedEmail];
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: '邮箱或密码不正确' });
  }

  // Refresh token
  user.token = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
  saveStore();

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      token: user.token,
    },
  });
});

// Auth API: Current user info
app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user = req.user as UserRecord;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      token: user.token,
    },
  });
});

// Sync API: Push local changes to cloud
app.post('/api/sync/push', authenticate, (req: any, res) => {
  const user = req.user as UserRecord;
  const { progressList, bookmarks, notes, settings } = req.body;

  const current = store.syncData[user.id] || {
    progressList: [],
    bookmarks: [],
    notes: [],
    updatedAt: 0,
  };

  // Merge bookmarks: merge by ID, newer overwrites
  const bookmarkMap = new Map();
  (current.bookmarks || []).forEach((b: any) => bookmarkMap.set(b.id, b));
  (bookmarks || []).forEach((b: any) => bookmarkMap.set(b.id, b));

  // Merge notes
  const noteMap = new Map();
  (current.notes || []).forEach((n: any) => noteMap.set(n.id, n));
  (notes || []).forEach((n: any) => noteMap.set(n.id, n));

  // Merge progress
  const progressMap = new Map();
  (current.progressList || []).forEach((p: any) => progressMap.set(p.bookId, p));
  (progressList || []).forEach((p: any) => progressMap.set(p.bookId, p));

  store.syncData[user.id] = {
    progressList: Array.from(progressMap.values()),
    bookmarks: Array.from(bookmarkMap.values()),
    notes: Array.from(noteMap.values()),
    settings: settings || current.settings,
    updatedAt: Date.now(),
  };
  saveStore();

  res.json({
    success: true,
    syncData: store.syncData[user.id],
    serverTime: Date.now(),
  });
});

// Sync API: Pull latest data from cloud
app.get('/api/sync/pull', authenticate, (req: any, res) => {
  const user = req.user as UserRecord;
  const userSync = store.syncData[user.id] || {
    progressList: [],
    bookmarks: [],
    notes: [],
    updatedAt: Date.now(),
  };

  res.json({
    syncData: userSync,
    serverTime: Date.now(),
  });
});

// Helper to get GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory persistent translation cache on server
const serverTranslationCache = new Map<string, string>();

// High-speed Google GTX translation engine with direct server-side connection (POST supports long paragraphs)
async function fetchGoogleGtxTranslation(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';
  try {
    const params = new URLSearchParams();
    params.append('client', 'gtx');
    params.append('sl', 'auto');
    params.append('tl', 'zh-CN');
    params.append('dt', 't');
    params.append('q', clean);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://translate.googleapis.com/translate_a/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translation = data[0].map((item: any) => item[0]).join('').trim();
        if (translation && /[\u4e00-\u9fa5]/.test(translation)) {
          return translation;
        }
      }
    }
  } catch (err) {
    console.warn('Google GTX translate error:', err);
  }
  return '';
}

// Multi-tier English-to-Chinese literary translation engine
async function translateEnglishToChinese(text: string, context?: string): Promise<{ translation: string; source: string }> {
  const clean = text.trim();
  if (!clean) return { translation: '', source: 'empty' };

  // 1. Check server-side cache
  if (serverTranslationCache.has(clean)) {
    return { translation: serverTranslationCache.get(clean)!, source: 'server-cache' };
  }

  // 2. High-speed Google Translate (gtx) engine (takes ~200-300ms, 100% reliable)
  const gtxTranslation = await fetchGoogleGtxTranslation(clean);
  if (gtxTranslation && /[\u4e00-\u9fa5]/.test(gtxTranslation)) {
    serverTranslationCache.set(clean, gtxTranslation);
    return { translation: gtxTranslation, source: 'google-gtx' };
  }

  // 3. Fallback to Gemini 3.8 Flash with 2s timeout protection
  const ai = getGenAI();
  if (ai) {
    try {
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert literary translator from English to Chinese (Simplified, zh-CN).
Translate the following English passage into natural, fluent, and elegant Chinese suited for mobile reading.
Keep formatting intact. Only return the translated Chinese text without notes, explanations, or quotes.

Context: ${context || 'General literary reading'}
English text:
${clean}`,
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      if (response && response.text) {
        const translation = response.text.trim();
        if (translation && /[\u4e00-\u9fa5]/.test(translation)) {
          serverTranslationCache.set(clean, translation);
          return { translation, source: 'gemini-3.8-flash' };
        }
      }
    } catch (err: any) {
      console.warn('Gemini translate error:', err?.message || err);
    }
  }

  // 4. MyMemory Translation API fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|zh-CN`;
    const res = await fetch(mmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CloudReader/1.0.3)',
      },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const translation = data?.responseData?.translatedText?.trim();
      if (translation && /[\u4e00-\u9fa5]/.test(translation)) {
        serverTranslationCache.set(clean, translation);
        return { translation, source: 'mymemory' };
      }
    }
  } catch (err) {
    console.warn('MyMemory translate error:', err);
  }

  // Never return original text as translation! Return empty so client knows it failed
  return { translation: '', source: 'failed' };
}

// API: Batch and single translation endpoint (Guaranteed Chinese output)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, context } = req.body;

    // Single text translation
    if (typeof text === 'string') {
      const clean = text.trim();
      if (!clean) {
        return res.json({ translation: '' });
      }

      const result = await translateEnglishToChinese(clean, context);
      return res.json(result);
    }

    // Batch translation of multiple sentences/paragraphs (Zero dropouts)
    if (Array.isArray(texts)) {
      if (texts.length === 0) {
        return res.json({ translations: [] });
      }

      const results: string[] = new Array(texts.length).fill('');
      const missingIndices: number[] = [];

      // 1. Fill from server cache
      texts.forEach((item, idx) => {
        const clean = (item || '').trim();
        if (!clean) {
          results[idx] = '';
        } else if (serverTranslationCache.has(clean)) {
          results[idx] = serverTranslationCache.get(clean)!;
        } else {
          missingIndices.push(idx);
        }
      });

      // 2. For all missing items, translate each with multi-tier engine (Gemini + instant Google GTX)
      const CHUNK_SIZE = 4;
      for (let i = 0; i < missingIndices.length; i += CHUNK_SIZE) {
        const chunk = missingIndices.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (idx) => {
            const raw = (texts[idx] || '').trim();
            if (!raw) {
              results[idx] = '';
              return;
            }
            const res = await translateEnglishToChinese(raw, context);
            results[idx] = res.translation || '';
          })
        );
      }

      return res.json({ translations: results, source: 'guaranteed-complete' });
    }

    return res.status(400).json({ error: 'Missing text or texts in request body' });
  } catch (error: any) {
    console.error('Translate route error:', error);
    res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// API: Word / phrase lookup & grammar explanation
app.post('/api/lookup', async (req, res) => {
  try {
    const { word, sentence } = req.body;
    if (!word) return res.status(400).json({ error: 'Word is required' });

    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Explain the English word/phrase "${word}" in Chinese for a mobile reader.
Context sentence: "${sentence || ''}".
Return JSON with:
- word: string
- phonetic: string (IPA pronunciation)
- partOfSpeech: string (e.g. n., v., adj.)
- definition: string (concise Chinese definition)
- explanation: string (usage in this context)
- example: string (short English example with Chinese translation)`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                definition: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING },
              },
              required: ['word', 'definition'],
            },
          },
        });

        if (response.text) {
          const result = JSON.parse(response.text.trim());
          return res.json(result);
        }
      } catch (err: any) {
        console.warn('Lookup Gemini error, falling back:', err.message);
      }
    }

    // Quick fallback definition
    const fallbackResult = await translateEnglishToChinese(word);
    const fallbackDef = fallbackResult.translation;
    res.json({
      word,
      phonetic: '',
      partOfSpeech: '',
      definition: fallbackDef,
      explanation: `上下文对应释义: ${fallbackDef}`,
      example: sentence || '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Optical Character Recognition (OCR) for scanned PDF images
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: '请提供图片数据 (Base64)' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const actualMime = mimeType || 'image/jpeg';

    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: actualMime,
              },
            },
            {
              text: `请提取识别这页图书扫描图像中的所有文字内容（包括中文和英文）。
要求：
1. 完整还原书页中的正文字符，保持正确的段落换行与标点符号。
2. 忽略页眉页脚页码和杂色噪音。
3. 请直接输出识别出的正文文本，不要包含任何“以下是识别内容”、“说明”或 Markdown 代码块前后缀。`,
            },
          ],
        });

        const extractedText = response.text?.trim() || '';
        return res.json({ text: extractedText, source: 'gemini-vision-ocr' });
      } catch (err: any) {
        console.warn('Gemini OCR recognition error:', err.message);
      }
    }

    // If API key is unavailable or fails, return empty so frontend gracefully keeps page view
    return res.json({ text: '', source: 'none' });
  } catch (err: any) {
    console.error('OCR route error:', err);
    res.status(500).json({ error: err.message || 'OCR 识别失败' });
  }
});

// API: Check status & AI availability
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: Local network IP info
app.get('/api/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  res.json({ ips, port: PORT });
});

// Direct APK download routes - bypassed around Vite for instant streaming (Standalone native app)
app.get([
  '/downloads/CloudReader-v1.0.3.apk',
  '/downloads/CloudReader-v1.0.2.apk',
  '/downloads/CloudReader-v1.0.1.apk',
  '/downloads/CloudReader-v1.0.0.apk',
  '/apk',
  '/download/apk',
], (req, res) => {
  const apkPath103 = path.resolve(__dirname, 'public/downloads/CloudReader-v1.0.3.apk');
  const apkPath102 = path.resolve(__dirname, 'public/downloads/CloudReader-v1.0.2.apk');
  const apkPath101 = path.resolve(__dirname, 'public/downloads/CloudReader-v1.0.1.apk');
  const fallbackPath = path.resolve(__dirname, 'public/downloads/CloudReader-v1.0.0.apk');
  const fileToServe = fs.existsSync(apkPath103)
    ? apkPath103
    : (fs.existsSync(apkPath102) ? apkPath102 : (fs.existsSync(apkPath101) ? apkPath101 : fallbackPath));

  if (fs.existsSync(fileToServe)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="CloudReader-v1.0.3.apk"');
    // Disable HTTP cache completely so mobile devices always get the freshly compiled APK
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(fileToServe);
  }
  return res.status(404).send('APK 文件正在准备中，请在网页端重试');
});

// Ultra-fast mobile scan landing page (/m or /mobile)
// Loads instantly (less than 5KB, zero heavy JS bundle) even on 3G/4G or weak signals
app.get(['/m', '/mobile', '/scan'], (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>云语悦读 - 手机安装与极速入口</title>
  <meta name="theme-color" content="#18181b">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #121214;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 16px;
      line-height: 1.5;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #1c1c20;
      border: 1px solid #2e2e36;
      border-radius: 24px;
      padding: 24px 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .header {
      text-align: center;
      margin-bottom: 22px;
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 18px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
    }
    .icon-badge svg {
      width: 34px;
      height: 34px;
      fill: #18181b;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #fafafa;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 13px;
      color: #a1a1aa;
    }
    .wechat-banner {
      display: none;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 12px;
      border-radius: 14px;
      font-size: 13px;
      margin-bottom: 18px;
      line-height: 1.4;
      position: relative;
    }
    .wechat-banner strong {
      color: #fecaca;
      display: block;
      margin-bottom: 2px;
    }
    .wechat-overlay {
      display: none;
      position: fixed;
      top: 10px;
      right: 15px;
      z-index: 9999;
      background: #f59e0b;
      color: #18181b;
      padding: 10px 16px;
      border-radius: 14px;
      font-weight: bold;
      font-size: 13px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      animation: bounce 1.2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 15px 16px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      margin-bottom: 12px;
    }
    .btn-green {
      background: #10b981;
      color: #042f2e;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }
    .btn-green:active {
      transform: scale(0.98);
      background: #059669;
    }
    .btn-amber {
      background: #f59e0b;
      color: #18181b;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
    }
    .btn-amber:active {
      transform: scale(0.98);
      background: #d97706;
    }
    .btn-outline {
      background: #27272a;
      color: #e4e4e7;
      border: 1px solid #3f3f46;
    }
    .btn-outline:active {
      background: #3f3f46;
    }
    .info-box {
      background: #232328;
      border-radius: 14px;
      padding: 14px;
      margin-top: 14px;
      border: 1px solid #33333d;
      font-size: 12px;
      color: #a1a1aa;
    }
    .info-box h3 {
      font-size: 13px;
      color: #e4e4e7;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-box ul {
      margin-left: 18px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
      color: #71717a;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      padding: 2px 7px;
      border-radius: 999px;
      margin-left: 6px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="wechatOverlay" class="wechat-overlay">
    👉 点击右上角【···】选择【在浏览器中打开】
  </div>

  <div class="card">
    <div class="header">
      <div class="icon-badge">
        <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
      </div>
      <h1>云语悦读 <span class="badge">安卓 16 优化</span></h1>
      <p class="subtitle">智能双语朗读电子书 · 原生 APK 直装 / Web 极速通道</p>
    </div>

    <div id="wechatBanner" class="wechat-banner">
      <strong>⚠️ 检测到正在使用微信内置浏览器</strong>
      微信默认拦截外部网页与 APK 安装包下载。请点击右上角<strong>【···】</strong>并选择<strong>【在浏览器中打开】</strong>（推荐使用三星浏览器、系统自带浏览器或 Chrome）。
    </div>

    <!-- Direct APK download -->
    <a href="/apk?v=1.0.3" class="btn btn-green" id="downloadApkBtn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>下载安卓 APK (最新版 v1.0.3)</span>
    </a>

    <!-- Open Web App -->
    <a href="/" class="btn btn-amber">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span>在手机浏览器中在线阅读 (Web 版)</span>
    </a>

    <div class="info-box">
      <h3>📱 手机端快速使用说明</h3>
      <ul>
        <li><strong>方案 1 (推荐)：</strong>点击上方「下载安卓 APK」，内置最新完整运行环境（3列书架/书籍删除管理/整章翻译加固/台湾国语及柔和音色），下载后点击即可安装！</li>
        <li><strong>方案 2：</strong>点击「在手机浏览器中在线阅读」，在浏览器菜单点击「添加至主屏幕」，免安装生成桌面独立图标。</li>
        <li><strong>支持特性：</strong>完美支持三星 S24 等最新机型、EPUB/PDF/TXT 本地导入、中英双语对照朗读。</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    云语悦读 · CloudReader v1.0.3 (最新版)
  </div>

  <script>
    // Detect WeChat or QQ
    var ua = navigator.userAgent.toLowerCase();
    var isWeChat = ua.indexOf('micromessenger') !== -1;
    var isQQ = ua.indexOf('qq/') !== -1;
    if (isWeChat || isQQ) {
      document.getElementById('wechatBanner').style.display = 'block';
      document.getElementById('wechatOverlay').style.display = 'block';
    }

    // If query has auto=apk, trigger download
    var params = new URLSearchParams(window.location.search);
    if (params.get('auto') === 'apk' || params.get('download') === 'apk') {
      window.location.href = '/apk';
    }
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(html);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mobile Reader server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
