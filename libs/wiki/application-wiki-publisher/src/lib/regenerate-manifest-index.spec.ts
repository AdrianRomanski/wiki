/**
 * Unit tests for manifest and index regeneration
 * Feature: article-research-session, scripts-migration-hexagonal
 *
 * Migrated from scripts/research-workflow/wiki-publisher/regenerate-manifest-index.test.ts
 *
 * `regenerateManifestAndIndex` now takes `(runner: CommandRunnerPort, workspaceRoot: string)`
 * instead of directly calling `execSync`, isolating the `child_process` shell-out
 * behind `CommandRunnerPort` (Requirement 2.6, 4.5, 4.7). `verifyManifestEntries`,
 * `verifyIndexEntries`, and `rollbackPages` now take `(fs: FileSystemPort, ...)`
 * instead of `(workspaceRoot: string, ...)` and are async.
 *
 * Real `child_process` mocking and `os.tmpdir()` fixtures are replaced with
 * `FakeCommandRunnerPort` / `FakeFileSystemPort` in-memory test doubles — no
 * real `child_process` execution or real filesystem I/O occurs in this spec.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  regenerateManifestAndIndex,
  verifyManifestEntries,
  verifyIndexEntries,
  rollbackPages,
} from './regenerate-manifest-index';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import { FakeCommandRunnerPort } from './test-utils/fake-command-runner-port';

describe('regenerateManifestAndIndex', () => {
  let runner: FakeCommandRunnerPort;

  beforeEach(() => {
    runner = new FakeCommandRunnerPort();
  });

  it('returns success when both scripts execute successfully', () => {
    const result = regenerateManifestAndIndex(runner, '/workspace');

    expect(result.success).toBe(true);
    expect(result.failedScript).toBeUndefined();
    expect(result.errorMessage).toBeUndefined();
  });

  it('runs manifest target first, then index target', () => {
    regenerateManifestAndIndex(runner, '/workspace');

    expect(runner.calls).toHaveLength(2);
    expect(runner.calls[0]).toEqual({
      command: 'npx nx run wiki-cli:generate-manifest',
      cwd: '/workspace',
    });
    expect(runner.calls[1]).toEqual({
      command: 'npx nx run wiki-cli:generate-index',
      cwd: '/workspace',
    });
  });

  it('returns failure with target name when manifest target fails', () => {
    runner.failCommand('npx nx run wiki-cli:generate-manifest', 'manifest target crashed');

    const result = regenerateManifestAndIndex(runner, '/workspace');

    expect(result.success).toBe(false);
    expect(result.failedScript).toBe('wiki-cli:generate-manifest');
    expect(result.errorMessage).toContain('manifest target crashed');
  });

  it('returns failure with target name when index target fails', () => {
    runner.failCommand('npx nx run wiki-cli:generate-index', 'index target crashed');

    const result = regenerateManifestAndIndex(runner, '/workspace');

    expect(result.success).toBe(false);
    expect(result.failedScript).toBe('wiki-cli:generate-index');
    expect(result.errorMessage).toContain('index target crashed');
  });

  it('does not run index target if manifest target fails', () => {
    runner.failCommand('npx nx run wiki-cli:generate-manifest', 'manifest failed');

    regenerateManifestAndIndex(runner, '/workspace');

    expect(runner.calls).toHaveLength(1);
  });

  it('passes workspace root as cwd to both scripts', () => {
    regenerateManifestAndIndex(runner, '/my/custom/workspace');

    expect(runner.calls.every((call) => call.cwd === '/my/custom/workspace')).toBe(true);
  });
});

describe('verifyManifestEntries', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('returns true when all wiki pages are in the manifest', async () => {
    const manifest = {
      files: ['entities/rxjs.md', 'concepts/reactive-programming.md', 'sources/rxjs-article-2025-01-15.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    fs.setWikiFile('manifest.json', JSON.stringify(manifest));

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/reactive-programming.md'];

    expect(await verifyManifestEntries(fs, wikiPages)).toBe(true);
  });

  it('returns false when a wiki page is missing from the manifest', async () => {
    const manifest = {
      files: ['entities/rxjs.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    fs.setWikiFile('manifest.json', JSON.stringify(manifest));

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/missing-concept.md'];

    expect(await verifyManifestEntries(fs, wikiPages)).toBe(false);
  });

  it('returns true for empty wikiPages array', async () => {
    expect(await verifyManifestEntries(fs, [])).toBe(true);
  });

  it('returns false when manifest.json does not exist', async () => {
    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(await verifyManifestEntries(fs, wikiPages)).toBe(false);
  });

  it('returns false when manifest.json is malformed', async () => {
    fs.setWikiFile('manifest.json', 'not json');

    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(await verifyManifestEntries(fs, wikiPages)).toBe(false);
  });

  it('strips wiki/ prefix when comparing paths', async () => {
    const manifest = {
      files: ['sources/my-article-article-2025-01-15.md'],
      generatedAt: '2025-01-15T10:00:00.000Z',
    };
    fs.setWikiFile('manifest.json', JSON.stringify(manifest));

    const wikiPages = ['wiki/sources/my-article-article-2025-01-15.md'];
    expect(await verifyManifestEntries(fs, wikiPages)).toBe(true);
  });
});

describe('verifyIndexEntries', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('returns true when all page titles appear in the index', async () => {
    fs.setWikiFile('entities/rxjs.md', '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n');
    fs.setWikiFile(
      'concepts/reactive-programming.md',
      '---\ntitle: "Reactive Programming"\ntype: concept\n---\n\n# Reactive Programming\n'
    );

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
    fs.setWikiFile('index.md', indexContent);

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/reactive-programming.md'];
    expect(await verifyIndexEntries(fs, wikiPages)).toBe(true);
  });

  it('returns false when a page title is missing from the index', async () => {
    fs.setWikiFile('entities/rxjs.md', '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n');
    fs.setWikiFile(
      'concepts/missing-concept.md',
      '---\ntitle: "Missing Concept"\ntype: concept\n---\n\n# Missing Concept\n'
    );

    const indexContent = '# Wiki Index\n\n## Entities\n\n- [[RxJS]]\n';
    fs.setWikiFile('index.md', indexContent);

    const wikiPages = ['wiki/entities/rxjs.md', 'wiki/concepts/missing-concept.md'];
    expect(await verifyIndexEntries(fs, wikiPages)).toBe(false);
  });

  it('returns true for empty wikiPages array', async () => {
    expect(await verifyIndexEntries(fs, [])).toBe(true);
  });

  it('returns false when index.md does not exist', async () => {
    fs.setWikiFile('entities/rxjs.md', '---\ntitle: "RxJS"\ntype: entity\n---\n\n# RxJS\n');

    const wikiPages = ['wiki/entities/rxjs.md'];
    expect(await verifyIndexEntries(fs, wikiPages)).toBe(false);
  });

  it('falls back to filename slug when page has no frontmatter title', async () => {
    fs.setWikiFile('entities/some-lib.md', '# Some Lib\n\nNo frontmatter here.\n');

    const indexContent = '# Wiki Index\n\n- some-lib is referenced here\n';
    fs.setWikiFile('index.md', indexContent);

    const wikiPages = ['wiki/entities/some-lib.md'];
    expect(await verifyIndexEntries(fs, wikiPages)).toBe(true);
  });

  it('returns false when the wiki page file does not exist on disk', async () => {
    const indexContent = '# Wiki Index\n\n- [[Ghost Page]]\n';
    fs.setWikiFile('index.md', indexContent);

    const wikiPages = ['wiki/entities/ghost-page.md'];
    expect(await verifyIndexEntries(fs, wikiPages)).toBe(false);
  });
});

describe('rollbackPages', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('deletes all specified wiki pages', async () => {
    fs.setWikiFile('entities/rxjs.md', '# RxJS');
    fs.setWikiFile('concepts/reactive.md', '# Reactive');
    fs.setWikiFile('sources/article.md', '# Article');

    const pages = ['wiki/entities/rxjs.md', 'wiki/concepts/reactive.md', 'wiki/sources/article.md'];

    await rollbackPages(fs, pages);

    expect(fs.hasWikiFile('entities/rxjs.md')).toBe(false);
    expect(fs.hasWikiFile('concepts/reactive.md')).toBe(false);
    expect(fs.hasWikiFile('sources/article.md')).toBe(false);
  });

  it('does not throw when a page does not exist', async () => {
    const pages = ['wiki/entities/nonexistent.md'];

    await expect(rollbackPages(fs, pages)).resolves.not.toThrow();
  });

  it('handles empty pages array without error', async () => {
    await expect(rollbackPages(fs, [])).resolves.not.toThrow();
  });

  it('only deletes specified pages, leaving others intact', async () => {
    fs.setWikiFile('entities/keep-me.md', '# Keep');
    fs.setWikiFile('entities/delete-me.md', '# Delete');

    await rollbackPages(fs, ['wiki/entities/delete-me.md']);

    expect(fs.hasWikiFile('entities/keep-me.md')).toBe(true);
    expect(fs.hasWikiFile('entities/delete-me.md')).toBe(false);
  });

  it('handles mix of existing and non-existing pages', async () => {
    fs.setWikiFile('entities/exists.md', '# Exists');

    const pages = ['wiki/entities/exists.md', 'wiki/entities/does-not-exist.md'];

    await expect(rollbackPages(fs, pages)).resolves.not.toThrow();
    expect(fs.hasWikiFile('entities/exists.md')).toBe(false);
  });
});
