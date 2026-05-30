/**
 * Entity and concept page creation/update logic
 * Feature: article-research-session
 * Requirements: 6.3, 6.4, 6.5, 6.6
 *
 * Creates new wiki pages for entity/concept candidates that don't already exist,
 * and appends a new section to existing pages referencing the article title and date.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { generateSessionId } from '../utils/generate-session-id';
import { EntityCandidate, ConceptCandidate } from '../types/article-session';

/**
 * Result of a publish operation for entity or concept pages.
 */
export interface PublishResult {
  /** Paths of newly created pages (relative to workspace root) */
  created: string[];
  /** Paths of existing pages that were updated (relative to workspace root) */
  updated: string[];
  /** Pages that failed to create or update */
  failed: Array<{ path: string; reason: string }>;
}

/**
 * Publishes entity pages for the given candidates.
 *
 * For each entity candidate:
 * - If the file does NOT exist: creates a new entity page with frontmatter and content
 * - If the file DOES exist: appends a new section referencing the article title and date
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param entities - Array of entity candidates to publish
 * @param articleTitle - The confirmed article title for cross-referencing
 * @param finalizedAt - The finalization date in YYYY-MM-DD format
 * @returns A PublishResult indicating which pages were created, updated, or failed
 */
export function publishEntityPages(
  workspaceRoot: string,
  entities: EntityCandidate[],
  articleTitle: string,
  finalizedAt: string
): PublishResult {
  const result: PublishResult = { created: [], updated: [], failed: [] };

  for (const entity of entities) {
    const relativePath = entity.proposedPath;
    const absolutePath = join(workspaceRoot, relativePath);

    try {
      if (existsSync(absolutePath)) {
        appendReferenceSection(absolutePath, articleTitle, finalizedAt);
        result.updated.push(relativePath);
      } else {
        const content = generateNewEntityPage(entity, finalizedAt);
        ensureDirectoryExists(absolutePath);
        writeFileSync(absolutePath, content, 'utf-8');
        result.created.push(relativePath);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      result.failed.push({ path: relativePath, reason });
    }
  }

  return result;
}

/**
 * Publishes concept pages for the given candidates.
 *
 * For each concept candidate:
 * - If the file does NOT exist: creates a new concept page with frontmatter and content
 * - If the file DOES exist: appends a new section referencing the article title and date
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param concepts - Array of concept candidates to publish
 * @param articleTitle - The confirmed article title for cross-referencing
 * @param finalizedAt - The finalization date in YYYY-MM-DD format
 * @returns A PublishResult indicating which pages were created, updated, or failed
 */
export function publishConceptPages(
  workspaceRoot: string,
  concepts: ConceptCandidate[],
  articleTitle: string,
  finalizedAt: string
): PublishResult {
  const result: PublishResult = { created: [], updated: [], failed: [] };

  for (const concept of concepts) {
    const relativePath = concept.proposedPath;
    const absolutePath = join(workspaceRoot, relativePath);

    try {
      if (existsSync(absolutePath)) {
        appendReferenceSection(absolutePath, articleTitle, finalizedAt);
        result.updated.push(relativePath);
      } else {
        const content = generateNewConceptPage(concept, finalizedAt);
        ensureDirectoryExists(absolutePath);
        writeFileSync(absolutePath, content, 'utf-8');
        result.created.push(relativePath);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      result.failed.push({ path: relativePath, reason });
    }
  }

  return result;
}

/**
 * Generates the full markdown content for a new entity page.
 */
function generateNewEntityPage(entity: EntityCandidate, finalizedAt: string): string {
  const slug = generateSlugFromPath(entity.proposedPath);
  const tags = generateTags(entity.name);

  const lines: string[] = [
    '---',
    `title: "${escapeYamlString(entity.name)}"`,
    'type: entity',
    `tags: [${tags.join(', ')}]`,
    `created: "${finalizedAt}"`,
    `updated: "${finalizedAt}"`,
    '---',
    '',
    `# ${entity.name}`,
    '',
    '## Definition',
    '',
    entity.description,
    '',
    '## Properties',
    '',
    '*Properties to be documented.*',
    '',
    '## Relationships',
    '',
    '*Relationships to be documented.*',
    '',
    '## Examples',
    '',
    '*Examples to be documented.*',
    '',
    '## References',
    '',
    `- Source article researched on ${finalizedAt}`,
    '',
  ];

  return lines.join('\n');
}

/**
 * Generates the full markdown content for a new concept page.
 */
function generateNewConceptPage(concept: ConceptCandidate, finalizedAt: string): string {
  const tags = generateTags(concept.name);

  const lines: string[] = [
    '---',
    `title: "${escapeYamlString(concept.name)}"`,
    'type: concept',
    `tags: [${tags.join(', ')}]`,
    `created: "${finalizedAt}"`,
    `updated: "${finalizedAt}"`,
    '---',
    '',
    `# ${concept.name}`,
    '',
    '## Explanation',
    '',
    concept.description,
    '',
    '## Applications',
    '',
    '*Applications to be documented.*',
    '',
    '## Related Concepts',
    '',
    '*Related concepts to be documented.*',
    '',
    '## Examples',
    '',
    '*Examples to be documented.*',
    '',
    '## References',
    '',
    `- Source article researched on ${finalizedAt}`,
    '',
  ];

  return lines.join('\n');
}

/**
 * Appends a new section to an existing wiki page referencing the article title and date.
 * Preserves all existing content intact.
 */
function appendReferenceSection(absolutePath: string, articleTitle: string, finalizedAt: string): void {
  const existingContent = readFileSync(absolutePath, 'utf-8');

  const newSection = [
    '',
    `## Referenced in: ${articleTitle}`,
    '',
    `- **Article:** ${articleTitle}`,
    `- **Date:** ${finalizedAt}`,
    `- **Added from:** article research session finalized on ${finalizedAt}`,
    '',
  ].join('\n');

  const updatedContent = existingContent.trimEnd() + '\n' + newSection;

  // Update the `updated` field in frontmatter if present
  const contentWithUpdatedDate = updateFrontmatterDate(updatedContent, finalizedAt);

  writeFileSync(absolutePath, contentWithUpdatedDate, 'utf-8');
}

/**
 * Updates the `updated` field in YAML frontmatter to the given date.
 */
function updateFrontmatterDate(content: string, date: string): string {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  const updatedFrontmatter = frontmatter.replace(
    /^updated:.*$/m,
    `updated: "${date}"`
  );

  return content.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
}

/**
 * Generates basic tags from a name by splitting into lowercase words.
 */
function generateTags(name: string): string[] {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Return unique words as tags, limited to 5
  return [...new Set(words)].slice(0, 5);
}

/**
 * Extracts the slug portion from a proposed path like `wiki/entities/my-entity.md`.
 */
function generateSlugFromPath(proposedPath: string): string {
  const filename = proposedPath.split('/').pop() || '';
  return filename.replace(/\.md$/, '');
}

/**
 * Ensures the directory for a file path exists, creating it recursively if needed.
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Escapes special characters in a string for safe YAML inclusion.
 */
function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
