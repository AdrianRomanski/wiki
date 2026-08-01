import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { PageMeta, WikiIndex } from '../models/types';
import { parseFrontmatter } from '../domain/frontmatter';
import { extractWikiLinks } from '../domain/wikilink-parser';

export function validateStructure(wikiDir: string): { valid: boolean; error?: string } {
  const required = [
    { name: 'index.md', check: (p: string) => fs.existsSync(p) && fs.statSync(p).isFile() },
    { name: 'entities/', check: (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory() },
    { name: 'concepts/', check: (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory() },
    { name: 'sources/', check: (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory() },
  ];

  const missing: string[] = [];

  for (const item of required) {
    const fullPath = path.join(wikiDir, item.name.replace(/\/$/, ''));
    if (!item.check(fullPath)) {
      missing.push(item.name);
    }
  }

  if (missing.length > 0) {
    return { valid: false, error: `Missing: ${missing.join(', ')}` };
  }

  return { valid: true };
}

export async function buildIndex(wikiDir: string): Promise<WikiIndex> {
  const pages = new Map<string, PageMeta>();
  const backlinks = new Map<string, string[]>();
  const tags = new Map<string, string[]>();

  const subdirs = ['entities', 'concepts', 'sources'];

  for (const subdir of subdirs) {
    const dirPath = path.join(wikiDir, subdir);

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      continue;
    }

    let files: string[];
    try {
      files = fs.readdirSync(dirPath);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }

      const fullPath = path.join(dirPath, file);
      const relativePath = `${subdir}/${file}`;

      let rawContent: string;
      try {
        rawContent = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        console.warn(`Warning: Could not read file "${relativePath}", skipping.`);
        continue;
      }

      const result = parseFrontmatter(relativePath, rawContent);

      if (!result.success || !result.meta) {
        console.warn(`Warning: Skipping "${relativePath}": ${result.error}`);
        continue;
      }

      const meta = result.meta;

      const parsed = matter(rawContent);
      const outgoingLinks = extractWikiLinks(parsed.content);
      meta.outgoingLinks = outgoingLinks;

      const normalizedTitle = meta.title.toLowerCase();
      pages.set(normalizedTitle, meta);
    }
  }

  for (const [, pageMeta] of pages) {
    for (const linkTarget of pageMeta.outgoingLinks) {
      const normalizedTarget = linkTarget.toLowerCase();
      if (!backlinks.has(normalizedTarget)) {
        backlinks.set(normalizedTarget, []);
      }
      backlinks.get(normalizedTarget)!.push(pageMeta.title);
    }
  }

  for (const [, pageMeta] of pages) {
    for (const tag of pageMeta.tags) {
      const normalizedTag = tag.toLowerCase();
      if (!tags.has(normalizedTag)) {
        tags.set(normalizedTag, []);
      }
      tags.get(normalizedTag)!.push(pageMeta.title);
    }
  }

  return { pages, backlinks, tags };
}
