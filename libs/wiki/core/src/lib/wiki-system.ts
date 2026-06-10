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

export interface WikiSystem {
  generators: {
    entity: GenerateEntityPageUseCase;
    concept: GenerateConceptPageUseCase;
    source: GenerateSourceSummaryUseCase;
  };
  query: QueryEngine;
  crossReference: {
    detect: DetectCrossReferencesUseCase;
    validate: ValidateWikiLinksUseCase;
  };
}
