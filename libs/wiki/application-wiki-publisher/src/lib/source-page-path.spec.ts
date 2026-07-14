/**
 * Unit tests for source page path construction
 * Feature: article-research-session, scripts-migration-hexagonal
 *
 * Migrated from scripts/research-workflow/wiki-publisher/source-page-path.test.ts
 *
 * `constructSourcePagePath` is pure and its signature is unchanged by the
 * migration, so this spec is a straight import-path migration.
 */

import { describe, it, expect } from 'vitest';
import { constructSourcePagePath } from './source-page-path';

describe('constructSourcePagePath', () => {
  describe('basic path construction', () => {
    it('constructs path from simple article title and date', () => {
      const result = constructSourcePagePath('Angular Signals', '2024-05-15');
      expect(result).toBe('wiki/sources/angular-signals-article-2024-05-15.md');
    });

    it('constructs path from multi-word title', () => {
      const result = constructSourcePagePath(
        'Understanding Reactive Programming in Angular',
        '2025-01-20'
      );
      expect(result).toBe(
        'wiki/sources/understanding-reactive-programming-in-angular-article-2025-01-20.md'
      );
    });

    it('constructs path from single-word title', () => {
      const result = constructSourcePagePath('RxJS', '2024-12-01');
      expect(result).toBe('wiki/sources/rxjs-article-2024-12-01.md');
    });
  });

  describe('slug generation (kebab-case conversion)', () => {
    it('lowercases the title', () => {
      const result = constructSourcePagePath('UPPERCASE TITLE', '2024-01-01');
      expect(result).toBe('wiki/sources/uppercase-title-article-2024-01-01.md');
    });

    it('replaces special characters with hyphens', () => {
      const result = constructSourcePagePath('Angular: A Deep Dive!', '2024-06-15');
      expect(result).toBe('wiki/sources/angular-a-deep-dive-article-2024-06-15.md');
    });

    it('handles unicode characters', () => {
      const result = constructSourcePagePath('Café Résumé', '2024-03-10');
      expect(result).toBe('wiki/sources/cafe-resume-article-2024-03-10.md');
    });

    it('collapses consecutive hyphens', () => {
      const result = constructSourcePagePath('Angular --- Signals', '2024-05-15');
      expect(result).toBe('wiki/sources/angular-signals-article-2024-05-15.md');
    });

    it('strips leading and trailing hyphens from slug', () => {
      const result = constructSourcePagePath('--Leading and Trailing--', '2024-05-15');
      expect(result).toBe('wiki/sources/leading-and-trailing-article-2024-05-15.md');
    });
  });

  describe('path format validation', () => {
    it('always starts with wiki/sources/', () => {
      const result = constructSourcePagePath('Any Title', '2024-01-01');
      expect(result.startsWith('wiki/sources/')).toBe(true);
    });

    it('always ends with .md', () => {
      const result = constructSourcePagePath('Any Title', '2024-01-01');
      expect(result.endsWith('.md')).toBe(true);
    });

    it('contains -article- between slug and date', () => {
      const result = constructSourcePagePath('Test Article', '2024-07-22');
      expect(result).toContain('-article-');
    });

    it('matches the full expected pattern', () => {
      const result = constructSourcePagePath('My Blog Post', '2024-11-30');
      expect(result).toMatch(/^wiki\/sources\/[a-z0-9-]+-article-\d{4}-\d{2}-\d{2}\.md$/);
    });
  });

  describe('error handling', () => {
    it('throws when articleTitle is empty', () => {
      expect(() => constructSourcePagePath('', '2024-01-01')).toThrow();
    });

    it('throws when articleTitle is whitespace only', () => {
      expect(() => constructSourcePagePath('   ', '2024-01-01')).toThrow();
    });

    it('throws when finalizedAt is empty', () => {
      expect(() => constructSourcePagePath('Title', '')).toThrow(
        'finalizedAt must be a valid date in YYYY-MM-DD format'
      );
    });

    it('throws when finalizedAt is not YYYY-MM-DD format', () => {
      expect(() => constructSourcePagePath('Title', '2024/01/01')).toThrow(
        'finalizedAt must be a valid date in YYYY-MM-DD format'
      );
    });

    it('throws when finalizedAt is a partial date', () => {
      expect(() => constructSourcePagePath('Title', '2024-01')).toThrow(
        'finalizedAt must be a valid date in YYYY-MM-DD format'
      );
    });

    it('throws when finalizedAt has extra characters', () => {
      expect(() => constructSourcePagePath('Title', '2024-01-01T00:00:00')).toThrow(
        'finalizedAt must be a valid date in YYYY-MM-DD format'
      );
    });
  });
});
