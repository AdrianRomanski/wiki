import { WikiPageFrontmatter } from '@wiki/domain-models';

export interface FrontmatterValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFrontmatter(
  frontmatter: Partial<WikiPageFrontmatter>
): FrontmatterValidationResult {
  const errors: string[] = [];

  if (!frontmatter.title || frontmatter.title.trim() === '') {
    errors.push('title is required and must be non-empty');
  }

  if (!frontmatter.type) {
    errors.push('type is required');
  } else if (!['entity', 'concept', 'source'].includes(frontmatter.type)) {
    errors.push('type must be one of: entity, concept, source');
  }

  if (!frontmatter.tags) {
    errors.push('tags is required');
  } else if (!Array.isArray(frontmatter.tags)) {
    errors.push('tags must be an array');
  }

  if (!frontmatter.created) {
    errors.push('created date is required');
  } else if (!isValidDateFormat(frontmatter.created)) {
    errors.push('created date must be in YYYY-MM-DD format');
  }

  if (!frontmatter.updated) {
    errors.push('updated date is required');
  } else if (!isValidDateFormat(frontmatter.updated)) {
    errors.push('updated date must be in YYYY-MM-DD format');
  }

  if (frontmatter.date && !isValidDateFormat(frontmatter.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  if (frontmatter.sources && !Array.isArray(frontmatter.sources)) {
    errors.push('sources must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}
