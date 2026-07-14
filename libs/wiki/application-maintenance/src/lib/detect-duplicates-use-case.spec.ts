import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetectDuplicatesUseCase } from './detect-duplicates-use-case';
import {
  FileSystemPort,
  FrontmatterPort,
  ParsedFrontmatter,
  FileStats,
} from '@wiki/application-ports';
import { WikiPageFrontmatter } from '@wiki/domain-models';

class MockFileSystemPort implements FileSystemPort {
  listWikiFiles = vi.fn();
  readWikiFile = vi.fn();
  async readRawFile(): Promise<string> {
    return '';
  }
  async writeWikiFile(): Promise<void> { return; }
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
  async ensureWikiDir(): Promise<void> { return; }
  async deleteWikiFile(): Promise<void> { return; }
  async ensureDir(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

class MockFrontmatterPort implements FrontmatterPort {
  parseFrontmatter = vi.fn();
  generateFrontmatter() {
    return '';
  }
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    return {
      title: partial.title || '',
      type: partial.type || 'entity',
      tags: partial.tags || [],
      sources: partial.sources,
      created: partial.created || '2024-01-01',
      updated: partial.created || '2024-01-01',
    };
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    return frontmatter;
  }
}

describe('DetectDuplicatesUseCase', () => {
  let useCase: DetectDuplicatesUseCase;
  let mockFileSystemPort: MockFileSystemPort;
  let mockFrontmatterPort: MockFrontmatterPort;

  beforeEach(() => {
    mockFileSystemPort = new MockFileSystemPort();
    mockFrontmatterPort = new MockFrontmatterPort();

    useCase = new DetectDuplicatesUseCase(
      mockFileSystemPort,
      mockFrontmatterPort
    );
  });

  it('should detect pages with high similarity', async () => {
    const sharedContent =
      'This is a long piece of content about Angular CDK. It provides accessibility utilities.';

    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async () => ['entities/page1.md', 'entities/page2.md']
    );

    (mockFileSystemPort.readWikiFile as any)
      .mockResolvedValueOnce(sharedContent)
      .mockResolvedValueOnce(sharedContent + ' Additional content.');

    (mockFrontmatterPort.parseFrontmatter as any)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: sharedContent,
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page Two',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: sharedContent + ' Additional content.',
      } as ParsedFrontmatter);

    const results = await useCase.execute(0.6);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].similarity).toBeGreaterThan(0.6);
  });

  it('should not flag pages with low similarity', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async () => ['entities/page1.md', 'entities/page2.md']
    );

    (mockFileSystemPort.readWikiFile as any)
      .mockResolvedValueOnce('Content about Angular CDK')
      .mockResolvedValueOnce('Completely different content about React');

    (mockFrontmatterPort.parseFrontmatter as any)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Content about Angular CDK',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page Two',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Completely different content about React',
      } as ParsedFrontmatter);

    const results = await useCase.execute(0.7);

    expect(results.length).toBe(0);
  });
});
