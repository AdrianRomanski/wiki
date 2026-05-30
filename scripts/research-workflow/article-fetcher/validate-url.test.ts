/**
 * Unit tests for URL validation utility
 * Feature: article-research-session
 * Requirements: 2.7
 */

import { describe, it, expect } from 'vitest';
import { validateUrl } from './validate-url';

describe('validateUrl', () => {
  describe('valid URLs (http:// and https://)', () => {
    it('accepts http:// URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
    });

    it('accepts https:// URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });

    it('accepts http:// with path', () => {
      expect(validateUrl('http://example.com/path/to/article')).toBe(true);
    });

    it('accepts https:// with query parameters', () => {
      expect(validateUrl('https://blog.dev/post?id=123&lang=en')).toBe(true);
    });

    it('accepts https:// with port', () => {
      expect(validateUrl('https://localhost:3000/api')).toBe(true);
    });

    it('accepts http:// with just the scheme and authority', () => {
      expect(validateUrl('http://a')).toBe(true);
    });

    it('accepts https:// with fragment', () => {
      expect(validateUrl('https://docs.angular.dev/guide#section')).toBe(true);
    });
  });

  describe('rejected schemes', () => {
    it('rejects ftp:// URLs', () => {
      expect(validateUrl('ftp://files.example.com/doc.pdf')).toBe(false);
    });

    it('rejects file:// URLs', () => {
      expect(validateUrl('file:///home/user/doc.html')).toBe(false);
    });

    it('rejects mailto: URLs', () => {
      expect(validateUrl('mailto:user@example.com')).toBe(false);
    });

    it('rejects data: URLs', () => {
      expect(validateUrl('data:text/html,<h1>Hello</h1>')).toBe(false);
    });

    it('rejects javascript: URLs', () => {
      expect(validateUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects ssh:// URLs', () => {
      expect(validateUrl('ssh://git@github.com/repo.git')).toBe(false);
    });

    it('rejects ws:// URLs', () => {
      expect(validateUrl('ws://socket.example.com')).toBe(false);
    });

    it('rejects wss:// URLs', () => {
      expect(validateUrl('wss://socket.example.com')).toBe(false);
    });
  });

  describe('strings without a scheme', () => {
    it('rejects plain domain names', () => {
      expect(validateUrl('example.com')).toBe(false);
    });

    it('rejects paths without scheme', () => {
      expect(validateUrl('/path/to/resource')).toBe(false);
    });

    it('rejects www prefixed without scheme', () => {
      expect(validateUrl('www.example.com')).toBe(false);
    });

    it('rejects protocol-relative URLs', () => {
      expect(validateUrl('//example.com/path')).toBe(false);
    });
  });

  describe('empty and whitespace strings', () => {
    it('rejects empty string', () => {
      expect(validateUrl('')).toBe(false);
    });

    it('rejects whitespace-only string', () => {
      expect(validateUrl('   ')).toBe(false);
    });

    it('rejects string with leading whitespace before valid scheme', () => {
      expect(validateUrl(' https://example.com')).toBe(false);
    });
  });

  describe('case sensitivity', () => {
    it('rejects HTTP:// (uppercase scheme)', () => {
      expect(validateUrl('HTTP://example.com')).toBe(false);
    });

    it('rejects HTTPS:// (uppercase scheme)', () => {
      expect(validateUrl('HTTPS://example.com')).toBe(false);
    });

    it('rejects mixed case Http://', () => {
      expect(validateUrl('Http://example.com')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('rejects http without colon-slash-slash', () => {
      expect(validateUrl('http')).toBe(false);
    });

    it('rejects http: without slashes', () => {
      expect(validateUrl('http:')).toBe(false);
    });

    it('rejects http:/ with single slash', () => {
      expect(validateUrl('http:/')).toBe(false);
    });

    it('accepts http:// with nothing after', () => {
      expect(validateUrl('http://')).toBe(true);
    });

    it('accepts https:// with nothing after', () => {
      expect(validateUrl('https://')).toBe(true);
    });

    it('rejects httpx:// (similar but different scheme)', () => {
      expect(validateUrl('httpx://example.com')).toBe(false);
    });

    it('rejects https (no colon-slash-slash)', () => {
      expect(validateUrl('https')).toBe(false);
    });
  });
});
