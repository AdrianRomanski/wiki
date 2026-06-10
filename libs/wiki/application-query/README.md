# @wiki/application-query

Search and query use cases for retrieving wiki content with relevance scoring.

## Overview

**Library Name:** `@wiki/application-query`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for searching and querying wiki pages. It implements full-text search, tag-based filtering, type-specific queries, and relevance scoring to help users discover and retrieve wiki content efficiently.

## Purpose and Responsibilities

The `@wiki/application-query` library is responsible for:

- **Full-Text Search**: Searches across all wiki page content with relevance scoring
- **Tag-Based Search**: Filters pages by tags
- **Type-Specific Queries**: Retrieves entities, concepts, or sources
- **Source Filtering**: Advanced filtering for source documents by author, date, URL
- **Research Decision Queries**: ADR-specific search functionality
- **Relevance Scoring**: Ranks results by query relevance
- **Related Pages**: Discovers pages connected by WikiLinks
- **Result Formatting**: Provides search results with matched content snippets

This library enables efficient discovery and retrieval of wiki knowledge through flexible querying capabilities.

## Public API

### Use Case Classes

**QueryEngine**
```typescript
class QueryEngine {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  async searchByTag(tags: string[], options?: SearchOptions): Promise<SearchResult[]>;
  async findEntities(options?: SearchOptions): Promise<WikiPage[]>;
  async findConcepts(options?: SearchOptions): Promise<WikiPage[]>;
  async findSources(filters?: SourceFilters, options?: SearchOptions): Promise<WikiPage[]>;
  async findResearchDecisions(sessionId?: string): Promise<WikiPage[]>;
}
```

**SearchUseCase**
```typescript
class SearchUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
```

**SearchByTagUseCase**
```typescript
class SearchByTagUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(tags: string[], options?: SearchOptions): Promise<SearchResult[]>;
}
```

**FindEntitiesUseCase**
```typescript
class FindEntitiesUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(options?: SearchOptions): Promise<WikiPage[]>;
}
```

**FindConceptsUseCase**
```typescript
class FindConceptsUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(options?: SearchOptions): Promise<WikiPage[]>;
}
```

**FindSourcesUseCase**
```typescript
class FindSourcesUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(
    filters?: SourceFilters,
    options?: SearchOptions
  ): Promise<WikiPage[]>;
}
```

**FindResearchDecisionsUseCase**
```typescript
class FindResearchDecisionsUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(sessionId?: string): Promise<WikiPage[]>;
}
```

### Factory Functions

**createQueryEngine**
```typescript
function createQueryEngine(
  fileSystemPort: FileSystemPort,
  frontmatterPort: FrontmatterPort,
  markdownPort: MarkdownPort
): QueryEngine;
```

### Data Types

**SearchResult**
```typescript
interface SearchResult {
  page: WikiPage;
  relevance: number;
  matchedContent: string[];
  relatedPages: WikiPage[];
}
```

**SearchOptions**
```typescript
interface SearchOptions {
  maxResults?: number;
  includeRelatedPages?: boolean;
  caseSensitive?: boolean;
  snippetLength?: number;
  sortByDate?: boolean;
}
```

**SourceFilters**
```typescript
interface SourceFilters {
  author?: string;
  date?: string;
  urlPattern?: string;
  libraryName?: string;
  sessionId?: string;
}
```

## Usage Examples

### Basic Full-Text Search

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const queryEngine = createQueryEngine(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);

const results = await queryEngine.search('accessibility');

console.log(`Found ${results.length} pages about accessibility:`);
for (const result of results) {
  console.log(`  - ${result.page.frontmatter.title} (relevance: ${result.relevance})`);
  console.log(`    Matches: ${result.matchedContent.join(', ')}`);
}
```

### Search with Options

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const results = await queryEngine.search('Angular', {
  maxResults: 5,
  includeRelatedPages: true,
  caseSensitive: false,
  snippetLength: 100,
  sortByDate: true
});

console.log('Recent Angular pages:');
for (const result of results) {
  console.log(`  - ${result.page.frontmatter.title}`);
  console.log(`    Created: ${result.page.frontmatter.created}`);
  if (result.relatedPages.length > 0) {
    console.log(`    Related: ${result.relatedPages.map(p => p.frontmatter.title).join(', ')}`);
  }
}
```

### Search by Tags

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const results = await queryEngine.searchByTag(['angular', 'accessibility']);

console.log('Pages tagged with angular AND accessibility:');
for (const result of results) {
  console.log(`  - ${result.page.frontmatter.title}`);
  console.log(`    Tags: ${result.page.frontmatter.tags.join(', ')}`);
}
```

### Find All Entities

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const entities = await queryEngine.findEntities({
  maxResults: 20,
  sortByDate: true
});

console.log(`Found ${entities.length} entity pages:`);
for (const entity of entities) {
  console.log(`  - ${entity.frontmatter.title}`);
}
```

### Find Sources with Filters

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const sources = await queryEngine.findSources({
  author: 'Angular Team',
  urlPattern: 'angular.io',
  date: '2024-01-15'
});

console.log('Angular Team sources from January 15, 2024:');
for (const source of sources) {
  console.log(`  - ${source.frontmatter.title}`);
  console.log(`    URL: ${source.frontmatter.url}`);
}
```

### Find Research Decisions

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const adrs = await queryEngine.findResearchDecisions('session-20240115');

console.log('ADRs from session-20240115:');
for (const adr of adrs) {
  console.log(`  - ${adr.frontmatter.title}`);
}
```

### Using Individual Use Case Classes

```typescript
import { SearchUseCase } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const search = new SearchUseCase(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);

const results = await search.execute('routing', {
  maxResults: 10,
  includeRelatedPages: false
});

console.log('Routing-related pages:');
for (const result of results) {
  console.log(`  - ${result.page.frontmatter.title}`);
  console.log(`    Relevance score: ${result.relevance.toFixed(2)}`);
}
```

### Complex Query Workflow

```typescript
import { createQueryEngine } from '@wiki/application-query';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const queryEngine = createQueryEngine(
  new FileSystemAdapter(),
  new FrontmatterAdapter(),
  new MarkdownAdapter()
);

const angularResults = await queryEngine.search('Angular', {
  maxResults: 10,
  includeRelatedPages: true
});

console.log('Top Angular pages:');
for (const result of angularResults) {
  console.log(`\n${result.page.frontmatter.title}`);
  console.log(`  Type: ${result.page.frontmatter.type}`);
  console.log(`  Tags: ${result.page.frontmatter.tags.join(', ')}`);
  console.log(`  Relevance: ${result.relevance.toFixed(2)}`);
  
  if (result.matchedContent.length > 0) {
    console.log(`  Matched: ${result.matchedContent[0]}`);
  }
  
  if (result.relatedPages.length > 0) {
    const relatedTitles = result.relatedPages
      .slice(0, 3)
      .map(p => p.frontmatter.title);
    console.log(`  Related: ${relatedTitles.join(', ')}`);
  }
}

const entities = await queryEngine.findEntities();
const concepts = await queryEngine.findConcepts();
const sources = await queryEngine.findSources();

console.log(`\nWiki Statistics:`);
console.log(`  Entities: ${entities.length}`);
console.log(`  Concepts: ${concepts.length}`);
console.log(`  Sources: ${sources.length}`);
console.log(`  Total: ${entities.length + concepts.length + sources.length}`);
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPage type
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces

## Related Libraries

This library is used by:
- `@wiki/application-cross-reference` - Finding pages for cross-reference detection
- `@wiki/application-maintenance` - Querying pages for maintenance checks
- `@wiki/application-workflow` - Search integration in workflows
- `@wiki/core` - Public API facade for search and query operations
