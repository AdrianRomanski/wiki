import { WikiPage } from '@wiki/domain-models';
import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { QueryEngine } from './query-engine';
import { SourceFilters } from './search-options';

export class FindSourcesUseCase {
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

  async execute(filters?: SourceFilters): Promise<WikiPage[]> {
    return this.queryEngine.findSources(filters);
  }
}
