/**
 * Integration tests for the Wiki MCP Server.
 * Tests end-to-end: create page → list → read → search → cross-references.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateStructure, buildIndex } from '../wiki-index';
import { handleListPages } from '../tools/list-pages';
import { handleReadPage } from '../tools/read-page';
import { handleSearchContent } from '../tools/search-content';
import { handleResolveReferences } from '../tools/resolve-references';
import { handleSearchTags } from '../tools/search-tags';
import { handleListTags } from '../tools/list-tags';
import { handleCreatePage } from '../tools/create-page';
import { WikiIndex } from '../types';

function createWikiDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-integration-'));
  fs.writeFileSync(path.join(tmpDir, 'index.md'), '# Wiki Index\n');
  fs.mkdirSync(path.join(tmpDir, 'entities'));
  fs.mkdirSync(path.join(tmpDir, 'concepts'));
  fs.mkdirSync(path.join(tmpDir, 'sources'));
  return tmpDir;
}

function writePage(wikiDir: string, subdir: string, filename: string, content: string) {
  fs.writeFileSync(path.join(wikiDir, subdir, filename), content);
}

describe('Wiki MCP Server Integration', () => {
  let wikiDir: string;
  let index: WikiIndex;

  beforeEach(async () => {
    wikiDir = createWikiDir();

    writePage(wikiDir, 'entities', 'angular.md', `---
title: Angular
type: entity
tags:
  - framework
  - frontend
created: "2024-01-01"
updated: "2024-01-02"
---
Angular is a platform for building web applications. It uses [[Dependency Injection]] heavily.
`);

    writePage(wikiDir, 'concepts', 'dependency-injection.md', `---
title: Dependency Injection
type: concept
tags:
  - pattern
  - architecture
created: "2024-01-01"
updated: "2024-01-02"
---
Dependency Injection is a design pattern used in [[Angular]] and many other frameworks.
`);

    writePage(wikiDir, 'sources', 'source-angular-docs-2024-01-01.md', `---
title: Angular Docs
type: source
tags:
  - documentation
  - angular
author: Angular Team
url: https://angular.dev
created: "2024-01-01"
updated: "2024-01-02"
---
Official documentation for [[Angular]].
`);

    index = await buildIndex(wikiDir);
  });

  afterEach(() => {
    fs.rmSync(wikiDir, { recursive: true, force: true });
  });

  describe('Server startup validation', () => {
    it('validates a correct wiki structure', () => {
      const result = validateStructure(wikiDir);
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid wiki structure', () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-empty-'));
      try {
        const result = validateStructure(emptyDir);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('index.md');
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });

    it('builds index with correct page count', () => {
      expect(index.pages.size).toBe(3);
    });
  });

  describe('wiki_list_pages tool', () => {
    it('lists all pages', () => {
      const result = handleListPages(index, {});
      expect(result.pages).toHaveLength(3);
    });

    it('filters by type', () => {
      const result = handleListPages(index, { type: 'entity' });
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('Angular');
    });

    it('filters by tag', () => {
      const result = handleListPages(index, { tag: 'documentation' });
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('Angular Docs');
    });

    it('returns pages sorted alphabetically', () => {
      const result = handleListPages(index, {});
      const titles = result.pages.map((p) => p.title);
      const sorted = [...titles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      expect(titles).toEqual(sorted);
    });
  });

  describe('wiki_read_page tool', () => {
    it('reads a page by title', () => {
      const result = handleReadPage(wikiDir, index, { title: 'Angular' });
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.title).toBe('Angular');
        expect(result.content).toContain('Angular is a platform');
        expect(result.frontmatter.type).toBe('entity');
      }
    });

    it('includes backlinks in response', () => {
      const result = handleReadPage(wikiDir, index, { title: 'Angular' });
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.backlinks).toContain('Dependency Injection');
        expect(result.backlinks).toContain('Angular Docs');
      }
    });

    it('reads a page by file path', () => {
      const result = handleReadPage(wikiDir, index, { path: 'entities/angular.md' });
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.title).toBe('Angular');
      }
    });

    it('returns error for non-existent page', () => {
      const result = handleReadPage(wikiDir, index, { title: 'Nonexistent Page' });
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('wiki_search tool', () => {
    it('finds pages by keyword in content', () => {
      const result = handleSearchContent(wikiDir, index, { query: 'platform' });
      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.some((m) => m.title === 'Angular')).toBe(true);
    });

    it('performs case-insensitive search', () => {
      const lower = handleSearchContent(wikiDir, index, { query: 'angular' });
      const upper = handleSearchContent(wikiDir, index, { query: 'ANGULAR' });
      expect(lower.totalMatches).toBe(upper.totalMatches);
    });

    it('returns empty results for no match', () => {
      const result = handleSearchContent(wikiDir, index, { query: 'xyznonexistent' });
      expect(result.totalMatches).toBe(0);
      expect(result.matches).toHaveLength(0);
    });

    it('includes excerpt in results', () => {
      const result = handleSearchContent(wikiDir, index, { query: 'platform' });
      const match = result.matches.find((m) => m.title === 'Angular');
      expect(match?.excerpt).toBeDefined();
      expect(match?.excerpt.toLowerCase()).toContain('platform');
    });
  });

  describe('wiki_resolve_references tool', () => {
    it('returns outgoing links for a page', () => {
      const result = handleResolveReferences(index, { title: 'Angular' });
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.outgoing.some((l) => l.title === 'Dependency Injection')).toBe(true);
      }
    });

    it('marks existing links as exists: true', () => {
      const result = handleResolveReferences(index, { title: 'Angular' });
      if (!('error' in result)) {
        const diLink = result.outgoing.find((l) => l.title === 'Dependency Injection');
        expect(diLink?.exists).toBe(true);
      }
    });

    it('returns incoming backlinks', () => {
      const result = handleResolveReferences(index, { title: 'Angular' });
      if (!('error' in result)) {
        expect(result.incoming).toContain('Dependency Injection');
        expect(result.incoming).toContain('Angular Docs');
      }
    });

    it('returns error for non-existent page', () => {
      const result = handleResolveReferences(index, { title: 'Nonexistent' });
      expect('error' in result).toBe(true);
    });
  });

  describe('wiki_search_tags tool', () => {
    it('finds pages by tag', () => {
      const result = handleSearchTags(index, { tags: ['pattern'] });
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('Dependency Injection');
    });

    it('returns pages matching any of the tags (OR logic)', () => {
      const result = handleSearchTags(index, { tags: ['framework', 'documentation'] });
      expect(result.pages.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty for unknown tag', () => {
      const result = handleSearchTags(index, { tags: ['nonexistent-tag'] });
      expect(result.pages).toHaveLength(0);
    });
  });

  describe('wiki_list_tags tool', () => {
    it('lists all unique tags', () => {
      const result = handleListTags(index);
      const tagNames = result.tags.map((t) => t.tag);
      expect(tagNames).toContain('framework');
      expect(tagNames).toContain('pattern');
      expect(tagNames).toContain('documentation');
    });

    it('includes correct page counts', () => {
      const result = handleListTags(index);
      const frontend = result.tags.find((t) => t.tag === 'frontend');
      expect(frontend?.count).toBe(1);
    });
  });

  describe('wiki_create_page tool', () => {
    it('creates a new entity page', () => {
      const result = handleCreatePage(wikiDir, index, {
        title: 'TypeScript',
        type: 'entity',
        tags: ['language', 'frontend'],
        content: '# TypeScript\n\nA typed superset of JavaScript.',
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.title).toBe('TypeScript');
        expect(result.filePath).toBe('entities/typescript.md');
        expect(fs.existsSync(path.join(wikiDir, result.filePath))).toBe(true);
      }
    });

    it('rejects duplicate title', () => {
      const result = handleCreatePage(wikiDir, index, {
        title: 'Angular',
        type: 'entity',
        tags: ['framework'],
        content: 'Duplicate.',
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('already exists');
      }
    });

    it('creates a source page with correct filename format', () => {
      const result = handleCreatePage(wikiDir, index, {
        title: 'WCAG Overview',
        type: 'source',
        tags: ['accessibility'],
        content: 'WCAG overview content.',
        author: 'W3C',
        url: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.filePath.startsWith('sources/source-wcag-overview-')).toBe(true);
        expect(result.filePath.endsWith('.md')).toBe(true);
      }
    });

    it('end-to-end: create → list → read → search → cross-references', async () => {
      const createResult = handleCreatePage(wikiDir, index, {
        title: 'RxJS',
        type: 'entity',
        tags: ['reactive', 'frontend'],
        content: '# RxJS\n\nReactive Extensions for JavaScript. Used in [[Angular]].',
      });
      expect('error' in createResult).toBe(false);

      const newIndex = await buildIndex(wikiDir);

      const listResult = handleListPages(newIndex, {});
      expect(listResult.pages.some((p) => p.title === 'RxJS')).toBe(true);

      const readResult = handleReadPage(wikiDir, newIndex, { title: 'RxJS' });
      expect('error' in readResult).toBe(false);
      if (!('error' in readResult)) {
        expect(readResult.content).toContain('Reactive Extensions');
      }

      const searchResult = handleSearchContent(wikiDir, newIndex, { query: 'Reactive Extensions' });
      expect(searchResult.matches.some((m) => m.title === 'RxJS')).toBe(true);

      const refsResult = handleResolveReferences(newIndex, { title: 'RxJS' });
      expect('error' in refsResult).toBe(false);
      if (!('error' in refsResult)) {
        const angularLink = refsResult.outgoing.find((l) => l.title === 'Angular');
        expect(angularLink?.exists).toBe(true);
      }
    });
  });
});
