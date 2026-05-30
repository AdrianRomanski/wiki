/**
 * Property-Based Tests for publication source page generation
 * Feature: article-author-source-discovery
 *
 * Properties tested:
 * - Property 4: Publication source page generation produces valid frontmatter
 * - Property 6: Publication source page contains article WikiLink with author
 * - Property 8: Existing publication source page append preserves content
 * - Property 13: Graceful skip when URL is absent
 *
 * **Validates: Requirements 2.6, 2.7, 2.9, 8.2, 8.5**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import {
  generatePublicationSourcePage,
  publishPublicationSourcePage,
  PublicationSourcePageParams,
} from './generate-publication-source-page';

// ============================================================================
// Custom Arbitraries
// ============================================================================

/** Generates valid domain segments (lowercase alphanumeric, 1-10 chars) */
const domainSegment = fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);

/** Generates valid domain names (e.g., "abc.def.io", "example.com") */
const domainArbitrary = fc
  .tuple(
    domainSegment,
    fc.array(domainSegment, { minLength: 1, maxLength: 3 })
  )
  .map(([first, rest]) => [first, ...rest].join('.'));

/** Generates non-empty article titles (alphanumeric with spaces, 1-80 chars) */
const articleTitleArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,79}$/)
  .filter((s) => s.trim().length > 0);

/** Generates non-empty author names */
const authorNameArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z ]{0,49}$/)
  .filter((s) => s.trim().length > 0);

/** Generates valid YYYY-MM-DD date strings from year/month/day integers */
const dateArbitrary = fc
  .tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }) // Use 28 to avoid invalid day-of-month
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generates valid source page slugs (kebab-case) */
const sourcePageSlugArbitrary = fc
  .tuple(articleTitleArbitrary, dateArbitrary)
  .map(([title, date]) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-${date}`;
  });

/** Generates valid PublicationSourcePageParams */
const validParamsArbitrary = fc
  .tuple(
    domainArbitrary,
    articleTitleArbitrary,
    authorNameArbitrary,
    articleTitleArbitrary,
    sourcePageSlugArbitrary,
    dateArbitrary
  )
  .map(([domain, articleTitle, articleAuthor, sourcePageTitleBase, sourcePageSlug, finalizedAt]) => ({
    domain,
    articleTitle,
    articleAuthor,
    sourcePageTitle: `${sourcePageTitleBase} — ${finalizedAt}`,
    sourcePageSlug,
    finalizedAt,
  }));

/** Generates valid params with author present */
const validParamsWithAuthorArbitrary = validParamsArbitrary.filter(
  (p) => p.articleAuthor !== undefined && p.articleAuthor.trim().length > 0
);

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests: Publication Source Page Generation', () => {
  /**
   * Property 4: Publication source page generation produces valid frontmatter
   *
   * For any valid PublicationSourcePageParams (non-empty domain, non-empty article title,
   * valid date), the generatePublicationSourcePage function SHALL produce markdown content
   * where: (a) the YAML frontmatter is parseable by a standard YAML parser, (b) title
   * equals the domain name, (c) type equals "entity", (d) tags contains "publication-source"
   * and "website", and (e) created and updated are valid YYYY-MM-DD date strings.
   *
   * **Validates: Requirements 2.4**
   */
  describe('Property 4: Publication source page generation produces valid frontmatter', () => {
    it('should produce parseable YAML frontmatter with title equal to domain name', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          // (a) YAML frontmatter is parseable (no throw from gray-matter)
          expect(parsed.data).toBeDefined();

          // (b) title equals the domain name
          expect(parsed.data.title).toBe(params.domain);
        }),
        { numRuns: 100 }
      );
    });

    it('should have type equal to "entity"', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          // (c) type equals "entity"
          expect(parsed.data.type).toBe('entity');
        }),
        { numRuns: 100 }
      );
    });

    it('should have tags containing "publication-source" and "website"', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          // (d) tags contains "publication-source" and "website"
          expect(parsed.data.tags).toContain('publication-source');
          expect(parsed.data.tags).toContain('website');
        }),
        { numRuns: 100 }
      );
    });

    it('should have created and updated as valid YYYY-MM-DD date strings', () => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          // (e) created and updated are valid YYYY-MM-DD date strings
          expect(parsed.data.created).toMatch(datePattern);
          expect(parsed.data.updated).toMatch(datePattern);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Publication source page contains article WikiLink with author
   *
   * For any valid PublicationSourcePageParams with articleAuthor present, the generated
   * publication source page SHALL contain a line in the Articles section that includes
   * both [[articleTitle]] and the author name.
   *
   * **Validates: Requirements 2.5**
   */
  describe('Property 6: Publication source page contains article WikiLink with author', () => {
    it('should contain [[articleTitle]] WikiLink in the Articles section', () => {
      fc.assert(
        fc.property(validParamsWithAuthorArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);

          // Extract the Articles section
          const articlesMatch = content.match(/## Articles\n\n([\s\S]*?)(?=\n## |\n*$)/);
          expect(articlesMatch).not.toBeNull();

          const articlesSection = articlesMatch![1];

          // Should contain WikiLink to article title
          expect(articlesSection).toContain(`[[${params.articleTitle}]]`);
        }),
        { numRuns: 100 }
      );
    });

    it('should contain the author name on the same line as the article WikiLink', () => {
      fc.assert(
        fc.property(validParamsWithAuthorArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const lines = content.split('\n');

          // Find the line containing the article WikiLink
          const articleLine = lines.find(
            (line) => line.includes(`[[${params.articleTitle}]]`)
          );

          expect(articleLine).toBeDefined();
          // The same line should contain the author name
          expect(articleLine).toContain(params.articleAuthor);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Existing publication source page append preserves content
   *
   * For any existing publication source page content and new article entry, appending
   * to the publication source page SHALL: (a) preserve all existing content before the
   * append point, (b) add exactly one new entry to the Articles section, and (c) not
   * duplicate an entry that already exists.
   *
   * **Validates: Requirements 8.2, 8.5**
   */
  describe('Property 8: Existing publication source page append preserves content', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = join(
        tmpdir(),
        `pbt-pub-source-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should preserve existing content and add exactly one new entry', () => {
      fc.assert(
        fc.property(
          validParamsArbitrary,
          fc.tuple(articleTitleArbitrary, authorNameArbitrary, dateArbitrary, sourcePageSlugArbitrary),
          (initialParams, [newTitle, newAuthor, newDate, newSlug]) => {
            // Clean up from previous iteration
            const entitiesDir = join(tempDir, 'wiki/entities');
            if (existsSync(entitiesDir)) {
              rmSync(entitiesDir, { recursive: true, force: true });
            }

            // Create initial page
            const createResult = publishPublicationSourcePage(tempDir, initialParams);
            expect(createResult.action).toBe('created');

            const filePath = join(tempDir, createResult.path);
            const contentBefore = readFileSync(filePath, 'utf-8');

            // Count article entries before append
            const entriesBefore = contentBefore
              .split('\n')
              .filter((l) => l.startsWith('- [['));

            // Create new params with a different source page title to avoid duplicate detection
            const newSourcePageTitle = `${newTitle} — ${newDate}`;
            const appendParams: PublicationSourcePageParams = {
              domain: initialParams.domain,
              articleTitle: newTitle,
              articleAuthor: newAuthor,
              sourcePageTitle: newSourcePageTitle,
              sourcePageSlug: newSlug,
              finalizedAt: newDate,
            };

            const appendResult = publishPublicationSourcePage(tempDir, appendParams);

            if (appendResult.action === 'skipped') {
              // Duplicate detected — content should be unchanged
              const contentAfter = readFileSync(filePath, 'utf-8');
              expect(contentAfter).toBe(contentBefore);
            } else {
              // (a) Preserve existing content: definition section should still be present
              const contentAfter = readFileSync(filePath, 'utf-8');
              expect(contentAfter).toContain(
                `${initialParams.domain} is a publication platform`
              );

              // (b) Add exactly one new entry
              const entriesAfter = contentAfter
                .split('\n')
                .filter((l) => l.startsWith('- [['));
              expect(entriesAfter.length).toBe(entriesBefore.length + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not duplicate an entry that already exists (idempotent append)', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          // Clean up from previous iteration
          const entitiesDir = join(tempDir, 'wiki/entities');
          if (existsSync(entitiesDir)) {
            rmSync(entitiesDir, { recursive: true, force: true });
          }

          // Create initial page
          publishPublicationSourcePage(tempDir, params);

          const filePath = join(tempDir, `wiki/entities/${params.domain.replace(/\./g, '-')}.md`);
          const contentAfterCreate = readFileSync(filePath, 'utf-8');

          // Try to append the same entry again
          const duplicateResult = publishPublicationSourcePage(tempDir, params);

          // (c) Should skip duplicate
          expect(duplicateResult.action).toBe('skipped');

          // Content should be unchanged
          const contentAfterDuplicate = readFileSync(filePath, 'utf-8');
          expect(contentAfterDuplicate).toBe(contentAfterCreate);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Graceful skip when URL is absent
   *
   * For any session where domain is absent or empty, the publishPublicationSourcePage
   * function SHALL return a result with action: 'skipped' and SHALL NOT write any file
   * to disk.
   *
   * **Validates: Requirements 2.6**
   */
  describe('Property 13: Graceful skip when URL is absent', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = join(
        tmpdir(),
        `pbt-pub-skip-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    /** Generates empty or whitespace-only strings */
    const emptyOrWhitespaceArbitrary = fc.oneof(
      fc.constant(''),
      fc.nat({ max: 9 }).map((n) => ' '.repeat(n + 1)),
      fc.nat({ max: 4 }).map((n) => '\t'.repeat(n + 1)),
      fc.nat({ max: 4 }).map((n) => ' \t'.repeat(n + 1))
    );

    it('should return action: skipped when domain is empty or whitespace-only', () => {
      fc.assert(
        fc.property(
          emptyOrWhitespaceArbitrary,
          articleTitleArbitrary,
          authorNameArbitrary,
          dateArbitrary,
          sourcePageSlugArbitrary,
          (domain, articleTitle, articleAuthor, finalizedAt, sourcePageSlug) => {
            const params: PublicationSourcePageParams = {
              domain,
              articleTitle,
              articleAuthor,
              sourcePageTitle: `${articleTitle} — ${finalizedAt}`,
              sourcePageSlug,
              finalizedAt,
            };

            const result = publishPublicationSourcePage(tempDir, params);

            // Should return skipped
            expect(result.action).toBe('skipped');
            expect(result.path).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT write any file to disk when domain is empty or whitespace-only', () => {
      fc.assert(
        fc.property(
          emptyOrWhitespaceArbitrary,
          articleTitleArbitrary,
          authorNameArbitrary,
          dateArbitrary,
          sourcePageSlugArbitrary,
          (domain, articleTitle, articleAuthor, finalizedAt, sourcePageSlug) => {
            const params: PublicationSourcePageParams = {
              domain,
              articleTitle,
              articleAuthor,
              sourcePageTitle: `${articleTitle} — ${finalizedAt}`,
              sourcePageSlug,
              finalizedAt,
            };

            publishPublicationSourcePage(tempDir, params);

            // No wiki/entities directory should be created
            const entitiesDir = join(tempDir, 'wiki/entities');
            expect(existsSync(entitiesDir)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
