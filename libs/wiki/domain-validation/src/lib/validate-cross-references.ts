import { WikiPage } from '@wiki/domain-models';

export interface CrossReferenceValidationResult {
  valid: boolean;
  errors: string[];
  missingTargets: string[];
}

export function validateCrossReferences(
  page: WikiPage,
  existingPages: string[]
): CrossReferenceValidationResult {
  const errors: string[] = [];
  const missingTargets: string[] = [];

  if (!page.outgoingLinks) {
    errors.push('outgoingLinks is required');
    return {
      valid: false,
      errors,
      missingTargets,
    };
  }

  if (!Array.isArray(page.outgoingLinks)) {
    errors.push('outgoingLinks must be an array');
    return {
      valid: false,
      errors,
      missingTargets,
    };
  }

  if (!Array.isArray(existingPages)) {
    errors.push('existingPages must be an array');
    return {
      valid: false,
      errors,
      missingTargets,
    };
  }

  const existingPagesSet = new Set(existingPages.map((p) => normalizePagePath(p)));

  for (const link of page.outgoingLinks) {
    if (!link || link.trim() === '') {
      errors.push('outgoing link cannot be empty');
      continue;
    }

    const normalizedLink = normalizePagePath(link);

    if (!existingPagesSet.has(normalizedLink)) {
      missingTargets.push(link);
      errors.push(`cross-reference target does not exist: ${link}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingTargets,
  };
}

function normalizePagePath(path: string): string {
  return path.trim().toLowerCase().replace(/\\/g, '/');
}
