import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { QueryEngine } from './query-engine';
import { SearchResult } from './search-result';
import { SearchOptions } from './search-options';

export class SearchUseCase {
  private queryEngine: QueryEngine;

  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  ) {
    this.queryEngine = new QueryEngine(
      fileSystemPort,
      frontmatterPort,
      markdownPort
    );
  }

  async execute(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    return this.queryEngine.search(query, options);
  }
}
