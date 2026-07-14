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
 *
 * All file I/O is routed through FileSystemPort, and frontmatter parsing/rendering
 * (needed by the author/publication-source page append paths) through
 * FrontmatterPort (Requirement 1.2, 5.6).
 */

import type { FileSystemPort, FrontmatterPort } from '@wiki/application-ports';
import type {
  SessionJson,
  FailedReference,
  EntityCandidate,
  ConceptCandidate,
} from '@wiki/domain-research-session';
import { extractDomain } from '@wiki/domain-research-session';
import { transitionState } from './state-transitions';
import { constructSourcePagePath } from '@wiki/application-wiki-publisher';
import { generateSourcePage } from '@wiki/application-wiki-publisher';
import type { SourcePageParams } from '@wiki/application-wiki-publisher';
import { publishEntityPages, publishConceptPages } from '@wiki/application-wiki-publisher';
import type { PublishResult } from '@wiki/application-wiki-publisher';
import { addReciprocalReferences } from '@wiki/application-wiki-publisher';
import { publishAuthorPage } from '@wiki/application-wiki-publisher';
import type { AuthorPageResult } from '@wiki/application-wiki-publisher';
import { publishPublicationSourcePage } from '@wiki/application-wiki-publisher';
import type { PublicationSourcePageResult } from '@wiki/application-wiki-publisher';
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
 * @param fs - FileSystemPort used to read findings-summary.md
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns The full markdown content of findings-summary.md
 * @throws Error if findings-summary.md cannot be read
 */
export async function getFindingsSummaryForReview(
  fs: FileSystemPort,
  sessionDir: string
): Promise<string> {
  return fs.readFile(`${sessionDir}/findings-summary.md`);
}

/**
 * Handles the decline path: records wikiPages as empty array and transitions to FINALIZED.
 *
 * Requirement 6.8: If user declines publication, record wikiPages as empty array.
 * Requirement 8.5: Record finalizedAt and wikiPages when session reaches FINALIZED.
 *
 * @param fs - FileSystemPort used to read/write session.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 */
export async function declinePublication(
  fs: FileSystemPort,
  sessionDir: string
): Promise<void> {
  await finalizeSession(fs, sessionDir, []);
}

/**
 * Orchestrates the full wiki publication process.
 *
 * Steps:
 * 1. Read session.json and findings-summary.md
 * 2. Construct source page path and generate source page content
 * 3. Write source page via FileSystemPort
 * 4. Publish entity pages
 * 5. Publish concept pages
 * 6. Publish author page and publication source page (when applicable)
 * 7. Add reciprocal references
 * 8. Return results (created pages, failed pages)
 *
 * Requirement 6.7: Handle per-page write failures, report status, record only successful pages.
 *
 * @param fs - FileSystemPort used for all session and wiki-page I/O
 * @param frontmatter - FrontmatterPort used to parse/render frontmatter on author/publication-source append paths
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns PublicationResult with details of all created/failed pages
 */
export async function acceptPublication(
  fs: FileSystemPort,
  frontmatter: FrontmatterPort,
  sessionDir: string
): Promise<PublicationResult> {
  // 1. Read session.json and findings-summary.md
  const sessionJsonPath = `${sessionDir}/session.json`;
  const sessionRaw = await fs.readFile(sessionJsonPath);
  const session: SessionJson = JSON.parse(sessionRaw);

  const findingsContent = await fs.readFile(`${sessionDir}/findings-summary.md`);

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
  const sourcePageContent = generateSourcePage(buildSourcePageParams(
    session,
    parsed,
    finalizedAt,
    sessionDir,
    authorWikiLink,
    publicationSourceWikiLink
  ));

  let sourcePageCreated = true;
  try {
    const wikiRelativeSourcePath = sourcePagePath.startsWith('wiki/')
      ? sourcePagePath.slice('wiki/'.length)
      : sourcePagePath;
    await fs.writeWikiFile(wikiRelativeSourcePath, sourcePageContent);
  } catch {
    sourcePageCreated = false;
  }

  // 5. Publish entity pages
  const entities = buildEntityCandidates(parsed.entities);
  const entityResults = await publishEntityPages(
    fs,
    entities,
    articleTitle,
    finalizedAt
  );

  // 6. Publish concept pages
  const concepts = buildConceptCandidates(parsed.concepts);
  const conceptResults = await publishConceptPages(
    fs,
    concepts,
    articleTitle,
    finalizedAt
  );

  // 7. Publish author page (Req 4.1, 7.4)
  const sourcePageSlug = sourcePagePath.replace('wiki/sources/', '').replace('.md', '');
  let authorResult: AuthorPageResult | undefined;
  if (authorWikiLink) {
    authorResult = await publishAuthorPage(fs, frontmatter, {
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
    publicationSourceResult = await publishPublicationSourcePage(fs, frontmatter, {
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
  const failedReferences = await addReciprocalReferences(
    fs,
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
 * @param fs - FileSystemPort used to read/write session.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @param wikiPages - Array of successfully created wiki page paths (relative to workspace root)
 */
export async function finalizeSession(
  fs: FileSystemPort,
  sessionDir: string,
  wikiPages: string[]
): Promise<void> {
  const sessionJsonPath = `${sessionDir}/session.json`;
  const raw = await fs.readFile(sessionJsonPath);
  const session: SessionJson = JSON.parse(raw);

  // Transition state to FINALIZED
  const updatedSession = transitionState(session, 'FINALIZED');

  // Record finalization fields
  updatedSession.finalizedAt = formatDate(new Date());
  updatedSession.wikiPages = wikiPages;

  await fs.writeFile(sessionJsonPath, JSON.stringify(updatedSession, null, 2));
}

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Builds SourcePageParams from session data and parsed findings.
 */
function buildSourcePageParams(
  session: SessionJson,
  parsed: { title: string; author: string; date: string; sourceUrl: string; summary: string; entities: Array<{ name: string; description: string }>; concepts: Array<{ name: string; description: string }> },
  finalizedAt: string,
  sessionDir: string,
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
    sessionDir,
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
 * Formats a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
