/**
 * Unit tests for publication source page generation and publishing
 * Feature: article-author-source-discovery
 * Requirements: 2.3, 2.4, 2.8, 2.9, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import {
  generatePublicationSourcePage,
  publishPublicationSourcePage,
  PublicationSourcePageParams,
} from './generate-publication-source-page';

function createValidParams(overrides: Partial<PublicationSourcePageParams> = {}): PublicationSourcePageParams {
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
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `pub-source-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('skip logic (Req 2.9)', () => {
    it('returns action: skipped when domain is empty string', () => {
      const result = publishPublicationSourcePage(tempDir, createValidParams({ domain: '' }));
      expect(result.action).toBe('skipped');
      expect(result.path).toBe('');
    });

    it('returns action: skipped when domain is whitespace only', () => {
      const result = publishPublicationSourcePage(tempDir, createValidParams({ domain: '   ' }));
      expect(result.action).toBe('skipped');
      expect(result.path).toBe('');
    });
  });

  describe('new page creation (Req 2.3)', () => {
    it('creates a new page at wiki/entities/[domain-slug].md', () => {
      const result = publishPublicationSourcePage(tempDir, createValidParams());
      expect(result.action).toBe('created');
      expect(result.path).toBe('wiki/entities/nx-dev.md');

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      expect(existsSync(filePath)).toBe(true);
    });

    it('creates page with correct frontmatter', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.title).toBe('nx.dev');
      expect(parsed.data.type).toBe('entity');
      expect(parsed.data.tags).toContain('publication-source');
      expect(parsed.data.tags).toContain('website');
      expect(parsed.data.sources).toContain('understanding-nx-workspace-2025-06-01');
      expect(parsed.data.created).toBe('2025-06-01');
      expect(parsed.data.updated).toBe('2025-06-01');
    });

    it('creates page with article entry including author name', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');

      expect(content).toContain('[[Understanding Nx Workspace]]');
      expect(content).toContain('by Manfred Steyer');
    });

    it('creates page with article entry without author when not provided', () => {
      publishPublicationSourcePage(tempDir, createValidParams({ articleAuthor: undefined }));

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');

      expect(content).toContain('[[Understanding Nx Workspace]]');
      expect(content).not.toContain('by');
    });

    it('handles domain with multiple dots (e.g., blog.angular.dev)', () => {
      const result = publishPublicationSourcePage(tempDir, createValidParams({ domain: 'blog.angular.dev' }));
      expect(result.path).toBe('wiki/entities/blog-angular-dev.md');
      expect(result.action).toBe('created');
    });
  });

  describe('append to existing page (Req 2.4, 8.2, 8.3, 8.4)', () => {
    it('appends new article entry to existing page', () => {
      // Create initial page
      publishPublicationSourcePage(tempDir, createValidParams());

      // Append second article
      const result = publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'Advanced Nx Plugins',
        articleAuthor: 'Jane Doe',
        sourcePageTitle: 'Advanced Nx Plugins — 2025-06-15',
        sourcePageSlug: 'advanced-nx-plugins-2025-06-15',
        finalizedAt: '2025-06-15',
      }));

      expect(result.action).toBe('updated');

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');

      expect(content).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
      expect(content).toContain('[[Advanced Nx Plugins — 2025-06-15]]');
    });

    it('preserves all existing content when appending (Req 8.2)', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const originalContent = readFileSync(filePath, 'utf-8');

      publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'Another Article',
        sourcePageTitle: 'Another Article — 2025-06-15',
        sourcePageSlug: 'another-article-2025-06-15',
        finalizedAt: '2025-06-15',
      }));

      const updatedContent = readFileSync(filePath, 'utf-8');

      // Original article entry should still be present
      expect(updatedContent).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
      // Definition section should be preserved
      expect(updatedContent).toContain('nx.dev is a publication platform');
    });

    it('updates the updated frontmatter field (Req 8.3)', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'New Article',
        sourcePageTitle: 'New Article — 2025-07-01',
        sourcePageSlug: 'new-article-2025-07-01',
        finalizedAt: '2025-07-01',
      }));

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.updated).toBe('2025-07-01');
      // created should remain unchanged
      expect(parsed.data.created).toBe('2025-06-01');
    });

    it('appends new source page slug to sources array (Req 8.4)', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'New Article',
        sourcePageTitle: 'New Article — 2025-07-01',
        sourcePageSlug: 'new-article-2025-07-01',
        finalizedAt: '2025-07-01',
      }));

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      expect(parsed.data.sources).toContain('understanding-nx-workspace-2025-06-01');
      expect(parsed.data.sources).toContain('new-article-2025-07-01');
    });

    it('maintains descending date order when inserting (Req 2.8)', () => {
      // Create page with a 2025-06-15 article
      publishPublicationSourcePage(tempDir, createValidParams({
        finalizedAt: '2025-06-15',
        sourcePageTitle: 'Middle Article — 2025-06-15',
        sourcePageSlug: 'middle-article-2025-06-15',
      }));

      // Add an older article (should go after)
      publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'Old Article',
        sourcePageTitle: 'Old Article — 2025-06-01',
        sourcePageSlug: 'old-article-2025-06-01',
        finalizedAt: '2025-06-01',
      }));

      // Add a newer article (should go before)
      publishPublicationSourcePage(tempDir, createValidParams({
        articleTitle: 'New Article',
        sourcePageTitle: 'New Article — 2025-07-01',
        sourcePageSlug: 'new-article-2025-07-01',
        finalizedAt: '2025-07-01',
      }));

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const content = readFileSync(filePath, 'utf-8');

      const lines = content.split('\n');
      const articleLines = lines.filter(l => l.startsWith('- [['));

      // Verify descending order: 2025-07-01, 2025-06-15, 2025-06-01
      expect(articleLines[0]).toContain('2025-07-01');
      expect(articleLines[1]).toContain('2025-06-15');
      expect(articleLines[2]).toContain('2025-06-01');
    });
  });

  describe('duplicate detection (Req 8.5)', () => {
    it('skips duplicate entry when sourcePageTitle WikiLink already exists', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      // Try to add the same article again
      const result = publishPublicationSourcePage(tempDir, createValidParams());

      expect(result.action).toBe('skipped');
    });

    it('does not modify the page when duplicate is detected', () => {
      publishPublicationSourcePage(tempDir, createValidParams());

      const filePath = join(tempDir, 'wiki/entities/nx-dev.md');
      const contentBefore = readFileSync(filePath, 'utf-8');

      publishPublicationSourcePage(tempDir, createValidParams());

      const contentAfter = readFileSync(filePath, 'utf-8');
      expect(contentAfter).toBe(contentBefore);
    });
  });

  describe('malformed frontmatter handling', () => {
    it('returns skipped with error when frontmatter is malformed', () => {
      const entitiesDir = join(tempDir, 'wiki/entities');
      mkdirSync(entitiesDir, { recursive: true });

      // Write a file with malformed frontmatter
      const malformedContent = '---\ntitle: "nx.dev\ntype: entity\n---\n\n# nx.dev\n';
      writeFileSync(join(entitiesDir, 'nx-dev.md'), malformedContent, 'utf-8');

      const result = publishPublicationSourcePage(tempDir, createValidParams());

      expect(result.action).toBe('skipped');
      expect(result.error).toContain('Malformed frontmatter');
    });
  });

  describe('missing Articles heading', () => {
    it('appends ## Articles heading when not present in existing page', () => {
      const entitiesDir = join(tempDir, 'wiki/entities');
      mkdirSync(entitiesDir, { recursive: true });

      // Write a page without Articles section
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
      writeFileSync(join(entitiesDir, 'nx-dev.md'), pageContent, 'utf-8');

      const result = publishPublicationSourcePage(tempDir, createValidParams());

      expect(result.action).toBe('updated');

      const content = readFileSync(join(entitiesDir, 'nx-dev.md'), 'utf-8');
      expect(content).toContain('## Articles');
      expect(content).toContain('[[Understanding Nx Workspace — 2025-06-01]]');
    });
  });

  describe('subdomains and common platforms (Req 2.3, 2.4)', () => {
    describe('subdomain slug generation', () => {
      it('generates correct slug for blog.angular.dev (dots become hyphens)', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'blog.angular.dev',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/blog-angular-dev.md');

        const filePath = join(tempDir, 'wiki/entities/blog-angular-dev.md');
        expect(existsSync(filePath)).toBe(true);
      });

      it('generates correct slug for docs.github.com (dots become hyphens)', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'docs.github.com',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/docs-github-com.md');

        const filePath = join(tempDir, 'wiki/entities/docs-github-com.md');
        expect(existsSync(filePath)).toBe(true);
      });

      it('generates correct slug for developer.mozilla.org (dots become hyphens)', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'developer.mozilla.org',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/developer-mozilla-org.md');

        const filePath = join(tempDir, 'wiki/entities/developer-mozilla-org.md');
        expect(existsSync(filePath)).toBe(true);
      });
    });

    describe('common platforms', () => {
      it('creates page for medium.com', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'medium.com',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/medium-com.md');

        const filePath = join(tempDir, 'wiki/entities/medium-com.md');
        const content = readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        expect(parsed.data.title).toBe('medium.com');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('medium-com');
      });

      it('creates page for dev.to', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'dev.to',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/dev-to.md');

        const filePath = join(tempDir, 'wiki/entities/dev-to.md');
        const content = readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        expect(parsed.data.title).toBe('dev.to');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('dev-to');
      });

      it('creates page for hashnode.dev', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'hashnode.dev',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/hashnode-dev.md');

        const filePath = join(tempDir, 'wiki/entities/hashnode-dev.md');
        const content = readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        expect(parsed.data.title).toBe('hashnode.dev');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('hashnode-dev');
      });

      it('creates page for substack.com', () => {
        const result = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'substack.com',
        }));
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/substack-com.md');

        const filePath = join(tempDir, 'wiki/entities/substack-com.md');
        const content = readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        expect(parsed.data.title).toBe('substack.com');
        expect(parsed.data.tags).toContain('publication-source');
        expect(parsed.data.tags).toContain('substack-com');
      });
    });

    describe('multiple articles from same source', () => {
      it('appends 2 more articles to an existing publication source page', () => {
        // Create initial page
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'medium.com',
          articleTitle: 'First Article',
          articleAuthor: 'Alice Smith',
          sourcePageTitle: 'First Article — 2025-06-01',
          sourcePageSlug: 'first-article-2025-06-01',
          finalizedAt: '2025-06-01',
        }));

        // Append second article
        const result2 = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'medium.com',
          articleTitle: 'Second Article',
          articleAuthor: 'Bob Jones',
          sourcePageTitle: 'Second Article — 2025-06-15',
          sourcePageSlug: 'second-article-2025-06-15',
          finalizedAt: '2025-06-15',
        }));
        expect(result2.action).toBe('updated');

        // Append third article
        const result3 = publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'medium.com',
          articleTitle: 'Third Article',
          articleAuthor: 'Charlie Brown',
          sourcePageTitle: 'Third Article — 2025-07-01',
          sourcePageSlug: 'third-article-2025-07-01',
          finalizedAt: '2025-07-01',
        }));
        expect(result3.action).toBe('updated');

        const filePath = join(tempDir, 'wiki/entities/medium-com.md');
        const content = readFileSync(filePath, 'utf-8');

        // All three articles should be present
        expect(content).toContain('[[First Article — 2025-06-01]]');
        expect(content).toContain('[[Second Article — 2025-06-15]]');
        expect(content).toContain('[[Third Article — 2025-07-01]]');
      });

      it('includes author name in article entries when provided', () => {
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'dev.to',
          articleTitle: 'Angular Signals Guide',
          articleAuthor: 'Jane Developer',
          sourcePageTitle: 'Angular Signals Guide — 2025-06-10',
          sourcePageSlug: 'angular-signals-guide-2025-06-10',
          finalizedAt: '2025-06-10',
        }));

        // Append second article with author
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'dev.to',
          articleTitle: 'RxJS Best Practices',
          articleAuthor: 'John Coder',
          sourcePageTitle: 'RxJS Best Practices — 2025-06-20',
          sourcePageSlug: 'rxjs-best-practices-2025-06-20',
          finalizedAt: '2025-06-20',
        }));

        const filePath = join(tempDir, 'wiki/entities/dev-to.md');
        const content = readFileSync(filePath, 'utf-8');

        // The appended entry should include author name
        expect(content).toContain('John Coder');
      });

      it('omits author name in article entries when not provided', () => {
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'hashnode.dev',
          articleTitle: 'Getting Started with Nx',
          articleAuthor: 'First Author',
          sourcePageTitle: 'Getting Started with Nx — 2025-06-01',
          sourcePageSlug: 'getting-started-with-nx-2025-06-01',
          finalizedAt: '2025-06-01',
        }));

        // Append article without author
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'hashnode.dev',
          articleTitle: 'Advanced Nx Plugins',
          articleAuthor: undefined,
          sourcePageTitle: 'Advanced Nx Plugins — 2025-06-15',
          sourcePageSlug: 'advanced-nx-plugins-2025-06-15',
          finalizedAt: '2025-06-15',
        }));

        const filePath = join(tempDir, 'wiki/entities/hashnode-dev.md');
        const content = readFileSync(filePath, 'utf-8');

        // The appended entry for the second article should not have "by" author
        const lines = content.split('\n');
        const advancedNxLine = lines.find(l => l.includes('[[Advanced Nx Plugins'));
        expect(advancedNxLine).toBeDefined();
        expect(advancedNxLine).not.toContain('by');
      });

      it('maintains descending date order when appending multiple articles', () => {
        // Create page with middle date
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'blog.angular.dev',
          articleTitle: 'Middle Article',
          articleAuthor: 'Author A',
          sourcePageTitle: 'Middle Article — 2025-06-15',
          sourcePageSlug: 'middle-article-2025-06-15',
          finalizedAt: '2025-06-15',
        }));

        // Append older article (should go after)
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'blog.angular.dev',
          articleTitle: 'Old Article',
          articleAuthor: 'Author B',
          sourcePageTitle: 'Old Article — 2025-05-01',
          sourcePageSlug: 'old-article-2025-05-01',
          finalizedAt: '2025-05-01',
        }));

        // Append newest article (should go first)
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'blog.angular.dev',
          articleTitle: 'Newest Article',
          articleAuthor: 'Author C',
          sourcePageTitle: 'Newest Article — 2025-07-20',
          sourcePageSlug: 'newest-article-2025-07-20',
          finalizedAt: '2025-07-20',
        }));

        const filePath = join(tempDir, 'wiki/entities/blog-angular-dev.md');
        const content = readFileSync(filePath, 'utf-8');

        const lines = content.split('\n');
        const articleLines = lines.filter(l => l.startsWith('- [['));

        // Verify descending order: 2025-07-20, 2025-06-15, 2025-05-01
        expect(articleLines[0]).toContain('2025-07-20');
        expect(articleLines[1]).toContain('2025-06-15');
        expect(articleLines[2]).toContain('2025-05-01');
      });

      it('accumulates sources in frontmatter across multiple appends', () => {
        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'substack.com',
          articleTitle: 'Article One',
          sourcePageTitle: 'Article One — 2025-06-01',
          sourcePageSlug: 'article-one-2025-06-01',
          finalizedAt: '2025-06-01',
        }));

        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'substack.com',
          articleTitle: 'Article Two',
          sourcePageTitle: 'Article Two — 2025-06-15',
          sourcePageSlug: 'article-two-2025-06-15',
          finalizedAt: '2025-06-15',
        }));

        publishPublicationSourcePage(tempDir, createValidParams({
          domain: 'substack.com',
          articleTitle: 'Article Three',
          sourcePageTitle: 'Article Three — 2025-07-01',
          sourcePageSlug: 'article-three-2025-07-01',
          finalizedAt: '2025-07-01',
        }));

        const filePath = join(tempDir, 'wiki/entities/substack-com.md');
        const content = readFileSync(filePath, 'utf-8');
        const parsed = matter(content);

        expect(parsed.data.sources).toContain('article-one-2025-06-01');
        expect(parsed.data.sources).toContain('article-two-2025-06-15');
        expect(parsed.data.sources).toContain('article-three-2025-07-01');
        expect(parsed.data.sources).toHaveLength(3);
      });
    });
  });
});
