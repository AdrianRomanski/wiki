# @wiki/application-workflow

High-level workflow orchestration use cases for coordinating complex wiki operations.

## Overview

**Library Name:** `@wiki/application-workflow`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides high-level workflow orchestration services that coordinate multiple use cases to accomplish complex wiki operations. It handles source ingestion, page updates, index generation, and maintenance workflows by sequencing calls to domain services and application use cases.

## Purpose and Responsibilities

The `@wiki/application-workflow` library is responsible for:

- **Source Ingestion Workflow**: Orchestrates processing raw sources into wiki pages
- **Page Update Workflow**: Coordinates page updates with validation and logging
- **Index Generation Workflow**: Manages complete index regeneration
- **Maintenance Workflow**: Executes periodic maintenance checks and reporting
- **Error Handling**: Provides comprehensive error handling for multi-step operations
- **Transaction Coordination**: Ensures atomicity of multi-page operations
- **Cross-Reference Integration**: Automatically adds cross-references during workflows

This library encapsulates complex business workflows by coordinating application services, ensuring operations complete successfully or roll back cleanly.

## Public API

### Workflow Classes

**IngestSourceWorkflow**
```typescript
class IngestSourceWorkflow {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort,
    generateEntity: GenerateEntityPageUseCase,
    generateConcept: GenerateConceptPageUseCase,
    generateSource: GenerateSourceSummaryUseCase,
    detectCrossReferences: DetectCrossReferencesUseCase,
    insertCrossReferences: InsertCrossReferenceLinksUseCase,
    logActivity: LogActivityUseCase
  );
  
  async execute(options: IngestionWorkflowOptions): Promise<IngestionWorkflowResult>;
}
```

**UpdatePageWorkflow**
```typescript
class UpdatePageWorkflow {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    logActivity: LogActivityUseCase
  );
  
  async execute(options: UpdatePageOptions): Promise<UpdatePageResult>;
}
```

**GenerateIndexWorkflow**
```typescript
class GenerateIndexWorkflow {
  constructor(
    regenerateIndex: RegenerateIndexUseCase
  );
  
  async execute(options?: GenerateIndexOptions): Promise<GenerateIndexResult>;
}
```

**MaintenanceWorkflow**
```typescript
class MaintenanceWorkflow {
  constructor(
    generateReport: GenerateMaintenanceReportUseCase,
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort
  );
  
  async execute(options?: MaintenanceOptions): Promise<MaintenanceResult>;
}
```

### Options Interfaces

**IngestionWorkflowOptions**
```typescript
interface IngestionWorkflowOptions {
  sourcePath: string;
  entityOptions?: Omit<EntityPageOptions, 'sources' | 'created'>;
  conceptOptions?: Omit<ConceptPageOptions, 'sources' | 'created'>;
  sourceSummaryOptions?: Omit<SourceSummaryOptions, 'created'>;
  addCrossReferences?: boolean;
}
```

**UpdatePageOptions**
```typescript
interface UpdatePageOptions {
  pagePath: string;
  changes: string;
  reason: string;
}
```

**GenerateIndexOptions**
```typescript
interface GenerateIndexOptions {
  regenerate?: boolean;
}
```

**MaintenanceOptions**
```typescript
interface MaintenanceOptions {
  detectDuplicates?: boolean;
  detectContradictions?: boolean;
  detectBrokenLinks?: boolean;
  detectOrphans?: boolean;
}
```

### Result Interfaces

**IngestionWorkflowResult**
```typescript
interface IngestionWorkflowResult {
  source: RawSource;
  pages: WikiPage[];
  writtenPaths: string[];
}
```

**UpdatePageResult**
```typescript
interface UpdatePageResult {
  page: WikiPage;
  writtenPath: string;
}
```

**GenerateIndexResult**
```typescript
interface GenerateIndexResult {
  indexPath: string;
  entryCount: number;
}
```

**MaintenanceResult**
```typescript
interface MaintenanceResult {
  reportPath: string;
  timestamp: Date;
}
```

### Error Classes

**WorkflowError**
```typescript
class WorkflowError extends Error {
  constructor(message: string, cause?: Error);
}
```

**IngestionError**
```typescript
class IngestionError extends Error {
  constructor(message: string, sourcePath: string, cause?: Error);
}
```

### Validation Functions

**validateWorkflowOptions**
```typescript
function validateWorkflowOptions(
  options: IngestionWorkflowOptions
): ValidationResult;
```

## Usage Examples

### Source Ingestion Workflow

```typescript
import { IngestSourceWorkflow } from '@wiki/application-workflow';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { 
  GenerateEntityPageUseCase,
  GenerateConceptPageUseCase,
  GenerateSourceSummaryUseCase 
} from '@wiki/application-generators';
import { 
  DetectCrossReferencesUseCase,
  InsertCrossReferenceLinksUseCase 
} from '@wiki/application-cross-reference';
import { LogActivityUseCase } from '@wiki/application-activity-log';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const generateEntity = new GenerateEntityPageUseCase(markdownPort, frontmatterPort);
const generateConcept = new GenerateConceptPageUseCase(markdownPort, frontmatterPort);
const generateSource = new GenerateSourceSummaryUseCase(markdownPort, frontmatterPort);
const detectCrossReferences = new DetectCrossReferencesUseCase(markdownPort);
const insertCrossReferences = new InsertCrossReferenceLinksUseCase(markdownPort);
const logActivity = new LogActivityUseCase(fileSystemPort, markdownPort);

const ingestWorkflow = new IngestSourceWorkflow(
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

const result = await ingestWorkflow.execute({
  sourcePath: 'raw/angular-docs/accessibility-guide.md',
  entityOptions: {
    name: 'Angular CDK',
    definition: 'The Angular Component Dev Kit provides UI primitives.',
    tags: ['angular', 'ui']
  },
  conceptOptions: {
    name: 'Accessibility',
    explanation: 'Web content usability for people with disabilities.',
    tags: ['web-development', 'a11y']
  },
  sourceSummaryOptions: {
    title: 'Angular Accessibility Guide',
    author: 'Angular Team',
    keyPoints: [
      'Use semantic HTML',
      'Provide ARIA labels',
      'Test with screen readers'
    ],
    tags: ['angular', 'accessibility']
  },
  addCrossReferences: true
});

console.log('Ingestion complete:');
console.log(`  Source: ${result.source.path}`);
console.log(`  Generated ${result.pages.length} pages:`);
for (const path of result.writtenPaths) {
  console.log(`    - ${path}`);
}
```

### Page Update Workflow

```typescript
import { UpdatePageWorkflow } from '@wiki/application-workflow';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();
const logActivity = new LogActivityUseCase(fileSystemPort, markdownPort);

const updateWorkflow = new UpdatePageWorkflow(
  fileSystemPort,
  frontmatterPort,
  logActivity
);

const result = await updateWorkflow.execute({
  pagePath: 'entities/angular-cdk.md',
  changes: 'Added section on accessibility features and updated examples',
  reason: 'Expanded documentation based on Angular 17 updates'
});

console.log(`Updated: ${result.page.frontmatter.title}`);
console.log(`Written to: ${result.writtenPath}`);
console.log(`Updated timestamp: ${result.page.frontmatter.updated}`);
```

### Index Generation Workflow

```typescript
import { GenerateIndexWorkflow } from '@wiki/application-workflow';
import { RegenerateIndexUseCase, ScanWikiPagesUseCase, GenerateIndexContentUseCase } from '@wiki/application-index-manager';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const scanPages = new ScanWikiPagesUseCase(fileSystemPort, frontmatterPort);
const generateContent = new GenerateIndexContentUseCase(markdownPort);
const regenerateIndex = new RegenerateIndexUseCase(scanPages, generateContent, fileSystemPort);

const indexWorkflow = new GenerateIndexWorkflow(regenerateIndex);

const result = await indexWorkflow.execute({ regenerate: true });

console.log(`Index regenerated: ${result.indexPath}`);
console.log(`Total entries: ${result.entryCount}`);
```

### Maintenance Workflow

```typescript
import { MaintenanceWorkflow } from '@wiki/application-workflow';
import { GenerateMaintenanceReportUseCase } from '@wiki/application-maintenance';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const generateReport = new GenerateMaintenanceReportUseCase(
);

const maintenanceWorkflow = new MaintenanceWorkflow(
  generateReport,
  fileSystemPort,
  markdownPort
);

const result = await maintenanceWorkflow.execute({
  detectDuplicates: true,
  detectContradictions: true,
  detectBrokenLinks: true,
  detectOrphans: true
});

console.log(`Maintenance report saved: ${result.reportPath}`);
console.log(`Generated: ${result.timestamp.toISOString()}`);
```

### Validating Workflow Options

```typescript
import { validateWorkflowOptions, IngestionWorkflowOptions } from '@wiki/application-workflow';

const options: IngestionWorkflowOptions = {
  sourcePath: 'raw/docs/guide.md',
  entityOptions: {
    name: 'Angular Router',
    definition: 'Navigation library for Angular',
    tags: ['angular']
  }
};

const validation = validateWorkflowOptions(options);

if (!validation.valid) {
  console.error('Invalid workflow options:');
  for (const error of validation.errors) {
    console.error(`  - ${error}`);
  }
} else {
  console.log('Options valid, proceeding with workflow');
}
```

### Error Handling

```typescript
import { IngestSourceWorkflow, IngestionError, WorkflowError } from '@wiki/application-workflow';

try {
  const result = await ingestWorkflow.execute({
    sourcePath: 'raw/nonexistent.md',
    entityOptions: {
      name: 'Test',
      definition: 'Test definition',
      tags: []
    }
  });
} catch (error) {
  if (error instanceof IngestionError) {
    console.error(`Ingestion failed for: ${error.sourcePath}`);
    console.error(`Reason: ${error.message}`);
    if (error.cause) {
      console.error(`Caused by: ${error.cause.message}`);
    }
  } else if (error instanceof WorkflowError) {
    console.error(`Workflow error: ${error.message}`);
    if (error.cause) {
      console.error(`Caused by: ${error.cause.message}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Complete Multi-Page Workflow

```typescript
import { IngestSourceWorkflow } from '@wiki/application-workflow';

const result = await ingestWorkflow.execute({
  sourcePath: 'raw/angular-material-guide.md',
  entityOptions: {
    name: 'Angular Material',
    definition: 'Material Design component library for Angular',
    properties: [
      'Pre-built components',
      'Theming system',
      'Accessibility support'
    ],
    relationships: [
      {
        target: 'Angular CDK',
        description: 'Built on top of'
      }
    ],
    tags: ['angular', 'ui', 'material-design']
  },
  conceptOptions: {
    name: 'Material Design',
    explanation: 'Design language developed by Google',
    applications: [
      'Web applications',
      'Mobile applications',
      'Desktop applications'
    ],
    relatedConcepts: ['Design System', 'Component Library'],
    tags: ['design', 'ui']
  },
  sourceSummaryOptions: {
    title: 'Angular Material Complete Guide',
    author: 'Angular Team',
    url: 'https://material.angular.io',
    keyPoints: [
      'Comprehensive component library',
      'Built-in theming support',
      'Accessibility features',
      'Responsive design'
    ],
    insights: 'Angular Material simplifies building modern, accessible UIs',
    relevantEntities: ['Angular CDK'],
    relevantConcepts: ['Material Design'],
    tags: ['angular', 'material-design', 'ui']
  },
  addCrossReferences: true
});

console.log('\n=== Ingestion Complete ===');
console.log(`Source: ${result.source.filename}`);
console.log(`\nGenerated Pages:`);
for (let i = 0; i < result.pages.length; i++) {
  const page = result.pages[i];
  const path = result.writtenPaths[i];
  console.log(`  ${i + 1}. ${page.frontmatter.title}`);
  console.log(`     Type: ${page.frontmatter.type}`);
  console.log(`     Path: ${path}`);
  console.log(`     Links: ${page.outgoingLinks.length} outgoing`);
}
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - RawSource, WikiPage types
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces
- `@wiki/application-generators` - EntityPageOptions, ConceptPageOptions, SourceSummaryOptions types
- `@wiki/application-cross-reference` - Cross-reference use cases
- `@wiki/application-activity-log` - Activity logging use cases
- `@wiki/application-index-manager` - Index management use cases
- `@wiki/application-maintenance` - Maintenance use cases

## Related Libraries

This library is used by:
- `@wiki/core` - Public API facade for workflow operations
- `@wiki/application-adr` - ADR-specific workflows
