/**
 * Unit + integration tests for FINALIZE step orchestration
 * Feature: article-research-session, article-author-source-discovery
 * Requirements: 6.1, 6.7, 6.8, 8.5, 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * Migrated from:
 * - scripts/research-workflow/session-manager/finalize-step.test.ts
 * - scripts/research-workflow/session-manager/finalize-step-integration.test.ts
 *
 * Uses FakeFileSystemPort (wiki-scoped store) in place of real temp
 * directories, and a FakeFrontmatterPort for the author/publication-source
 * page append paths. `acceptPublication` now takes `(fs, frontmatter,
 * sessionDir)` and `sessionDir` is workspace-root-relative.
 *
 * Note: the original "entity page write failures gracefully" test relied on
 * blocking a real directory by placing a file at its path; here we use the
 * FakeFileSystemPort's `blockWikiWritesUnder` helper to simulate the same
 * write-failure condition without real filesystem side effects.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFindingsSummaryForReview,
  declinePublication,
  acceptPublication,
  finalizeSession,
} from './finalize-step';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import { FakeFrontmatterPort } from './test-utils/fake-frontmatter-port';

describe('finalize-step', () => {
  let fs: FakeFileSystemPort;
  let frontmatter: FakeFrontmatterPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
    frontmatter = new FakeFrontmatterPort();
  });

  function writeSessionJson(overrides: Record<string, unknown> = {}): void {
    const session = {
      id: 'test-session',
      topic: 'Test Article Research',
      state: 'FINALIZE',
      scope: 'article',
      createdAt: '2024-05-15',
      articleInputType: 'url',
      articleUrl: 'https://example.com/article',
      articleTitle: 'Understanding Signals in Angular',
      articleAuthor: 'Jane Doe',
      articleDate: '2024-05-01',
      ...overrides,
    };
    fs.setFile(`${sessionDir}/session.json`, JSON.stringify(session, null, 2));
  }

  function writeFindingsSummary(): void {
    const content = `# Findings Summary: Understanding Signals in Angular

## Document Metadata
- **Article Title:** Understanding Signals in Angular
- **Author:** Jane Doe
- **Date:** 2024-05-01
- **Source URL:** https://example.com/article
- **Session Scope:** article
- **Research Date:** 2024-05-15

## Key Insights
- Angular Signals provide fine-grained reactivity without RxJS.
- Signals simplify state management in components.

## Identified Entities

- **Angular Signals** — A reactive primitive for managing state in Angular applications.
- **RxJS** — A library for reactive programming using observables.

## Identified Concepts

- **Fine-grained Reactivity** — A pattern where only the specific parts of the UI that depend on changed data are updated.
- **Signal-based State Management** — Managing component state using signal primitives instead of observables.

## Recommended Wiki Pages

| Path | Type | Rationale |
|------|------|-----------|
| wiki/sources/understanding-signals-in-angular.md | source | Preserves the article as a citable source. |
| wiki/entities/angular-signals.md | entity | Documents Angular Signals as a reusable knowledge base entry. |
| wiki/entities/rxjs.md | entity | Documents RxJS as a reusable knowledge base entry. |
| wiki/concepts/fine-grained-reactivity.md | concept | Captures the concept for cross-referencing. |
| wiki/concepts/signal-based-state-management.md | concept | Captures the concept for cross-referencing. |

## Session Artifacts

- \`article-analysis.md\`
- \`article-content.json\`
- \`raw-article.md\`
- \`session.json\`
`;
    fs.setFile(`${sessionDir}/findings-summary.md`, content);
  }

  describe('getFindingsSummaryForReview', () => {
    it('should return the contents of findings-summary.md', async () => {
      writeFindingsSummary();

      const result = await getFindingsSummaryForReview(fs, sessionDir);

      expect(result).toContain('# Findings Summary: Understanding Signals in Angular');
      expect(result).toContain('## Key Insights');
      expect(result).toContain('## Identified Entities');
      expect(result).toContain('## Identified Concepts');
    });

    it('should throw if findings-summary.md does not exist', async () => {
      await expect(getFindingsSummaryForReview(fs, sessionDir)).rejects.toThrow();
    });
  });

  describe('declinePublication', () => {
    it('should record wikiPages as empty array and transition to FINALIZED', async () => {
      writeSessionJson();

      await declinePublication(fs, sessionDir);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toEqual([]);
      expect(session.finalizedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('acceptPublication', () => {
    it('should create source page, entity pages, and concept pages', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Source page should be created
      expect(result.sourcePagePath).toMatch(/^wiki\/sources\/.*\.md$/);
      expect(fs.hasWikiFile(result.sourcePagePath.replace(/^wiki\//, ''))).toBe(true);

      // Entity pages should be created
      expect(result.entityResults.created.length).toBeGreaterThan(0);

      // Concept pages should be created
      expect(result.conceptResults.created.length).toBeGreaterThan(0);

      // All created pages should be collected
      expect(result.allCreatedPages.length).toBeGreaterThan(0);
      expect(result.allCreatedPages).toContain(result.sourcePagePath);
    });

    it('should add reciprocal references to created entity/concept pages', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Check that entity pages have reciprocal references
      for (const entityPath of result.entityResults.created) {
        const content = fs.getWikiFile(entityPath.replace(/^wiki\//, ''))!;
        expect(content).toContain('## Sources');
        expect(content).toContain('[[Understanding Signals in Angular]]');
      }
    });

    it('should handle entity page write failures gracefully', async () => {
      writeSessionJson();
      writeFindingsSummary();

      // Simulate a blocked entities directory (equivalent to the original
      // test's "file where the directory should be" real-fs setup).
      fs.blockWikiWritesUnder('entities/');

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Entity pages should have failures since the directory is blocked
      expect(result.entityResults.failed.length).toBeGreaterThan(0);

      // Source page should still succeed
      expect(result.sourcePagePath).toBeDefined();
    });

    it('should include updated pages in allCreatedPages when pages already exist', async () => {
      writeSessionJson();
      writeFindingsSummary();

      // Pre-create an entity page
      fs.setWikiFile(
        'entities/angular-signals.md',
        `---
title: "Angular Signals"
type: entity
tags: [angular, signals]
created: "2024-01-01"
updated: "2024-01-01"
---

# Angular Signals

## Definition

Existing content about Angular Signals.
`
      );

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // The existing entity should be in updated, not created
      expect(result.entityResults.updated).toContain('wiki/entities/angular-signals.md');
      expect(result.allCreatedPages).toContain('wiki/entities/angular-signals.md');
    });
  });

  describe('finalizeSession', () => {
    it('should record finalizedAt and wikiPages and transition to FINALIZED', async () => {
      writeSessionJson();

      const wikiPages = ['wiki/sources/test.md', 'wiki/entities/angular-signals.md'];
      await finalizeSession(fs, sessionDir, wikiPages);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      expect(session.state).toBe('FINALIZED');
      expect(session.finalizedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(session.wikiPages).toEqual(wikiPages);
    });

    it('should record empty wikiPages array when no pages created', async () => {
      writeSessionJson();

      await finalizeSession(fs, sessionDir, []);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toEqual([]);
    });

    it('should throw if session is not in FINALIZE state', async () => {
      writeSessionJson({ state: 'EXPLORE', articleTitle: undefined });

      await expect(finalizeSession(fs, sessionDir, [])).rejects.toThrow();
    });

    it('should record finalizedAt as current date in YYYY-MM-DD format (Req 8.5)', async () => {
      writeSessionJson();

      await finalizeSession(fs, sessionDir, []);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(session.finalizedAt).toBe(expectedDate);
    });

    it('should record wikiPages as paths relative to workspace root (Req 10.3)', async () => {
      writeSessionJson();

      const wikiPages = [
        'wiki/sources/understanding-signals-article-2024-05-15.md',
        'wiki/entities/angular-signals.md',
        'wiki/entities/rxjs.md',
        'wiki/concepts/fine-grained-reactivity.md',
        'wiki/concepts/signal-based-state-management.md',
      ];
      await finalizeSession(fs, sessionDir, wikiPages);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      expect(session.wikiPages).toEqual(wikiPages);
      // All paths should be relative (not absolute)
      for (const page of session.wikiPages) {
        expect(page).not.toMatch(/^\//);
        expect(page).toMatch(/^wiki\//);
      }
    });

    it('should preserve all existing session fields when finalizing (Req 8.5)', async () => {
      writeSessionJson();

      await finalizeSession(fs, sessionDir, ['wiki/sources/test.md']);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      // Original fields should be preserved
      expect(session.id).toBe('test-session');
      expect(session.topic).toBe('Test Article Research');
      expect(session.scope).toBe('article');
      expect(session.createdAt).toBe('2024-05-15');
      expect(session.articleInputType).toBe('url');
      expect(session.articleUrl).toBe('https://example.com/article');
      expect(session.articleTitle).toBe('Understanding Signals in Angular');
      expect(session.articleAuthor).toBe('Jane Doe');
      expect(session.articleDate).toBe('2024-05-01');
      // Finalization fields should be added
      expect(session.state).toBe('FINALIZED');
      expect(session.finalizedAt).toBeDefined();
      expect(session.wikiPages).toEqual(['wiki/sources/test.md']);
    });

    it('should handle finalization with a single wiki page', async () => {
      writeSessionJson();

      await finalizeSession(fs, sessionDir, ['wiki/sources/my-article-article-2024-05-15.md']);

      const session = JSON.parse(fs.getFile(`${sessionDir}/session.json`)!);
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toHaveLength(1);
      expect(session.wikiPages[0]).toBe('wiki/sources/my-article-article-2024-05-15.md');
    });
  });
});

describe('FINALIZE step integration — article-author-source-discovery', () => {
  let fs: FakeFileSystemPort;
  let frontmatter: FakeFrontmatterPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
    frontmatter = new FakeFrontmatterPort();
  });

  function writeSessionJson(overrides: Record<string, unknown> = {}): void {
    const session = {
      id: 'test-session',
      topic: 'Test Article Research',
      state: 'FINALIZE',
      scope: 'article',
      createdAt: '2024-05-15',
      articleInputType: 'url',
      articleUrl: 'https://nx.dev/blog/understanding-signals',
      articleTitle: 'Understanding Signals in Angular',
      articleAuthor: 'Manfred Steyer',
      articleDate: '2024-05-01',
      ...overrides,
    };
    fs.setFile(`${sessionDir}/session.json`, JSON.stringify(session, null, 2));
  }

  function writeFindingsSummary(
    overrides: { title?: string; author?: string; url?: string } = {}
  ): void {
    const title = overrides.title || 'Understanding Signals in Angular';
    const author = overrides.author || 'Manfred Steyer';
    const url = overrides.url || 'https://nx.dev/blog/understanding-signals';

    const content = `# Findings Summary: ${title}

## Document Metadata
- **Article Title:** ${title}
- **Author:** ${author}
- **Date:** 2024-05-01
- **Source URL:** ${url}
- **Session Scope:** article
- **Research Date:** 2024-05-15

## Key Insights
- Angular Signals provide fine-grained reactivity without RxJS.
- Signals simplify state management in components.

## Identified Entities

- **Angular Signals** — A reactive primitive for managing state in Angular applications.
- **RxJS** — A library for reactive programming using observables.

## Identified Concepts

- **Fine-grained Reactivity** — A pattern where only the specific parts of the UI that depend on changed data are updated.
- **Signal-based State Management** — Managing component state using signal primitives instead of observables.

## Recommended Wiki Pages

| Path | Type | Rationale |
|------|------|-----------|
| wiki/sources/understanding-signals-in-angular.md | source | Preserves the article as a citable source. |
| wiki/entities/angular-signals.md | entity | Documents Angular Signals as a reusable knowledge base entry. |
| wiki/entities/rxjs.md | entity | Documents RxJS as a reusable knowledge base entry. |
| wiki/concepts/fine-grained-reactivity.md | concept | Captures the concept for cross-referencing. |
| wiki/concepts/signal-based-state-management.md | concept | Captures the concept for cross-referencing. |

## Session Artifacts

- \`article-analysis.md\`
- \`article-content.json\`
- \`raw-article.md\`
- \`session.json\`
`;
    fs.setFile(`${sessionDir}/findings-summary.md`, content);
  }

  describe('Full flow — session with articleAuthor and articleUrl (Req 4.1, 4.2, 4.3)', () => {
    it('should create source page with author WikiLink in metadata', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      const sourcePageContent = fs.getWikiFile(
        result.sourcePagePath.replace(/^wiki\//, '')
      )!;
      expect(sourcePageContent).toContain('[[Manfred Steyer]]');
    });

    it('should create source page with publication source WikiLink in metadata', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      const sourcePageContent = fs.getWikiFile(
        result.sourcePagePath.replace(/^wiki\//, '')
      )!;
      expect(sourcePageContent).toContain('[[nx.dev]]');
    });

    it('should create author page at wiki/entities/[author-slug].md', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.authorResult).toBeDefined();
      expect(result.authorResult!.action).toBe('created');
      expect(result.authorResult!.path).toBe('wiki/entities/manfred-steyer.md');
      expect(fs.hasWikiFile('entities/manfred-steyer.md')).toBe(true);
    });

    it('should create publication source page at wiki/entities/[domain-slug].md', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.publicationSourceResult).toBeDefined();
      expect(result.publicationSourceResult!.action).toBe('created');
      expect(result.publicationSourceResult!.path).toBe('wiki/entities/nx-dev.md');
      expect(fs.hasWikiFile('entities/nx-dev.md')).toBe(true);
    });

    it('should create all three page types with correct cross-references (Req 4.3, 4.4)', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Source page references author and publication source via WikiLinks
      const sourcePageContent = fs.getWikiFile(
        result.sourcePagePath.replace(/^wiki\//, '')
      )!;
      expect(sourcePageContent).toContain('[[Manfred Steyer]]');
      expect(sourcePageContent).toContain('[[nx.dev]]');

      // Author page references the source page via WikiLink
      const authorPageContent = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(authorPageContent).toContain('[[Understanding Signals in Angular]]');
      expect(authorPageContent).toContain('## Articles');
      expect(authorPageContent).toContain('## References');

      // Publication source page references the source page via WikiLink
      const pubSourcePageContent = fs.getWikiFile('entities/nx-dev.md')!;
      expect(pubSourcePageContent).toContain('[[Understanding Signals in Angular]]');
      expect(pubSourcePageContent).toContain('Manfred Steyer');
      expect(pubSourcePageContent).toContain('## Articles');
      expect(pubSourcePageContent).toContain('## References');
    });

    it('should include all three page paths in wikiPages/allCreatedPages array', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Source page path
      expect(result.allCreatedPages).toContain(result.sourcePagePath);

      // Author page path
      expect(result.allCreatedPages).toContain('wiki/entities/manfred-steyer.md');

      // Publication source page path
      expect(result.allCreatedPages).toContain('wiki/entities/nx-dev.md');
    });

    it('should ensure author and publication source pages contain WikiLink back to source page (Req 4.4)', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      // Author page should contain a WikiLink to the article title
      // (either via its own References section or via reciprocal references)
      const authorPageContent = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(authorPageContent).toContain('[[Understanding Signals in Angular]]');

      // Publication source page should contain a WikiLink to the article title
      const pubSourcePageContent = fs.getWikiFile('entities/nx-dev.md')!;
      expect(pubSourcePageContent).toContain('[[Understanding Signals in Angular]]');

      // Result should have been computed without error
      expect(result.failedReferences).toBeDefined();
    });
  });

  describe('Missing author — session with articleUrl but no articleAuthor (Req 4.5)', () => {
    it('should create source page with "Unknown" author (no WikiLink)', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      const sourcePageContent = fs.getWikiFile(
        result.sourcePagePath.replace(/^wiki\//, '')
      )!;
      expect(sourcePageContent).toContain('**Author:** Unknown');
      // Should NOT have an author WikiLink
      expect(sourcePageContent).not.toMatch(/\*\*Author:\*\* \[\[.*\]\]/);
    });

    it('should not create an author page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.authorResult).toBeUndefined();
      // No author page should exist
      expect(fs.hasWikiFile('entities/unknown.md')).toBe(false);
    });

    it('should still create publication source page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.publicationSourceResult).toBeDefined();
      expect(result.publicationSourceResult!.action).toBe('created');
      expect(result.publicationSourceResult!.path).toBe('wiki/entities/nx-dev.md');
      expect(fs.hasWikiFile('entities/nx-dev.md')).toBe(true);
    });

    it('should include publication source page in allCreatedPages but not author page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.allCreatedPages).toContain('wiki/entities/nx-dev.md');
      // No author page path should be in the list
      const authorPages = result.allCreatedPages.filter(
        (p) => p.includes('manfred-steyer') || p.includes('unknown')
      );
      expect(authorPages).toHaveLength(0);
    });
  });

  describe('Pasted-text input — session with no articleUrl (Req 4.5)', () => {
    it('should create source page without publication source WikiLink', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      const sourcePageContent = fs.getWikiFile(
        result.sourcePagePath.replace(/^wiki\//, '')
      )!;
      // Should NOT have a publication source WikiLink
      expect(sourcePageContent).not.toContain('**Publication Source:**');
    });

    it('should not create a publication source page', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.publicationSourceResult).toBeUndefined();
      // No publication source page should exist
      expect(fs.hasWikiFile('entities/nx-dev.md')).toBe(false);
    });

    it('should still create author page if articleAuthor is present', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.authorResult).toBeDefined();
      expect(result.authorResult!.action).toBe('created');
      expect(result.authorResult!.path).toBe('wiki/entities/manfred-steyer.md');
      expect(fs.hasWikiFile('entities/manfred-steyer.md')).toBe(true);
    });

    it('should include author page in allCreatedPages but not publication source page', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(fs, frontmatter, sessionDir);

      expect(result.allCreatedPages).toContain('wiki/entities/manfred-steyer.md');
      // No publication source page path should be in the list
      const pubSourcePages = result.allCreatedPages.filter((p) => p.includes('nx-dev'));
      expect(pubSourcePages).toHaveLength(0);
    });
  });
});
