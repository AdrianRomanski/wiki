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
});
