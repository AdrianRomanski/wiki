import { Injectable } from '@angular/core';
import { ProgressEntry, ProgressIndex } from '../models/progress.models';
import { PROGRESS_ENTRY_SCHEMA, PROGRESS_INDEX_SCHEMA, SCHEMA_VERSION } from '../models/progress.schemas';

/**
 * StorageService handles all file system operations for progress tracking.
 * Uses the File System Access API for browser-based file persistence.
 * 
 * Directory structure:
 * wiki/progress/
 * ├── index.json              # Metadata: last updated, total concepts
 * └── concepts/
 *     ├── typescript.json     # Individual concept progress
 *     ├── rxjs.json
 *     └── ...
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PROGRESS_DIR = 'wiki/progress';
  private readonly CONCEPTS_DIR = 'wiki/progress/concepts';
  private readonly INDEX_FILE = 'wiki/progress/index.json';
  private readonly SCHEMA_VERSION = SCHEMA_VERSION;

  private rootDirectoryHandle: FileSystemDirectoryHandle | null = null;

  /**
   * Initialize the storage service by requesting directory access from the user.
   * This must be called before any file operations.
   * 
   * @throws Error if File System Access API is not supported
   * @throws Error if user denies directory access
   */
  async initialize(): Promise<void> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    try {
      // Request access to the workspace root directory
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

  /**
   * Ensures wiki/progress/ and wiki/progress/concepts/ directories exist.
   * Creates them if they don't exist.
   * 
   * Requirements: 2.1
   * 
   * @throws Error if directories cannot be created (permissions, disk full, etc.)
   */
  async ensureDirectories(): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      // Create wiki directory
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: true });
      
      // Create wiki/progress directory
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: true });
      
      // Create wiki/progress/concepts directory
      await progressHandle.getDirectoryHandle('concepts', { create: true });
    } catch (error) {
      throw new Error(
        `Failed to create progress directories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generic method to read and parse a JSON file.
   * 
   * @param path - Relative path from workspace root
   * @returns Parsed JSON data or null if file doesn't exist
   * @throws Error if file cannot be read or JSON is invalid
   */
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
      // Preserve the distinguishable "Merge conflict markers detected" prefix
      // so callers (e.g. ProgressStateService.loadFromFiles) can route this
      // case to conflict quarantine rather than generic corruption handling.
      if (error instanceof Error && error.message.startsWith('Merge conflict markers detected')) {
        throw error;
      }
      throw new Error(
        `Failed to read JSON file ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generic method to write data as JSON to a file.
   * Creates parent directories as needed.
   * 
   * @param path - Relative path from workspace root
   * @param data - Data to serialize and write
   * @throws Error if file cannot be written (permissions, disk full, etc.)
   */
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

  /**
   * Reads a progress entry file for a specific concept.
   * 
   * Requirements: 2.1
   * 
   * @param conceptId - Kebab-case concept identifier
   * @returns ProgressEntry or null if file doesn't exist
   * @throws Error if file cannot be read or validation fails
   */
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

  /**
   * Writes a progress entry file for a specific concept.
   * Implements retry logic with exponential backoff (100ms, 200ms, 400ms).
   * 
   * Requirements: 2.1, 2.3
   * 
   * @param conceptId - Kebab-case concept identifier
   * @param entry - Progress entry data to save
   * @throws Error if file cannot be written after retries
   */
  async writeProgressFile(conceptId: string, entry: ProgressEntry): Promise<void> {
    if (!this.validateProgressEntry(entry)) {
      throw new Error(`Invalid progress entry data for concept: ${conceptId}`);
    }

    const path = `${this.CONCEPTS_DIR}/${conceptId}.json`;
    await this.writeWithRetry(path, entry);
  }

  /**
   * Reads the progress index file.
   * 
   * Requirements: 2.1
   * 
   * @returns ProgressIndex or null if file doesn't exist
   * @throws Error if file cannot be read or validation fails
   */
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

  /**
   * Writes the progress index file.
   * 
   * Requirements: 2.1
   * 
   * @param index - Index data to save
   * @throws Error if file cannot be written
   */
  async writeIndexFile(index: ProgressIndex): Promise<void> {
    if (!this.validateIndex(index)) {
      throw new Error('Invalid index data');
    }

    await this.writeJSONFile(this.INDEX_FILE, index);
  }

  /**
   * Lists all progress files in the concepts directory.
   * 
   * Requirements: 2.1
   * 
   * @returns Array of concept IDs (without .json extension)
   * @throws Error if directory cannot be read
   */
  async listProgressFiles(): Promise<string[]> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      const conceptIds: string[] = [];
      // TypeScript's lib.dom.d.ts doesn't include values() in the type definition,
      // but it's part of the File System Access API spec. Cast to any to use it.
      const iterator = (conceptsHandle as any).values();
      
      for await (const entry of iterator) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          conceptIds.push(entry.name.slice(0, -5)); // Remove .json extension
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

  /**
   * Deletes a progress file for a specific concept.
   * 
   * @param conceptId - Kebab-case concept identifier
   * @throws Error if file cannot be deleted
   */
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

  /**
   * Quarantine a corrupted progress file by renaming it with .invalid extension.
   * This preserves the corrupted file for manual recovery while preventing it from
   * interfering with normal operations.
   * 
   * Requirements: 2.1
   * 
   * @param conceptId - Kebab-case concept identifier
   * @throws Error if file cannot be renamed
   */
  async quarantineProgressFile(conceptId: string): Promise<void> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      // Read the corrupted file content
      const sourceFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json`);
      const sourceFile = await sourceFileHandle.getFile();
      const content = await sourceFile.text();

      // Write to new file with .invalid extension
      const invalidFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json.invalid`, { create: true });
      const writable = await invalidFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Delete the original file
      await conceptsHandle.removeEntry(`${conceptId}.json`);
    } catch (error) {
      throw new Error(
        `Failed to quarantine progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Quarantine a progress file containing unresolved git merge conflict
   * markers by renaming it with a `.conflict` extension. This preserves the
   * conflicted file for manual resolution while preventing it from
   * interfering with normal operations.
   *
   * Requirements: 2.1, 2.3
   *
   * @param conceptId - Kebab-case concept identifier
   * @returns The quarantined file path (relative to workspace root), for
   *   surfacing in a "link to file for manual resolution" notification
   * @throws Error if file cannot be renamed
   */
  async quarantineConflictedFile(conceptId: string): Promise<string> {
    if (!this.rootDirectoryHandle) {
      throw new Error('Storage service not initialized. Call initialize() first.');
    }

    try {
      const wikiHandle = await this.rootDirectoryHandle.getDirectoryHandle('wiki', { create: false });
      const progressHandle = await wikiHandle.getDirectoryHandle('progress', { create: false });
      const conceptsHandle = await progressHandle.getDirectoryHandle('concepts', { create: false });

      // Read the conflicted file content
      const sourceFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json`);
      const sourceFile = await sourceFileHandle.getFile();
      const content = await sourceFile.text();

      // Write to new file with .conflict extension
      const conflictFileHandle = await conceptsHandle.getFileHandle(`${conceptId}.json.conflict`, { create: true });
      const writable = await conflictFileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Delete the original file
      await conceptsHandle.removeEntry(`${conceptId}.json`);

      return `${this.CONCEPTS_DIR}/${conceptId}.json.conflict`;
    } catch (error) {
      throw new Error(
        `Failed to quarantine conflicted progress file for ${conceptId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detects unresolved git merge conflict markers (`<<<<<<<`, `=======`,
   * `>>>>>>>`) in file content, e.g. left behind after a conflicted merge
   * involving an individual concept progress file.
   *
   * Requirements: 2.1, 2.3
   *
   * @param content - Raw file content to scan
   * @returns true if any merge conflict marker is present
   */
  private hasMergeConflictMarkers(content: string): boolean {
    return (
      content.includes('<<<<<<<') ||
      content.includes('=======') ||
      content.includes('>>>>>>>')
    );
  }

  /**
   * Get the last modified timestamp of a progress file.
   * Used for detecting external file modifications.
   * 
   * Requirements: 2.1
   * 
   * @param conceptId - Kebab-case concept identifier
   * @returns Timestamp in milliseconds or null if file doesn't exist
   */
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

  /**
   * Validates a progress entry against the JSON schema.
   * 
   * @param data - Data to validate
   * @returns true if valid, false otherwise
   */
  private validateProgressEntry(data: unknown): data is ProgressEntry {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const entry = data as Record<string, unknown>;

    // Check required fields exist
    if (!entry['conceptId'] || !entry['conceptTitle'] || !entry['state'] || 
        !entry['lastAssessed'] || entry['assessmentCount'] === undefined || !entry['version']) {
      return false;
    }

    // Validate types
    if (typeof entry['conceptId'] !== 'string' || typeof entry['conceptTitle'] !== 'string' ||
        typeof entry['state'] !== 'string' || typeof entry['lastAssessed'] !== 'string' ||
        typeof entry['assessmentCount'] !== 'number' || typeof entry['version'] !== 'string') {
      return false;
    }

    // Validate progress state enum
    const validStates = ['Not_Started', 'In_Progress', 'Understood', 'Mastered'];
    if (!validStates.includes(entry['state'] as string)) {
      return false;
    }

    // Validate conceptId pattern (kebab-case)
    if (!/^[a-z0-9-]+$/.test(entry['conceptId'] as string)) {
      return false;
    }

    // Validate assessment count is non-negative
    if ((entry['assessmentCount'] as number) < 0) {
      return false;
    }

    // Validate version
    if (entry['version'] !== this.SCHEMA_VERSION) {
      return false;
    }

    return true;
  }

  /**
   * Validates an index against the JSON schema.
   * 
   * @param data - Data to validate
   * @returns true if valid, false otherwise
   */
  private validateIndex(data: unknown): data is ProgressIndex {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const index = data as Record<string, unknown>;

    // Check required fields exist
    if (!index['version'] || !index['lastUpdated'] || index['totalConcepts'] === undefined || !index['conceptIds']) {
      return false;
    }

    // Validate types
    if (typeof index['version'] !== 'string' || typeof index['lastUpdated'] !== 'string' ||
        typeof index['totalConcepts'] !== 'number' || !Array.isArray(index['conceptIds'])) {
      return false;
    }

    // Validate version
    if (index['version'] !== this.SCHEMA_VERSION) {
      return false;
    }

    // Validate totalConcepts is non-negative
    if ((index['totalConcepts'] as number) < 0) {
      return false;
    }

    // Validate conceptIds are all strings with kebab-case pattern
    const conceptIds = index['conceptIds'] as unknown[];
    for (const id of conceptIds) {
      if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
        return false;
      }
    }

    // Check for uniqueness
    if (new Set(conceptIds).size !== conceptIds.length) {
      return false;
    }

    return true;
  }

  /**
   * Writes JSON data to a file with exponential backoff retry logic.
   * Retries up to 3 times with delays of 100ms, 200ms, and 400ms.
   * 
   * Requirements: 2.3
   * 
   * @param path - Relative path from workspace root
   * @param data - Data to serialize and write
   * @throws Error if file cannot be written after all retries
   */
  private async writeWithRetry<T>(path: string, data: T): Promise<void> {
    const delays = [100, 200, 400]; // Exponential backoff delays in milliseconds
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        await this.writeJSONFile(path, data);
        return; // Success, exit early
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this was the last attempt, don't delay
        if (attempt === delays.length) {
          break;
        }

        // Wait before next retry
        await this.delay(delays[attempt]);
      }
    }

    // All retries failed
    throw new Error(
      `Failed to write file ${path} after ${delays.length + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Helper method to create a delay using Promise.
   * 
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper method to get a file handle by path.
   * Navigates through directory hierarchy and returns the file handle.
   * 
   * @param path - Relative path from workspace root
   * @param create - Whether to create the file if it doesn't exist
   * @returns FileSystemFileHandle or null if file doesn't exist and create is false
   */
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

    // Navigate through directories
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create });
    }

    // Get file handle
    return await currentHandle.getFileHandle(filename, { create });
  }
}
