import { WikiPage } from '@wiki/domain-models';
import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { QueryEngine } from './query-engine';

export class SearchByTagUseCase {
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

  async execute(tag: string): Promise<WikiPage[]> {
    return this.queryEngine.searchByTag(tag);
  }
}
