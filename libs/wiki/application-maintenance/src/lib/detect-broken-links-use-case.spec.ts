import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetectBrokenLinksUseCase } from './detect-broken-links-use-case';
import {
  FileSystemPort,
  MarkdownPort,
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

class MockMarkdownPort implements MarkdownPort {
  extractWikiLinks = vi.fn();
  parseMarkdownSections() {
    return [];
  }
  generateWikiLink() {
    return '';
  }
  generateHeading() {
    return '';
  }
  generateList() {
    return '';
  }
  generateCodeBlock() {
    return '';
  }
  generateBlockquote() {
    return '';
  }
  generateTable() {
    return '';
  }
  validateMarkdownSyntax() {
    return { valid: true };
  }
  sectionsToMarkdown() {
    return '';
  }
  escapeMarkdown(text: string) {
    return text;
  }
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

describe('DetectBrokenLinksUseCase', () => {
  let useCase: DetectBrokenLinksUseCase;
  let mockFileSystemPort: MockFileSystemPort;
  let mockMarkdownPort: MockMarkdownPort;
  let mockFrontmatterPort: MockFrontmatterPort;

  beforeEach(() => {
    mockFileSystemPort = new MockFileSystemPort();
    mockMarkdownPort = new MockMarkdownPort();
    mockFrontmatterPort = new MockFrontmatterPort();

    useCase = new DetectBrokenLinksUseCase(
      mockFileSystemPort,
      mockMarkdownPort,
      mockFrontmatterPort
    );
  });

  it('should detect broken links', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async (pattern: string) => {
        if (pattern.includes('entities')) {
          return ['entities/page1.md'];
        }
        return [];
      }
    );

    (mockFileSystemPort.readWikiFile as any).mockResolvedValue(
      'content with [[NonExistent]] link'
    );

    (mockMarkdownPort.extractWikiLinks as any).mockReturnValue([
      'NonExistent',
    ]);

    (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
      frontmatter: {
        title: 'Page One',
        type: 'entity',
        tags: [],
        created: '2024-01-01',
        updated: '2024-01-01',
      },
      content: 'content',
    } as ParsedFrontmatter);

    const results = await useCase.execute();

    expect(results).toHaveLength(1);
    expect(results[0].page).toBe('entities/page1.md');
    expect(results[0].brokenLinks).toEqual(['NonExistent']);
  });

  it('should validate links correctly', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async (pattern: string) => {
        if (pattern.includes('entities')) {
          return ['entities/page1.md', 'entities/page2.md'];
        }
        return [];
      }
    );

    (mockFileSystemPort.readWikiFile as any)
      .mockResolvedValueOnce('content with [[Page Two]] link')
      .mockResolvedValueOnce('content');

    (mockMarkdownPort.extractWikiLinks as any)
      .mockReturnValueOnce(['Page Two'])
      .mockReturnValueOnce([]);

    (mockFrontmatterPort.parseFrontmatter as any)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'content',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page Two',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'content',
      } as ParsedFrontmatter);

    const results = await useCase.execute();

    expect(results).toHaveLength(0);
  });

  it('should handle pages with no links', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async (pattern: string) => {
        if (pattern.includes('entities')) {
          return ['entities/standalone.md'];
        }
        return [];
      }
    );

    (mockFileSystemPort.readWikiFile as any).mockResolvedValue('content');
    (mockMarkdownPort.extractWikiLinks as any).mockReturnValue([]);
    (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
      frontmatter: {
        title: 'Standalone',
        type: 'entity',
        tags: [],
        created: '2024-01-01',
        updated: '2024-01-01',
      },
      content: 'content',
    } as ParsedFrontmatter);

    const results = await useCase.execute();

    expect(results).toHaveLength(0);
  });
});
