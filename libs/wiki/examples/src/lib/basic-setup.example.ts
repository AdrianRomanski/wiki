import { createAdapters, createWikiSystem } from '@wiki/core';
import type { FileSystemConfig } from '@wiki/infrastructure-filesystem';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

export function basicSetupExample() {
  // Configure file system paths for raw/ and wiki/ directories
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  // Instantiate FileSystemAdapter for reading and writing wiki files
  const fileSystemAdapter = new FileSystemAdapter(config);
  
  // Instantiate MarkdownAdapter for parsing and formatting markdown content
  const markdownAdapter = new MarkdownAdapter();
  
  // Instantiate FrontmatterAdapter for processing YAML frontmatter
  const frontmatterAdapter = new FrontmatterAdapter();
  
  // Create WikiSystem instance using the factory function
  const wikiSystem = createWikiSystem(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  return wikiSystem;
}

export function basicSetupWithHelperExample() {
  // Configure file system paths for raw/ and wiki/ directories
  const config: FileSystemConfig = {
    rootDir: process.cwd(),
    rawDir: 'raw',
    wikiDir: 'wiki',
  };

  // Use helper function to create all adapters at once
  const adapters = createAdapters(config);
  
  // Create WikiSystem instance using the factory function
  const wikiSystem = createWikiSystem(
    adapters.fileSystem,
    adapters.markdown,
    adapters.frontmatter
  );

  return wikiSystem;
}
