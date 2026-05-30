/**
 * Source page path construction utility
 * Feature: article-research-session
 * Requirements: 6.2
 *
 * Constructs the file path for a normalized source page following the pattern:
 * `wiki/sources/[slug]-article-[YYYY-MM-DD].md`
 *
 * where [slug] is the article title converted to kebab-case and [date] is
 * the finalizedAt date in YYYY-MM-DD format.
 */

import { generateSessionId } from '../utils/generate-session-id';

/**
 * Constructs the source page path for an article research session.
 *
 * @param articleTitle - The confirmed article title
 * @param finalizedAt - The finalization date in YYYY-MM-DD format
 * @returns The source page path in the format `wiki/sources/[slug]-article-[YYYY-MM-DD].md`
 * @throws Error if articleTitle is empty or produces an empty slug
 * @throws Error if finalizedAt is not a valid YYYY-MM-DD date string
 */
export function constructSourcePagePath(articleTitle: string, finalizedAt: string): string {
  if (!finalizedAt || !/^\d{4}-\d{2}-\d{2}$/.test(finalizedAt)) {
    throw new Error('finalizedAt must be a valid date in YYYY-MM-DD format');
  }

  const slug = generateSessionId(articleTitle);

  return `wiki/sources/${slug}-article-${finalizedAt}.md`;
}
