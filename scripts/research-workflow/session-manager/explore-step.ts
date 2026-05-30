/**
 * EXPLORE step orchestration for article research sessions
 * Feature: article-research-session
 * Requirements: 4.1, 4.2, 4.6, 4.7, 9.4, 9.6, 9.7
 *
 * Orchestrates the EXPLORE step:
 * 1. Reads parsed ArticleContent from article-content.json
 * 2. Presents metadata for user confirmation (returns data structure)
 * 3. Accepts confirmed/corrected metadata and writes to session.json
 * 4. Triggers generateAnalysis() from the content-extractor
 * 5. Calls transitionState() to move to SYNTHESIZE
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type {
  ArticleContent,
  ArticleMetadata,
  SessionJson,
} from '../types/article-session';
import { generateAnalysis } from '../content-extractor/generate-analysis';
import { loadArticleContent } from '../content-extractor/save-article-content';
import { transitionState } from './state-transitions';

/**
 * Metadata extracted from the article, presented to the user for confirmation.
 * Requirement 4.1: Present extracted metadata (title, author, date) for confirmation.
 */
export interface ExtractedMetadata {
  /** Article title extracted from content */
  title: string;
  /** Author name (undefined if not extractable) */
  author?: string;
  /** Publication date (undefined if not extractable) */
  date?: string;
}

/**
 * Retrieves the article metadata from article-content.json for user confirmation.
 *
 * Requirement 4.1: Present extracted metadata (title, author, date) for confirmation.
 *
 * @param sessionDir - Absolute path to the session directory
 * @returns The extracted metadata fields for user review
 * @throws Error if article-content.json cannot be read
 */
export async function getMetadataForConfirmation(
  sessionDir: string
): Promise<ExtractedMetadata> {
  const content = await loadArticleContent(sessionDir);

  return {
    title: content.title,
    author: content.author,
    date: content.date,
  };
}

/**
 * Confirms (or corrects) article metadata and writes it to session.json.
 *
 * Requirement 4.2: Allow user to correct rejected metadata fields.
 * Requirement 9.4: Write articleTitle when confirmed.
 * Requirement 9.6: Write articleAuthor if extractable, omit if not.
 * Requirement 9.7: Write articleDate if extractable, omit if not.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param metadata - The confirmed (possibly corrected) metadata from the user
 */
export async function confirmMetadata(
  sessionDir: string,
  metadata: ExtractedMetadata
): Promise<void> {
  const sessionJsonPath = join(sessionDir, 'session.json');
  const raw = await readFile(sessionJsonPath, 'utf-8');
  const session: SessionJson = JSON.parse(raw);

  // Requirement 9.4: Write articleTitle as confirmed title
  session.articleTitle = metadata.title;

  // Requirement 9.6: Write articleAuthor if present, omit if not
  if (metadata.author) {
    session.articleAuthor = metadata.author;
  } else {
    delete session.articleAuthor;
  }

  // Requirement 9.7: Write articleDate if present, omit if not
  if (metadata.date) {
    session.articleDate = metadata.date;
  } else {
    delete session.articleDate;
  }

  await writeFile(sessionJsonPath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * Completes the EXPLORE step by generating the analysis artifact and
 * transitioning the session to SYNTHESIZE.
 *
 * Requirement 4.6: Transition to SYNTHESIZE on success.
 * Requirement 4.7: Inform user session is moving to SYNTHESIZE.
 *
 * @param sessionDir - Absolute path to the session directory
 * @returns A message indicating the session has moved to SYNTHESIZE
 * @throws AnalysisGenerationError if article-analysis.md cannot be generated
 * @throws InvalidTransitionError if the state transition is invalid
 */
export async function completeExploreStep(
  sessionDir: string
): Promise<string> {
  const sessionJsonPath = join(sessionDir, 'session.json');

  // Load session to build metadata and verify state
  const raw = await readFile(sessionJsonPath, 'utf-8');
  const session: SessionJson = JSON.parse(raw);

  // Load article content for analysis generation
  const content = await loadArticleContent(sessionDir);

  // Build ArticleMetadata from session data
  const metadata: ArticleMetadata = {
    title: session.articleTitle!,
    author: session.articleAuthor,
    date: session.articleDate,
    sourceUrl: session.articleUrl,
    inputType: session.articleInputType,
  };

  // Generate article-analysis.md
  await generateAnalysis(sessionDir, content, metadata);

  // Transition state to SYNTHESIZE
  const updatedSession = transitionState(session, 'SYNTHESIZE');

  // Persist updated session state
  await writeFile(
    sessionJsonPath,
    JSON.stringify(updatedSession, null, 2),
    'utf-8'
  );

  // Requirement 4.7: Inform user session is moving to SYNTHESIZE
  return 'Article analysis complete. The session is now moving to the SYNTHESIZE step.';
}
