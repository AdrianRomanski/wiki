/**
 * Property-Based Tests for Author Page Generation
 * Feature: article-author-source-discovery
 *
 * Properties tested:
 * - Property 3: Author page generation produces valid frontmatter
 * - Property 5: Author page contains article WikiLink
 * - Property 7: Existing author page append preserves content
 * - Property 12: Graceful skip when author is absent
 *
 * Validates: Requirements 1.3, 1.4, 1.5, 8.1, 8.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { generateAuthorPage, publishAuthorPage, generateAuthorSlug, AuthorPageParams } from './generate-author-page';

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
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests: Author Page Generation', () => {
  /**
   * Property 3: Author page generation produces valid frontmatter
   *
   * For any valid AuthorPageParams (non-empty author name, non-empty article title,
   * valid date), the generateAuthorPage function SHALL produce markdown content where:
   * (a) the YAML frontmatter is parseable by a standard YAML parser,
   * (b) title equals the author's full name,
   * (c) type equals "entity",
   * (d) tags contains "author" and "person", and
   * (e) created and updated are valid YYYY-MM-DD date strings.
   *
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Author page generation produces valid frontmatter', () => {
    it('(a) YAML frontmatter is parseable by a standard YAML parser', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);
          const parsed = matter(content);

          // gray-matter should parse without throwing
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

  /**
   * Property 5: Author page contains article WikiLink
   *
   * For any valid AuthorPageParams, the generated author page SHALL contain
   * a WikiLink [[articleTitle]] in the Articles section and a WikiLink
   * [[sourcePageTitle]] in the References section.
   *
   * **Validates: Requirements 1.4**
   */
  describe('Property 5: Author page contains article WikiLink', () => {
    it('should contain a WikiLink [[articleTitle]] in the Articles section', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          const content = generateAuthorPage(params);

          // Extract the Articles section
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

          // Extract the References section
          const referencesMatch = content.match(/## References\s*\n([\s\S]*?)$/);
          expect(referencesMatch).not.toBeNull();

          const referencesSection = referencesMatch![1];
          expect(referencesSection).toContain(`[[${params.sourcePageTitle}]]`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Existing author page append preserves content
   *
   * For any existing author page content and new article entry, appending to
   * the author page SHALL:
   * (a) preserve all existing content before the append point,
   * (b) add exactly one new entry to the Articles section, and
   * (c) not duplicate an entry that already exists.
   *
   * **Validates: Requirements 8.1, 8.5**
   */
  describe('Property 7: Existing author page append preserves content', () => {
    let workspaceRoot: string;

    beforeEach(() => {
      workspaceRoot = join(
        tmpdir(),
        `pbt-author-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
    });

    afterEach(() => {
      rmSync(workspaceRoot, { recursive: true, force: true });
    });

    it('(a) preserves all existing content before the append point', () => {
      fc.assert(
        fc.property(
          authorPageParamsArb,
          authorPageParamsArb,
          (initialParams, newParams) => {
            // Ensure the new params use the same author but different article
            const params2: AuthorPageParams = {
              ...newParams,
              authorName: initialParams.authorName,
            };

            // Create initial page
            const initialContent = generateAuthorPage(initialParams);
            const slug = generateAuthorSlug(initialParams.authorName);

            const pagePath = join(workspaceRoot, 'wiki', 'entities', `${slug}.md`);
            writeFileSync(pagePath, initialContent, 'utf-8');

            // Append new article
            publishAuthorPage(workspaceRoot, params2);

            // Read updated content
            const updatedContent = readFileSync(pagePath, 'utf-8');

            // The original article WikiLink should still be present
            expect(updatedContent).toContain(`[[${initialParams.articleTitle}]]`);
            // The original source page WikiLink should still be present
            expect(updatedContent).toContain(`[[${initialParams.sourcePageTitle}]]`);
            // The definition section should be preserved
            expect(updatedContent).toContain('is an article author whose work has been processed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('(b) adds exactly one new entry to the Articles section after append', () => {
      fc.assert(
        fc.property(
          authorPageParamsArb,
          authorPageParamsArb,
          (initialParams, newParams) => {
            // Ensure different source page titles to avoid duplicate detection
            const params2: AuthorPageParams = {
              ...newParams,
              authorName: initialParams.authorName,
              sourcePageTitle: newParams.sourcePageTitle + ' New',
            };

            // Create initial page
            const initialContent = generateAuthorPage(initialParams);
            const slug = generateAuthorSlug(initialParams.authorName);

            const pagePath = join(workspaceRoot, 'wiki', 'entities', `${slug}.md`);
            writeFileSync(pagePath, initialContent, 'utf-8');

            // Count initial article entries (lines starting with "- [[")
            const initialArticleEntries = initialContent
              .split('\n')
              .filter((line) => line.startsWith('- [['));

            // Append new article
            const result = publishAuthorPage(workspaceRoot, params2);

            if (result.action === 'updated') {
              const updatedContent = readFileSync(pagePath, 'utf-8');
              const updatedArticleEntries = updatedContent
                .split('\n')
                .filter((line) => line.startsWith('- [['));

              // Should have exactly one more entry
              expect(updatedArticleEntries.length).toBe(initialArticleEntries.length + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('(c) does not duplicate an entry that already exists', () => {
      fc.assert(
        fc.property(authorPageParamsArb, (params) => {
          // Create initial page
          const initialContent = generateAuthorPage(params);
          const slug = generateAuthorSlug(params.authorName);

          const pagePath = join(workspaceRoot, 'wiki', 'entities', `${slug}.md`);
          writeFileSync(pagePath, initialContent, 'utf-8');

          // Try to publish the same article again (same sourcePageTitle)
          const result = publishAuthorPage(workspaceRoot, params);

          // Should be skipped because the WikiLink already exists
          expect(result.action).toBe('skipped');

          // Content should be unchanged
          const updatedContent = readFileSync(pagePath, 'utf-8');
          expect(updatedContent).toBe(initialContent);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Graceful skip when author is absent
   *
   * For any session where articleAuthor is absent or empty, the publishAuthorPage
   * function SHALL return a result with action: 'skipped' and SHALL NOT write
   * any file to disk.
   *
   * **Validates: Requirements 1.5**
   */
  describe('Property 12: Graceful skip when author is absent', () => {
    let workspaceRoot: string;

    beforeEach(() => {
      workspaceRoot = join(
        tmpdir(),
        `pbt-skip-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
    });

    afterEach(() => {
      rmSync(workspaceRoot, { recursive: true, force: true });
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

    it('should return action "skipped" for empty or whitespace-only author names', () => {
      fc.assert(
        fc.property(
          emptyOrWhitespaceArb,
          articleTitleArb,
          sourcePageTitleArb,
          sourcePageSlugArb,
          dateArb,
          (authorName, articleTitle, sourcePageTitle, sourcePageSlug, finalizedAt) => {
            const params: AuthorPageParams = {
              authorName,
              articleTitle,
              sourcePageTitle,
              sourcePageSlug,
              finalizedAt,
            };

            const result = publishAuthorPage(workspaceRoot, params);
            expect(result.action).toBe('skipped');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT write any file to disk for empty or whitespace-only author names', () => {
      fc.assert(
        fc.property(
          emptyOrWhitespaceArb,
          articleTitleArb,
          sourcePageTitleArb,
          sourcePageSlugArb,
          dateArb,
          (authorName, articleTitle, sourcePageTitle, sourcePageSlug, finalizedAt) => {
            const params: AuthorPageParams = {
              authorName,
              articleTitle,
              sourcePageTitle,
              sourcePageSlug,
              finalizedAt,
            };

            publishAuthorPage(workspaceRoot, params);

            // The entities directory should remain empty (no files created)
            const { readdirSync } = require('fs');
            const files = readdirSync(join(workspaceRoot, 'wiki', 'entities'));
            expect(files.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
