# @wiki/application-index-manager

Index management use cases for maintaining wiki page indexes organized by type and tags.

## Overview

**Library Name:** `@wiki/application-index-manager`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for managing wiki page indexes. It handles adding, removing, and regenerating index entries, scanning wiki pages, and generating index content with organized sections by page type and tag categories.

## Purpose and Responsibilities

The `@wiki/application-index-manager` library is responsible for:

- **Index Entry Management**: Adding and removing individual index entries
- **Index Regeneration**: Rebuilding complete indexes from wiki pages
- **Page Scanning**: Discovering and extracting metadata from wiki pages
- **Content Generation**: Producing formatted index markdown with sections
- **Type Organization**: Grouping entries by page type (entity, concept, source)
- **Tag Categorization**: Organizing entries by tag categories
- **Link Generation**: Creating WikiLinks to indexed pages

This library maintains the central index files that provide organized navigation to all wiki content.

## Public API

### Use Case Classes

**AddEntityToIndexUseCase**
```typescript
class AddEntityToIndexUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(pagePath: string): Promise<void>;
}
```

**AddConceptToIndexUseCase**
```typescript
class AddConceptToIndexUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(pagePath: string): Promise<void>;
}
```

**AddSourceToIndexUseCase**
```typescript
class AddSourceToIndexUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(pagePath: string): Promise<void>;
}
```

**AddEntryToIndexUseCase**
```typescript
class AddEntryToIndexUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort
  );
  
  async execute(entry: IndexEntry, indexPath: string): Promise<void>;
}
```

**RemoveEntryFromIndexUseCase**
```typescript
class RemoveEntryFromIndexUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort
  );
  
  async execute(pageTitle: string, indexPath: string): Promise<void>;
}
```

**RegenerateIndexUseCase**
```typescript
class RegenerateIndexUseCase {
  constructor(
    scanPages: ScanWikiPagesUseCase,
    generateContent: GenerateIndexContentUseCase,
    fileSystemPort: FileSystemPort
  );
  
  async execute(config?: IndexConfig): Promise<void>;
}
```

**ScanWikiPagesUseCase**
```typescript
class ScanWikiPagesUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(pattern?: string): Promise<IndexEntry[]>;
}
```

**GenerateIndexContentUseCase**
```typescript
class GenerateIndexContentUseCase {
  constructor(markdownPort: MarkdownPort);
  
  execute(entries: IndexEntry[], config?: IndexConfig): string;
}
```

**ParseIndexEntriesUseCase**
```typescript
class ParseIndexEntriesUseCase {
  constructor(markdownPort: MarkdownPort);
  
  execute(indexContent: string): IndexEntry[];
}
```

### Data Types

**IndexEntry**
```typescript
interface IndexEntry {
  title: string;
  type: 'entity' | 'concept' | 'source';
  tags: string[];
  path: string;
  created: string;
  updated: string;
}
```

**IndexConfig**
```typescript
interface IndexConfig {
  indexPath: string;
  groupByType: boolean;
  groupByTag: boolean;
  sortByDate: boolean;
  includeTimestamps: boolean;
}
```

**DEFAULT_INDEX_CONFIG**
```typescript
const DEFAULT_INDEX_CONFIG: IndexConfig = {
  indexPath: 'index.md',
  groupByType: true,
  groupByTag: false,
  sortByDate: false,
  includeTimestamps: false
};
```

## Usage Examples

### Adding an Entity to Index

```typescript
import { AddEntityToIndexUseCase } from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const addEntity = new AddEntityToIndexUseCase(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);

await addEntity.execute('entities/angular-cdk.md');
console.log('Added Angular CDK to entity index');
```

### Removing an Entry from Index

```typescript
import { RemoveEntryFromIndexUseCase } from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const removeEntry = new RemoveEntryFromIndexUseCase(
  fileSystemPort,
  markdownPort
);

await removeEntry.execute('Angular CDK', 'index.md');
console.log('Removed Angular CDK from index');
```

### Scanning Wiki Pages

```typescript
import { ScanWikiPagesUseCase } from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const scanPages = new ScanWikiPagesUseCase(
  fileSystemPort,
  frontmatterPort
);

const entries = await scanPages.execute('entities/*.md');

console.log(`Found ${entries.length} entity pages:`);
for (const entry of entries) {
  console.log(`  - ${entry.title} [${entry.tags.join(', ')}]`);
}
```

### Generating Index Content

```typescript
import { GenerateIndexContentUseCase, IndexEntry } from '@wiki/application-index-manager';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const markdownPort = new MarkdownAdapter();
const generateIndex = new GenerateIndexContentUseCase(markdownPort);

const entries: IndexEntry[] = [
  {
    title: 'Angular CDK',
    type: 'entity',
    tags: ['angular', 'ui'],
    path: 'entities/angular-cdk.md',
    created: '2024-01-15',
    updated: '2024-01-15'
  },
  {
    title: 'Progressive Enhancement',
    type: 'concept',
    tags: ['web-development'],
    path: 'concepts/progressive-enhancement.md',
    created: '2024-01-16',
    updated: '2024-01-16'
  }
];

const content = generateIndex.execute(entries, {
  indexPath: 'index.md',
  groupByType: true,
  groupByTag: false,
  sortByDate: false,
  includeTimestamps: false
});

console.log(content);
```

### Regenerating Complete Index

```typescript
import { 
  RegenerateIndexUseCase,
  ScanWikiPagesUseCase,
  GenerateIndexContentUseCase
} from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const scanPages = new ScanWikiPagesUseCase(
  fileSystemPort,
  frontmatterPort
);

const generateContent = new GenerateIndexContentUseCase(markdownPort);

const regenerateIndex = new RegenerateIndexUseCase(
  scanPages,
  generateContent,
  fileSystemPort
);

await regenerateIndex.execute({
  indexPath: 'index.md',
  groupByType: true,
  groupByTag: true,
  sortByDate: false,
  includeTimestamps: true
});

console.log('Index regenerated successfully');
```

### Parsing Existing Index Entries

```typescript
import { ParseIndexEntriesUseCase } from '@wiki/application-index-manager';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const markdownPort = new MarkdownAdapter();
const fileSystemPort = new FileSystemAdapter();

const parseEntries = new ParseIndexEntriesUseCase(markdownPort);

const indexContent = await fileSystemPort.readWikiFile('index.md');
const entries = parseEntries.execute(indexContent);

console.log(`Parsed ${entries.length} index entries`);
```

### Custom Index Configuration

```typescript
import { 
  RegenerateIndexUseCase,
  ScanWikiPagesUseCase,
  GenerateIndexContentUseCase,
  IndexConfig
} from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const scanPages = new ScanWikiPagesUseCase(
  fileSystemPort,
  frontmatterPort
);

const generateContent = new GenerateIndexContentUseCase(markdownPort);

const regenerateIndex = new RegenerateIndexUseCase(
  scanPages,
  generateContent,
  fileSystemPort
);

const config: IndexConfig = {
  indexPath: 'custom-index.md',
  groupByType: false,
  groupByTag: true,
  sortByDate: true,
  includeTimestamps: true
};

await regenerateIndex.execute(config);
console.log('Custom index created');
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPageFrontmatter type
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - Index generation workflows
- `@wiki/core` - Public API facade for index management
