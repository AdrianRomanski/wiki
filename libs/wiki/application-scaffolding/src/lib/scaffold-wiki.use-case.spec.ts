import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScaffoldWikiUseCase, SCAFFOLD_DIRECTORIES } from './scaffold-wiki.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';

class FakeFileSystemPort implements FileSystemPort {
  ensureDir = vi.fn(async (): Promise<void> => { return; });
  writeWikiFile = vi.fn();
  listWikiFiles = vi.fn(async (): Promise<string[]> => []);
  async readRawFile(): Promise<string> { return ''; }
  async readWikiFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  ensureWikiDir = vi.fn(async (): Promise<void> => { return; });
  async deleteWikiFile(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

describe('ScaffoldWikiUseCase', () => {
  let fs: FakeFileSystemPort;
  let useCase: ScaffoldWikiUseCase;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
    useCase = new ScaffoldWikiUseCase(fs);
  });

  it('calls ensureDir once for each scaffold directory, in the fixed order', async () => {
    await useCase.execute();

    expect(fs.ensureDir).toHaveBeenCalledTimes(SCAFFOLD_DIRECTORIES.length);
    SCAFFOLD_DIRECTORIES.forEach((dir, index) => {
      expect(fs.ensureDir).toHaveBeenNthCalledWith(index + 1, dir);
    });
  });

  it('reports every scaffold directory under created, with existing always empty', async () => {
    const result = await useCase.execute();

    expect(result.created).toEqual([...SCAFFOLD_DIRECTORIES]);
    expect(result.existing).toEqual([]);
  });

  it('is idempotent: calling execute twice behaves the same both times without throwing', async () => {
    const first = await useCase.execute();
    const second = await useCase.execute();

    expect(first).toEqual(second);
    expect(fs.ensureDir).toHaveBeenCalledTimes(SCAFFOLD_DIRECTORIES.length * 2);
    // Second pass calls ensureDir with the exact same directories in the
    // same order as the first pass (ensureDir itself is idempotent on disk;
    // the use case does not skip or alter directories on repeated calls).
    SCAFFOLD_DIRECTORIES.forEach((dir, index) => {
      expect(fs.ensureDir).toHaveBeenNthCalledWith(
        SCAFFOLD_DIRECTORIES.length + index + 1,
        dir
      );
    });
  });
});
