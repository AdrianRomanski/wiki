/**
 * Unit tests for file system utilities.
 * 
 * Tests cover:
 * - Path validation and directory traversal prevention
 * - Reading files from raw/ and wiki/ directories
 * - Writing files to wiki/ with atomic operations
 * - Listing files with glob patterns
 * - File existence checks
 * - File metadata retrieval
 * - Directory creation
 * - File deletion
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  validatePath,
  readRawFile,
  readWikiFile,
  writeWikiFile,
  listRawFiles,
  listWikiFiles,
  rawFileExists,
  wikiFileExists,
  getRawFileStats,
  getWikiFileStats,
  ensureWikiDir,
  deleteWikiFile,
  InvalidPathError,
  FileOperationError,
  FileSystemConfig,
} from './filesystem';

describe('validatePath', () => {
  it('should accept valid paths within base directory', () => {
    const baseDir = '/repo/wiki';
    const result = validatePath('entities/angular-cdk.md', baseDir);
    expect(result).toBe(path.resolve(baseDir, 'entities/angular-cdk.md'));
  });

  it('should accept paths with subdirectories', () => {
    const baseDir = '/repo/wiki';
    const result = validatePath('concepts/accessibility/aria.md', baseDir);
    expect(result).toBe(path.resolve(baseDir, 'concepts/accessibility/aria.md'));
  });

  it('should reject directory traversal attempts with ../', () => {
    const baseDir = '/repo/wiki';
    expect(() => validatePath('../../../etc/passwd', baseDir)).toThrow(InvalidPathError);
  });

  it('should reject absolute paths outside base directory', () => {
    const baseDir = '/repo/wiki';
    expect(() => validatePath('/etc/passwd', baseDir)).toThrow(InvalidPathError);
  });

  it('should reject paths that resolve outside base directory', () => {
    const baseDir = '/repo/wiki';
    expect(() => validatePath('entities/../../raw/secret.md', baseDir)).toThrow(InvalidPathError);
  });

  it('should accept the base directory itself', () => {
    const baseDir = '/repo/wiki';
    const result = validatePath('.', baseDir);
    expect(result).toBe(path.resolve(baseDir));
  });
});

describe('File System Operations', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-test-'));
    
    // Create raw/ and wiki/ directories
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    
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

  describe('readRawFile', () => {
    it('should read a file from raw/ directory', async () => {
      const content = 'Test raw content';
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), content);
      
      const result = await readRawFile('test.md', config);
      expect(result).toBe(content);
    });

    it('should read a file from raw/ subdirectory', async () => {
      await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
      const content = 'Article content';
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'test.md'), content);
      
      const result = await readRawFile('articles/test.md', config);
      expect(result).toBe(content);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(readRawFile('nonexistent.md', config)).rejects.toThrow(FileOperationError);
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(readRawFile('../../../etc/passwd', config)).rejects.toThrow(InvalidPathError);
    });
  });

  describe('readWikiFile', () => {
    it('should read a file from wiki/ directory', async () => {
      const content = 'Test wiki content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), content);
      
      const result = await readWikiFile('test.md', config);
      expect(result).toBe(content);
    });

    it('should read a file from wiki/ subdirectory', async () => {
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      const content = 'Entity content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'test.md'), content);
      
      const result = await readWikiFile('entities/test.md', config);
      expect(result).toBe(content);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(readWikiFile('nonexistent.md', config)).rejects.toThrow(FileOperationError);
    });
  });

  describe('writeWikiFile', () => {
    it('should write a file to wiki/ directory', async () => {
      const content = 'New wiki content';
      await writeWikiFile('test.md', content, config);
      
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'test.md'), 'utf-8');
      expect(result).toBe(content);
    });

    it('should create subdirectories if they do not exist', async () => {
      const content = 'Entity content';
      await writeWikiFile('entities/new-entity.md', content, config);
      
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'entities', 'new-entity.md'), 'utf-8');
      expect(result).toBe(content);
    });

    it('should overwrite existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), 'Old content');
      
      const newContent = 'New content';
      await writeWikiFile('test.md', newContent, config);
      
      const result = await fs.readFile(path.join(tempDir, 'wiki', 'test.md'), 'utf-8');
      expect(result).toBe(newContent);
    });

    it('should use atomic write (no partial writes)', async () => {
      const content = 'Atomic content';
      await writeWikiFile('test.md', content, config);
      
      // Verify no .tmp file remains
      const tmpPath = path.join(tempDir, 'wiki', 'test.md.tmp');
      await expect(fs.access(tmpPath)).rejects.toThrow();
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(writeWikiFile('../../../etc/passwd', 'content', config)).rejects.toThrow(InvalidPathError);
    });
  });

  describe('listRawFiles', () => {
    beforeEach(async () => {
      // Create test files
      await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'raw', 'papers'), { recursive: true });
      
      await fs.writeFile(path.join(tempDir, 'raw', 'test1.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'test2.txt'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article1.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article2.md'), '');
      await fs.writeFile(path.join(tempDir, 'raw', 'papers', 'paper1.pdf'), '');
    });

    it('should list all markdown files', async () => {
      const files = await listRawFiles('**/*.md', config);
      expect(files).toHaveLength(3);
      expect(files).toContain('test1.md');
      expect(files).toContain('articles/article1.md');
      expect(files).toContain('articles/article2.md');
    });

    it('should list files in specific subdirectory', async () => {
      const files = await listRawFiles('articles/*', config);
      expect(files).toHaveLength(2);
      expect(files).toContain('articles/article1.md');
      expect(files).toContain('articles/article2.md');
    });

    it('should list all files with wildcard', async () => {
      const files = await listRawFiles('**/*', config);
      expect(files.length).toBeGreaterThanOrEqual(5);
    });

    it('should return empty array for no matches', async () => {
      const files = await listRawFiles('**/*.xyz', config);
      expect(files).toHaveLength(0);
    });
  });

  describe('listWikiFiles', () => {
    beforeEach(async () => {
      // Create test files
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
      
      await fs.writeFile(path.join(tempDir, 'wiki', 'index.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'entity1.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'entities', 'entity2.md'), '');
      await fs.writeFile(path.join(tempDir, 'wiki', 'concepts', 'concept1.md'), '');
    });

    it('should list all markdown files', async () => {
      const files = await listWikiFiles('**/*.md', config);
      expect(files).toHaveLength(4);
    });

    it('should list entity pages only', async () => {
      const files = await listWikiFiles('entities/*.md', config);
      expect(files).toHaveLength(2);
      expect(files).toContain('entities/entity1.md');
      expect(files).toContain('entities/entity2.md');
    });

    it('should list concept pages only', async () => {
      const files = await listWikiFiles('concepts/*.md', config);
      expect(files).toHaveLength(1);
      expect(files).toContain('concepts/concept1.md');
    });
  });

  describe('rawFileExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), '');
      const exists = await rawFileExists('test.md', config);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await rawFileExists('nonexistent.md', config);
      expect(exists).toBe(false);
    });

    it('should return false for directory traversal attempts', async () => {
      const exists = await rawFileExists('../../../etc/passwd', config);
      expect(exists).toBe(false);
    });
  });

  describe('wikiFileExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), '');
      const exists = await wikiFileExists('test.md', config);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await wikiFileExists('nonexistent.md', config);
      expect(exists).toBe(false);
    });
  });

  describe('getRawFileStats', () => {
    it('should return file stats', async () => {
      const content = 'Test content';
      await fs.writeFile(path.join(tempDir, 'raw', 'test.md'), content);
      
      const stats = await getRawFileStats('test.md', config);
      expect(stats.size).toBe(Buffer.byteLength(content));
      expect(stats.mtime).toBeInstanceOf(Date);
      expect(stats.ctime).toBeInstanceOf(Date);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(getRawFileStats('nonexistent.md', config)).rejects.toThrow(FileOperationError);
    });
  });

  describe('getWikiFileStats', () => {
    it('should return file stats', async () => {
      const content = 'Wiki content';
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), content);
      
      const stats = await getWikiFileStats('test.md', config);
      expect(stats.size).toBe(Buffer.byteLength(content));
      expect(stats.mtime).toBeInstanceOf(Date);
      expect(stats.ctime).toBeInstanceOf(Date);
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(getWikiFileStats('nonexistent.md', config)).rejects.toThrow(FileOperationError);
    });
  });

  describe('ensureWikiDir', () => {
    it('should create a directory', async () => {
      await ensureWikiDir('entities', config);
      
      const stats = await fs.stat(path.join(tempDir, 'wiki', 'entities'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories', async () => {
      await ensureWikiDir('concepts/accessibility', config);
      
      const stats = await fs.stat(path.join(tempDir, 'wiki', 'concepts', 'accessibility'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
      await expect(ensureWikiDir('entities', config)).resolves.not.toThrow();
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(ensureWikiDir('../../../etc', config)).rejects.toThrow(InvalidPathError);
    });
  });

  describe('deleteWikiFile', () => {
    it('should delete a file', async () => {
      await fs.writeFile(path.join(tempDir, 'wiki', 'test.md'), 'content');
      
      await deleteWikiFile('test.md', config);
      
      await expect(fs.access(path.join(tempDir, 'wiki', 'test.md'))).rejects.toThrow();
    });

    it('should throw FileOperationError for non-existent file', async () => {
      await expect(deleteWikiFile('nonexistent.md', config)).rejects.toThrow(FileOperationError);
    });

    it('should throw InvalidPathError for directory traversal', async () => {
      await expect(deleteWikiFile('../../../etc/passwd', config)).rejects.toThrow(InvalidPathError);
    });
  });
});
