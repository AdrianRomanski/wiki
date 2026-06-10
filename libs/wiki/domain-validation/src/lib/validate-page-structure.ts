import { WikiPage } from '@wiki/domain-models';

export interface PageStructureValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePageStructure(
  page: WikiPage
): PageStructureValidationResult {
  const errors: string[] = [];

  if (!page.path || page.path.trim() === '') {
    errors.push('path is required and must be non-empty');
  }

  if (!page.filename || page.filename.trim() === '') {
    errors.push('filename is required and must be non-empty');
  }

  if (!page.frontmatter) {
    errors.push('frontmatter is required');
  }

  if (!page.content || page.content.trim() === '') {
    errors.push('content is required and must be non-empty');
  }

  if (!page.sections) {
    errors.push('sections is required');
  } else if (!Array.isArray(page.sections)) {
    errors.push('sections must be an array');
  } else {
    const sectionErrors = validateSections(page.sections);
    errors.push(...sectionErrors);
  }

  if (!page.outgoingLinks) {
    errors.push('outgoingLinks is required');
  } else if (!Array.isArray(page.outgoingLinks)) {
    errors.push('outgoingLinks must be an array');
  }

  if (!page.incomingLinks) {
    errors.push('incomingLinks is required');
  } else if (!Array.isArray(page.incomingLinks)) {
    errors.push('incomingLinks must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateSections(sections: any[], parentLevel = 0): string[] {
  const errors: string[] = [];

  for (const section of sections) {
    if (!section.heading || section.heading.trim() === '') {
      errors.push('section heading is required and must be non-empty');
    }

    if (typeof section.level !== 'number') {
      errors.push('section level must be a number');
    } else if (section.level < 1 || section.level > 6) {
      errors.push('section level must be between 1 and 6');
    } else if (parentLevel > 0 && section.level <= parentLevel) {
      errors.push(
        `subsection level (${section.level}) must be greater than parent level (${parentLevel})`
      );
    }

    if (section.content === undefined || section.content === null) {
      errors.push('section content is required');
    }

    if (!section.subsections) {
      errors.push('section subsections is required');
    } else if (!Array.isArray(section.subsections)) {
      errors.push('section subsections must be an array');
    } else if (section.subsections.length > 0) {
      const subsectionErrors = validateSections(
        section.subsections,
        section.level
      );
      errors.push(...subsectionErrors);
    }
  }

  return errors;
}
