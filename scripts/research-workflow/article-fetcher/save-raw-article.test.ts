/**
 * Unit tests for saveRawArticle
 * Feature: article-research-session
 * Requirements: 2.2, 2.5, 2.6, 6.1, 6.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { saveRawArticle, extractPublicationSource } from './save-raw-article';
import type { SessionJson } from '../types/article-session';

describe('saveRawArticle', () => {
  let sessionDir: string;

  beforeEach(async () => {
    sessionDir = await mkdtemp(join(tmpdir(), 'save-raw-article-test-'));
    // Write a minimal session.json
    const initialSession: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'EXPLORE',
      scope: 'article',
      createdAt: '2025-01-15',
      articleInputType: 'url',
    };
    await writeFile(
      join(sessionDir, 'session.json'),
      JSON.stringify(initialSession, null, 2),
      'utf-8'
    );
  });

  afterEach(async () => {
    await rm(sessionDir, { recursive: true, force: true });
  });

  it('should save content as raw-article.md in the session directory', async () => {
    const content = '# My Article\n\nSome content here.';
    await saveRawArticle(sessionDir, content, 'url', 'https://example.com/article');

    const saved = await readFile(join(sessionDir, 'raw-article.md'), 'utf-8');
    expect(saved).toBe(content);
  });

  it('should record articleUrl in session.json when inputType is "url"', async () => {
    const url = 'https://blog.example.com/my-post';
    await saveRawArticle(sessionDir, 'content', 'url', url);

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.articleUrl).toBe(url);
  });

  it('should omit articleUrl from session.json when inputType is "pasted-text"', async () => {
    // First set articleUrl to simulate a previous state
    const initialSession: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'EXPLORE',
      scope: 'article',
      createdAt: '2025-01-15',
      articleInputType: 'url',
      articleUrl: 'https://old-url.com',
    };
    await writeFile(
      join(sessionDir, 'session.json'),
      JSON.stringify(initialSession, null, 2),
      'utf-8'
    );

    await saveRawArticle(sessionDir, 'pasted content', 'pasted-text');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.articleUrl).toBeUndefined();
    expect('articleUrl' in session).toBe(false);
  });

  it('should preserve other session.json fields when updating', async () => {
    await saveRawArticle(sessionDir, 'content', 'url', 'https://example.com');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.id).toBe('test-session');
    expect(session.topic).toBe('Test Topic');
    expect(session.state).toBe('EXPLORE');
    expect(session.scope).toBe('article');
    expect(session.createdAt).toBe('2025-01-15');
  });

  it('should throw an error when inputType is "url" but no url is provided', async () => {
    await expect(
      saveRawArticle(sessionDir, 'content', 'url')
    ).rejects.toThrow('A URL must be provided when inputType is "url"');
  });

  it('should handle empty content for raw-article.md', async () => {
    await saveRawArticle(sessionDir, '', 'pasted-text');

    const saved = await readFile(join(sessionDir, 'raw-article.md'), 'utf-8');
    expect(saved).toBe('');
  });

  it('should handle multiline markdown content', async () => {
    const content = [
      '# Title',
      '',
      '## Section 1',
      '',
      'Paragraph with **bold** and *italic*.',
      '',
      '```typescript',
      'const x = 1;',
      '```',
      '',
      '- List item 1',
      '- List item 2',
    ].join('\n');

    await saveRawArticle(sessionDir, content, 'pasted-text');

    const saved = await readFile(join(sessionDir, 'raw-article.md'), 'utf-8');
    expect(saved).toBe(content);
  });

  it('should handle unicode content in raw-article.md', async () => {
    const content = '# 日本語の記事\n\nこれはテスト記事です。';
    await saveRawArticle(sessionDir, content, 'pasted-text');

    const saved = await readFile(join(sessionDir, 'raw-article.md'), 'utf-8');
    expect(saved).toBe(content);
  });

  it('should not add articleUrl when inputType is "pasted-text" even if url is passed', async () => {
    await saveRawArticle(sessionDir, 'content', 'pasted-text', 'https://ignored.com');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.articleUrl).toBeUndefined();
    expect('articleUrl' in session).toBe(false);
  });
});


/**
 * Unit tests for publicationSource in session.json
 * Feature: article-author-source-discovery
 * Requirements: 6.1, 6.2
 */
describe('saveRawArticle - publicationSource', () => {
  let sessionDir: string;

  beforeEach(async () => {
    sessionDir = await mkdtemp(join(tmpdir(), 'save-raw-article-pub-source-'));
    const initialSession: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'EXPLORE',
      scope: 'article',
      createdAt: '2025-01-15',
      articleInputType: 'url',
    };
    await writeFile(
      join(sessionDir, 'session.json'),
      JSON.stringify(initialSession, null, 2),
      'utf-8'
    );
  });

  afterEach(async () => {
    await rm(sessionDir, { recursive: true, force: true });
  });

  it('should set publicationSource to "nx.dev" for https://nx.dev/blog/article', async () => {
    await saveRawArticle(sessionDir, 'content', 'url', 'https://nx.dev/blog/article');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.publicationSource).toBe('nx.dev');
  });

  it('should strip www. prefix: https://www.medium.com/article → "medium.com"', async () => {
    await saveRawArticle(sessionDir, 'content', 'url', 'https://www.medium.com/article');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.publicationSource).toBe('medium.com');
  });

  it('should NOT include publicationSource for pasted-text input', async () => {
    await saveRawArticle(sessionDir, 'pasted content', 'pasted-text');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.publicationSource).toBeUndefined();
    expect('publicationSource' in session).toBe(false);
  });

  it('should omit publicationSource when URL cannot be parsed (invalid URL)', async () => {
    await saveRawArticle(sessionDir, 'content', 'url', 'not a valid url');

    const session = JSON.parse(
      await readFile(join(sessionDir, 'session.json'), 'utf-8')
    );
    expect(session.publicationSource).toBeUndefined();
    expect('publicationSource' in session).toBe(false);
  });
});

/**
 * Unit tests for extractPublicationSource
 * Feature: article-author-source-discovery
 * Requirements: 6.1, 6.4
 */
describe('extractPublicationSource', () => {
  it('should extract "nx.dev" from https://nx.dev/blog', () => {
    expect(extractPublicationSource('https://nx.dev/blog')).toBe('nx.dev');
  });

  it('should strip www. prefix: https://www.push-based.io/article → "push-based.io"', () => {
    expect(extractPublicationSource('https://www.push-based.io/article')).toBe('push-based.io');
  });

  it('should preserve subdomains: https://blog.angular.dev/post → "blog.angular.dev"', () => {
    expect(extractPublicationSource('https://blog.angular.dev/post')).toBe('blog.angular.dev');
  });

  it('should return undefined for ftp:// URLs', () => {
    expect(extractPublicationSource('ftp://invalid.com')).toBeUndefined();
  });

  it('should return undefined for "not a url"', () => {
    expect(extractPublicationSource('not a url')).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(extractPublicationSource('')).toBeUndefined();
  });
});
