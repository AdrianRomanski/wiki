import { FileSystemAdapter, FileSystemConfig } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import type { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';

export interface Adapters {
  fileSystem: FileSystemPort;
  frontmatter: FrontmatterPort;
  markdown: MarkdownPort;
}

export function createAdapters(config?: FileSystemConfig): Adapters {
  return {
    fileSystem: new FileSystemAdapter(config),
    frontmatter: new FrontmatterAdapter(),
    markdown: new MarkdownAdapter(),
  };
}
