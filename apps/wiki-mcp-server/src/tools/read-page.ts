import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { WikiIndex, ReadPageResult } from '../models/types';

export function handleReadPage(
  wikiDir: string,
  index: WikiIndex,
  params: { title?: string; path?: string }
): ReadPageResult | { error: string } {
  const { title, path: filePath } = params;

  let meta = undefined;
  let normalizedTitle = '';

  if (title) {
    normalizedTitle = title.toLowerCase();
    meta = index.pages.get(normalizedTitle);
  } else if (filePath) {
    for (const [key, page] of index.pages) {
      if (page.filePath === filePath) {
        meta = page;
        normalizedTitle = key;
        break;
      }
    }
  }

  if (!meta) {
    const identifier = title ?? filePath ?? '(unknown)';
    return { error: `Page not found: "${identifier}"` };
  }

  const fullPath = path.join(wikiDir, meta.filePath);
  let rawContent: string;
  try {
    rawContent = fs.readFileSync(fullPath, 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Failed to read page "${meta.title}": ${msg}` };
  }

  const parsed = matter(rawContent);
  const backlinks = index.backlinks.get(normalizedTitle) ?? [];

  return {
    title: meta.title,
    content: rawContent,
    frontmatter: parsed.data as Record<string, unknown>,
    backlinks,
  };
}
