import { describe, expect, it } from 'vitest';
import { BookStateService } from './book-state.service';
import { CharacterStateService } from './character-state.service';

describe('BookStateService', () => {
  it('should initialize with an empty book list by default', () => {
    const service = new BookStateService();
    expect(service.books().length).toBe(0);
    expect(service.currentlyReadingBooks().length).toBe(0);
  });

  it('should add a new book to reading shelf', () => {
    const service = new BookStateService();
    const newBook = service.addBook({
      title: 'Domain-Driven Design',
      author: 'Eric Evans',
      totalPages: 500,
      initialPage: 10,
    });

    expect(newBook.title).toBe('Domain-Driven Design');
    expect(newBook.currentPage).toBe(10);
    expect(newBook.status).toBe('reading');
    expect(service.books()).toContainEqual(expect.objectContaining({ title: 'Domain-Driven Design' }));
  });

  it('should log a reading session and award XP to character', () => {
    const characterState = new CharacterStateService();
    const service = new BookStateService(characterState);

    const addedBook = service.addBook({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      totalPages: 300,
      initialPage: 20,
    });

    const initialWisXp = characterState.character().attributes.wisdom;
    const initialDisXp = characterState.character().attributes.discipline;

    const evaluation = service.logReadingSession(addedBook.id, 50);

    expect(evaluation.canClaim).toBe(true);
    expect(evaluation.pagesRead).toBe(30);

    const updatedWisXp = characterState.character().attributes.wisdom;
    const updatedDisXp = characterState.character().attributes.discipline;

    expect(updatedWisXp).toBeGreaterThan(initialWisXp);
    expect(updatedDisXp).toBeGreaterThan(initialDisXp);
  });

  it('ADR-0013: should complete reading quest using pagesReadThisDay inline payload in 1-click', () => {
    const characterState = new CharacterStateService();
    const service = new BookStateService(characterState);

    const addedBook = service.addBook({
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      totalPages: 600,
      initialPage: 100,
    });

    const evaluation = service.completeReadingQuest({
      bookId: addedBook.id,
      pagesReadThisDay: 20,
      notes: 'LSM-Trees vs B-Trees trade-offs',
    });

    expect(evaluation.canClaim).toBe(true);
    expect(evaluation.pagesRead).toBe(20);
    expect(evaluation.updatedBook?.currentPage).toBe(120);
    expect(evaluation.updatedBook?.notes).toBe('LSM-Trees vs B-Trees trade-offs');

    const updatedBookInList = service.books().find((b) => b.id === addedBook.id);
    expect(updatedBookInList?.currentPage).toBe(120);

    const lastLog = service.readingLogs()[0];
    expect(lastLog.pagesRead).toBe(20);
    expect(lastLog.startPage).toBe(100);
    expect(lastLog.endPage).toBe(120);
  });
});
