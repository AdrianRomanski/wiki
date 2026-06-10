import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegenerateIndexUseCase } from './regenerate-index.use-case';
import { ScanWikiPagesUseCase } from './scan-wiki-pages.use-case';
import { GenerateIndexContentUseCase } from './generate-index-content.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';

class MockFileSystemPort implements FileSystemPort {
  writeWikiFile = vi.fn();
  async readRawFile(): Promise<string> { return ''; }
  async readWikiFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async listWikiFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async ensureWikiDir(): Promise<void> { return; }
  async deleteWikiFile(): Promise<void> { return; }
}

describe('RegenerateIndexUseCase', () => {
  let useCase: RegenerateIndexUseCase;
  let mockFileSystemPort: MockFileSystemPort;
  let mockScanPagesUseCase: ScanWikiPagesUseCase;
  let mockGenerateContentUseCase: GenerateIndexContentUseCase;

  beforeEach(() => {
    mockFileSystemPort = new MockFileSystemPort();
    mockScanPagesUseCase = {
      execute: vi.fn(),
    } as any;
    mockGenerateContentUseCase = {
      execute: vi.fn().mockReturnValue('# Wiki Index\n\n## Entities\n'),
    } as any;

    useCase = new RegenerateIndexUseCase(
      mockFileSystemPort,
      mockScanPagesUseCase,
      mockGenerateContentUseCase
    );
  });

  it('should regenerate index from provided entries', async () => {
    const entries: IndexEntry[] = [
      {
        title: 'Angular CDK',
        path: 'entities/angular-cdk.md',
        description: 'Angular Component Dev Kit',
        type: 'entity',
      },
      {
        title: 'Progressive Enhancement',
        path: 'concepts/progressive-enhancement.md',
        description: 'Building accessible experiences',
        type: 'concept',
      },
      {
        title: 'Example Source',
        path: 'sources/example-source-2024-05-10.md',
        description: 'Example source summary',
        type: 'source',
        date: '2024-05-10',
      },
    ];

    await useCase.execute(entries);

    expect(mockGenerateContentUseCase.execute).toHaveBeenCalledWith(
      [
        {
          title: 'Angular CDK',
          path: 'entities/angular-cdk.md',
          description: 'Angular Component Dev Kit',
          type: 'entity',
        },
      ],
      [
        {
          title: 'Progressive Enhancement',
          path: 'concepts/progressive-enhancement.md',
          description: 'Building accessible experiences',
          type: 'concept',
        },
      ],
      [
        {
          title: 'Example Source',
          path: 'sources/example-source-2024-05-10.md',
          description: 'Example source summary',
          type: 'source',
          date: '2024-05-10',
        },
      ],
      expect.any(Object)
    );

    expect(mockFileSystemPort.writeWikiFile).toHaveBeenCalledWith(
      'index.md',
      '# Wiki Index\n\n## Entities\n'
    );
  });

  it('should scan wiki pages when no entries provided', async () => {
    const scannedEntries: IndexEntry[] = [
      {
        title: 'Scanned Entity',
        path: 'entities/scanned.md',
        description: 'Description',
        type: 'entity',
      },
    ];

    (mockScanPagesUseCase.execute as any).mockResolvedValue(scannedEntries);

    await useCase.execute();

    expect(mockScanPagesUseCase.execute).toHaveBeenCalled();
    expect(mockGenerateContentUseCase.execute).toHaveBeenCalled();
  });

  it('should sort entities alphabetically', async () => {
    const entries: IndexEntry[] = [
      {
        title: 'Zebra Entity',
        path: 'entities/zebra-entity.md',
        description: 'Last alphabetically',
        type: 'entity',
      },
      {
        title: 'Alpha Entity',
        path: 'entities/alpha-entity.md',
        description: 'First alphabetically',
        type: 'entity',
      },
    ];

    await useCase.execute(entries);

    const entitiesArg = (mockGenerateContentUseCase.execute as any).mock
      .calls[0][0];
    expect(entitiesArg[0].title).toBe('Alpha Entity');
    expect(entitiesArg[1].title).toBe('Zebra Entity');
  });

  it('should sort sources by date descending', async () => {
    const entries: IndexEntry[] = [
      {
        title: 'Old Source',
        path: 'sources/old-source.md',
        description: 'Older source',
        type: 'source',
        date: '2024-01-01',
      },
      {
        title: 'New Source',
        path: 'sources/new-source.md',
        description: 'Newer source',
        type: 'source',
        date: '2024-12-31',
      },
    ];

    await useCase.execute(entries);

    const sourcesArg = (mockGenerateContentUseCase.execute as any).mock
      .calls[0][2];
    expect(sourcesArg[0].title).toBe('New Source');
    expect(sourcesArg[1].title).toBe('Old Source');
  });

  it('should limit recent sources to configured maximum', async () => {
    const entries: IndexEntry[] = Array.from({ length: 15 }, (_, i) => ({
      title: `Source ${i}`,
      path: `sources/source-${i}.md`,
      description: `Source ${i} description`,
      type: 'source' as const,
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    }));

    await useCase.execute(entries, { maxRecentSources: 5 });

    const sourcesArg = (mockGenerateContentUseCase.execute as any).mock
      .calls[0][2];
    expect(sourcesArg.length).toBe(5);
  });
});
