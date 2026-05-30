/**
 * Unit tests for article-content.json serialization
 * Feature: article-research-session
 * Requirements: 3.3, 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ArticleContent } from '../types/article-session';
import { saveArticleContent, loadArticleContent } from './save-article-content';

describe('saveArticleContent', () => {
  let sessionDir: string;

  beforeEach(async () => {
    sessionDir = await mkdtemp(join(tmpdir(), 'article-content-test-'));
  });

  afterEach(async () => {
    await rm(sessionDir, { recursive: true, force: true });
  });

  it('should save article-content.json in the session directory', async () => {
    const content: ArticleContent = {
      title: 'Test Article',
      body: 'Some body text',
      codeBlocks: [],
      links: [],
      candidateEntities: [],
      candidateConcepts: [],
    };

    await saveArticleContent(sessionDir, content);

    const filePath = join(sessionDir, 'article-content.json');
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.title).toBe('Test Article');
    expect(parsed.body).toBe('Some body text');
  });

  it('should include candidateEntities and candidateConcepts arrays', async () => {
    const content: ArticleContent = {
      title: 'Angular Signals',
      body: 'Article about Angular Signals and reactive programming',
      codeBlocks: [],
      links: [],
      candidateEntities: ['Angular', 'RxJS'],
      candidateConcepts: ['reactive programming', 'fine-grained reactivity'],
    };

    await saveArticleContent(sessionDir, content);

    const filePath = join(sessionDir, 'article-content.json');
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.candidateEntities).toEqual(['Angular', 'RxJS']);
    expect(parsed.candidateConcepts).toEqual(['reactive programming', 'fine-grained reactivity']);
  });

  it('should serialize with 2-space indentation', async () => {
    const content: ArticleContent = {
      title: 'Test',
      body: 'Body',
      codeBlocks: [],
      links: [],
      candidateEntities: [],
      candidateConcepts: [],
    };

    await saveArticleContent(sessionDir, content);

    const filePath = join(sessionDir, 'article-content.json');
    const raw = await readFile(filePath, 'utf-8');
    // 2-space indent means lines start with "  "
    expect(raw).toContain('  "title"');
  });

  it('should preserve optional fields (author, date) when present', async () => {
    const content: ArticleContent = {
      title: 'Full Article',
      author: 'John Doe',
      date: '2024-01-15',
      body: 'Full body text',
      codeBlocks: [{ language: 'typescript', content: 'const x = 1;' }],
      links: ['https://example.com'],
      candidateEntities: ['TypeScript'],
      candidateConcepts: ['type safety'],
    };

    await saveArticleContent(sessionDir, content);

    const filePath = join(sessionDir, 'article-content.json');
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.author).toBe('John Doe');
    expect(parsed.date).toBe('2024-01-15');
    expect(parsed.codeBlocks).toHaveLength(1);
    expect(parsed.codeBlocks[0].language).toBe('typescript');
    expect(parsed.links).toEqual(['https://example.com']);
  });

  it('should omit author and date when undefined', async () => {
    const content: ArticleContent = {
      title: 'No Author',
      body: 'Body text',
      codeBlocks: [],
      links: [],
      candidateEntities: [],
      candidateConcepts: [],
    };

    await saveArticleContent(sessionDir, content);

    const filePath = join(sessionDir, 'article-content.json');
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.author).toBeUndefined();
    expect(parsed.date).toBeUndefined();
  });
});

describe('loadArticleContent', () => {
  let sessionDir: string;

  beforeEach(async () => {
    sessionDir = await mkdtemp(join(tmpdir(), 'article-content-test-'));
  });

  afterEach(async () => {
    await rm(sessionDir, { recursive: true, force: true });
  });

  it('should load a previously saved article-content.json', async () => {
    const content: ArticleContent = {
      title: 'Round Trip Test',
      author: 'Jane Smith',
      date: '2024-03-20',
      body: 'This is the body',
      codeBlocks: [{ language: 'javascript', content: 'console.log("hi")' }],
      links: ['https://angular.dev'],
      candidateEntities: ['Angular', 'Signals'],
      candidateConcepts: ['reactivity', 'change detection'],
    };

    await saveArticleContent(sessionDir, content);
    const loaded = await loadArticleContent(sessionDir);

    expect(loaded).toEqual(content);
  });

  it('should throw when article-content.json does not exist', async () => {
    await expect(loadArticleContent(sessionDir)).rejects.toThrow();
  });

  it('should handle content with empty arrays', async () => {
    const content: ArticleContent = {
      title: 'Empty Arrays',
      body: 'Minimal content',
      codeBlocks: [],
      links: [],
      candidateEntities: [],
      candidateConcepts: [],
    };

    await saveArticleContent(sessionDir, content);
    const loaded = await loadArticleContent(sessionDir);

    expect(loaded.codeBlocks).toEqual([]);
    expect(loaded.links).toEqual([]);
    expect(loaded.candidateEntities).toEqual([]);
    expect(loaded.candidateConcepts).toEqual([]);
  });
});
