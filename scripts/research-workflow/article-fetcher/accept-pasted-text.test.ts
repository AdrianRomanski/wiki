/**
 * Unit tests for acceptPastedText
 * Feature: article-research-session
 * Requirements: 2.4
 */

import { describe, it, expect } from 'vitest';
import { acceptPastedText } from './accept-pasted-text';

describe('acceptPastedText', () => {
  it('should accept valid text with non-whitespace characters', () => {
    const result = acceptPastedText('Hello, world!');
    expect(result).toBe('Hello, world!');
  });

  it('should return the text content unchanged', () => {
    const input = '  Some article content with leading spaces  ';
    expect(acceptPastedText(input)).toBe(input);
  });

  it('should accept text containing URLs without making network requests', () => {
    const input = 'Check out https://example.com for more info';
    expect(acceptPastedText(input)).toBe(input);
  });

  it('should accept a single non-whitespace character', () => {
    expect(acceptPastedText('a')).toBe('a');
  });

  it('should accept multiline content', () => {
    const input = '# Article Title\n\nSome paragraph content.\n\n## Section 2';
    expect(acceptPastedText(input)).toBe(input);
  });

  it('should accept text with mixed whitespace and content', () => {
    const input = '\n\n  content  \n\n';
    expect(acceptPastedText(input)).toBe(input);
  });

  it('should throw an error for empty string', () => {
    expect(() => acceptPastedText('')).toThrow(
      'Pasted text must contain at least 1 non-whitespace character'
    );
  });

  it('should throw an error for whitespace-only string', () => {
    expect(() => acceptPastedText('   ')).toThrow(
      'Pasted text must contain at least 1 non-whitespace character'
    );
  });

  it('should throw an error for string with only newlines and tabs', () => {
    expect(() => acceptPastedText('\n\t\r\n  ')).toThrow(
      'Pasted text must contain at least 1 non-whitespace character'
    );
  });

  it('should preserve code blocks in pasted content', () => {
    const input = '```typescript\nconst x = 1;\n```';
    expect(acceptPastedText(input)).toBe(input);
  });

  it('should preserve unicode content', () => {
    const input = '日本語のテキスト';
    expect(acceptPastedText(input)).toBe(input);
  });
});
