import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateStructure, buildIndex } from '../wiki-index';

describe('validateStructure', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns valid: true when all required components exist', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.md'), '# Index');
    fs.mkdirSync(path.join(tmpDir, 'entities'));
    fs.mkdirSync(path.join(tmpDir, 'concepts'));
    fs.mkdirSync(path.join(tmpDir, 'sources'));

    const result = validateStructure(tmpDir);
    expect(result).toEqual({ valid: true });
  });

  it('returns valid: false with error listing all missing components for empty dir', () => {
    const result = validateStructure(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('index.md');
    expect(result.error).toContain('entities/');
    expect(result.error).toContain('concepts/');
    expect(result.error).toContain('sources/');
  });

  it('returns error naming only the missing components', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.md'), '# Index');
    fs.mkdirSync(path.join(tmpDir, 'entities'));

    const result = validateStructure(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).not.toContain('index.md');
    expect(result.error).not.toContain('entities/');
    expect(result.error).toContain('concepts/');
    expect(result.error).toContain('sources/');
  });

  it('returns error when index.md is a directory instead of a file', () => {
    fs.mkdirSync(path.join(tmpDir, 'index.md'));
    fs.mkdirSync(path.join(tmpDir, 'entities'));
    fs.mkdirSync(path.join(tmpDir, 'concepts'));
    fs.mkdirSync(path.join(tmpDir, 'sources'));

    const result = validateStructure(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('index.md');
  });

  it('returns error when entities is a file instead of a directory', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.md'), '# Index');
    fs.writeFileSync(path.join(tmpDir, 'entities'), 'not a dir');
    fs.mkdirSync(path.join(tmpDir, 'concepts'));
    fs.mkdirSync(path.join(tmpDir, 'sources'));

    const result = validateStructure(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('entities/');
  });

  it('returns error for non-existent directory', () => {
    const result = validateStructure('/non/existent/path');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('index.md');
    expect(result.error).toContain('entities/');
    expect(result.error).toContain('concepts/');
    expect(result.error).toContain('sources/');
  });
});


describe('buildIndex', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-index-test-'));
    fs.writeFileSync(path.join(tmpDir, 'index.md'), '# Wiki Index');
    fs.mkdirSync(path.join(tmpDir, 'entities'));
    fs.mkdirSync(path.join(tmpDir, 'concepts'));
    fs.mkdirSync(path.join(tmpDir, 'sources'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeWikiPage(subdir: string, filename: string, frontmatter: Record<string, unknown>, content: string) {
    const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    });
    const raw = `---\n${yamlLines.join('\n')}\n---\n\n${content}`;
    fs.writeFileSync(path.join(tmpDir, subdir, filename), raw);
  }

  it('indexes pages from all subdirectories', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework', 'frontend'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular is a framework.');

    writeWikiPage('concepts', 'dependency-injection.md', {
      title: 'Dependency Injection',
      type: 'concept',
      tags: ['pattern'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'DI is a pattern used in [[Angular]].');

    writeWikiPage('sources', 'source-angular-docs-2024-01-01.md', {
      title: 'Angular Docs',
      type: 'source',
      tags: ['documentation'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Official docs for [[Angular]] and [[Dependency Injection]].');

    const index = await buildIndex(tmpDir);

    expect(index.pages.size).toBe(3);
    expect(index.pages.has('angular')).toBe(true);
    expect(index.pages.has('dependency injection')).toBe(true);
    expect(index.pages.has('angular docs')).toBe(true);
  });

  it('extracts outgoing WikiLinks from content', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular uses [[Dependency Injection]] and [[RxJS]].');

    const index = await buildIndex(tmpDir);
    const page = index.pages.get('angular')!;

    expect(page.outgoingLinks).toContain('Dependency Injection');
    expect(page.outgoingLinks).toContain('RxJS');
    expect(page.outgoingLinks.length).toBe(2);
  });

  it('builds backlinks map correctly', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular is a framework.');

    writeWikiPage('concepts', 'di.md', {
      title: 'Dependency Injection',
      type: 'concept',
      tags: ['pattern'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'DI is used in [[Angular]].');

    writeWikiPage('sources', 'source-article-2024-01-01.md', {
      title: 'Article',
      type: 'source',
      tags: ['article'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'This article discusses [[Angular]] and [[Dependency Injection]].');

    const index = await buildIndex(tmpDir);

    const angularBacklinks = index.backlinks.get('angular');
    expect(angularBacklinks).toBeDefined();
    expect(angularBacklinks).toContain('Dependency Injection');
    expect(angularBacklinks).toContain('Article');
    expect(angularBacklinks!.length).toBe(2);

    const diBacklinks = index.backlinks.get('dependency injection');
    expect(diBacklinks).toBeDefined();
    expect(diBacklinks).toContain('Article');
  });

  it('builds tags map correctly', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework', 'frontend'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular content.');

    writeWikiPage('entities', 'react.md', {
      title: 'React',
      type: 'entity',
      tags: ['framework', 'frontend'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'React content.');

    writeWikiPage('concepts', 'di.md', {
      title: 'DI',
      type: 'concept',
      tags: ['pattern'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'DI content.');

    const index = await buildIndex(tmpDir);

    const frameworkPages = index.tags.get('framework');
    expect(frameworkPages).toBeDefined();
    expect(frameworkPages).toContain('Angular');
    expect(frameworkPages).toContain('React');
    expect(frameworkPages!.length).toBe(2);

    const patternPages = index.tags.get('pattern');
    expect(patternPages).toBeDefined();
    expect(patternPages).toContain('DI');
    expect(patternPages!.length).toBe(1);
  });

  it('skips malformed pages with a warning and continues', async () => {
    writeWikiPage('entities', 'good.md', {
      title: 'Good Page',
      type: 'entity',
      tags: ['test'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Valid page content.');

    fs.writeFileSync(
      path.join(tmpDir, 'entities', 'bad.md'),
      '---\ntitle: \n---\n\nNo valid frontmatter.'
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const index = await buildIndex(tmpDir);

    expect(index.pages.size).toBe(1);
    expect(index.pages.has('good page')).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('skips non-.md files', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular content.');

    fs.writeFileSync(path.join(tmpDir, 'entities', 'notes.txt'), 'not a wiki page');

    const index = await buildIndex(tmpDir);
    expect(index.pages.size).toBe(1);
  });

  it('stores relative filePath in PageMeta', async () => {
    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular content.');

    const index = await buildIndex(tmpDir);
    const page = index.pages.get('angular')!;

    expect(page.filePath).toBe('entities/angular.md');
  });

  it('returns empty index when subdirectories are empty', async () => {
    const index = await buildIndex(tmpDir);

    expect(index.pages.size).toBe(0);
    expect(index.backlinks.size).toBe(0);
    expect(index.tags.size).toBe(0);
  });

  it('handles missing subdirectories gracefully', async () => {
    fs.rmSync(path.join(tmpDir, 'sources'), { recursive: true });

    writeWikiPage('entities', 'angular.md', {
      title: 'Angular',
      type: 'entity',
      tags: ['framework'],
      created: '2024-01-01',
      updated: '2024-01-02',
    }, 'Angular content.');

    const index = await buildIndex(tmpDir);
    expect(index.pages.size).toBe(1);
  });
});
