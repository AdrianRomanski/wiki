import { ValidationResult } from './validation-result';
import { NamingConventionError } from './naming-convention-error';

export function isKebabCase(str: string): boolean {
  const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return kebabCasePattern.test(str);
}


export function isValidDateFormat(dateStr: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!datePattern.test(dateStr)) {
    return false;
  }
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function validateEntityName(filename: string): ValidationResult {
  const expectedPattern = 'kebab-case-noun.md';
  
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  if (isKebabCase(nameWithoutExt)) {
    return {
      valid: true,
      expectedPattern,
    };
  }
  
  const suggestion = toKebabCase(nameWithoutExt) + '.md';
  
  return {
    valid: false,
    error: `Entity page filename '${filename}' does not match expected pattern '${expectedPattern}'. Entity pages should use kebab-case (lowercase words separated by hyphens).`,
    expectedPattern,
    suggestions: [suggestion],
  };
}

export function validateConceptName(filename: string): ValidationResult {
  const expectedPattern = 'kebab-case-concept.md';
  
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  if (isKebabCase(nameWithoutExt)) {
    return {
      valid: true,
      expectedPattern,
    };
  }
  
  const suggestion = toKebabCase(nameWithoutExt) + '.md';
  
  return {
    valid: false,
    error: `Concept page filename '${filename}' does not match expected pattern '${expectedPattern}'. Concept pages should use kebab-case (lowercase words separated by hyphens).`,
    expectedPattern,
    suggestions: [suggestion],
  };
}

export function validateSourceName(filename: string): ValidationResult {
  const expectedPattern = 'source-title-yyyy-mm-dd.md';
  
  const nameWithoutExt = filename.endsWith('.md') 
    ? filename.slice(0, -3) 
    : filename;
  
  if (nameWithoutExt.length < 11) {
    return {
      valid: false,
      error: `Source summary filename '${filename}' does not match expected pattern '${expectedPattern}'. Source summaries must include a date in YYYY-MM-DD format at the end.`,
      expectedPattern,
      suggestions: [`${toKebabCase(nameWithoutExt)}-${new Date().toISOString().split('T')[0]}.md`],
    };
  }
  
  const potentialDate = nameWithoutExt.slice(-10);
  const titlePart = nameWithoutExt.slice(0, -11);
  
  if (!isValidDateFormat(potentialDate)) {
    return {
      valid: false,
      error: `Source summary filename '${filename}' does not match expected pattern '${expectedPattern}'. Source summaries must include a date in YYYY-MM-DD format at the end.`,
      expectedPattern,
      suggestions: [`${toKebabCase(nameWithoutExt)}-${new Date().toISOString().split('T')[0]}.md`],
    };
  }
  
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

export function assertValidName(
  filename: string,
  pageType: 'entity' | 'concept' | 'source'
): void {
  const result = validateWikiPageName(filename, pageType);
  
  if (!result.valid) {
    throw new NamingConventionError(
      result.error ?? 'Invalid wiki page name',
      filename,
      pageType,
      result.expectedPattern
    );
  }
}

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
