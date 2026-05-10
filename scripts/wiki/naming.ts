/**
 * Naming convention validators for the LLM Wiki Second Brain system.
 * 
 * This module validates wiki page filenames according to the schema conventions:
 * - Entity pages: kebab-case-noun.md (e.g., angular-cdk.md, aria-live-region.md)
 * - Concept pages: kebab-case-concept.md (e.g., progressive-enhancement.md, accessibility-tree.md)
 * - Source summaries: source-title-yyyy-mm-dd.md (e.g., angular-aria-guide-2024-05-10.md)
 * 
 * Requirements: 2.6, 14.3
 */

/**
 * Error thrown when a filename does not match the expected naming convention.
 */
export class NamingConventionError extends Error {
  constructor(
    message: string,
    public filename: string,
    public pageType: 'entity' | 'concept' | 'source',
    public expectedPattern: string
  ) {
    super(message);
    this.name = 'NamingConventionError';
  }
}

/**
 * Result of a naming validation check.
 */
export interface ValidationResult {
  /** Whether the filename is valid */
  valid: boolean;
  
  /** Error message if invalid, undefined if valid */
  error?: string;
  
  /** The expected pattern for this page type */
  expectedPattern: string;
  
  /** Suggestions for fixing the filename if invalid */
  suggestions?: string[];
}

/**
 * Validates that a string is in kebab-case format.
 * Kebab-case: lowercase words separated by hyphens (e.g., "my-page-name")
 * 
 * @param str - The string to validate
 * @returns True if the string is valid kebab-case
 * 
 * @example
 * ```typescript
 * isKebabCase('angular-cdk'); // true
 * isKebabCase('Angular-CDK'); // false (uppercase)
 * isKebabCase('angular_cdk'); // false (underscore)
 * isKebabCase('angular cdk'); // false (space)
 * ```
 */
export function isKebabCase(str: string): boolean {
  // Kebab-case: lowercase letters, numbers, and hyphens only
  // Must start and end with alphanumeric, no consecutive hyphens
  const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return kebabCasePattern.test(str);
}

/**
 * Validates that a date string is in YYYY-MM-DD format.
 * 
 * @param dateStr - The date string to validate
 * @returns True if the date string is valid
 * 
 * @example
 * ```typescript
 * isValidDateFormat('2024-05-10'); // true
 * isValidDateFormat('2024-5-10');  // false (missing leading zero)
 * isValidDateFormat('05-10-2024'); // false (wrong order)
 * ```
 */
export function isValidDateFormat(dateStr: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!datePattern.test(dateStr)) {
    return false;
  }
  
  // Validate that it's a real date
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

/**
 * Converts a string to kebab-case format.
 * 
 * @param str - The string to convert
 * @returns The kebab-case version of the string
 * 
 * @example
 * ```typescript
 * toKebabCase('Angular CDK'); // 'angular-cdk'
 * toKebabCase('ARIA Live Region'); // 'aria-live-region'
 * toKebabCase('my_page_name'); // 'my-page-name'
 * ```
 */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
    .replace(/-+/g, '-');         // Replace multiple hyphens with single hyphen
}

/**
 * Validates an entity page filename.
 * 
 * Entity pages should be named: kebab-case-noun.md
 * Examples: angular-cdk.md, aria-live-region.md, focus-trap.md
 * 
 * @param filename - The filename to validate (with or without .md extension)
 * @returns Validation result with details
 * 
 * @example
 * ```typescript
 * validateEntityName('angular-cdk.md');
 * // { valid: true, expectedPattern: 'kebab-case-noun.md' }
 * 
 * validateEntityName('Angular-CDK.md');
 * // { valid: false, error: '...', suggestions: ['angular-cdk.md'] }
 * ```
 */
export function validateEntityName(filename: string): ValidationResult {
  const expectedPattern = 'kebab-case-noun.md';
  
  // Remove .md extension if present
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  // Check if it's valid kebab-case
  if (isKebabCase(nameWithoutExt)) {
    return {
      valid: true,
      expectedPattern,
    };
  }
  
  // Generate suggestions
  const suggestion = toKebabCase(nameWithoutExt) + '.md';
  
  return {
    valid: false,
    error: `Entity page filename '${filename}' does not match expected pattern '${expectedPattern}'. Entity pages should use kebab-case (lowercase words separated by hyphens).`,
    expectedPattern,
    suggestions: [suggestion],
  };
}

/**
 * Validates a concept page filename.
 * 
 * Concept pages should be named: kebab-case-concept.md
 * Examples: progressive-enhancement.md, accessibility-tree.md, focus-management.md
 * 
 * @param filename - The filename to validate (with or without .md extension)
 * @returns Validation result with details
 * 
 * @example
 * ```typescript
 * validateConceptName('progressive-enhancement.md');
 * // { valid: true, expectedPattern: 'kebab-case-concept.md' }
 * 
 * validateConceptName('Progressive Enhancement.md');
 * // { valid: false, error: '...', suggestions: ['progressive-enhancement.md'] }
 * ```
 */
export function validateConceptName(filename: string): ValidationResult {
  const expectedPattern = 'kebab-case-concept.md';
  
  // Remove .md extension if present
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  // Check if it's valid kebab-case
  if (isKebabCase(nameWithoutExt)) {
    return {
      valid: true,
      expectedPattern,
    };
  }
  
  // Generate suggestions
  const suggestion = toKebabCase(nameWithoutExt) + '.md';
  
  return {
    valid: false,
    error: `Concept page filename '${filename}' does not match expected pattern '${expectedPattern}'. Concept pages should use kebab-case (lowercase words separated by hyphens).`,
    expectedPattern,
    suggestions: [suggestion],
  };
}

/**
 * Validates a source summary filename.
 * 
 * Source summaries should be named: source-title-yyyy-mm-dd.md
 * Examples: angular-aria-guide-2024-05-10.md, wcag-spec-2024-03-15.md
 * 
 * The date should be in YYYY-MM-DD format and represent a valid date.
 * 
 * @param filename - The filename to validate (with or without .md extension)
 * @returns Validation result with details
 * 
 * @example
 * ```typescript
 * validateSourceName('angular-aria-guide-2024-05-10.md');
 * // { valid: true, expectedPattern: 'source-title-yyyy-mm-dd.md' }
 * 
 * validateSourceName('angular-aria-guide.md');
 * // { valid: false, error: '...', suggestions: [...] }
 * ```
 */
export function validateSourceName(filename: string): ValidationResult {
  const expectedPattern = 'source-title-yyyy-mm-dd.md';
  
  // Remove .md extension if present
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  // Extract the last 10 characters as potential date (YYYY-MM-DD)
  if (nameWithoutExt.length < 11) { // At least "a-2024-01-01"
    return {
      valid: false,
      error: `Source summary filename '${filename}' does not match expected pattern '${expectedPattern}'. Source summaries must include a date in YYYY-MM-DD format at the end.`,
      expectedPattern,
      suggestions: [`${toKebabCase(nameWithoutExt)}-${new Date().toISOString().split('T')[0]}.md`],
    };
  }
  
  // Check if the last part is a valid date
  const potentialDate = nameWithoutExt.slice(-10);
  const titlePart = nameWithoutExt.slice(0, -11); // Everything before the date and hyphen
  
  if (!isValidDateFormat(potentialDate)) {
    return {
      valid: false,
      error: `Source summary filename '${filename}' does not match expected pattern '${expectedPattern}'. Source summaries must include a date in YYYY-MM-DD format at the end.`,
      expectedPattern,
      suggestions: [`${toKebabCase(nameWithoutExt)}-${new Date().toISOString().split('T')[0]}.md`],
    };
  }
  
  // Check if the title part is valid kebab-case
  if (!isKebabCase(titlePart)) {
    const suggestion = toKebabCase(titlePart) + '-' + potentialDate + '.md';
    return {
      valid: false,
      error: `Source summary filename '${filename}' has an invalid title part. The title should be in kebab-case (lowercase words separated by hyphens).`,
      expectedPattern,
      suggestions: [suggestion],
    };
  }
  
  return {
    valid: true,
    expectedPattern,
  };
}

/**
 * Validates a wiki page filename based on its type.
 * 
 * This is a convenience function that delegates to the appropriate
 * type-specific validator.
 * 
 * @param filename - The filename to validate
 * @param pageType - The type of wiki page
 * @returns Validation result with details
 * @throws {Error} If pageType is invalid
 * 
 * @example
 * ```typescript
 * validateWikiPageName('angular-cdk.md', 'entity');
 * validateWikiPageName('progressive-enhancement.md', 'concept');
 * validateWikiPageName('angular-guide-2024-05-10.md', 'source');
 * ```
 */
export function validateWikiPageName(
  filename: string,
  pageType: 'entity' | 'concept' | 'source'
): ValidationResult {
  switch (pageType) {
    case 'entity':
      return validateEntityName(filename);
    case 'concept':
      return validateConceptName(filename);
    case 'source':
      return validateSourceName(filename);
    default:
      throw new Error(`Invalid page type: ${pageType}`);
  }
}

/**
 * Asserts that a filename is valid for the given page type.
 * Throws an error if the filename is invalid.
 * 
 * @param filename - The filename to validate
 * @param pageType - The type of wiki page
 * @throws {NamingConventionError} If the filename is invalid
 * 
 * @example
 * ```typescript
 * assertValidName('angular-cdk.md', 'entity'); // OK
 * assertValidName('Angular-CDK.md', 'entity'); // Throws NamingConventionError
 * ```
 */
export function assertValidName(
  filename: string,
  pageType: 'entity' | 'concept' | 'source'
): void {
  const result = validateWikiPageName(filename, pageType);
  
  if (!result.valid) {
    throw new NamingConventionError(
      result.error!,
      filename,
      pageType,
      result.expectedPattern
    );
  }
}

/**
 * Generates a valid filename for a wiki page based on its title and type.
 * 
 * @param title - The page title
 * @param pageType - The type of wiki page
 * @param date - The date for source summaries (optional, defaults to today)
 * @returns A valid filename following naming conventions
 * 
 * @example
 * ```typescript
 * generateFilename('Angular CDK', 'entity');
 * // Returns: 'angular-cdk.md'
 * 
 * generateFilename('Progressive Enhancement', 'concept');
 * // Returns: 'progressive-enhancement.md'
 * 
 * generateFilename('Angular ARIA Guide', 'source', new Date('2024-05-10'));
 * // Returns: 'angular-aria-guide-2024-05-10.md'
 * ```
 */
export function generateFilename(
  title: string,
  pageType: 'entity' | 'concept' | 'source',
  date?: Date
): string {
  const kebabTitle = toKebabCase(title);
  
  if (pageType === 'source') {
    const dateStr = (date || new Date()).toISOString().split('T')[0];
    return `${kebabTitle}-${dateStr}.md`;
  }
  
  return `${kebabTitle}.md`;
}
