import { XpReward } from './character.model';

export type BookStatus = 'reading' | 'completed' | 'paused';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastReadAt?: string;
  notes?: string;
}

export interface ReadingLogEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  date: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  xpAwarded: number;
  timestamp: string;
}

export interface BookReadingQuestEvaluation {
  canClaim: boolean;
  message: string;
  pagesRead: number;
  isBookCompleted: boolean;
  rewards: XpReward[];
  updatedBook?: Book;
}

export const DAILY_READING_BASE_XP = 40;
export const DAILY_READING_DISCIPLINE_XP = 10;
export const BOOK_COMPLETION_BONUS_XP = 200;

export function evaluateBookReadingQuest(
  book: Book,
  endPage: number,
  now: Date = new Date()
): BookReadingQuestEvaluation {
  if (!book) {
    return {
      canClaim: false,
      message: 'No book selected for reading quest.',
      pagesRead: 0,
      isBookCompleted: false,
      rewards: [],
    };
  }

  if (book.status === 'completed' || book.currentPage >= book.totalPages) {
    return {
      canClaim: false,
      message: `"${book.title}" is already completed!`,
      pagesRead: 0,
      isBookCompleted: true,
      rewards: [],
    };
  }

  if (endPage <= book.currentPage) {
    return {
      canClaim: false,
      message: `End page (${endPage}) must be greater than current page (${book.currentPage}).`,
      pagesRead: 0,
      isBookCompleted: false,
      rewards: [],
    };
  }

  if (endPage > book.totalPages) {
    return {
      canClaim: false,
      message: `End page (${endPage}) cannot exceed total pages (${book.totalPages}).`,
      pagesRead: 0,
      isBookCompleted: false,
      rewards: [],
    };
  }

  const pagesRead = endPage - book.currentPage;
  const isBookCompleted = endPage === book.totalPages;
  const timestamp = now.toISOString();

  const rewards: XpReward[] = [
    {
      amount: DAILY_READING_BASE_XP,
      statCategory: 'wisdom',
      sourceDescription: `Daily Reading Quest: Read ${pagesRead} pages of "${book.title}"`,
    },
    {
      amount: DAILY_READING_DISCIPLINE_XP,
      statCategory: 'discipline',
      sourceDescription: `Daily Reading Consistency: Progress on "${book.title}"`,
    },
  ];

  if (isBookCompleted) {
    rewards.push({
      amount: BOOK_COMPLETION_BONUS_XP,
      statCategory: 'wisdom',
      sourceDescription: `🎉 Completed Book Bonus: "${book.title}" (${book.totalPages} pages)`,
    });
  }

  const updatedBook: Book = {
    ...book,
    currentPage: endPage,
    lastReadAt: timestamp,
    status: isBookCompleted ? 'completed' : book.status,
    completedAt: isBookCompleted ? timestamp : book.completedAt,
  };

  const message = isBookCompleted
    ? `🏆 Congratulations! You finished "${book.title}" (+${DAILY_READING_BASE_XP + BOOK_COMPLETION_BONUS_XP} WIS XP, +${DAILY_READING_DISCIPLINE_XP} DIS XP)!`
    : `📖 Daily Reading Quest complete! Advanced to page ${endPage}/${book.totalPages} (+${DAILY_READING_BASE_XP} WIS XP, +${DAILY_READING_DISCIPLINE_XP} DIS XP).`;

  return {
    canClaim: true,
    message,
    pagesRead,
    isBookCompleted,
    rewards,
    updatedBook,
  };
}

export function filterCompletedBooksByMonth(
  books: Book[],
  year: number,
  month: number
): Book[] {
  return books.filter((b) => {
    if (b.status !== 'completed' || !b.completedAt) {
      return false;
    }
    const completedDate = new Date(b.completedAt);
    return (
      completedDate.getFullYear() === year &&
      completedDate.getMonth() + 1 === month
    );
  });
}
