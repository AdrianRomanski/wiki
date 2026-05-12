#!/usr/bin/env node
/**
 * Regenerates wiki/index.md from the actual files on disk.
 *
 * Reads wiki/entities/, wiki/concepts/, and wiki/sources/ — parses each
 * file's frontmatter for title/description — then rewrites index.md.
 *
 * Run with: node scripts/generate-wiki-index.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wikiDir = join(__dirname, '..', 'wiki');

// ── helpers ──────────────────────────────────────────────────────────────────

function readDir(subdir) {
  const dir = join(wikiDir, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ file: `${subdir}/${f}`, path: join(dir, f) }));
}

/** Minimal YAML frontmatter parser — handles the subset used in this wiki. */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) result[key.trim()] = rest.join(':').trim();
  }
  return result;
}

/** Pull the first non-empty paragraph after the H1 as a description. */
function extractDescription(content) {
  const body = content.replace(/^---[\s\S]*?---\n/, '');
  const lines = body.split('\n');
  let pastTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ')) { pastTitle = true; continue; }
    if (!pastTitle || !line.trim() || line.startsWith('#')) continue;
    const desc = line.trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
    return desc.length > 120 ? desc.slice(0, 117) + '...' : desc;
  }
  return '';
}

function toWikiLink(title) {
  return `[[${title}]]`;
}

// ── scan pages ───────────────────────────────────────────────────────────────

function scanSection(subdir, type) {
  return readDir(subdir).map(({ file, path }) => {
    const content = readFileSync(path, 'utf-8');
    const fm = parseFrontmatter(content);
    return {
      type,
      title: fm.title || file,
      file,
      description: extractDescription(content),
      date: fm.date || fm.created || '',
    };
  });
}

const entities = scanSection('entities', 'entity').sort((a, b) => a.title.localeCompare(b.title));
const concepts = scanSection('concepts', 'concept').sort((a, b) => a.title.localeCompare(b.title));
const sources  = scanSection('sources',  'source')
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 10);

// ── build index.md ───────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const total  = entities.length + concepts.length + sources.length;

function renderSection(label, italic, items, renderLine) {
  const lines = [`## ${label}`, '', `*${italic}*`, ''];
  if (items.length) items.forEach((item) => lines.push(renderLine(item)));
  else lines.push(`*No ${label.toLowerCase()} yet*`);
  lines.push('');
  return lines.join('\n');
}

const index = [
  '# Wiki Index',
  '',
  '## Overview',
  '',
  'Welcome to the LLM Wiki Second Brain - an AI-powered knowledge management system for the Angular Aria research project. This wiki maintains a curated, cross-referenced knowledge base that compounds research findings over time.',
  '',
  '**Key Features:**',
  '- 📚 Immutable raw sources in `raw/` directory',
  '- 🤖 AI-generated, structured wiki pages',
  '- 🔗 Cross-referenced knowledge graph using [[WikiLink]] syntax',
  '- 📝 Git-versioned for history and collaboration',
  '- 🔍 Compatible with Obsidian and search tools',
  '',
  '## Getting Started',
  '',
  '1. **Add Sources**: Place documents in `raw/` subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)',
  '2. **Ingest Content**: Run ingestion workflow to generate wiki pages',
  '3. **Query Knowledge**: Search by tags, names, or full-text',
  '4. **Maintain Quality**: Run periodic maintenance to consolidate and validate',
  '',
  renderSection(
    'Entities',
    'Entity pages describe specific things: libraries, tools, components, APIs',
    entities,
    (e) => `- ${toWikiLink(e.title)}${e.description ? ' — ' + e.description : ''}`
  ),
  renderSection(
    'Concepts',
    'Concept pages explain ideas, patterns, and principles',
    concepts,
    (c) => `- ${toWikiLink(c.title)}${c.description ? ' — ' + c.description : ''}`
  ),
  renderSection(
    'Recent Sources',
    'Source summaries distill key information from raw documents',
    sources,
    (s) => `- ${toWikiLink(s.title)}${s.description ? ' — ' + s.description : ''}`
  ),
  '## Navigation',
  '',
  '- [Activity Log](activity-log.md) - Chronological record of wiki changes',
  '- [All Entities](entities/) - Browse all entity pages',
  '- [All Concepts](concepts/) - Browse all concept pages',
  '- [All Sources](sources/) - Browse all source summaries',
  '- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions',
  '',
  '## Statistics',
  '',
  `- **Total Pages**: ${total} (${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}, ${concepts.length} concepts, ${sources.length} ${sources.length === 1 ? 'source' : 'sources'})`,
  `- **Last Updated**: ${today}`,
  '- **Wiki Health**: ✅',
  '',
  '## Quick Reference',
  '',
  '**Search by Tag:**',
  '- `#angular` - Angular-related content',
  '- `#accessibility` - Accessibility topics',
  '- `#aria` - ARIA specifications and patterns',
  '',
  '**Common Workflows:**',
  '- Ingestion: `raw/` → wiki pages → index update → activity log → git commit',
  '- Query: search → results → cross-references → context',
  '- Maintenance: validate links → detect duplicates → consolidate → report',
].join('\n');

writeFileSync(join(wikiDir, 'index.md'), index + '\n', 'utf-8');

console.log(`wiki/index.md regenerated — ${entities.length} entities, ${concepts.length} concepts, ${sources.length} sources`);
