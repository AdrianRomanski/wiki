/**
 * Unit tests for query and search functionality.
 * 
 * Tests cover:
 * - Full-text search with relevance ranking
 * - Tag-based search (frontmatter and inline #tags)
 * - Name-based search for entities and concepts
 * - Source filtering by author, date, URL
 * - Backlink discovery
 * - Cross-reference context in search results
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryEngine, SearchOptions, SourceFilters } from './query.js';
import { WikiPage } from './models.js';
import * as filesystem from './filesystem.js';
import * as frontmatter from './frontmatter.js';

// Mock the filesystem module
vi.mock('./filesystem.js', () => ({
  listWikiFiles: vi.fn(),
  readWikiFile: vi.fn(),
  DEFAULT_CONFIG: {
    rootDir: '/test',
    rawDir: 'raw',
    wikiDir: 'wiki',
  },
}));

// Mock the frontmatter module
vi.mock('./frontmatter.js', () => ({
  parseFrontmatter: vi.fn(),
}));

describe('QueryEngine', () => {
  let engine: QueryEngine;
  let mockPages: WikiPage[];

  beforeEach(() => {
    engine = new QueryEngine();
    
    // Create mock wiki pages
    mockPages = [
      {
        path: 'entities/angular-cdk.md',
        filename: 'angular-cdk.md',
        frontmatter: {
          title: 'Angular CDK',
          type: 'entity',
          tags: ['angular', 'accessibility', 'components'],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'The Angular CDK provides accessibility utilities and component primitives.',
        sections: [],
        outgoingLinks: ['Accessibility', 'Angular Material'],
        incomingLinks: [],
      },
      {
        path: 'concepts/progressive-enhancement.md',
        filename: 'progressive-enhancement.md',
        frontmatter: {
          title: 'Progressive Enhancement',
          type: 'concept',
          tags: ['accessibility', 'web-development'],
          created: '2024-01-02',
          updated: '2024-01-02',
        },
        content: 'Progressive enhancement is a design philosophy that provides a baseline experience for all users. #accessibility #best-practices',
        sections: [],
        outgoingLinks: ['Accessibility'],
        incomingLinks: [],
      },
      {
        path: 'concepts/accessibility.md',
        filename: 'accessibility.md',
        frontmatter: {
          title: 'Accessibility',
          type: 'concept',
          tags: ['accessibility', 'a11y', 'wcag'],
          created: '2024-01-03',
          updated: '2024-01-03',
        },
        content: 'Accessibility ensures that web applications are usable by everyone, including people with disabilities.',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      },
      {
        path: 'sources/aria-spec-2024-01-15.md',
        filename: 'aria-spec-2024-01-15.md',
        frontmatter: {
          title: 'ARIA Specification',
          type: 'source',
          tags: ['aria', 'specification'],
          author: 'W3C',
          date: '2024-01-15',
          url: 'https://www.w3.org/TR/wai-aria/',
          created: '2024-01-15',
          updated: '2024-01-15',
        },
        content: 'The ARIA specification defines how to make web content more accessible.',
        sections: [],
        outgoingLinks: ['Accessibility'],
        incomingLinks: [],
      },
      {
        path: 'entities/angular-material.md',
        filename: 'angular-material.md',
        frontmatter: {
          title: 'Angular Material',
          type: 'entity',
          tags: ['angular', 'ui-library'],
          created: '2024-01-04',
          updated: '2024-01-04',
        },
        content: 'Angular Material is a UI component library built on top of [[Angular CDK]].',
        sections: [],
        outgoingLinks: ['Angular CDK'],
        incomingLinks: [],
      },
    ];

    // Setup mocks
    vi.mocked(filesystem.listWikiFiles).mockResolvedValue([
      'entities/angular-cdk.md',
      'concepts/progressive-enhancement.md',
      'concepts/accessibility.md',
      'sources/aria-spec-2024-01-15.md',
      'entities/angular-material.md',
    ]);

    vi.mocked(filesystem.readWikiFile).mockImplementation(async (filePath: string) => {
      const page = mockPages.find(p => p.path === filePath);
      if (!page) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Return the full markdown with frontmatter
      return `---
title: ${page.frontmatter.title}
type: ${page.frontmatter.type}
tags: ${JSON.stringify(page.frontmatter.tags)}
${page.frontmatter.author ? `author: ${page.frontmatter.author}` : ''}
${page.frontmatter.date ? `date: ${page.frontmatter.date}` : ''}
${page.frontmatter.url ? `url: ${page.frontmatter.url}` : ''}
created: ${page.frontmatter.created}
updated: ${page.frontmatter.updated}
---
${page.content}`;
    });

    vi.mocked(frontmatter.parseFrontmatter).mockImplementation((markdown: string) => {
      // Find the matching page based on content
      const page = mockPages.find(p => markdown.includes(p.content));
      if (!page) {
        throw new Error('Could not parse frontmatter');
      }
      
      return {
        frontmatter: page.frontmatter,
        content: page.content,
      };
    });
  });

  describe('search', () => {
    it('should find pages matching query in title', async () => {
      const results = await engine.search('Angular CDK');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].page.frontmatter.title).toBe('Angular CDK');
      expect(results[0].relevance).toBeGreaterThan(0);
    });

    it('should find pages matching query in content', async () => {
      const results = await engine.search('accessibility');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.page.frontmatter.title);
      expect(titles).toContain('Angular CDK');
      expect(titles).toContain('Accessibility');
      expect(titles).toContain('Progressive Enhancement');
    });

    it('should find pages matching query in tags', async () => {
      const results = await engine.search('angular');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.page.frontmatter.title);
      expect(titles).toContain('Angular CDK');
      expect(titles).toContain('Angular Material');
    });

    it('should rank title matches higher than content matches', async () => {
      const results = await engine.search('accessibility');

      // "Accessibility" page should rank higher than pages that just mention it
      const accessibilityPage = results.find(r => r.page.frontmatter.title === 'Accessibility');
      expect(accessibilityPage).toBeDefined();
      expect(accessibilityPage!.relevance).toBeGreaterThan(results[results.length - 1].relevance);
    });

    it('should return empty array for empty query', async () => {
      const results = await engine.search('');

      expect(results).toEqual([]);
    });

    it('should return empty array for query with no matches', async () => {
      const results = await engine.search('nonexistent-term-xyz');

      expect(results).toEqual([]);
    });

    it('should support case-insensitive search by default', async () => {
      const results = await engine.search('ANGULAR');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.page.frontmatter.title);
      expect(titles).toContain('Angular CDK');
    });

    it('should support case-sensitive search when specified', async () => {
      const results = await engine.search('angular', { caseSensitive: true });

      expect(results.length).toBeGreaterThan(0);
      // Should match lowercase 'angular' in tags
    });

    it('should limit results to maxResults option', async () => {
      const results = await engine.search('accessibility', { maxResults: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should include matched content snippets', async () => {
      const results = await engine.search('accessibility');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchedContent).toBeDefined();
      expect(results[0].matchedContent.length).toBeGreaterThan(0);
    });

    it('should include related pages when option is enabled', async () => {
      const results = await engine.search('Angular CDK', { includeRelatedPages: true });

      expect(results.length).toBeGreaterThan(0);
      const cdkResult = results.find(r => r.page.frontmatter.title === 'Angular CDK');
      expect(cdkResult).toBeDefined();
      expect(cdkResult!.relatedPages).toBeDefined();
      
      // Should include pages it links to and pages that link to it
      const relatedTitles = cdkResult!.relatedPages.map(p => p.frontmatter.title);
      expect(relatedTitles).toContain('Angular Material'); // Links to CDK
    });

    it('should not include related pages when option is disabled', async () => {
      const results = await engine.search('Angular CDK', { includeRelatedPages: false });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relatedPages).toEqual([]);
    });

    it('should handle multi-word queries', async () => {
      const results = await engine.search('Angular accessibility');

      expect(results.length).toBeGreaterThan(0);
      // Should find pages that contain both terms
    });

    it('should extract snippets with ellipsis for long content', async () => {
      const results = await engine.search('accessibility', { snippetLength: 50 });

      expect(results.length).toBeGreaterThan(0);
      const snippets = results[0].matchedContent;
      
      // At least one snippet should have ellipsis if content is long
      const hasEllipsis = snippets.some(s => s.includes('...'));
      expect(hasEllipsis).toBe(true);
    });
  });

  describe('searchByTag', () => {
    it('should find pages with matching frontmatter tag', async () => {
      const results = await engine.searchByTag('accessibility');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Angular CDK');
      expect(titles).toContain('Accessibility');
      expect(titles).toContain('Progressive Enhancement');
    });

    it('should find pages with inline #tag syntax', async () => {
      const results = await engine.searchByTag('best-practices');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Progressive Enhancement');
    });

    it('should handle tag with # prefix', async () => {
      const results = await engine.searchByTag('#accessibility');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Angular CDK');
    });

    it('should be case-insensitive', async () => {
      const results = await engine.searchByTag('ACCESSIBILITY');

      expect(results.length).toBeGreaterThan(0);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Angular CDK');
    });

    it('should return empty array for non-existent tag', async () => {
      const results = await engine.searchByTag('nonexistent-tag');

      expect(results).toEqual([]);
    });

    it('should find pages with both frontmatter and inline tags', async () => {
      const results = await engine.searchByTag('accessibility');

      // Should find pages with frontmatter tag AND pages with inline #accessibility
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findEntities', () => {
    it('should find all entity pages', async () => {
      const results = await engine.findEntities();

      expect(results.length).toBe(2);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Angular CDK');
      expect(titles).toContain('Angular Material');
    });

    it('should filter entities by name pattern', async () => {
      const results = await engine.findEntities('CDK');

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('Angular CDK');
    });

    it('should be case-insensitive for name pattern', async () => {
      const results = await engine.findEntities('angular');

      expect(results.length).toBe(2);
    });

    it('should return empty array when no entities match pattern', async () => {
      const results = await engine.findEntities('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('findConcepts', () => {
    it('should find all concept pages', async () => {
      const results = await engine.findConcepts();

      expect(results.length).toBe(2);
      const titles = results.map(r => r.frontmatter.title);
      expect(titles).toContain('Progressive Enhancement');
      expect(titles).toContain('Accessibility');
    });

    it('should filter concepts by name pattern', async () => {
      const results = await engine.findConcepts('Progressive');

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('Progressive Enhancement');
    });

    it('should be case-insensitive for name pattern', async () => {
      const results = await engine.findConcepts('accessibility');

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('Accessibility');
    });

    it('should return empty array when no concepts match pattern', async () => {
      const results = await engine.findConcepts('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('findSources', () => {
    it('should find all source pages', async () => {
      const results = await engine.findSources();

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('ARIA Specification');
    });

    it('should filter sources by author', async () => {
      const results = await engine.findSources({ author: 'W3C' });

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('ARIA Specification');
    });

    it('should filter sources by date', async () => {
      const results = await engine.findSources({ date: '2024-01-15' });

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('ARIA Specification');
    });

    it('should filter sources by URL pattern', async () => {
      const results = await engine.findSources({ urlPattern: 'w3.org' });

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('ARIA Specification');
    });

    it('should return empty array when no sources match filters', async () => {
      const results = await engine.findSources({ author: 'Nonexistent Author' });

      expect(results).toEqual([]);
    });

    it('should support multiple filters', async () => {
      const results = await engine.findSources({
        author: 'W3C',
        date: '2024-01-15',
      });

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('ARIA Specification');
    });
  });

  describe('findBacklinks', () => {
    it('should find pages that link to the specified page', async () => {
      const results = await engine.findBacklinks('entities/angular-cdk.md');

      expect(results.length).toBe(1);
      expect(results[0].frontmatter.title).toBe('Angular Material');
    });

    it('should return empty array for page with no backlinks', async () => {
      const results = await engine.findBacklinks('concepts/progressive-enhancement.md');

      expect(results).toEqual([]);
    });

    it('should return empty array for non-existent page', async () => {
      const results = await engine.findBacklinks('nonexistent.md');

      expect(results).toEqual([]);
    });

    it('should not include the page itself in backlinks', async () => {
      const results = await engine.findBacklinks('entities/angular-cdk.md');

      const selfReference = results.find(r => r.path === 'entities/angular-cdk.md');
      expect(selfReference).toBeUndefined();
    });

    it('should be case-insensitive for link matching', async () => {
      // Even if the link uses different casing, it should still match
      const results = await engine.findBacklinks('entities/angular-cdk.md');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle pages with no tags', async () => {
      const pageWithNoTags: WikiPage = {
        path: 'test/no-tags.md',
        filename: 'no-tags.md',
        frontmatter: {
          title: 'No Tags Page',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Content without tags',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      mockPages.push(pageWithNoTags);

      const results = await engine.search('Content');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle pages with no content', async () => {
      const pageWithNoContent: WikiPage = {
        path: 'test/no-content.md',
        filename: 'no-content.md',
        frontmatter: {
          title: 'Empty Page',
          type: 'entity',
          tags: ['test'],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: '',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      mockPages.push(pageWithNoContent);
      
      // Update the mock to include the new page
      vi.mocked(filesystem.listWikiFiles).mockResolvedValue([
        'entities/angular-cdk.md',
        'concepts/progressive-enhancement.md',
        'concepts/accessibility.md',
        'sources/aria-spec-2024-01-15.md',
        'entities/angular-material.md',
        'test/no-content.md',
      ]);

      const results = await engine.search('Empty');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle pages with no outgoing links', async () => {
      const results = await engine.search('Accessibility', { includeRelatedPages: true });

      const accessibilityResult = results.find(r => r.page.frontmatter.title === 'Accessibility');
      expect(accessibilityResult).toBeDefined();
      expect(accessibilityResult!.relatedPages).toBeDefined();
    });

    it('should skip index.md and activity-log.md', async () => {
      vi.mocked(filesystem.listWikiFiles).mockResolvedValue([
        'index.md',
        'activity-log.md',
        'entities/angular-cdk.md',
      ]);

      const results = await engine.search('Angular');

      // Should only find angular-cdk, not index or activity-log
      expect(results.length).toBe(1);
      expect(results[0].page.frontmatter.title).toBe('Angular CDK');
    });

    it('should handle special regex characters in search query', async () => {
      const results = await engine.search('Angular (CDK)');

      // Should not throw error and should handle parentheses
      expect(results).toBeDefined();
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'accessibility '.repeat(100);
      const results = await engine.search(longQuery);

      expect(results).toBeDefined();
    });
  });
});
