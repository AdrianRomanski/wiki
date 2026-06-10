# @wiki/domain-naming

Naming convention validation and filename generation for wiki pages.

## Overview

**Library Name:** `@wiki/domain-naming`  
**Scope:** `@wiki`  
**Architectural Layer:** Domain  
**Tags:** `domain`

This library enforces naming conventions for wiki page filenames according to the wiki schema. It provides validation functions, conversion utilities, and filename generation logic to ensure all wiki pages follow consistent kebab-case naming patterns.

## Purpose and Responsibilities

The `@wiki/domain-naming` library is responsible for:

- **Naming Validation**: Validates that filenames conform to wiki schema conventions for entities, concepts, and sources
- **Format Conversion**: Converts arbitrary strings to valid kebab-case format
- **Filename Generation**: Generates properly formatted filenames from titles and page types
- **Error Reporting**: Provides detailed validation errors with suggestions for correction
- **Type Safety**: Ensures naming rules are enforced at compile-time through TypeScript types

This library ensures consistency across the wiki system by enforcing a single source of truth for filename conventions.

## Public API

### Types and Interfaces

**ValidationResult**
```typescript
interface ValidationResult {
  valid: boolean;           // Whether validation passed
  error?: string;          // Error message if invalid
  expectedPattern: string; // Expected filename pattern
  suggestions?: string[];  // Suggestions for fixing
}
```

**NamingConventionError**
```typescript
class NamingConventionError extends Error {
  constructor(
    message: string,
    public filename: string,
    public pageType: 'entity' | 'concept' | 'source',
    public expectedPattern: string
  );
}
```

### Validation Functions

**isKebabCase(str: string): boolean**

Checks if a string follows kebab-case format (lowercase words separated by hyphens).

```typescript
isKebabCase('angular-cdk');        // true
isKebabCase('Angular-CDK');        // false (uppercase)
isKebabCase('angular_cdk');        // false (underscore)
isKebabCase('angular--cdk');       // false (double hyphen)
```

**validateEntityName(filename: string): ValidationResult**

Validates entity page filenames. Entity pages must use kebab-case with `.md` extension.

- **Pattern:** `kebab-case-noun.md`
- **Example:** `angular-cdk.md`

**validateConceptName(filename: string): ValidationResult**

Validates concept page filenames. Concept pages must use kebab-case with `.md` extension.

- **Pattern:** `kebab-case-concept.md`
- **Example:** `progressive-enhancement.md`

**validateSourceName(filename: string): ValidationResult**

Validates source summary filenames. Source pages must use kebab-case with date suffix in YYYY-MM-DD format.

- **Pattern:** `source-title-yyyy-mm-dd.md`
- **Example:** `angular-aria-guide-2024-05-10.md`

**validateWikiPageName(filename: string, pageType: 'entity' | 'concept' | 'source'): ValidationResult**

Type-specific validation that delegates to the appropriate validator based on page type.

**assertValidName(filename: string, pageType: 'entity' | 'concept' | 'source'): void**

Throws `NamingConventionError` if the filename is invalid. Use this when you need to enforce valid names at runtime.

### Conversion Functions

**toKebabCase(str: string): string**

Converts any string to kebab-case format.

```typescript
toKebabCase('Angular CDK');        // 'angular-cdk'
toKebabCase('Angular_CDK');        // 'angular-cdk'
toKebabCase('AngularCDK');         // 'angularcdk'
toKebabCase('  Angular  CDK  ');   // 'angular-cdk'
```

**generateFilename(title: string, pageType: 'entity' | 'concept' | 'source', date?: Date): string**

Generates a valid filename from a title and page type. For source pages, includes the date in YYYY-MM-DD format.

```typescript
generateFilename('Angular CDK', 'entity');
// 'angular-cdk.md'

generateFilename('Progressive Enhancement', 'concept');
// 'progressive-enhancement.md'

generateFilename('Angular ARIA Guide', 'source', new Date('2024-05-10'));
// 'angular-aria-guide-2024-05-10.md'
```

## Usage Examples

### Validating Entity Filenames

```typescript
import { validateEntityName } from '@wiki/domain-naming';

const result1 = validateEntityName('angular-cdk.md');
// { valid: true, expectedPattern: 'kebab-case-noun.md' }

const result2 = validateEntityName('Angular CDK.md');
// {
//   valid: false,
//   error: "Entity page filename 'Angular CDK.md' does not match...",
//   expectedPattern: 'kebab-case-noun.md',
//   suggestions: ['angular-cdk.md']
// }
```

### Converting Titles to Filenames

```typescript
import { generateFilename } from '@wiki/domain-naming';

const entityFile = generateFilename('Angular Material', 'entity');
// 'angular-material.md'

const conceptFile = generateFilename('Component Architecture', 'concept');
// 'component-architecture.md'

const sourceFile = generateFilename(
  'RxJS Best Practices',
  'source',
  new Date('2024-03-15')
);
// 'rxjs-best-practices-2024-03-15.md'
```

### Enforcing Valid Names

```typescript
import { assertValidName, NamingConventionError } from '@wiki/domain-naming';

try {
  assertValidName('Invalid Name.md', 'entity');
} catch (error) {
  if (error instanceof NamingConventionError) {
    console.log(error.message);
    console.log('Expected:', error.expectedPattern);
    console.log('Got:', error.filename);
  }
}
```

### Type-Specific Validation

```typescript
import { validateWikiPageName } from '@wiki/domain-naming';

const pageType = 'source';
const filename = 'angular-guide-2024-01-15.md';

const result = validateWikiPageName(filename, pageType);
if (!result.valid) {
  console.error(result.error);
  console.log('Suggestions:', result.suggestions);
}
```

### Converting User Input

```typescript
import { toKebabCase, isKebabCase } from '@wiki/domain-naming';

const userInput = 'My New Page Title';

if (!isKebabCase(userInput)) {
  const converted = toKebabCase(userInput);
  console.log(`Converted to: ${converted}.md`);
  // 'Converted to: my-new-page-title.md'
}
```

## Dependencies

**External Dependencies:** None  
**Internal Dependencies:** None

This library has zero dependencies and only uses TypeScript standard library functions. It operates independently of other wiki libraries to ensure naming conventions can be validated without circular dependencies.

## Related Libraries

This library is used by:
- `@wiki/application-generators` - Generates valid filenames for new pages
- `@wiki/application-maintenance` - Validates existing page filenames during health checks
- `@wiki/infrastructure-filesystem` - Validates filenames before file operations
- `@wiki/core` - Exports naming utilities for external consumers
