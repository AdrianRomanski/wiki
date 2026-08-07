import { Injectable } from '@angular/core';
import { ProgressEntry, ProgressIndex } from '../models/progress.models';
import { PROGRESS_ENTRY_SCHEMA, PROGRESS_INDEX_SCHEMA, SCHEMA_VERSION } from '../models/progress.schemas';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PROGRESS_DIR = 'wiki/progress';
  private readonly CONCEPTS_DIR = 'wiki/progress/concepts';
  private readonly INDEX_FILE = 'wiki/progress/index.json';
  private readonly SCHEMA_VERSION = SCHEMA_VERSION;

  private rootDirectoryHandle: FileSystemDirectoryHandle | null = null;

  async initialize(): Promise<void> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    try {

      this.rootDirectoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Directory access was cancelled by user.');
      }
      throw new Error(`Failed to access directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async ensureDirectories(): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {

      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: true });

      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: true });

      await progressHandle.getDirectoryHandle('concepts', { create: true });
    } catch (error) {
      throw new Error(
        `Failed to create progress directories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async readJSONFile<T>(path: string): Promise<T | null> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const fileHandle = await this.getFileHandle(path, false);
      if (!fileHandle) {
        return null;
      }

      const file = await fileHandle.getFile();
      const content = await file.text();

      if (this.hasMergeConflictMarkers(content)) {
        throw new Error(`Merge conflict markers detected in file: ${path}`);
      }

      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return null;
      }

      if (error instanceof Error && error.message.startsWith('Merge conflict markers detected')) {
        throw error;
      }
      throw new Error(
        `Failed to read JSON file ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async writeJSONFile<T>(path: string, data: T): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const fileHandle = await this.getFileHandle(path, true);
      const writable = await fileHandle.createWritable();
      const content = JSON.stringify(data, null, 2);
      await writable.write(content);
      await writable.close();
    } catch (error) {
      throw new Error(
        `Failed to write JSON file ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async readProgressFile(conceptId: string): Promise<ProgressEntry | null> {
    const path = `${this.CONCEPTS_DIR}/${conceptId}.json`;
    const data = await this.readJSONFile<ProgressEntry>(path);

    if (data === null) {
      return null;
    }

    if (!this.validateProgressEntry(data)) {
      throw new Error(`Invalid progress entry format in ${path}`);
    }

    return data;
  }

  async writeProgressFile(conceptId: string, entry: ProgressEntry): Promise<void> {
    if (!this.validateProgressEntry(entry)) {
      throw new Error(`Invalid progress entry data for concept: ${conceptId}`);
    }

    const path = `${this.CONCEPTS_DIR}/${conceptId}.json`;
    await this.writeWithRetry(path, entry);
  }

  async readIndexFile(): Promise<ProgressIndex | null> {
    const data = await this.readJSONFile<ProgressIndex>(this.INDEX_FILE);

    if (data === null) {
      return null;
    }

    if (!this.validateIndex(data)) {
      throw new Error(`Invalid index format in ${this.INDEX_FILE}`);
    }

    return data;
  }

  async writeIndexFile(index: ProgressIndex): Promise<void> {
    if (!this.validateIndex(index)) {
      throw new Error('Invalid index data');
    }

    await this.writeJSONFile(this.INDEX_FILE, index);
  }

  async listProgressFiles(): Promise<string[]> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      const conceptIds: string[] = [];

      const iterator = (conceptsHandle as any).values();

      for await (const entry of iterator) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          conceptIds.push(entry.name.slice(0, -5)); 
        }
      }

      return conceptIds;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return [];
      }
      throw new Error(
        `Failed to list progress files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async deleteProgressFile(conceptId: string): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      await conceptsHandle.removeEntry(`${conceptId}.json`);
    } catch (error) {
      throw new Error(
        `Failed to delete progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async quarantineProgressFile(conceptId: string): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      const sourceFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json`);
      const sourceFile = await sourceFileHandle.getFile();
      const content = await sourceFile.text();

      const invalidFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json.invalid`, { create: true });
      const writable = await invalidFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      await conceptsHandle.removeEntry(`${conceptId}.json`);
    } catch (error) {
      throw new Error(
        `Failed to quarantine progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async quarantineConflictedFile(conceptId: string): Promise<string> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      const sourceFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json`);
      const sourceFile = await sourceFileHandle.getFile();
      const content = await sourceFile.text();

      const conflictFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json.conflict`, { create: true });
      const writable = await conflictFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      await conceptsHandle.removeEntry(`${conceptId}.json`);

      return `${this.CONCEPTS_DIR}/${conceptId}.json.conflict`;
    } catch (error) {
      throw new Error(
        `Failed to quarantine conflicted progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private hasMergeConflictMarkers(content: string): boolean {
    return (
      content.includes('<<<<<<<') ||
      content.includes('=======') ||
      content.includes('>>>>>>>')
    );
  }

  async getFileTimestamp(conceptId: string): Promise<number | null> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      const fileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json`);
      const file = await fileHandle.getFile();
      return file.lastModified;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return null;
      }
      throw new Error(
        `Failed to get timestamp for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private validateProgressEntry(data: unknown): data is ProgressEntry {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const entry = data as Record<string, unknown>;

    if (!entry['conceptId'] || !entry['conceptTitle'] || !entry['state'] || 
        !entry['lastAssessed'] || entry['assessmentCount'] === undefined || !entry['version']) {
      return false;
    }

    if (typeof entry['conceptId'] !== 'string' || typeof entry['conceptTitle'] !== 'string' ||
        typeof entry['state'] !== 'string' || typeof entry['lastAssessed'] !== 'string' ||
        typeof entry['assessmentCount'] !== 'number' || typeof entry['version'] !== 'string') {
      return false;
    }

    const validStates = ['Not_Started', 'In_Progress', 'Understood', 'Mastered'];
    if (!validStates.includes(entry['state'] as string)) {
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(entry['conceptId'] as string)) {
      return false;
    }

    if ((entry['assessmentCount'] as number) < 0) {
      return false;
    }

    if (entry['version'] !== this.SCHEMA_VERSION) {
      return false;
    }

    return true;
  }

  private validateIndex(data: unknown): data is ProgressIndex {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const index = data as Record<string, unknown>;

    if (!index['version'] || !index['lastUpdated'] || index['totalConcepts'] === undefined || !index['conceptIds']) {
      return false;
    }

    if (typeof index['version'] !== 'string' || typeof index['lastUpdated'] !== 'string' ||
        typeof index['totalConcepts'] !== 'number' || !Array.isArray(index['conceptIds'])) {
      return false;
    }

    if (index['version'] !== this.SCHEMA_VERSION) {
      return false;
    }

    if ((index['totalConcepts'] as number) < 0) {
      return false;
    }

    const conceptIds = index['conceptIds'] as unknown[];
    for (const id of conceptIds) {
      if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
        return false;
      }
    }

    if (new Set(conceptIds).size !== conceptIds.length) {
      return false;
    }

    return true;
  }

  private async writeWithRetry<T>(path: string, data: T): Promise<void> {
    const delays = [100, 200, 400]; 
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await this.writeJSONFile(path, data);
        return; 
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === delays.length) {
          break;
        }

        await this.delay(delays[attempt]);
      }
    }

    throw new Error(
      `Failed to write file ${path} after ${delays.length + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getFileHandle(path: string, create: boolean): Promise<FileSystemFileHandle> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    const parts = path.split('/');
    const filename = parts.pop();
    if (!filename) {
      throw new Error(`Invalid file path: ${path}`);
    }

    let currentHandle: FileSystemDirectoryHandle = this.rootDirectoryHandle;

    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create });
    }

    return await currentHandle.getFileHandle(filename, { create });
  }
}
