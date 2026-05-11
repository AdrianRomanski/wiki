import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateFileName } from '../filename-gen';

describe('generateFileName', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('entity type', () => {
    it('converts a simple title to kebab-case with .md extension', () => {
      expect(generateFileName('Angular CDK', 'entity')).toBe('angular-cdk.md');
    });

    it('handles single-word titles', () => {
      expect(generateFileName('TypeScript', 'entity')).toBe('typescript.md');
    });

    it('handles titles with multiple spaces', () => {
      expect(generateFileName('Angular   CDK   Library', 'entity')).toBe('angular-cdk-library.md');
    });

    it('handles titles with special characters', () => {
      expect(generateFileName('ARIA Live Region (v2)', 'entity')).toBe('aria-live-region-v2.md');
    });

    it('handles titles with punctuation', () => {
      expect(generateFileName("What's New in Angular?", 'entity')).toBe('what-s-new-in-angular.md');
    });

    it('handles titles with numbers', () => {
      expect(generateFileName('WCAG 2.1 Guidelines', 'entity')).toBe('wcag-2-1-guidelines.md');
    });

    it('handles titles with leading/trailing spaces', () => {
      expect(generateFileName('  Angular CDK  ', 'entity')).toBe('angular-cdk.md');
    });

    it('handles titles with unicode characters', () => {
      expect(generateFileName('Über Accessibility Ñoño', 'entity')).toBe('ber-accessibility-o-o.md');
    });

    it('truncates very long titles at a word boundary', () => {
      const longTitle = 'a '.repeat(60).trim(); // 60 "a" words separated by spaces
      const result = generateFileName(longTitle, 'entity');
      // Should be truncated and end with .md
      expect(result.endsWith('.md')).toBe(true);
      // The base name (without .md) should be at most 100 chars
      expect(result.length - 3).toBeLessThanOrEqual(100);
    });

    it('handles titles with only special characters', () => {
      // All non-alphanumeric chars become hyphens, then get trimmed
      const result = generateFileName('!!!@@@###', 'entity');
      // After kebab conversion: empty string (all chars are non-alphanumeric, become hyphens, then trimmed)
      expect(result).toBe('.md');
    });
  });

  describe('concept type', () => {
    it('converts a concept title to kebab-case with .md extension', () => {
      expect(generateFileName('Progressive Enhancement', 'concept')).toBe('progressive-enhancement.md');
    });

    it('handles concept titles the same as entity titles', () => {
      expect(generateFileName('Keyboard Navigation', 'concept')).toBe('keyboard-navigation.md');
    });
  });

  describe('source type', () => {
    it('generates source filename with date suffix', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-05-10'));

      expect(generateFileName('Angular Aria Guide', 'source')).toBe('source-angular-aria-guide-2024-05-10.md');
    });

    it('uses current date for the suffix', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15'));

      expect(generateFileName('WCAG Overview', 'source')).toBe('source-wcag-overview-2025-01-15.md');
    });

    it('handles source titles with special characters', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-20'));

      expect(generateFileName('React vs Angular (2024)', 'source')).toBe('source-react-vs-angular-2024-2024-03-20.md');
    });

    it('pads single-digit months and days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-05'));

      expect(generateFileName('Test Article', 'source')).toBe('source-test-article-2024-01-05.md');
    });

    it('truncates long source titles while preserving date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-01'));

      const longTitle = 'a '.repeat(60).trim();
      const result = generateFileName(longTitle, 'source');

      expect(result.startsWith('source-')).toBe(true);
      expect(result.endsWith('-2024-06-01.md')).toBe(true);
      // Total base name (without .md) should be reasonable
      expect(result.length - 3).toBeLessThanOrEqual(100 + 18); // kebab + source- + -date
    });
  });
});
