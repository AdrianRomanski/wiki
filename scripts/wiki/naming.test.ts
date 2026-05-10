/**
 * Tests for naming convention validators.
 * 
 * These tests verify that wiki page filenames follow the schema conventions:
 * - Entity pages: kebab-case-noun.md
 * - Concept pages: kebab-case-concept.md
 * - Source summaries: source-title-yyyy-mm-dd.md
 */

import { describe, it, expect } from 'vitest';
import {
  isKebabCase,
  isValidDateFormat,
  toKebabCase,
  validateEntityName,
  validateConceptName,
  validateSourceName,
  validateWikiPageName,
  assertValidName,
  generateFilename,
  NamingConventionError,
} from './naming';

describe('isKebabCase', () => {
  it('should accept valid kebab-case strings', () => {
    expect(isKebabCase('angular-cdk')).toBe(true);
    expect(isKebabCase('aria-live-region')).toBe(true);
    expect(isKebabCase('focus-trap')).toBe(true);
    expect(isKebabCase('a')).toBe(true);
    expect(isKebabCase('a-b')).toBe(true);
    expect(isKebabCase('a-b-c-d-e')).toBe(true);
  });

  it('should accept kebab-case with numbers', () => {
    expect(isKebabCase('angular-v18')).toBe(true);
    expect(isKebabCase('wcag-2-1')).toBe(true);
    expect(isKebabCase('test123')).toBe(true);
  });

  it('should reject uppercase letters', () => {
    expect(isKebabCase('Angular-CDK')).toBe(false);
    expect(isKebabCase('angular-CDK')).toBe(false);
    expect(isKebabCase('ANGULAR')).toBe(false);
  });

  it('should reject underscores', () => {
    expect(isKebabCase('angular_cdk')).toBe(false);
    expect(isKebabCase('aria_live_region')).toBe(false);
  });

  it('should reject spaces', () => {
    expect(isKebabCase('angular cdk')).toBe(false);
    expect(isKebabCase('aria live region')).toBe(false);
  });

  it('should reject leading or trailing hyphens', () => {
    expect(isKebabCase('-angular-cdk')).toBe(false);
    expect(isKebabCase('angular-cdk-')).toBe(false);
    expect(isKebabCase('-angular-cdk-')).toBe(false);
  });

  it('should reject consecutive hyphens', () => {
    expect(isKebabCase('angular--cdk')).toBe(false);
    expect(isKebabCase('aria---live')).toBe(false);
  });

  it('should reject special characters', () => {
    expect(isKebabCase('angular@cdk')).toBe(false);
    expect(isKebabCase('angular.cdk')).toBe(false);
    expect(isKebabCase('angular/cdk')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isKebabCase('')).toBe(false);
  });
});

describe('isValidDateFormat', () => {
  it('should accept valid YYYY-MM-DD dates', () => {
    expect(isValidDateFormat('2024-05-10')).toBe(true);
    expect(isValidDateFormat('2024-01-01')).toBe(true);
    expect(isValidDateFormat('2024-12-31')).toBe(true);
    expect(isValidDateFormat('2000-02-29')).toBe(true); // Leap year
  });

  it('should reject invalid date formats', () => {
    expect(isValidDateFormat('2024-5-10')).toBe(false);  // Missing leading zero
    expect(isValidDateFormat('24-05-10')).toBe(false);   // Two-digit year
    expect(isValidDateFormat('05-10-2024')).toBe(false); // Wrong order
    expect(isValidDateFormat('2024/05/10')).toBe(false); // Wrong separator
  });

  it('should reject invalid dates', () => {
    expect(isValidDateFormat('2024-13-01')).toBe(false); // Invalid month
    expect(isValidDateFormat('2024-02-30')).toBe(false); // Invalid day
    expect(isValidDateFormat('2023-02-29')).toBe(false); // Not a leap year
  });

  it('should reject non-date strings', () => {
    expect(isValidDateFormat('not-a-date')).toBe(false);
    expect(isValidDateFormat('2024-05')).toBe(false);
    expect(isValidDateFormat('')).toBe(false);
  });
});

describe('toKebabCase', () => {
  it('should convert spaces to hyphens', () => {
    expect(toKebabCase('Angular CDK')).toBe('angular-cdk');
    expect(toKebabCase('ARIA Live Region')).toBe('aria-live-region');
  });

  it('should convert uppercase to lowercase', () => {
    expect(toKebabCase('ANGULAR')).toBe('angular');
    expect(toKebabCase('AngularCDK')).toBe('angularcdk');
  });

  it('should convert underscores to hyphens', () => {
    expect(toKebabCase('angular_cdk')).toBe('angular-cdk');
    expect(toKebabCase('aria_live_region')).toBe('aria-live-region');
  });

  it('should handle multiple special characters', () => {
    expect(toKebabCase('Angular@CDK.io')).toBe('angular-cdk-io');
    expect(toKebabCase('ARIA/Live/Region')).toBe('aria-live-region');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(toKebabCase(' Angular CDK ')).toBe('angular-cdk');
    expect(toKebabCase('---Angular---')).toBe('angular');
  });

  it('should collapse multiple hyphens', () => {
    expect(toKebabCase('Angular   CDK')).toBe('angular-cdk');
    expect(toKebabCase('Angular---CDK')).toBe('angular-cdk');
  });

  it('should handle already kebab-case strings', () => {
    expect(toKebabCase('angular-cdk')).toBe('angular-cdk');
  });
});

describe('validateEntityName', () => {
  it('should accept valid entity names', () => {
    const result1 = validateEntityName('angular-cdk.md');
    expect(result1.valid).toBe(true);
    expect(result1.expectedPattern).toBe('kebab-case-noun.md');

    const result2 = validateEntityName('aria-live-region.md');
    expect(result2.valid).toBe(true);

    const result3 = validateEntityName('focus-trap.md');
    expect(result3.valid).toBe(true);
  });

  it('should accept names without .md extension', () => {
    const result = validateEntityName('angular-cdk');
    expect(result.valid).toBe(true);
  });

  it('should reject uppercase letters', () => {
    const result = validateEntityName('Angular-CDK.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match expected pattern');
    expect(result.suggestions).toContain('angular-cdk.md');
  });

  it('should reject spaces', () => {
    const result = validateEntityName('angular cdk.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('angular-cdk.md');
  });

  it('should reject underscores', () => {
    const result = validateEntityName('angular_cdk.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('angular-cdk.md');
  });

  it('should provide helpful suggestions', () => {
    const result = validateEntityName('Angular CDK Component.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('angular-cdk-component.md');
  });
});

describe('validateConceptName', () => {
  it('should accept valid concept names', () => {
    const result1 = validateConceptName('progressive-enhancement.md');
    expect(result1.valid).toBe(true);
    expect(result1.expectedPattern).toBe('kebab-case-concept.md');

    const result2 = validateConceptName('accessibility-tree.md');
    expect(result2.valid).toBe(true);

    const result3 = validateConceptName('focus-management.md');
    expect(result3.valid).toBe(true);
  });

  it('should accept names without .md extension', () => {
    const result = validateConceptName('progressive-enhancement');
    expect(result.valid).toBe(true);
  });

  it('should reject uppercase letters', () => {
    const result = validateConceptName('Progressive-Enhancement.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match expected pattern');
    expect(result.suggestions).toContain('progressive-enhancement.md');
  });

  it('should reject spaces', () => {
    const result = validateConceptName('progressive enhancement.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('progressive-enhancement.md');
  });

  it('should provide helpful suggestions', () => {
    const result = validateConceptName('Accessibility Tree Concept.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('accessibility-tree-concept.md');
  });
});

describe('validateSourceName', () => {
  it('should accept valid source names', () => {
    const result1 = validateSourceName('angular-aria-guide-2024-05-10.md');
    expect(result1.valid).toBe(true);
    expect(result1.expectedPattern).toBe('source-title-yyyy-mm-dd.md');

    const result2 = validateSourceName('wcag-spec-2024-03-15.md');
    expect(result2.valid).toBe(true);

    const result3 = validateSourceName('a-2024-01-01.md');
    expect(result3.valid).toBe(true);
  });

  it('should accept names without .md extension', () => {
    const result = validateSourceName('angular-aria-guide-2024-05-10');
    expect(result.valid).toBe(true);
  });

  it('should reject names without dates', () => {
    const result = validateSourceName('angular-aria-guide.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must include a date in YYYY-MM-DD format');
  });

  it('should reject invalid date formats', () => {
    const result = validateSourceName('angular-aria-guide-2024-5-10.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must include a date in YYYY-MM-DD format');
  });

  it('should reject invalid dates', () => {
    const result = validateSourceName('angular-aria-guide-2024-13-01.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must include a date in YYYY-MM-DD format');
  });

  it('should reject uppercase in title', () => {
    const result = validateSourceName('Angular-ARIA-Guide-2024-05-10.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid title part');
    expect(result.suggestions).toContain('angular-aria-guide-2024-05-10.md');
  });

  it('should reject spaces in title', () => {
    const result = validateSourceName('angular aria guide-2024-05-10.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toContain('angular-aria-guide-2024-05-10.md');
  });

  it('should reject names that are too short', () => {
    const result = validateSourceName('a.md');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must include a date');
  });

  it('should provide helpful suggestions', () => {
    const result = validateSourceName('Angular ARIA Guide.md');
    expect(result.valid).toBe(false);
    expect(result.suggestions).toBeDefined();
    // The suggestion should be kebab-case with a date appended
    expect(result.suggestions![0]).toMatch(/^angular-aria-guide-\d{4}-\d{2}-\d{2}\.md$/);
  });
});

describe('validateWikiPageName', () => {
  it('should delegate to validateEntityName for entity type', () => {
    const result = validateWikiPageName('angular-cdk.md', 'entity');
    expect(result.valid).toBe(true);
  });

  it('should delegate to validateConceptName for concept type', () => {
    const result = validateWikiPageName('progressive-enhancement.md', 'concept');
    expect(result.valid).toBe(true);
  });

  it('should delegate to validateSourceName for source type', () => {
    const result = validateWikiPageName('angular-guide-2024-05-10.md', 'source');
    expect(result.valid).toBe(true);
  });

  it('should throw error for invalid page type', () => {
    expect(() => {
      // @ts-expect-error Testing invalid type
      validateWikiPageName('test.md', 'invalid');
    }).toThrow('Invalid page type');
  });
});

describe('assertValidName', () => {
  it('should not throw for valid names', () => {
    expect(() => {
      assertValidName('angular-cdk.md', 'entity');
    }).not.toThrow();

    expect(() => {
      assertValidName('progressive-enhancement.md', 'concept');
    }).not.toThrow();

    expect(() => {
      assertValidName('angular-guide-2024-05-10.md', 'source');
    }).not.toThrow();
  });

  it('should throw NamingConventionError for invalid names', () => {
    expect(() => {
      assertValidName('Angular-CDK.md', 'entity');
    }).toThrow(NamingConventionError);

    expect(() => {
      assertValidName('Progressive Enhancement.md', 'concept');
    }).toThrow(NamingConventionError);

    expect(() => {
      assertValidName('angular-guide.md', 'source');
    }).toThrow(NamingConventionError);
  });

  it('should include details in thrown error', () => {
    try {
      assertValidName('Angular-CDK.md', 'entity');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NamingConventionError);
      const namingError = error as NamingConventionError;
      expect(namingError.filename).toBe('Angular-CDK.md');
      expect(namingError.pageType).toBe('entity');
      expect(namingError.expectedPattern).toBe('kebab-case-noun.md');
    }
  });
});

describe('generateFilename', () => {
  it('should generate valid entity filenames', () => {
    expect(generateFilename('Angular CDK', 'entity')).toBe('angular-cdk.md');
    expect(generateFilename('ARIA Live Region', 'entity')).toBe('aria-live-region.md');
    expect(generateFilename('Focus Trap', 'entity')).toBe('focus-trap.md');
  });

  it('should generate valid concept filenames', () => {
    expect(generateFilename('Progressive Enhancement', 'concept')).toBe('progressive-enhancement.md');
    expect(generateFilename('Accessibility Tree', 'concept')).toBe('accessibility-tree.md');
  });

  it('should generate valid source filenames with date', () => {
    const date = new Date('2024-05-10');
    expect(generateFilename('Angular ARIA Guide', 'source', date)).toBe('angular-aria-guide-2024-05-10.md');
    expect(generateFilename('WCAG Spec', 'source', date)).toBe('wcag-spec-2024-05-10.md');
  });

  it('should use current date for sources if no date provided', () => {
    const filename = generateFilename('Angular Guide', 'source');
    expect(filename).toMatch(/^angular-guide-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it('should handle special characters in titles', () => {
    expect(generateFilename('Angular@CDK.io', 'entity')).toBe('angular-cdk-io.md');
    expect(generateFilename('ARIA/Live/Region', 'entity')).toBe('aria-live-region.md');
  });

  it('should handle already kebab-case titles', () => {
    expect(generateFilename('angular-cdk', 'entity')).toBe('angular-cdk.md');
  });

  it('should validate generated filenames', () => {
    // Generate and validate entity
    const entityName = generateFilename('Test Entity', 'entity');
    const entityResult = validateEntityName(entityName);
    expect(entityResult.valid).toBe(true);

    // Generate and validate concept
    const conceptName = generateFilename('Test Concept', 'concept');
    const conceptResult = validateConceptName(conceptName);
    expect(conceptResult.valid).toBe(true);

    // Generate and validate source
    const sourceName = generateFilename('Test Source', 'source', new Date('2024-05-10'));
    const sourceResult = validateSourceName(sourceName);
    expect(sourceResult.valid).toBe(true);
  });
});

describe('edge cases', () => {
  it('should handle single character names', () => {
    expect(validateEntityName('a.md').valid).toBe(true);
    expect(validateConceptName('b.md').valid).toBe(true);
  });

  it('should handle very long names', () => {
    const longName = 'a'.repeat(100) + '.md';
    expect(validateEntityName(longName).valid).toBe(true);
  });

  it('should handle names with many hyphens', () => {
    expect(validateEntityName('a-b-c-d-e-f-g-h.md').valid).toBe(true);
  });

  it('should handle leap year dates', () => {
    expect(validateSourceName('test-2024-02-29.md').valid).toBe(true);
    expect(validateSourceName('test-2023-02-29.md').valid).toBe(false);
  });

  it('should handle end of month dates', () => {
    expect(validateSourceName('test-2024-01-31.md').valid).toBe(true);
    expect(validateSourceName('test-2024-02-31.md').valid).toBe(false);
    expect(validateSourceName('test-2024-04-31.md').valid).toBe(false);
  });
});
