import { describe, it, expect } from 'vitest';
import { handleListPages } from '../tools/list-pages';
import { WikiIndex, PageMeta } from '../types';

function createPageMeta(overrides: Partial<PageMeta> & { title: string }): PageMeta {
  return {
    type: 'entity',
    tags: [],
    created: '2024-01-01',
    updated: '2024-01-02',
    filePath: `entities/${overrides.title.toLowerCase().replace(/\s+/g, '-')}.md`,
    outgoingLinks: [],
    ...overrides,
  };
}

function buildTestIndex(pages: PageMeta[]): WikiIndex {
  const pagesMap = new Map<string, PageMeta>();
  for (const page of pages) {
    pagesMap.set(page.title.toLowerCase(), page);
  }
  return {
    pages: pagesMap,
    backlinks: new Map(),
    tags: new Map(),
  };
}

describe('handleListPages', () => {
  describe('no filters', () => {
    it('returns all pages when no filters are applied', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework'] }),
        createPageMeta({ title: 'Dependency Injection', type: 'concept', tags: ['pattern'] }),
        createPageMeta({ title: 'Angular Docs', type: 'source', tags: ['documentation'] }),
      ]);

      const result = handleListPages(index, {});

      expect(result.pages).toHaveLength(3);
    });

    it('returns empty array for empty index', () => {
      const index = buildTestIndex([]);

      const result = handleListPages(index, {});

      expect(result.pages).toEqual([]);
    });
  });

  describe('type filter', () => {
    it('returns only pages matching the specified type', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework'] }),
        createPageMeta({ title: 'React', type: 'entity', tags: ['framework'] }),
        createPageMeta({ title: 'DI', type: 'concept', tags: ['pattern'] }),
        createPageMeta({ title: 'Article', type: 'source', tags: ['article'] }),
      ]);

      const result = handleListPages(index, { type: 'entity' });

      expect(result.pages).toHaveLength(2);
      expect(result.pages.every((p) => p.type === 'entity')).toBe(true);
    });

    it('returns empty array when no pages match the type', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity' }),
      ]);

      const result = handleListPages(index, { type: 'source' });

      expect(result.pages).toEqual([]);
    });
  });

  describe('tag filter', () => {
    it('returns only pages containing the specified tag', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework', 'frontend'] }),
        createPageMeta({ title: 'React', type: 'entity', tags: ['framework', 'frontend'] }),
        createPageMeta({ title: 'DI', type: 'concept', tags: ['pattern'] }),
      ]);

      const result = handleListPages(index, { tag: 'pattern' });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('DI');
    });

    it('performs case-insensitive tag matching', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['Framework'] }),
        createPageMeta({ title: 'DI', type: 'concept', tags: ['pattern'] }),
      ]);

      const result = handleListPages(index, { tag: 'framework' });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('Angular');
    });

    it('returns empty array when no pages have the tag', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework'] }),
      ]);

      const result = handleListPages(index, { tag: 'nonexistent' });

      expect(result.pages).toEqual([]);
    });
  });

  describe('combined filters (AND logic)', () => {
    it('applies both type and tag filters together', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework', 'frontend'] }),
        createPageMeta({ title: 'React', type: 'entity', tags: ['framework', 'frontend'] }),
        createPageMeta({ title: 'MVC', type: 'concept', tags: ['framework', 'pattern'] }),
        createPageMeta({ title: 'DI', type: 'concept', tags: ['pattern'] }),
      ]);

      const result = handleListPages(index, { type: 'concept', tag: 'framework' });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('MVC');
    });

    it('returns empty when type matches but tag does not', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework'] }),
      ]);

      const result = handleListPages(index, { type: 'entity', tag: 'nonexistent' });

      expect(result.pages).toEqual([]);
    });
  });

  describe('sorting', () => {
    it('sorts results alphabetically by title (case-insensitive)', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Zebra', type: 'entity' }),
        createPageMeta({ title: 'apple', type: 'entity' }),
        createPageMeta({ title: 'Banana', type: 'entity' }),
        createPageMeta({ title: 'cherry', type: 'entity' }),
      ]);

      const result = handleListPages(index, {});

      const titles = result.pages.map((p) => p.title);
      expect(titles).toEqual(['apple', 'Banana', 'cherry', 'Zebra']);
    });

    it('sorts filtered results alphabetically', () => {
      const index = buildTestIndex([
        createPageMeta({ title: 'Zod', type: 'entity', tags: ['validation'] }),
        createPageMeta({ title: 'Angular', type: 'entity', tags: ['framework'] }),
        createPageMeta({ title: 'Yup', type: 'entity', tags: ['validation'] }),
      ]);

      const result = handleListPages(index, { tag: 'validation' });

      const titles = result.pages.map((p) => p.title);
      expect(titles).toEqual(['Yup', 'Zod']);
    });
  });

  describe('result shape', () => {
    it('returns correct fields for each page', () => {
      const index = buildTestIndex([
        createPageMeta({
          title: 'Angular',
          type: 'entity',
          tags: ['framework', 'frontend'],
          filePath: 'entities/angular.md',
        }),
      ]);

      const result = handleListPages(index, {});

      expect(result.pages[0]).toEqual({
        title: 'Angular',
        type: 'entity',
        tags: ['framework', 'frontend'],
        filePath: 'entities/angular.md',
      });
    });

    it('does not include extra fields like outgoingLinks', () => {
      const index = buildTestIndex([
        createPageMeta({
          title: 'Angular',
          type: 'entity',
          outgoingLinks: ['React', 'DI'],
        }),
      ]);

      const result = handleListPages(index, {});

      expect(result.pages[0]).not.toHaveProperty('outgoingLinks');
      expect(result.pages[0]).not.toHaveProperty('created');
      expect(result.pages[0]).not.toHaveProperty('updated');
    });
  });
});
