/**
 * Article content JSON serialization for the Content_Extractor subsystem
 * Feature: article-research-session
 * Requirements: 3.3, 3.5
 *
 * Saves and loads the structured ArticleContent representation as
 * `article-content.json` in the session directory. The JSON includes
 * `candidateEntities` and `candidateConcepts` arrays.
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { ArticleContent } from '../types/article-session';

/**
 * Saves the structured ArticleContent as `article-content.json` in the session directory.
 *
 * Serializes the ArticleContent object to JSON with 2-space indentation for readability.
 * The output includes `candidateEntities` and `candidateConcepts` arrays as required
 * by Requirement 3.5.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param content - The structured ArticleContent to serialize
 */
export async function saveArticleContent(
  sessionDir: string,
  content: ArticleContent
): Promise<void> {
  const filePath = join(sessionDir, 'article-content.json');
  const json = JSON.stringify(content, null, 2);
  await writeFile(filePath, json, 'utf-8');
}

/**
 * Loads the structured ArticleContent from `article-content.json` in the session directory.
 *
 * Reads and deserializes the JSON file back into an ArticleContent object.
 * Used for round-trip verification and downstream processing.
 *
 * @param sessionDir - Absolute path to the session directory
 * @returns The deserialized ArticleContent object
 * @throws Error if the file does not exist or contains invalid JSON
 */
export async function loadArticleContent(
  sessionDir: string
): Promise<ArticleContent> {
  const filePath = join(sessionDir, 'article-content.json');
  const json = await readFile(filePath, 'utf-8');
  return JSON.parse(json) as ArticleContent;
}
