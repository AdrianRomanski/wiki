/**
 * Integration tests for FINALIZE step — article-author-source-discovery
 * Feature: article-author-source-discovery
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * Tests the full FINALIZE flow including author page creation,
 * publication source page creation, and cross-reference linking.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { acceptPublication } from './finalize-step';

describe('FINALIZE step integration — article-author-source-discovery', () => {
  let workspaceRoot: string;
  let sessionDir: string;

  beforeEach(() => {
    workspaceRoot = join(
      tmpdir(),
      `finalize-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    sessionDir = join(workspaceRoot, '.kiro/research/sessions/test-session');
    mkdirSync(sessionDir, { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/sources'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/entities'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/concepts'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspaceRoot)) {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
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
    writeFileSync(join(sessionDir, 'session.json'), JSON.stringify(session, null, 2), 'utf-8');
  }

  function writeFindingsSummary(overrides: { title?: string; author?: string; url?: string } = {}): void {
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
    writeFileSync(join(sessionDir, 'findings-summary.md'), content, 'utf-8');
  }

  describe('Full flow — session with articleAuthor and articleUrl (Req 4.1, 4.2, 4.3)', () => {
    it('should create source page with author WikiLink in metadata', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      const sourcePageContent = readFileSync(
        join(workspaceRoot, result.sourcePagePath),
        'utf-8'
      );
      expect(sourcePageContent).toContain('[[Manfred Steyer]]');
    });

    it('should create source page with publication source WikiLink in metadata', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      const sourcePageContent = readFileSync(
        join(workspaceRoot, result.sourcePagePath),
        'utf-8'
      );
      expect(sourcePageContent).toContain('[[nx.dev]]');
    });

    it('should create author page at wiki/entities/[author-slug].md', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.authorResult).toBeDefined();
      expect(result.authorResult!.action).toBe('created');
      expect(result.authorResult!.path).toBe('wiki/entities/manfred-steyer.md');
      expect(existsSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'))).toBe(true);
    });

    it('should create publication source page at wiki/entities/[domain-slug].md', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.publicationSourceResult).toBeDefined();
      expect(result.publicationSourceResult!.action).toBe('created');
      expect(result.publicationSourceResult!.path).toBe('wiki/entities/nx-dev.md');
      expect(existsSync(join(workspaceRoot, 'wiki/entities/nx-dev.md'))).toBe(true);
    });

    it('should create all three page types with correct cross-references (Req 4.3, 4.4)', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // Source page references author and publication source via WikiLinks
      const sourcePageContent = readFileSync(
        join(workspaceRoot, result.sourcePagePath),
        'utf-8'
      );
      expect(sourcePageContent).toContain('[[Manfred Steyer]]');
      expect(sourcePageContent).toContain('[[nx.dev]]');

      // Author page references the source page via WikiLink
      const authorPageContent = readFileSync(
        join(workspaceRoot, 'wiki/entities/manfred-steyer.md'),
        'utf-8'
      );
      expect(authorPageContent).toContain('[[Understanding Signals in Angular]]');
      expect(authorPageContent).toContain('## Articles');
      expect(authorPageContent).toContain('## References');

      // Publication source page references the source page via WikiLink
      const pubSourcePageContent = readFileSync(
        join(workspaceRoot, 'wiki/entities/nx-dev.md'),
        'utf-8'
      );
      expect(pubSourcePageContent).toContain('[[Understanding Signals in Angular]]');
      expect(pubSourcePageContent).toContain('Manfred Steyer');
      expect(pubSourcePageContent).toContain('## Articles');
      expect(pubSourcePageContent).toContain('## References');
    });

    it('should include all three page paths in wikiPages/allCreatedPages array', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

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

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // Author page should contain a WikiLink to the article title
      // (either via its own References section or via reciprocal references)
      const authorPageContent = readFileSync(
        join(workspaceRoot, 'wiki/entities/manfred-steyer.md'),
        'utf-8'
      );
      expect(authorPageContent).toContain('[[Understanding Signals in Angular]]');

      // Publication source page should contain a WikiLink to the article title
      const pubSourcePageContent = readFileSync(
        join(workspaceRoot, 'wiki/entities/nx-dev.md'),
        'utf-8'
      );
      expect(pubSourcePageContent).toContain('[[Understanding Signals in Angular]]');
    });
  });

  describe('Missing author — session with articleUrl but no articleAuthor (Req 4.5)', () => {
    it('should create source page with "Unknown" author (no WikiLink)', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      const sourcePageContent = readFileSync(
        join(workspaceRoot, result.sourcePagePath),
        'utf-8'
      );
      expect(sourcePageContent).toContain('**Author:** Unknown');
      // Should NOT have an author WikiLink
      expect(sourcePageContent).not.toMatch(/\*\*Author:\*\* \[\[.*\]\]/);
    });

    it('should not create an author page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.authorResult).toBeUndefined();
      // No author page should exist
      expect(existsSync(join(workspaceRoot, 'wiki/entities/unknown.md'))).toBe(false);
    });

    it('should still create publication source page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.publicationSourceResult).toBeDefined();
      expect(result.publicationSourceResult!.action).toBe('created');
      expect(result.publicationSourceResult!.path).toBe('wiki/entities/nx-dev.md');
      expect(existsSync(join(workspaceRoot, 'wiki/entities/nx-dev.md'))).toBe(true);
    });

    it('should include publication source page in allCreatedPages but not author page', async () => {
      writeSessionJson({ articleAuthor: undefined });
      writeFindingsSummary({ author: 'Unknown' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.allCreatedPages).toContain('wiki/entities/nx-dev.md');
      // No author page path should be in the list
      const authorPages = result.allCreatedPages.filter(p =>
        p.includes('manfred-steyer') || p.includes('unknown')
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

      const result = await acceptPublication(workspaceRoot, sessionDir);

      const sourcePageContent = readFileSync(
        join(workspaceRoot, result.sourcePagePath),
        'utf-8'
      );
      // Should NOT have a publication source WikiLink
      expect(sourcePageContent).not.toContain('**Publication Source:**');
    });

    it('should not create a publication source page', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.publicationSourceResult).toBeUndefined();
      // No publication source page should exist
      expect(existsSync(join(workspaceRoot, 'wiki/entities/nx-dev.md'))).toBe(false);
    });

    it('should still create author page if articleAuthor is present', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.authorResult).toBeDefined();
      expect(result.authorResult!.action).toBe('created');
      expect(result.authorResult!.path).toBe('wiki/entities/manfred-steyer.md');
      expect(existsSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'))).toBe(true);
    });

    it('should include author page in allCreatedPages but not publication source page', async () => {
      writeSessionJson({
        articleUrl: undefined,
        articleInputType: 'pasted-text',
      });
      writeFindingsSummary({ url: 'Pasted text' });

      const result = await acceptPublication(workspaceRoot, sessionDir);

      expect(result.allCreatedPages).toContain('wiki/entities/manfred-steyer.md');
      // No publication source page path should be in the list
      const pubSourcePages = result.allCreatedPages.filter(p => p.includes('nx-dev'));
      expect(pubSourcePages).toHaveLength(0);
    });
  });
});
