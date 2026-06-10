import { RawSource, WikiPage } from '@wiki/domain-models';
import {
  EntityPageOptions,
  ConceptPageOptions,
  SourceSummaryOptions,
} from '@wiki/application-generators';

export interface IngestionWorkflowOptions
  extends Omit<GenerateWikiPagesOptions, 'source'> {
  sourcePath: string;
}

export interface IngestionWorkflowResult extends GenerateWikiPagesResult {
  source: RawSource;
}

export interface GenerateWikiPagesOptions {
  source: RawSource;
  entityOptions?: Omit<EntityPageOptions, 'sources' | 'created'>;
  conceptOptions?: Omit<ConceptPageOptions, 'sources' | 'created'>;
  sourceSummaryOptions?: Omit<SourceSummaryOptions, 'created'>;
  addCrossReferences?: boolean;
}

export interface GenerateWikiPagesResult {
  pages: WikiPage[];
  writtenPaths: string[];
}

export interface UpdatePageOptions {
  pagePath: string;
  changes: string;
  reason: string;
}

export interface UpdatePageResult {
  page: WikiPage;
  writtenPath: string;
}

export interface GenerateIndexOptions {
  regenerate?: boolean;
}

export interface GenerateIndexResult {
  indexPath: string;
  entryCount: number;
}

export interface MaintenanceOptions {
  detectDuplicates?: boolean;
  detectContradictions?: boolean;
  detectBrokenLinks?: boolean;
  detectOrphans?: boolean;
}

export interface MaintenanceResult {
  reportPath: string;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class WorkflowError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class IngestionError extends Error {
  constructor(message: string, public sourcePath: string, public cause?: Error) {
    super(message);
    this.name = 'IngestionError';
  }
}

export function validateWorkflowOptions(
  options: IngestionWorkflowOptions
): ValidationResult {
  const errors: string[] = [];

  if (!options.sourcePath || options.sourcePath.trim() === '') {
    errors.push('sourcePath is required');
  }

  const hasEntityOptions = options.entityOptions !== undefined;
  const hasConceptOptions = options.conceptOptions !== undefined;
  const hasSourceSummaryOptions = options.sourceSummaryOptions !== undefined;

  if (!hasEntityOptions && !hasConceptOptions && !hasSourceSummaryOptions) {
    errors.push('At least one of entityOptions, conceptOptions, or sourceSummaryOptions must be provided');
  }

  if (hasEntityOptions && options.entityOptions) {
    if (!options.entityOptions.name || options.entityOptions.name.trim() === '') {
      errors.push('entityOptions.name is required');
    }
    if (!options.entityOptions.definition || options.entityOptions.definition.trim() === '') {
      errors.push('entityOptions.definition is required');
    }
  }

  if (hasConceptOptions && options.conceptOptions) {
    if (!options.conceptOptions.name || options.conceptOptions.name.trim() === '') {
      errors.push('conceptOptions.name is required');
    }
    if (!options.conceptOptions.explanation || options.conceptOptions.explanation.trim() === '') {
      errors.push('conceptOptions.explanation is required');
    }
  }

  if (hasSourceSummaryOptions && options.sourceSummaryOptions) {
    if (!options.sourceSummaryOptions.title || options.sourceSummaryOptions.title.trim() === '') {
      errors.push('sourceSummaryOptions.title is required');
    }
    if (!options.sourceSummaryOptions.keyPoints || options.sourceSummaryOptions.keyPoints.length === 0) {
      errors.push('sourceSummaryOptions.keyPoints must contain at least one point');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
