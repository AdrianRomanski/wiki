# Query and Search Functionality

This module provides comprehensive query and search capabilities for the LLM Wiki Second Brain system.

## Features

### 1. Full-Text Search (Requirement 8.1, 8.4)

Search across all wiki page content including titles, tags, and body text. Results are automatically ranked by relevance.

```typescript
import { createQueryEngine } from './query.js';

const engine = createQueryEngine();

// Basic search
const results = await engine.search('accessibility');

// Advanced search with options
const results = await engine.search('Angular accessibility', {
  maxResults: 10,
  includeRelatedPages: true,
  caseSensitive: false,
  snippetLength: 150,
});

// Process results
for (const result of results) {
  console.log(result.page.frontmatter.title);
  console.log(`Relevance: ${result.relevance}`);
  console.log(`Snippet: ${result.matchedContent[0]}`);
  console.log(`Related: ${result.relatedPages.map(p => p.frontmatter.title)}`);
}
```

**Relevance Scoring:**
- Title matches: 10 points per term
- Tag matches: 5 points per term
- Content matches: 1 point per term

### 2. Tag-Based Search (Requirement 8.2, 8.3, 13.5)

Search for pages by tags. Supports both frontmatter tags and inline `#tag` syntax.

```typescript
// Search by frontmatter tag
const pages = await engine.searchByTag('accessibility');

// Search by inline #tag (with or without # prefix)
const pages = await engine.searchByTag('#accessibility');
const pages = await engine.searchByTag('accessibility'); // Same result
```

### 3. Name-Based Search (Requirement 8.2, 8.3)

Find entities, concepts, or sources by name pattern.

```typescript
// Find all entities
const allEntities = await engine.findEntities();

// Find entities matching pattern
const angularEntities = await engine.findEntities('Angular');

// Find all concepts
const allConcepts = await engine.findConcepts();

// Find concepts matching pattern
const accessibilityConcepts = await engine.findConcepts('accessibility');
```

### 4. Source Filtering

Filter source summaries by author, date, or URL pattern.

```typescript
// Find all sources
const allSources = await engine.findSources();

// Filter by author
const w3cSources = await engine.findSources({ author: 'W3C' });

// Filter by date
const recentSources = await engine.findSources({ date: '2024-01-15' });

// Filter by URL pattern
const w3Sources = await engine.findSources({ urlPattern: 'w3.org' });

// Combine filters
const sources = await engine.findSources({
  author: 'W3C',
  date: '2024-01-15',
  urlPattern: 'w3.org',
});
```

### 5. Cross-Reference Context (Requirement 8.5)

Search results automatically include related pages for context, showing both outgoing links and backlinks.

```typescript
const results = await engine.search('Angular CDK', {
  includeRelatedPages: true,
});

// Access related pages
for (const result of results) {
  console.log(`Found: ${result.page.frontmatter.title}`);
  
  for (const related of result.relatedPages) {
    console.log(`  Related: ${related.frontmatter.title}`);
  }
}
```

### 6. Backlink Discovery

Find all pages that link to a specific page.

```typescript
const backlinks = await engine.findBacklinks('entities/angular-cdk.md');

for (const page of backlinks) {
  console.log(`${page.frontmatter.title} links to Angular CDK`);
}
```

## API Reference

### QueryEngine

Main class for querying wiki content.

#### Constructor

```typescript
new QueryEngine(config?: FileSystemConfig)
```

#### Methods

##### search(query: string, options?: SearchOptions): Promise<SearchResult[]>

Performs full-text search across all wiki content.

**Parameters:**
- `query` - Search query string
- `options` - Optional search configuration
  - `maxResults` - Maximum number of results (default: 20)
  - `includeRelatedPages` - Include related pages in results (default: true)
  - `caseSensitive` - Case-sensitive search (default: false)
  - `snippetLength` - Maximum snippet length (default: 150)

**Returns:** Array of search results sorted by relevance

##### searchByTag(tag: string): Promise<WikiPage[]>

Searches for pages by tag (frontmatter or inline #tag).

**Parameters:**
- `tag` - Tag to search for (with or without # prefix)

**Returns:** Array of matching wiki pages

##### findEntities(namePattern?: string): Promise<WikiPage[]>

Finds entity pages, optionally filtered by name pattern.

**Parameters:**
- `namePattern` - Optional regex pattern to match entity names

**Returns:** Array of entity pages

##### findConcepts(namePattern?: string): Promise<WikiPage[]>

Finds concept pages, optionally filtered by name pattern.

**Parameters:**
- `namePattern` - Optional regex pattern to match concept names

**Returns:** Array of concept pages

##### findSources(filters?: SourceFilters): Promise<WikiPage[]>

Finds source summary pages with optional filters.

**Parameters:**
- `filters` - Optional filters
  - `author` - Filter by author name
  - `date` - Filter by date (YYYY-MM-DD)
  - `urlPattern` - Filter by URL pattern

**Returns:** Array of source summary pages

##### findBacklinks(pagePath: string): Promise<WikiPage[]>

Finds all pages that link to the specified page.

**Parameters:**
- `pagePath` - Path to the page (relative to wiki/)

**Returns:** Array of pages that link to the specified page

### Types

#### SearchResult

```typescript
interface SearchResult {
  page: WikiPage;              // The matching wiki page
  relevance: number;           // Relevance score (0-1)
  matchedContent: string[];    // Content snippets
  relatedPages: WikiPage[];    // Related pages for context
}
```

#### SearchOptions

```typescript
interface SearchOptions {
  maxResults?: number;         // Max results to return
  includeRelatedPages?: boolean; // Include related pages
  caseSensitive?: boolean;     // Case-sensitive search
  snippetLength?: number;      // Max snippet length
}
```

#### SourceFilters

```typescript
interface SourceFilters {
  author?: string;             // Filter by author
  date?: string;               // Filter by date (YYYY-MM-DD)
  urlPattern?: string;         // Filter by URL pattern
}
```

## Examples

See the example scripts for complete demonstrations:

- `query-example.ts` - Basic usage examples for all query methods
- `query-integration-example.ts` - Complete workflow demonstration

Run examples:

```bash
npx tsx scripts/wiki/query-example.ts
npx tsx scripts/wiki/query-integration-example.ts
```

## Testing

Comprehensive unit tests are provided in `query.test.ts`:

```bash
npx vitest run scripts/wiki/query.test.ts
```

Test coverage includes:
- Full-text search with relevance ranking
- Tag-based search (frontmatter and inline)
- Name-based search for entities and concepts
- Source filtering
- Backlink discovery
- Cross-reference context
- Edge cases and error handling

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 8.1**: Full-text search across all wiki page content
- **Requirement 8.2**: Searching by tags and entity/concept names
- **Requirement 8.3**: Name-based search support
- **Requirement 8.4**: Relevance ranking for search results
- **Requirement 8.5**: Cross-reference links in query results for context
- **Requirement 13.5**: Support for Obsidian #tag syntax in addition to frontmatter tags

## Architecture

The query engine:

1. **Loads all wiki pages** from the wiki/ directory (excluding index.md and activity-log.md)
2. **Parses frontmatter** to extract metadata
3. **Scores pages** based on query term matches in title, tags, and content
4. **Ranks results** by relevance score
5. **Extracts snippets** around matched terms
6. **Finds related pages** through cross-references (outgoing links and backlinks)
7. **Returns structured results** with all context

## Performance Considerations

- Pages are loaded on-demand for each query (no persistent index yet)
- For large wikis (>1000 pages), consider implementing:
  - Persistent search index
  - Incremental indexing
  - Result caching
  - Pagination

## Future Enhancements

Potential improvements for future iterations:

- **Semantic search** using embeddings
- **Faceted search** with multiple filters
- **Search history** and suggestions
- **Persistent index** for faster queries
- **Fuzzy matching** for typo tolerance
- **Boolean operators** (AND, OR, NOT)
- **Phrase search** with quotes
- **Date range filtering**
- **Search analytics** and metrics
