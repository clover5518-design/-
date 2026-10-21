import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

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

// Fallback translation using free translation endpoint when API key is unavailable or fails
async function fallbackTranslate(text: string): Promise<string> {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) throw new Error('Fallback failed');
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('');
    }
  } catch (err) {
    console.warn('Fallback translate error:', err);
  }
  return text; // Return original if all fails
}

// API: Batch and single translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, context } = req.body;

    // Single text translation
    if (typeof text === 'string') {
      const clean = text.trim();
      if (!clean) {
        return res.json({ translation: '' });
      }

      const ai = getGenAI();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `You are an expert literary translator from English to Chinese (Simplified, zh-CN). 
Translate the following English passage into natural, fluent, and elegant Chinese suited for mobile reading.
Keep formatting intact. Only return the translated Chinese text without notes, explanations, or quotes.

Context: ${context || 'General literary reading'}
English text:
${clean}`,
          });
          const translation = response.text?.trim() || (await fallbackTranslate(clean));
          return res.json({ translation, source: 'gemini' });
        } catch (apiErr: any) {
          console.warn('Gemini translate error, using fallback:', apiErr.message);
          const translation = await fallbackTranslate(clean);
          return res.json({ translation, source: 'fallback' });
        }
      } else {
        const translation = await fallbackTranslate(clean);
        return res.json({ translation, source: 'fallback' });
      }
    }

    // Batch translation of multiple sentences/paragraphs
    if (Array.isArray(texts)) {
      if (texts.length === 0) {
        return res.json({ translations: [] });
      }

      const ai = getGenAI();
      if (ai && texts.length <= 40) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `You are a professional literary translator. Translate this array of English sentences/paragraphs into Simplified Chinese (zh-CN).
Maintain strict 1-to-1 correspondence with the original items.
Input items:
${JSON.stringify(texts)}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: 'The translated Chinese text corresponding to the original index',
                },
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (Array.isArray(parsed) && parsed.length === texts.length) {
              return res.json({ translations: parsed, source: 'gemini' });
            }
          }
        } catch (err: any) {
          console.warn('Batch Gemini translation error, using item fallback:', err.message);
        }
      }

      // Fallback for batch: translate in chunks or parallel
      const translations = await Promise.all(
        texts.map(async (item) => {
          if (!item || !item.trim()) return '';
          return fallbackTranslate(item);
        })
      );
      return res.json({ translations, source: 'fallback' });
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
    const fallbackDef = await fallbackTranslate(word);
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

// API: Check status & AI availability
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
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
      server: { middlewareMode: true },
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
