import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Book,
  BookReadingQuestEvaluation,
  BookStatus,
  evaluateBookReadingQuest,
  filterCompletedBooksByMonth,
  ReadingLogEntry,
} from '@wiki/character-domain-models';
import { BookStorageAdapter } from './book-storage.adapter';
import { CharacterStateService } from './character-state.service';

@Injectable({
  providedIn: 'root',
})
export class BookStateService {
  private readonly storageAdapter = new BookStorageAdapter();
  private readonly characterState: CharacterStateService;

  readonly books = signal<Book[]>(this.storageAdapter.loadBooks());
  readonly readingLogs = signal<ReadingLogEntry[]>(this.storageAdapter.loadReadingLogs());

  constructor(customCharacterState?: CharacterStateService) {
    if (customCharacterState) {
      this.characterState = customCharacterState;
    } else {
      try {
        this.characterState = inject(CharacterStateService);
      } catch {
        this.characterState = new CharacterStateService();
      }
    }
  }

  readonly currentlyReadingBooks = computed(() =>
    this.books().filter((b) => b.status === 'reading')
  );

  readonly completedBooks = computed(() =>
    this.books().filter((b) => b.status === 'completed')
  );

  addBook(data: {
    title: string;
    author: string;
    totalPages: number;
    initialPage?: number;
    notes?: string;
  }): Book {
    const now = new Date().toISOString();
    const currentPage = Math.min(
      Math.max(0, data.initialPage || 0),
      data.totalPages
    );
    const isCompleted = currentPage >= data.totalPages && data.totalPages > 0;

    const newBook: Book = {
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title.trim(),
      author: data.author.trim(),
      totalPages: Math.max(1, data.totalPages),
      currentPage,
      status: isCompleted ? 'completed' : 'reading',
      addedAt: now,
      startedAt: now,
      completedAt: isCompleted ? now : undefined,
      notes: data.notes?.trim(),
    };

    const updated = [newBook, ...this.books()];
    this.books.set(updated);
    this.storageAdapter.saveBooks(updated);

    return newBook;
  }

  logReadingSession(
    bookId: string,
    finishedPage: number
  ): BookReadingQuestEvaluation {
    const targetBook = this.books().find((b) => b.id === bookId);
    if (!targetBook) {
      return {
        canClaim: false,
        message: 'Selected book could not be found.',
        pagesRead: 0,
        isBookCompleted: false,
        rewards: [],
      };
    }

    const evaluation = evaluateBookReadingQuest(targetBook, finishedPage);

    if (evaluation.canClaim && evaluation.updatedBook) {
      const updatedBooks = this.books().map((b) =>
        b.id === bookId && evaluation.updatedBook ? evaluation.updatedBook : b
      );
      this.books.set(updatedBooks);
      this.storageAdapter.saveBooks(updatedBooks);

      const logEntry: ReadingLogEntry = {
        id: `log-${Date.now()}`,
        bookId: targetBook.id,
        bookTitle: targetBook.title,
        date: new Date().toISOString().split('T')[0],
        startPage: targetBook.currentPage,
        endPage: finishedPage,
        pagesRead: evaluation.pagesRead,
        xpAwarded: evaluation.rewards.reduce((acc, r) => acc + r.amount, 0),
        timestamp: new Date().toISOString(),
      };
      const updatedLogs = [logEntry, ...this.readingLogs()];
      this.readingLogs.set(updatedLogs);
      this.storageAdapter.saveReadingLogs(updatedLogs);

      for (const reward of evaluation.rewards) {
        this.characterState.awardXp(reward, 'BOOK_READING_QUEST', targetBook.id);
      }
    }

    return evaluation;
  }

  updateBookStatus(bookId: string, status: BookStatus): void {
    const now = new Date().toISOString();
    const updatedBooks = this.books().map((b) => {
      if (b.id !== bookId) return b;
      return {
        ...b,
        status,
        completedAt: status === 'completed' ? b.completedAt || now : b.completedAt,
      };
    });
    this.books.set(updatedBooks);
    this.storageAdapter.saveBooks(updatedBooks);
  }

  getCompletedBooksForMonth(year: number, month: number): Book[] {
    return filterCompletedBooksByMonth(this.books(), year, month);
  }
}
