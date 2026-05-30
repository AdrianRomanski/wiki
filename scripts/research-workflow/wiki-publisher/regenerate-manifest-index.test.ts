/**
 * Unit tests for manifest and index regeneration
 * Feature: article-research-session
 * Requirements: 6.9, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  regenerateManifestAndIndex,
  verifyManifestEntries,
  verifyIndexEntries,
  rollbackPages,
} from './regenerate-manifest-index';

// Mock child_process for regenerateManifestAndIndex tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
const mockedExecSync = vi.mocked(execSync);

describe('regenerateManifestAndIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success when both scripts execute successfully', () => {
    mockedExecSync.mockReturnValue('');

    const result = regenerateManifestAndIndex('/workspace');

    expect(result.success).toBe(true);
    expect(result.failedScript).toBeUndefined();
    expect(result.errorMessage).toBeUndefined();
  });

  it('runs manifest script first, then index script', () => {
    mockedExecSync.mockReturnValue('');

    regenerateManifestAndIndex('/workspace');

    expect(mockedExecSync).toHaveBeenCalledTimes(2);
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      1,
      'node scripts/generate-wiki-manifest.mjs',
      expect.objectContaining({ cwd: '/workspace' })
    );
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      2,
      'node scripts/generate-wiki-index.mjs',
      expect.objectContaining({ cwd: '/workspace' })
    );
  });

  it('returns failure with script name when manifest script fails', () => {
    mockedExecSync.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('manifest')) {
        throw new Error('manifest script crashed');
      }
      return '';
    });

    const result = regenerateManifestAndIndex('/workspace');

    expect(result.success).toBe(false);
    expect(result.failedScript).toBe('generate-wiki-manifest.mjs');
    expect(result.errorMessage).toContain('manifest script crashed');
  });

  it('returns failure with script name when index script fails', () => {
    mockedExecSync.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('index')) {
        throw new Error('index script crashed');
      }
      return '';
    });

    const result = regenerateManifestAndIndex('/workspace');

    expect(result.success).toBe(false);
    expect(result.failedScript).toBe('generate-wiki-index.mjs');
    expect(result.errorMessage).toContain('index script crashed');
  });

  it('does not run index script if manifest script fails', () => {
    mockedExecSync.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('manifest')) {
        throw new Error('manifest failed');
      }
      return '';
    });

    regenerateManifestAndIndex('/workspace');

    expect(mockedExecSync).toHaveBeenCalledTimes(1);
  });

  it('passes workspace root as cwd to both scripts', () => {
    mockedExecSync.mockReturnValue('');

    regenerateManifestAndIndex('/my/custom/workspace');

    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cwd: '/my/custom/workspace' })
    );
  });
});

describe('verifyManifestEntries', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-manifest-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('returns true when all wiki pages are in the manifest', () => {
    const manifest = {
      files: ['entities/rxjs.md', 'concepts/reactive-programming.md', 'sources/rxjs-article-2025-01-15.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    writeFileSync(join(workspaceRoot, 'wiki', 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const wikiPages = [
      'wiki/entities/rxjs.md',
      'wiki/concepts/reactive-programming.md',
    ];

    expect(verifyManifestEntries(workspaceRoot, wikiPages)).toBe(true);
  });

  it('returns false when a wiki page is missing from the manifest', () => {
    const manifest = {
      files: ['entities/rxjs.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    writeFileSync(join(workspaceRoot, 'wiki', 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const wikiPages = [
      'wiki/entities/rxjs.md',
      'wiki/concepts/missing-concept.md',
    ];

    expect(verifyManifestEntries(workspaceRoot, wikiPages)).toBe(false);
  });

  it('returns true for empty wikiPages array', () => {
    expect(verifyManifestEntries(workspaceRoot, [])).toBe(true);
  });

  it('returns false when manifest.json does not exist', () => {
    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(verifyManifestEntries(workspaceRoot, wikiPages)).toBe(false);
  });

  it('returns false when manifest.json is malformed', () => {
    writeFileSync(join(workspaceRoot, 'wiki', 'manifest.json'), 'not json', 'utf-8');

    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(verifyManifestEntries(workspaceRoot, wikiPages)).toBe(false);
  });

  it('strips wiki/ prefix when comparing paths', () => {
    const manifest = {
      files: ['sources/my-article-article-2025-01-15.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    writeFileSync(join(workspaceRoot, 'wiki', 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const wikiPages = ['wiki/sources/my-article-article-2025-01-15.md'];
    expect(verifyManifestEntries(workspaceRoot, wikiPages)).toBe(true);
  });
});

describe('verifyIndexEntries', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-index-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki', 'concepts'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki', 'sources'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('returns true when all page titles appear in the index', () => {
    // Create wiki pages with frontmatter
    writeFileSync(
      join(workspaceRoot, 'wiki', 'entities', 'rxjs.md'),
      '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n',
      'utf-8'
    );
    writeFileSync(
      join(workspaceRoot, 'wiki', 'concepts', 'reactive-programming.md'),
      '---\ntitle: "Reactive Programming"\ntype: concept\n---\n\n# Reactive Programming\n',
      'utf-8'
    );

    // Create index that references these pages
    const indexContent = [
      '# Wiki Index',
      '',
      '## Entities',
      '',
      '- [[RxJS]] — A reactive extensions library',
      '',
      '## Concepts',
      '',
      '- [[Reactive Programming]] — A paradigm for data flows',
      '',
    ].join('\n');
    writeFileSync(join(workspaceRoot, 'wiki', 'index.md'), indexContent, 'utf-8');

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/reactive-programming.md'];
    expect(verifyIndexEntries(workspaceRoot, wikiPages)).toBe(true);
  });

  it('returns false when a page title is missing from the index', () => {
    writeFileSync(
      join(workspaceRoot, 'wiki', 'entities', 'rxjs.md'),
      '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n',
      'utf-8'
    );
    writeFileSync(
      join(workspaceRoot, 'wiki', 'concepts', 'missing-concept.md'),
      '---\ntitle: "Missing Concept"\ntype: concept\n---\n\n# Missing Concept\n',
      'utf-8'
    );

    const indexContent = '# Wiki Index\n\n## Entities\n\n- [[RxJS]]\n';
    writeFileSync(join(workspaceRoot, 'wiki', 'index.md'), indexContent, 'utf-8');

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/missing-concept.md'];
    expect(verifyIndexEntries(workspaceRoot, wikiPages)).toBe(false);
  });

  it('returns true for empty wikiPages array', () => {
    expect(verifyIndexEntries(workspaceRoot, [])).toBe(true);
  });

  it('returns false when index.md does not exist', () => {
    writeFileSync(
      join(workspaceRoot, 'wiki', 'entities', 'rxjs.md'),
      '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n',
      'utf-8'
    );

    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(verifyIndexEntries(workspaceRoot, wikiPages)).toBe(false);
  });

  it('falls back to filename slug when page has no frontmatter title', () => {
    writeFileSync(
      join(workspaceRoot, 'wiki', 'entities', 'some-lib.md'),
      '# Some Lib\n\nNo frontmatter here.\n',
      'utf-8'
    );

    const indexContent = '# Wiki Index\n\n- some-lib is referenced here\n';
    writeFileSync(join(workspaceRoot, 'wiki', 'index.md'), indexContent, 'utf-8');

    const wikiPages = ['wiki/entities/some-lib.md'];
    expect(verifyIndexEntries(workspaceRoot, wikiPages)).toBe(true);
  });

  it('returns false when the wiki page file does not exist on disk', () => {
    const indexContent = '# Wiki Index\n\n- [[Ghost Page]]\n';
    writeFileSync(join(workspaceRoot, 'wiki', 'index.md'), indexContent, 'utf-8');

    const wikiPages = ['wiki/entities/ghost-page.md'];
    expect(verifyIndexEntries(workspaceRoot, wikiPages)).toBe(false);
  });
});

describe('rollbackPages', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-rollback-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki', 'concepts'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki', 'sources'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('deletes all specified wiki pages', () => {
    writeFileSync(join(workspaceRoot, 'wiki', 'entities', 'rxjs.md'), '# RxJS', 'utf-8');
    writeFileSync(join(workspaceRoot, 'wiki', 'concepts', 'reactive.md'), '# Reactive', 'utf-8');
    writeFileSync(join(workspaceRoot, 'wiki', 'sources', 'article.md'), '# Article', 'utf-8');

    const pages = [
      'wiki/entities/rxjs.md',
      'wiki/concepts/reactive.md',
      'wiki/sources/article.md',
    ];

    rollbackPages(workspaceRoot, pages);

    expect(existsSync(join(workspaceRoot, 'wiki', 'entities', 'rxjs.md'))).toBe(false);
    expect(existsSync(join(workspaceRoot, 'wiki', 'concepts', 'reactive.md'))).toBe(false);
    expect(existsSync(join(workspaceRoot, 'wiki', 'sources', 'article.md'))).toBe(false);
  });

  it('does not throw when a page does not exist', () => {
    const pages = ['wiki/entities/nonexistent.md'];

    expect(() => rollbackPages(workspaceRoot, pages)).not.toThrow();
  });

  it('handles empty pages array without error', () => {
    expect(() => rollbackPages(workspaceRoot, [])).not.toThrow();
  });

  it('only deletes specified pages, leaving others intact', () => {
    writeFileSync(join(workspaceRoot, 'wiki', 'entities', 'keep-me.md'), '# Keep', 'utf-8');
    writeFileSync(join(workspaceRoot, 'wiki', 'entities', 'delete-me.md'), '# Delete', 'utf-8');

    rollbackPages(workspaceRoot, ['wiki/entities/delete-me.md']);

    expect(existsSync(join(workspaceRoot, 'wiki', 'entities', 'keep-me.md'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'wiki', 'entities', 'delete-me.md'))).toBe(false);
  });

  it('handles mix of existing and non-existing pages', () => {
    writeFileSync(join(workspaceRoot, 'wiki', 'entities', 'exists.md'), '# Exists', 'utf-8');

    const pages = [
      'wiki/entities/exists.md',
      'wiki/entities/does-not-exist.md',
    ];

    expect(() => rollbackPages(workspaceRoot, pages)).not.toThrow();
    expect(existsSync(join(workspaceRoot, 'wiki', 'entities', 'exists.md'))).toBe(false);
  });
});
