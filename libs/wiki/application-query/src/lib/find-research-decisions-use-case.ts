import { WikiPage } from '@wiki/domain-models';
import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { QueryEngine } from './query-engine';

export class FindResearchDecisionsUseCase {
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
    options: {
      tag?: string;
      libraryName?: string;
      sessionId?: string;
      maxResults?: number;
    } = {}
  ): Promise<WikiPage[]> {
    return this.queryEngine.findResearchDecisions(options);
  }
}
