/**
 * Article content JSON serialization for the Content_Extractor subsystem
 * Feature: article-research-session
 * Requirements: 3.3, 3.5
 *
 * Saves and loads the structured ArticleContent representation as
 * `article-content.json` in the session directory. The JSON includes
 * `candidateEntities` and `candidateConcepts` arrays.
 *
 * All file I/O is routed through FileSystemPort (Requirement 1.2, 5.6).
 */

import type { FileSystemPort } from '@wiki/application-ports';
import type { ArticleContent } from '@wiki/domain-research-session';

/**
 * Saves the structured ArticleContent as `article-content.json` in the session directory.
 *
 * Serializes the ArticleContent object to JSON with 2-space indentation for readability.
 * The output includes `candidateEntities` and `candidateConcepts` arrays as required
 * by Requirement 3.5.
 *
 * @param fs - FileSystemPort used to write article-content.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @param content - The structured ArticleContent to serialize
 */
export async function saveArticleContent(
  fs: FileSystemPort,
  sessionDir: string,
  content: ArticleContent
): Promise<void> {
  const filePath = `${sessionDir}/article-content.json`;
  const json = JSON.stringify(content, null, 2);
  await fs.writeFile(filePath, json);
}

/**
 * Loads the structured ArticleContent from `article-content.json` in the session directory.
 *
 * Reads and deserializes the JSON file back into an ArticleContent object.
 * Used for round-trip verification and downstream processing.
 *
 * @param fs - FileSystemPort used to read article-content.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns The deserialized ArticleContent object
 * @throws Error if the file does not exist or contains invalid JSON
 */
export async function loadArticleContent(
  fs: FileSystemPort,
  sessionDir: string
): Promise<ArticleContent> {
  const filePath = `${sessionDir}/article-content.json`;
  const json = await fs.readFile(filePath);
  return JSON.parse(json) as ArticleContent;
}
