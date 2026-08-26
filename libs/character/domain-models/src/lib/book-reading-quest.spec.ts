import {
  Book,
  evaluateBookReadingQuest,
  filterCompletedBooksByMonth,
} from './book-reading-quest.model';

describe('BookReadingQuest Domain Model', () => {
  const sampleBook: Book = {
    id: 'book-1',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    totalPages: 300,
    currentPage: 50,
    status: 'reading',
    addedAt: '2026-08-01T10:00:00.000Z',
  };

  it('should calculate reading progress and award base XP correctly', () => {
    const testDate = new Date('2026-08-26T15:00:00.000Z');
    const result = evaluateBookReadingQuest(sampleBook, 100, testDate);

    expect(result.canClaim).toBe(true);
    expect(result.pagesRead).toBe(50);
    expect(result.isBookCompleted).toBe(false);
    expect(result.rewards).toHaveLength(2);
    expect(result.rewards[0]).toEqual({
      amount: 40,
      statCategory: 'wisdom',
      sourceDescription: 'Daily Reading Quest: Read 50 pages of "Clean Architecture"',
    });
    expect(result.rewards[1]).toEqual({
      amount: 10,
      statCategory: 'discipline',
      sourceDescription: 'Daily Reading Consistency: Progress on "Clean Architecture"',
    });
    expect(result.updatedBook?.currentPage).toBe(100);
    expect(result.updatedBook?.status).toBe('reading');
    expect(result.updatedBook?.lastReadAt).toBe(testDate.toISOString());
  });

  it('should award completion bonus XP and transition status to completed when total pages reached', () => {
    const testDate = new Date('2026-08-26T15:00:00.000Z');
    const result = evaluateBookReadingQuest(sampleBook, 300, testDate);

    expect(result.canClaim).toBe(true);
    expect(result.isBookCompleted).toBe(true);
    expect(result.rewards).toHaveLength(3);
    expect(result.rewards[2]).toEqual({
      amount: 200,
      statCategory: 'wisdom',
      sourceDescription: '🎉 Completed Book Bonus: "Clean Architecture" (300 pages)',
    });
    expect(result.updatedBook?.currentPage).toBe(300);
    expect(result.updatedBook?.status).toBe('completed');
    expect(result.updatedBook?.completedAt).toBe(testDate.toISOString());
  });

  it('should reject invalid end page inputs', () => {
    const lesserResult = evaluateBookReadingQuest(sampleBook, 40);
    expect(lesserResult.canClaim).toBe(false);
    expect(lesserResult.message).toContain('greater than current page');

    const excessiveResult = evaluateBookReadingQuest(sampleBook, 350);
    expect(excessiveResult.canClaim).toBe(false);
    expect(excessiveResult.message).toContain('cannot exceed total pages');
  });

  it('should filter completed books by month correctly', () => {
    const books: Book[] = [
      {
        id: 'b1',
        title: 'Book One',
        author: 'Author A',
        totalPages: 200,
        currentPage: 200,
        status: 'completed',
        addedAt: '2026-07-01T00:00:00.000Z',
        completedAt: '2026-08-15T10:00:00.000Z',
      },
      {
        id: 'b2',
        title: 'Book Two',
        author: 'Author B',
        totalPages: 150,
        currentPage: 150,
        status: 'completed',
        addedAt: '2026-06-01T00:00:00.000Z',
        completedAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'b3',
        title: 'Book Three',
        author: 'Author C',
        totalPages: 100,
        currentPage: 50,
        status: 'reading',
        addedAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    const augBooks = filterCompletedBooksByMonth(books, 2026, 8);
    expect(augBooks).toHaveLength(1);
    expect(augBooks[0].id).toBe('b1');

    const julBooks = filterCompletedBooksByMonth(books, 2026, 7);
    expect(julBooks).toHaveLength(1);
    expect(julBooks[0].id).toBe('b2');
  });
});
