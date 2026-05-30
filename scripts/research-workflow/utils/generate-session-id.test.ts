/**
 * Unit tests for session ID generation utility
 * Feature: article-research-session
 * Requirements: 1.1, 10.2
 */

import { describe, it, expect } from 'vitest';
import { generateSessionId } from './generate-session-id';

describe('generateSessionId', () => {
  describe('basic conversions', () => {
    it('converts a simple topic to kebab-case', () => {
      expect(generateSessionId('Angular Signals')).toBe('angular-signals');
    });

    it('lowercases all characters', () => {
      expect(generateSessionId('RxJS Operators')).toBe('rxjs-operators');
    });

    it('replaces spaces with hyphens', () => {
      expect(generateSessionId('my research topic')).toBe('my-research-topic');
    });

    it('handles single word topics', () => {
      expect(generateSessionId('typescript')).toBe('typescript');
    });

    it('handles numeric content', () => {
      expect(generateSessionId('Angular 21 Features')).toBe('angular-21-features');
    });
  });

  describe('special character handling', () => {
    it('replaces special characters with hyphens', () => {
      expect(generateSessionId('hello@world!')).toBe('hello-world');
    });

    it('handles dots and underscores', () => {
      expect(generateSessionId('file.name_test')).toBe('file-name-test');
    });

    it('handles slashes', () => {
      expect(generateSessionId('@angular/cdk')).toBe('angular-cdk');
    });

    it('handles parentheses and brackets', () => {
      expect(generateSessionId('topic (with brackets) [and more]')).toBe(
        'topic-with-brackets-and-more'
      );
    });

    it('handles ampersands and plus signs', () => {
      expect(generateSessionId('pros & cons + summary')).toBe('pros-cons-summary');
    });

    it('handles colons and semicolons', () => {
      expect(generateSessionId('step 1: setup; step 2: run')).toBe(
        'step-1-setup-step-2-run'
      );
    });
  });

  describe('consecutive hyphens', () => {
    it('collapses multiple spaces into a single hyphen', () => {
      expect(generateSessionId('hello    world')).toBe('hello-world');
    });

    it('collapses multiple special characters into a single hyphen', () => {
      expect(generateSessionId('hello---world')).toBe('hello-world');
    });

    it('collapses mixed spaces and special characters', () => {
      expect(generateSessionId('hello - - world')).toBe('hello-world');
    });
  });

  describe('leading and trailing hyphens', () => {
    it('strips leading hyphens', () => {
      expect(generateSessionId('---hello')).toBe('hello');
    });

    it('strips trailing hyphens', () => {
      expect(generateSessionId('hello---')).toBe('hello');
    });

    it('strips both leading and trailing hyphens', () => {
      expect(generateSessionId('---hello---')).toBe('hello');
    });

    it('strips leading special characters', () => {
      expect(generateSessionId('!!!topic')).toBe('topic');
    });

    it('strips trailing special characters', () => {
      expect(generateSessionId('topic!!!')).toBe('topic');
    });
  });

  describe('truncation', () => {
    it('truncates to 80 characters maximum', () => {
      const longTopic = 'a'.repeat(100);
      const result = generateSessionId(longTopic);
      expect(result.length).toBeLessThanOrEqual(80);
    });

    it('does not leave a trailing hyphen after truncation', () => {
      // Create a string that will have a hyphen at position 80
      const topic = 'a'.repeat(79) + ' ' + 'b'.repeat(10);
      const result = generateSessionId(topic);
      expect(result.length).toBeLessThanOrEqual(80);
      expect(result).not.toMatch(/-$/);
    });

    it('preserves content under 80 characters', () => {
      const topic = 'short topic';
      const result = generateSessionId(topic);
      expect(result).toBe('short-topic');
    });

    it('handles truncation that removes trailing hyphen', () => {
      // 78 a's + space + b = "aaa...a-b" at 80 chars, but let's test edge
      const topic = 'a'.repeat(80) + '-bbb';
      const result = generateSessionId(topic);
      expect(result.length).toBeLessThanOrEqual(80);
      expect(result).not.toMatch(/-$/);
    });
  });

  describe('unicode handling', () => {
    it('transliterates accented characters', () => {
      expect(generateSessionId('café résumé')).toBe('cafe-resume');
    });

    it('transliterates German umlauts (ü decomposes, ß is stripped)', () => {
      // ü decomposes to u + combining diaeresis, so becomes 'u'
      // ß does not decompose via NFKD, so it's treated as a non-alphanumeric char
      expect(generateSessionId('über straße')).toBe('uber-stra-e');
    });

    it('handles Chinese characters by stripping them', () => {
      const result = generateSessionId('hello 世界 world');
      expect(result).toBe('hello-world');
    });

    it('handles Japanese characters by stripping them', () => {
      const result = generateSessionId('テスト test');
      expect(result).toBe('test');
    });

    it('handles emoji by stripping them', () => {
      expect(generateSessionId('hello 🌍 world')).toBe('hello-world');
    });

    it('handles mixed unicode and ASCII', () => {
      expect(generateSessionId('naïve café')).toBe('naive-cafe');
    });
  });

  describe('edge cases', () => {
    it('throws on empty string', () => {
      expect(() => generateSessionId('')).toThrow(
        'Topic must be a non-empty string'
      );
    });

    it('throws on whitespace-only string', () => {
      expect(() => generateSessionId('   ')).toThrow(
        'Topic must be a non-empty string'
      );
    });

    it('throws on string with only special characters', () => {
      expect(() => generateSessionId('!@#$%^&*()')).toThrow(
        'Topic contains no alphanumeric characters'
      );
    });

    it('throws on string with only unicode non-alphanumeric characters', () => {
      expect(() => generateSessionId('世界')).toThrow(
        'Topic contains no alphanumeric characters'
      );
    });

    it('handles a single character', () => {
      expect(generateSessionId('a')).toBe('a');
    });

    it('handles a single number', () => {
      expect(generateSessionId('7')).toBe('7');
    });

    it('handles tabs and newlines', () => {
      expect(generateSessionId('hello\tworld\nnew')).toBe('hello-world-new');
    });

    it('handles very long topic with spaces near truncation boundary', () => {
      const topic = 'word '.repeat(20); // 100 chars
      const result = generateSessionId(topic);
      expect(result.length).toBeLessThanOrEqual(80);
      expect(result).not.toMatch(/-$/);
      expect(result).not.toMatch(/^-/);
    });
  });
});
