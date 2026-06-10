# @wiki/domain-validation

Domain-level validation rules for wiki business constraints.

## Overview

**Library Name:** `@wiki/domain-validation`  
**Scope:** `@wiki`  
**Architectural Layer:** Domain  
**Tags:** `domain`

This library provides validation functions for enforcing business rules and data integrity constraints on wiki domain entities. It validates frontmatter metadata, page structure, and cross-reference integrity without depending on infrastructure concerns.

## Purpose and Responsibilities

The `@wiki/domain-validation` library is responsible for:

- **Frontmatter Validation**: Ensures YAML frontmatter contains all required fields with correct data types and formats
- **Page Structure Validation**: Verifies WikiPage entities have valid structure and hierarchical section organization
- **Cross-Reference Validation**: Validates that WikiLink targets exist and reference valid pages
- **Business Rule Enforcement**: Enforces domain-level constraints like date formats, heading levels, and required fields
- **Error Reporting**: Provides detailed validation errors for troubleshooting and correction

This library ensures data integrity at the domain layer before entities are persisted or processed by application services.

## Public API

### Types and Interfaces

**FrontmatterValidationResult**
```typescript
interface FrontmatterValidationResult {
  valid: boolean;    // Whether validation passed
  errors: string[];  // List of validation error messages
}
```

**PageStructureValidationResult**
```typescript
interface PageStructureValidationResult {
  valid: boolean;    // Whether validation passed
  errors: string[];  // List of validation error messages
}
```

**CrossReferenceValidationResult**
```typescript
interface CrossReferenceValidationResult {
  valid: boolean;          // Whether validation passed
  errors: string[];        // List of validation error messages
  missingTargets: string[]; // List of link targets that don't exist
}
```

### Validation Functions

**validateFrontmatter(frontmatter: Partial<WikiPageFrontmatter>): FrontmatterValidationResult**

Validates frontmatter completeness and correctness. Checks:
- `title` is required and non-empty
- `type` is required and one of: 'entity', 'concept', 'source'
- `tags` is required and is an array
- `created` is required and in YYYY-MM-DD format
- `updated` is required and in YYYY-MM-DD format
- `date` (if present) is in YYYY-MM-DD format
- `sources` (if present) is an array

**validatePageStructure(page: WikiPage): PageStructureValidationResult**

Validates page structure integrity. Checks:
- `path` is required and non-empty
- `filename` is required and non-empty
- `frontmatter` is required
- `content` is required and non-empty
- `sections` is required and is an array
- Section hierarchy is valid (subsection levels > parent levels)
- Section levels are between 1 and 6
- `outgoingLinks` is required and is an array
- `incomingLinks` is required and is an array

**validateCrossReferences(page: WikiPage, existingPages: string[]): CrossReferenceValidationResult**

Validates cross-reference targets exist. Checks:
- All outgoing links are non-empty
- All outgoing link targets exist in the provided `existingPages` array
- Returns list of missing targets for correction

## Usage Examples

### Validating Frontmatter

```typescript
import { validateFrontmatter } from '@wiki/domain-validation';
import { WikiPageFrontmatter } from '@wiki/domain-models';

const frontmatter: Partial<WikiPageFrontmatter> = {
  title: 'Angular CDK',
  type: 'entity',
  tags: ['angular', 'ui'],
  created: '2024-01-15',
  updated: '2024-01-15'
};

const result = validateFrontmatter(frontmatter);

if (!result.valid) {
  console.error('Validation errors:');
  result.errors.forEach(error => console.error(`  - ${error}`));
}
// Valid frontmatter: result.valid === true
```

### Validating with Missing Fields

```typescript
import { validateFrontmatter } from '@wiki/domain-validation';

const incompleteFrontmatter = {
  title: 'Angular CDK',
  type: 'entity'
  // Missing: tags, created, updated
};

const result = validateFrontmatter(incompleteFrontmatter);
// result.valid === false
// result.errors === [
//   'tags is required',
//   'created date is required',
//   'updated date is required'
// ]
```

### Validating Page Structure

```typescript
import { validatePageStructure } from '@wiki/domain-validation';
import { WikiPage, Section } from '@wiki/domain-models';

const page: WikiPage = {
  path: 'entities/angular-cdk.md',
  filename: 'angular-cdk.md',
  frontmatter: {
    title: 'Angular CDK',
    type: 'entity',
    tags: ['angular'],
    created: '2024-01-15',
    updated: '2024-01-15'
  },
  content: '## Overview\n\nThe Angular CDK...',
  sections: [
    {
      heading: 'Overview',
      level: 2,
      content: 'The Angular CDK...',
      subsections: []
    }
  ],
  outgoingLinks: ['angular-material'],
  incomingLinks: []
};

const result = validatePageStructure(page);
if (result.valid) {
  console.log('Page structure is valid');
}
```

### Detecting Invalid Section Hierarchy

```typescript
import { validatePageStructure } from '@wiki/domain-validation';
import { WikiPage } from '@wiki/domain-models';

const pageWithInvalidSections: WikiPage = {
  // ... other fields ...
  sections: [
    {
      heading: 'Overview',
      level: 2,
      content: '...',
      subsections: [
        {
          heading: 'Invalid Subsection',
          level: 2,  // ERROR: Same level as parent!
          content: '...',
          subsections: []
        }
      ]
    }
  ],
  // ... other fields ...
};

const result = validatePageStructure(pageWithInvalidSections);
// result.valid === false
// result.errors includes:
// 'subsection level (2) must be greater than parent level (2)'
```

### Validating Cross-References

```typescript
import { validateCrossReferences } from '@wiki/domain-validation';
import { WikiPage } from '@wiki/domain-models';

const page: WikiPage = {
  // ... other fields ...
  outgoingLinks: [
    'angular-material',
    'rxjs',
    'non-existent-page'  // This will fail validation
  ],
  // ... other fields ...
};

const existingPages = [
  'entities/angular-material.md',
  'entities/rxjs.md',
  'concepts/reactive-programming.md'
];

const result = validateCrossReferences(page, existingPages);

if (!result.valid) {
  console.error('Broken links found:');
  result.missingTargets.forEach(target => {
    console.error(`  - ${target} does not exist`);
  });
}
// result.missingTargets === ['non-existent-page']
```

### Pre-Save Validation Workflow

```typescript
import {
  validateFrontmatter,
  validatePageStructure,
  validateCrossReferences
} from '@wiki/domain-validation';
import { WikiPage } from '@wiki/domain-models';

function validateBeforeSave(
  page: WikiPage,
  existingPages: string[]
): boolean {
  const frontmatterResult = validateFrontmatter(page.frontmatter);
  if (!frontmatterResult.valid) {
    console.error('Frontmatter errors:', frontmatterResult.errors);
    return false;
  }

  const structureResult = validatePageStructure(page);
  if (!structureResult.valid) {
    console.error('Structure errors:', structureResult.errors);
    return false;
  }

  const crossRefResult = validateCrossReferences(page, existingPages);
  if (!crossRefResult.valid) {
    console.warn('Cross-reference warnings:', crossRefResult.errors);
    // Continue even with broken links (warning only)
  }

  return true;
}
```

### Validating Date Formats

```typescript
import { validateFrontmatter } from '@wiki/domain-validation';

const frontmatterWithInvalidDate = {
  title: 'Test Page',
  type: 'source',
  tags: ['test'],
  created: '2024-13-45',  // Invalid date
  updated: '01/15/2024',  // Wrong format
  date: '2024-1-5'        // Missing leading zeros
};

const result = validateFrontmatter(frontmatterWithInvalidDate);
// result.errors includes:
// 'created date must be in YYYY-MM-DD format'
// 'updated date must be in YYYY-MM-DD format'
// 'date must be in YYYY-MM-DD format'
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - Imports domain entity interfaces (WikiPage, WikiPageFrontmatter)

This library depends only on domain entity definitions and contains no infrastructure or framework dependencies. All validation logic is pure TypeScript without external libraries.

## Related Libraries

This library is used by:
- `@wiki/application-generators` - Validates generated pages before creation
- `@wiki/application-maintenance` - Validates existing pages during health checks
- `@wiki/application-workflow` - Validates pages in workflow orchestration
- `@wiki/infrastructure-frontmatter` - Validates parsed frontmatter data
- `@wiki/core` - Exports validation utilities for external consumers

This library uses:
- `@wiki/domain-models` - Domain entity type definitions
