/**
 * Search Engine - Simple in-memory full-text search across wiki pages.
 */

import * as fs from 'fs';
import * as path from 'path';
import { WikiIndex, SearchResult } from './types';

/**
 * Performs case-insensitive full-text search across page content and titles.
 * Returns first match excerpt (~100 chars around match) per page.
 * Returns empty array for no matches or empty query.
 */
export function searchContent(wikiDir: string, index: WikiIndex, query: string): SearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [, meta] of index.pages) {
    // Check title match first
    const titleLower = meta.title.toLowerCase();
    let excerpt = '';

    if (titleLower.includes(lowerQuery)) {
      // Excerpt from title
      excerpt = buildExcerpt(meta.title, query);
    } else {
      // Check content match
      let rawContent: string;
      try {
        rawContent = fs.readFileSync(path.join(wikiDir, meta.filePath), 'utf-8');
      } catch {
        continue;
      }

      const contentLower = rawContent.toLowerCase();
      const matchIdx = contentLower.indexOf(lowerQuery);
      if (matchIdx === -1) {
        continue;
      }

      excerpt = buildExcerpt(rawContent, query, matchIdx);
    }

    results.push({
      title: meta.title,
      type: meta.type,
      filePath: meta.filePath,
      excerpt,
    });
  }

  return results;
}

/**
 * Builds a ~100 char excerpt around the first match of query in text.
 * If matchIdx is provided, uses it directly; otherwise searches for the match.
 */
function buildExcerpt(text: string, query: string, matchIdx?: number): string {
  const idx = matchIdx ?? text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return text.slice(0, 100);
  }

  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + query.length + 50);
  let excerpt = text.slice(start, end).replace(/\n/g, ' ').trim();

  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';

  return excerpt;
}
