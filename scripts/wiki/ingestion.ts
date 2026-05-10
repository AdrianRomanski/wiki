/**
 * Raw source ingestion handler for the LLM Wiki Second Brain system.
 * 
 * This module handles the ingestion of raw source documents:
 * - Reading files from raw/ directory
 * - Extracting metadata (format, category, added date)
 * - Preserving original files without modification
 * - Supporting markdown, PDF, text, and code file formats
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 4.4
 */

import { RawSource, WikiPage } from './models.js';
import { readRawFile, getRawFileStats, listRawFiles, FileSystemConfig, DEFAULT_CONFIG } from './filesystem.js';
import { generateEntityPage, generateConceptPage, generateSourceSummaryPage, EntityPageOptions, ConceptPageOptions, SourceSummaryOptions } from './generators.js';
import { detectCrossReferences, insertCrossReferenceLinks, loadExistingPageTitles } from './cross-reference.js';
import { writeWikiFile } from './filesystem.js';
import { addEntityToIndex, addConceptToIndex, addSourceToIndex } from './index-manager.js';
import { recordIngestion, recordCreation } from './activity-log.js';
import * as path from 'path';

/**
 * Error thrown when raw source ingestion fails.
 */
export class IngestionError extends Error {
  constructor(message: string, public sourcePath: string, public cause?: Error) {
    super(message);
    this.name = 'IngestionError';
  }
}

/**
 * Determines the file format based on file extension.
 * 
 * @param filename - The filename to analyze
 * @returns The file format
 */
function determineFormat(filename: string): 'md' | 'pdf' | 'txt' | 'code' {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.md':
    case '.markdown':
      return 'md';
    case '.pdf':
      return 'pdf';
    case '.txt':
      return 'txt';
    case '.ts':
    case '.js':
    case '.tsx':
    case '.jsx':
    case '.py':
    case '.java':
    case '.c':
    case '.cpp':
    case '.h':
    case '.cs':
    case '.go':
    case '.rs':
    case '.rb':
    case '.php':
    case '.swift':
    case '.kt':
    case '.scala':
    case '.sh':
    case '.bash':
    case '.json':
    case '.xml':
    case '.yaml':
    case '.yml':
    case '.html':
    case '.css':
    case '.scss':
    case '.sass':
    case '.less':
      return 'code';
    default:
      return 'txt';
  }
}

/**
 * Extracts the category from a file path.
 * The category is the first directory in the path (e.g., 'articles', 'papers').
 * 
 * @param filePath - The file path relative to raw/
 * @returns The category name, or 'uncategorized' if no subdirectory
 */
function extractCategory(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  return 'uncategorized';
}

/**
 * Reads a raw source file and extracts its metadata.
 * 
 * This function reads the file content and metadata without modifying
 * the original file, preserving immutability.
 * 
 * @param filePath - Path to the raw source file (relative to raw/)
 * @param config - File system configuration (optional)
 * @returns RawSource object with metadata and content
 * @throws {IngestionError} If the file cannot be read or processed
 * 
 * @example
 * ```typescript
 * const source = await ingestRawSource('articles/angular-aria.md');
 * console.log(source.format); // 'md'
 * console.log(source.category); // 'articles'
 * ```
 */
export async function ingestRawSource(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<RawSource> {
  try {
    // Read file content
    const content = await readRawFile(filePath, config);
    
    // Get file stats
    const stats = await getRawFileStats(filePath, config);
    
    // Extract metadata
    const filename = path.basename(filePath);
    const format = determineFormat(filename);
    const category = extractCategory(filePath);
    
    return {
      path: filePath,
      filename,
      format,
      category,
      addedDate: stats.ctime, // Use creation time as added date
      fileSize: stats.size,
      content,
      ingested: false,
      generatedPages: [],
    };
  } catch (error) {
    throw new IngestionError(
      `Failed to ingest raw source: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Lists all raw source files in the raw/ directory.
 * 
 * @param config - File system configuration (optional)
 * @returns Array of file paths relative to raw/
 * 
 * @example
 * ```typescript
 * const sources = await listRawSources();
 * // Returns: ['articles/angular-aria.md', 'papers/wcag-2.1.pdf', ...]
 * ```
 */
export async function listRawSources(
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<string[]> {
  // List all files in raw/ directory
  return await listRawFiles('**/*', config);
}

/**
 * Ingests multiple raw source files.
 * 
 * @param filePaths - Array of file paths to ingest
 * @param config - File system configuration (optional)
 * @returns Array of RawSource objects
 * 
 * @example
 * ```typescript
 * const sources = await ingestMultipleRawSources([
 *   'articles/angular-aria.md',
 *   'papers/wcag-2.1.pdf'
 * ]);
 * ```
 */
export async function ingestMultipleRawSources(
  filePaths: string[],
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<RawSource[]> {
  const sources: RawSource[] = [];
  const errors: { path: string; error: Error }[] = [];
  
  for (const filePath of filePaths) {
    try {
      const source = await ingestRawSource(filePath, config);
      sources.push(source);
    } catch (error) {
      errors.push({ path: filePath, error: error as Error });
    }
  }
  
  // Log errors but don't fail the entire operation
  if (errors.length > 0) {
    console.warn(`Failed to ingest ${errors.length} source(s):`);
    errors.forEach(({ path, error }) => {
      console.warn(`  - ${path}: ${error.message}`);
    });
  }
  
  return sources;
}

/**
 * Options for generating wiki pages from a raw source.
 */
export interface GenerateWikiPagesOptions {
  /** The raw source to process */
  source: RawSource;
  
  /** Entity page options (if generating an entity page) */
  entityOptions?: Omit<EntityPageOptions, 'sources' | 'created'>;
  
  /** Concept page options (if generating a concept page) */
  conceptOptions?: Omit<ConceptPageOptions, 'sources' | 'created'>;
  
  /** Source summary options (if generating a source summary) */
  sourceSummaryOptions?: Omit<SourceSummaryOptions, 'rawSourcePath' | 'created'>;
  
  /** Whether to add cross-references automatically */
  addCrossReferences?: boolean;
  
  /** File system configuration */
  config?: FileSystemConfig;
}

/**
 * Result of generating wiki pages from a raw source.
 */
export interface GenerateWikiPagesResult {
  /** The generated wiki pages */
  pages: WikiPage[];
  
  /** Paths where the pages were written */
  writtenPaths: string[];
}

/**
 * Generates wiki pages from a raw source.
 * 
 * This function analyzes the raw source and generates appropriate wiki pages
 * (entity, concept, or source summary) based on the provided options.
 * 
 * @param options - Generation options
 * @returns Result with generated pages and written paths
 * @throws {IngestionError} If page generation fails
 * 
 * @example
 * ```typescript
 * const result = await generateWikiPagesFromSource({
 *   source: rawSource,
 *   sourceSummaryOptions: {
 *     title: 'Angular ARIA Guide',
 *     keyPoints: ['Use semantic HTML', 'Test with screen readers'],
 *     tags: ['angular', 'accessibility']
 *   }
 * });
 * ```
 */
export async function generateWikiPagesFromSource(
  options: GenerateWikiPagesOptions
): Promise<GenerateWikiPagesResult> {
  const {
    source,
    entityOptions,
    conceptOptions,
    sourceSummaryOptions,
    addCrossReferences = true,
    config = DEFAULT_CONFIG,
  } = options;
  
  const pages: WikiPage[] = [];
  const writtenPaths: string[] = [];
  
  try {
    // Load existing page titles for cross-reference detection
    const wikiDir = path.join(config.rootDir, config.wikiDir);
    const existingTitles = addCrossReferences ? await loadExistingPageTitles(wikiDir) : [];
    
    // Generate entity page if options provided
    if (entityOptions) {
      const generated = generateEntityPage({
        ...entityOptions,
        sources: [source.path],
      });
      
      // Add cross-references if enabled
      let content = generated.content;
      if (addCrossReferences && existingTitles.length > 0) {
        const refs = detectCrossReferences({
          content,
          existingPages: existingTitles,
        });
        content = insertCrossReferenceLinks(content, refs);
      }
      
      // Write to file
      const filePath = `entities/${generated.filename}`;
      await writeWikiFile(filePath, content, config);
      writtenPaths.push(filePath);
      
      // Create WikiPage object
      const wikiPage: WikiPage = {
        path: filePath,
        filename: generated.filename,
        frontmatter: generated.frontmatter,
        content,
        sections: [], // TODO: Parse sections
        outgoingLinks: [], // TODO: Extract links
        incomingLinks: [],
      };
      pages.push(wikiPage);
      
      // Update index
      const description = entityOptions.definition.substring(0, 100);
      await addEntityToIndex(wikiPage, description);
      
      // Record creation in activity log
      await recordCreation(
        filePath,
        generated.frontmatter.title,
        'entity',
        source.path,
        generated.frontmatter.tags
      );
    }
    
    // Generate concept page if options provided
    if (conceptOptions) {
      const generated = generateConceptPage({
        ...conceptOptions,
        sources: [source.path],
      });
      
      // Add cross-references if enabled
      let content = generated.content;
      if (addCrossReferences && existingTitles.length > 0) {
        const refs = detectCrossReferences({
          content,
          existingPages: existingTitles,
        });
        content = insertCrossReferenceLinks(content, refs);
      }
      
      // Write to file
      const filePath = `concepts/${generated.filename}`;
      await writeWikiFile(filePath, content, config);
      writtenPaths.push(filePath);
      
      // Create WikiPage object
      const wikiPage: WikiPage = {
        path: filePath,
        filename: generated.filename,
        frontmatter: generated.frontmatter,
        content,
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };
      pages.push(wikiPage);
      
      // Update index
      const description = conceptOptions.explanation.substring(0, 100);
      await addConceptToIndex(wikiPage, description);
      
      // Record creation in activity log
      await recordCreation(
        filePath,
        generated.frontmatter.title,
        'concept',
        source.path,
        generated.frontmatter.tags
      );
    }
    
    // Generate source summary if options provided
    if (sourceSummaryOptions) {
      const generated = generateSourceSummaryPage({
        ...sourceSummaryOptions,
        rawSourcePath: source.path,
      });
      
      // Add cross-references if enabled
      let content = generated.content;
      if (addCrossReferences && existingTitles.length > 0) {
        const refs = detectCrossReferences({
          content,
          existingPages: existingTitles,
        });
        content = insertCrossReferenceLinks(content, refs);
      }
      
      // Write to file
      const filePath = `sources/${generated.filename}`;
      await writeWikiFile(filePath, content, config);
      writtenPaths.push(filePath);
      
      // Create WikiPage object
      const wikiPage: WikiPage = {
        path: filePath,
        filename: generated.filename,
        frontmatter: generated.frontmatter,
        content,
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };
      pages.push(wikiPage);
      
      // Update index
      const description = sourceSummaryOptions.keyPoints[0] || 'No description';
      await addSourceToIndex(wikiPage, description);
      
      // Record creation in activity log
      await recordCreation(
        filePath,
        generated.frontmatter.title,
        'source',
        source.path,
        generated.frontmatter.tags
      );
    }
    
    // Record ingestion in activity log
    if (pages.length > 0) {
      await recordIngestion(source.path, writtenPaths);
    }
    
    return {
      pages,
      writtenPaths,
    };
  } catch (error) {
    throw new IngestionError(
      `Failed to generate wiki pages from source: ${source.path}`,
      source.path,
      error as Error
    );
  }
}
