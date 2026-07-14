/**
 * Publication source page generation utility
 * Feature: article-author-source-discovery
 * Requirements: 2.3, 2.4, 2.6, 2.7, 2.8, 2.9, 8.2, 8.3, 8.4, 8.5
 *
 * Generates the full markdown content for a publication source entity page
 * with YAML frontmatter and body sections following the WIKI_SCHEMA.md
 * entity page template. Also provides the publish function that creates
 * or updates publication source pages on disk.
 *
 * `generatePublicationSourcePage` is a pure function (no I/O).
 * `publishPublicationSourcePage` is the impure create-or-append operation:
 * it routes file I/O through FileSystemPort and, on the append path, routes
 * frontmatter parsing/rendering through FrontmatterPort
 * (Requirement 1.2, 1.3, 5.2, 5.6).
 */

import type { FileSystemPort, FrontmatterPort } from '@wiki/application-ports';
import { domainToSlug } from '@wiki/domain-research-session';

/**
 * Parameters for generating a publication source entity page.
 */
export interface PublicationSourcePageParams {
  /** Domain name of the publication source (e.g., "nx.dev") */
  domain: string;
  /** Title of the article being added */
  articleTitle: string;
  /** Author of the article (if available) */
  articleAuthor?: string;
  /** Title of the source page (for WikiLink) */
  sourcePageTitle: string;
  /** Source page slug for the frontmatter sources array */
  sourcePageSlug: string;
  /** Finalization date in YYYY-MM-DD format */
  finalizedAt: string;
}

/**
 * Result of a publication source page publish operation.
 */
export interface PublicationSourcePageResult {
  /** Path of the publication source page relative to workspace root */
  path: string;
  /** Whether the page was newly created or updated */
  action: 'created' | 'updated' | 'skipped';
  /** Error reason if the operation failed */
  error?: string;
}

/**
 * Generates the full markdown content for a new publication source entity page.
 *
 * @param params - Publication source page parameters
 * @returns Complete markdown string with frontmatter and body
 * @throws Error if domain is empty or whitespace-only
 * @throws Error if articleTitle is empty or whitespace-only
 * @throws Error if finalizedAt is not a valid YYYY-MM-DD date string
 */
export function generatePublicationSourcePage(params: PublicationSourcePageParams): string {
  validateParams(params);

  const frontmatter = buildFrontmatter(params);
  const body = buildBody(params);

  return `${frontmatter}\n\n${body}`;
}

function validateParams(params: PublicationSourcePageParams): void {
  if (!params.domain || !params.domain.trim()) {
    throw new Error('domain must be a non-empty string');
  }

  if (!params.articleTitle || !params.articleTitle.trim()) {
    throw new Error('articleTitle must be a non-empty string');
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!params.finalizedAt || !datePattern.test(params.finalizedAt)) {
    throw new Error('finalizedAt must be a valid date in YYYY-MM-DD format');
  }
}

function buildFrontmatter(params: PublicationSourcePageParams): string {
  const lines: string[] = ['---'];
  const slug = domainToSlug(params.domain);

  lines.push(`title: "${escapeYamlString(params.domain)}"`);
  lines.push('type: entity');
  lines.push(`tags: [publication-source, website, ${slug}]`);
  lines.push(`sources: [${params.sourcePageSlug}]`);
  lines.push(`created: "${params.finalizedAt}"`);
  lines.push(`updated: "${params.finalizedAt}"`);

  lines.push('---');

  return lines.join('\n');
}

function buildBody(params: PublicationSourcePageParams): string {
  const sections: string[] = [];

  // Title heading
  sections.push(`# ${params.domain}`);

  // Definition section
  sections.push(buildDefinitionSection(params.domain));

  // Articles section
  sections.push(buildArticlesSection(params));

  // References section
  sections.push(buildReferencesSection(params.sourcePageTitle));

  return sections.join('\n\n') + '\n';
}

function buildDefinitionSection(domain: string): string {
  const lines: string[] = ['## Definition'];
  lines.push(`${domain} is a publication platform from which articles have been processed into this wiki.`);
  return lines.join('\n\n');
}

function buildArticlesSection(params: PublicationSourcePageParams): string {
  const lines: string[] = ['## Articles'];

  const articleEntry = params.articleAuthor
    ? `- [[${params.articleTitle}]] by ${params.articleAuthor} (${params.finalizedAt})`
    : `- [[${params.articleTitle}]] (${params.finalizedAt})`;

  lines.push(articleEntry);

  return lines.join('\n\n');
}

function buildReferencesSection(sourcePageTitle: string): string {
  const lines: string[] = ['## References'];
  lines.push(`- [[${sourcePageTitle}]]`);
  return lines.join('\n\n');
}

/**
 * Escapes special characters in a string for safe YAML inclusion.
 */
function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Creates a new publication source entity page or appends to an existing one.
 *
 * Behavior:
 * - If `domain` is empty/whitespace: returns `action: 'skipped'` (Req 2.9)
 * - If page does not exist: creates a new page using `generatePublicationSourcePage` (Req 2.3)
 * - If page exists and article WikiLink is already present: skips (no duplicate) (Req 8.5)
 * - If page exists and article is new: appends entry to Articles section,
 *   updates `updated` frontmatter field and `sources` array (Req 2.4, 2.8, 8.2, 8.3, 8.4)
 *
 * @param fs - FileSystemPort used for wiki page I/O
 * @param frontmatter - FrontmatterPort used to parse/render frontmatter on the append path
 * @param params - Publication source page parameters
 * @returns Result indicating the path and action taken
 */
export async function publishPublicationSourcePage(
  fs: FileSystemPort,
  frontmatter: FrontmatterPort,
  params: PublicationSourcePageParams
): Promise<PublicationSourcePageResult> {
  // Req 2.9: Skip when domain is empty/whitespace
  if (!params.domain || !params.domain.trim()) {
    return { path: '', action: 'skipped' };
  }

  const slug = domainToSlug(params.domain);
  const relativePath = `wiki/entities/${slug}.md`;
  const wikiPath = `entities/${slug}.md`;

  // If page does not exist, create a new one (Req 2.3)
  if (!(await fs.wikiFileExists(wikiPath))) {
    try {
      const content = generatePublicationSourcePage(params);
      await fs.writeWikiFile(wikiPath, content);
      return { path: relativePath, action: 'created' };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { path: relativePath, action: 'skipped', error: reason };
    }
  }

  // Page exists — attempt to append (Req 2.4, 2.8, 8.2, 8.3, 8.4, 8.5)
  try {
    const existingContent = await fs.readWikiFile(wikiPath);

    // Handle malformed frontmatter gracefully
    let parsed: ReturnType<FrontmatterPort['parseFrontmatter']>;
    try {
      parsed = frontmatter.parseFrontmatter(existingContent);
    } catch (fmError) {
      const reason = fmError instanceof Error ? fmError.message : String(fmError);
      console.error(
        `[publishPublicationSourcePage] Malformed frontmatter in ${relativePath}: ${reason}`
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

    // Req 8.2, 2.4, 2.8: Append new article entry to Articles section
    let bodyContent = parsed.content;

    // Build the article entry (Req 2.4, 2.5)
    const articleEntry = params.articleAuthor
      ? `- [[${params.sourcePageTitle}]] — ${params.finalizedAt} by ${params.articleAuthor}`
      : `- [[${params.sourcePageTitle}]] — ${params.finalizedAt}`;

    // If "## Articles" heading doesn't exist, append it
    const articlesHeadingRegex = /^## Articles$/m;
    if (!articlesHeadingRegex.test(bodyContent)) {
      bodyContent = bodyContent.trimEnd() + '\n\n## Articles\n\n' + articleEntry + '\n';
    } else {
      // Req 2.8: Insert maintaining descending date order
      bodyContent = insertArticleEntryByDate(bodyContent, articleEntry, params.finalizedAt);
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
 * Inserts a new article entry into the Articles section maintaining descending date order.
 * Entries with newer dates appear first.
 */
function insertArticleEntryByDate(content: string, entry: string, date: string): string {
  const lines = content.split('\n');
  let inArticlesSection = false;
  let articlesStartIndex = -1;
  let sectionEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^## Articles$/.test(lines[i])) {
      inArticlesSection = true;
      articlesStartIndex = i;
      continue;
    }
    if (inArticlesSection && /^## /.test(lines[i])) {
      sectionEndIndex = i;
      break;
    }
  }

  if (!inArticlesSection) {
    // Fallback: append at end
    return content.trimEnd() + '\n' + entry + '\n';
  }

  // Collect existing article entries (lines starting with "- ")
  const endIdx = sectionEndIndex === -1 ? lines.length : sectionEndIndex;
  const dateRegex = /(\d{4}-\d{2}-\d{2})/;

  // Find the correct insertion point based on descending date order
  let insertIndex = -1;
  for (let i = articlesStartIndex + 1; i < endIdx; i++) {
    const line = lines[i];
    if (!line.startsWith('- ')) continue;

    const match = line.match(dateRegex);
    if (match) {
      const existingDate = match[1];
      // If the new date is newer or equal, insert before this entry
      if (date >= existingDate) {
        insertIndex = i;
        break;
      }
    }
  }

  if (insertIndex !== -1) {
    // Insert before the found position
    lines.splice(insertIndex, 0, entry);
    return lines.join('\n');
  }

  // New entry has the oldest date — append at end of Articles section
  if (sectionEndIndex === -1) {
    // Articles section goes to end of content
    const trimmed = content.trimEnd();
    return trimmed + '\n' + entry + '\n';
  }

  // Insert before the next heading
  lines.splice(sectionEndIndex, 0, entry, '');
  return lines.join('\n');
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
