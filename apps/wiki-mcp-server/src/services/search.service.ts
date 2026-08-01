import * as fs from 'fs';
import * as path from 'path';
import { WikiIndex, SearchResult } from '../models/types';

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

export function searchContent(wikiDir: string, index: WikiIndex, query: string): SearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [, meta] of index.pages) {
    const titleLower = meta.title.toLowerCase();
    let excerpt = '';

    if (titleLower.includes(lowerQuery)) {
      excerpt = buildExcerpt(meta.title, query);
    } else {
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
