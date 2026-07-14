/**
 * Unit + property-based tests for publication source page generation and publishing
 * Feature: article-author-source-discovery, scripts-migration-hexagonal
 *
 * Migrated from:
 * - scripts/research-workflow/wiki-publisher/generate-publication-source-page.pbt.test.ts
 * - scripts/research-workflow/wiki-publisher/generate-publication-source-page.test.ts
 *
 * `publishPublicationSourcePage` now takes `(fs: FileSystemPort, frontmatter: FrontmatterPort, params)`
 * instead of `(tempDir: string, params)` and is async. Real `os.tmpdir()` fixtures are
 * replaced with `FakeFileSystemPort` / `FakeFrontmatterPort` in-memory test doubles.
 *
 * Original property numbering (pre-migration) vs. this spec's design.md numbering:
 * - OLD "Property 4" (valid frontmatter) + OLD "Property 8: Existing publication source
 *   page append preserves content" + OLD "Property 13: Graceful skip when URL is absent"
 *   together map to THIS SPEC's **Property 7: Publication source page frontmatter and
 *   idempotent append** (tagged below).
 * - OLD "Property 6: Publication source page contains article WikiLink with author" is
 *   retained as plain PBT coverage — not an officially numbered property in this spec's
 *   design.md, but still valuable regression coverage.
 *
 * **Validates: Requirements 6.2, 6.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import {
  generatePublicationSourcePage,
  publishPublicationSourcePage,
  PublicationSourcePageParams,
} from './generate-publication-source-page';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import { FakeFrontmatterPort } from './test-utils/fake-frontmatter-port';

// ============================================================================
// Custom Arbitraries
// ============================================================================

/** Generates valid domain segments (lowercase alphanumeric, 1-10 chars) */
const domainSegment = fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);

/** Generates valid domain names (e.g., "abc.def.io", "example.com") */
const domainArbitrary = fc
  .tuple(domainSegment, fc.array(domainSegment, { minLength: 1, maxLength: 3 }))
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
// Pure generatePublicationSourcePage — property-based coverage
// ============================================================================

describe('Property-Based Tests: Publication Source Page Generation', () => {
  describe('Publication source page generation produces valid frontmatter (OLD Property 4)', () => {
    it('should produce parseable YAML frontmatter with title equal to domain name', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          expect(parsed.data).toBeDefined();
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

          expect(parsed.data.created).toMatch(datePattern);
          expect(parsed.data.updated).toMatch(datePattern);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Publication source page contains article WikiLink with author (OLD Property 6)', () => {
    it('should contain [[articleTitle]] WikiLink in the Articles section', () => {
      fc.assert(
        fc.property(validParamsWithAuthorArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);

          const articlesMatch = content.match(/## Articles\n\n([\s\S]*?)(?=\n## |\n*$)/);
          expect(articlesMatch).not.toBeNull();

          const articlesSection = articlesMatch![1];
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

          const articleLine = lines.find((line) => line.includes(`[[${params.articleTitle}]]`));

          expect(articleLine).toBeDefined();
          expect(articleLine).toContain(params.articleAuthor);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // Feature: scripts-migration-hexagonal, Property 7: Publication source page
  // frontmatter and idempotent append
  // (combines OLD Property 4, Property 8, Property 13)
  // ==========================================================================

  describe('Feature: scripts-migration-hexagonal, Property 7: Publication source page frontmatter and idempotent append', () => {
    /**
     * Property 7: Publication source page frontmatter and idempotent append
     *
     * For any valid publication-source parameters, the generated publication
     * source page SHALL have parseable YAML frontmatter with `title` equal to
     * the domain, `type` equal to `entity`, and tags containing
     * `publication-source` and `website`; appending SHALL preserve existing
     * content and add exactly one Articles entry (skipping duplicates); and
     * when the domain is absent or whitespace-only the operation SHALL skip
     * without writing any file.
     *
     * **Validates: Requirements 6.2, 6.5**
     */
    let fs: FakeFileSystemPort;
    let frontmatter: FakeFrontmatterPort;

    beforeEach(() => {
      fs = new FakeFileSystemPort();
      frontmatter = new FakeFrontmatterPort();
    });

    it('frontmatter: parseable with title=domain, type=entity, tags containing publication-source and website', () => {
      fc.assert(
        fc.property(validParamsArbitrary, (params) => {
          const content = generatePublicationSourcePage(params);
          const parsed = matter(content);

          expect(parsed.data.title).toBe(params.domain);
          expect(parsed.data.type).toBe('entity');
          expect(parsed.data.tags).toContain('publication-source');
          expect(parsed.data.tags).toContain('website');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve existing content and add exactly one new entry', async () => {
      await fc.assert(
        fc.asyncProperty(
          validParamsArbitrary,
          fc.tuple(articleTitleArbitrary, authorNameArbitrary, dateArbitrary, sourcePageSlugArbitrary),
          async (initialParams, [newTitle, newAuthor, newDate, newSlug]) => {
            fs = new FakeFileSystemPort();
            frontmatter = new FakeFrontmatterPort();

            const createResult = await publishPublicationSourcePage(fs, frontmatter, initialParams);
            expect(createResult.action).toBe('created');

            const wikiPath = createResult.path.replace(/^wiki\//, '');
            const contentBefore = fs.getWikiFile(wikiPath)!;

            const entriesBefore = contentBefore.split('\n').filter((l) => l.startsWith('- [['));

            const newSourcePageTitle = `${newTitle} — ${newDate}`;
            const appendParams: PublicationSourcePageParams = {
              domain: initialParams.domain,
              articleTitle: newTitle,
              articleAuthor: newAuthor,
              sourcePageTitle: newSourcePageTitle,
              sourcePageSlug: newSlug,
              finalizedAt: newDate,
            };

            const appendResult = await publishPublicationSourcePage(fs, frontmatter, appendParams);

            if (appendResult.action === 'skipped') {
              const contentAfter = fs.getWikiFile(wikiPath)!;
              expect(contentAfter).toBe(contentBefore);
            } else {
              const contentAfter = fs.getWikiFile(wikiPath)!;
              expect(contentAfter).toContain(`${initialParams.domain} is a publication platform`);

              const entriesAfter = contentAfter.split('\n').filter((l) => l.startsWith('- [['));
              expect(entriesAfter.length).toBe(entriesBefore.length + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not duplicate an entry that already exists (idempotent append)', async () => {
      await fc.assert(
        fc.asyncProperty(validParamsArbitrary, async (params) => {
          fs = new FakeFileSystemPort();
          frontmatter = new FakeFrontmatterPort();

          await publishPublicationSourcePage(fs, frontmatter, params);

          const wikiPath = `entities/${params.domain.replace(/\./g, '-')}.md`;
          const contentAfterCreate = fs.getWikiFile(wikiPath)!;

          const duplicateResult = await publishPublicationSourcePage(fs, frontmatter, params);

          expect(duplicateResult.action).toBe('skipped');

          const contentAfterDuplicate = fs.getWikiFile(wikiPath)!;
          expect(contentAfterDuplicate).toBe(contentAfterCreate);
        }),
        { numRuns: 100 }
      );
    });

    /** Generates empty or whitespace-only strings */
    const emptyOrWhitespaceArbitrary = fc.oneof(
      fc.constant(''),
      fc.nat({ max: 9 }).map((n) => ' '.repeat(n + 1)),
      fc.nat({ max: 4 }).map((n) => '\t'.repeat(n + 1)),
      fc.nat({ max: 4 }).map((n) => ' \t'.repeat(n + 1))
    );

    it('should return action: skipped when domain is empty or whitespace-only', async () => {
      await fc.assert(
        fc.asyncProperty(
          emptyOrWhitespaceArbitrary,
          articleTitleArbitrary,
          authorNameArbitrary,
          dateArbitrary,
          sourcePageSlugArbitrary,
          async (domain, articleTitle, articleAuthor, finalizedAt, sourcePageSlug) => {
            fs = new FakeFileSystemPort();
            const params: PublicationSourcePageParams = {
              domain,
              articleTitle,
              articleAuthor,
              sourcePageTitle: `${articleTitle} — ${finalizedAt}`,
              sourcePageSlug,
              finalizedAt,
            };

            const result = await publishPublicationSourcePage(fs, frontmatter, params);

            expect(result.action).toBe('skipped');
            expect(result.path).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT write any file to disk when domain is empty or whitespace-only', async () => {
      await fc.assert(
        fc.asyncProperty(
          emptyOrWhitespaceArbitrary,
          articleTitleArbitrary,
          authorNameArbitrary,
          dateArbitrary,
          sourcePageSlugArbitrary,
          async (domain, articleTitle, articleAuthor, finalizedAt, sourcePageSlug) => {
            fs = new FakeFileSystemPort();
            const params: PublicationSourcePageParams = {
              domain,
              articleTitle,
              articleAuthor,
              sourcePageTitle: `${articleTitle} — ${finalizedAt}`,
              sourcePageSlug,
              finalizedAt,
            };

            await publishPublicationSourcePage(fs, frontmatter, params);

            expect(fs.hasWikiFile('entities/.md')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Unit tests: publishPublicationSourcePage
// Migrated from scripts/research-workflow/wiki-publisher/generate-publication-source-page.test.ts
// ============================================================================

function createValidParams(
  overrides: Partial<PublicationSourcePageParams> = {}
): PublicationSourcePageParams {
  return {
    domain: 'nx.dev',
    articleTitle: 'Understanding Nx Workspace',
    articleAuthor: 'Manfred Steyer',
    sourcePageTitle: 'Understanding Nx Workspace — 2025-06-01',
    sourcePageSlug: 'understanding-nx-workspace-2025-06-01',
    finalizedAt: '2025-06-01',
    ...overrides,
  };
}

describe('publishPublicationSourcePage', () => {
  let fs: FakeFileSystemPort;
  let frontmatter: FakeFrontmatterPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
    frontmatter = new FakeFrontmatterPort();
  });

  describe('skip logic (Req 2.9)', () => {
    it('returns action: skipped when domain is empty string', async () => {
      const result = await publishPublicationSourcePage(fs, frontmatter, createValidParams({ domain: '' }));
      expect(result.action).toBe('skipped');
      expect(result.path).toBe('');
    });

    it('returns action: skipped when domain is whitespace only', async () => {
      const result = await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({ domain: '   ' })
      );
      expect(result.action).toBe('skipped');
      expect(result.path).toBe('');
    });
  });

  describe('new page creation (Req 2.3)', () => {
    it('creates a new page at wiki/entities/[domain-slug].md', async () => {
      const result = await publishPublicationSourcePage(fs, frontmatter, createValidParams());
      expect(result.action).toBe('created');
      expect(result.path).toBe('wiki/entities/nx-dev.md');
      expect(fs.hasWikiFile('entities/nx-dev.md')).toBe(true);
    });

    it('creates page with correct frontmatter', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const content = fs.getWikiFile('entities/nx-dev.md')!;
      const parsed = matter(content);

      expect(parsed.data.title).toBe('nx.dev');
      expect(parsed.data.type).toBe('entity');
      expect(parsed.data.tags).toContain('publication-source');
      expect(parsed.data.tags).toContain('website');
      expect(parsed.data.sources).toContain('understanding-nx-workspace-2025-06-01');
      expect(parsed.data.created).toBe('2025-06-01');
      expect(parsed.data.updated).toBe('2025-06-01');
    });

    it('creates page with article entry including author name', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const content = fs.getWikiFile('entities/nx-dev.md')!;

      expect(content).toContain('[[Understanding Nx Workspace]]');
      expect(content).toContain('by Manfred Steyer');
    });

    it('creates page with article entry without author when not provided', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams({ articleAuthor: undefined }));

      const content = fs.getWikiFile('entities/nx-dev.md')!;

      expect(content).toContain('[[Understanding Nx Workspace]]');
      expect(content).not.toContain('by');
    });

    it('handles domain with multiple dots (e.g., blog.angular.dev)', async () => {
      const result = await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({ domain: 'blog.angular.dev' })
      );
      expect(result.path).toBe('wiki/entities/blog-angular-dev.md');
      expect(result.action).toBe('created');
    });
  });

  describe('append to existing page (Req 2.4, 8.2, 8.3, 8.4)', () => {
    it('appends new article entry to existing page', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const result = await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'Advanced Nx Plugins',
          articleAuthor: 'Jane Doe',
          sourcePageTitle: 'Advanced Nx Plugins — 2025-06-15',
          sourcePageSlug: 'advanced-nx-plugins-2025-06-15',
          finalizedAt: '2025-06-15',
        })
      );

      expect(result.action).toBe('updated');

      const content = fs.getWikiFile('entities/nx-dev.md')!;

      expect(content).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
      expect(content).toContain('[[Advanced Nx Plugins — 2025-06-15]]');
    });

    it('preserves all existing content when appending (Req 8.2)', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'Another Article',
          sourcePageTitle: 'Another Article — 2025-06-15',
          sourcePageSlug: 'another-article-2025-06-15',
          finalizedAt: '2025-06-15',
        })
      );

      const updatedContent = fs.getWikiFile('entities/nx-dev.md')!;

      expect(updatedContent).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
      expect(updatedContent).toContain('nx.dev is a publication platform');
    });

    it('updates the updated frontmatter field (Req 8.3)', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'New Article',
          sourcePageTitle: 'New Article — 2025-07-01',
          sourcePageSlug: 'new-article-2025-07-01',
          finalizedAt: '2025-07-01',
        })
      );

      const content = fs.getWikiFile('entities/nx-dev.md')!;
      const parsed = matter(content);

      expect(parsed.data.updated).toBe('2025-07-01');
      expect(parsed.data.created).toBe('2025-06-01');
    });

    it('appends new source page slug to sources array (Req 8.4)', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'New Article',
          sourcePageTitle: 'New Article — 2025-07-01',
          sourcePageSlug: 'new-article-2025-07-01',
          finalizedAt: '2025-07-01',
        })
      );

      const content = fs.getWikiFile('entities/nx-dev.md')!;
      const parsed = matter(content);

      expect(parsed.data.sources).toContain('understanding-nx-workspace-2025-06-01');
      expect(parsed.data.sources).toContain('new-article-2025-07-01');
    });

    it('maintains descending date order when inserting (Req 2.8)', async () => {
      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          finalizedAt: '2025-06-15',
          sourcePageTitle: 'Middle Article — 2025-06-15',
          sourcePageSlug: 'middle-article-2025-06-15',
        })
      );

      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'Old Article',
          sourcePageTitle: 'Old Article — 2025-06-01',
          sourcePageSlug: 'old-article-2025-06-01',
          finalizedAt: '2025-06-01',
        })
      );

      await publishPublicationSourcePage(
        fs,
        frontmatter,
        createValidParams({
          articleTitle: 'New Article',
          sourcePageTitle: 'New Article — 2025-07-01',
          sourcePageSlug: 'new-article-2025-07-01',
          finalizedAt: '2025-07-01',
        })
      );

      const content = fs.getWikiFile('entities/nx-dev.md')!;

      const lines = content.split('\n');
      const articleLines = lines.filter((l) => l.startsWith('- [['));

      expect(articleLines[0]).toContain('2025-07-01');
      expect(articleLines[1]).toContain('2025-06-15');
      expect(articleLines[2]).toContain('2025-06-01');
    });
  });

  describe('duplicate detection (Req 8.5)', () => {
    it('skips duplicate entry when sourcePageTitle WikiLink already exists', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const result = await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      expect(result.action).toBe('skipped');
    });

    it('does not modify the page when duplicate is detected', async () => {
      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const contentBefore = fs.getWikiFile('entities/nx-dev.md')!;

      await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      const contentAfter = fs.getWikiFile('entities/nx-dev.md')!;
      expect(contentAfter).toBe(contentBefore);
    });
  });

  describe('malformed frontmatter handling', () => {
    it('returns skipped with error when frontmatter is malformed', async () => {
      const malformedContent = 'not frontmatter at all, just plain text';
      fs.setWikiFile('entities/nx-dev.md', malformedContent);

      const result = await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      expect(result.action).toBe('skipped');
      expect(result.error).toContain('Malformed frontmatter');
    });
  });

  describe('missing Articles heading', () => {
    it('appends ## Articles heading when not present in existing page', async () => {
      const pageContent = [
        '---',
        'title: "nx.dev"',
        'type: entity',
        'tags: [publication-source, website, nx-dev]',
        'sources: [old-article-slug]',
        'created: "2025-01-01"',
        'updated: "2025-01-01"',
        '---',
        '',
        '# nx.dev',
        '',
        '## Definition',
        '',
        'nx.dev is a publication platform from which articles have been processed into this wiki.',
        '',
      ].join('\n');
      fs.setWikiFile('entities/nx-dev.md', pageContent);

      const result = await publishPublicationSourcePage(fs, frontmatter, createValidParams());

      expect(result.action).toBe('updated');

      const content = fs.getWikiFile('entities/nx-dev.md')!;
      expect(content).toContain('## Articles');
      expect(content).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
    });
  });

  describe('subdomains and common platforms (Req 2.3, 2.4)', () => {
    describe('subdomain slug generation', () => {
      it('generates correct slug for blog.angular.dev (dots become hyphens)', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'blog.angular.dev' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/blog-angular-dev.md');
        expect(fs.hasWikiFile('entities/blog-angular-dev.md')).toBe(true);
      });

      it('generates correct slug for docs.github.com (dots become hyphens)', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'docs.github.com' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/docs-github-com.md');
        expect(fs.hasWikiFile('entities/docs-github-com.md')).toBe(true);
      });

      it('generates correct slug for developer.mozilla.org (dots become hyphens)', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'developer.mozilla.org' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/developer-mozilla-org.md');
        expect(fs.hasWikiFile('entities/developer-mozilla-org.md')).toBe(true);
      });
    });

    describe('common platforms', () => {
      it('creates page for medium.com', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'medium.com' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/medium-com.md');

        const content = fs.getWikiFile('entities/medium-com.md')!;
        const parsed = matter(content);
        expect(parsed.data.title).toBe('medium.com');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('medium-com');
      });

      it('creates page for dev.to', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'dev.to' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/dev-to.md');

        const content = fs.getWikiFile('entities/dev-to.md')!;
        const parsed = matter(content);
        expect(parsed.data.title).toBe('dev.to');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('dev-to');
      });

      it('creates page for hashnode.dev', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'hashnode.dev' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/hashnode-dev.md');

        const content = fs.getWikiFile('entities/hashnode-dev.md')!;
        const parsed = matter(content);
        expect(parsed.data.title).toBe('hashnode.dev');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('hashnode-dev');
      });

      it('creates page for substack.com', async () => {
        const result = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({ domain: 'substack.com' })
        );
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/substack-com.md');

        const content = fs.getWikiFile('entities/substack-com.md')!;
        const parsed = matter(content);
        expect(parsed.data.title).toBe('substack.com');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('substack-com');
      });
    });

    describe('multiple articles from same source', () => {
      it('appends 2 more articles to an existing publication source page', async () => {
        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'medium.com',
            articleTitle: 'First Article',
            articleAuthor: 'Alice Smith',
            sourcePageTitle: 'First Article — 2025-06-01',
            sourcePageSlug: 'first-article-2025-06-01',
            finalizedAt: '2025-06-01',
          })
        );

        const result2 = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'medium.com',
            articleTitle: 'Second Article',
            articleAuthor: 'Bob Jones',
            sourcePageTitle: 'Second Article — 2025-06-15',
            sourcePageSlug: 'second-article-2025-06-15',
            finalizedAt: '2025-06-15',
          })
        );
        expect(result2.action).toBe('updated');

        const result3 = await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'medium.com',
            articleTitle: 'Third Article',
            articleAuthor: 'Charlie Brown',
            sourcePageTitle: 'Third Article — 2025-07-01',
            sourcePageSlug: 'third-article-2025-07-01',
            finalizedAt: '2025-07-01',
          })
        );
        expect(result3.action).toBe('updated');

        const content = fs.getWikiFile('entities/medium-com.md')!;

        expect(content).toContain('[[First Article — 2025-06-01]]');
        expect(content).toContain('[[Second Article — 2025-06-15]]');
        expect(content).toContain('[[Third Article — 2025-07-01]]');
      });

      it('includes author name in article entries when provided', async () => {
        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'dev.to',
            articleTitle: 'Angular Signals Guide',
            articleAuthor: 'Jane Developer',
            sourcePageTitle: 'Angular Signals Guide — 2025-06-10',
            sourcePageSlug: 'angular-signals-guide-2025-06-10',
            finalizedAt: '2025-06-10',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'dev.to',
            articleTitle: 'RxJS Best Practices',
            articleAuthor: 'John Coder',
            sourcePageTitle: 'RxJS Best Practices — 2025-06-20',
            sourcePageSlug: 'rxjs-best-practices-2025-06-20',
            finalizedAt: '2025-06-20',
          })
        );

        const content = fs.getWikiFile('entities/dev-to.md')!;

        expect(content).toContain('John Coder');
      });

      it('omits author name in article entries when not provided', async () => {
        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'hashnode.dev',
            articleTitle: 'Getting Started with Nx',
            articleAuthor: 'First Author',
            sourcePageTitle: 'Getting Started with Nx — 2025-06-01',
            sourcePageSlug: 'getting-started-with-nx-2025-06-01',
            finalizedAt: '2025-06-01',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'hashnode.dev',
            articleTitle: 'Advanced Nx Plugins',
            articleAuthor: undefined,
            sourcePageTitle: 'Advanced Nx Plugins — 2025-06-15',
            sourcePageSlug: 'advanced-nx-plugins-2025-06-15',
            finalizedAt: '2025-06-15',
          })
        );

        const content = fs.getWikiFile('entities/hashnode-dev.md')!;

        const lines = content.split('\n');
        const advancedNxLine = lines.find((l) => l.includes('[[Advanced Nx Plugins'));
        expect(advancedNxLine).toBeDefined();
        expect(advancedNxLine).not.toContain('by');
      });

      it('maintains descending date order when appending multiple articles', async () => {
        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'blog.angular.dev',
            articleTitle: 'Middle Article',
            articleAuthor: 'Author A',
            sourcePageTitle: 'Middle Article — 2025-06-15',
            sourcePageSlug: 'middle-article-2025-06-15',
            finalizedAt: '2025-06-15',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'blog.angular.dev',
            articleTitle: 'Old Article',
            articleAuthor: 'Author B',
            sourcePageTitle: 'Old Article — 2025-05-01',
            sourcePageSlug: 'old-article-2025-05-01',
            finalizedAt: '2025-05-01',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'blog.angular.dev',
            articleTitle: 'Newest Article',
            articleAuthor: 'Author C',
            sourcePageTitle: 'Newest Article — 2025-07-20',
            sourcePageSlug: 'newest-article-2025-07-20',
            finalizedAt: '2025-07-20',
          })
        );

        const content = fs.getWikiFile('entities/blog-angular-dev.md')!;

        const lines = content.split('\n');
        const articleLines = lines.filter((l) => l.startsWith('- [['));

        expect(articleLines[0]).toContain('2025-07-20');
        expect(articleLines[1]).toContain('2025-06-15');
        expect(articleLines[2]).toContain('2025-05-01');
      });

      it('accumulates sources in frontmatter across multiple appends', async () => {
        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'substack.com',
            articleTitle: 'Article One',
            sourcePageTitle: 'Article One — 2025-06-01',
            sourcePageSlug: 'article-one-2025-06-01',
            finalizedAt: '2025-06-01',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'substack.com',
            articleTitle: 'Article Two',
            sourcePageTitle: 'Article Two — 2025-06-15',
            sourcePageSlug: 'article-two-2025-06-15',
            finalizedAt: '2025-06-15',
          })
        );

        await publishPublicationSourcePage(
          fs,
          frontmatter,
          createValidParams({
            domain: 'substack.com',
            articleTitle: 'Article Three',
            sourcePageTitle: 'Article Three — 2025-07-01',
            sourcePageSlug: 'article-three-2025-07-01',
            finalizedAt: '2025-07-01',
          })
        );

        const content = fs.getWikiFile('entities/substack-com.md')!;
        const parsed = matter(content);

        expect(parsed.data.sources).toContain('article-one-2025-06-01');
        expect(parsed.data.sources).toContain('article-two-2025-06-15');
        expect(parsed.data.sources).toContain('article-three-2025-07-01');
        expect(parsed.data.sources).toHaveLength(3);
      });
    });
  });
});
