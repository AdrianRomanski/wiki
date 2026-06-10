# @wiki/application-activity-log

Activity logging use cases for tracking chronological wiki operations.

## Overview

**Library Name:** `@wiki/application-activity-log`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for recording and querying wiki activity logs. It tracks page creations, updates, and source ingestions in a chronological log file, providing an audit trail and operational history for the wiki system.

## Purpose and Responsibilities

The `@wiki/application-activity-log` library is responsible for:

- **Activity Recording**: Logs page creations, updates, and source ingestions
- **Log Entry Formatting**: Generates structured markdown log entries
- **Chronological Organization**: Maintains entries in reverse chronological order
- **Log Querying**: Retrieves activity history with filtering options
- **Cross-Reference Integration**: Includes WikiLinks in log entries
- **Timestamp Management**: Records precise timestamps for all operations
- **Entry Insertion**: Positions new entries correctly in the log file

This library provides transparency into wiki operations and enables tracking of content evolution over time.

## Public API

### Use Case Classes

**LogActivityUseCase**
```typescript
class LogActivityUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort
  );
  
  async recordIngestion(
    sourcePath: string,
    generatedPages: string[],
    timestamp?: Date
  ): Promise<void>;
  
  async recordCreation(
    pagePath: string,
    pageTitle: string,
    pageType: 'entity' | 'concept' | 'source',
    sourcePath?: string,
    tags?: string[],
    timestamp?: Date
  ): Promise<void>;
  
  async recordUpdate(
    pagePath: string,
    pageTitle: string,
    changes: string,
    reason: string,
    timestamp?: Date
  ): Promise<void>;
}
```

**QueryActivityLogUseCase**
```typescript
class QueryActivityLogUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(options?: QueryOptions): Promise<ActivityLogEntry[]>;
}
```

### Data Types

**QueryOptions**
```typescript
interface QueryOptions {
  type?: 'creation' | 'update' | 'ingestion';
  pageTitle?: string;
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  tags?: string[];
}
```

## Usage Examples

### Recording Page Creation

```typescript
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const logActivity = new LogActivityUseCase(
  fileSystemPort,
  markdownPort
);

await logActivity.recordCreation(
  'entities/angular-cdk.md',
  'Angular CDK',
  'entity',
  undefined,
  ['angular', 'ui', 'accessibility']
);

console.log('Logged creation of Angular CDK page');
```

### Recording Page Update

```typescript
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const logActivity = new LogActivityUseCase(
  fileSystemPort,
  markdownPort
);

await logActivity.recordUpdate(
  'entities/angular-cdk.md',
  'Angular CDK',
  'Added section on accessibility features',
  'Expanded documentation based on new Angular 17 features'
);

console.log('Logged update to Angular CDK page');
```

### Recording Source Ingestion

```typescript
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const logActivity = new LogActivityUseCase(
  fileSystemPort,
  markdownPort
);

await logActivity.recordIngestion(
  'raw/angular-docs/accessibility-guide.md',
  [
    'entities/angular-cdk.md',
    'concepts/accessibility.md',
    'sources/angular-accessibility-guide-2024-01-15.md'
  ]
);

console.log('Logged source ingestion');
```

### Querying Activity Log

```typescript
import { QueryActivityLogUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const queryLog = new QueryActivityLogUseCase(
  fileSystemPort,
  frontmatterPort
);

const entries = await queryLog.execute({
  type: 'creation',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  maxResults: 10
});

console.log(`Found ${entries.length} creation entries in January 2024:`);
for (const entry of entries) {
  console.log(`  - ${entry.pageTitle} (${entry.timestamp.toISOString()})`);
}
```

### Filtering by Page Title

```typescript
import { QueryActivityLogUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const queryLog = new QueryActivityLogUseCase(
  fileSystemPort,
  frontmatterPort
);

const entries = await queryLog.execute({
  pageTitle: 'Angular CDK'
});

console.log(`Activity history for Angular CDK:`);
for (const entry of entries) {
  console.log(`  - ${entry.type}: ${entry.timestamp.toLocaleDateString()}`);
  if (entry.type === 'update' && entry.changes) {
    console.log(`    Changes: ${entry.changes}`);
  }
}
```

### Filtering by Tags

```typescript
import { QueryActivityLogUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const queryLog = new QueryActivityLogUseCase(
  fileSystemPort,
  frontmatterPort
);

const entries = await queryLog.execute({
  tags: ['angular', 'accessibility']
});

console.log('Angular accessibility-related activity:');
for (const entry of entries) {
  console.log(`  - ${entry.pageTitle}: ${entry.type}`);
}
```

### Complete Logging Workflow

```typescript
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { GenerateEntityPageUseCase } from '@wiki/application-generators';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateEntity = new GenerateEntityPageUseCase(
  markdownPort,
  frontmatterPort
);

const logActivity = new LogActivityUseCase(
  fileSystemPort,
  markdownPort
);

const page = generateEntity.execute({
  name: 'Angular Router',
  definition: 'The Angular Router enables navigation between views.',
  tags: ['angular', 'routing']
});

const pagePath = `entities/${page.filename}`;
await fileSystemPort.writeWikiFile(pagePath, page.content);

await logActivity.recordCreation(
  pagePath,
  page.frontmatter.title,
  page.frontmatter.type,
  undefined,
  page.frontmatter.tags
);

console.log(`Created and logged: ${page.frontmatter.title}`);
```

### Recording with Custom Timestamps

```typescript
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const logActivity = new LogActivityUseCase(
  fileSystemPort,
  markdownPort
);

const backdate = new Date('2024-01-15T10:30:00Z');

await logActivity.recordCreation(
  'entities/historical-page.md',
  'Historical Page',
  'entity',
  undefined,
  ['historical'],
  backdate
);

console.log('Logged with custom timestamp');
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - ActivityLogEntry type
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - Logs all workflow operations
- `@wiki/core` - Public API facade for activity logging
