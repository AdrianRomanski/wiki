/**
 * Raw article saving for the Article_Fetcher subsystem
 * Feature: article-research-session
 * Requirements: 2.2, 2.5, 2.6
 *
 * Saves article content as `raw-article.md` in the session directory and
 * conditionally records `articleUrl` and `publicationSource` in session.json
 * based on input type.
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { ArticleInputType, SessionJson } from '../types/article-session';

/**
 * Saves raw article content to the session directory and updates session.json.
 *
 * - Writes the content to `raw-article.md` in the session directory.
 * - If inputType is "url", adds `articleUrl` and `publicationSource` to session.json.
 *   `publicationSource` is the hostname with `www.` prefix stripped.
 * - If inputType is "pasted-text", ensures `articleUrl` and `publicationSource`
 *   are NOT present in session.json.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param content - The raw article content to save
 * @param inputType - Whether the article was provided as a URL or pasted text
 * @param url - The source URL (required when inputType is "url")
 * @throws Error if inputType is "url" but no url is provided
 */
export async function saveRawArticle(
  sessionDir: string,
  content: string,
  inputType: ArticleInputType,
  url?: string
): Promise<void> {
  if (inputType === 'url' && !url) {
    throw new Error('A URL must be provided when inputType is "url"');
  }

  // 1. Write content to raw-article.md
  const rawArticlePath = join(sessionDir, 'raw-article.md');
  await writeFile(rawArticlePath, content, 'utf-8');

  // 2. Read existing session.json
  const sessionJsonPath = join(sessionDir, 'session.json');
  const sessionData = JSON.parse(
    await readFile(sessionJsonPath, 'utf-8')
  ) as SessionJson;

  // 3. Update session.json based on input type
  if (inputType === 'url') {
    sessionData.articleUrl = url;
    // Extract publicationSource from URL hostname (Requirement 6.1)
    sessionData.publicationSource = extractPublicationSource(url!);
    // If extraction failed, omit the field (Requirement 6.4)
    if (!sessionData.publicationSource) {
      delete sessionData.publicationSource;
    }
  } else {
    // Ensure articleUrl and publicationSource are NOT present for pasted-text input (Requirement 6.2)
    delete sessionData.articleUrl;
    delete sessionData.publicationSource;
  }

  // 4. Write updated session.json back
  await writeFile(sessionJsonPath, JSON.stringify(sessionData, null, 2), 'utf-8');
}

/**
 * Extracts the publication source domain from a URL.
 * Strips `www.` prefix from the hostname, excludes port numbers and paths.
 * Returns undefined if the URL cannot be parsed.
 *
 * Requirement 6.1: Extract hostname, strip www. prefix
 * Requirement 6.4: If URL cannot be parsed, omit publicationSource without error
 *
 * @param url - The URL to extract the hostname from
 * @returns The domain string (e.g., "nx.dev") or undefined if parsing fails
 */
export function extractPublicationSource(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    let hostname = parsed.hostname;
    // Strip www. prefix (Requirement 6.1)
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    // Return undefined for empty hostnames
    if (!hostname) {
      return undefined;
    }
    return hostname;
  } catch {
    // Requirement 6.4: If URL cannot be parsed, omit without error
    return undefined;
  }
}
