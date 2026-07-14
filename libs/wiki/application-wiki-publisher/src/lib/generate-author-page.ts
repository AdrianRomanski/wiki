/**
 * Author page generation and publishing utility
 * Feature: article-author-source-discovery
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.3, 8.4, 8.5
 *
 * Generates the full markdown content for an author entity page
 * with YAML frontmatter and body sections following the WIKI_SCHEMA.md
 * entity page template. Also handles creating new pages and appending
 * to existing pages with duplicate detection.
 *
 * `generateAuthorPage` is a pure function (no I/O). `publishAuthorPage` is
 * the impure create-or-append operation: it routes file I/O through
 * FileSystemPort and, on the append path, routes frontmatter
 * parsing/rendering through FrontmatterPort (Requirement 1.2, 1.3, 5.2, 5.6).
 */

import type { FileSystemPort, FrontmatterPort } from '@wiki/application-ports';
import { generateSessionId } from '@wiki/domain-research-session';

/**
 * Parameters for generating or updating an author entity page.
 */
export interface AuthorPageParams {
  /** Full name of the author */
  authorName: string;
  /** Title of the article being added */
  articleTitle: string;
  /** Title of the source page (for WikiLink) */
  sourcePageTitle: string;
  /** Source page slug for the frontmatter sources array */
  sourcePageSlug: string;
  /** Finalization date in YYYY-MM-DD format */
  finalizedAt: string;
}

/**
 * Result of an author page publish operation.
 */
export interface AuthorPageResult {
  /** Path of the author page relative to workspace root */
  path: string;
  /** Whether the page was newly created or updated */
  action: 'created' | 'updated' | 'skipped';
  /** Error reason if the operation failed */
  error?: string;
}

/**
 * Generates the full markdown content for a new author entity page.
 *
 * Produces markdown with YAML frontmatter containing:
 * - title: author's full name
 * - type: entity
 * - tags: includes "author", "person", and the author's kebab-case slug
 * - sources: array with the source page slug
 * - created/updated: the finalization date
 *
 * Body sections include:
 * - Definition: describes the author
 * - Articles: WikiLink to the article title with date
 * - References: WikiLink to the source page
 *
 * @param params - Author page parameters
 * @returns Complete markdown string with frontmatter and body
 * @throws Error if authorName is empty or whitespace-only
 * @throws Error if articleTitle is empty or whitespace-only
 * @throws Error if finalizedAt is not a valid YYYY-MM-DD date string
 */
export function generateAuthorPage(params: AuthorPageParams): string {
  validateParams(params);

  const frontmatter = buildFrontmatter(params);
  const body = buildBody(params);

  return `${frontmatter}\n\n${body}`;
}

function validateParams(params: AuthorPageParams): void {
  if (!params.authorName || !params.authorName.trim()) {
    throw new Error('authorName must be a non-empty string');
  }

  if (!params.articleTitle || !params.articleTitle.trim()) {
    throw new Error('articleTitle must be a non-empty string');
  }

  if (!params.sourcePageTitle || !params.sourcePageTitle.trim()) {
    throw new Error('sourcePageTitle must be a non-empty string');
  }

  if (!params.sourcePageSlug || !params.sourcePageSlug.trim()) {
    throw new Error('sourcePageSlug must be a non-empty string');
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!params.finalizedAt || !datePattern.test(params.finalizedAt)) {
    throw new Error('finalizedAt must be a valid date in YYYY-MM-DD format');
  }
}

function buildFrontmatter(params: AuthorPageParams): string {
  const authorSlug = generateAuthorSlug(params.authorName);
  const lines: string[] = ['---'];

  lines.push(`title: "${escapeYamlString(params.authorName)}"`);
  lines.push('type: entity');
  lines.push(`tags: [author, person, ${authorSlug}]`);
  lines.push(`sources: [${params.sourcePageSlug}]`);
  lines.push(`created: "${params.finalizedAt}"`);
  lines.push(`updated: "${params.finalizedAt}"`);

  lines.push('---');

  return lines.join('\n');
}

function buildBody(params: AuthorPageParams): string {
  const sections: string[] = [];

  // Title heading
  sections.push(`# ${params.authorName}`);

  // Definition section
  sections.push(buildDefinitionSection(params.authorName));

  // Articles section
  sections.push(buildArticlesSection(params.articleTitle, params.finalizedAt));

  // References section
  sections.push(buildReferencesSection(params.sourcePageTitle));

  return sections.join('\n\n') + '\n';
}

function buildDefinitionSection(authorName: string): string {
  const lines: string[] = ['## Definition'];
  lines.push(
    `${authorName} is an article author whose work has been processed into this wiki.`
  );
  return lines.join('\n\n');
}

function buildArticlesSection(articleTitle: string, date: string): string {
  const lines: string[] = ['## Articles'];
  lines.push(`- [[${articleTitle}]] (${date})`);
  return lines.join('\n\n');
}

function buildReferencesSection(sourcePageTitle: string): string {
  const lines: string[] = ['## References'];
  lines.push(`- [[${sourcePageTitle}]]`);
  return lines.join('\n\n');
}

/**
 * Generates a kebab-case slug from an author name.
 * Uses the same logic as generateSessionId for consistent slug generation.
 *
 * @param authorName - The author's full name
 * @returns A kebab-case slug suitable for use in tags and filenames
 */
export function generateAuthorSlug(authorName: string): string {
  return generateSessionId(authorName);
}

/**
 * Escapes special characters in a string for safe YAML inclusion.
 */
function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Creates a new author entity page or appends to an existing one.
 *
 * Behavior:
 * - If `authorName` is empty/whitespace: returns `action: 'skipped'`
 * - If page does not exist: creates a new page using `generateAuthorPage`
 * - If page exists and article WikiLink is already present: skips (no duplicate)
 * - If page exists and article is new: appends entry to Articles section,
 *   updates `updated` frontmatter field and `sources` array
 *
 * @param fs - FileSystemPort used for wiki page I/O
 * @param frontmatter - FrontmatterPort used to parse/render frontmatter on the append path
 * @param params - Author page parameters
 * @returns Result indicating the path and action taken
 */
export async function publishAuthorPage(
  fs: FileSystemPort,
  frontmatter: FrontmatterPort,
  params: AuthorPageParams
): Promise<AuthorPageResult> {
  const authorSlug = getAuthorSlugSafe(params.authorName);
  const relativePath = `wiki/entities/${authorSlug}.md`;
  const wikiPath = `entities/${authorSlug}.md`;

  // Req 1.5: Skip when authorName is empty/whitespace
  if (!params.authorName || !params.authorName.trim()) {
    return { path: relativePath, action: 'skipped' };
  }

  // If page does not exist, create a new one (Req 1.1)
  if (!(await fs.wikiFileExists(wikiPath))) {
    try {
      const content = generateAuthorPage(params);
      await fs.writeWikiFile(wikiPath, content);
      return { path: relativePath, action: 'created' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { path: relativePath, action: 'skipped', error: reason };
    }
  }

  // Page exists — attempt to append (Req 1.2, 8.1, 8.3, 8.4, 8.5)
  try {
    const existingContent = await fs.readWikiFile(wikiPath);

    // Req 8.7: Handle malformed frontmatter gracefully
    let parsed: ReturnType<FrontmatterPort['parseFrontmatter']>;
    try {
      parsed = frontmatter.parseFrontmatter(existingContent);
    } catch (fmError) {
      const reason = fmError instanceof Error ? fmError.message : String(fmError);
      console.error(
        `[publishAuthorPage] Malformed frontmatter in ${relativePath}: ${reason}`
      );
      return {
        path: relativePath,
        action: 'skipped',
        error: `Malformed frontmatter: ${reason}`,
      };
    }

    // Req 8.5: Check for duplicate — if WikiLink to sourcePageTitle already in Articles section
    const sourcePageWikiLink = `[[${params.sourcePageTitle}]]`;
    if (existingContent.includes(sourcePageWikiLink)) {
      return { path: relativePath, action: 'skipped' };
    }

    const data = parsed.frontmatter;

    // Req 8.3: Update `updated` frontmatter field
    data.updated = params.finalizedAt;

    // Req 8.4: Append new source page slug to `sources` array
    if (Array.isArray(data.sources)) {
      if (!data.sources.includes(params.sourcePageSlug)) {
        data.sources.push(params.sourcePageSlug);
      }
    } else {
      data.sources = [params.sourcePageSlug];
    }

    // Req 8.1, 8.6: Append new article entry at end of Articles section
    let bodyContent = parsed.content;
    const articleEntry = `- [[${params.sourcePageTitle}]] (${params.finalizedAt})`;

    // Req 8.6: If "## Articles" heading doesn't exist, append it
    const articlesHeadingRegex = /^## Articles$/m;
    if (!articlesHeadingRegex.test(bodyContent)) {
      bodyContent = bodyContent.trimEnd() + '\n\n## Articles\n\n' + articleEntry + '\n';
    } else {
      // Find the Articles section and append at the end of it
      bodyContent = appendToArticlesSection(bodyContent, articleEntry);
    }

    // Also append to References section if sourcePageTitle WikiLink not already there
    const referencesEntry = `- [[${params.sourcePageTitle}]]`;
    const referencesHeadingRegex = /^## References$/m;
    if (referencesHeadingRegex.test(bodyContent)) {
      if (!bodyContent.includes(referencesEntry)) {
        bodyContent = appendToReferencesSection(bodyContent, referencesEntry);
      }
    }

    // Reconstruct the file content with updated frontmatter
    const updatedContent = frontmatter.generateFrontmatter(data, bodyContent);
    await fs.writeWikiFile(wikiPath, updatedContent);

    return { path: relativePath, action: 'updated' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { path: relativePath, action: 'skipped', error: reason };
  }
}

/**
 * Safely generates an author slug, returning a fallback for empty names.
 */
function getAuthorSlugSafe(authorName: string): string {
  if (!authorName || !authorName.trim()) {
    return '';
  }
  return generateAuthorSlug(authorName);
}

/**
 * Appends a new entry at the end of the "## Articles" section.
 * The section ends when the next `## ` heading is encountered or at end of content.
 */
function appendToArticlesSection(content: string, entry: string): string {
  const lines = content.split('\n');
  let inArticlesSection = false;
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^## Articles$/.test(lines[i])) {
      inArticlesSection = true;
      continue;
    }
    if (inArticlesSection) {
      // If we hit another heading, insert before it
      if (/^## /.test(lines[i])) {
        insertIndex = i;
        break;
      }
    }
  }

  if (inArticlesSection && insertIndex === -1) {
    // Articles section goes to end of content — append at end
    const trimmed = content.trimEnd();
    return trimmed + '\n' + entry + '\n';
  }

  if (insertIndex !== -1) {
    // Insert before the next heading, with proper spacing
    lines.splice(insertIndex, 0, entry, '');
    return lines.join('\n');
  }

  // Fallback: append at end
  return content.trimEnd() + '\n' + entry + '\n';
}

/**
 * Appends a new entry at the end of the "## References" section.
 * The section ends when the next `## ` heading is encountered or at end of content.
 */
function appendToReferencesSection(content: string, entry: string): string {
  const lines = content.split('\n');
  let inReferencesSection = false;
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^## References$/.test(lines[i])) {
      inReferencesSection = true;
      continue;
    }
    if (inReferencesSection) {
      if (/^## /.test(lines[i])) {
        insertIndex = i;
        break;
      }
    }
  }

  if (inReferencesSection && insertIndex === -1) {
    // References section goes to end of content — append at end
    const trimmed = content.trimEnd();
    return trimmed + '\n' + entry + '\n';
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, entry, '');
    return lines.join('\n');
  }

  return content.trimEnd() + '\n' + entry + '\n';
}
