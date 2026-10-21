import { Bookmark, Note, NoteColor } from '../types/book';
import { authService } from './authService';

const BOOKMARKS_STORAGE_KEY = 'cloud_reader_bookmarks';
const NOTES_STORAGE_KEY = 'cloud_reader_notes';

type BookmarksListener = (bookmarks: Bookmark[]) => void;
type NotesListener = (notes: Note[]) => void;

class NotesService {
  private bookmarks: Bookmark[] = [];
  private notes: Note[] = [];
  private bookmarkListeners: Set<BookmarksListener> = new Set();
  private noteListeners: Set<NotesListener> = new Set();

  constructor() {
    this.loadFromLocal();
  }

  private loadFromLocal() {
    try {
      const bmJson = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (bmJson) this.bookmarks = JSON.parse(bmJson);

      const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
      if (notesJson) this.notes = JSON.parse(notesJson);
    } catch (e) {
      console.warn('Failed to load local bookmarks/notes:', e);
    }
  }

  private saveToLocal() {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(this.bookmarks));
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes));
    } catch (e) {
      console.warn('Failed to save bookmarks/notes locally:', e);
    }
    this.notify();
    this.syncWithCloud();
  }

  private notify() {
    this.bookmarkListeners.forEach((l) => l([...this.bookmarks]));
    this.noteListeners.forEach((l) => l([...this.notes]));
  }

  private async syncWithCloud() {
    if (authService.isLoggedIn()) {
      await authService.pushSync({
        bookmarks: this.bookmarks,
        notes: this.notes,
      });
    }
  }

  public subscribeBookmarks(listener: BookmarksListener): () => void {
    this.bookmarkListeners.add(listener);
    listener([...this.bookmarks]);
    return () => this.bookmarkListeners.delete(listener);
  }

  public subscribeNotes(listener: NotesListener): () => void {
    this.noteListeners.add(listener);
    listener([...this.notes]);
    return () => this.noteListeners.delete(listener);
  }

  public getBookmarks(bookId?: string): Bookmark[] {
    if (!bookId) return [...this.bookmarks];
    return this.bookmarks.filter((b) => b.bookId === bookId);
  }

  public getNotes(bookId?: string): Note[] {
    if (!bookId) return [...this.notes];
    return this.notes.filter((n) => n.bookId === bookId);
  }

  public isBookmarked(bookId: string, chapterIndex: number, paragraphIndex: number): boolean {
    return this.bookmarks.some(
      (b) => b.bookId === bookId && b.chapterIndex === chapterIndex && b.paragraphIndex === paragraphIndex
    );
  }

  public toggleBookmark(
    bookId: string,
    chapterIndex: number,
    paragraphIndex: number,
    chapterTitle: string,
    excerpt: string
  ): boolean {
    const existingIndex = this.bookmarks.findIndex(
      (b) => b.bookId === bookId && b.chapterIndex === chapterIndex && b.paragraphIndex === paragraphIndex
    );

    if (existingIndex !== -1) {
      this.bookmarks.splice(existingIndex, 1);
      this.saveToLocal();
      return false; // Removed
    } else {
      const newBookmark: Bookmark = {
        id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        bookId,
        chapterIndex,
        paragraphIndex,
        chapterTitle,
        excerpt: excerpt.slice(0, 150),
        createdAt: Date.now(),
      };
      this.bookmarks.unshift(newBookmark);
      this.saveToLocal();
      return true; // Added
    }
  }

  public removeBookmark(id: string) {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== id);
    this.saveToLocal();
  }

  public addNote(
    bookId: string,
    chapterIndex: number,
    paragraphIndex: number,
    chapterTitle: string,
    originalText: string,
    noteText: string,
    color: NoteColor = 'amber',
    translatedText?: string
  ): Note {
    const newNote: Note = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      bookId,
      chapterIndex,
      paragraphIndex,
      chapterTitle,
      originalText: originalText.slice(0, 300),
      translatedText: translatedText ? translatedText.slice(0, 300) : undefined,
      noteText: noteText.trim(),
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.notes.unshift(newNote);
    this.saveToLocal();
    return newNote;
  }

  public updateNote(id: string, noteText: string, color?: NoteColor) {
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      note.noteText = noteText.trim();
      if (color) note.color = color;
      note.updatedAt = Date.now();
      this.saveToLocal();
    }
  }

  public deleteNote(id: string) {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.saveToLocal();
  }

  public getParagraphNotes(bookId: string, chapterIndex: number, paragraphIndex: number): Note[] {
    return this.notes.filter(
      (n) => n.bookId === bookId && n.chapterIndex === chapterIndex && n.paragraphIndex === paragraphIndex
    );
  }

  // Merge items coming from cloud sync
  public mergeCloudData(cloudBookmarks: Bookmark[], cloudNotes: Note[]) {
    const bmMap = new Map<string, Bookmark>();
    this.bookmarks.forEach((b) => bmMap.set(b.id, b));
    cloudBookmarks.forEach((b) => bmMap.set(b.id, b));
    this.bookmarks = Array.from(bmMap.values()).sort((a, b) => b.createdAt - a.createdAt);

    const noteMap = new Map<string, Note>();
    this.notes.forEach((n) => noteMap.set(n.id, n));
    cloudNotes.forEach((n) => {
      const existing = noteMap.get(n.id);
      if (!existing || n.updatedAt > existing.updatedAt) {
        noteMap.set(n.id, n);
      }
    });
    this.notes = Array.from(noteMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);

    this.saveToLocal();
  }
}

export const notesService = new NotesService();
