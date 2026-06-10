# @wiki/application-generators

Page generation use cases for creating structured wiki pages from templates.

## Overview

**Library Name:** `@wiki/application-generators`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for generating structured wiki pages following wiki schema conventions. It orchestrates domain naming logic and infrastructure markdown/frontmatter operations to produce complete, well-formatted pages for entities, concepts, and source summaries.

## Purpose and Responsibilities

The `@wiki/application-generators` library is responsible for:

- **Page Generation**: Creates complete wiki pages with proper structure and frontmatter
- **Template Application**: Applies standardized templates for different page types
- **Content Structuring**: Organizes sections according to wiki conventions
- **Filename Generation**: Creates valid filenames following naming conventions
- **Cross-Reference Integration**: Includes WikiLinks to related pages
- **Metadata Management**: Generates appropriate frontmatter for each page type

This library encapsulates the business logic for transforming structured input data into properly formatted wiki pages ready to be written to the file system.

## Public API

### Use Case Classes

**GenerateEntityPageUseCase**
```typescript
class GenerateEntityPageUseCase {
  constructor(
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  execute(options: EntityPageOptions): GeneratedPage;
}
```

**GenerateConceptPageUseCase**
```typescript
class GenerateConceptPageUseCase {
  constructor(
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  execute(options: ConceptPageOptions): GeneratedPage;
}
```

**GenerateSourceSummaryUseCase**
```typescript
class GenerateSourceSummaryUseCase {
  constructor(
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  execute(options: SourceSummaryOptions): GeneratedPage;
}
```

### Options Interfaces

**EntityPageOptions**
```typescript
interface EntityPageOptions {
  name: string;
  definition: string;
  properties?: string[];
  relationships?: {
    target: string;
    description: string;
  }[];
  examples?: string[];
  tags?: string[];
  sources?: string[];
  created?: string;
}
```

**ConceptPageOptions**
```typescript
interface ConceptPageOptions {
  name: string;
  explanation: string;
  applications?: string[];
  relatedConcepts?: string[];
  examples?: string[];
  tags?: string[];
  sources?: string[];
  created?: string;
}
```

**SourceSummaryOptions**
```typescript
interface SourceSummaryOptions {
  title: string;
  author?: string;
  date?: string;
  url?: string;
  sourceType?: 'article' | 'paper' | 'code' | 'note';
  rawSourcePath?: string;
  keyPoints: string[];
  insights?: string;
  relevantEntities?: string[];
  relevantConcepts?: string[];
  quotes?: string[];
  tags?: string[];
  created?: string;
}
```

**GeneratedPage**
```typescript
interface GeneratedPage {
  content: string;
  filename: string;
  frontmatter: WikiPageFrontmatter;
}
```

## Usage Examples

### Generating an Entity Page

```typescript
import { GenerateEntityPageUseCase } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateEntity = new GenerateEntityPageUseCase(
  markdownPort,
  frontmatterPort
);

const result = generateEntity.execute({
  name: 'Angular CDK',
  definition: 'The Angular Component Dev Kit provides UI primitives for building accessible components.',
  properties: [
    'Accessibility utilities',
    'Layout helpers',
    'Overlay system',
    'Portal system'
  ],
  relationships: [
    {
      target: 'Angular Material',
      description: 'Built on top of'
    }
  ],
  examples: [
    'Using the CDK Overlay for custom dialogs',
    'Implementing drag and drop with CDK'
  ],
  tags: ['angular', 'ui', 'accessibility'],
  sources: ['angular-cdk-documentation']
});

console.log('Generated file:', result.filename);
console.log('Content:', result.content);
```

### Generating a Concept Page

```typescript
import { GenerateConceptPageUseCase } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateConcept = new GenerateConceptPageUseCase(
  markdownPort,
  frontmatterPort
);

const result = generateConcept.execute({
  name: 'Progressive Enhancement',
  explanation: 'A strategy for web design that emphasizes core functionality first, then progressively adds advanced features for capable browsers.',
  applications: [
    'Building accessible web applications',
    'Improving performance on low-end devices',
    'Ensuring functionality without JavaScript'
  ],
  relatedConcepts: [
    'Graceful Degradation',
    'Mobile-First Design',
    'Accessibility'
  ],
  examples: [
    'Form submissions that work without JavaScript',
    'CSS-only interactions with JavaScript enhancements'
  ],
  tags: ['web-development', 'accessibility', 'performance']
});

console.log('Generated file:', result.filename);
```

### Generating a Source Summary

```typescript
import { GenerateSourceSummaryUseCase } from '@wiki/application-generators';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateSource = new GenerateSourceSummaryUseCase(
  markdownPort,
  frontmatterPort
);

const result = generateSource.execute({
  title: 'Angular Accessibility Best Practices',
  author: 'Angular Team',
  date: '2024-01-15',
  url: 'https://angular.io/guide/accessibility',
  sourceType: 'article',
  rawSourcePath: 'raw/angular-accessibility.md',
  keyPoints: [
    'Use semantic HTML elements',
    'Provide ARIA labels where needed',
    'Ensure keyboard navigation works',
    'Test with screen readers'
  ],
  insights: 'The guide emphasizes that accessibility should be considered from the start of development, not as an afterthought.',
  relevantEntities: ['Angular CDK', 'Angular Material'],
  relevantConcepts: ['Accessibility', 'ARIA'],
  quotes: [
    'Accessibility is not optional - it is a requirement for modern web applications.'
  ],
  tags: ['angular', 'accessibility', 'web-development']
});

console.log('Generated file:', result.filename);
console.log('Frontmatter:', result.frontmatter);
```

### Integration with File System

```typescript
import { GenerateEntityPageUseCase } from '@wiki/application-generators';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystem = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const generateEntity = new GenerateEntityPageUseCase(
  markdownPort,
  frontmatterPort
);

const page = generateEntity.execute({
  name: 'Angular Router',
  definition: 'The Angular Router enables navigation between views.',
  tags: ['angular', 'routing']
});

await fileSystem.writeWikiFile(
  `entities/${page.filename}`,
  page.content
);

console.log(`Created: entities/${page.filename}`);
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPageFrontmatter type
- `@wiki/domain-naming` - generateFilename function
- `@wiki/application-ports` - MarkdownPort, FrontmatterPort interfaces

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - High-level page generation workflows
- `@wiki/application-adr` - ADR page generation
- `@wiki/core` - Public API facade for page generation
