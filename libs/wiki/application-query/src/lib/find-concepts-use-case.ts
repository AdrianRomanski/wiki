import { WikiPage } from '@wiki/domain-models';
import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { QueryEngine } from './query-engine';

export class FindConceptsUseCase {
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

  async execute(namePattern?: string): Promise<WikiPage[]> {
    return this.queryEngine.findConcepts(namePattern);
  }
}
