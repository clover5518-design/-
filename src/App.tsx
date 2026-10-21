import React, { useState, useEffect, useCallback } from 'react';
import {
  Book,
  Bookmark,
  Note,
  Paragraph,
  ReadingSettings,
  User,
} from './types/book';
import { SAMPLE_BOOKS } from './services/sampleBooks';
import {
  deleteBookFromStorage,
  getAllBooks,
  getStoredSetting,
  saveBook,
  saveStoredSetting,
} from './services/storage';
import { authService } from './services/authService';
import { notesService } from './services/notesService';
import {
  translateParagraphsBatch,
  translateSingleText,
} from './services/translateService';
import { ttsService } from './services/ttsService';

import { MobileShell } from './components/MobileShell';
import { Bookshelf } from './components/Bookshelf';
import { ReaderNavbar } from './components/ReaderNavbar';
import { ReaderContent } from './components/ReaderContent';
import { TtsPlayerBar } from './components/TtsPlayerBar';
import { SettingsModal } from './components/SettingsModal';
import { TocDrawer } from './components/TocDrawer';
import { BookmarksNotesDrawer } from './components/BookmarksNotesDrawer';
import { AuthModal } from './components/AuthModal';
import { WordLookupModal } from './components/WordLookupModal';
import { AddNoteModal } from './components/AddNoteModal';
import { ApkInstallModal } from './components/ApkInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const DEFAULT_SETTINGS: ReadingSettings = {
  theme: 'sepia',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  layoutMode: 'bilingual',
  margin: 'normal',
  paragraphSpacing: 16,
  autoScroll: true,
};

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);

  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getUser());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isApkOpen, setIsApkOpen] = useState(false);
  const [lookupWordData, setLookupWordData] = useState<{ word: string; sentence: string } | null>(null);
  const [addNoteData, setAddNoteData] = useState<{ paragraph: Paragraph; index: number } | null>(null);

  const [isTranslatingChapter, setIsTranslatingChapter] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<{ done: number; total: number } | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Initialize books & settings
  useEffect(() => {
    async function init() {
      // Load saved settings
      const savedSettings = await getStoredSetting<ReadingSettings>('reader_settings', DEFAULT_SETTINGS);
      setSettings(savedSettings);

      // Load books from IndexedDB
      let loadedBooks = await getAllBooks();
      if (loadedBooks.length === 0) {
        // Seed sample classic books
        for (const sb of SAMPLE_BOOKS) {
          await saveBook(sb);
        }
        loadedBooks = SAMPLE_BOOKS;
      }
      setBooks(loadedBooks);
    }
    init();
  }, []);

  // Subscriptions for auth, sync, bookmarks, notes, TTS
  useEffect(() => {
    const unsubAuth = authService.subscribeAuth((u) => setCurrentUser(u));
    const unsubSync = authService.subscribeSync((status) => setSyncStatus(status));
    const unsubBm = notesService.subscribeBookmarks((bms) => setBookmarks(bms));
    const unsubNotes = notesService.subscribeNotes((ns) => setNotes(ns));
    const unsubTts = ttsService.subscribe((state) => {
      setTtsPlaying(state.isPlaying);
      if (state.currentParagraphIndex !== currentParagraphIndex) {
        setCurrentParagraphIndex(state.currentParagraphIndex);
      }
    });

    return () => {
      unsubAuth();
      unsubSync();
      unsubBm();
      unsubNotes();
      unsubTts();
    };
  }, [currentParagraphIndex]);

  // Save book progress when chapter or paragraph changes
  const saveProgress = useCallback(
    (book: Book, chapIdx: number, paraIdx: number) => {
      const updated: Book = {
        ...book,
        currentChapterIndex: chapIdx,
        currentParagraphIndex: paraIdx,
        lastReadAt: Date.now(),
      };
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      saveBook(updated);

      // Trigger cloud sync
      if (authService.isLoggedIn()) {
        const percent = Math.round(((chapIdx + 1) / (updated.chapters.length || 1)) * 100);
        authService.pushSync({
          progressList: [
            {
              bookId: updated.id,
              chapterIndex: chapIdx,
              paragraphIndex: paraIdx,
              chapterTitle: updated.chapters[chapIdx]?.title || '',
              percent,
              updatedAt: Date.now(),
            },
          ],
        });
      }
    },
    []
  );

  // Open book
  const handleSelectBook = (book: Book) => {
    setCurrentBook(book);
    setCurrentChapterIndex(book.currentChapterIndex || 0);
    setCurrentParagraphIndex(book.currentParagraphIndex || 0);
  };

  // Add newly uploaded book
  const handleAddBook = async (newBook: Book) => {
    await saveBook(newBook);
    setBooks((prev) => [newBook, ...prev]);
    handleSelectBook(newBook);
  };

  // Delete book
  const handleDeleteBook = async (bookId: string) => {
    await deleteBookFromStorage(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (currentBook?.id === bookId) {
      setCurrentBook(null);
      ttsService.stop();
    }
  };

  // Reset sample books
  const handleResetSamples = async () => {
    for (const sb of SAMPLE_BOOKS) {
      await saveBook(sb);
    }
    const all = await getAllBooks();
    setBooks(all);
  };

  // Update Settings
  const handleUpdateSettings = (updated: Partial<ReadingSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    saveStoredSetting('reader_settings', next);
    if (authService.isLoggedIn()) {
      authService.pushSync({ settings: next });
    }
  };

  // Switch chapters
  const handleSelectChapter = (chapIdx: number) => {
    if (!currentBook) return;
    setCurrentChapterIndex(chapIdx);
    setCurrentParagraphIndex(0);
    saveProgress(currentBook, chapIdx, 0);
    ttsService.stop();
  };

  // Single paragraph translation
  const handleTranslateParagraph = async (index: number) => {
    if (!currentBook) return;
    const currentChapter = currentBook.chapters[currentChapterIndex];
    if (!currentChapter) return;

    const targetPara = currentChapter.paragraphs[index];
    if (!targetPara) return;

    // Set translating flag
    const updatedParas = [...currentChapter.paragraphs];
    updatedParas[index] = { ...targetPara, translating: true };
    const updatedBook = {
      ...currentBook,
      chapters: currentBook.chapters.map((c, i) =>
        i === currentChapterIndex ? { ...c, paragraphs: updatedParas } : c
      ),
    };
    setCurrentBook(updatedBook);

    try {
      const translation = await translateSingleText(targetPara.original, currentChapter.title);
      updatedParas[index] = { ...targetPara, translation, translating: false };
      const finalizedBook = {
        ...currentBook,
        chapters: currentBook.chapters.map((c, i) =>
          i === currentChapterIndex ? { ...c, paragraphs: updatedParas } : c
        ),
      };
      setCurrentBook(finalizedBook);
      saveBook(finalizedBook);
    } catch (e) {
      updatedParas[index] = { ...targetPara, translating: false };
      setCurrentBook({
        ...currentBook,
        chapters: currentBook.chapters.map((c, i) =>
          i === currentChapterIndex ? { ...c, paragraphs: updatedParas } : c
        ),
      });
    }
  };

  // Batch translate entire current chapter (utilizing Android 16/S24 on-device acceleration)
  const handleTranslateCurrentChapter = async () => {
    if (!currentBook || isTranslatingChapter) return;
    const currentChapter = currentBook.chapters[currentChapterIndex];
    if (!currentChapter) return;

    setIsTranslatingChapter(true);
    setTranslateProgress({ done: 0, total: currentChapter.paragraphs.length });

    try {
      const translatedParas = await translateParagraphsBatch(
        currentChapter.paragraphs,
        (done, total) => {
          setTranslateProgress({ done, total });
        }
      );
      const updatedBook: Book = {
        ...currentBook,
        chapters: currentBook.chapters.map((c, i) =>
          i === currentChapterIndex ? { ...c, paragraphs: translatedParas } : c
        ),
      };
      setCurrentBook(updatedBook);
      await saveBook(updatedBook);
    } catch (err) {
      console.error('Batch translate error:', err);
    } finally {
      setIsTranslatingChapter(false);
      setTimeout(() => setTranslateProgress(null), 1500);
    }
  };

  // Play from specific paragraph
  const handlePlayFromParagraph = (index: number) => {
    setCurrentParagraphIndex(index);
    ttsService.jumpTo(index);
    ttsService.play();
  };

  // Toggle bookmark for paragraph
  const handleToggleBookmark = (paraIdx?: number, excerptText?: string) => {
    if (!currentBook) return;
    const currentChapter = currentBook.chapters[currentChapterIndex];
    const idx = paraIdx !== undefined ? paraIdx : currentParagraphIndex;
    const excerpt = excerptText || currentChapter?.paragraphs[idx]?.original || currentChapter?.title || '';

    notesService.toggleBookmark(
      currentBook.id,
      currentChapterIndex,
      idx,
      currentChapter?.title || '第 ' + (currentChapterIndex + 1) + ' 章',
      excerpt
    );
  };

  // Cloud sync pulled data callback
  const handleSyncCompleted = () => {
    // Reload bookmarks and notes from sync store
    authService.pullSync().then((data) => {
      if (data) {
        if (data.bookmarks && data.notes) {
          notesService.mergeCloudData(data.bookmarks, data.notes);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        // Update reading progress for current book if cloud is further
        if (currentBook && data.progressList) {
          const cloudRecord = data.progressList.find((p) => p.bookId === currentBook.id);
          if (cloudRecord && cloudRecord.chapterIndex !== undefined) {
            setCurrentChapterIndex(cloudRecord.chapterIndex);
            setCurrentParagraphIndex(cloudRecord.paragraphIndex || 0);
          }
        }
      }
    });
  };

  const currentChapter = currentBook?.chapters[currentChapterIndex];
  const isCurrentParaBookmarked = currentBook
    ? notesService.isBookmarked(currentBook.id, currentChapterIndex, currentParagraphIndex)
    : false;

  // Detect if the current book / chapter is in Chinese
  const isCurrentBookChinese = React.useMemo(() => {
    if (!currentBook) return false;
    const chap = currentBook.chapters[currentChapterIndex];
    if (!chap || chap.paragraphs.length === 0) return false;
    const sample = chap.paragraphs.slice(0, 15).map((p) => p.original).join('');
    const chineseChars = sample.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseChars.length >= 6 || (chineseChars.length / (sample.replace(/\s+/g, '').length || 1) > 0.12);
  }, [currentBook, currentChapterIndex]);

  return (
    <MobileShell>
      {!currentBook ? (
        /* Bookshelf View */
        <Bookshelf
          books={books}
          currentUser={currentUser}
          syncStatus={syncStatus}
          onSelectBook={handleSelectBook}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          onOpenAuth={() => setIsAuthOpen(true)}
          onResetSamples={handleResetSamples}
          onOpenApkModal={() => setIsApkOpen(true)}
        />
      ) : (
        /* Active Reading View */
        <div className="relative min-h-screen bg-stone-950">
          {/* Top Navbar */}
          <ReaderNavbar
            bookTitle={currentBook.title}
            chapterTitle={currentChapter?.title || '正文'}
            chapterIndex={currentChapterIndex}
            totalChapters={currentBook.chapters.length}
            isBookmarked={isCurrentParaBookmarked}
            notesCount={notes.filter((n) => n.bookId === currentBook.id).length}
            bookmarksCount={bookmarks.filter((b) => b.bookId === currentBook.id).length}
            currentUser={currentUser}
            syncStatus={syncStatus}
            isTranslatingChapter={isTranslatingChapter}
            isChineseBook={isCurrentBookChinese}
            translateProgress={translateProgress}
            onBack={() => {
              ttsService.stop();
              setCurrentBook(null);
            }}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleBookmark={() => handleToggleBookmark()}
            onOpenNotes={() => setIsNotesOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onTranslateChapter={handleTranslateCurrentChapter}
            onOpenApkModal={() => setIsApkOpen(true)}
          />

          {/* Reading Canvas & Content */}
          <ReaderContent
            paragraphs={currentChapter?.paragraphs || []}
            chapterTitle={currentChapter?.title || '正文'}
            chapterIndex={currentChapterIndex}
            totalChapters={currentBook.chapters.length}
            settings={settings}
            activeParagraphIndex={currentParagraphIndex}
            isPlaying={ttsPlaying}
            bookmarks={bookmarks}
            notes={notes}
            bookId={currentBook.id}
            isChineseBook={isCurrentBookChinese}
            onTranslateChapter={handleTranslateCurrentChapter}
            isTranslatingChapter={isTranslatingChapter}
            translateProgress={translateProgress}
            onPlayFromParagraph={handlePlayFromParagraph}
            onToggleBookmark={(idx, excerpt) => handleToggleBookmark(idx, excerpt)}
            onAddNote={(idx, paragraph) => setAddNoteData({ paragraph, index: idx })}
            onTranslateParagraph={handleTranslateParagraph}
            onLookupWord={(word, sentence) => setLookupWordData({ word, sentence })}
            onPrevChapter={() => {
              if (currentChapterIndex > 0) {
                handleSelectChapter(currentChapterIndex - 1);
              }
            }}
            onNextChapter={() => {
              if (currentChapterIndex < currentBook.chapters.length - 1) {
                handleSelectChapter(currentChapterIndex + 1);
              }
            }}
          />

          {/* Floating TTS Audio Player Bar */}
          <TtsPlayerBar
            paragraphs={currentChapter?.paragraphs || []}
            currentParagraphIndex={currentParagraphIndex}
            bookTitle={currentBook.title}
            chapterTitle={currentChapter?.title || '正文'}
            onParagraphChange={(idx) => {
              setCurrentParagraphIndex(idx);
              saveProgress(currentBook, currentChapterIndex, idx);
            }}
          />
        </div>
      )}

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdate={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
        isChineseBook={isCurrentBookChinese}
        onOpenApkModal={() => setIsApkOpen(true)}
      />

      {currentBook && (
        <TocDrawer
          isOpen={isTocOpen}
          onClose={() => setIsTocOpen(false)}
          chapters={currentBook.chapters}
          currentChapterIndex={currentChapterIndex}
          onSelectChapter={handleSelectChapter}
          bookTitle={currentBook.title}
        />
      )}

      {currentBook && (
        <BookmarksNotesDrawer
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          bookId={currentBook.id}
          bookTitle={currentBook.title}
          bookmarks={bookmarks}
          notes={notes}
          onNavigate={(chapIdx, paraIdx) => {
            if (chapIdx !== currentChapterIndex) {
              handleSelectChapter(chapIdx);
            }
            setCurrentParagraphIndex(paraIdx);
            ttsService.jumpTo(paraIdx);
          }}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSyncCompleted={handleSyncCompleted}
      />

      <WordLookupModal
        word={lookupWordData?.word || null}
        sentence={lookupWordData?.sentence}
        onClose={() => setLookupWordData(null)}
      />

      {currentBook && addNoteData && (
        <AddNoteModal
          isOpen={Boolean(addNoteData)}
          onClose={() => setAddNoteData(null)}
          bookId={currentBook.id}
          chapterIndex={currentChapterIndex}
          paragraphIndex={addNoteData.index}
          chapterTitle={currentChapter?.title || '第 ' + (currentChapterIndex + 1) + ' 章'}
          paragraph={addNoteData.paragraph}
        />
      )}

      {/* Mobile APK Generation & Installation Modal */}
      <ApkInstallModal
        isOpen={isApkOpen}
        onClose={() => setIsApkOpen(false)}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </MobileShell>
  );
}
