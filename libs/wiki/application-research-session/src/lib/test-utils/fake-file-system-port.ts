/**
 * Shared in-memory FakeFileSystemPort test double for application-research-session specs.
 *
 * Implements the full FileSystemPort interface. Two independent in-memory stores
 * are maintained:
 * - `files`: arbitrary workspace-relative paths, backing readFile/writeFile/ensureDir/deleteDir
 *   (used for session.json, article-content.json, article-analysis.md, findings-summary.md, etc.)
 * - `wikiFiles`: wiki-relative paths (without the "wiki/" prefix), backing
 *   readWikiFile/writeWikiFile/wikiFileExists/listWikiFiles/ensureWikiDir/deleteWikiFile
 *   (used for entity/concept/source page publication in finalize-step tests)
 */

import type { FileSystemPort, FileStats } from '@wiki/application-ports';

export class FakeFileSystemPort implements FileSystemPort {
  private readonly files = new Map<string, string>();
  private readonly wikiFiles = new Map<string, string>();
  /** Wiki-relative path prefixes for which writeWikiFile should throw, to simulate I/O failure. */
  private readonly failingWikiWritePrefixes: string[] = [];

  // ── Arbitrary workspace-relative file I/O ──────────────────────────────────

  async readFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      throw new Error(`FakeFileSystemPort: file not found: ${filePath}`);
    }
    return content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  async ensureDir(_dirPath: string): Promise<void> {
    // No-op: directories are implicit in the in-memory map.
    return;
  }

  async deleteDir(dirPath: string): Promise<void> {
    const prefix = `${dirPath}/`;
    for (const key of Array.from(this.files.keys())) {
      if (key === dirPath || key.startsWith(prefix)) {
        this.files.delete(key);
      }
    }
  }

  // ── Wiki-scoped file I/O (wiki/ prefix stripped by callers) ────────────────

  async readWikiFile(filePath: string): Promise<string> {
    const content = this.wikiFiles.get(filePath);
    if (content === undefined) {
      throw new Error(`FakeFileSystemPort: wiki file not found: ${filePath}`);
    }
    return content;
  }

  async writeWikiFile(filePath: string, content: string): Promise<void> {
    if (this.failingWikiWritePrefixes.some((prefix) => filePath.startsWith(prefix))) {
      throw new Error(`FakeFileSystemPort: simulated write failure for ${filePath}`);
    }
    this.wikiFiles.set(filePath, content);
  }

  async wikiFileExists(filePath: string): Promise<boolean> {
    return this.wikiFiles.has(filePath);
  }

  async listWikiFiles(pattern: string): Promise<string[]> {
    // Supports simple "dir/*.md" patterns as used by GenerateManifestUseCase/GenerateIndexUseCase.
    const dirMatch = pattern.match(/^([^*]+)\/\*\.md$/);
    if (!dirMatch) return [];
    const dir = dirMatch[1];
    const prefix = `${dir}/`;
    return Array.from(this.wikiFiles.keys()).filter(
      (key) => key.startsWith(prefix) && key.endsWith('.md')
    );
  }

  async ensureWikiDir(_dirPath: string): Promise<void> {
    return;
  }

  async deleteWikiFile(filePath: string): Promise<void> {
    this.wikiFiles.delete(filePath);
  }

  async getWikiFileStats(): Promise<FileStats> {
    return { modified: new Date(), size: 0, created: new Date() };
  }

  // ── Raw-scoped file I/O (unused by session-manager use cases) ─────────────

  async readRawFile(): Promise<string> {
    return '';
  }

  async listRawFiles(): Promise<string[]> {
    return [];
  }

  async rawFileExists(): Promise<boolean> {
    return false;
  }

  async getRawFileStats(): Promise<FileStats> {
    return { modified: new Date(), size: 0, created: new Date() };
  }

  // ── Test helpers ────────────────────────────────────────────────────────────

  /** Directly sets a workspace-relative file's content (test setup helper). */
  setFile(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  /** Reads back a workspace-relative file's content synchronously (test assertion helper). */
  getFile(filePath: string): string | undefined {
    return this.files.get(filePath);
  }

  /** Returns whether a workspace-relative file exists (test assertion helper). */
  hasFile(filePath: string): boolean {
    return this.files.has(filePath);
  }

  /** Directly sets a wiki-relative file's content (test setup helper). */
  setWikiFile(filePath: string, content: string): void {
    this.wikiFiles.set(filePath, content);
  }

  /** Reads back a wiki-relative file's content synchronously (test assertion helper). */
  getWikiFile(filePath: string): string | undefined {
    return this.wikiFiles.get(filePath);
  }

  /** Returns whether a wiki-relative file exists (test assertion helper). */
  hasWikiFile(filePath: string): boolean {
    return this.wikiFiles.has(filePath);
  }

  /**
   * Marks a wiki-relative path prefix (e.g. "entities/") so that any
   * writeWikiFile call targeting a path with that prefix throws, simulating
   * a blocked directory or I/O failure (test setup helper).
   */
  blockWikiWritesUnder(prefix: string): void {
    this.failingWikiWritePrefixes.push(prefix);
  }
}
