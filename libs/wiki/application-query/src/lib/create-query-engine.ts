import { QueryEngine } from './query-engine';
import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';

export function createQueryEngine(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
): QueryEngine {
  return new QueryEngine(
    fileSystemPort,
    frontmatterPort,
    markdownPort
  );
}
