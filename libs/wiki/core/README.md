# @wiki/core

Main public API facade for the wiki system, providing a unified interface to all wiki functionality.

## Overview

**Library Name:** `@wiki/core`  
**Scope:** `@wiki`  
**Architectural Layer:** Presentation  
**Tags:** `presentation`

This library serves as the primary entry point for external consumers, re-exporting application services, domain entities, and providing factory functions for creating configured wiki system instances. It encapsulates the complexity of the multi-library architecture behind a clean, cohesive API.

## Purpose and Responsibilities

The `@wiki/core` library is responsible for:

- **Public API Facade**: Re-exports all application services, domain entities, and port interfaces
- **Factory Functions**: Provides `createWikiSystem()` for instantiating configured service instances
- **Type Exports**: Exposes TypeScript interfaces for all domain models and configuration
- **Simplified Integration**: Enables consumers to work with the wiki system without understanding internal library structure
- **Versioned Interface**: Maintains stable public API contract across internal refactoring

This library follows the facade pattern, providing a simplified interface to a complex subsystem while maintaining clean architectural boundaries.

## Public API

### Factory Functions

**createWikiSystem**
```typescript
function createWikiSystem(
  fileSystemAdapter: FileSystemPort,
  markdownAdapter: MarkdownPort,
  frontmatterAdapter: FrontmatterPort
): WikiSystem;
```

Creates a configured wiki system instance with all necessary services wired together.

### Core Types

**WikiSystem**
```typescript
interface WikiSystem {
  generators: {
    entity: GenerateEntityPageUseCase;
    concept: GenerateConceptPageUseCase;
    source: GenerateSourceSummaryUseCase;
  };
  query: QueryEngine;
  crossReference: {
    detect: DetectCrossReferencesUseCase;
    validate: ValidateWikiLinksUseCase;
  };
}
```

### Domain Entities

**From @wiki/domain-models:**
- `WikiPage` - Complete wiki page entity with frontmatter, content, and cross-references
- `WikiPageFrontmatter` - YAML frontmatter metadata
- `Section` - Hierarchical section structure
- `RawSource` - Immutable source document entity
- `ActivityLogEntry` - Chronological operation record
- `MaintenanceReport` - Wiki health check findings

**From @wiki/domain-naming:**
- `ValidationResult` - Validation result value object
- `NamingConventionError` - Domain exception for naming violations
- `isKebabCase(str: string): boolean` - Validates kebab-case format
- `toKebabCase(str: string): string` - Converts to kebab-case
- `validateEntityName(filename: string): ValidationResult` - Entity page name validation
- `validateConceptName(filename: string): ValidationResult` - Concept page name validation
- `validateSourceName(filename: string): ValidationResult` - Source summary name validation
- `validateWikiPageName(filename: string, pageType: PageType): ValidationResult` - Type-specific validation
- `generateFilename(title: string, pageType: PageType, date?: Date): string` - Generates valid filenames

**From @wiki/domain-validation:**
- `validateFrontmatter(frontmatter: Partial<WikiPageFrontmatter>): ValidationResult` - Frontmatter validation
- `validatePageStructure(page: WikiPage): ValidationResult` - Page structure validation
- `validateCrossReferences(page: WikiPage, existingPages: string[]): ValidationResult` - Cross-reference validation

### Application Services

**Page Generation (from @wiki/application-generators):**
- `GenerateEntityPageUseCase` - Generate entity pages
- `GenerateConceptPageUseCase` - Generate concept pages
- `GenerateSourceSummaryUseCase` - Generate source summary pages
- `EntityPageOptions` - Entity page configuration
- `ConceptPageOptions` - Concept page configuration
- `SourceSummaryOptions` - Source summary configuration
- `GeneratedPage` - Generation result

**Cross-Reference Management (from @wiki/application-cross-reference):**
- `DetectCrossReferencesUseCase` - Detect potential cross-references
- `InsertCrossReferenceLinksUseCase` - Insert WikiLink syntax
- `ValidateWikiLinksUseCase` - Validate link targets
- `FindBacklinksUseCase` - Find pages linking to target
- `SuggestBidirectionalLinksUseCase` - Suggest missing backlinks
- `CrossReference` - Cross-reference value object
- `LinkValidationResult` - Link validation result

**Query and Search (from @wiki/application-query):**
- `QueryEngine` - Main search and retrieval service
- `SearchUseCase` - Full-text search
- `SearchByTagUseCase` - Tag-based search
- `FindEntitiesUseCase` - Entity page retrieval
- `FindConceptsUseCase` - Concept page retrieval
- `FindSourcesUseCase` - Source summary retrieval
- `FindResearchDecisionsUseCase` - ADR-specific search
- `SearchResult` - Search result value object
- `SearchOptions` - Search configuration
- `SourceFilters` - Source query filters

**Activity Logging (from @wiki/application-activity-log):**
- `LogActivityUseCase` - Record wiki operations
- `QueryActivityLogUseCase` - Retrieve activity history

**Maintenance (from @wiki/application-maintenance):**
- `DetectDuplicatesUseCase` - Find duplicate content
- `DetectContradictionsUseCase` - Find contradictory information
- `DetectBrokenLinksUseCase` - Find broken WikiLinks
- `DetectOrphansUseCase` - Find orphaned pages
- `GenerateMaintenanceReportUseCase` - Comprehensive health checks

**Workflows (from @wiki/application-workflow):**
- `IngestSourceWorkflow` - Orchestrate source ingestion
- `UpdatePageWorkflow` - Orchestrate page updates
- `GenerateIndexWorkflow` - Orchestrate index generation
- `MaintenanceWorkflow` - Orchestrate maintenance tasks
- `validateWorkflowOptions` - Validate workflow configuration
- `WorkflowError` - Workflow error exception
- `IngestionError` - Ingestion error exception
- `IngestionWorkflowOptions` - Ingestion configuration
- `IngestionWorkflowResult` - Ingestion result
- `GenerateWikiPagesOptions` - Page generation configuration
- `GenerateWikiPagesResult` - Page generation result
- `UpdatePageOptions` - Update configuration
- `UpdatePageResult` - Update result
- `GenerateIndexOptions` - Index generation configuration
- `GenerateIndexResult` - Index generation result
- `MaintenanceOptions` - Maintenance configuration
- `MaintenanceResult` - Maintenance result

**ADR Management (from @wiki/application-adr):**
- `GenerateADRPageUseCase` - Generate ADR pages
- `LinkADRToSessionUseCase` - Link ADRs to research sessions
- `ValidateADRReferencesUseCase` - Validate ADR cross-references
- `ExtractADRMetadataUseCase` - Extract ADR metadata
- `ADRMetadata` - ADR metadata structure
- `ADRSourceSummaryOptions` - ADR source summary configuration
- `ADREntityPageOptions` - ADR entity page configuration
- `SessionReference` - Session reference structure
- `ComparisonMatrix` - Comparison matrix structure

### Port Interfaces

**From @wiki/application-ports:**
- `FileSystemPort` - File system operations interface
- `MarkdownPort` - Markdown parsing interface
- `FrontmatterPort` - Frontmatter processing interface

## Usage Examples

### Creating a Wiki System Instance

```typescript
import { createWikiSystem } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const wiki = createWikiSystem(fileSystemPort, markdownPort, frontmatterPort);

console.log('Wiki system initialized');
```

### Generating Entity Pages

```typescript
import { createWikiSystem, EntityPageOptions } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const wiki = createWikiSystem(fileSystemPort, markdownPort, frontmatterPort);

const options: EntityPageOptions = {
  name: 'Angular CDK',
  definition: 'The Angular Component Dev Kit provides accessible UI primitives.',
  properties: [
    'Accessibility support',
    'Component foundation',
    'Layout utilities'
  ],
  tags: ['angular', 'ui', 'accessibility']
};

const result = wiki.generators.entity.execute(options);

console.log('Generated entity page:');
console.log(`  Filename: ${result.filename}`);
console.log(`  Title: ${result.frontmatter.title}`);
console.log(`  Type: ${result.frontmatter.type}`);

await fileSystemPort.writeWikiFile(`entities/${result.filename}`, result.content);
```

### Searching Wiki Content

```typescript
import { createWikiSystem, SearchOptions } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const wiki = createWikiSystem(fileSystemPort, markdownPort, frontmatterPort);

const searchOptions: SearchOptions = {
  query: 'accessibility',
  tags: ['angular'],
  limit: 10
};

const results = await wiki.query.search(searchOptions);

console.log(`Found ${results.length} pages:`);
for (const result of results) {
  console.log(`  - ${result.page.frontmatter.title} (score: ${result.relevance})`);
  console.log(`    ${result.context}`);
}
```

### Detecting and Validating Cross-References

```typescript
import { createWikiSystem } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const wiki = createWikiSystem(fileSystemPort, markdownPort, frontmatterPort);

const pageContent = `
# Angular CDK

The Angular Component Dev Kit provides primitives for building accessible components.

It includes utilities for managing focus, keyboard interactions, and ARIA attributes.
The CDK is used by Angular Material to implement component foundations.
`;

const references = wiki.crossReference.detect.execute(pageContent);

console.log(`Detected ${references.length} potential cross-references:`);
for (const ref of references) {
  console.log(`  - "${ref.matchedText}" → ${ref.targetTitle}`);
  console.log(`    Exists: ${ref.exists}`);
}

const validationResult = await wiki.crossReference.validate.execute('entities/angular-cdk.md');

if (!validationResult.valid) {
  console.error('Validation errors:');
  for (const error of validationResult.errors) {
    console.error(`  - ${error}`);
  }
}
```

### Using Workflow Orchestration

```typescript
import { IngestSourceWorkflow, IngestionWorkflowOptions } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import {
  GenerateEntityPageUseCase,
  GenerateConceptPageUseCase,
  GenerateSourceSummaryUseCase
} from '@wiki/core';
import {
  DetectCrossReferencesUseCase,
  InsertCrossReferenceLinksUseCase
} from '@wiki/core';
import { LogActivityUseCase } from '@wiki/core';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateEntity = new GenerateEntityPageUseCase(markdownPort, frontmatterPort);
const generateConcept = new GenerateConceptPageUseCase(markdownPort, frontmatterPort);
const generateSource = new GenerateSourceSummaryUseCase(markdownPort, frontmatterPort);
const detectCrossReferences = new DetectCrossReferencesUseCase(markdownPort);
const insertCrossReferences = new InsertCrossReferenceLinksUseCase(markdownPort);
const logActivity = new LogActivityUseCase(fileSystemPort, markdownPort);

const workflow = new IngestSourceWorkflow(
  fileSystemPort,
  frontmatterPort,
  markdownPort,
  generateEntity,
  generateConcept,
  generateSource,
  detectCrossReferences,
  insertCrossReferences,
  logActivity
);

const options: IngestionWorkflowOptions = {
  sourcePath: 'raw/angular-docs/accessibility.md',
  entityOptions: {
    name: 'ARIA',
    definition: 'Accessible Rich Internet Applications specification',
    tags: ['accessibility', 'web-standards']
  },
  addCrossReferences: true
};

const result = await workflow.execute(options);

console.log(`Ingested ${result.pages.length} pages from ${result.source.filename}`);
for (const path of result.writtenPaths) {
  console.log(`  - ${path}`);
}
```

### Validating Page Names

```typescript
import { validateEntityName, validateWikiPageName, generateFilename } from '@wiki/core';

const entityValidation = validateEntityName('angular-cdk.md');
if (entityValidation.valid) {
  console.log('Valid entity name');
} else {
  console.error(`Invalid entity name: ${entityValidation.error}`);
  if (entityValidation.suggestions) {
    console.log('Suggestions:', entityValidation.suggestions);
  }
}

const invalidValidation = validateEntityName('Angular CDK.md');
if (!invalidValidation.valid) {
  console.error(`Invalid: ${invalidValidation.error}`);
}

const filename = generateFilename('Angular CDK', 'entity');
console.log(`Generated filename: ${filename}`);

const sourceValidation = validateWikiPageName('angular-guide-2024-05-10.md', 'source');
console.log(`Source name valid: ${sourceValidation.valid}`);
```

### Complete Example: Creating and Searching Pages

```typescript
import { createWikiSystem, EntityPageOptions, SearchOptions } from '@wiki/core';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const wiki = createWikiSystem(fileSystemPort, markdownPort, frontmatterPort);

const entityOptions: EntityPageOptions = {
  name: 'Component Harness',
  definition: 'Test utility for interacting with Angular components',
  properties: [
    'Environment-agnostic',
    'Type-safe API',
    'Supports nested components'
  ],
  relationships: [
    {
      target: 'Angular CDK',
      description: 'Part of'
    }
  ],
  tags: ['angular', 'testing', 'cdk']
};

const generated = wiki.generators.entity.execute(entityOptions);
await fileSystemPort.writeWikiFile(`entities/${generated.filename}`, generated.content);

console.log(`Created: ${generated.filename}`);

const searchOptions: SearchOptions = {
  query: 'testing',
  tags: ['angular'],
  limit: 5
};

const results = await wiki.query.search(searchOptions);

console.log('\nSearch results:');
for (const result of results) {
  console.log(`  ${result.page.frontmatter.title}`);
  console.log(`    Tags: ${result.page.frontmatter.tags.join(', ')}`);
  console.log(`    Relevance: ${result.relevance.toFixed(2)}`);
}
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - Core domain entities
- `@wiki/domain-naming` - Naming validation and generation
- `@wiki/domain-validation` - Domain validation rules
- `@wiki/application-generators` - Page generation use cases
- `@wiki/application-cross-reference` - Cross-reference management
- `@wiki/application-query` - Search and query services
- `@wiki/application-activity-log` - Activity logging
- `@wiki/application-maintenance` - Maintenance and health checks
- `@wiki/application-workflow` - Workflow orchestration
- `@wiki/application-adr` - ADR-specific functionality
- `@wiki/application-ports` - Port interface definitions

## Related Libraries

This library serves as the public API facade for all wiki libraries. External consumers should depend only on `@wiki/core` rather than individual libraries.

For infrastructure implementations (adapters), see:
- `@wiki/infrastructure-filesystem` - File system operations
- `@wiki/infrastructure-markdown` - Markdown processing
- `@wiki/infrastructure-frontmatter` - Frontmatter handling
