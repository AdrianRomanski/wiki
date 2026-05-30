/**
 * FINALIZE step orchestration for article research sessions
 * Feature: article-research-session
 * Requirements: 6.1, 6.7, 6.8, 8.5
 *
 * Orchestrates the FINALIZE step:
 * 1. Presents findings-summary.md contents for user review
 * 2. On decline: records wikiPages as empty array, transitions to FINALIZED
 * 3. On accept: orchestrates source page, entity pages, concept pages, reciprocal references
 * 4. Handles per-page write failures: reports status, records only successful pages, offers retry
 * 5. Finalizes session regardless of retry outcome
 */

import { readFile, writeFile } from 'fs/promises';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type {
  SessionJson,
  FailedReference,
  EntityCandidate,
  ConceptCandidate,
} from '../types/article-session';
import { transitionState } from './state-transitions';
import { constructSourcePagePath } from '../wiki-publisher/source-page-path';
import { generateSourcePage } from '../wiki-publisher/generate-source-page';
import type { SourcePageParams } from '../wiki-publisher/generate-source-page';
import { publishEntityPages, publishConceptPages } from '../wiki-publisher/publish-pages';
import type { PublishResult } from '../wiki-publisher/publish-pages';
import { addReciprocalReferences } from '../wiki-publisher/reciprocal-references';
import { extractDomain } from '../wiki-publisher/domain-extractor';
import { publishAuthorPage } from '../wiki-publisher/generate-author-page';
import type { AuthorPageResult } from '../wiki-publisher/generate-author-page';
import { publishPublicationSourcePage } from '../wiki-publisher/generate-publication-source-page';
import type { PublicationSourcePageResult } from '../wiki-publisher/generate-publication-source-page';
import { parseAnalysisMarkdown } from './synthesize-step';

/**
 * Result of the full wiki publication orchestration.
 */
export interface PublicationResult {
  /** Relative path of the created source page */
  sourcePagePath: string;
  /** Results from publishing entity pages */
  entityResults: PublishResult;
  /** Results from publishing concept pages */
  conceptResults: PublishResult;
  /** Result from publishing the author page */
  authorResult?: AuthorPageResult;
  /** Result from publishing the publication source page */
  publicationSourceResult?: PublicationSourcePageResult;
  /** References that failed to be added to target pages */
  failedReferences: FailedReference[];
  /** All successfully created/updated page paths */
  allCreatedPages: string[];
}

/**
 * Reads and returns the contents of findings-summary.md for user review.
 *
 * Requirement 6.1: Present findings-summary.md contents and ask whether to publish.
 *
 * @param sessionDir - Absolute path to the session directory
 * @returns The full markdown content of findings-summary.md
 * @throws Error if findings-summary.md cannot be read
 */
export async function getFindingsSummaryForReview(
  sessionDir: string
): Promise<string> {
  const findingsPath = join(sessionDir, 'findings-summary.md');
  return readFile(findingsPath, 'utf-8');
}

/**
 * Handles the decline path: records wikiPages as empty array and transitions to FINALIZED.
 *
 * Requirement 6.8: If user declines publication, record wikiPages as empty array.
 * Requirement 8.5: Record finalizedAt and wikiPages when session reaches FINALIZED.
 *
 * @param sessionDir - Absolute path to the session directory
 */
export async function declinePublication(sessionDir: string): Promise<void> {
  await finalizeSession(sessionDir, []);
}

/**
 * Orchestrates the full wiki publication process.
 *
 * Steps:
 * 1. Read session.json and findings-summary.md
 * 2. Construct source page path and generate source page content
 * 3. Write source page to disk
 * 4. Publish entity pages
 * 5. Publish concept pages
 * 6. Add reciprocal references
 * 7. Return results (created pages, failed pages)
 *
 * Requirement 6.7: Handle per-page write failures, report status, record only successful pages.
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param sessionDir - Absolute path to the session directory
 * @returns PublicationResult with details of all created/failed pages
 */
export async function acceptPublication(
  workspaceRoot: string,
  sessionDir: string
): Promise<PublicationResult> {
  // 1. Read session.json and findings-summary.md
  const sessionJsonPath = join(sessionDir, 'session.json');
  const sessionRaw = await readFile(sessionJsonPath, 'utf-8');
  const session: SessionJson = JSON.parse(sessionRaw);

  const findingsPath = join(sessionDir, 'findings-summary.md');
  const findingsContent = await readFile(findingsPath, 'utf-8');

  // Parse findings-summary.md to extract entities, concepts, and insights
  const parsed = parseAnalysisMarkdown(findingsContent);

  // Determine the finalization date
  const finalizedAt = formatDate(new Date());

  // 2. Extract domain from articleUrl (graceful degradation)
  let extractedDomain: string | undefined;
  if (session.articleUrl) {
    try {
      extractedDomain = extractDomain(session.articleUrl);
    } catch {
      // Req 2.2: Skip publication source page creation on invalid URL
      extractedDomain = undefined;
    }
  }

  // Determine WikiLink targets for source page metadata
  const authorWikiLink = session.articleAuthor?.trim() || undefined;
  const publicationSourceWikiLink = extractedDomain || undefined;

  // 3. Construct source page path
  const articleTitle = session.articleTitle || parsed.title;
  const sourcePagePath = constructSourcePagePath(articleTitle, finalizedAt);

  // 4. Generate and write source page content (with author and publication source WikiLinks)
  const sessionDirRelative = sessionDir.replace(workspaceRoot + '/', '').replace(workspaceRoot, '');
  const sourcePageContent = generateSourcePage(buildSourcePageParams(
    session,
    parsed,
    finalizedAt,
    sessionDirRelative,
    authorWikiLink,
    publicationSourceWikiLink
  ));

  let sourcePageCreated = true;
  try {
    const absoluteSourcePath = join(workspaceRoot, sourcePagePath);
    ensureDirectoryExists(absoluteSourcePath);
    writeFileSync(absoluteSourcePath, sourcePageContent, 'utf-8');
  } catch {
    sourcePageCreated = false;
  }

  // 5. Publish entity pages
  const entities = buildEntityCandidates(parsed.entities);
  const entityResults = publishEntityPages(
    workspaceRoot,
    entities,
    articleTitle,
    finalizedAt
  );

  // 6. Publish concept pages
  const concepts = buildConceptCandidates(parsed.concepts);
  const conceptResults = publishConceptPages(
    workspaceRoot,
    concepts,
    articleTitle,
    finalizedAt
  );

  // 7. Publish author page (Req 4.1, 7.4)
  const sourcePageSlug = sourcePagePath.replace('wiki/sources/', '').replace('.md', '');
  let authorResult: AuthorPageResult | undefined;
  if (authorWikiLink) {
    authorResult = publishAuthorPage(workspaceRoot, {
      authorName: authorWikiLink,
      articleTitle,
      sourcePageTitle: articleTitle,
      sourcePageSlug,
      finalizedAt,
    });
  }

  // 8. Publish publication source page (Req 4.2, 7.4)
  let publicationSourceResult: PublicationSourcePageResult | undefined;
  if (publicationSourceWikiLink) {
    publicationSourceResult = publishPublicationSourcePage(workspaceRoot, {
      domain: publicationSourceWikiLink,
      articleTitle,
      articleAuthor: authorWikiLink,
      sourcePageTitle: articleTitle,
      sourcePageSlug,
      finalizedAt,
    });
  }

  // 9. Add reciprocal references (include author and publication source pages)
  const allTargetPages = [
    ...entityResults.created,
    ...entityResults.updated,
    ...conceptResults.created,
    ...conceptResults.updated,
  ];

  // Add author page to target pages for reciprocal references
  if (authorResult && (authorResult.action === 'created' || authorResult.action === 'updated')) {
    allTargetPages.push(authorResult.path);
  }

  // Add publication source page to target pages for reciprocal references
  if (publicationSourceResult && (publicationSourceResult.action === 'created' || publicationSourceResult.action === 'updated')) {
    allTargetPages.push(publicationSourceResult.path);
  }

  const sourcePageTitle = articleTitle;
  const failedReferences = addReciprocalReferences(
    workspaceRoot,
    sourcePageTitle,
    allTargetPages
  );

  // 10. Collect all successfully created/updated pages (Req 7.4)
  const allCreatedPages: string[] = [];
  if (sourcePageCreated) {
    allCreatedPages.push(sourcePagePath);
  }
  allCreatedPages.push(...entityResults.created);
  allCreatedPages.push(...entityResults.updated);
  allCreatedPages.push(...conceptResults.created);
  allCreatedPages.push(...conceptResults.updated);

  // Add author page path to wikiPages array (Req 7.4)
  if (authorResult && (authorResult.action === 'created' || authorResult.action === 'updated')) {
    allCreatedPages.push(authorResult.path);
  }

  // Add publication source page path to wikiPages array (Req 7.4)
  if (publicationSourceResult && (publicationSourceResult.action === 'created' || publicationSourceResult.action === 'updated')) {
    allCreatedPages.push(publicationSourceResult.path);
  }

  return {
    sourcePagePath,
    entityResults,
    conceptResults,
    authorResult,
    publicationSourceResult,
    failedReferences,
    allCreatedPages,
  };
}

/**
 * Finalizes the session by recording finalizedAt and wikiPages, then transitioning to FINALIZED.
 *
 * Requirement 8.5: Record finalizedAt and wikiPages when session reaches FINALIZED.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param wikiPages - Array of successfully created wiki page paths (relative to workspace root)
 */
export async function finalizeSession(
  sessionDir: string,
  wikiPages: string[]
): Promise<void> {
  const sessionJsonPath = join(sessionDir, 'session.json');
  const raw = await readFile(sessionJsonPath, 'utf-8');
  const session: SessionJson = JSON.parse(raw);

  // Transition state to FINALIZED
  const updatedSession = transitionState(session, 'FINALIZED');

  // Record finalization fields
  updatedSession.finalizedAt = formatDate(new Date());
  updatedSession.wikiPages = wikiPages;

  await writeFile(
    sessionJsonPath,
    JSON.stringify(updatedSession, null, 2),
    'utf-8'
  );
}

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Builds SourcePageParams from session data and parsed findings.
 */
function buildSourcePageParams(
  session: SessionJson,
  parsed: { title: string; author: string; date: string; sourceUrl: string; summary: string; entities: Array<{ name: string; description: string }>; concepts: Array<{ name: string; description: string }> },
  finalizedAt: string,
  sessionDirRelative: string,
  authorWikiLink?: string,
  publicationSourceWikiLink?: string
): SourcePageParams {
  const title = session.articleTitle || parsed.title;
  const tags = generateTagsFromContent(parsed);

  // Extract key points from the summary
  const keyPoints = extractKeyPoints(parsed.summary);

  // Extract insights
  const insights = extractInsights(parsed.summary);

  return {
    title,
    author: session.articleAuthor || (parsed.author !== 'Unknown' ? parsed.author : undefined),
    date: session.articleDate || (parsed.date !== 'Unknown' ? parsed.date : undefined),
    url: session.articleUrl,
    tags,
    created: finalizedAt,
    updated: finalizedAt,
    keyPoints,
    insights,
    entities: parsed.entities.map(e => e.name),
    concepts: parsed.concepts.map(c => c.name),
    sessionDir: sessionDirRelative,
    authorWikiLink,
    publicationSourceWikiLink,
  };
}

/**
 * Builds EntityCandidate array from parsed entity data.
 */
function buildEntityCandidates(
  entities: Array<{ name: string; description: string }>
): EntityCandidate[] {
  return entities.map(entity => {
    const slug = toKebabCase(entity.name);
    return {
      name: entity.name,
      description: entity.description,
      proposedPath: `wiki/entities/${slug}.md`,
    };
  });
}

/**
 * Builds ConceptCandidate array from parsed concept data.
 */
function buildConceptCandidates(
  concepts: Array<{ name: string; description: string }>
): ConceptCandidate[] {
  return concepts.map(concept => {
    const slug = toKebabCase(concept.name);
    return {
      name: concept.name,
      description: concept.description,
      proposedPath: `wiki/concepts/${slug}.md`,
    };
  });
}

/**
 * Generates tags from parsed content (entities and concepts).
 */
function generateTagsFromContent(
  parsed: { entities: Array<{ name: string }>; concepts: Array<{ name: string }> }
): string[] {
  const tags: string[] = ['article'];

  for (const entity of parsed.entities.slice(0, 3)) {
    const tag = entity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (tag) tags.push(tag);
  }

  for (const concept of parsed.concepts.slice(0, 2)) {
    const tag = concept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (tag) tags.push(tag);
  }

  return [...new Set(tags)];
}

/**
 * Extracts key points from the summary text.
 * Returns at least one bullet point.
 */
function extractKeyPoints(summary: string): string[] {
  if (!summary || summary.trim() === '' || summary === 'No summary available.') {
    return ['Key points to be documented from article analysis.'];
  }

  const sentences = summary
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) {
    return [summary.trim() || 'Key points to be documented from article analysis.'];
  }

  return sentences.slice(0, 5).map(s => s.endsWith('.') ? s : s + '.');
}

/**
 * Extracts insights from the summary text.
 * Returns at least one insight.
 */
function extractInsights(summary: string): string[] {
  if (!summary || summary.trim() === '' || summary === 'No summary available.') {
    return ['Insights to be synthesized from article analysis.'];
  }

  const paragraphs = summary
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    return [summary.trim() || 'Insights to be synthesized from article analysis.'];
  }

  return paragraphs.slice(0, 3);
}

/**
 * Converts a string to kebab-case.
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Ensures the directory for a file path exists.
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Formats a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
