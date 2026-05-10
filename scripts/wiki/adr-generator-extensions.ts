/**
 * ADR Generator Extensions Module
 * 
 * Extends wiki generators with ADR-specific functionality for creating
 * Source_Summary and Entity_Page entries from research decisions.
 */

import { ADRMetadata, ComparisonMatrix } from './adr-metadata-extractor.js';
import { GeneratedPage } from './generators.js';
import { FileSystemConfig } from './filesystem.js';

/**
 * Options for generating a Source_Summary from an ADR.
 */
export interface ADRSourceSummaryOptions {
  /** ADR metadata */
  metadata: ADRMetadata;
  
  /** Path to the raw ADR file */
  rawSourcePath: string;
  
  /** Path to the research session directory */
  sessionPath: string;
  
  /** Whether to include comparison matrices */
  includeMatrices?: boolean;
  
  /** File system configuration */
  config?: FileSystemConfig;
}

/**
 * Options for generating an Entity_Page for a library from ADR data.
 */
export interface ADREntityPageOptions {
  /** Library name */
  libraryName: string;
  
  /** ADR metadata containing library information */
  adrMetadata: ADRMetadata;
  
  /** Path to the ADR source summary */
  sourceSummaryPath: string;
  
  /** File system configuration */
  config?: FileSystemConfig;
}

/**
 * Formats a comparison matrix as markdown for inclusion in wiki pages.
 * 
 * @param matrix - The comparison matrix
 * @param title - Matrix title (optional, uses matrix.title if not provided)
 * @returns Formatted markdown
 */
export function formatComparisonMatrix(
  matrix: ComparisonMatrix,
  title?: string
): string {
  const lines: string[] = [];
  
  // Add title heading
  const matrixTitle = title || matrix.title;
  lines.push(`### ${matrixTitle}`);
  lines.push('');
  
  // Build table header row
  const hasWinner = matrix.winner !== undefined;
  const headerRow = ['Criterion', ...matrix.headers.slice(1)];
  if (hasWinner) {
    headerRow.push('Winner');
  }
  
  // Build table separator row
  const separatorRow = headerRow.map(() => '---');
  
  // Build table data rows
  const dataRows: string[][] = [];
  for (const [criterion, values] of matrix.rows.entries()) {
    const row = [criterion, ...values];
    if (hasWinner && matrix.winner) {
      const winnerValue = matrix.winner.get(criterion) || '';
      row.push(winnerValue);
    }
    dataRows.push(row);
  }
  
  // Format as markdown table
  const formatRow = (cells: string[]) => `| ${cells.join(' | ')} |`;
  
  lines.push(formatRow(headerRow));
  lines.push(formatRow(separatorRow));
  for (const row of dataRows) {
    lines.push(formatRow(row));
  }
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generates a Source_Summary wiki page from an ADR.
 * 
 * This function creates a source summary that includes:
 * - Decision metadata (title, date, status)
 * - Key decision drivers as key points
 * - Chosen option and rationale as insights
 * - Comparison matrices (if available)
 * - Session reference link
 * - Links to research artifacts
 * 
 * @param options - Generation options
 * @returns Generated wiki page
 */
export function generateADRSourceSummary(
  options: ADRSourceSummaryOptions
): GeneratedPage {
  const { metadata, rawSourcePath, includeMatrices = true } = options;
  
  // Import required utilities
  const { createFrontmatter, generateFrontmatter } = require('./frontmatter.js');
  const { generateHeading, generateList } = require('./markdown.js');
  const { generateFilename } = require('./naming.js');
  const { extractSessionReference, generateSessionReferenceSection } = require('./research-session-linker.js');
  
  // Create frontmatter with ADR-specific fields
  const frontmatter = createFrontmatter({
    title: metadata.title,
    type: 'source' as const,
    tags: ['research', 'adr', 'decision', ...(metadata.tags || [])],
    date: metadata.date,
    created: metadata.date,
  });
  
  // Add ADR-specific frontmatter fields (these will be added as custom fields)
  const extendedFrontmatter = {
    ...frontmatter,
    status: metadata.status,
    sessionId: metadata.sessionId,
    ...(metadata.supersededBy && { supersededBy: metadata.supersededBy }),
  };
  
  // Generate filename
  const filename = generateFilename(metadata.title, 'source', new Date(metadata.date));
  
  // Build content sections
  const sections: string[] = [];
  
  // Title
  sections.push(generateHeading(metadata.title, 1));
  sections.push('');
  
  // Metadata section
  sections.push(generateHeading('Metadata', 2));
  const metadataLines: string[] = [];
  metadataLines.push(`**Date**: ${metadata.date}`);
  metadataLines.push(`**Status**: ${metadata.status}`);
  metadataLines.push(`**Raw Source**: \`${rawSourcePath}\``);
  if (metadata.deciders && metadata.deciders.length > 0) {
    metadataLines.push(`**Deciders**: ${metadata.deciders.join(', ')}`);
  }
  sections.push(metadataLines.join('\n'));
  sections.push('');
  
  // Context section
  sections.push(generateHeading('Context', 2));
  sections.push(metadata.context);
  sections.push('');
  
  // Key Points section (Decision Drivers)
  if (metadata.decisionDrivers.length > 0) {
    sections.push(generateHeading('Key Points', 2));
    sections.push(generateList(metadata.decisionDrivers));
    sections.push('');
  }
  
  // Considered Options section
  if (metadata.consideredOptions.length > 0) {
    sections.push(generateHeading('Considered Options', 2));
    sections.push(generateList(metadata.consideredOptions));
    sections.push('');
  }
  
  // Insights section (Chosen Option and Rationale)
  sections.push(generateHeading('Insights', 2));
  sections.push(`**Chosen option**: ${metadata.chosenOption}`);
  sections.push('');
  if (metadata.rationale) {
    sections.push(metadata.rationale);
    sections.push('');
  }
  
  // Consequences sections
  if (metadata.positiveConsequences.length > 0) {
    sections.push(generateHeading('Positive Consequences', 3));
    sections.push(generateList(metadata.positiveConsequences));
    sections.push('');
  }
  
  if (metadata.negativeConsequences.length > 0) {
    sections.push(generateHeading('Negative Consequences', 3));
    sections.push(generateList(metadata.negativeConsequences));
    sections.push('');
  }
  
  // Comparison Matrices section
  if (includeMatrices && metadata.comparisonMatrices) {
    sections.push(generateHeading('Comparison Matrices', 2));
    sections.push('');
    
    const { complexity, modularity, bundleSize, tokenUsage } = metadata.comparisonMatrices;
    
    if (complexity) {
      sections.push(formatComparisonMatrix(complexity));
    }
    
    if (modularity) {
      sections.push(formatComparisonMatrix(modularity));
    }
    
    if (bundleSize) {
      sections.push(formatComparisonMatrix(bundleSize));
    }
    
    if (tokenUsage) {
      sections.push(formatComparisonMatrix(tokenUsage));
    }
  }
  
  // Session Reference section
  const sessionReference = extractSessionReference(metadata);
  sections.push(generateSessionReferenceSection(sessionReference));
  
  // Relevant Entities section (Libraries)
  if (metadata.libraries.length > 0) {
    sections.push(generateHeading('Relevant Entities', 2));
    const { generateWikiLink } = require('./markdown.js');
    const libraryLinks = metadata.libraries.map(lib => generateWikiLink(lib));
    sections.push(generateList(libraryLinks));
    sections.push('');
  }
  
  const bodyContent = sections.join('\n').trim();
  
  // Generate complete markdown with frontmatter
  const content = generateFrontmatter(extendedFrontmatter, bodyContent);
  
  return {
    content,
    filename,
    frontmatter: extendedFrontmatter,
  };
}

/**
 * Generates an Entity_Page for a library mentioned in an ADR.
 * 
 * This function creates an entity page that includes:
 * - Library name as title
 * - Complexity and modularity scores from ADR
 * - Relationship link to the ADR Source_Summary
 * - Tags extracted from ADR
 * 
 * @param options - Generation options
 * @returns Generated wiki page
 */
export function generateLibraryEntityFromADR(
  options: ADREntityPageOptions
): GeneratedPage {
  const { libraryName, adrMetadata } = options;
  
  // Import required utilities
  const { createFrontmatter, generateFrontmatter } = require('./frontmatter.js');
  const { generateHeading, generateList, generateWikiLink } = require('./markdown.js');
  const { generateFilename } = require('./naming.js');
  
  // Extract scores from comparison matrices
  let complexityScore: string | undefined;
  let modularityScore: string | undefined;
  let tokenEstimate: string | undefined;
  
  if (adrMetadata.comparisonMatrices) {
    const { complexity, modularity, tokenUsage } = adrMetadata.comparisonMatrices;
    
    // Extract complexity score for this library
    if (complexity) {
      for (const [criterion, values] of complexity.rows.entries()) {
        // Find the column index for this library
        const libraryIndex = complexity.headers.findIndex(
          header => header.toLowerCase().includes(libraryName.toLowerCase()) ||
                   libraryName.toLowerCase().includes(header.toLowerCase())
        );
        
        if (libraryIndex >= 0 && criterion.toLowerCase().includes('overall')) {
          complexityScore = values[libraryIndex - 1]; // -1 because first header is "Criterion"
          break;
        }
      }
    }
    
    // Extract modularity score for this library
    if (modularity) {
      for (const [criterion, values] of modularity.rows.entries()) {
        const libraryIndex = modularity.headers.findIndex(
          header => header.toLowerCase().includes(libraryName.toLowerCase()) ||
                   libraryName.toLowerCase().includes(header.toLowerCase())
        );
        
        if (libraryIndex >= 0 && criterion.toLowerCase().includes('overall')) {
          modularityScore = values[libraryIndex - 1];
          break;
        }
      }
    }
    
    // Extract token usage estimate for this library
    if (tokenUsage) {
      for (const [criterion, values] of tokenUsage.rows.entries()) {
        const libraryIndex = tokenUsage.headers.findIndex(
          header => header.toLowerCase().includes(libraryName.toLowerCase()) ||
                   libraryName.toLowerCase().includes(header.toLowerCase())
        );
        
        if (libraryIndex >= 0 && criterion.toLowerCase().includes('total')) {
          tokenEstimate = values[libraryIndex - 1];
          break;
        }
      }
    }
  }
  
  // Create tags from library name and ADR tags
  const tags = ['library', libraryName.toLowerCase(), ...(adrMetadata.tags || [])];
  
  // Create frontmatter
  const frontmatter = createFrontmatter({
    title: libraryName,
    type: 'entity' as const,
    tags,
    sources: [adrMetadata.title],
  });
  
  // Add custom fields for scores
  const extendedFrontmatter = {
    ...frontmatter,
    ...(complexityScore && { complexityScore }),
    ...(modularityScore && { modularityScore }),
    ...(tokenEstimate && { tokenEstimate }),
  };
  
  // Generate filename
  const filename = generateFilename(libraryName, 'entity');
  
  // Build content sections
  const sections: string[] = [];
  
  // Title
  sections.push(generateHeading(libraryName, 1));
  sections.push('');
  
  // Definition section
  sections.push(generateHeading('Definition', 2));
  sections.push(`Library evaluated in the context of ${generateWikiLink(adrMetadata.title)}.`);
  sections.push('');
  
  // Properties section (scores from ADR)
  const properties: string[] = [];
  if (complexityScore) {
    properties.push(`**Complexity Score**: ${complexityScore}`);
  }
  if (modularityScore) {
    properties.push(`**Modularity Score**: ${modularityScore}`);
  }
  if (tokenEstimate) {
    properties.push(`**Token Usage Estimate**: ${tokenEstimate}`);
  }
  
  if (properties.length > 0) {
    sections.push(generateHeading('Properties', 2));
    sections.push(properties.join('\n'));
    sections.push('');
  }
  
  // Relationships section
  sections.push(generateHeading('Relationships', 2));
  const relationships = [
    `Evaluated in ${generateWikiLink(adrMetadata.title)}`
  ];
  sections.push(generateList(relationships));
  sections.push('');
  
  const bodyContent = sections.join('\n').trim();
  
  // Generate complete markdown with frontmatter
  const content = generateFrontmatter(extendedFrontmatter, bodyContent);
  
  return {
    content,
    filename,
    frontmatter: extendedFrontmatter,
  };
}
