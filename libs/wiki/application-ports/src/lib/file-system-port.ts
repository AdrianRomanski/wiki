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
}
