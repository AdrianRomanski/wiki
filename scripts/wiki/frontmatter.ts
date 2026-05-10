/**
 * Frontmatter utilities for the LLM Wiki Second Brain system.
 * 
 * This module provides functions to parse and generate YAML frontmatter
 * for wiki pages, ensuring Obsidian compatibility and proper validation.
 */

import matter from 'gray-matter';
import { WikiPage } from './models.js';

/**
 * Represents the frontmatter metadata for a wiki page.
 * This matches the WikiPage.frontmatter interface.
 */
export interface WikiPageFrontmatter {
  title: string;
  type: 'entity' | 'concept' | 'source';
  tags: string[];
  sources?: string[];
  author?: string;
  date?: string;
  url?: string;
  created: string;
  updated: string;
}

/**
 * Validation error thrown when frontmatter is invalid.
 */
export class FrontmatterValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'FrontmatterValidationError';
  }
}

/**
 * Parses YAML frontmatter from markdown content.
 * 
 * @param markdownContent - The full markdown content including frontmatter
 * @returns An object containing the parsed frontmatter and content body
 * @throws {FrontmatterValidationError} If frontmatter is missing or invalid
 * 
 * @example
 * ```typescript
 * const markdown = `---
 * title: My Page
 * type: entity
 * tags: [tag1, tag2]
 * created: 2024-01-01
 * updated: 2024-01-01
 * ---
 * # Content here`;
 * 
 * const { frontmatter, content } = parseFrontmatter(markdown);
 * console.log(frontmatter.title); // "My Page"
 * console.log(content); // "# Content here"
 * ```
 */
export function parseFrontmatter(markdownContent: string): {
  frontmatter: WikiPageFrontmatter;
  content: string;
} {
  // Parse using gray-matter
  const parsed = matter(markdownContent);
  
  // Validate that frontmatter exists
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new FrontmatterValidationError('Frontmatter is missing or empty');
  }
  
  // Validate required fields
  const frontmatter = parsed.data as Partial<WikiPageFrontmatter>;
  
  validateRequiredFields(frontmatter);
  
  return {
    frontmatter: frontmatter as WikiPageFrontmatter,
    content: parsed.content.trim(),
  };
}

/**
 * Validates that all required frontmatter fields are present and valid.
 * 
 * @param frontmatter - The frontmatter object to validate
 * @throws {FrontmatterValidationError} If any required field is missing or invalid
 */
function validateRequiredFields(frontmatter: Partial<WikiPageFrontmatter>): void {
  // Required fields
  const requiredFields: (keyof WikiPageFrontmatter)[] = [
    'title',
    'type',
    'tags',
    'created',
    'updated',
  ];
  
  for (const field of requiredFields) {
    if (!(field in frontmatter) || frontmatter[field] === undefined || frontmatter[field] === null) {
      throw new FrontmatterValidationError(
        `Required field '${field}' is missing`,
        field
      );
    }
  }
  
  // Validate title is non-empty string
  if (typeof frontmatter.title !== 'string' || frontmatter.title.trim() === '') {
    throw new FrontmatterValidationError(
      'Field "title" must be a non-empty string',
      'title'
    );
  }
  
  // Validate type is one of the allowed values
  if (!['entity', 'concept', 'source'].includes(frontmatter.type as string)) {
    throw new FrontmatterValidationError(
      'Field "type" must be one of: entity, concept, source',
      'type'
    );
  }
  
  // Validate tags is an array
  if (!Array.isArray(frontmatter.tags)) {
    throw new FrontmatterValidationError(
      'Field "tags" must be an array',
      'tags'
    );
  }
  
  // Validate created and updated are valid date strings
  // gray-matter may parse dates as Date objects, so convert them
  if (frontmatter.created instanceof Date) {
    frontmatter.created = frontmatter.created.toISOString().split('T')[0];
  }
  if (frontmatter.updated instanceof Date) {
    frontmatter.updated = frontmatter.updated.toISOString().split('T')[0];
  }
  
  if (typeof frontmatter.created !== 'string' || !isValidDateString(frontmatter.created)) {
    throw new FrontmatterValidationError(
      'Field "created" must be a valid ISO date string (YYYY-MM-DD)',
      'created'
    );
  }
  
  if (typeof frontmatter.updated !== 'string' || !isValidDateString(frontmatter.updated)) {
    throw new FrontmatterValidationError(
      'Field "updated" must be a valid ISO date string (YYYY-MM-DD)',
      'updated'
    );
  }
  
  // Validate optional fields if present
  if (frontmatter.sources !== undefined && !Array.isArray(frontmatter.sources)) {
    throw new FrontmatterValidationError(
      'Field "sources" must be an array',
      'sources'
    );
  }
  
  if (frontmatter.author !== undefined && typeof frontmatter.author !== 'string') {
    throw new FrontmatterValidationError(
      'Field "author" must be a string',
      'author'
    );
  }
  
  // gray-matter may parse date field as Date object, so convert it
  if (frontmatter.date instanceof Date) {
    frontmatter.date = frontmatter.date.toISOString().split('T')[0];
  }
  
  if (frontmatter.date !== undefined && typeof frontmatter.date !== 'string') {
    throw new FrontmatterValidationError(
      'Field "date" must be a string',
      'date'
    );
  }
  
  if (frontmatter.url !== undefined && typeof frontmatter.url !== 'string') {
    throw new FrontmatterValidationError(
      'Field "url" must be a string',
      'url'
    );
  }
}

/**
 * Validates that a string is a valid ISO date string (YYYY-MM-DD format).
 * 
 * @param dateString - The date string to validate
 * @returns True if the date string is valid, false otherwise
 */
function isValidDateString(dateString: string): boolean {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Generates valid YAML frontmatter for a wiki page.
 * 
 * @param frontmatter - The frontmatter metadata to generate
 * @param content - The markdown content body (optional)
 * @returns The complete markdown with frontmatter
 * 
 * @example
 * ```typescript
 * const frontmatter: WikiPageFrontmatter = {
 *   title: 'Angular CDK',
 *   type: 'entity',
 *   tags: ['angular', 'accessibility'],
 *   created: '2024-01-01',
 *   updated: '2024-01-01',
 * };
 * 
 * const markdown = generateFrontmatter(frontmatter, '# Angular CDK\n\nContent here');
 * // Returns:
 * // ---
 * // title: Angular CDK
 * // type: entity
 * // tags:
 * //   - angular
 * //   - accessibility
 * // created: 2024-01-01
 * // updated: 2024-01-01
 * // ---
 * // # Angular CDK
 * //
 * // Content here
 * ```
 */
export function generateFrontmatter(
  frontmatter: WikiPageFrontmatter,
  content: string = ''
): string {
  // Validate frontmatter before generating
  validateRequiredFields(frontmatter);
  
  // Remove undefined optional fields (gray-matter doesn't handle them well)
  const cleanFrontmatter: Record<string, any> = {
    title: frontmatter.title,
    type: frontmatter.type,
    tags: frontmatter.tags,
    created: frontmatter.created,
    updated: frontmatter.updated,
  };
  
  // Only add optional fields if they are defined
  if (frontmatter.sources !== undefined) {
    cleanFrontmatter.sources = frontmatter.sources;
  }
  if (frontmatter.author !== undefined) {
    cleanFrontmatter.author = frontmatter.author;
  }
  if (frontmatter.date !== undefined) {
    cleanFrontmatter.date = frontmatter.date;
  }
  if (frontmatter.url !== undefined) {
    cleanFrontmatter.url = frontmatter.url;
  }
  
  // Use gray-matter to stringify with proper YAML formatting
  const markdown = matter.stringify(content, cleanFrontmatter);
  
  return markdown;
}

/**
 * Creates a new frontmatter object with default values.
 * 
 * @param partial - Partial frontmatter with at least title and type
 * @returns A complete frontmatter object with defaults filled in
 * 
 * @example
 * ```typescript
 * const frontmatter = createFrontmatter({
 *   title: 'My Page',
 *   type: 'entity',
 * });
 * // Returns frontmatter with title, type, empty tags array, and current date for created/updated
 * ```
 */
export function createFrontmatter(
  partial: Pick<WikiPageFrontmatter, 'title' | 'type'> & Partial<WikiPageFrontmatter>
): WikiPageFrontmatter {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return {
    title: partial.title,
    type: partial.type,
    tags: partial.tags || [],
    sources: partial.sources,
    author: partial.author,
    date: partial.date,
    url: partial.url,
    created: partial.created || now,
    updated: partial.updated || now,
  };
}

/**
 * Updates the 'updated' timestamp in frontmatter to the current date.
 * 
 * @param frontmatter - The frontmatter to update
 * @returns A new frontmatter object with updated timestamp
 * 
 * @example
 * ```typescript
 * const updated = updateTimestamp(existingFrontmatter);
 * console.log(updated.updated); // Current date in YYYY-MM-DD format
 * ```
 */
export function updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return {
    ...frontmatter,
    updated: now,
  };
}

/**
 * Validates frontmatter without throwing an error.
 * 
 * @param frontmatter - The frontmatter to validate
 * @returns An object with isValid flag and optional error message
 * 
 * @example
 * ```typescript
 * const result = validateFrontmatter(frontmatter);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFrontmatter(frontmatter: Partial<WikiPageFrontmatter>): {
  isValid: boolean;
  error?: string;
  field?: string;
} {
  try {
    validateRequiredFields(frontmatter);
    return { isValid: true };
  } catch (error) {
    if (error instanceof FrontmatterValidationError) {
      return {
        isValid: false,
        error: error.message,
        field: error.field,
      };
    }
    return {
      isValid: false,
      error: 'Unknown validation error',
    };
  }
}
