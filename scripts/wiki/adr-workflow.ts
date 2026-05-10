/**
 * ADR Ingestion Workflow Module
 * 
 * Orchestrates the complete ADR ingestion workflow from research session
 * to wiki pages, including copying, metadata extraction, page generation,
 * cross-referencing, indexing, and git integration.
 */

import { FileSystemConfig, WikiPage } from './models.js';
import { SessionReference } from './research-session-linker.js';

/**
 * Options for the ADR ingestion workflow.
 */
export interface ADRIngestionOptions {
  /** Path to the research session directory */
  sessionPath: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Whether to generate entity pages for libraries */
  generateEntityPages?: boolean;
  
  /** Whether to add cross-references automatically */
  addCrossReferences?: boolean;
  
  /** File system configuration */
  config?: FileSystemConfig;
}

/**
 * Result of the ADR ingestion workflow.
 */
export interface ADRIngestionResult {
  /** The copied ADR in raw/ */
  rawADRPath: string;
  
  /** Generated Source_Summary page */
  sourceSummary: WikiPage;
  
  /** Generated Entity_Page entries for libraries */
  entityPages: WikiPage[];
  
  /** All written file paths */
  writtenPaths: string[];
  
  /** Session reference information */
  sessionReference: SessionReference;
}

/**
 * Error thrown when ADR ingestion workflow fails.
 */
export class ADRIngestionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ADRIngestionError';
  }
}

/**
 * Executes the complete ADR ingestion workflow.
 * 
 * This function orchestrates:
 * 1. Copy ADR from research session to raw/
 * 2. Extract metadata from ADR
 * 3. Generate Source_Summary with research metadata
 * 4. Generate Entity_Page entries for libraries
 * 5. Add session references
 * 6. Add cross-references to existing pages
 * 7. Update index page
 * 8. Record activity log
 * 9. Commit to git
 * 
 * @param options - Workflow configuration
 * @returns Result with generated pages and paths
 * @throws {ADRIngestionError} If any step fails
 */
export async function runADRIngestionWorkflow(
  options: ADRIngestionOptions
): Promise<ADRIngestionResult> {
  const {
    sessionPath,
    sessionId,
    generateEntityPages = true,
    addCrossReferences = true,
    config,
  } = options;
  
  try {
    // ========== PART 1: Copy and Extract ==========
    
    // Import required modules
    const fs = await import('fs');
    const path = await import('path');
    const { copyADRToRaw } = await import('./adr-copier.js');
    const { extractADRMetadata } = await import('./adr-metadata-extractor.js');
    const { extractSessionReference, validateSessionReference } = await import('./research-session-linker.js');
    const { readRawFile } = await import('./filesystem.js');
    
    // Validate session directory exists
    try {
      const stats = await fs.promises.stat(sessionPath);
      if (!stats.isDirectory()) {
        throw new ADRIngestionError(
          `Session path exists but is not a directory: ${sessionPath}`
        );
      }
    } catch (error) {
      throw new ADRIngestionError(
        `Session directory does not exist: ${sessionPath}`,
        error as Error
      );
    }
    
    // Copy ADR from session to raw/
    console.log(`Copying ADR from session: ${sessionPath}`);
    const copyResult = await copyADRToRaw({
      sessionPath,
      sessionId,
      config,
    });
    
    console.log(`ADR copied to: ${copyResult.targetPath}`);
    
    // Read copied ADR content from raw/
    const adrContent = await readRawFile(
      path.relative(config?.rootDir || process.cwd(), copyResult.targetPath).replace(/^raw\//, ''),
      config
    );
    
    // Extract ADR metadata
    console.log('Extracting ADR metadata...');
    const adrMetadata = await extractADRMetadata(adrContent);
    
    console.log(`Extracted metadata for: ${adrMetadata.title}`);
    console.log(`Libraries found: ${adrMetadata.libraries.join(', ')}`);
    
    // Extract session reference
    const sessionReference = extractSessionReference(adrMetadata);
    
    // Validate session reference and log warnings if invalid
    const validation = await validateSessionReference(sessionReference, config);
    if (!validation.valid) {
      console.warn('Session reference validation warnings:');
      validation.errors.forEach(error => console.warn(`  - ${error}`));
    }
    
    // ========== PART 2: Generate Wiki Pages ==========
    
    const { generateADRSourceSummary, generateLibraryEntityFromADR } = await import('./adr-generator-extensions.js');
    const { writeWikiFile, wikiFileExists } = await import('./filesystem.js');
    
    // Generate Source_Summary page
    console.log('Generating Source_Summary page...');
    const sourceSummaryPage = generateADRSourceSummary({
      metadata: adrMetadata,
      rawSourcePath: copyResult.targetPath,
      sessionPath,
      includeMatrices: true,
      config,
    });
    
    // Write Source_Summary to wiki/sources/
    const sourceSummaryPath = `sources/${sourceSummaryPage.filename}`;
    await writeWikiFile(sourceSummaryPath, sourceSummaryPage.content, config);
    console.log(`Source_Summary written to: ${sourceSummaryPath}`);
    
    const writtenPaths: string[] = [sourceSummaryPath];
    
    // Generate Entity_Page entries for libraries
    const entityPages: WikiPage[] = [];
    
    if (generateEntityPages && adrMetadata.libraries.length > 0) {
      console.log(`Generating Entity_Page entries for ${adrMetadata.libraries.length} libraries...`);
      
      for (const libraryName of adrMetadata.libraries) {
        try {
          const entityPage = generateLibraryEntityFromADR({
            libraryName,
            adrMetadata,
            sourceSummaryPath,
            config,
          });
          
          // Write Entity_Page to wiki/entities/
          const entityPath = `entities/${entityPage.filename}`;
          
          // Check if entity page already exists
          const exists = await wikiFileExists(entityPath, config);
          if (exists) {
            console.log(`Entity page already exists, skipping: ${entityPath}`);
            // TODO: In future, we could merge/update existing entity pages
            continue;
          }
          
          await writeWikiFile(entityPath, entityPage.content, config);
          console.log(`Entity_Page written to: ${entityPath}`);
          
          writtenPaths.push(entityPath);
          
          // Build WikiPage object for return value
          entityPages.push({
            path: entityPath,
            filename: entityPage.filename,
            frontmatter: entityPage.frontmatter as any,
            content: entityPage.content,
            sections: [],
            outgoingLinks: [],
            incomingLinks: [],
          });
        } catch (error) {
          console.error(`Failed to generate entity page for ${libraryName}:`, error);
          // Continue with other libraries
        }
      }
    }
    
    // ========== PART 3: Cross-Reference and Index ==========
    
    const { detectCrossReferences, insertCrossReferenceLinks, loadExistingPageTitles } = await import('./cross-reference.js');
    const { addSourceToIndex, addEntityToIndex } = await import('./index-manager.js');
    const { readWikiFile } = await import('./filesystem.js');
    
    if (addCrossReferences) {
      console.log('Adding cross-references...');
      
      // Load existing page titles
      const wikiDir = path.join(config?.rootDir || process.cwd(), config?.wikiDir || 'wiki');
      const existingPages = await loadExistingPageTitles(wikiDir);
      
      // Process Source_Summary for cross-references
      let sourceSummaryContent = await readWikiFile(sourceSummaryPath, config);
      const sourceRefs = detectCrossReferences({
        content: sourceSummaryContent,
        existingPages,
      });
      
      if (sourceRefs.length > 0) {
        sourceSummaryContent = insertCrossReferenceLinks(sourceSummaryContent, sourceRefs);
        await writeWikiFile(sourceSummaryPath, sourceSummaryContent, config);
        console.log(`Added ${sourceRefs.length} cross-references to Source_Summary`);
      }
      
      // Process Entity_Page entries for cross-references
      for (const entityPage of entityPages) {
        let entityContent = await readWikiFile(entityPage.path, config);
        const entityRefs = detectCrossReferences({
          content: entityContent,
          existingPages,
        });
        
        if (entityRefs.length > 0) {
          entityContent = insertCrossReferenceLinks(entityContent, entityRefs);
          await writeWikiFile(entityPage.path, entityContent, config);
          console.log(`Added ${entityRefs.length} cross-references to ${entityPage.filename}`);
        }
      }
      
      // TODO: Update existing Entity_Page and Concept_Page entries with backlinks
      // This would require scanning existing pages and adding backlinks to the new Source_Summary
      // For now, we rely on the cross-reference detection to handle this
    }
    
    // Update index page
    console.log('Updating index page...');
    
    // Add Source_Summary to index
    await addSourceToIndex(
      {
        path: sourceSummaryPath,
        filename: sourceSummaryPage.filename,
        frontmatter: sourceSummaryPage.frontmatter as any,
        content: sourceSummaryPage.content,
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      },
      `Research decision: ${adrMetadata.chosenOption}`
    );
    
    // Add Entity_Page entries to index
    for (const entityPage of entityPages) {
      await addEntityToIndex(
        entityPage,
        `Library evaluated in ${adrMetadata.title}`
      );
    }
    
    // ========== PART 4: Activity Log and Git ==========
    
    const { recordIngestion, recordCreation } = await import('./activity-log.js');
    const { commitWikiChanges, WikiChange } = await import('./git-integration.js');
    
    // Record ingestion in activity log
    console.log('Recording activity log...');
    await recordIngestion(
      copyResult.targetPath,
      writtenPaths,
      new Date()
    );
    
    // Record creation of Source_Summary
    await recordCreation(
      sourceSummaryPath,
      adrMetadata.title,
      'source',
      copyResult.targetPath,
      ['research', 'adr', 'decision', ...(adrMetadata.tags || [])],
      new Date()
    );
    
    // Record creation of Entity_Page entries
    for (const entityPage of entityPages) {
      await recordCreation(
        entityPage.path,
        entityPage.frontmatter.title,
        'entity',
        copyResult.targetPath,
        ['research', 'adr', 'library', ...(adrMetadata.tags || [])],
        new Date()
      );
    }
    
    // Commit to git
    console.log('Committing changes to git...');
    
    const changes: WikiChange[] = [
      {
        type: 'ingest',
        filePath: copyResult.targetPath,
        sourcePath: copyResult.targetPath,
        generatedPages: writtenPaths,
      },
    ];
    
    try {
      const commitHash = await commitWikiChanges(changes, config);
      console.log(`Changes committed: ${commitHash}`);
    } catch (error) {
      console.warn('Failed to commit changes to git:', error);
      // Don't fail the workflow if git commit fails
    }
    
    // Build and return result
    const result: ADRIngestionResult = {
      rawADRPath: copyResult.targetPath,
      sourceSummary: {
        path: sourceSummaryPath,
        filename: sourceSummaryPage.filename,
        frontmatter: sourceSummaryPage.frontmatter as any,
        content: sourceSummaryPage.content,
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      },
      entityPages,
      writtenPaths,
      sessionReference,
    };
    
    console.log('ADR ingestion workflow completed successfully!');
    console.log(`Generated ${writtenPaths.length} wiki pages`);
    
    return result;
    
  } catch (error) {
    if (error instanceof ADRIngestionError) {
      throw error;
    }
    throw new ADRIngestionError(
      `ADR ingestion workflow failed: ${(error as Error).message}`,
      error as Error
    );
  }
}
