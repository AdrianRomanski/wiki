import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetectContradictionsUseCase } from './detect-contradictions-use-case';
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

describe('DetectContradictionsUseCase', () => {
  let useCase: DetectContradictionsUseCase;
  let mockFileSystemPort: MockFileSystemPort;
  let mockMarkdownPort: MockMarkdownPort;
  let mockFrontmatterPort: MockFrontmatterPort;

  beforeEach(() => {
    mockFileSystemPort = new MockFileSystemPort();
    mockMarkdownPort = new MockMarkdownPort();
    mockFrontmatterPort = new MockFrontmatterPort();

    useCase = new DetectContradictionsUseCase(
      mockFileSystemPort,
      mockMarkdownPort,
      mockFrontmatterPort
    );
  });

  it('should detect pages with contradiction markers', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async (pattern: string) => {
        if (pattern.includes('entities')) {
          return ['entities/page1.md', 'entities/page2.md'];
        }
        return [];
      }
    );

    (mockFileSystemPort.readWikiFile as any)
      .mockResolvedValueOnce(
        'The CDK provides accessibility features. However, this is wrong.'
      )
      .mockResolvedValueOnce('Some content')
      .mockResolvedValueOnce(
        'The CDK provides accessibility features. However, this is wrong.'
      )
      .mockResolvedValueOnce('Some content');

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
        content:
          'The CDK provides accessibility features. However, this is wrong.',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page Two',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Some content',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content:
          'The CDK provides accessibility features. However, this is wrong.',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page Two',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Some content',
      } as ParsedFrontmatter);

    const results = await useCase.execute();

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].pages).toContain('entities/page1.md');
  });

  it('should not flag pages without contradiction markers', async () => {
    (mockFileSystemPort.listWikiFiles as any).mockImplementation(
      async () => ['entities/page1.md']
    );

    (mockFileSystemPort.readWikiFile as any)
      .mockResolvedValueOnce(
        'The CDK provides accessibility features. See page two for more.'
      )
      .mockResolvedValueOnce(
        'The CDK provides accessibility features. See page two for more.'
      );

    (mockMarkdownPort.extractWikiLinks as any).mockReturnValue([]);

    (mockFrontmatterPort.parseFrontmatter as any)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content:
          'The CDK provides accessibility features. See page two for more.',
      } as ParsedFrontmatter)
      .mockReturnValueOnce({
        frontmatter: {
          title: 'Page One',
          type: 'entity',
          tags: [],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content:
          'The CDK provides accessibility features. See page two for more.',
      } as ParsedFrontmatter);

    const results = await useCase.execute();

    expect(results.length).toBe(0);
  });
});
