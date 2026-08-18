import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storage.service';
import { ProgressEntry, ProgressIndex } from '../models/progress.models';
import { SCHEMA_VERSION } from '../models/progress.schemas';

type WindowWithFs = Window & { showDirectoryPicker?: ReturnType<typeof vi.fn> };

class MockFileSystemDirectoryHandle {
  private directories = new Map<string, MockFileSystemDirectoryHandle>();
  private files = new Map<string, MockFileSystemFileHandle>();

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MockFileSystemDirectoryHandle> {
    let dir = this.directories.get(name);
    if (!dir) {
      if (options?.create) {
        dir = new MockFileSystemDirectoryHandle();
        this.directories.set(name, dir);
      } else {
        const error = Object.assign(new Error('Directory not found'), { name: 'NotFoundError' });
        throw error;
      }
    }
    return dir;
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MockFileSystemFileHandle> {
    let file = this.files.get(name);
    if (!file) {
      if (options?.create) {
        file = new MockFileSystemFileHandle(name);
        this.files.set(name, file);
      } else {
        const error = Object.assign(new Error('File not found'), { name: 'NotFoundError' });
        throw error;
      }
    }
    return file;
  }

  async removeEntry(name: string): Promise<void> {
    const exists = this.files.has(name) || this.directories.has(name);
    if (!exists) {
      const error = Object.assign(new Error('Entry not found'), { name: 'NotFoundError' });
      throw error;
    }
    this.files.delete(name);
    this.directories.delete(name);
  }

  async *values(): AsyncIterableIterator<{ kind: 'file' | 'directory'; name: string }> {
    for (const name of this.files.keys()) {
      yield { kind: 'file', name };
    }
    for (const name of this.directories.keys()) {
      yield { kind: 'directory', name };
    }
  }
}

class MockFileSystemFileHandle {
  private content = '';

  constructor(public name: string) {}

  async getFile(): Promise<{ text: () => Promise<string> }> {
    return {
      text: async () => this.content
    };
  }

  async createWritable(): Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }> {
    return {
      write: async (data: string) => {
        this.content = data;
      },
      close: async () => {
        // No-op
      }
    };
  }

  setContent(content: string): void {
    this.content = content;
  }

  getContent(): string {
    return this.content;
  }
}

describe('StorageService', () => {
  let service: StorageService;
  let mockRootHandle: MockFileSystemDirectoryHandle;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    mockRootHandle = new MockFileSystemDirectoryHandle();

    const win = window as unknown as WindowWithFs;
    win.showDirectoryPicker = vi.fn().mockResolvedValue(mockRootHandle);
  });

  describe('initialize', () => {
    it('should request directory access', async () => {
      await service.initialize();
      const win = window as unknown as WindowWithFs;
      expect(win.showDirectoryPicker).toHaveBeenCalledWith({
        mode: 'readwrite',
        startIn: 'documents',
      });
    });

    it('should throw error if File System Access API is not supported', async () => {
      const win = window as unknown as WindowWithFs;
      const originalShowDirectoryPicker = win.showDirectoryPicker;
      delete win.showDirectoryPicker;

      await expect(service.initialize()).rejects.toThrow(
        'File System Access API is not supported in this browser.'
      );

      win.showDirectoryPicker = originalShowDirectoryPicker;
    });

    it('should throw error if user denies directory access', async () => {
      const abortError = Object.assign(new Error('User cancelled'), { name: 'AbortError' });
      const win = window as unknown as WindowWithFs;
      win.showDirectoryPicker = vi.fn().mockRejectedValue(abortError);

      await expect(service.initialize()).rejects.toThrow(
        'Directory access was cancelled by user.'
      );
    });
  });

  describe('ensureDirectories', () => {
    it('should throw error if not initialized', async () => {
      await expect(service.ensureDirectories()).rejects.toThrow(
        'Storage service not initialized. Call initialize() first.'
      );
    });

    it('should create wiki/progress/concepts directory structure', async () => {
      await service.initialize();
      await service.ensureDirectories();

      const wikiHandle = await mockRootHandle.getDirectoryHandle('wiki', { create: false });
      expect(wikiHandle).toBeDefined();

      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      expect(progressHandle).toBeDefined();

      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });
      expect(conceptsHandle).toBeDefined();
    });

    it('should succeed if directories already exist', async () => {
      await service.initialize();
      await service.ensureDirectories();
      await expect(service.ensureDirectories()).resolves.toBeUndefined();
    });
  });

  describe('readJSONFile and writeJSONFile', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();
    });

    it('should write and read JSON file', async () => {
      const testData = { foo: 'bar', num: 42 };
      await service.writeJSONFile('.kiro/test.json', testData);

      const result = await service.readJSONFile<typeof testData>('.kiro/test.json');
      expect(result).toEqual(testData);
    });

    it('should return null if file does not exist', async () => {
      const result = await service.readJSONFile('.kiro/nonexistent.json');
      expect(result).toBeNull();
    });

    it('should throw error if JSON is invalid', async () => {
      const kiroHandle = await mockRootHandle.getDirectoryHandle('.kiro', { create: true });
      const fileHandle = (await kiroHandle.getFileHandle('invalid.json', { create: true })) as unknown as MockFileSystemFileHandle;
      fileHandle.setContent('{ invalid json }');

      await expect(service.readJSONFile('.kiro/invalid.json')).rejects.toThrow();
    });
  });

  describe('readProgressFile and writeProgressFile', () => {
    let validEntry: ProgressEntry;

    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();

      validEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T14:30:00Z',
        assessmentCount: 3,
        version: SCHEMA_VERSION
      };
    });

    it('should write and read progress file', async () => {
      await service.writeProgressFile('typescript', validEntry);

      const result = await service.readProgressFile('typescript');
      expect(result).toEqual(validEntry);
    });

    it('should return null if progress file does not exist', async () => {
      const result = await service.readProgressFile('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error if progress entry validation fails', async () => {
      const invalidEntry = { ...validEntry, state: 'InvalidState' };

      await expect(
        service.writeProgressFile('invalid', invalidEntry as unknown as ProgressEntry)
      ).rejects.toThrow('Invalid progress entry data for concept: invalid');
    });

    it('should validate conceptId is kebab-case', async () => {
      const invalidEntry = { ...validEntry, conceptId: 'TypeScript' };

      await expect(
        service.writeProgressFile('TypeScript', invalidEntry)
      ).rejects.toThrow('Invalid progress entry data for concept: TypeScript');
    });

    it('should validate assessmentCount is non-negative', async () => {
      const invalidEntry = { ...validEntry, assessmentCount: -1 };

      await expect(
        service.writeProgressFile('typescript', invalidEntry)
      ).rejects.toThrow('Invalid progress entry data for concept: typescript');
    });
  });

  describe('readIndexFile and writeIndexFile', () => {
    let validIndex: ProgressIndex;

    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();

      validIndex = {
        version: SCHEMA_VERSION,
        lastUpdated: '2024-01-15T14:30:00Z',
        totalConcepts: 2,
        conceptIds: ['typescript', 'rxjs']
      };
    });

    it('should write and read index file', async () => {
      await service.writeIndexFile(validIndex);

      const result = await service.readIndexFile();
      expect(result).toEqual(validIndex);
    });

    it('should return null if index file does not exist', async () => {
      const result = await service.readIndexFile();
      expect(result).toBeNull();
    });

    it('should throw error if index validation fails', async () => {
      const invalidIndex = { ...validIndex, totalConcepts: -1 };

      await expect(
        service.writeIndexFile(invalidIndex)
      ).rejects.toThrow('Invalid index data');
    });

    it('should validate conceptIds are unique', async () => {
      const invalidIndex = { ...validIndex, conceptIds: ['typescript', 'typescript'] };

      await expect(
        service.writeIndexFile(invalidIndex)
      ).rejects.toThrow('Invalid index data');
    });

    it('should validate conceptIds match kebab-case pattern', async () => {
      const invalidIndex = { ...validIndex, conceptIds: ['TypeScript'] };

      await expect(
        service.writeIndexFile(invalidIndex)
      ).rejects.toThrow('Invalid index data');
    });
  });

  describe('listProgressFiles', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();
    });

    it('should return empty array if no progress files exist', async () => {
      const result = await service.listProgressFiles();
      expect(result).toEqual([]);
    });

    it('should list all progress files', async () => {
      const entry1: ProgressEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T14:30:00Z',
        assessmentCount: 3,
        version: SCHEMA_VERSION
      };

      const entry2: ProgressEntry = {
        conceptId: 'rxjs',
        conceptTitle: 'RxJS',
        state: 'In_Progress',
        lastAssessed: '2024-01-16T10:00:00Z',
        assessmentCount: 1,
        version: SCHEMA_VERSION
      };

      await service.writeProgressFile('typescript', entry1);
      await service.writeProgressFile('rxjs', entry2);

      const result = await service.listProgressFiles();
      expect(result.sort()).toEqual(['rxjs', 'typescript']);
    });

    it('should return empty array if concepts directory does not exist', async () => {

      await service.initialize();

      const result = await service.listProgressFiles();
      expect(result).toEqual([]);
    });
  });

  describe('merge conflict detection', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();
    });

    it('should throw a distinguishable error when reading a file with merge conflict markers', async () => {
      const wikiHandle = await mockRootHandle.getDirectoryHandle('wiki', { create: true });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: true });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: true });
      const fileHandle = (await conceptsHandle.getFileHandle('typescript.json', { create: true })) as unknown as MockFileSystemFileHandle;
      fileHandle.setContent(
        '<<<<<<< HEAD\n{"state": "Understood"}\n=======\n{"state": "Mastered"}\n>>>>>>> branch\n'
      );

      await expect(service.readProgressFile('typescript')).rejects.toThrow(
        'Merge conflict markers detected'
      );
    });

    it('should detect merge conflict markers via readJSONFile directly', async () => {
      const wikiHandle = await mockRootHandle.getDirectoryHandle('wiki', { create: true });
      const fileHandle = (await wikiHandle.getFileHandle('conflicted.json', { create: true })) as unknown as MockFileSystemFileHandle;
      fileHandle.setContent('{"a": 1}\n=======\n{"a": 2}\n');

      await expect(service.readJSONFile('wiki/conflicted.json')).rejects.toThrow(
        'Merge conflict markers detected'
      );
    });

    it('should not flag ordinary valid JSON as a merge conflict', async () => {
      await service.writeProgressFile('typescript', {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T14:30:00Z',
        assessmentCount: 3,
        version: SCHEMA_VERSION
      });

      await expect(service.readProgressFile('typescript')).resolves.not.toBeNull();
    });
  });

  describe('quarantineConflictedFile', () => {
    let validEntry: ProgressEntry;

    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();

      validEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T14:30:00Z',
        assessmentCount: 3,
        version: SCHEMA_VERSION
      };
    });

    it('should rename the conflicted file with a .conflict extension', async () => {
      await service.writeProgressFile('typescript', validEntry);

      const quarantinedPath = await service.quarantineConflictedFile('typescript');

      expect(quarantinedPath).toBe('wiki/progress/concepts/typescript.json.conflict');

      const result = await service.readProgressFile('typescript');
      expect(result).toBeNull();

      const conceptsHandle = await (await (await mockRootHandle.getDirectoryHandle('wiki')).getDirectoryHandle('progress')).getDirectoryHandle('concepts');
      const quarantinedHandle = (await conceptsHandle.getFileHandle('typescript.json.conflict')) as unknown as MockFileSystemFileHandle;
      expect(JSON.parse(quarantinedHandle.getContent())).toEqual(validEntry);
    });

    it('should throw an error if the file does not exist', async () => {
      await expect(service.quarantineConflictedFile('nonexistent')).rejects.toThrow(
        'Failed to quarantine conflicted progress file for nonexistent'
      );
    });
  });

  describe('deleteProgressFile', () => {
    let validEntry: ProgressEntry;

    beforeEach(async () => {
      await service.initialize();
      await service.ensureDirectories();

      validEntry = {
        conceptId: 'typescript',
        conceptTitle: 'TypeScript',
        state: 'Understood',
        lastAssessed: '2024-01-15T14:30:00Z',
        assessmentCount: 3,
        version: SCHEMA_VERSION
      };
    });

    it('should delete an existing progress file', async () => {
      await service.writeProgressFile('typescript', validEntry);

      let result = await service.readProgressFile('typescript');
      expect(result).toEqual(validEntry);

      await service.deleteProgressFile('typescript');

      result = await service.readProgressFile('typescript');
      expect(result).toBeNull();
    });

    it('should throw error if file does not exist', async () => {
      await expect(service.deleteProgressFile('nonexistent')).rejects.toThrow(
        'Failed to delete progress file for nonexistent'
      );
    });
  });
});
