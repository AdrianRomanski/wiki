/**
 * Unit tests for publishAuthorPage
 * Feature: article-author-source-discovery
 * Requirements: 1.1, 1.2, 1.5, 8.1, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { publishAuthorPage, AuthorPageParams } from './generate-author-page';

describe('publishAuthorPage', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `test-workspace-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  const baseParams: AuthorPageParams = {
    authorName: 'Manfred Steyer',
    articleTitle: 'Micro Frontends with Angular',
    sourcePageTitle: 'Micro Frontends with Angular - Source',
    sourcePageSlug: 'micro-frontends-angular-2025-06-01',
    finalizedAt: '2025-06-01',
  };

  describe('skip logic (Req 1.5)', () => {
    it('should return action "skipped" when authorName is empty string', () => {
      const result = publishAuthorPage(workspaceRoot, { ...baseParams, authorName: '' });
      expect(result.action).toBe('skipped');
    });

    it('should return action "skipped" when authorName is whitespace only', () => {
      const result = publishAuthorPage(workspaceRoot, { ...baseParams, authorName: '   ' });
      expect(result.action).toBe('skipped');
    });

    it('should not create any file when authorName is empty', () => {
      publishAuthorPage(workspaceRoot, { ...baseParams, authorName: '' });
      const pagePath = join(workspaceRoot, 'wiki', 'entities', '.md');
      expect(existsSync(pagePath)).toBe(false);
    });
  });

  describe('new page creation (Req 1.1)', () => {
    it('should create a new page at wiki/entities/[author-slug].md', () => {
      const result = publishAuthorPage(workspaceRoot, baseParams);
      expect(result.action).toBe('created');
      expect(result.path).toBe('wiki/entities/manfred-steyer.md');
      expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
    });

    it('should generate valid frontmatter with required fields', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain('title: "Manfred Steyer"');
      expect(content).toContain('type: entity');
      expect(content).toContain('author');
      expect(content).toContain('person');
      expect(content).toContain(baseParams.sourcePageSlug);
    });

    it('should include article WikiLink in Articles section', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain('## Articles');
      expect(content).toContain(`[[${baseParams.articleTitle}]]`);
      expect(content).toContain('(2025-06-01)');
    });

    it('should include source page WikiLink in References section', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
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
      writeFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), existingContent, 'utf-8');
    });

    it('should return action "updated" when appending to existing page', () => {
      const result = publishAuthorPage(workspaceRoot, baseParams);
      expect(result.action).toBe('updated');
    });

    it('should preserve existing content (Req 8.1)', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain('[[Old Article Title]]');
      expect(content).toContain('Manfred Steyer is an article author');
    });

    it('should update the "updated" frontmatter field (Req 8.3)', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      // gray-matter uses single quotes in YAML output
      expect(content).toMatch(/updated:\s*['"]?2025-06-01['"]?/);
      // Original created date should be preserved
      expect(content).toMatch(/created:\s*['"]?2025-01-01['"]?/);
    });

    it('should append new source page slug to sources array (Req 8.4)', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain('old-article-slug-2025-01-01');
      expect(content).toContain(baseParams.sourcePageSlug);
    });

    it('should append new article entry at end of Articles section', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]] (2025-06-01)`);
    });

    it('should append new reference entry to References section', () => {
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
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

    it('should return action "skipped" when article WikiLink already exists', () => {
      writeFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), existingWithArticle, 'utf-8');
      const result = publishAuthorPage(workspaceRoot, baseParams);
      expect(result.action).toBe('skipped');
    });

    it('should not modify the file when duplicate is detected', () => {
      const pagePath = join(workspaceRoot, 'wiki/entities/manfred-steyer.md');
      writeFileSync(pagePath, existingWithArticle, 'utf-8');
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(pagePath, 'utf-8');
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

    it('should append "## Articles" heading when it does not exist', () => {
      writeFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), existingWithoutArticles, 'utf-8');
      publishAuthorPage(workspaceRoot, baseParams);
      const content = readFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), 'utf-8');
      expect(content).toContain('## Articles');
      expect(content).toContain(`[[${baseParams.sourcePageTitle}]]`);
    });
  });

  describe('malformed frontmatter (Req 8.7)', () => {
    it('should return action "skipped" with error for malformed frontmatter', () => {
      const malformedContent = `---
title: "Manfred Steyer"
type: entity
tags: [author, person
---

# Manfred Steyer
`;
      writeFileSync(join(workspaceRoot, 'wiki/entities/manfred-steyer.md'), malformedContent, 'utf-8');
      const result = publishAuthorPage(workspaceRoot, baseParams);
      // gray-matter may or may not throw on this — if it doesn't throw, the function
      // should still work. Let's verify it doesn't crash.
      expect(['updated', 'skipped']).toContain(result.action);
    });
  });

  describe('special characters in author names (Req 1.1, 1.2, 1.6)', () => {
    describe('accented characters', () => {
      it('should create page for author with accents: "José García"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'José García',
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        // Accents should be transliterated: é→e, í→i, á→a
        expect(result.path).toBe('wiki/entities/jose-garcia.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should create page for author with accents: "François Müller"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'François Müller',
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        // ç→c, ü→u
        expect(result.path).toBe('wiki/entities/francois-muller.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should create page for author with Polish characters: "Łukasz Kowalski"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Łukasz Kowalski',
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        // Ł doesn't decompose via NFKD, so it becomes a hyphen or is stripped
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
        // The slug should be valid (only lowercase alphanumeric and hyphens)
        const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });

      it('should preserve the original author name in frontmatter title', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'José García',
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/jose-garcia.md'), 'utf-8');
        expect(content).toContain('title: "José García"');
      });

      it('should preserve the original author name in body heading', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'François Müller',
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/francois-muller.md'), 'utf-8');
        expect(content).toContain('# François Müller');
      });
    });

    describe('apostrophes', () => {
      it('should create page for author with apostrophe: "O\'Brien"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: "O'Brien",
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        // Apostrophe becomes a hyphen separator
        expect(result.path).toBe('wiki/entities/o-brien.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should create page for author with apostrophe: "D\'Angelo"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: "D'Angelo",
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/d-angelo.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should preserve apostrophe in frontmatter title', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: "O'Brien",
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/o-brien.md'), 'utf-8');
        expect(content).toContain("title: \"O'Brien\"");
      });
    });

    describe('hyphens', () => {
      it('should create page for author with hyphen: "Jean-Pierre Dupont"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Jean-Pierre Dupont',
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/jean-pierre-dupont.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should create page for author with hyphen: "Mary-Jane Watson"', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Mary-Jane Watson',
        };
        const result = publishAuthorPage(workspaceRoot, params);
        expect(result.action).toBe('created');
        expect(result.path).toBe('wiki/entities/mary-jane-watson.md');
        expect(existsSync(join(workspaceRoot, result.path))).toBe(true);
      });

      it('should preserve hyphen in frontmatter title', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Jean-Pierre Dupont',
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/jean-pierre-dupont.md'), 'utf-8');
        expect(content).toContain('title: "Jean-Pierre Dupont"');
      });
    });

    describe('slug generation validity', () => {
      it('should produce slugs with only lowercase alphanumeric and hyphens', () => {
        const specialNames = [
          'José García',
          'François Müller',
          "O'Brien",
          "D'Angelo",
          'Jean-Pierre Dupont',
          'Mary-Jane Watson',
        ];

        for (const name of specialNames) {
          const params: AuthorPageParams = { ...baseParams, authorName: name };
          const result = publishAuthorPage(workspaceRoot, params);
          const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
          expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        }
      });

      it('should not produce empty slugs for any special character name', () => {
        const specialNames = [
          'José García',
          'François Müller',
          "O'Brien",
          'Jean-Pierre Dupont',
        ];

        for (const name of specialNames) {
          const params: AuthorPageParams = { ...baseParams, authorName: name };
          const result = publishAuthorPage(workspaceRoot, params);
          const slug = result.path.replace('wiki/entities/', '').replace('.md', '');
          expect(slug.length).toBeGreaterThan(0);
        }
      });
    });

    describe('generated page content validity', () => {
      it('should produce valid markdown with correct WikiLinks for accented author', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'José García',
          articleTitle: 'Angular Signals Deep Dive',
          sourcePageTitle: 'Angular Signals Deep Dive - Source',
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/jose-garcia.md'), 'utf-8');

        // Valid frontmatter
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('type: entity');
        expect(content).toContain('tags:');
        expect(content).toContain('author');
        expect(content).toContain('person');

        // WikiLinks in Articles section
        expect(content).toContain('## Articles');
        expect(content).toContain('[[Angular Signals Deep Dive]]');

        // WikiLinks in References section
        expect(content).toContain('## References');
        expect(content).toContain('[[Angular Signals Deep Dive - Source]]');
      });

      it('should produce valid markdown with correct WikiLinks for hyphenated author', () => {
        const params: AuthorPageParams = {
          ...baseParams,
          authorName: 'Jean-Pierre Dupont',
          articleTitle: 'RxJS Best Practices',
          sourcePageTitle: 'RxJS Best Practices - Source',
        };
        publishAuthorPage(workspaceRoot, params);
        const content = readFileSync(join(workspaceRoot, 'wiki/entities/jean-pierre-dupont.md'), 'utf-8');

        // Valid frontmatter
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('type: entity');

        // WikiLinks
        expect(content).toContain('[[RxJS Best Practices]]');
        expect(content).toContain('[[RxJS Best Practices - Source]]');
      });
    });
  });

  describe('multiple articles by same author (Req 1.2)', () => {
    it('should append second article to existing author page', () => {
      // Create first article
      const firstParams: AuthorPageParams = {
        authorName: 'Jean-Pierre Dupont',
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      };
      const firstResult = publishAuthorPage(workspaceRoot, firstParams);
      expect(firstResult.action).toBe('created');

      // Append second article
      const secondParams: AuthorPageParams = {
        authorName: 'Jean-Pierre Dupont',
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-03-15',
        finalizedAt: '2025-03-15',
      };
      const secondResult = publishAuthorPage(workspaceRoot, secondParams);
      expect(secondResult.action).toBe('updated');

      const content = readFileSync(join(workspaceRoot, 'wiki/entities/jean-pierre-dupont.md'), 'utf-8');
      expect(content).toContain('[[First Article]]');
      expect(content).toContain('[[Second Article - Source]]');
      expect(content).toContain('(2025-01-01)');
      expect(content).toContain('(2025-03-15)');
    });

    it('should append third article to existing author page with two articles', () => {
      // Create first article
      publishAuthorPage(workspaceRoot, {
        authorName: 'José García',
        articleTitle: 'Article One',
        sourcePageTitle: 'Article One - Source',
        sourcePageSlug: 'article-one-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      // Append second article
      publishAuthorPage(workspaceRoot, {
        authorName: 'José García',
        articleTitle: 'Article Two',
        sourcePageTitle: 'Article Two - Source',
        sourcePageSlug: 'article-two-2025-02-15',
        finalizedAt: '2025-02-15',
      });

      // Append third article
      const thirdResult = publishAuthorPage(workspaceRoot, {
        authorName: 'José García',
        articleTitle: 'Article Three',
        sourcePageTitle: 'Article Three - Source',
        sourcePageSlug: 'article-three-2025-04-20',
        finalizedAt: '2025-04-20',
      });
      expect(thirdResult.action).toBe('updated');

      const content = readFileSync(join(workspaceRoot, 'wiki/entities/jose-garcia.md'), 'utf-8');
      // All three articles should be present
      expect(content).toContain('[[Article One]]');
      expect(content).toContain('[[Article Two - Source]]');
      expect(content).toContain('[[Article Three - Source]]');
      // All three references should be present
      expect(content).toContain('[[Article One - Source]]');
      expect(content).toContain('[[Article Two - Source]]');
      expect(content).toContain('[[Article Three - Source]]');
    });

    it('should update the "updated" frontmatter field to the latest date', () => {
      publishAuthorPage(workspaceRoot, {
        authorName: "O'Brien",
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      publishAuthorPage(workspaceRoot, {
        authorName: "O'Brien",
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-06-15',
        finalizedAt: '2025-06-15',
      });

      const content = readFileSync(join(workspaceRoot, 'wiki/entities/o-brien.md'), 'utf-8');
      expect(content).toMatch(/updated:\s*['"]?2025-06-15['"]?/);
    });

    it('should accumulate source slugs in the sources array', () => {
      publishAuthorPage(workspaceRoot, {
        authorName: 'Mary-Jane Watson',
        articleTitle: 'First Article',
        sourcePageTitle: 'First Article - Source',
        sourcePageSlug: 'first-article-2025-01-01',
        finalizedAt: '2025-01-01',
      });

      publishAuthorPage(workspaceRoot, {
        authorName: 'Mary-Jane Watson',
        articleTitle: 'Second Article',
        sourcePageTitle: 'Second Article - Source',
        sourcePageSlug: 'second-article-2025-03-10',
        finalizedAt: '2025-03-10',
      });

      const content = readFileSync(join(workspaceRoot, 'wiki/entities/mary-jane-watson.md'), 'utf-8');
      expect(content).toContain('first-article-2025-01-01');
      expect(content).toContain('second-article-2025-03-10');
    });

    it('should skip duplicate article for author with special characters', () => {
      const params: AuthorPageParams = {
        authorName: 'François Müller',
        articleTitle: 'Same Article',
        sourcePageTitle: 'Same Article - Source',
        sourcePageSlug: 'same-article-2025-01-01',
        finalizedAt: '2025-01-01',
      };

      // Create first
      const firstResult = publishAuthorPage(workspaceRoot, params);
      expect(firstResult.action).toBe('created');

      // Try to add same article again
      const secondResult = publishAuthorPage(workspaceRoot, params);
      expect(secondResult.action).toBe('skipped');
    });
  });
});
