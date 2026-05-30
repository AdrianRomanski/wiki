/**
 * Article analysis generation for the Content_Extractor subsystem
 * Feature: article-research-session
 * Requirements: 4.3, 4.4, 4.5, 4.8
 *
 * Generates article-analysis.md from structured ArticleContent and ArticleMetadata.
 * The analysis includes: title, author, date, source URL, summary, identified
 * entities with descriptions, identified concepts with descriptions, and all
 * code blocks from the article.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { ArticleContent, ArticleMetadata } from '../types/article-session';

/**
 * Error thrown when article-analysis.md cannot be generated.
 * Requirement 4.5: report failure reason and halt EXPLORE step.
 */
export class AnalysisGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisGenerationError';
  }
}

/**
 * Generates article-analysis.md from structured content and metadata.
 *
 * Requirement 4.3: Generate analysis artifact saved as article-analysis.md
 * Requirement 4.4: Include title, author, date, source URL, summary, entities,
 *   concepts, and all code blocks
 * Requirement 4.5: Report failure and halt if generation fails
 * Requirement 4.8: Note explicitly if no entities or concepts found, still allow proceeding
 *
 * @param sessionDir - Path to the session directory
 * @param content - Structured article content (from parseArticle + identifyCandidates)
 * @param metadata - Confirmed article metadata
 * @throws AnalysisGenerationError if the analysis cannot be generated
 */
export async function generateAnalysis(
  sessionDir: string,
  content: ArticleContent,
  metadata: ArticleMetadata
): Promise<void> {
  try {
    const markdown = buildAnalysisMarkdown(content, metadata);
    const outputPath = join(sessionDir, 'article-analysis.md');
    await writeFile(outputPath, markdown, 'utf-8');
  } catch (error) {
    if (error instanceof AnalysisGenerationError) {
      throw error;
    }
    throw new AnalysisGenerationError(
      `Failed to generate article-analysis.md: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Builds the full markdown content for article-analysis.md.
 *
 * @param content - Structured article content
 * @param metadata - Confirmed article metadata
 * @returns The complete markdown string
 */
export function buildAnalysisMarkdown(
  content: ArticleContent,
  metadata: ArticleMetadata
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# Article Analysis: ${metadata.title}`);

  // Metadata section
  sections.push(buildMetadataSection(metadata));

  // Summary section
  sections.push(buildSummarySection(content.body));

  // Identified Entities section
  sections.push(buildEntitiesSection(content.candidateEntities));

  // Identified Concepts section
  sections.push(buildConceptsSection(content.candidateConcepts));

  // Code Blocks section
  sections.push(buildCodeBlocksSection(content.codeBlocks));

  // Notes section
  sections.push(buildNotesSection(content.candidateEntities, content.candidateConcepts));

  return sections.join('\n\n') + '\n';
}

/**
 * Builds the Metadata section of the analysis.
 */
function buildMetadataSection(metadata: ArticleMetadata): string {
  const lines = ['## Metadata'];
  lines.push(`- **Title:** ${metadata.title}`);
  lines.push(`- **Author:** ${metadata.author || 'Unknown'}`);
  lines.push(`- **Date:** ${metadata.date || 'Unknown'}`);
  lines.push(`- **Source URL:** ${metadata.sourceUrl || 'Pasted text'}`);
  return lines.join('\n');
}

/**
 * Builds the Summary section from the article body.
 * Generates a brief summary using the first 2-3 paragraphs of the body text.
 */
function buildSummarySection(body: string): string {
  const summary = generateSummary(body);
  return `## Summary\n\n${summary}`;
}

/**
 * Generates a summary from the article body text.
 * Uses the first 2-3 non-empty paragraphs, excluding headings and code blocks.
 */
export function generateSummary(body: string): string {
  if (!body || body.trim().length === 0) {
    return 'No summary available.';
  }

  // Split body into paragraphs
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => {
      // Skip empty paragraphs
      if (p.length === 0) return false;
      // Skip headings
      if (p.startsWith('#')) return false;
      // Skip code blocks
      if (p.startsWith('```')) return false;
      // Skip lines that are only markdown formatting
      if (p.startsWith('---') || p.startsWith('___')) return false;
      return true;
    });

  if (paragraphs.length === 0) {
    return 'No summary available.';
  }

  // Take first 3 paragraphs for the summary
  const summaryParagraphs = paragraphs.slice(0, 3);
  return summaryParagraphs.join('\n\n');
}

/**
 * Builds the Identified Entities section.
 * Requirement 4.8: If no entities found, note explicitly.
 */
function buildEntitiesSection(entities: string[]): string {
  const lines = ['## Identified Entities'];

  if (entities.length === 0) {
    lines.push('');
    lines.push('No entities were identified in this article.');
  } else {
    lines.push('');
    for (const entity of entities) {
      const description = generateEntityDescription(entity);
      lines.push(`- **${entity}** — ${description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Identified Concepts section.
 * Requirement 4.8: If no concepts found, note explicitly.
 */
function buildConceptsSection(concepts: string[]): string {
  const lines = ['## Identified Concepts'];

  if (concepts.length === 0) {
    lines.push('');
    lines.push('No concepts were identified in this article.');
  } else {
    lines.push('');
    for (const concept of concepts) {
      const description = generateConceptDescription(concept);
      lines.push(`- **${concept}** — ${description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Code Blocks section with all code blocks preserved.
 */
function buildCodeBlocksSection(
  codeBlocks: { language?: string; content: string }[]
): string {
  const lines = ['## Code Blocks'];

  if (codeBlocks.length === 0) {
    lines.push('');
    lines.push('No code blocks found in this article.');
  } else {
    for (const block of codeBlocks) {
      lines.push('');
      lines.push(`\`\`\`${block.language || ''}`);
      lines.push(block.content);
      lines.push('```');
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Notes section.
 * Requirement 4.8: Note explicitly if no entities or concepts found.
 */
function buildNotesSection(entities: string[], concepts: string[]): string {
  const lines = ['## Notes'];
  const notes: string[] = [];

  if (entities.length === 0 && concepts.length === 0) {
    notes.push(
      'No entities or concepts were identified in this article. The session may still proceed to SYNTHESIZE.'
    );
  } else if (entities.length === 0) {
    notes.push(
      'No entities were identified in this article. Only concepts were found.'
    );
  } else if (concepts.length === 0) {
    notes.push(
      'No concepts were identified in this article. Only entities were found.'
    );
  }

  if (notes.length === 0) {
    lines.push('');
    lines.push('No additional notes.');
  } else {
    lines.push('');
    lines.push(notes.join('\n'));
  }

  return lines.join('\n');
}

/**
 * Generates a placeholder description for an entity.
 * Since the identification step only provides names, we generate a generic
 * description based on the entity name.
 */
export function generateEntityDescription(entity: string): string {
  return `A technology, library, tool, or component referenced in the article as "${entity}".`;
}

/**
 * Generates a placeholder description for a concept.
 * Since the identification step only provides names, we generate a generic
 * description based on the concept name.
 */
export function generateConceptDescription(concept: string): string {
  return `A pattern, principle, or technique discussed in the article as "${concept}".`;
}
