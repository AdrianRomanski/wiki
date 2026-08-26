import { Book, ReadingLogEntry } from '@wiki/character-domain-models';

const BOOKS_STORAGE_KEY = 'life_forge_books_v1';
const READING_LOGS_STORAGE_KEY = 'life_forge_reading_logs_v1';

export const INITIAL_BOOKS: Book[] = [];


export class BookStorageAdapter {
  loadBooks(): Book[] {
    if (typeof localStorage === 'undefined') {
      return INITIAL_BOOKS;
    }
    try {
      const raw = localStorage.getItem(BOOKS_STORAGE_KEY);
      if (!raw) {
        this.saveBooks(INITIAL_BOOKS);
        return INITIAL_BOOKS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_BOOKS;
    }
  }

  saveBooks(books: Book[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.warn('Failed to save books to LocalStorage:', err);
    }
  }

  loadReadingLogs(): ReadingLogEntry[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(READING_LOGS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveReadingLogs(logs: ReadingLogEntry[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(READING_LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.warn('Failed to save reading logs to LocalStorage:', err);
    }
  }
}
