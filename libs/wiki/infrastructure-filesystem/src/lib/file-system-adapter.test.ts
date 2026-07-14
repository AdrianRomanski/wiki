import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileSystemAdapter, FileSystemConfig } from './file-system-adapter';
import { InvalidPathError } from './invalid-path-error';
import { FileOperationError } from './file-operation-error';

describe('FileSystemAdapter - validatePath', () => {
  let tempDir: string;
  let adapter: FileSystemAdapter;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-test-'));
    const config: FileSystemConfig = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
    adapter = new FileSystemAdapter(config);
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should accept valid paths within base directory', async () => {
    await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), 'content');
    const result = await adapter.readWikiFile('test.md');
    expect(result).toBe('content');
  });

  it('should accept paths with subdirectories', async () => {
    await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'test.md'), 'content');
    const result = await adapter.readWikiFile('entities/test.md');
    expect(result).toBe('content');
  });

  it('should reject directory traversal attempts with ../', async () => {
    await expect(adapter.readWikiFile('../../../etc/passwd')).rejects.toThrow(InvalidPathError);
  });

  it('should reject absolute paths outside base directory', async () => {
    await expect(adapter.readWikiFile('/etc/passwd')).rejects.toThrow(InvalidPathError);
  });

  it('should reject paths that resolve outside base directory', async () => {
    await expect(adapter.readWikiFile('entities/../../raw/secret.md')).rejects.toThrow(InvalidPathError);
  });
});

describe('FileSystemAdapter - File Operations', () => {
  let tempDir: string;
  let config: FileSystemConfig;
  let adapter: FileSystemAdapter;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-test-'));
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
    adapter = new FileSystemAdapter(config);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readRawFile', () => {
    it('should read a file from raw/ directory', async () => {
      const content = 'Test raw content';
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), content);
      const result = await adapter.readRawFile('test.md');
      expect(result).toBe(content);
    });

    it('should read a file from raw/ subdirectory', async () => {
      await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
      const content = 'Article content';
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'test.md'), content);
      const result = await adapter.readRawFile('articles/test.md');
      expect(result).toBe(content);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(adapter.readRawFile('nonexistent.md')).rejects.toThrow(FileOperationError);
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(adapter.readRawFile('../../../etc/passwd')).rejects.toThrow(InvalidPathError);
    });
  });

  describe('readWikiFile', () => {
    it('should read a file from wiki/ directory', async () => {
      const content = 'Test wiki content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), content);
      const result = await adapter.readWikiFile('test.md');
      expect(result).toBe(content);
    });

    it('should read a file from wiki/ subdirectory', async () => {
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      const content = 'Entity content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'test.md'), content);
      const result = await adapter.readWikiFile('entities/test.md');
      expect(result).toBe(content);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(adapter.readWikiFile('nonexistent.md')).rejects.toThrow(FileOperationError);
    });
  });

  describe('writeWikiFile', () => {
    it('should write a file to wiki/ directory', async () => {
      const content = 'New wiki content';
      await adapter.writeWikiFile('test.md', content);
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'test.md'), 'utf-8');
      expect(result).toBe(content);
    });

    it('should create subdirectories if they do not exist', async () => {
      const content = 'Entity content';
      await adapter.writeWikiFile('entities/new-entity.md', content);
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'entities', 'new-entity.md'), 'utf-8');
      expect(result).toBe(content);
    });

    it('should overwrite existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), 'Old content');
      const newContent = 'New content';
      await adapter.writeWikiFile('test.md', newContent);
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'test.md'), 'utf-8');
      expect(result).toBe(newContent);
    });

    it('should use atomic write (no partial writes)', async () => {
      const content = 'Atomic content';
      await adapter.writeWikiFile('test.md', content);
      const tmpPath = path.join(tempDir, 'wiki', 'test.md.tmp');
      await expect(fs.access(tmpPath)).rejects.toThrow();
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(adapter.writeWikiFile('../../../etc/passwd', 'content')).rejects.toThrow(InvalidPathError);
    });
  });

  describe('listRawFiles', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'raw', 'papers'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'raw', 'test1.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'test2.txt'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article1.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article2.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'papers', 'paper1.pdf'), '');
    });

    it('should list all markdown files', async () => {
      const files = await adapter.listRawFiles('**/*.md');
      expect(files).toHaveLength(3);
      expect(files).toContain('test1.md');
      expect(files).toContain('articles/article1.md');
      expect(files).toContain('articles/article2.md');
    });

    it('should list files in specific subdirectory', async () => {
      const files = await adapter.listRawFiles('articles/*');
      expect(files).toHaveLength(2);
      expect(files).toContain('articles/article1.md');
      expect(files).toContain('articles/article2.md');
    });

    it('should list all files with wildcard', async () => {
      const files = await adapter.listRawFiles('**/*');
      expect(files.length).toBeGreaterThanOrEqual(5);
    });

    it('should return empty array for no matches', async () => {
      const files = await adapter.listRawFiles('**/*.xyz');
      expect(files).toHaveLength(0);
    });
  });

  describe('listWikiFiles', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'wiki', 'index.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'entity1.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'entity2.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'concepts', 'concept1.md'), '');
    });

    it('should list all markdown files', async () => {
      const files = await adapter.listWikiFiles('**/*.md');
      expect(files).toHaveLength(4);
    });

    it('should list entity pages only', async () => {
      const files = await adapter.listWikiFiles('entities/*.md');
      expect(files).toHaveLength(2);
      expect(files).toContain('entities/entity1.md');
      expect(files).toContain('entities/entity2.md');
    });

    it('should list concept pages only', async () => {
      const files = await adapter.listWikiFiles('concepts/*.md');
      expect(files).toHaveLength(1);
      expect(files).toContain('concepts/concept1.md');
    });
  });

  describe('rawFileExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), '');
      const exists = await adapter.rawFileExists('test.md');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await adapter.rawFileExists('nonexistent.md');
      expect(exists).toBe(false);
    });

    it('should return false for directory traversal attempts', async () => {
      const exists = await adapter.rawFileExists('../../../etc/passwd');
      expect(exists).toBe(false);
    });
  });

  describe('wikiFileExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), '');
      const exists = await adapter.wikiFileExists('test.md');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await adapter.wikiFileExists('nonexistent.md');
      expect(exists).toBe(false);
    });
  });

  describe('getRawFileStats', () => {
    it('should return file stats', async () => {
      const content = 'Test content';
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), content);
      const stats = await adapter.getRawFileStats('test.md');
      expect(stats.size).toBe(Buffer.byteLength(content));
      expect(stats.modified).toBeInstanceOf(Date);
      expect(stats.created).toBeInstanceOf(Date);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(adapter.getRawFileStats('nonexistent.md')).rejects.toThrow(FileOperationError);
    });
  });

  describe('getWikiFileStats', () => {
    it('should return file stats', async () => {
      const content = 'Wiki content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), content);
      const stats = await adapter.getWikiFileStats('test.md');
      expect(stats.size).toBe(Buffer.byteLength(content));
      expect(stats.modified).toBeInstanceOf(Date);
      expect(stats.created).toBeInstanceOf(Date);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(adapter.getWikiFileStats('nonexistent.md')).rejects.toThrow(FileOperationError);
    });
  });

  describe('ensureWikiDir', () => {
    it('should create a directory', async () => {
      await adapter.ensureWikiDir('entities');
      const stats = await fs.stat(path.join(tempDir, 'wiki', 'entities'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories', async () => {
      await adapter.ensureWikiDir('concepts/accessibility');
      const stats = await fs.stat(path.join(tempDir, 'wiki', 'concepts', 'accessibility'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      await expect(adapter.ensureWikiDir('entities')).resolves.not.toThrow();
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(adapter.ensureWikiDir('../../../etc')).rejects.toThrow(InvalidPathError);
    });
  });

  describe('ensureDir', () => {
    it('should create a new directory', async () => {
      await adapter.ensureDir('scratch');
      const stats = await fs.stat(path.join(tempDir, 'scratch'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should be idempotent when called twice on the same path', async () => {
      await adapter.ensureDir('scratch');
      await expect(adapter.ensureDir('scratch')).resolves.not.toThrow();
      const stats = await fs.stat(path.join(tempDir, 'scratch'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested intermediate directories', async () => {
      await adapter.ensureDir('a/b/c');
      const stats = await fs.stat(path.join(tempDir, 'a', 'b', 'c'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should reject directory traversal attempts with ../', async () => {
      await expect(adapter.ensureDir('../escape')).rejects.toThrow(InvalidPathError);
    });

    it('should reject absolute paths', async () => {
      await expect(adapter.ensureDir('/absolute/path')).rejects.toThrow(InvalidPathError);
    });

    it('should reject paths containing a null byte', async () => {
      await expect(adapter.ensureDir('bad\0path')).rejects.toThrow();
    });
  });

  describe('deleteWikiFile', () => {
    it('should delete a file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), 'content');
      await adapter.deleteWikiFile('test.md');
      await expect(fs.access(path.join(tempDir, 'wiki', 'test.md'))).rejects.toThrow();
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(adapter.deleteWikiFile('nonexistent.md')).rejects.toThrow(FileOperationError);
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(adapter.deleteWikiFile('../../../etc/passwd')).rejects.toThrow(InvalidPathError);
    });
  });
});
