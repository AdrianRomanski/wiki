import * as fs from 'fs';
import * as path from 'path';
import { WikiIndex, CreatePageResult } from '../models/types';
import { generateFileName } from '../domain/filename-gen';

const SUBDIR: Record<string, string> = {
  entity: 'entities',
  concept: 'concepts',
  source: 'sources',
};

export function handleCreatePage(
  wikiDir: string,
  index: WikiIndex,
  params: {
    title: string;
    type: 'entity' | 'concept' | 'source';
    tags: string[];
    content: string;
    sources?: string[];
    author?: string;
    date?: string;
    url?: string;
  }
): CreatePageResult | { error: string } {
  const { title, type, tags, content, sources, author, date, url } = params;

  if (!['entity', 'concept', 'source'].includes(type)) {
    return { error: `Invalid type "${type}". Must be one of: entity, concept, source` };
  }

  const normalizedTitle = title.toLowerCase();
  if (index.pages.has(normalizedTitle)) {
    return { error: `Page already exists: "${title}"` };
  }

  const fileName = generateFileName(title, type);
  const subdir = SUBDIR[type];
  const relativeFilePath = `${subdir}/${fileName}`;
  const fullFilePath = path.join(wikiDir, relativeFilePath);

  const today = new Date().toISOString().split('T')[0];
  const frontmatterLines: string[] = [
    `title: ${title}`,
    `type: ${type}`,
    `tags:`,
    ...tags.map((t) => `  - ${t}`),
    `created: "${today}"`,
    `updated: "${today}"`,
  ];

  if (sources && sources.length > 0) {
    frontmatterLines.push('sources:');
    sources.forEach((s) => frontmatterLines.push(`  - ${s}`));
  }
  if (author) frontmatterLines.push(`author: ${author}`);
  if (date) frontmatterLines.push(`date: "${date}"`);
  if (url) frontmatterLines.push(`url: ${url}`);

  const fileContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${content}`;

  try {
    fs.writeFileSync(fullFilePath, fileContent, 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Failed to write page file: ${msg}` };
  }

  try {
    const indexPath = path.join(wikiDir, 'index.md');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const entry = `- [[${title}]] — ${type}`;
    const updated = indexContent.trimEnd() + '\n' + entry + '\n';
    fs.writeFileSync(indexPath, updated, 'utf-8');
  } catch {
    console.warn(`Warning: Could not update wiki/index.md for new page "${title}"`);
  }

  return { filePath: relativeFilePath, title };
}
