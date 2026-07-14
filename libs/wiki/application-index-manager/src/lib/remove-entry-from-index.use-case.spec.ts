import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoveEntryFromIndexUseCase } from './remove-entry-from-index.use-case';
import { ParseIndexEntriesUseCase } from './parse-index-entries.use-case';
import { RegenerateIndexUseCase } from './regenerate-index.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';

class MockFileSystemPort implements FileSystemPort {
  readWikiFile = vi.fn();
  async readRawFile(): Promise<string> { return ''; }
  async writeWikiFile(): Promise<void> { return; }
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

describe('RemoveEntryFromIndexUseCase', () => {
  let useCase: RemoveEntryFromIndexUseCase;
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

    useCase = new RemoveEntryFromIndexUseCase(
      mockFileSystemPort,
      mockParseEntriesUseCase,
      mockRegenerateIndexUseCase
    );
  });

  it('should remove entry from index', async () => {
    const entries: IndexEntry[] = [
      {
        title: 'Angular CDK',
        path: 'entities/angular-cdk.md',
        description: 'Angular Component Dev Kit',
        type: 'entity',
      },
      {
        title: 'Old Entity',
        path: 'entities/old-entity.md',
        description: 'This should be removed',
        type: 'entity',
      },
    ];

    mockFileSystemPort.readWikiFile.mockResolvedValue('# Wiki Index\n\n## Entities\n');
    (mockParseEntriesUseCase.execute as any).mockReturnValue(entries);

    await useCase.execute('entities/old-entity.md');

    expect(mockRegenerateIndexUseCase.execute).toHaveBeenCalledWith([
      {
        title: 'Angular CDK',
        path: 'entities/angular-cdk.md',
        description: 'Angular Component Dev Kit',
        type: 'entity',
      },
    ]);
  });

  it('should handle removing non-existent entry', async () => {
    const entries: IndexEntry[] = [
      {
        title: 'Angular CDK',
        path: 'entities/angular-cdk.md',
        description: 'Angular Component Dev Kit',
        type: 'entity',
      },
    ];

    mockFileSystemPort.readWikiFile.mockResolvedValue('# Wiki Index\n\n## Entities\n');
    (mockParseEntriesUseCase.execute as any).mockReturnValue(entries);

    await useCase.execute('entities/nonexistent.md');

    expect(mockRegenerateIndexUseCase.execute).toHaveBeenCalledWith(entries);
  });
});
