# @wiki/domain-models

Core domain entities and value objects for the wiki system.

## Overview

**Library Name:** `@wiki/domain-models`  
**Scope:** `@wiki`  
**Architectural Layer:** Domain  
**Tags:** `domain`

This library contains the fundamental domain entities and value objects that represent the wiki system's core business concepts. It provides pure TypeScript interfaces with no external dependencies or framework-specific code.

## Purpose and Responsibilities

The `@wiki/domain-models` library defines the core data structures for the wiki system:

- **Domain Entities**: Represents the main business objects (WikiPage, RawSource, ActivityLogEntry, MaintenanceReport)
- **Value Objects**: Immutable data structures for structured information (WikiPageFrontmatter, Section)
- **Type Safety**: Provides strong TypeScript interfaces for all domain concepts
- **Layer Independence**: Contains no dependencies on infrastructure, application logic, or external frameworks

This library serves as the foundation for all other layers in the clean architecture, ensuring business concepts are consistently represented throughout the system.

## Public API

### Entities

**WikiPage**
```typescript
interface WikiPage {
  path: string;              // Relative path from wiki/ directory
  filename: string;          // File name
  frontmatter: WikiPageFrontmatter;  // YAML frontmatter metadata
  content: string;           // Markdown body content
  sections: Section[];       // Parsed hierarchical sections
  outgoingLinks: string[];   // WikiLink references in this page
  incomingLinks: string[];   // Pages that link to this page
}
```

**WikiPageFrontmatter**
```typescript
interface WikiPageFrontmatter {
  title: string;                          // Page title (required)
  type: 'entity' | 'concept' | 'source'; // Page type (required)
  tags: string[];                         // Categorization tags (required)
  sources?: string[];                     // References to raw sources
  author?: string;                        // Author name for sources
  date?: string;                          // Publication date (YYYY-MM-DD)
  url?: string;                           // Source URL
  created: string;                        // Creation date (YYYY-MM-DD)
  updated: string;                        // Last update date (YYYY-MM-DD)
}
```

**Section**
```typescript
interface Section {
  heading: string;         // Section heading text
  level: number;          // Heading level (1-6)
  content: string;        // Section content
  subsections: Section[]; // Nested subsections
}
```

**RawSource**
```typescript
interface RawSource {
  path: string;              // Relative path from raw/ directory
  filename: string;          // Original filename
  format: 'md' | 'pdf' | 'txt' | 'code';  // File format
  category: string;          // Subdirectory category
  addedDate: Date;           // Date when file was added
  fileSize: number;          // File size in bytes
  content: string | Buffer;  // File content
  ingested: boolean;         // Whether processed into wiki pages
  generatedPages: string[];  // Paths to generated wiki pages
}
```

**ActivityLogEntry**
```typescript
interface ActivityLogEntry {
  timestamp: Date;                              // Operation timestamp
  type: 'creation' | 'update' | 'ingestion';   // Operation type
  pagePath?: string;                            // Wiki page path
  pageTitle?: string;                           // Wiki page title
  pageType?: 'entity' | 'concept' | 'source';  // Page type
  changes?: string;                             // Description of changes
  reason?: string;                              // Reason for update
  sourcePath?: string;                          // Raw source path
  generatedPages?: string[];                    // Generated pages
  tags?: string[];                              // Associated tags
}
```

**MaintenanceReport**
```typescript
interface MaintenanceReport {
  timestamp: Date;                            // Report generation timestamp
  duplicates: DuplicateEntry[];              // Duplicate content detected
  contradictions: ContradictionEntry[];      // Contradictory information
  brokenLinks: BrokenLinkEntry[];            // Broken WikiLink references
  consolidationOpportunities: ConsolidationEntry[];  // Pages to consolidate
  orphans: OrphanEntry[];                    // Orphaned pages
  summary: HealthSummary;                    // Overall health statistics
  adrFindings?: ADRFindings;                 // ADR-specific findings
}
```

## Usage Examples

### Creating a WikiPage Entity

```typescript
import { WikiPage, WikiPageFrontmatter, Section } from '@wiki/domain-models';

const frontmatter: WikiPageFrontmatter = {
  title: 'Angular CDK',
  type: 'entity',
  tags: ['angular', 'ui', 'component-library'],
  created: '2024-01-15',
  updated: '2024-01-15'
};

const sections: Section[] = [
  {
    heading: 'Overview',
    level: 2,
    content: 'The Angular Component Dev Kit (CDK) provides...',
    subsections: []
  }
];

const page: WikiPage = {
  path: 'entities/angular-cdk.md',
  filename: 'angular-cdk.md',
  frontmatter,
  content: '## Overview\n\nThe Angular Component Dev Kit...',
  sections,
  outgoingLinks: ['angular-material'],
  incomingLinks: []
};
```

### Working with Activity Log Entries

```typescript
import { ActivityLogEntry } from '@wiki/domain-models';

const logEntry: ActivityLogEntry = {
  timestamp: new Date(),
  type: 'creation',
  pagePath: 'entities/angular-cdk.md',
  pageTitle: 'Angular CDK',
  pageType: 'entity',
  tags: ['angular', 'ui']
};
```

### Defining Hierarchical Sections

```typescript
import { Section } from '@wiki/domain-models';

const section: Section = {
  heading: 'Architecture',
  level: 2,
  content: 'The CDK architecture consists of...',
  subsections: [
    {
      heading: 'Core Components',
      level: 3,
      content: 'Core components include...',
      subsections: []
    },
    {
      heading: 'Utilities',
      level: 3,
      content: 'Utility functions provide...',
      subsections: []
    }
  ]
};
```

## Dependencies

**External Dependencies:** None  
**Internal Dependencies:** None

This library has zero dependencies and only uses TypeScript standard library types. It represents the innermost layer of the clean architecture with no coupling to external frameworks or libraries.

## Related Libraries

This library is referenced by:
- `@wiki/domain-validation` - Validates domain entities and value objects
- `@wiki/application-generators` - Uses domain entities for page generation
- `@wiki/application-query` - Queries and retrieves domain entities
- `@wiki/application-cross-reference` - Manages cross-references between entities
- `@wiki/application-activity-log` - Logs operations on domain entities
- `@wiki/application-maintenance` - Analyzes and reports on domain entities
- `@wiki/infrastructure-frontmatter` - Parses and generates domain entities
- `@wiki/infrastructure-markdown` - Converts between markdown and domain entities
- `@wiki/core` - Public API facade that exports domain entities
