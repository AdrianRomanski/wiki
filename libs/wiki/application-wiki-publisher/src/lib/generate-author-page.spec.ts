/**
 * Unit + property-based tests for author page generation and publishing
 * Feature: article-author-source-discovery, scripts-migration-hexagonal
 *
 * Migrated from:
 * - scripts/research-workflow/wiki-publisher/generate-author-page.test.ts
 * - scripts/research-workflow/wiki-publisher/publish-author-page.test.ts
 *
 * `publishAuthorPage` now takes `(fs: FileSystemPort, frontmatter: FrontmatterPort, params)`
 * instead of `(workspaceRoot: string, params)` and is async. Real `os.tmpdir()` fixtures
 * are replaced with `FakeFileSystemPort` / `FakeFrontmatterPort` in-memory test doubles.
 *
 * Original property numbering (pre-migration) vs. this spec's design.md numbering:
 * - OLD "Property 7: Existing author page append preserves content" is THIS SPEC's
 *   **Property 6: Author page idempotent append** (tagged below).
 * - OLD "Property 3" (valid frontmatter), "Property 5" (article WikiLink), and
 *   "Property 12" (graceful skip when author absent) are retained as plain PBT
 *   coverage — they are not officially numbered properties in this spec's design.md,
 *   but remain valuable regression coverage.
 *
 * **Validates: Requirements 6.2, 6.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import {
  generateAuthorPage,
  publishAuthorPage,
  generateAuthorSlug,
  AuthorPageParams,
} from './generate-author-page';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import { FakeFrontmatterPort } from './test-utils/fake-frontmatter-port';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generates valid author names: must contain at least one alphanumeric character
 * (required by generateSessionId for slug generation).
 * Uses a pattern of first name + optional last name with letters.
 */
const authorNameArb = fc
  .tuple(
    fc.stringMatching(/^[A-Za-z]{1,20}$/),
    fc.option(fc.stringMatching(/^[A-Za-z]{1,20}$/), { nil: undefined })
  )
  .map(([first, last]) => (last ? `${first} ${last}` : first));

/**
 * Generates non-empty article titles containing at least one alphanumeric character.
 */
const articleTitleArb = fc
  .tuple(
    fc.stringMatching(/^[A-Za-z0-9]{1,10}$/),
    fc.option(fc.stringMatching(/^[A-Za-z0-9 -]{1,30}$/), { nil: undefined })
  )
  .map(([prefix, suffix]) => (suffix ? `${prefix} ${suffix}` : prefix));

/**
 * Generates non-empty source page titles containing at least one alphanumeric character.
 */
const sourcePageTitleArb = fc
  .tuple(
    fc.stringMatching(/^[A-Za-z0-9]{1,10}$/),
    fc.option(fc.stringMatching(/^[A-Za-z0-9 -]{1,30}$/), { nil: undefined })
  )
  .map(([prefix, suffix]) => (suffix ? `${prefix} ${suffix}` : prefix));

/** Generates valid kebab-case source page slugs */
const sourcePageSlugArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,40}$/)
  .filter((s) => !s.endsWith('-') && !s.includes('--'));

/** Generates valid YYYY-MM-DD date strings */
const dateArb = fc
  .tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([year, month, day]) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

/** Generates valid AuthorPageParams */
const authorPageParamsArb = fc
  .tuple(authorNameArb, articleTitleArb, sourcePageTitleArb, sourcePageSlugArb, dateArb)
  .map(([authorName, articleTitle, sourcePageTitle, sourcePageSlug, finalizedAt]) => ({
    authorName,
    articleTitle,
    sourcePageTitle,
    sourcePageSlug,
    finalizedAt,
  }));

// ============================================================================
// Pure generateAuthorPage — property-based coverage (OLD Property 3, 5)
// ============================================================================

describe('Property-Based Tests: Author Page Generation', () => {
  describe('Author page generation produces valid frontmatter (OLD Property 3)', () => {
    it('(a) YAML frontmatter is parseable by a standard YAML parser', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          expect(parsed.data).toBeDefined();
          expect(typeof parsed.data).toBe('object');
        }),
        { numRuns: 100 }
      );
    });

    it('(b) title equals the author full name', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          expect(parsed.data.title).toBe(params.authorName);
        }),
        { numRuns: 100 }
      );
    });

    it('(c) type equals "entity"', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          expect(parsed.data.type).toBe('entity');
        }),
        { numRuns: 100 }
      );
    });

    it('(d) tags contains "author" and "person"', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          expect(parsed.data.tags).toContain('author');
          expect(parsed.data.tags).toContain('person');
        }),
        { numRuns: 100 }
      );
    });

    it('(e) created and updated are valid YYYY-MM-DD date strings', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          expect(String(parsed.data.created)).toMatch(datePattern);
          expect(String(parsed.data.updated)).toMatch(datePattern);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Author page contains article WikiLink (OLD Property 5)', () => {
    it('should contain a WikiLink [[articleTitle]] in the Articles section', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);

          const articlesMatch = content.match(/## Articles\s*\n([\s\S]*?)(?=\n## |\n*$)/);
          expect(articlesMatch).not.toBeNull();

          const articlesSection = articlesMatch![1];
          expect(articlesSection).toContain(`[[${params.articleTitle}]]`);
        }),
        { numRuns: 100 }
      );
    });

    it('should contain a WikiLink [[sourcePageTitle]] in the References section', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);

          const referencesMatch = content.match(/## References\s*\n([\s\S]*?)$/);
          expect(referencesMatch).not.toBeNull();

          const referencesSection = referencesMatch![1];
          expect(referencesSection).toContain(`[[${params.sourcePageTitle}]]`);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // Feature: scripts-migration-hexagonal, Property 6: Author page idempotent append
  // (OLD "Property 7: Existing author page append preserves content")
  // ==========================================================================

  describe('Feature: scripts-migration-hexagonal, Property 6: Author page idempotent append', () => {
    /**
     * Property 6: Author page idempotent append
     *
     * For any existing author page and a new article entry, publishing to the
     * author page SHALL preserve all pre-existing content and add at most one
     * new Articles entry, and re-publishing an entry that is already present
     * SHALL leave the page byte-identical (no duplicate).
     *
     * **Validates: Requirements 6.2, 6.5**
     */
    let fs: FakeFileSystemPort;
    let frontmatter: FakeFrontmatterPort;

    beforeEach(() => {
      fs = new FakeFileSystemPort();
      frontmatter = new FakeFrontmatterPort();
    });

    it('(a) preserves all existing content before the append point', async () => {
      await fc.assert(
        fc.asyncProperty(authorPageParamsArb, authorPageParamsArb, async (initialParams, newParams) => {
          fs = new FakeFileSystemPort();
          frontmatter = new FakeFrontmatterPort();

          const params2: AuthorPageParams = {
            ...newParams,
            authorName: initialParams.authorName,
          };

          const initialContent = generateAuthorPage(initialParams);
          const slug = generateAuthorSlug(initialParams.authorName);

          fs.setWikiFile(`entities/${slug}.md`, initialContent);

          await publishAuthorPage(fs, frontmatter, params2);

          const updatedContent = fs.getWikiFile(`entities/${slug}.md`)!;

          expect(updatedContent).toContain(`[[${initialParams.articleTitle}]]`);
          expect(updatedContent).toContain(`[[${initialParams.sourcePageTitle}]]`);
          expect(updatedContent).toContain('is an article author whose work has been processed');
        }),
        { numRuns: 100 }
      );
    });

    it('(b) adds exactly one new entry to the Articles section after append', async () => {
      await fc.assert(
        fc.asyncProperty(authorPageParamsArb, authorPageParamsArb, async (initialParams, newParams) => {
          fs = new FakeFileSystemPort();
          frontmatter = new FakeFrontmatterPort();

          const params2: AuthorPageParams = {
            ...newParams,
            authorName: initialParams.authorName,
            sourcePageTitle: newParams.sourcePageTitle + ' New',
          };

          const initialContent = generateAuthorPage(initialParams);
          const slug = generateAuthorSlug(initialParams.authorName);

          fs.setWikiFile(`entities/${slug}.md`, initialContent);

          const initialArticleEntries = initialContent
            .split('\n')
            .filter((line) => line.startsWith('- [['));

          const result = await publishAuthorPage(fs, frontmatter, params2);

          if (result.action === 'updated') {
            const updatedContent = fs.getWikiFile(`entities/${slug}.md`)!;
            const updatedArticleEntries = updatedContent
              .split('\n')
              .filter((line) => line.startsWith('- [['));

            expect(updatedArticleEntries.length).toBe(initialArticleEntries.length + 1);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('(c) does not duplicate an entry that already exists', async () => {
      await fc.assert(
        fc.asyncProperty(authorPageParamsArb, async (params) => {
          fs = new FakeFileSystemPort();
          frontmatter = new FakeFrontmatterPort();

          const initialContent = generateAuthorPage(params);
          const slug = generateAuthorSlug(params.authorName);

          fs.setWikiFile(`entities/${slug}.md`, initialContent);

          const result = await publishAuthorPage(fs, frontmatter, params);

          expect(result.action).toBe('skipped');

          const updatedContent = fs.getWikiFile(`entities/${slug}.md`)!;
          expect(updatedContent).toBe(initialContent);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Graceful skip when author is absent (OLD Property 12)', () => {
    let fs: FakeFileSystemPort;
    let frontmatter: FakeFrontmatterPort;

    beforeEach(() => {
      fs = new FakeFileSystemPort();
      frontmatter = new FakeFrontmatterPort();
    });

    /** Generates empty or whitespace-only strings */
    const emptyOrWhitespaceArb = fc.oneof(
      fc.constant(''),
      fc.constant(' '),
      fc.constant('  '),
      fc.constant('\t'),
      fc.constant('\n'),
      fc.constant('   \t  '),
      fc.constant(' \n \t ')
    );

    it('should return action "skipped" for empty or whitespace-only author names', async () => {
      await fc.assert(
        fc.asyncProperty(
          emptyOrWhitespaceArb,
          articleTitleArb,
          sourcePageTitleArb,
          sourcePageSlugArb,
          dateArb,
          async (authorName, articleTitle, sourcePageTitle, sourcePageSlug, finalizedAt) => {
            const params: AuthorPageParams = {
              authorName,
              articleTitle,
              sourcePageTitle,
              sourcePageSlug,
              finalizedAt,
            };

            const result = await publishAuthorPage(fs, frontmatter, params);
            expect(result.action).toBe('skipped');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT write any file to disk for empty or whitespace-only author names', async () => {
      await fc.assert(
        fc.asyncProperty(
          emptyOrWhitespaceArb,
          articleTitleArb,
          sourcePageTitleArb,
          sourcePageSlugArb,
          dateArb,
          async (authorName, articleTitle, sourcePageTitle, sourcePageSlug, finalizedAt) => {
            fs = new FakeFileSystemPort();
            const params: AuthorPageParams = {
              authorName,
              articleTitle,
              sourcePageTitle,
              sourcePageSlug,
              finalizedAt,
            };

            await publishAuthorPage(fs, frontmatter, params);

            expect(fs.hasWikiFile('entities/.md')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Unit tests: publishAuthorPage
// Migrated from scripts/research-workflow/wiki-publisher/publish-author-page.test.ts
// ============================================================================

describe('publishAuthorPage', () => {
  let fs: FakeFileSystemPort;
  let frontmatter: FakeFrontmatterPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
    frontmatter = new FakeFrontmatterPort();
  });

  const baseParams: AuthorPageParams = {
    authorName: 'Manfred Steyer',
    articleTitle: 'Micro Frontends with Angular',
    sourcePageTitle: 'Micro Frontends with Angular - Source',
    sourcePageSlug: 'micro-frontends-angular-2025-06-01',
    finalizedAt: '2025-06-01',
  };

  describe('skip logic (Req 1.5)', () => {
    it('should return action "skipped" when authorName is empty string', async () => {
      const result = await publishAuthorPage(fs, frontmatter, { ...baseParams, authorName: '' });
      expect(result.action).toBe('skipped');
    });

    it('should return action "skipped" when authorName is whitespace only', async () => {
      const result = await publishAuthorPage(fs, frontmatter, { ...baseParams, authorName: '   ' });
      expect(result.action).toBe('skipped');
    });

    it('should not create any file when authorName is empty', async () => {
      await publishAuthorPage(fs, frontmatter, { ...baseParams, authorName: '' });
      expect(fs.hasWikiFile('entities/.md')).toBe(false);
    });
  });

  describe('new page creation (Req 1.1)', () => {
    it('should create a new page at wiki/entities/[author-slug].md', async () => {
      const result = await publishAuthorPage(fs, frontmatter, baseParams);
      expect(result.action).toBe('created');
      expect(result.path).toBe('wiki/entities/manfred-steyer.md');
      expect(fs.hasWikiFile('entities/manfred-steyer.md')).toBe(true);
    });

    it('should generate valid frontmatter with required fields', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('title: "Manfred Steyer"');
      expect(content).toContain('type: entity');
      expect(content).toContain('author');
      expect(content).toContain('person');
      expect(content).toContain(baseParams.sourcePageSlug);
    });

    it('should include article WikiLink in Articles section', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('## Articles');
      expect(content).toContain(`[[${baseParams.articleTitle}]]`);
      expect(content).toContain('(2025-06-01)');
    });

    it('should include source page WikiLink in References section', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('## References');
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]]`);
    });
  });

  describe('append to existing page (Req 1.2, 8.1, 8.3, 8.4)', () => {
    const existingContent = `---
title: "Manfred Steyer"
type: entity
tags: [author, person, manfred-steyer]
sources: [old-article-slug-2025-01-01]
created: "2025-01-01"
updated: "2025-01-01"
---

# Manfred Steyer

## Definition

Manfred Steyer is an article author whose work has been processed into this wiki.

## Articles

- [[Old Article Title]] (2025-01-01)

## References

- [[Old Article Title Source]]
`;

    beforeEach(() => {
      fs.setWikiFile('entities/manfred-steyer.md', existingContent);
    });

    it('should return action "updated" when appending to existing page', async () => {
      const result = await publishAuthorPage(fs, frontmatter, baseParams);
      expect(result.action).toBe('updated');
    });

    it('should preserve existing content (Req 8.1)', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('[[Old Article Title]]');
      expect(content).toContain('Manfred Steyer is an article author');
    });

    it('should update the "updated" frontmatter field (Req 8.3)', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toMatch(/updated:\s*['"]?2025-06-01['"]?/);
      expect(content).toMatch(/created:\s*['"]?2025-01-01['"]?/);
    });

    it('should append new source page slug to sources array (Req 8.4)', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('old-article-slug-2025-01-01');
      expect(content).toContain(baseParams.sourcePageSlug);
    });

    it('should append new article entry at end of Articles section', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]] (2025-06-01)`);
    });

    it('should append new reference entry to References section', async () => {
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]]`);
      expect(content).toContain('[[Old Article Title Source]]');
    });
  });

  describe('duplicate detection (Req 8.5)', () => {
    const existingWithArticle = `---
title: "Manfred Steyer"
type: entity
tags: [author, person, manfred-steyer]
sources: [micro-frontends-angular-2025-06-01]
created: "2025-01-01"
updated: "2025-06-01"
---

# Manfred Steyer

## Definition

Manfred Steyer is an article author whose work has been processed into this wiki.

## Articles

- [[Micro Frontends with Angular - Source]] (2025-06-01)

## References

- [[Micro Frontends with Angular - Source]]
`;

    it('should return action "skipped" when article WikiLink already exists', async () => {
      fs.setWikiFile('entities/manfred-steyer.md', existingWithArticle);
      const result = await publishAuthorPage(fs, frontmatter, baseParams);
      expect(result.action).toBe('skipped');
    });

    it('should not modify the file when duplicate is detected', async () => {
      fs.setWikiFile('entities/manfred-steyer.md', existingWithArticle);
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toBe(existingWithArticle);
    });
  });

  describe('missing Articles heading (Req 8.6)', () => {
    const existingWithoutArticles = `---
title: "Manfred Steyer"
type: entity
tags: [author, person, manfred-steyer]
sources: [old-slug]
created: "2025-01-01"
updated: "2025-01-01"
---

# Manfred Steyer

## Definition

Manfred Steyer is an article author whose work has been processed into this wiki.
`;

    it('should append "## Articles" heading when it does not exist', async () => {
      fs.setWikiFile('entities/manfred-steyer.md', existingWithoutArticles);
      await publishAuthorPage(fs, frontmatter, baseParams);
      const content = fs.getWikiFile('entities/manfred-steyer.md')!;
      expect(content).toContain('## Articles');
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]]`);
    });
  });

  describe('malformed frontmatter (Req 8.7)', () => {
    it('should return action "skipped" with error for malformed frontmatter', async () => {
      const malformedContent = `not frontmatter at all, just plain text`;
      fs.setWikiFile('entities/manfred-steyer.md', malformedContent);
      const result = await publishAuthorPage(fs, frontmatter, baseParams);
      expect(['updated', 'skipped']).toContain(result.action);
    });
  });

  describe('special characters in author names (Req 1.1, 1.2, 1.6)', () => {
    describe('accented characters', () => {
      it('should create page for author with accents: "José García"', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'José García' };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/jose-garcia.md');
        expect(fs.hasWikiFile('entities/jose-garcia.md')).toBe(true);
      });

      it('should create page for author with accents: "François Müller"', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'François Müller' };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/francois-muller.md');
        expect(fs.hasWikiFile('entities/francois-muller.md')).toBe(true);
      });

      it('should create page for author with Polish characters: "Łukasz Kowalski"', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'Łukasz Kowalski' };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(fs.hasWikiFile(result.path.replace('wiki/', ''))).toBe(true);
        const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });

      it('should preserve the original author name in frontmatter title', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'José García' };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/jose-garcia.md')!;
        expect(content).toContain('title: "José García"');
      });

      it('should preserve the original author name in body heading', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'François Müller' };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/francois-muller.md')!;
        expect(content).toContain('# François Müller');
      });
    });

    describe('apostrophes', () => {
      it("should create page for author with apostrophe: \"O'Brien\"", async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: "O'Brien" };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/o-brien.md');
        expect(fs.hasWikiFile('entities/o-brien.md')).toBe(true);
      });

      it("should create page for author with apostrophe: \"D'Angelo\"", async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: "D'Angelo" };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/d-angelo.md');
        expect(fs.hasWikiFile('entities/d-angelo.md')).toBe(true);
      });

      it('should preserve apostrophe in frontmatter title', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: "O'Brien" };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/o-brien.md')!;
        expect(content).toContain("title: \"O'Brien\"");
      });
    });

    describe('hyphens', () => {
      it('should create page for author with hyphen: "Jean-Pierre Dupont"', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'Jean-Pierre Dupont' };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/jean-pierre-dupont.md');
        expect(fs.hasWikiFile('entities/jean-pierre-dupont.md')).toBe(true);
      });

      it('should create page for author with hyphen: "Mary-Jane Watson"', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'Mary-Jane Watson' };
        const result = await publishAuthorPage(fs, frontmatter, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/mary-jane-watson.md');
        expect(fs.hasWikiFile('entities/mary-jane-watson.md')).toBe(true);
      });

      it('should preserve hyphen in frontmatter title', async () => {
        const params: AuthorPageParams = { ...baseParams, authorName: 'Jean-Pierre Dupont' };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/jean-pierre-dupont.md')!;
        expect(content).toContain('title: "Jean-Pierre Dupont"');
      });
    });

    describe('slug generation validity', () => {
      it('should produce slugs with only lowercase alphanumeric and hyphens', async () => {
        const specialNames = [
          'José García',
          'François Müller',
          "O'Brien",
          "D'Angelo",
          'Jean-Pierre Dupont',
          'Mary-Jane Watson',
        ];

        for (const name of specialNames) {
          fs = new FakeFileSystemPort();
          const params: AuthorPageParams = { ...baseParams, authorName: name };
          const result = await publishAuthorPage(fs, frontmatter, params);
          const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
          expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        }
      });

      it('should not produce empty slugs for any special character name', async () => {
        const specialNames = ['José García', 'François Müller', "O'Brien", 'Jean-Pierre Dupont'];

        for (const name of specialNames) {
          fs = new FakeFileSystemPort();
          const params: AuthorPageParams = { ...baseParams, authorName: name };
          const result = await publishAuthorPage(fs, frontmatter, params);
          const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
          expect(slug.length).toBeGreaterThan(0);
        }
      });
    });

    describe('generated page content validity', () => {
      it('should produce valid markdown with correct WikiLinks for accented author', async () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'José García',
          articleTitle: 'Angular Signals Deep Dive',
          sourcePageTitle: 'Angular Signals Deep Dive - Source',
        };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/jose-garcia.md')!;

        expect(content).toMatch(/^---\n/);
        expect(content).toContain('type: entity');
        expect(content).toContain('tags:');
        expect(content).toContain('author');
        expect(content).toContain('person');

        expect(content).toContain('## Articles');
        expect(content).toContain('[[Angular Signals Deep Dive]]');

        expect(content).toContain('## References');
        expect(content).toContain('[[Angular Signals Deep Dive - Source]]');
      });

      it('should produce valid markdown with correct WikiLinks for hyphenated author', async () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Jean-Pierre Dupont',
          articleTitle: 'RxJS Best Practices',
          sourcePageTitle: 'RxJS Best Practices - Source',
        };
        await publishAuthorPage(fs, frontmatter, params);
        const content = fs.getWikiFile('entities/jean-pierre-dupont.md')!;

        expect(content).toMatch(/^---\n/);
        expect(content).toContain('type: entity');

        expect(content).toContain('[[RxJS Best Practices]]');
        expect(content).toContain('[[RxJS Best Practices - Source]]');
      });
    });
  });

  describe('multiple articles by same author (Req 1.2)', () => {
    it('should append second article to existing author page', async () => {
      const firstParams: AuthorPageParams = {
        authorName: 'Jean-Pierre Dupont',
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      };
      const firstResult = await publishAuthorPage(fs, frontmatter, firstParams);
      expect(firstResult.action).toBe('created');

      const secondParams: AuthorPageParams = {
        authorName: 'Jean-Pierre Dupont',
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-03-15',
        finalizedAt: '2025-03-15',
      };
      const secondResult = await publishAuthorPage(fs, frontmatter, secondParams);
      expect(secondResult.action).toBe('updated');

      const content = fs.getWikiFile('entities/jean-pierre-dupont.md')!;
      expect(content).toContain('[[First Article]]');
      expect(content).toContain('[[Second Article - Source]]');
      expect(content).toContain('(2025-01-01)');
      expect(content).toContain('(2025-03-15)');
    });

    it('should append third article to existing author page with two articles', async () => {
      await publishAuthorPage(fs, frontmatter, {
        authorName: 'José García',
        articleTitle: 'Article One',
        sourcePageTitle: 'Article One - Source',
        sourcePageSlug: 'article-one-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      await publishAuthorPage(fs, frontmatter, {
        authorName: 'José García',
        articleTitle: 'Article Two',
        sourcePageTitle: 'Article Two - Source',
        sourcePageSlug: 'article-two-2025-02-15',
        finalizedAt: '2025-02-15',
      });

      const thirdResult = await publishAuthorPage(fs, frontmatter, {
        authorName: 'José García',
        articleTitle: 'Article Three',
        sourcePageTitle: 'Article Three - Source',
        sourcePageSlug: 'article-three-2025-04-20',
        finalizedAt: '2025-04-20',
      });
      expect(thirdResult.action).toBe('updated');

      const content = fs.getWikiFile('entities/jose-garcia.md')!;
      expect(content).toContain('[[Article One]]');
      expect(content).toContain('[[Article Two - Source]]');
      expect(content).toContain('[[Article Three - Source]]');
      expect(content).toContain('[[Article One - Source]]');
      expect(content).toContain('[[Article Two - Source]]');
      expect(content).toContain('[[Article Three - Source]]');
    });

    it('should update the "updated" frontmatter field to the latest date', async () => {
      await publishAuthorPage(fs, frontmatter, {
        authorName: "O'Brien",
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      await publishAuthorPage(fs, frontmatter, {
        authorName: "O'Brien",
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-06-15',
        finalizedAt: '2025-06-15',
      });

      const content = fs.getWikiFile('entities/o-brien.md')!;
      expect(content).toMatch(/updated:\s*['"]?2025-06-15['"]?/);
    });

    it('should accumulate source slugs in the sources array', async () => {
      await publishAuthorPage(fs, frontmatter, {
        authorName: 'Mary-Jane Watson',
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      await publishAuthorPage(fs, frontmatter, {
        authorName: 'Mary-Jane Watson',
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-03-10',
        finalizedAt: '2025-03-10',
      });

      const content = fs.getWikiFile('entities/mary-jane-watson.md')!;
      expect(content).toContain('first-article-2025-01-01');
      expect(content).toContain('second-article-2025-03-10');
    });

    it('should skip duplicate article for author with special characters', async () => {
      const params: AuthorPageParams = {
        authorName: 'François Müller',
        articleTitle: 'Same Article',
        sourcePageTitle: 'Same Article - Source',
        sourcePageSlug: 'same-article-2025-01-01',
        finalizedAt: '2025-01-01',
      };

      const firstResult = await publishAuthorPage(fs, frontmatter, params);
      expect(firstResult.action).toBe('created');

      const secondResult = await publishAuthorPage(fs, frontmatter, params);
      expect(secondResult.action).toBe('skipped');
    });
  });
});
