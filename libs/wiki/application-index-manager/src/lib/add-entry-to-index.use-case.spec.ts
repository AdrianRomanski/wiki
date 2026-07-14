import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';
import { ParseIndexEntriesUseCase } from './parse-index-entries.use-case';
import { RegenerateIndexUseCase } from './regenerate-index.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';

class MockFileSystemPort implements FileSystemPort {
  readWikiFile = vi.fn();
  writeWikiFile = vi.fn();
  async readRawFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async listWikiFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async ensureWikiDir(): Promise<void> { return; }
  async deleteWikiFile(): Promise<void> { return; }
  async ensureDir(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

describe('AddEntryToIndexUseCase', () => {
  let useCase: AddEntryToIndexUseCase;
  let mockFileSystemPort: MockFileSystemPort;
  let mockParseEntriesUseCase: ParseIndexEntriesUseCase;
  let mockRegenerateIndexUseCase: RegenerateIndexUseCase;

  beforeEach(() => {
    mockFileSystemPort = new MockFileSystemPort();
    mockParseEntriesUseCase = {
      execute: vi.fn(),
    } as any;
    mockRegenerateIndexUseCase = {
      execute: vi.fn(),
    } as any;

    useCase = new AddEntryToIndexUseCase(
      mockFileSystemPort,
      mockParseEntriesUseCase,
      mockRegenerateIndexUseCase
    );
  });

  it('should add new entry to index', async () => {
    const entry: IndexEntry = {
      title: 'Angular CDK',
      path: 'entities/angular-cdk.md',
      description: 'Angular Component Dev Kit',
      type: 'entity',
    };

    mockFileSystemPort.readWikiFile.mockResolvedValue('# Wiki Index\n\n## Entities\n');
    (mockParseEntriesUseCase.execute as any).mockReturnValue([]);

    await useCase.execute(entry);

    expect(mockRegenerateIndexUseCase.execute).toHaveBeenCalledWith([entry]);
  });

  it('should update existing entry in index', async () => {
    const existingEntry: IndexEntry = {
      title: 'Angular CDK',
      path: 'entities/angular-cdk.md',
      description: 'Old description',
      type: 'entity',
    };

    const updatedEntry: IndexEntry = {
      title: 'Angular CDK',
      path: 'entities/angular-cdk.md',
      description: 'Updated description',
      type: 'entity',
    };

    mockFileSystemPort.readWikiFile.mockResolvedValue('# Wiki Index\n\n## Entities\n- [[Angular CDK]] - Old description\n');
    (mockParseEntriesUseCase.execute as any).mockReturnValue([existingEntry]);

    await useCase.execute(updatedEntry);

    expect(mockRegenerateIndexUseCase.execute).toHaveBeenCalledWith([
      updatedEntry,
    ]);
  });
});
