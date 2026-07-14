/**
 * Unit tests for article-analysis.md generation
 * Feature: article-research-session
 * Requirements: 4.3, 4.4, 4.5, 4.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';
import type {
  ArticleContent,
  ArticleMetadata,
} from '@wiki/domain-research-session';
import {
  generateAnalysis,
  buildAnalysisMarkdown,
  generateSummary,
  generateEntityDescription,
  generateConceptDescription,
  AnalysisGenerationError,
} from './generate-analysis';

/**
 * In-memory FakeFileSystemPort test double. Files are keyed by their
 * workspace-relative path. Only readFile/writeFile are exercised by
 * generateAnalysis; the rest are unused stubs.
 */
class FakeFileSystemPort implements FileSystemPort {
  private readonly files = new Map<string, string>();
  /** Set of paths for which writeFile should throw, to simulate I/O failure. */
  readonly failingWritePaths = new Set<string>();

  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (this.failingWritePaths.has(filePath)) {
      throw new Error(`Simulated write failure for ${filePath}`);
    }
    this.files.set(filePath, content);
  }

  async readRawFile(): Promise<string> {
    return '';
  }
  async readWikiFile(): Promise<string> {
    return '';
  }
  async writeWikiFile(): Promise<void> {
    return;
  }
  async listRawFiles(): Promise<string[]> {
    return [];
  }
  async listWikiFiles(): Promise<string[]> {
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
  async ensureWikiDir(): Promise<void> {
    return;
  }
  async deleteWikiFile(): Promise<void> {
    return;
  }
  async ensureDir(): Promise<void> {
    return;
  }
  async deleteDir(): Promise<void> {
    return;
  }
}

describe('generateAnalysis', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = 'sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  function createContent(overrides: Partial<ArticleContent> = {}): ArticleContent {
    return {
      title: 'Understanding Signals',
      author: 'Jane Smith',
      date: '2024-06-01',
      body: 'Angular Signals provide a reactive primitive for managing state.\n\nThey enable fine-grained reactivity.',
      codeBlocks: [
        { language: 'typescript', content: 'const count = signal(0);' },
      ],
      links: ['https://angular.dev'],
      candidateEntities: ['Angular', 'RxJS'],
      candidateConcepts: ['reactive programming', 'fine-grained reactivity'],
      ...overrides,
    };
  }

  function createMetadata(overrides: Partial<ArticleMetadata> = {}): ArticleMetadata {
    return {
      title: 'Understanding Signals',
      author: 'Jane Smith',
      date: '2024-06-01',
      sourceUrl: 'https://blog.example.com/signals',
      inputType: 'url',
      ...overrides,
    };
  }

  it('should write article-analysis.md to the session directory', async () => {
    const content = createContent();
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('# Article Analysis: Understanding Signals');
  });

  it('should include all metadata fields', async () => {
    const content = createContent();
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('- **Title:** Understanding Signals');
    expect(fileContent).toContain('- **Author:** Jane Smith');
    expect(fileContent).toContain('- **Date:** 2024-06-01');
    expect(fileContent).toContain('- **Source URL:** https://blog.example.com/signals');
  });

  it('should show "Unknown" for missing author', async () => {
    const content = createContent({ author: undefined });
    const metadata = createMetadata({ author: undefined });

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('- **Author:** Unknown');
  });

  it('should show "Unknown" for missing date', async () => {
    const content = createContent({ date: undefined });
    const metadata = createMetadata({ date: undefined });

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('- **Date:** Unknown');
  });

  it('should show "Pasted text" when no source URL', async () => {
    const content = createContent();
    const metadata = createMetadata({ sourceUrl: undefined, inputType: 'pasted-text' });

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('- **Source URL:** Pasted text');
  });

  it('should include a summary section from body text', async () => {
    const content = createContent();
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('## Summary');
    expect(fileContent).toContain('Angular Signals provide a reactive primitive');
  });

  it('should include all identified entities with descriptions', async () => {
    const content = createContent({ candidateEntities: ['Angular', 'RxJS', 'Vite'] });
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('## Identified Entities');
    expect(fileContent).toContain('- **Angular**');
    expect(fileContent).toContain('- **RxJS**');
    expect(fileContent).toContain('- **Vite**');
  });

  it('should include all identified concepts with descriptions', async () => {
    const content = createContent({
      candidateConcepts: ['reactive programming', 'dependency injection'],
    });
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('## Identified Concepts');
    expect(fileContent).toContain('- **reactive programming**');
    expect(fileContent).toContain('- **dependency injection**');
  });

  it('should include all code blocks with language annotations', async () => {
    const content = createContent({
      codeBlocks: [
        { language: 'typescript', content: 'const x = signal(0);' },
        { language: 'html', content: '<div>{{ count() }}</div>' },
      ],
    });
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('## Code Blocks');
    expect(fileContent).toContain('```typescript\nconst x = signal(0);\n```');
    expect(fileContent).toContain('```html\n<div>{{ count() }}</div>\n```');
  });

  it('should handle code blocks without language annotation', async () => {
    const content = createContent({
      codeBlocks: [{ content: 'plain code here' }],
    });
    const metadata = createMetadata();

    await generateAnalysis(fs, sessionDir, content, metadata);

    const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
    expect(fileContent).toContain('```\nplain code here\n```');
  });

  describe('Requirement 4.8: no entities or concepts', () => {
    it('should note explicitly when no entities are found', async () => {
      const content = createContent({ candidateEntities: [] });
      const metadata = createMetadata();

      await generateAnalysis(fs, sessionDir, content, metadata);

      const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
      expect(fileContent).toContain('No entities were identified in this article.');
    });

    it('should note explicitly when no concepts are found', async () => {
      const content = createContent({ candidateConcepts: [] });
      const metadata = createMetadata();

      await generateAnalysis(fs, sessionDir, content, metadata);

      const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
      expect(fileContent).toContain('No concepts were identified in this article.');
    });

    it('should note when neither entities nor concepts are found', async () => {
      const content = createContent({ candidateEntities: [], candidateConcepts: [] });
      const metadata = createMetadata();

      await generateAnalysis(fs, sessionDir, content, metadata);

      const fileContent = await fs.readFile(`${sessionDir}/article-analysis.md`);
      expect(fileContent).toContain(
        'No entities or concepts were identified in this article. The session may still proceed to SYNTHESIZE.'
      );
    });

    it('should still allow proceeding (no error thrown) when no entities/concepts', async () => {
      const content = createContent({ candidateEntities: [], candidateConcepts: [] });
      const metadata = createMetadata();

      // Should not throw
      await expect(
        generateAnalysis(fs, sessionDir, content, metadata)
      ).resolves.toBeUndefined();
    });
  });

  describe('Requirement 4.5: error handling', () => {
    it('should throw AnalysisGenerationError when the write fails', async () => {
      const content = createContent();
      const metadata = createMetadata();
      fs.failingWritePaths.add(`${sessionDir}/article-analysis.md`);

      await expect(
        generateAnalysis(fs, sessionDir, content, metadata)
      ).rejects.toThrow(AnalysisGenerationError);
    });
  });
});

describe('buildAnalysisMarkdown', () => {
  it('should produce markdown with all required sections', () => {
    const content: ArticleContent = {
      title: 'Test Article',
      body: 'Some body text.',
      codeBlocks: [],
      links: [],
      candidateEntities: ['Angular'],
      candidateConcepts: ['reactivity'],
    };
    const metadata: ArticleMetadata = {
      title: 'Test Article',
      inputType: 'url',
      sourceUrl: 'https://example.com',
    };

    const result = buildAnalysisMarkdown(content, metadata);

    expect(result).toContain('# Article Analysis: Test Article');
    expect(result).toContain('## Metadata');
    expect(result).toContain('## Summary');
    expect(result).toContain('## Identified Entities');
    expect(result).toContain('## Identified Concepts');
    expect(result).toContain('## Code Blocks');
    expect(result).toContain('## Notes');
  });

  it('should end with a newline', () => {
    const content: ArticleContent = {
      title: 'Test',
      body: 'Body.',
      codeBlocks: [],
      links: [],
      candidateEntities: [],
      candidateConcepts: [],
    };
    const metadata: ArticleMetadata = {
      title: 'Test',
      inputType: 'pasted-text',
    };

    const result = buildAnalysisMarkdown(content, metadata);
    expect(result.endsWith('\n')).toBe(true);
  });
});

describe('generateSummary', () => {
  it('should return first 3 paragraphs of body text', () => {
    const body = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.\n\nParagraph four.';
    const result = generateSummary(body);
    expect(result).toContain('Paragraph one.');
    expect(result).toContain('Paragraph two.');
    expect(result).toContain('Paragraph three.');
    expect(result).not.toContain('Paragraph four.');
  });

  it('should skip headings', () => {
    const body = '# Heading\n\nFirst paragraph.\n\n## Subheading\n\nSecond paragraph.';
    const result = generateSummary(body);
    expect(result).not.toContain('# Heading');
    expect(result).not.toContain('## Subheading');
    expect(result).toContain('First paragraph.');
    expect(result).toContain('Second paragraph.');
  });

  it('should skip code blocks', () => {
    const body = 'Intro text.\n\n```typescript\ncode here\n```\n\nAfter code.';
    const result = generateSummary(body);
    expect(result).toContain('Intro text.');
    expect(result).not.toContain('```typescript');
  });

  it('should return "No summary available." for empty body', () => {
    expect(generateSummary('')).toBe('No summary available.');
    expect(generateSummary('   ')).toBe('No summary available.');
  });

  it('should handle body with only headings', () => {
    const body = '# Title\n\n## Section\n\n### Subsection';
    const result = generateSummary(body);
    expect(result).toBe('No summary available.');
  });
});

describe('generateEntityDescription', () => {
  it('should generate a description referencing the entity name', () => {
    const desc = generateEntityDescription('Angular');
    expect(desc).toContain('Angular');
    expect(desc.length).toBeGreaterThan(10);
  });
});

describe('generateConceptDescription', () => {
  it('should generate a description referencing the concept name', () => {
    const desc = generateConceptDescription('reactive programming');
    expect(desc).toContain('reactive programming');
    expect(desc.length).toBeGreaterThan(10);
  });
});
