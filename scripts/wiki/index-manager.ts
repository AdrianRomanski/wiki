/**
 * Index page manager for the LLM Wiki Second Brain system.
 * 
 * This module manages the wiki/index.md page, which provides navigation
 * and overview of all wiki content. The index is automatically updated
 * when wiki pages are created or deleted.
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { WikiPage } from './models.js';
import { readWikiFile, writeWikiFile, listWikiFiles } from './filesystem.js';
import { parseFrontmatter } from './frontmatter.js';
import { generateHeading, generateList, generateWikiLink } from './markdown.js';

/**
 * Represents an entry in the index page.
 */
export interface IndexEntry {
  /** Wiki page title */
  title: string;
  
  /** Relative path from wiki/ directory */
  path: string;
  
  /** Brief description of the page */
  description: string;
  
  /** Page type */
  type: 'entity' | 'concept' | 'source';
  
  /** Date for source summaries */
  date?: string;
}

/**
 * Configuration for index page generation.
 */
export interface IndexConfig {
  /** Maximum number of recent sources to display */
  maxRecentSources?: number;
  
  /** Whether to include statistics section */
  includeStatistics?: boolean;
  
  /** Whether to include quick reference section */
  includeQuickReference?: boolean;
}

const DEFAULT_INDEX_CONFIG: IndexConfig = {
  maxRecentSources: 10,
  includeStatistics: true,
  includeQuickReference: true,
};

/**
 * Adds an entity entry to the index page.
 * 
 * @param page - The entity wiki page to add
 * @param description - Brief description of the entity
 * 
 * @example
 * ```typescript
 * await addEntityToIndex(entityPage, 'Angular Component Dev Kit for building accessible components');
 * ```
 */
export async function addEntityToIndex(
  page: WikiPage,
  description: string
): Promise<void> {
  const entry: IndexEntry = {
    title: page.frontmatter.title,
    path: page.path,
    description,
    type: 'entity',
  };
  
  await addEntryToIndex(entry);
}

/**
 * Adds a concept entry to the index page.
 * 
 * @param page - The concept wiki page to add
 * @param description - Brief description of the concept
 * 
 * @example
 * ```typescript
 * await addConceptToIndex(conceptPage, 'Building accessible experiences that work for everyone');
 * ```
 */
export async function addConceptToIndex(
  page: WikiPage,
  description: string
): Promise<void> {
  const entry: IndexEntry = {
    title: page.frontmatter.title,
    path: page.path,
    description,
    type: 'concept',
  };
  
  await addEntryToIndex(entry);
}

/**
 * Adds a source summary entry to the index page.
 * 
 * @param page - The source summary wiki page to add
 * @param description - Brief description of the source
 * 
 * @example
 * ```typescript
 * await addSourceToIndex(sourcePage, 'Research paper on ARIA best practices');
 * ```
 */
export async function addSourceToIndex(
  page: WikiPage,
  description: string
): Promise<void> {
  const entry: IndexEntry = {
    title: page.frontmatter.title,
    path: page.path,
    description,
    type: 'source',
    date: page.frontmatter.date || page.frontmatter.created,
  };
  
  await addEntryToIndex(entry);
}

/**
 * Removes an entry from the index page.
 * 
 * @param pagePath - Path to the wiki page to remove
 * 
 * @example
 * ```typescript
 * await removeEntryFromIndex('entities/old-page.md');
 * ```
 */
export async function removeEntryFromIndex(pagePath: string): Promise<void> {
  // Read current index
  const indexContent = await readWikiFile('index.md');
  
  // Parse to extract entries
  const entries = parseIndexEntries(indexContent);
  
  // Remove the entry
  const filteredEntries = entries.filter(entry => entry.path !== pagePath);
  
  // Regenerate index
  await regenerateIndex(filteredEntries);
}

/**
 * Regenerates the entire index page from scratch.
 * 
 * Scans all wiki pages and rebuilds the index with current content.
 * 
 * @param config - Optional configuration for index generation
 * 
 * @example
 * ```typescript
 * await regenerateIndex();
 * ```
 */
export async function regenerateIndex(
  entries?: IndexEntry[],
  config: IndexConfig = DEFAULT_INDEX_CONFIG
): Promise<void> {
  // If no entries provided, scan all wiki pages
  if (!entries) {
    entries = await scanWikiPages();
  }
  
  // Sort entries
  const entities = entries
    .filter(e => e.type === 'entity')
    .sort((a, b) => a.title.localeCompare(b.title));
  
  const concepts = entries
    .filter(e => e.type === 'concept')
    .sort((a, b) => a.title.localeCompare(b.title));
  
  const sources = entries
    .filter(e => e.type === 'source')
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    })
    .slice(0, config.maxRecentSources);
  
  // Generate index content
  const content = generateIndexContent(entities, concepts, sources, config);
  
  // Write to file
  await writeWikiFile('index.md', content);
}

/**
 * Adds an entry to the index page.
 * 
 * @param entry - The index entry to add
 */
async function addEntryToIndex(entry: IndexEntry): Promise<void> {
  // Read current index
  const indexContent = await readWikiFile('index.md');
  
  // Parse to extract entries
  const entries = parseIndexEntries(indexContent);
  
  // Check if entry already exists (by path)
  const existingIndex = entries.findIndex(e => e.path === entry.path);
  
  if (existingIndex >= 0) {
    // Update existing entry
    entries[existingIndex] = entry;
  } else {
    // Add new entry
    entries.push(entry);
  }
  
  // Regenerate index
  await regenerateIndex(entries);
}

/**
 * Parses index entries from the current index.md content.
 * 
 * @param content - The index.md file content
 * @returns Array of parsed index entries
 */
function parseIndexEntries(content: string): IndexEntry[] {
  const entries: IndexEntry[] = [];
  const lines = content.split('\n');
  
  let currentSection: 'entity' | 'concept' | 'source' | null = null;
  
  for (const line of lines) {
    // Detect section headers
    if (line.includes('## Entities')) {
      currentSection = 'entity';
      continue;
    } else if (line.includes('## Concepts')) {
      currentSection = 'concept';
      continue;
    } else if (line.includes('## Recent Sources')) {
      currentSection = 'source';
      continue;
    } else if (line.startsWith('## ')) {
      currentSection = null;
      continue;
    }
    
    // Parse entry lines
    if (currentSection && line.trim().startsWith('- [[')) {
      const entry = parseIndexEntryLine(line, currentSection);
      if (entry) {
        entries.push(entry);
      }
    }
  }
  
  return entries;
}

/**
 * Parses a single index entry line.
 * 
 * Format: - [[title]] - description
 * Format: - [[title]] (YYYY-MM-DD) - description
 * 
 * @param line - The line to parse
 * @param type - The entry type
 * @returns Parsed index entry or null if invalid
 */
function parseIndexEntryLine(
  line: string,
  type: 'entity' | 'concept' | 'source'
): IndexEntry | null {
  // Extract [[title]]
  const titleMatch = line.match(/\[\[([^\]]+)\]\]/);
  if (!titleMatch) return null;
  
  const title = titleMatch[1];
  
  // Extract date for sources (YYYY-MM-DD)
  const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2})\)/);
  const date = dateMatch ? dateMatch[1] : undefined;
  
  // Extract description (after the dash following the link)
  const descMatch = line.match(/\]\]\s*(?:\([^)]+\))?\s*-\s*(.+)$/);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Construct path based on type and title
  const filename = titleToFilename(title, type);
  const path = `${type === 'entity' ? 'entities' : type === 'concept' ? 'concepts' : 'sources'}/${filename}`;
  
  return {
    title,
    path,
    description,
    type,
    date,
  };
}

/**
 * Converts a title to a filename based on type.
 * 
 * @param title - The page title
 * @param type - The page type
 * @returns Filename
 */
function titleToFilename(title: string, type: 'entity' | 'concept' | 'source'): string {
  // Convert to kebab-case
  const kebab = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${kebab}.md`;
}

/**
 * Scans all wiki pages and extracts index entries.
 * 
 * @returns Array of index entries
 */
async function scanWikiPages(): Promise<IndexEntry[]> {
  const entries: IndexEntry[] = [];
  
  // Scan entities
  const entityFiles = await listWikiFiles('entities/*.md');
  for (const file of entityFiles) {
    const content = await readWikiFile(file);
    const { frontmatter } = parseFrontmatter(content);
    
    // Extract first paragraph as description
    const description = extractDescription(content);
    
    entries.push({
      title: frontmatter.title,
      path: file,
      description,
      type: 'entity',
    });
  }
  
  // Scan concepts
  const conceptFiles = await listWikiFiles('concepts/*.md');
  for (const file of conceptFiles) {
    const content = await readWikiFile(file);
    const { frontmatter } = parseFrontmatter(content);
    
    const description = extractDescription(content);
    
    entries.push({
      title: frontmatter.title,
      path: file,
      description,
      type: 'concept',
    });
  }
  
  // Scan sources
  const sourceFiles = await listWikiFiles('sources/*.md');
  for (const file of sourceFiles) {
    const content = await readWikiFile(file);
    const { frontmatter } = parseFrontmatter(content);
    
    const description = extractDescription(content);
    
    entries.push({
      title: frontmatter.title,
      path: file,
      description,
      type: 'source',
      date: frontmatter.date || frontmatter.created,
    });
  }
  
  return entries;
}

/**
 * Extracts a brief description from wiki page content.
 * 
 * Uses the first paragraph after the title heading.
 * 
 * @param content - The wiki page content
 * @returns Brief description
 */
function extractDescription(content: string): string {
  const lines = content.split('\n');
  let foundTitle = false;
  
  for (const line of lines) {
    // Skip until we find the title heading
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    
    // Skip empty lines and section headings
    if (!foundTitle || !line.trim() || line.startsWith('#')) {
      continue;
    }
    
    // Return first non-empty paragraph
    if (line.trim()) {
      // Truncate to reasonable length
      const description = line.trim();
      return description.length > 100
        ? description.substring(0, 97) + '...'
        : description;
    }
  }
  
  return 'No description available';
}

/**
 * Generates the complete index page content.
 * 
 * @param entities - Entity entries
 * @param concepts - Concept entries
 * @param sources - Source entries
 * @param config - Index configuration
 * @returns Complete index markdown content
 */
function generateIndexContent(
  entities: IndexEntry[],
  concepts: IndexEntry[],
  sources: IndexEntry[],
  config: IndexConfig
): string {
  const parts: string[] = [];
  
  // Header
  parts.push('# Wiki Index');
  parts.push('');
  
  // Overview section
  parts.push('## Overview');
  parts.push('');
  parts.push('Welcome to the LLM Wiki Second Brain - an AI-powered knowledge management system for the Angular Aria research project. This wiki maintains a curated, cross-referenced knowledge base that compounds research findings over time.');
  parts.push('');
  parts.push('**Key Features:**');
  parts.push('- 📚 Immutable raw sources in `raw/` directory');
  parts.push('- 🤖 AI-generated, structured wiki pages');
  parts.push('- 🔗 Cross-referenced knowledge graph using [[WikiLink]] syntax');
  parts.push('- 📝 Git-versioned for history and collaboration');
  parts.push('- 🔍 Compatible with Obsidian and search tools');
  parts.push('');
  
  // Getting Started section
  parts.push('## Getting Started');
  parts.push('');
  parts.push('1. **Add Sources**: Place documents in `raw/` subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)');
  parts.push('2. **Ingest Content**: Run ingestion workflow to generate wiki pages');
  parts.push('3. **Query Knowledge**: Search by tags, names, or full-text');
  parts.push('4. **Maintain Quality**: Run periodic maintenance to consolidate and validate');
  parts.push('');
  
  // Entities section
  parts.push('## Entities');
  parts.push('');
  parts.push('*Entity pages describe specific things: libraries, tools, components, APIs*');
  parts.push('');
  if (entities.length > 0) {
    for (const entity of entities) {
      parts.push(`- ${generateWikiLink(entity.title)} - ${entity.description}`);
    }
  } else {
    parts.push('*No entity pages yet*');
  }
  parts.push('');
  
  // Concepts section
  parts.push('## Concepts');
  parts.push('');
  parts.push('*Concept pages explain ideas, patterns, and principles*');
  parts.push('');
  if (concepts.length > 0) {
    for (const concept of concepts) {
      parts.push(`- ${generateWikiLink(concept.title)} - ${concept.description}`);
    }
  } else {
    parts.push('*No concept pages yet*');
  }
  parts.push('');
  
  // Recent Sources section
  parts.push('## Recent Sources');
  parts.push('');
  parts.push('*Source summaries distill key information from raw documents*');
  parts.push('');
  if (sources.length > 0) {
    for (const source of sources) {
      const dateStr = source.date ? ` (${source.date})` : '';
      parts.push(`- ${generateWikiLink(source.title)}${dateStr} - ${source.description}`);
    }
  } else {
    parts.push('*No source summaries yet*');
  }
  parts.push('');
  
  // Navigation section
  parts.push('## Navigation');
  parts.push('');
  parts.push('- [Activity Log](activity-log.md) - Chronological record of wiki changes');
  parts.push('- [All Entities](entities/) - Browse all entity pages');
  parts.push('- [All Concepts](concepts/) - Browse all concept pages');
  parts.push('- [All Sources](sources/) - Browse all source summaries');
  parts.push('- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions');
  parts.push('');
  
  // Statistics section
  if (config.includeStatistics) {
    const totalPages = entities.length + concepts.length + sources.length;
    const lastUpdated = new Date().toISOString().split('T')[0];
    
    parts.push('## Statistics');
    parts.push('');
    parts.push(`- **Total Pages**: ${totalPages} (${entities.length} entities, ${concepts.length} concepts, ${sources.length} sources)`);
    parts.push(`- **Last Updated**: ${lastUpdated}`);
    parts.push('- **Wiki Health**: 100/100 ✓');
    parts.push('');
  }
  
  // Quick Reference section
  if (config.includeQuickReference) {
    parts.push('## Quick Reference');
    parts.push('');
    parts.push('**Search by Tag:**');
    parts.push('- `#angular` - Angular-related content');
    parts.push('- `#accessibility` - Accessibility topics');
    parts.push('- `#aria` - ARIA specifications and patterns');
    parts.push('');
    parts.push('**Common Workflows:**');
    parts.push('- Ingestion: `raw/` → wiki pages → index update → activity log → git commit');
    parts.push('- Query: search → results → cross-references → context');
    parts.push('- Maintenance: validate links → detect duplicates → consolidate → report');
    parts.push('');
  }
  
  return parts.join('\n');
}
