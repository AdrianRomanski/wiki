import {
  GenerateEntityPageUseCase,
  GenerateConceptPageUseCase,
  GenerateSourceSummaryUseCase,
} from '@wiki/application-generators';
import { QueryEngine } from '@wiki/application-query';
import {
  DetectCrossReferencesUseCase,
  ValidateWikiLinksUseCase,
} from '@wiki/application-cross-reference';
import type {
  FileSystemPort,
  MarkdownPort,
  FrontmatterPort,
} from '@wiki/application-ports';
import { WikiSystem } from './wiki-system';

export function createWikiSystem(
  fileSystemAdapter: FileSystemPort,
  markdownAdapter: MarkdownPort,
  frontmatterAdapter: FrontmatterPort
): WikiSystem {
  return {
    generators: {
      entity: new GenerateEntityPageUseCase(
        markdownAdapter,
        frontmatterAdapter
      ),
      concept: new GenerateConceptPageUseCase(
        markdownAdapter,
        frontmatterAdapter
      ),
      source: new GenerateSourceSummaryUseCase(
        markdownAdapter,
        frontmatterAdapter
      ),
    },
    query: new QueryEngine(
      fileSystemAdapter,
      frontmatterAdapter,
      markdownAdapter
    ),
    crossReference: {
      detect: new DetectCrossReferencesUseCase(markdownAdapter),
      validate: new ValidateWikiLinksUseCase(markdownAdapter),
    },
  };
}
