# @wiki/infrastructure-frontmatter

YAML frontmatter processing adapter for wiki page metadata.

## Overview

**Library Name:** `@wiki/infrastructure-frontmatter`  
**Scope:** `@wiki`  
**Architectural Layer:** Infrastructure  
**Tags:** `infrastructure`

This library provides a concrete implementation of the `FrontmatterPort` interface, handling all YAML frontmatter parsing, generation, and validation operations. It uses gray-matter for YAML processing and ensures Obsidian compatibility.

## Purpose and Responsibilities

The `@wiki/infrastructure-frontmatter` library is responsible for:

- **Port Implementation**: Implements the `FrontmatterPort` interface defined in the Application Layer
- **YAML Parsing**: Parses YAML frontmatter from markdown content using gray-matter
- **Frontmatter Generation**: Generates properly formatted YAML frontmatter with markdown content
- **Field Validation**: Validates required fields and data types for WikiPageFrontmatter
- **Timestamp Management**: Creates and updates timestamp fields in ISO date format
- **Date Conversion**: Handles date format conversions between Date objects and YYYY-MM-DD strings
- **Error Reporting**: Provides detailed validation errors with field-specific context

This library isolates YAML processing logic, enabling alternative frontmatter formats or validation rules without affecting application logic.

## Public API

### Classes

**FrontmatterAdapter**
```typescript
class FrontmatterAdapter implements FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter;
  generateFrontmatter(frontmatter: WikiPageFrontmatter, content?: string): string;
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter;
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter;
}
```

### Error Classes

**FrontmatterValidationError**
```typescript
class FrontmatterValidationError extends Error {
  constructor(message: string, public field?: string);
}
```

## Usage Examples

### Parsing Frontmatter from Markdown

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const adapter = new FrontmatterAdapter();

const markdown = `---
title: Angular CDK
type: entity
tags: [angular, ui, components]
created: 2024-01-15
updated: 2024-01-15
---

# Angular CDK

The Component Dev Kit provides...`;

const result = adapter.parseFrontmatter(markdown);

console.log(result.frontmatter.title);    // "Angular CDK"
console.log(result.frontmatter.type);     // "entity"
console.log(result.frontmatter.tags);     // ["angular", "ui", "components"]
console.log(result.content);              // "# Angular CDK\n\nThe Component Dev Kit provides..."
```

### Generating Frontmatter with Content

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { WikiPageFrontmatter } from '@wiki/domain-models';

const adapter = new FrontmatterAdapter();

const frontmatter: WikiPageFrontmatter = {
  title: 'Progressive Enhancement',
  type: 'concept',
  tags: ['web-development', 'accessibility'],
  created: '2024-03-20',
  updated: '2024-03-20'
};

const content = '## Overview\n\nProgressive enhancement is...';

const markdown = adapter.generateFrontmatter(frontmatter, content);

console.log(markdown);
// ---
// title: Progressive Enhancement
// type: concept
// tags:
//   - web-development
//   - accessibility
// created: 2024-03-20
// updated: 2024-03-20
// ---
// ## Overview
//
// Progressive enhancement is...
```

### Creating Frontmatter from Partial Data

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const adapter = new FrontmatterAdapter();

const frontmatter = adapter.createFrontmatter({
  title: 'RxJS Best Practices',
  type: 'source',
  tags: ['rxjs', 'reactive-programming'],
  author: 'John Doe',
  date: '2024-02-10',
  url: 'https://example.com/rxjs-guide'
});

console.log(frontmatter.created);  // Current date in YYYY-MM-DD format
console.log(frontmatter.updated);  // Current date in YYYY-MM-DD format
console.log(frontmatter.author);   // "John Doe"
console.log(frontmatter.url);      // "https://example.com/rxjs-guide"
```

### Updating Timestamps

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { WikiPageFrontmatter } from '@wiki/domain-models';

const adapter = new FrontmatterAdapter();

const existingFrontmatter: WikiPageFrontmatter = {
  title: 'Angular Material',
  type: 'entity',
  tags: ['angular', 'material-design'],
  created: '2024-01-01',
  updated: '2024-01-01'
};

const updatedFrontmatter = adapter.updateTimestamp(existingFrontmatter);

console.log(updatedFrontmatter.created);  // "2024-01-01" (unchanged)
console.log(updatedFrontmatter.updated);  // Current date (e.g., "2024-03-20")
```

### Handling Source Pages with Optional Fields

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const adapter = new FrontmatterAdapter();

const sourceFrontmatter = adapter.createFrontmatter({
  title: 'Angular ARIA Guide',
  type: 'source',
  tags: ['accessibility', 'aria'],
  sources: ['https://angular.dev/guide/accessibility'],
  author: 'Angular Team',
  date: '2024-05-10',
  url: 'https://angular.dev/guide/accessibility'
});

const markdown = adapter.generateFrontmatter(sourceFrontmatter);

console.log(markdown);
// ---
// title: Angular ARIA Guide
// type: source
// tags:
//   - accessibility
//   - aria
// sources:
//   - https://angular.dev/guide/accessibility
// author: Angular Team
// date: 2024-05-10
// url: https://angular.dev/guide/accessibility
// created: 2024-03-20
// updated: 2024-03-20
// ---
```

### Error Handling

```typescript
import { 
  FrontmatterAdapter, 
  FrontmatterValidationError 
} from '@wiki/infrastructure-frontmatter';

const adapter = new FrontmatterAdapter();

try {
  const frontmatter = adapter.createFrontmatter({
    type: 'entity',
    tags: []
  });
} catch (error) {
  if (error instanceof FrontmatterValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field:', error.field);
    // "Title and type are required to create frontmatter"
  }
}

try {
  const markdown = `---
title: Invalid Page
type: invalid-type
tags: not-an-array
---`;
  
  adapter.parseFrontmatter(markdown);
} catch (error) {
  if (error instanceof FrontmatterValidationError) {
    console.error('Parse failed:', error.message);
    console.error('Field:', error.field);
    // Field "type" must be one of: entity, concept, source
  }
}
```

### Working with Date Objects

```typescript
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const adapter = new FrontmatterAdapter();

const frontmatter = adapter.createFrontmatter({
  title: 'Example Page',
  type: 'entity',
  tags: ['example']
});

const markdown = `---
title: Example
type: entity
tags: [example]
created: ${new Date('2024-01-15')}
updated: ${new Date('2024-03-20')}
---`;

const parsed = adapter.parseFrontmatter(markdown);

console.log(parsed.frontmatter.created);  // "2024-01-15"
console.log(parsed.frontmatter.updated);  // "2024-03-20"
```

## Dependencies

**External Dependencies:**
- `gray-matter` - YAML frontmatter parsing and generation

**Internal Dependencies:**
- `@wiki/application-ports` - FrontmatterPort interface, ParsedFrontmatter type
- `@wiki/domain-models` - WikiPageFrontmatter value object

## Related Libraries

This library is used by:
- `@wiki/application-generators` - Creates frontmatter for new wiki pages
- `@wiki/application-query` - Parses frontmatter for search and filtering
- `@wiki/application-activity-log` - Extracts metadata from activity log entries
- `@wiki/application-maintenance` - Validates frontmatter during health checks
- `@wiki/application-workflow` - Processes frontmatter during ingestion workflows
- `@wiki/core` - Provides frontmatter adapter to external consumers
