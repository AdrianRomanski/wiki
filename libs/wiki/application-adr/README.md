# @wiki/application-adr

ADR-specific use cases for managing Architecture Decision Records in the wiki.

## Overview

**Library Name:** `@wiki/application-adr`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides specialized use case services for working with Architecture Decision Records (ADRs). It handles ADR page generation, session linking, reference validation, metadata extraction, and ADR-specific ingestion workflows, extending the base wiki functionality with ADR-aware operations.

## Purpose and Responsibilities

The `@wiki/application-adr` library is responsible for:

- **ADR Page Generation**: Creates ADR source summary pages with structured metadata
- **Session Linking**: Links ADRs to research sessions and prototypes
- **Reference Validation**: Validates ADR cross-references and session links
- **Metadata Extraction**: Extracts structured ADR metadata from documents
- **Comparison Matrices**: Formats and includes decision comparison matrices
- **ADR Ingestion Workflow**: Orchestrates complete ADR ingestion process
- **Entity Page Updates**: Updates library entity pages with ADR references

This library specializes wiki operations for the Architecture Decision Record use case, ensuring ADRs are properly integrated into the knowledge graph.

## Public API

### Use Case Classes

**GenerateADRPageUseCase**
```typescript
class GenerateADRPageUseCase {
  constructor(
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  execute(options: ADRSourceSummaryOptions): GeneratedPage;
}
```

**LinkADRToSessionUseCase**
```typescript
class LinkADRToSessionUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(adrPath: string, sessionRef: SessionReference): Promise<void>;
}
```

**ValidateADRReferencesUseCase**
```typescript
class ValidateADRReferencesUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(adrPath: string): Promise<LinkValidationResult>;
}
```

**ExtractADRMetadataUseCase**
```typescript
class ExtractADRMetadataUseCase {
  constructor(markdownPort: MarkdownPort);
  
  execute(adrContent: string): ADRMetadata;
}
```

### Workflow Functions

**runADRIngestionWorkflow**
```typescript
function runADRIngestionWorkflow(
  options: ADRIngestionWorkflowOptions
): Promise<ADRIngestionResult>;
```

### Data Types

**ADRMetadata**
```typescript
interface ADRMetadata {
  title: string;
  date: string;
  status: 'Accepted' | 'Rejected' | 'Superseded';
  sessionId: string;
  context: string;
  decisionDrivers: string[];
  consideredOptions: string[];
  chosenOption: string;
  rationale: string;
  positiveConsequences: string[];
  negativeConsequences: string[];
  comparisonMatrices?: {
    complexity?: ComparisonMatrix;
    modularity?: ComparisonMatrix;
    bundleSize?: ComparisonMatrix;
    tokenUsage?: ComparisonMatrix;
  };
  libraries: string[];
  researchLinks?: {
    comparisonReport?: string;
    finalReport?: string;
    prototypes?: string[];
  };
  deciders?: string[];
  tags?: string[];
  supersedes?: string;
  supersededBy?: string;
}
```

**ComparisonMatrix**
```typescript
interface ComparisonMatrix {
  title: string;
  headers: string[];
  rows: Map<string, string[]>;
  winner?: Map<string, string>;
}
```

**ADRSourceSummaryOptions**
```typescript
interface ADRSourceSummaryOptions {
  metadata: ADRMetadata;
  rawSourcePath: string;
  sessionPath: string;
  includeMatrices?: boolean;
}
```

**SessionReference**
```typescript
interface SessionReference {
  sessionId: string;
  sessionPath?: string;
  rawADRPath?: string;
  links?: {
    comparisonReport?: string;
    finalReport?: string;
    prototypes?: string[];
  };
}
```

**LinkValidationResult**
```typescript
interface LinkValidationResult {
  valid: boolean;
  errors: string[];
}
```

## Usage Examples

### Generating an ADR Page

```typescript
import { GenerateADRPageUseCase, ADRMetadata } from '@wiki/application-adr';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateADR = new GenerateADRPageUseCase(
  markdownPort,
  frontmatterPort
);

const metadata: ADRMetadata = {
  title: 'Use Nx for Monorepo Management',
  date: '2024-01-15',
  status: 'Accepted',
  sessionId: 'session-20240115',
  context: 'Need a monorepo tool for managing multiple Angular libraries',
  decisionDrivers: [
    'Build performance',
    'Developer experience',
    'Scalability'
  ],
  consideredOptions: ['Nx', 'Turborepo', 'Lerna'],
  chosenOption: 'Nx',
  rationale: 'Nx provides the best Angular integration and build caching',
  positiveConsequences: [
    'Faster builds with computation caching',
    'Integrated code generation',
    'Strong TypeScript support'
  ],
  negativeConsequences: [
    'Learning curve for team',
    'Additional configuration complexity'
  ],
  libraries: ['Nx', 'Turborepo', 'Lerna'],
  tags: ['architecture', 'monorepo', 'build-tools']
};

const result = generateADR.execute({
  metadata,
  rawSourcePath: 'raw/decisions/monorepo-tool-adr.md',
  sessionPath: 'research/session-20240115',
  includeMatrices: true
});

console.log('Generated ADR:');
console.log(`  File: ${result.filename}`);
console.log(`  Title: ${result.frontmatter.title}`);
```

### Linking ADR to Session

```typescript
import { LinkADRToSessionUseCase, SessionReference } from '@wiki/application-adr';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const linkToSession = new LinkADRToSessionUseCase(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);

const sessionRef: SessionReference = {
  sessionId: 'session-20240115',
  sessionPath: 'research/session-20240115',
  rawADRPath: 'raw/decisions/monorepo-tool-adr.md',
  links: {
    comparisonReport: 'research/session-20240115/comparison-report.md',
    finalReport: 'research/session-20240115/final-report.md',
    prototypes: [
      'prototypes/nx-demo',
      'prototypes/turborepo-demo'
    ]
  }
};

await linkToSession.execute(
  'sources/monorepo-tool-decision-2024-01-15.md',
  sessionRef
);

console.log('ADR linked to session');
```

### Validating ADR References

```typescript
import { ValidateADRReferencesUseCase } from '@wiki/application-adr';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const validateReferences = new ValidateADRReferencesUseCase(
  fileSystemPort,
  frontmatterPort
);

const result = await validateReferences.execute(
  'sources/monorepo-tool-decision-2024-01-15.md'
);

if (result.valid) {
  console.log('All ADR references are valid');
} else {
  console.log('ADR validation errors:');
  for (const error of result.errors) {
    console.log(`  - ${error}`);
  }
}
```

### Extracting ADR Metadata

```typescript
import { ExtractADRMetadataUseCase } from '@wiki/application-adr';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const markdownPort = new MarkdownAdapter();
const fileSystemPort = new FileSystemAdapter();

const extractMetadata = new ExtractADRMetadataUseCase(markdownPort);

const adrContent = await fileSystemPort.readRawFile(
  'decisions/monorepo-tool-adr.md'
);

const metadata = extractMetadata.execute(adrContent);

console.log('Extracted ADR metadata:');
console.log(`  Title: ${metadata.title}`);
console.log(`  Status: ${metadata.status}`);
console.log(`  Chosen Option: ${metadata.chosenOption}`);
console.log(`  Decision Drivers: ${metadata.decisionDrivers.join(', ')}`);
console.log(`  Libraries: ${metadata.libraries.join(', ')}`);
```

### Running ADR Ingestion Workflow

```typescript
import { runADRIngestionWorkflow } from '@wiki/application-adr';

const result = await runADRIngestionWorkflow({
  rawADRPath: 'raw/decisions/state-management-adr.md',
  sessionId: 'session-20240120',
  sessionPath: 'research/session-20240120',
  entityPageOptions: {
    libraryNames: ['NgRx', 'Akita', 'NGXS'],
    createIfNotExist: true
  },
  includeComparisonMatrices: true
});

console.log('ADR ingestion complete:');
console.log(`  ADR Page: ${result.adrPagePath}`);
console.log(`  Entity Pages Updated: ${result.entityPagesUpdated.length}`);
for (const entityPath of result.entityPagesUpdated) {
  console.log(`    - ${entityPath}`);
}
```

### Complete ADR Workflow with Validation

```typescript
import { 
  GenerateADRPageUseCase,
  LinkADRToSessionUseCase,
  ValidateADRReferencesUseCase,
  ExtractADRMetadataUseCase 
} from '@wiki/application-adr';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const extractMetadata = new ExtractADRMetadataUseCase(markdownPort);
const generateADR = new GenerateADRPageUseCase(markdownPort, frontmatterPort);
const linkToSession = new LinkADRToSessionUseCase(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);
const validateReferences = new ValidateADRReferencesUseCase(
  fileSystemPort,
  frontmatterPort
);

const rawADRPath = 'raw/decisions/api-design-adr.md';
const rawContent = await fileSystemPort.readRawFile(rawADRPath);

const metadata = extractMetadata.execute(rawContent);
console.log(`Extracted metadata for: ${metadata.title}`);

const page = generateADR.execute({
  metadata,
  rawSourcePath: rawADRPath,
  sessionPath: 'research/session-20240125',
  includeMatrices: true
});

const adrPath = `sources/${page.filename}`;
await fileSystemPort.writeWikiFile(adrPath, page.content);
console.log(`Generated ADR page: ${adrPath}`);

await linkToSession.execute(adrPath, {
  sessionId: metadata.sessionId,
  sessionPath: 'research/session-20240125',
  rawADRPath,
  links: {
    comparisonReport: 'research/session-20240125/comparison.md',
    finalReport: 'research/session-20240125/final.md'
  }
});
console.log('Linked to session');

const validation = await validateReferences.execute(adrPath);
if (validation.valid) {
  console.log('All references valid');
} else {
  console.warn('Validation errors:', validation.errors);
}
```

### Working with Comparison Matrices

```typescript
import { GenerateADRPageUseCase, ADRMetadata, ComparisonMatrix } from '@wiki/application-adr';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const complexityMatrix: ComparisonMatrix = {
  title: 'Complexity Comparison',
  headers: ['Nx', 'Turborepo', 'Lerna'],
  rows: new Map([
    ['Setup', ['Medium', 'Low', 'Low']],
    ['Configuration', ['High', 'Low', 'Medium']],
    ['Learning Curve', ['Steep', 'Gentle', 'Medium']]
  ]),
  winner: new Map([['Overall', 'Turborepo']])
};

const metadata: ADRMetadata = {
  title: 'Choose Build Tool',
  date: '2024-01-15',
  status: 'Accepted',
  sessionId: 'session-20240115',
  context: 'Need efficient build tooling',
  decisionDrivers: ['Speed', 'Simplicity'],
  consideredOptions: ['Nx', 'Turborepo', 'Lerna'],
  chosenOption: 'Nx',
  rationale: 'Best Angular integration despite complexity',
  positiveConsequences: ['Fast builds'],
  negativeConsequences: ['Setup complexity'],
  comparisonMatrices: {
    complexity: complexityMatrix
  },
  libraries: ['Nx', 'Turborepo', 'Lerna'],
  tags: ['build-tools']
};

const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateADR = new GenerateADRPageUseCase(markdownPort, frontmatterPort);

const page = generateADR.execute({
  metadata,
  rawSourcePath: 'raw/decisions/build-tool.md',
  sessionPath: 'research/session-20240115',
  includeMatrices: true
});

console.log('Generated ADR with comparison matrices');
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPageFrontmatter type
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces
- `@wiki/application-generators` - GenerateSourceSummaryUseCase

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - ADR ingestion workflows
- `@wiki/core` - Public API facade for ADR operations
