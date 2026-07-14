/**
 * Unit tests for the EXPLORE step orchestration
 * Feature: article-research-session
 * Requirements: 4.1, 4.2, 4.6, 4.7, 9.4, 9.6, 9.7
 *
 * Migrated from scripts/research-workflow/session-manager/explore-step.test.ts.
 * Uses FakeFileSystemPort in place of real temp directories; sessionDir is now
 * a workspace-root-relative string rather than an absolute filesystem path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMetadataForConfirmation,
  confirmMetadata,
  completeExploreStep,
} from './explore-step';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import type { ArticleContent, SessionJson } from '@wiki/domain-research-session';

describe('explore-step', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  /**
   * Helper to write article-content.json
   */
  async function writeArticleContent(content: ArticleContent): Promise<void> {
    await fs.writeFile(
      `${sessionDir}/article-content.json`,
      JSON.stringify(content, null, 2)
    );
  }

  /**
   * Helper to write session.json
   */
  async function writeSessionJson(session: Partial<SessionJson>): Promise<void> {
    const defaults: SessionJson = {
      id: 'test-session',
      topic: 'Test Topic',
      state: 'EXPLORE',
      scope: 'article',
      createdAt: '2024-01-15',
      articleInputType: 'url',
      ...session,
    };
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(defaults, null, 2));
  }

  /**
   * Helper to read session.json
   */
  async function readSessionJson(): Promise<SessionJson> {
    const raw = await fs.readFile(`${sessionDir}/session.json`);
    return JSON.parse(raw);
  }

  const sampleContent: ArticleContent = {
    title: 'Understanding Signals in Angular',
    author: 'John Doe',
    date: '2024-03-15',
    body: 'Angular Signals provide a reactive primitive for managing state.',
    codeBlocks: [{ language: 'typescript', content: 'const count = signal(0);' }],
    links: ['https://angular.dev/guide/signals'],
    candidateEntities: ['Angular Signals'],
    candidateConcepts: ['reactive programming'],
  };

  describe('getMetadataForConfirmation', () => {
    it('returns title, author, and date from article-content.json', async () => {
      await writeArticleContent(sampleContent);

      const metadata = await getMetadataForConfirmation(fs, sessionDir);

      expect(metadata.title).toBe('Understanding Signals in Angular');
      expect(metadata.author).toBe('John Doe');
      expect(metadata.date).toBe('2024-03-15');
    });

    it('returns undefined author when not present in content', async () => {
      const contentWithoutAuthor: ArticleContent = {
        ...sampleContent,
        author: undefined,
      };
      await writeArticleContent(contentWithoutAuthor);

      const metadata = await getMetadataForConfirmation(fs, sessionDir);

      expect(metadata.title).toBe('Understanding Signals in Angular');
      expect(metadata.author).toBeUndefined();
      expect(metadata.date).toBe('2024-03-15');
    });

    it('returns undefined date when not present in content', async () => {
      const contentWithoutDate: ArticleContent = {
        ...sampleContent,
        date: undefined,
      };
      await writeArticleContent(contentWithoutDate);

      const metadata = await getMetadataForConfirmation(fs, sessionDir);

      expect(metadata.title).toBe('Understanding Signals in Angular');
      expect(metadata.author).toBe('John Doe');
      expect(metadata.date).toBeUndefined();
    });

    it('throws when article-content.json does not exist', async () => {
      await expect(getMetadataForConfirmation(fs, sessionDir)).rejects.toThrow();
    });
  });

  describe('confirmMetadata', () => {
    it('writes articleTitle to session.json (Req 9.4)', async () => {
      await writeSessionJson({});

      await confirmMetadata(fs, sessionDir, {
        title: 'Confirmed Title',
        author: 'Author Name',
        date: '2024-01-01',
      });

      const session = await readSessionJson();
      expect(session.articleTitle).toBe('Confirmed Title');
    });

    it('writes articleAuthor when present (Req 9.6)', async () => {
      await writeSessionJson({});

      await confirmMetadata(fs, sessionDir, {
        title: 'Title',
        author: 'Jane Smith',
      });

      const session = await readSessionJson();
      expect(session.articleAuthor).toBe('Jane Smith');
    });

    it('omits articleAuthor when not extractable (Req 9.6)', async () => {
      await writeSessionJson({ articleAuthor: 'Old Author' });

      await confirmMetadata(fs, sessionDir, {
        title: 'Title',
        author: undefined,
      });

      const session = await readSessionJson();
      expect(session.articleAuthor).toBeUndefined();
    });

    it('writes articleDate when present (Req 9.7)', async () => {
      await writeSessionJson({});

      await confirmMetadata(fs, sessionDir, {
        title: 'Title',
        date: '2024-06-15',
      });

      const session = await readSessionJson();
      expect(session.articleDate).toBe('2024-06-15');
    });

    it('omits articleDate when not extractable (Req 9.7)', async () => {
      await writeSessionJson({ articleDate: '2023-01-01' });

      await confirmMetadata(fs, sessionDir, {
        title: 'Title',
        date: undefined,
      });

      const session = await readSessionJson();
      expect(session.articleDate).toBeUndefined();
    });

    it('allows user to correct metadata fields (Req 4.2)', async () => {
      await writeSessionJson({});
      await writeArticleContent(sampleContent);

      // User corrects the title and author
      await confirmMetadata(fs, sessionDir, {
        title: 'Corrected Title',
        author: 'Corrected Author',
        date: '2024-05-20',
      });

      const session = await readSessionJson();
      expect(session.articleTitle).toBe('Corrected Title');
      expect(session.articleAuthor).toBe('Corrected Author');
      expect(session.articleDate).toBe('2024-05-20');
    });
  });

  describe('completeExploreStep', () => {
    it('generates article-analysis.md and transitions to SYNTHESIZE (Req 4.6)', async () => {
      await writeSessionJson({
        articleTitle: 'Understanding Signals in Angular',
        articleAuthor: 'John Doe',
        articleDate: '2024-03-15',
        articleUrl: 'https://example.com/article',
      });
      await writeArticleContent(sampleContent);

      const message = await completeExploreStep(fs, sessionDir);

      // Verify article-analysis.md was created
      const analysisContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
      expect(analysisContent).toContain('# Article Analysis:');
      expect(analysisContent).toContain('Understanding Signals in Angular');

      // Verify state transitioned to SYNTHESIZE
      const session = await readSessionJson();
      expect(session.state).toBe('SYNTHESIZE');

      // Verify informative message (Req 4.7)
      expect(message).toContain('SYNTHESIZE');
    });

    it('includes metadata in the generated analysis', async () => {
      await writeSessionJson({
        articleTitle: 'Test Article',
        articleAuthor: 'Test Author',
        articleDate: '2024-01-01',
        articleUrl: 'https://example.com/test',
      });
      await writeArticleContent(sampleContent);

      await completeExploreStep(fs, sessionDir);

      const analysisContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
      expect(analysisContent).toContain('Test Article');
      expect(analysisContent).toContain('Test Author');
      expect(analysisContent).toContain('2024-01-01');
      expect(analysisContent).toContain('https://example.com/test');
    });

    it('works without articleUrl for pasted-text input', async () => {
      await writeSessionJson({
        articleTitle: 'Pasted Article',
        articleInputType: 'pasted-text',
      });
      await writeArticleContent(sampleContent);

      const message = await completeExploreStep(fs, sessionDir);

      const session = await readSessionJson();
      expect(session.state).toBe('SYNTHESIZE');
      expect(message).toContain('SYNTHESIZE');
    });

    it('throws if articleTitle is not confirmed', async () => {
      await writeSessionJson({
        // No articleTitle set
      });
      await writeArticleContent(sampleContent);

      await expect(completeExploreStep(fs, sessionDir)).rejects.toThrow(
        /articleTitle/i
      );
    });
  });
});
