/**
 * Frontmatter Parser - Wraps gray-matter with validation and error handling.
 */

import matter from 'gray-matter';
import { PageMeta, ParseResult } from './types';

const VALID_TYPES = ['entity', 'concept', 'source'] as const;

/**
 * Parses YAML frontmatter from a wiki page file.
 * Validates required fields and returns a structured result.
 * Returns { success: false, error } for malformed/missing frontmatter.
 */
export function parseFrontmatter(filePath: string, rawContent: string): ParseResult {
  let parsed: matter.GrayMatterFile<string>;

  try {
    parsed = matter(rawContent);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to parse frontmatter: ${message}` };
  }

  const data = parsed.data;

  // Check if frontmatter is empty (no data extracted)
  if (!data || Object.keys(data).length === 0) {
    return { success: false, error: 'Frontmatter is missing or empty' };
  }

  // Validate required field: title
  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return { success: false, error: 'Required field "title" is missing or not a non-empty string' };
  }

  // Validate required field: type
  if (!VALID_TYPES.includes(data.type)) {
    return {
      success: false,
      error: `Field "type" must be one of: ${VALID_TYPES.join(', ')}. Got: "${data.type}"`,
    };
  }

  // Validate required field: tags
  if (!Array.isArray(data.tags)) {
    return { success: false, error: 'Field "tags" must be an array' };
  }
  for (const tag of data.tags) {
    if (typeof tag !== 'string') {
      return { success: false, error: 'Field "tags" must be an array of strings' };
    }
  }

  // Validate required field: created
  if (typeof data.created !== 'string' && !(data.created instanceof Date)) {
    return { success: false, error: 'Required field "created" is missing or not a string' };
  }

  // Validate required field: updated
  if (typeof data.updated !== 'string' && !(data.updated instanceof Date)) {
    return { success: false, error: 'Required field "updated" is missing or not a string' };
  }

  // Normalize date fields — gray-matter may parse dates as Date objects
  const created = data.created instanceof Date ? data.created.toISOString().split('T')[0] : data.created;
  const updated = data.updated instanceof Date ? data.updated.toISOString().split('T')[0] : data.updated;

  // Build PageMeta with required fields
  const meta: PageMeta = {
    title: data.title,
    type: data.type as 'entity' | 'concept' | 'source',
    tags: data.tags as string[],
    created,
    updated,
    filePath,
    outgoingLinks: [], // Populated later by the index builder
  };

  // Optional fields
  if (data.sources !== undefined) {
    if (Array.isArray(data.sources)) {
      meta.sources = data.sources as string[];
    }
  }

  if (typeof data.author === 'string') {
    meta.author = data.author;
  }

  if (data.date !== undefined) {
    if (data.date instanceof Date) {
      meta.date = data.date.toISOString().split('T')[0];
    } else if (typeof data.date === 'string') {
      meta.date = data.date;
    }
  }

  if (typeof data.url === 'string') {
    meta.url = data.url;
  }

  return { success: true, meta };
}
