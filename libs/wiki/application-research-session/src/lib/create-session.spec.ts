/**
 * Unit tests for session creation logic
 * Feature: article-research-session
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 *
 * Migrated from scripts/research-workflow/session-manager/create-session.test.ts.
 * Uses FakeFileSystemPort in place of real temp directories; sessionDir is now
 * a workspace-root-relative string (e.g. `.kiro/research/sessions/angular-signals`)
 * rather than an absolute filesystem path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  validateArticleInput,
  recordArticleInputType,
  cleanupSession,
} from './create-session';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';

describe('createSession', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('creates session directory at .kiro/research/sessions/[session-id]/', async () => {
    const result = await createSession(fs, 'Angular Signals');
    expect(result.sessionDir).toBe('.kiro/research/sessions/angular-signals');
    expect(fs.hasFile(`${result.sessionDir}/session.json`)).toBe(true);
  });

  it('returns the generated session ID', async () => {
    const result = await createSession(fs, 'Angular Signals');
    expect(result.sessionId).toBe('angular-signals');
  });

  it('writes initial session.json with correct fields', async () => {
    const result = await createSession(fs, 'RxJS Operators');
    const content = JSON.parse(fs.getFile(`${result.sessionDir}/session.json`)!);

    expect(content.id).toBe('rxjs-operators');
    expect(content.topic).toBe('RxJS Operators');
    expect(content.state).toBe('EXPLORE');
    expect(content.scope).toBe('article');
    expect(content.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sets createdAt to current date in YYYY-MM-DD format', async () => {
    const result = await createSession(fs, 'Test Topic');
    const content = JSON.parse(fs.getFile(`${result.sessionDir}/session.json`)!);

    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(content.createdAt).toBe(expectedDate);
  });

  it('handles topics with special characters', async () => {
    const result = await createSession(fs, 'React & Vue: A Comparison!');
    expect(result.sessionId).toBe('react-vue-a-comparison');
    expect(fs.hasFile(`${result.sessionDir}/session.json`)).toBe(true);
  });

  it('throws for empty topic', async () => {
    await expect(createSession(fs, '')).rejects.toThrow();
  });

  it('throws for whitespace-only topic', async () => {
    await expect(createSession(fs, '   ')).rejects.toThrow();
  });
});

describe('validateArticleInput', () => {
  describe('valid inputs', () => {
    it('accepts a valid http URL', () => {
      const result = validateArticleInput('http://example.com/article', undefined);
      expect(result.valid).toBe(true);
      expect(result.inputType).toBe('url');
      expect(result.error).toBeUndefined();
    });

    it('accepts a valid https URL', () => {
      const result = validateArticleInput('https://blog.example.com/post', undefined);
      expect(result.valid).toBe(true);
      expect(result.inputType).toBe('url');
    });

    it('accepts pasted text with content', () => {
      const result = validateArticleInput(undefined, 'This is article content');
      expect(result.valid).toBe(true);
      expect(result.inputType).toBe('pasted-text');
      expect(result.error).toBeUndefined();
    });

    it('accepts pasted text with minimal content (single character)', () => {
      const result = validateArticleInput(undefined, 'a');
      expect(result.valid).toBe(true);
      expect(result.inputType).toBe('pasted-text');
    });
  });

  describe('dual input rejection (Req 1.4)', () => {
    it('rejects when both URL and pasted text are provided', () => {
      const result = validateArticleInput(
        'https://example.com/article',
        'Some pasted text'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Both');
      expect(result.inputType).toBeUndefined();
    });
  });

  describe('no input rejection (Req 1.5)', () => {
    it('rejects when neither URL nor pasted text is provided', () => {
      const result = validateArticleInput(undefined, undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Neither');
      expect(result.inputType).toBeUndefined();
    });

    it('rejects when URL is empty string and no pasted text', () => {
      const result = validateArticleInput('', undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Neither');
    });

    it('rejects when pasted text is whitespace-only', () => {
      const result = validateArticleInput(undefined, '   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Neither');
    });

    it('rejects when both are empty strings', () => {
      const result = validateArticleInput('', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Neither');
    });
  });

  describe('URL format validation', () => {
    it('rejects URL without http/https scheme', () => {
      const result = validateArticleInput('ftp://example.com/file', undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('http://');
    });

    it('rejects URL with file:// scheme', () => {
      const result = validateArticleInput('file:///etc/passwd', undefined);
      expect(result.valid).toBe(false);
    });

    it('rejects URL without any scheme', () => {
      const result = validateArticleInput('example.com/article', undefined);
      expect(result.valid).toBe(false);
    });
  });
});

describe('recordArticleInputType', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('records "url" input type in session.json', async () => {
    const { sessionDir } = await createSession(fs, 'Test Topic');
    await recordArticleInputType(fs, sessionDir, 'url');

    const content = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
    expect(content.articleInputType).toBe('url');
  });

  it('records "pasted-text" input type in session.json', async () => {
    const { sessionDir } = await createSession(fs, 'Test Topic');
    await recordArticleInputType(fs, sessionDir, 'pasted-text');

    const content = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
    expect(content.articleInputType).toBe('pasted-text');
  });

  it('preserves existing session.json fields', async () => {
    const { sessionDir } = await createSession(fs, 'Test Topic');
    await recordArticleInputType(fs, sessionDir, 'url');

    const content = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
    expect(content.id).toBe('test-topic');
    expect(content.state).toBe('EXPLORE');
    expect(content.scope).toBe('article');
  });
});

describe('cleanupSession', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('removes the session directory', async () => {
    const { sessionDir } = await createSession(fs, 'Test Topic');

    expect(fs.hasFile(`${sessionDir}/session.json`)).toBe(true);

    await cleanupSession(fs, sessionDir);

    expect(fs.hasFile(`${sessionDir}/session.json`)).toBe(false);
  });

  it('removes session directory with all contents', async () => {
    const { sessionDir } = await createSession(fs, 'Test Topic');

    await fs.writeFile(`${sessionDir}/extra.txt`, 'content');

    await cleanupSession(fs, sessionDir);

    expect(fs.hasFile(`${sessionDir}/session.json`)).toBe(false);
    expect(fs.hasFile(`${sessionDir}/extra.txt`)).toBe(false);
  });

  it('does not throw if directory does not exist', async () => {
    await expect(cleanupSession(fs, 'non-existent-dir')).resolves.not.toThrow();
  });
});
