export interface FileSystemConfig {
  rootDir: string;
  rawDir: string;
  wikiDir: string;
}

export interface WikiSystemConfig {
  fileSystem: FileSystemConfig;
}
