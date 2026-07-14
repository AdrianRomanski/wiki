import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GenerateManifestUseCase } from './generate-manifest.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';

class MockFileSystemPort implements FileSystemPort {
  writeWikiFile = vi.fn();
  listWikiFiles = vi.fn(async (_pattern: string): Promise<string[]> => []);
  async readRawFile(): Promise<string> { return ''; }
  async readWikiFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  ensureWikiDir = vi.fn(async (): Promise<void> => { return; });
  async deleteWikiFile(): Promise<void> { return; }
  async ensureDir(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

describe('GenerateManifestUseCase', () => {
  let fs: MockFileSystemPort;
  let useCase: GenerateManifestUseCase;

  beforeEach(() => {
    fs = new MockFileSystemPort();
    useCase = new GenerateManifestUseCase(fs);
  });

  it('scans entities, concepts, sources in that fixed order and writes manifest.json', async () => {
    fs.listWikiFiles.mockImplementation(async (pattern: string) => {
      if (pattern === 'entities/*.md') return ['entities/a.md', 'entities/b.md'];
      if (pattern === 'concepts/*.md') return ['concepts/c.md'];
      if (pattern === 'sources/*.md') return ['sources/d.md'];
      return [];
    });

    const { manifest, missingDirs } = await useCase.execute();

    expect(manifest.files).toEqual([
      'entities/a.md',
      'entities/b.md',
      'concepts/c.md',
      'sources/d.md',
    ]);
    expect(missingDirs).toEqual([]);
    expect(() => new Date(manifest.generatedAt).toISOString()).not.toThrow();
    expect(new Date(manifest.generatedAt).toISOString()).toBe(manifest.generatedAt);

    expect(fs.listWikiFiles).toHaveBeenNthCalledWith(1, 'entities/*.md');
    expect(fs.listWikiFiles).toHaveBeenNthCalledWith(2, 'concepts/*.md');
    expect(fs.listWikiFiles).toHaveBeenNthCalledWith(3, 'sources/*.md');

    expect(fs.writeWikiFile).toHaveBeenCalledWith(
      'manifest.json',
      JSON.stringify(manifest, null, 2) + '\n'
    );
  });

  it('treats a missing subdirectory as zero files without creating it', async () => {
    fs.listWikiFiles.mockImplementation(async (pattern: string) => {
      if (pattern === 'entities/*.md') return ['entities/a.md'];
      return [];
    });

    const { manifest, missingDirs } = await useCase.execute();

    expect(manifest.files).toEqual(['entities/a.md']);
    expect(missingDirs).toEqual(['concepts', 'sources']);
    expect(fs.ensureWikiDir).not.toHaveBeenCalled();
  });

  it('returns no missing dirs when all subdirectories have files', async () => {
    fs.listWikiFiles.mockResolvedValue(['entities/a.md']);

    const { missingDirs } = await useCase.execute();

    expect(missingDirs).toEqual([]);
  });
});

// ============================================================================
// Property-Based Test
// Feature: scripts-migration-hexagonal, Property 1: Manifest correctness
// ============================================================================

/**
 * In-memory FakeFileSystemPort test double for the property test. Files are
 * keyed by their wiki-relative path (e.g. "entities/foo.md"). Only the
 * members exercised by GenerateManifestUseCase (listWikiFiles/writeWikiFile)
 * do real work; ensureWikiDir/ensureDir calls are recorded so the test can
 * assert no directory creation ever happens.
 */
class FakeFileSystemPort implements FileSystemPort {
  private readonly files = new Map<string, string>();
  readonly ensureWikiDirCalls: string[] = [];
  readonly ensureDirCalls: string[] = [];
  writtenFiles = new Map<string, string>();

  setFile(path: string, content = ''): void {
    this.files.set(path, content);
  }

  async listWikiFiles(pattern: string): Promise<string[]> {
    const subdir = pattern.split('/')[0];
    return [...this.files.keys()].filter((path) => path.startsWith(`${subdir}/`));
  }

  async writeWikiFile(filePath: string, content: string): Promise<void> {
    this.writtenFiles.set(filePath, content);
  }

  async ensureWikiDir(dirPath: string): Promise<void> {
    this.ensureWikiDirCalls.push(dirPath);
  }

  async ensureDir(dirPath: string): Promise<void> {
    this.ensureDirCalls.push(dirPath);
  }

  async readRawFile(): Promise<string> {
    return '';
  }
  async readWikiFile(): Promise<string> {
    return '';
  }
  async listRawFiles(): Promise<string[]> {
    return [];
  }
  async rawFileExists(): Promise<boolean> {
    return false;
  }
  async wikiFileExists(): Promise<boolean> {
    return false;
  }
  async getRawFileStats(): Promise<FileStats> {
    return { modified: new Date(), size: 0, created: new Date() };
  }
  async getWikiFileStats(): Promise<FileStats> {
    return { modified: new Date(), size: 0, created: new Date() };
  }
  async deleteWikiFile(): Promise<void> {
    return;
  }
  async readFile(): Promise<string> {
    return '';
  }
  async writeFile(): Promise<void> {
    return;
  }
  async deleteDir(): Promise<void> {
    return;
  }
}

/** Generates unique, lowercase, filename-safe basenames for .md files. */
const mdFilenameArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,19}$/)
  .map((name) => `${name}.md`);

/** Generates a set (0-5) of unique .md filenames for one subdirectory. */
const mdFilenameSetArbitrary = fc.uniqueArray(mdFilenameArbitrary, {
  minLength: 0,
  maxLength: 5,
});

describe('Feature: scripts-migration-hexagonal, Property 1: Manifest correctness', () => {
  /**
   * Property 1: Manifest correctness
   *
   * For any set of .md files across entities/, concepts/, sources/
   * (including absent subdirs), WikiManifest.files SHALL equal exactly
   * those files as forward-slash paths relative to wiki/, grouped
   * entities -> concepts -> sources, an absent subdir contributing zero
   * files without creation, and generatedAt SHALL be a parseable
   * ISO-8601 timestamp.
   *
   * **Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.5**
   */
  it('produces files grouped entities->concepts->sources with no creation for absent subdirs, and a parseable ISO-8601 generatedAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        mdFilenameSetArbitrary,
        mdFilenameSetArbitrary,
        mdFilenameSetArbitrary,
        async (entityFiles, conceptFiles, sourceFiles) => {
          const fs = new FakeFileSystemPort();
          entityFiles.forEach((f) => fs.setFile(`entities/${f}`));
          conceptFiles.forEach((f) => fs.setFile(`concepts/${f}`));
          sourceFiles.forEach((f) => fs.setFile(`sources/${f}`));

          const useCase = new GenerateManifestUseCase(fs);
          const { manifest, missingDirs } = await useCase.execute();

          // files equals exactly the concatenation, in entities -> concepts
          // -> sources order, as forward-slash relative paths.
          const expectedFiles = [
            ...entityFiles.map((f) => `entities/${f}`),
            ...conceptFiles.map((f) => `concepts/${f}`),
            ...sourceFiles.map((f) => `sources/${f}`),
          ];
          expect(manifest.files).toEqual(expectedFiles);

          // An absent subdir (zero files) is reported as missing.
          const expectedMissingDirs: string[] = [];
          if (entityFiles.length === 0) expectedMissingDirs.push('entities');
          if (conceptFiles.length === 0) expectedMissingDirs.push('concepts');
          if (sourceFiles.length === 0) expectedMissingDirs.push('sources');
          expect(missingDirs).toEqual(expectedMissingDirs);

          // An absent subdir contributes zero files without any directory
          // creation ever happening.
          expect(fs.ensureWikiDirCalls).toEqual([]);
          expect(fs.ensureDirCalls).toEqual([]);

          // generatedAt is a parseable, round-trippable ISO-8601 timestamp.
          expect(new Date(manifest.generatedAt).toISOString()).toBe(manifest.generatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
