export interface FileStats {
  size: number;
  created: Date;
  modified: Date;
}

export interface FileSystemPort {
  readRawFile(filePath: string): Promise<string>;
  readWikiFile(filePath: string): Promise<string>;
  writeWikiFile(filePath: string, content: string): Promise<void>;
  listRawFiles(pattern: string): Promise<string[]>;
  listWikiFiles(pattern: string): Promise<string[]>;
  rawFileExists(filePath: string): Promise<boolean>;
  wikiFileExists(filePath: string): Promise<boolean>;
  getRawFileStats(filePath: string): Promise<FileStats>;
  getWikiFileStats(filePath: string): Promise<FileStats>;
  ensureWikiDir(dirPath: string): Promise<void>;
  deleteWikiFile(filePath: string): Promise<void>;

  /**
   * Creates a directory (recursively) relative to the workspace root.
   * Idempotent: succeeds if the directory already exists.
   * Enables scaffolding of raw/ and wiki/ trees.
   */
  ensureDir(dirPath: string): Promise<void>;

  /**
   * Reads a UTF-8 text file at a path relative to the workspace root.
   * Unlike readRawFile/readWikiFile, the path is not confined to raw/ or
   * wiki/, enabling reads from arbitrary workspace locations such as
   * research session directories.
   */
  readFile(filePath: string): Promise<string>;

  /**
   * Writes a UTF-8 text file at a path relative to the workspace root,
   * creating parent directories as needed. Unlike writeWikiFile, the path
   * is not confined to wiki/, enabling writes to arbitrary workspace
   * locations such as research session directories.
   */
  writeFile(filePath: string, content: string): Promise<void>;

  /**
   * Recursively deletes a directory (and all its contents) at a path
   * relative to the workspace root. Idempotent: succeeds even if the
   * directory does not exist. Enables cleanup of research session
   * directories on failed/aborted session creation.
   */
  deleteDir(dirPath: string): Promise<void>;
}
