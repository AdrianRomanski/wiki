/**
 * Unit tests for raw source ingestion handler.
 * 
 * Tests cover:
 * - Reading raw source files and extracting metadata
 * - Determining file formats from extensions
 * - Extracting categories from file paths
 * - Preserving original files without modification
 * - Generating wiki pages from raw sources
 * - Error handling for invalid sources
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ingestRawSource,
  listRawSources,
  ingestMultipleRawSources,
  generateWikiPagesFromSource,
  IngestionError,
} from './ingestion';
import { FileSystemConfig } from './filesystem';

describe('ingestRawSource', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-ingest-test-'));
    
    // Create raw/ and wiki/ directories
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'sources'), { recursive: true });
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should ingest a markdown file', async () => {
    const content = '# Test Article\n\nThis is a test article.';
    await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'test.md'), content);
    
    const source = await ingestRawSource('articles/test.md', config);
    
    expect(source.path).toBe('articles/test.md');
    expect(source.filename).toBe('test.md');
    expect(source.format).toBe('md');
    expect(source.category).toBe('articles');
    expect(source.content).toBe(content);
    expect(source.ingested).toBe(false);
    expect(source.generatedPages).toEqual([]);
    expect(source.fileSize).toBe(Buffer.byteLength(content));
    expect(source.addedDate).toBeInstanceOf(Date);
  });

  it('should ingest a text file', async () => {
    const content = 'Plain text content';
    await fs.writeFile(path.join(tempDir, 'raw', 'notes.txt'), content);
    
    const source = await ingestRawSource('notes.txt', config);
    
    expect(source.format).toBe('txt');
    expect(source.category).toBe('uncategorized');
    expect(source.content).toBe(content);
  });

  it('should ingest a code file', async () => {
    const content = 'const x = 42;';
    await fs.mkdir(path.join(tempDir, 'raw', 'code-snippets'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'raw', 'code-snippets', 'example.ts'), content);
    
    const source = await ingestRawSource('code-snippets/example.ts', config);
    
    expect(source.format).toBe('code');
    expect(source.category).toBe('code-snippets');
    expect(source.content).toBe(content);
  });

  it('should recognize various code file extensions', async () => {
    const extensions = [
      'ts', 'js', 'tsx', 'jsx', 'py', 'java', 'c', 'cpp', 'h', 'cs',
      'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'sh', 'bash',
      'json', 'xml', 'yaml', 'yml', 'html', 'css', 'scss', 'sass', 'less'
    ];
    
    for (const ext of extensions) {
      const filename = `test.${ext}`;
      await fs.writeFile(path.join(tempDir, 'raw', filename), 'content');
      
      const source = await ingestRawSource(filename, config);
      expect(source.format).toBe('code');
    }
  });

  it('should preserve original file without modification', async () => {
    const originalContent = '# Original Content\n\nDo not modify this.';
    await fs.writeFile(path.join(tempDir, 'raw', 'preserve.md'), originalContent);
    
    await ingestRawSource('preserve.md', config);
    
    // Verify file is unchanged
    const fileContent = await fs.readFile(path.join(tempDir, 'raw', 'preserve.md'), 'utf-8');
    expect(fileContent).toBe(originalContent);
  });

  it('should throw IngestionError for non-existent file', async () => {
    await expect(ingestRawSource('nonexistent.md', config)).rejects.toThrow(IngestionError);
  });

  it('should extract category from nested paths', async () => {
    await fs.mkdir(path.join(tempDir, 'raw', 'papers', 'research'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'raw', 'papers', 'research', 'paper.pdf'), 'content');
    
    const source = await ingestRawSource('papers/research/paper.pdf', config);
    
    expect(source.category).toBe('papers');
  });

  it('should handle files in root of raw/ directory', async () => {
    await fs.writeFile(path.join(tempDir, 'raw', 'root-file.md'), 'content');
    
    const source = await ingestRawSource('root-file.md', config);
    
    expect(source.category).toBe('uncategorized');
  });
});

describe('listRawSources', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-list-test-'));
    
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should list all raw source files', async () => {
    await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'raw', 'papers'), { recursive: true });
    
    await fs.writeFile(path.join(tempDir, 'raw', 'test1.md'), '');
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article1.md'), '');
    await fs.writeFile(path.join(tempDir, 'raw', 'papers', 'paper1.pdf'), '');
    
    const sources = await listRawSources(config);
    
    expect(sources.length).toBeGreaterThanOrEqual(3);
    expect(sources).toContain('test1.md');
    expect(sources).toContain('articles/article1.md');
    expect(sources).toContain('papers/paper1.pdf');
  });

  it('should return empty array when no files exist', async () => {
    const sources = await listRawSources(config);
    
    expect(sources).toEqual([]);
  });
});

describe('ingestMultipleRawSources', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-multi-test-'));
    
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should ingest multiple files successfully', async () => {
    await fs.writeFile(path.join(tempDir, 'raw', 'file1.md'), 'content1');
    await fs.writeFile(path.join(tempDir, 'raw', 'file2.txt'), 'content2');
    await fs.writeFile(path.join(tempDir, 'raw', 'file3.ts'), 'content3');
    
    const sources = await ingestMultipleRawSources(['file1.md', 'file2.txt', 'file3.ts'], config);
    
    expect(sources).toHaveLength(3);
    expect(sources[0].filename).toBe('file1.md');
    expect(sources[1].filename).toBe('file2.txt');
    expect(sources[2].filename).toBe('file3.ts');
  });

  it('should continue ingestion even if some files fail', async () => {
    await fs.writeFile(path.join(tempDir, 'raw', 'file1.md'), 'content1');
    // file2.md does not exist
    await fs.writeFile(path.join(tempDir, 'raw', 'file3.txt'), 'content3');
    
    const sources = await ingestMultipleRawSources(['file1.md', 'file2.md', 'file3.txt'], config);
    
    // Should successfully ingest 2 out of 3 files
    expect(sources).toHaveLength(2);
    expect(sources[0].filename).toBe('file1.md');
    expect(sources[1].filename).toBe('file3.txt');
  });

  it('should return empty array when all files fail', async () => {
    const sources = await ingestMultipleRawSources(['nonexistent1.md', 'nonexistent2.md'], config);
    
    expect(sources).toEqual([]);
  });
});

describe('generateWikiPagesFromSource', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-gen-test-'));
    
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'sources'), { recursive: true });
    
    // Create index and activity log files
    await fs.writeFile(path.join(tempDir, 'wiki', 'index.md'), '# Wiki Index\n\n---\n\n');
    await fs.writeFile(path.join(tempDir, 'wiki', 'activity-log.md'), '# Activity Log\n\n---\n\n');
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should generate an entity page from raw source', async () => {
    const content = '# Angular CDK\n\nComponent Dev Kit';
    await fs.writeFile(path.join(tempDir, 'raw', 'angular-cdk.md'), content);
    
    const source = await ingestRawSource('angular-cdk.md', config);
    
    const result = await generateWikiPagesFromSource({
      source,
      entityOptions: {
        name: 'Angular CDK',
        definition: 'The Angular Component Dev Kit provides behavior primitives.',
        properties: ['Accessibility utilities', 'Layout helpers'],
        tags: ['angular', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('entity');
    expect(result.pages[0].frontmatter.title).toBe('Angular CDK');
    expect(result.writtenPaths).toHaveLength(1);
    expect(result.writtenPaths[0]).toMatch(/^entities\//);
    
    // Verify file was written
    const filePath = path.join(tempDir, 'wiki', result.writtenPaths[0]);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should generate a concept page from raw source', async () => {
    const content = '# Progressive Enhancement\n\nA design philosophy';
    await fs.writeFile(path.join(tempDir, 'raw', 'progressive-enhancement.md'), content);
    
    const source = await ingestRawSource('progressive-enhancement.md', config);
    
    const result = await generateWikiPagesFromSource({
      source,
      conceptOptions: {
        name: 'Progressive Enhancement',
        explanation: 'Progressive enhancement provides a baseline experience to all users.',
        applications: ['Building accessible web apps'],
        tags: ['web-development', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('concept');
    expect(result.pages[0].frontmatter.title).toBe('Progressive Enhancement');
    expect(result.writtenPaths[0]).toMatch(/^concepts\//);
  });

  it('should generate a source summary from raw source', async () => {
    const content = '# Angular ARIA Guide\n\nAccessibility guide';
    await fs.writeFile(path.join(tempDir, 'raw', 'angular-aria-guide.md'), content);
    
    const source = await ingestRawSource('angular-aria-guide.md', config);
    
    const result = await generateWikiPagesFromSource({
      source,
      sourceSummaryOptions: {
        title: 'Angular ARIA Guide',
        author: 'Angular Team',
        date: '2024-05-10',
        keyPoints: ['Use semantic HTML', 'Test with screen readers'],
        tags: ['angular', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('source');
    expect(result.pages[0].frontmatter.title).toBe('Angular ARIA Guide');
    expect(result.writtenPaths[0]).toMatch(/^sources\//);
  });

  it('should generate multiple pages from a single source', async () => {
    const content = '# Comprehensive Guide\n\nCovers entities and concepts';
    await fs.writeFile(path.join(tempDir, 'raw', 'comprehensive.md'), content);
    
    const source = await ingestRawSource('comprehensive.md', config);
    
    const result = await generateWikiPagesFromSource({
      source,
      entityOptions: {
        name: 'Test Entity',
        definition: 'An entity for testing',
        tags: ['test'],
      },
      conceptOptions: {
        name: 'Test Concept',
        explanation: 'A concept for testing',
        tags: ['test'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(2);
    expect(result.writtenPaths).toHaveLength(2);
    expect(result.pages[0].frontmatter.type).toBe('entity');
    expect(result.pages[1].frontmatter.type).toBe('concept');
  });

  it('should return empty result when no page options provided', async () => {
    const content = '# Empty Test';
    await fs.writeFile(path.join(tempDir, 'raw', 'empty.md'), content);
    
    const source = await ingestRawSource('empty.md', config);
    
    const result = await generateWikiPagesFromSource({
      source,
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(0);
    expect(result.writtenPaths).toHaveLength(0);
  });
});
