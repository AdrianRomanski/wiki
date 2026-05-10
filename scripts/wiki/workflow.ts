/**
 * Complete ingestion workflow for the LLM Wiki Second Brain system.
 * 
 * This module provides the end-to-end workflow that:
 * 1. Reads raw source files
 * 2. Generates wiki pages with cross-references
 * 3. Updates the index page
 * 4. Records activity log entries
 * 
 * Requirements: 4.1, 5.6, 7.2
 */

import {
  ingestRawSource,
  generateWikiPagesFromSource,
  GenerateWikiPagesOptions,
  GenerateWikiPagesResult,
} from './ingestion.js';
import { RawSource } from './models.js';
import { FileSystemConfig, DEFAULT_CONFIG } from './filesystem.js';

/**
 * Options for the complete ingestion workflow.
 */
export interface IngestionWorkflowOptions extends Omit<GenerateWikiPagesOptions, 'source'> {
  /** Path to the raw source file (relative to raw/) */
  sourcePath: string;
}

/**
 * Result of the complete ingestion workflow.
 */
export interface IngestionWorkflowResult extends GenerateWikiPagesResult {
  /** The ingested raw source */
  source: RawSource;
}

/**
 * Executes the complete ingestion workflow for a single raw source.
 * 
 * This function orchestrates the entire process:
 * 1. Ingests the raw source file (preserving immutability)
 * 2. Generates wiki pages with appropriate cross-references
 * 3. Updates the index page with new entries
 * 4. Records activity log entries for ingestion and page creation
 * 
 * All steps are atomic - if any step fails, the entire workflow fails
 * and no partial state is left behind.
 * 
 * @param options - Workflow configuration
 * @returns Result with source, generated pages, and written paths
 * @throws {IngestionError} If any step of the workflow fails
 * 
 * @example
 * ```typescript
 * // Ingest an article and generate a source summary
 * const result = await runIngestionWorkflow({
 *   sourcePath: 'articles/angular-aria.md',
 *   sourceSummaryOptions: {
 *     title: 'Angular ARIA Guide',
 *     author: 'Angular Team',
 *     date: '2024-05-10',
 *     keyPoints: ['Use semantic HTML', 'Test with screen readers'],
 *     tags: ['angular', 'accessibility']
 *   }
 * });
 * 
 * console.log(`Generated ${result.pages.length} pages`);
 * console.log(`Written to: ${result.writtenPaths.join(', ')}`);
 * ```
 */
export async function runIngestionWorkflow(
  options: IngestionWorkflowOptions
): Promise<IngestionWorkflowResult> {
  const { sourcePath, ...generateOptions } = options;
  const config = options.config || DEFAULT_CONFIG;
  
  // Step 1: Ingest raw source
  // This reads the file and extracts metadata without modifying the original
  const source = await ingestRawSource(sourcePath, config);
  
  // Step 2: Generate wiki pages
  // This creates wiki pages, updates index, and records activity log
  const result = await generateWikiPagesFromSource({
    source,
    ...generateOptions,
    config,
  });
  
  // Return combined result
  return {
    source,
    pages: result.pages,
    writtenPaths: result.writtenPaths,
  };
}

/**
 * Executes the ingestion workflow for multiple raw sources.
 * 
 * This function processes multiple sources in sequence, continuing even
 * if some sources fail. Failed sources are logged but don't stop the
 * overall process.
 * 
 * @param workflowOptions - Array of workflow configurations
 * @returns Results for successfully processed sources
 * 
 * @example
 * ```typescript
 * const results = await runBatchIngestionWorkflow([
 *   {
 *     sourcePath: 'articles/article1.md',
 *     sourceSummaryOptions: { ... }
 *   },
 *   {
 *     sourcePath: 'articles/article2.md',
 *     sourceSummaryOptions: { ... }
 *   }
 * ]);
 * 
 * console.log(`Processed ${results.length} sources`);
 * ```
 */
export async function runBatchIngestionWorkflow(
  workflowOptions: IngestionWorkflowOptions[]
): Promise<IngestionWorkflowResult[]> {
  const results: IngestionWorkflowResult[] = [];
  const errors: { sourcePath: string; error: Error }[] = [];
  
  for (const options of workflowOptions) {
    try {
      const result = await runIngestionWorkflow(options);
      results.push(result);
    } catch (error) {
      errors.push({
        sourcePath: options.sourcePath,
        error: error as Error,
      });
    }
  }
  
  // Log errors but don't fail the entire batch
  if (errors.length > 0) {
    console.warn(`\nFailed to process ${errors.length} source(s):`);
    errors.forEach(({ sourcePath, error }) => {
      console.warn(`  - ${sourcePath}: ${error.message}`);
    });
  }
  
  return results;
}

/**
 * Validates that a workflow configuration is complete and valid.
 * 
 * @param options - Workflow options to validate
 * @returns Validation result with any error messages
 * 
 * @example
 * ```typescript
 * const validation = validateWorkflowOptions(options);
 * if (!validation.valid) {
 *   console.error('Invalid options:', validation.errors);
 * }
 * ```
 */
export function validateWorkflowOptions(
  options: IngestionWorkflowOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check that source path is provided
  if (!options.sourcePath || options.sourcePath.trim() === '') {
    errors.push('sourcePath is required');
  }
  
  // Check that at least one page type option is provided
  const hasEntityOptions = options.entityOptions !== undefined;
  const hasConceptOptions = options.conceptOptions !== undefined;
  const hasSourceSummaryOptions = options.sourceSummaryOptions !== undefined;
  
  if (!hasEntityOptions && !hasConceptOptions && !hasSourceSummaryOptions) {
    errors.push('At least one of entityOptions, conceptOptions, or sourceSummaryOptions must be provided');
  }
  
  // Validate entity options if provided
  if (hasEntityOptions) {
    if (!options.entityOptions!.name || options.entityOptions!.name.trim() === '') {
      errors.push('entityOptions.name is required');
    }
    if (!options.entityOptions!.definition || options.entityOptions!.definition.trim() === '') {
      errors.push('entityOptions.definition is required');
    }
  }
  
  // Validate concept options if provided
  if (hasConceptOptions) {
    if (!options.conceptOptions!.name || options.conceptOptions!.name.trim() === '') {
      errors.push('conceptOptions.name is required');
    }
    if (!options.conceptOptions!.explanation || options.conceptOptions!.explanation.trim() === '') {
      errors.push('conceptOptions.explanation is required');
    }
  }
  
  // Validate source summary options if provided
  if (hasSourceSummaryOptions) {
    if (!options.sourceSummaryOptions!.title || options.sourceSummaryOptions!.title.trim() === '') {
      errors.push('sourceSummaryOptions.title is required');
    }
    if (!options.sourceSummaryOptions!.keyPoints || options.sourceSummaryOptions!.keyPoints.length === 0) {
      errors.push('sourceSummaryOptions.keyPoints must contain at least one point');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
