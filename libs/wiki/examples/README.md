# Wiki System Examples

This directory contains comprehensive examples demonstrating how to use the wiki system libraries. Each example showcases specific features and patterns for building AI-generated knowledge bases with structured content.

## Prerequisites

### Required Software
- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher (included with Node.js)

### Project Dependencies
All dependencies are managed at the workspace root. To install:

```bash
npm install
```

### Build Wiki Libraries
The examples use the built wiki libraries. To ensure they're available:

```bash
# Build the core library and its dependencies
npx nx build core
```

### Wiki Directory Structure
Examples expect the following directory structure to exist:

```
project-root/
├── raw/          # Raw source documents
├── wiki/         # Generated wiki pages
│   ├── entities/ # Entity pages
│   ├── concepts/ # Concept pages
│   └── sources/  # Source summaries
└── libs/         # Library code
```

If the `wiki/` directory doesn't exist, create it before running examples:

```bash
mkdir -p wiki/entities wiki/concepts wiki/sources
```

## Running Examples

### Via NPM Scripts (Recommended)

The npm scripts provide a convenient way to run example tests:

#### 1. Page Generation Examples
Run entity, concept, and source page generation examples (including setup):
```bash
npm run examples:generate
```

#### 2. Query and Search Examples
Run full-text search, tag-based queries, and filtering examples:
```bash
npm run examples:query
```

#### 3. Maintenance Examples
Run duplicate detection, broken link checking, and health report examples:
```bash
npm run examples:maintenance
```

#### 4. Run All Examples
Execute the complete test suite with all examples:
```bash
npm run examples:all
```

**Note**: The `examples:setup` script displays a message about running the test suite, as setup examples are integrated into the page generation tests.

### Via Nx Test Runner

You can also run examples directly using the Nx test runner with more control:

#### Run All Examples
```bash
npx nx test examples
```

#### Run Specific Example Suite
```bash
npx nx test examples --testNamePattern="Generate Entity Page"
```

#### Run Examples with Coverage
```bash
npx nx test examples --coverage
```

#### Run Examples in Watch Mode
```bash
npx nx test examples --watch
```

## Example Categories

### 1. Setup and Configuration

**File**: `basic-setup.example.ts`

**Purpose**: Demonstrates how to initialize the wiki system with required adapters and configuration.

**Key Concepts**:
- Creating `FileSystemAdapter` with path configuration
- Instantiating `MarkdownAdapter` for content processing
- Instantiating `FrontmatterAdapter` for metadata handling
- Using factory functions to create the `WikiSystem` instance

**When to Use**: Start here to understand the foundation of the wiki system before exploring other examples.

**Example Usage**:
```typescript
import { basicSetupExample } from './basic-setup.example';

const wikiSystem = basicSetupExample();
// Now you can use wikiSystem.generators, wikiSystem.query, etc.
```

---

### 2. Page Generation

#### Entity Pages
**File**: `generate-entity-page.example.ts`

**Purpose**: Generate structured pages for concrete things (libraries, tools, frameworks).

**Key Concepts**:
- Using `GenerateEntityPageUseCase` to create entity pages
- Configuring `EntityPageOptions` with name, definition, properties, relationships
- Generating markdown with frontmatter
- Creating valid filenames following kebab-case conventions

**When to Use**: When documenting libraries, tools, frameworks, or any concrete technology.

**Example Functions**:
- `generateEntityPageExample()` - Full entity page with all sections
- `generateEntityPageWithMinimalOptions()` - Minimal required fields
- `generateEntityPageForFramework()` - Framework-specific example

---

#### Concept Pages
**File**: `generate-concept-page.example.ts`

**Purpose**: Generate pages for abstract ideas, patterns, and principles.

**Key Concepts**:
- Using `GenerateConceptPageUseCase` for concept documentation
- Structuring explanations, principles, and applications
- Linking related concepts through WikiLinks
- Organizing theoretical knowledge

**When to Use**: When documenting design patterns, architectural principles, or abstract concepts.

---

#### Source Summaries
**File**: `generate-source-summary.example.ts`

**Purpose**: Generate summary pages for external source materials (articles, documentation, videos).

**Key Concepts**:
- Using `GenerateSourceSummaryUseCase` to document sources
- Including author, date, and URL metadata
- Structuring summaries with key points and takeaways
- Linking sources to generated entity and concept pages

**When to Use**: When processing research materials, documentation, or learning resources.

---

### 3. Reading and Parsing

**File**: `read-and-parse-pages.example.ts`

**Purpose**: Read existing wiki pages and extract structured data.

**Key Concepts**:
- Reading wiki files with `FileSystemAdapter`
- Parsing frontmatter with `FrontmatterAdapter`
- Extracting sections with `MarkdownAdapter`
- Detecting WikiLinks in content
- Finding backlinks to pages

**When to Use**: When analyzing existing pages, building indexes, or discovering relationships.

**Example Functions**:
- `readSinglePageExample()` - Read and parse a single page
- `parseFrontmatterExample()` - Extract metadata from pages
- `parseMarkdownSectionsExample()` - Parse hierarchical sections
- `extractWikiLinksExample()` - Find all WikiLinks in a page
- `findBacklinksExample()` - Discover pages linking to a target
- `readPagesByTypeExample()` - Filter pages by type (entity, concept, source)

---

### 4. Query and Search

**File**: `query-and-search.example.spec.ts`

**Purpose**: Search and retrieve wiki pages using various criteria.

**Key Concepts**:
- Full-text search with relevance ranking
- Tag-based filtering
- Type-specific queries (entities, concepts, sources)
- Search options: maxResults, includeRelatedPages, caseSensitive
- Combining multiple search criteria

**When to Use**: When building search features, finding related content, or analyzing wiki structure.

**Use Cases**:
- `SearchUseCase` - Full-text search across all content
- `SearchByTagUseCase` - Find pages with specific tags
- `FindEntitiesUseCase` - Retrieve entity pages
- `FindConceptsUseCase` - Retrieve concept pages
- `FindSourcesUseCase` - Retrieve source summaries with filters

---

### 5. Cross-References

**File**: `cross-reference.example.ts`

**Purpose**: Detect and manage cross-references between wiki pages.

**Key Concepts**:
- Detecting potential cross-references in content
- Validating WikiLink targets
- Inserting WikiLink syntax
- Finding bidirectional relationships
- Suggesting missing links

**When to Use**: When building automatic linking features or analyzing wiki connectivity.

---

### 6. WikiLink and Markdown Formatting

**File**: `wikilink-and-markdown.example.ts`

**Purpose**: Generate and format markdown elements and WikiLinks.

**Key Concepts**:
- Creating WikiLinks with display text and sections
- Generating headings, lists, code blocks
- Formatting tables and blockquotes
- Converting sections to markdown
- Escaping special characters

**When to Use**: When programmatically generating markdown content or building page templates.

---

### 7. Updating Pages

**File**: `update-existing-pages.example.ts`

**Purpose**: Modify existing wiki pages while preserving structure.

**Key Concepts**:
- Reading existing page content
- Updating frontmatter timestamps
- Modifying sections without breaking structure
- Writing updated content back to files
- Validating changes

**When to Use**: When implementing page editing features or batch updates.

---

### 8. Maintenance

**File**: `maintenance.example.ts`

**Purpose**: Detect wiki health issues and opportunities for improvement.

**Key Concepts**:
- Detecting duplicate content
- Finding broken WikiLinks
- Identifying orphaned pages
- Suggesting consolidation opportunities
- Generating maintenance reports

**When to Use**: During periodic wiki maintenance or when assessing wiki quality.

---

## Learning Path

Recommended order for exploring examples:

1. **Start Here**: `basic-setup.example.ts`
   - Understand configuration and initialization
   - Learn the core components and their roles

2. **Page Creation**: `generate-entity-page.example.ts`, `generate-concept-page.example.ts`, `generate-source-summary.example.ts`
   - Master the three page types
   - Learn frontmatter structure and validation

3. **Reading Content**: `read-and-parse-pages.example.ts`
   - Parse existing pages
   - Extract structured data

4. **Formatting**: `wikilink-and-markdown.example.ts`
   - Generate markdown elements
   - Work with WikiLinks

5. **Search and Discovery**: `query-and-search.example.spec.ts`
   - Implement search features
   - Filter by various criteria

6. **Relationships**: `cross-reference.example.ts`
   - Build automatic linking
   - Analyze page connections

7. **Updates**: `update-existing-pages.example.ts`
   - Modify existing content
   - Preserve wiki structure

8. **Advanced**: `maintenance.example.ts`
   - Detect quality issues
   - Generate health reports

## Troubleshooting

### Issue: "Cannot find module '@wiki/...'"

**Cause**: Workspace libraries are not built or path mappings are incorrect.

**Solution**:
```bash
# Build all wiki libraries
npx nx run-many --target=build --projects=tag:wiki

# Or build specific library
npx nx build infrastructure-filesystem
```

### Issue: "ENOENT: no such file or directory, open 'wiki/...'"

**Cause**: Wiki directory structure doesn't exist.

**Solution**:
```bash
mkdir -p wiki/entities wiki/concepts wiki/sources raw
```

### Issue: Tests fail with "Cannot read property 'frontmatter' of undefined"

**Cause**: Example is trying to read a page that doesn't exist.

**Solution**: Examples that read existing pages use mocks in tests. If running examples outside tests, ensure sample wiki pages exist or modify examples to use your actual pages.

### Issue: "Cannot find tsconfig.json"

**Cause**: Running from wrong directory.

**Solution**: Run commands from the workspace root:
```bash
cd /path/to/wiki
npx nx test examples
```

### Issue: Vitest watch mode not responding

**Cause**: File watching conflicts with IDE or other processes.

**Solution**:
```bash
# Exit watch mode (Ctrl+C) and restart
npx nx test examples --watch --no-coverage
```

### Issue: Examples run slowly

**Cause**: Coverage collection adds overhead.

**Solution**: Run without coverage for faster feedback:
```bash
npx nx test examples --coverage=false
```

## Common Patterns

### Creating a WikiSystem Instance

```typescript
import { createAdapters, createWikiSystem } from '@wiki/core';
import type { FileSystemConfig } from '@wiki/infrastructure-filesystem';

const config: FileSystemConfig = {
  rootDir: process.cwd(),
  rawDir: 'raw',
  wikiDir: 'wiki',
};

const adapters = createAdapters(config);
const wikiSystem = createWikiSystem(
  adapters.fileSystem,
  adapters.markdown,
  adapters.frontmatter
);
```

### Generating a Page

```typescript
const result = wikiSystem.generators.entity.execute({
  name: 'TypeScript',
  definition: 'A strongly typed programming language.',
  tags: ['programming-language']
});

console.log(result.filename);   // typescript.md
console.log(result.content);    // Full markdown with frontmatter
```

### Searching Pages

```typescript
const results = await wikiSystem.query.search('accessibility', {
  maxResults: 5,
  includeRelatedPages: true
});

results.forEach(result => {
  console.log(result.page.frontmatter.title);
  console.log(result.relevance);
});
```

### Validating WikiLinks

```typescript
const validation = await wikiSystem.crossReference.validate.execute(
  'entities/angular-cdk.md'
);

if (validation.brokenLinks.length > 0) {
  console.log('Broken links found:', validation.brokenLinks);
}
```

## Additional Resources

- **Architecture Documentation**: See `libs/wiki/ARCHITECTURE.md` for system design
- **API Reference**: Each library's README contains detailed API documentation
- **Requirements**: See `.kiro/specs/wiki-architecture-refactor/requirements.md`
- **Design Document**: See `.kiro/specs/wiki-architecture-refactor/design.md`

## Contributing Examples

When adding new examples:

1. Create both `.example.ts` and `.example.spec.ts` files
2. Include inline comments explaining key concepts
3. Provide at least 2-3 variations demonstrating different use cases
4. Add test coverage for all example functions
5. Update this README with the new example's purpose and usage
6. Place the example in the appropriate learning path position
