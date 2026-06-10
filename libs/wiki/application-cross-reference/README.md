# @wiki/application-cross-reference

Cross-reference detection and linking use cases for managing WikiLink relationships.

## Overview

**Library Name:** `@wiki/application-cross-reference`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for detecting potential cross-references in wiki content, inserting WikiLink syntax, validating link targets, finding backlinks, and suggesting bidirectional link opportunities. It orchestrates cross-reference analysis to maintain a well-connected knowledge graph.

## Purpose and Responsibilities

The `@wiki/application-cross-reference` library is responsible for:

- **Cross-Reference Detection**: Identifies potential WikiLink opportunities in plain text
- **Link Insertion**: Converts plain text references to WikiLink syntax
- **Link Validation**: Verifies that WikiLink targets exist
- **Backlink Discovery**: Finds pages that link to a target page
- **Bidirectional Link Suggestions**: Recommends missing reciprocal links
- **Overlap Prevention**: Avoids creating overlapping or nested WikiLinks
- **Case-Insensitive Matching**: Detects references regardless of casing

This library enables automatic and semi-automatic linking between wiki pages, improving discoverability and knowledge connectivity.

## Public API

### Use Case Classes

**DetectCrossReferencesUseCase**
```typescript
class DetectCrossReferencesUseCase {
  constructor(markdownPort: MarkdownPort);
  
  execute(options: DetectCrossReferencesOptions): CrossReference[];
}
```

**InsertCrossReferenceLinksUseCase**
```typescript
class InsertCrossReferenceLinksUseCase {
  constructor(markdownPort: MarkdownPort);
  
  execute(content: string, references: CrossReference[]): string;
}
```

**ValidateWikiLinksUseCase**
```typescript
class ValidateWikiLinksUseCase {
  constructor(
    markdownPort: MarkdownPort,
    fileSystemPort: FileSystemPort
  );
  
  async execute(content: string): Promise<LinkValidationResult>;
}
```

**FindBacklinksUseCase**
```typescript
class FindBacklinksUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(targetTitle: string): Promise<WikiPage[]>;
}
```

**SuggestBidirectionalLinksUseCase**
```typescript
class SuggestBidirectionalLinksUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(pageTitle: string): Promise<BidirectionalLinkSuggestion[]>;
}
```

### Data Types

**CrossReference**
```typescript
interface CrossReference {
  matchedText: string;
  targetTitle: string;
  targetFilename?: string;
  exists: boolean;
  position: number;
}
```

**DetectCrossReferencesOptions**
```typescript
interface DetectCrossReferencesOptions {
  content: string;
  existingPages: string[];
  caseInsensitive?: boolean;
  minWordLength?: number;
}
```

**LinkValidationResult**
```typescript
interface LinkValidationResult {
  valid: boolean;
  brokenLinks: BrokenLink[];
  totalLinks: number;
}
```

**BrokenLink**
```typescript
interface BrokenLink {
  linkText: string;
  targetTitle: string;
  position: number;
  suggestions: string[];
}
```

**BidirectionalLinkSuggestion**
```typescript
interface BidirectionalLinkSuggestion {
  targetPage: WikiPage;
  shouldLinkBack: boolean;
  reason: string;
  relevanceScore: number;
}
```

## Usage Examples

### Detecting Cross-References

```typescript
import { DetectCrossReferencesUseCase } from '@wiki/application-cross-reference';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const markdownPort = new MarkdownAdapter();
const detectReferences = new DetectCrossReferencesUseCase(markdownPort);

const content = `
Angular CDK provides accessibility utilities.
The overlay system is built on top of Angular Material.
`;

const existingPages = [
  'Angular CDK',
  'Angular Material',
  'Accessibility'
];

const references = detectReferences.execute({
  content,
  existingPages,
  caseInsensitive: true,
  minWordLength: 3
});

console.log('Found references:', references);
```

### Inserting WikiLinks

```typescript
import { 
  DetectCrossReferencesUseCase,
  InsertCrossReferenceLinksUseCase 
} from '@wiki/application-cross-reference';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const markdownPort = new MarkdownAdapter();
const detectReferences = new DetectCrossReferencesUseCase(markdownPort);
const insertLinks = new InsertCrossReferenceLinksUseCase(markdownPort);

const content = 'Angular CDK provides accessibility utilities.';
const existingPages = ['Angular CDK', 'Accessibility'];

const references = detectReferences.execute({ content, existingPages });
const linkedContent = insertLinks.execute(content, references);

console.log('Original:', content);
console.log('Linked:', linkedContent);
```

### Validating WikiLinks

```typescript
import { ValidateWikiLinksUseCase } from '@wiki/application-cross-reference';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const markdownPort = new MarkdownAdapter();
const fileSystemPort = new FileSystemAdapter();

const validateLinks = new ValidateWikiLinksUseCase(
  markdownPort,
  fileSystemPort
);

const content = `
[[Angular CDK]] provides [[Accessibility]] utilities.
See also [[NonExistent Page]].
`;

const result = await validateLinks.execute(content);

console.log('Valid:', result.valid);
console.log('Total links:', result.totalLinks);
console.log('Broken links:', result.brokenLinks);

for (const broken of result.brokenLinks) {
  console.log(`  - ${broken.linkText} -> ${broken.targetTitle}`);
  console.log(`    Suggestions: ${broken.suggestions.join(', ')}`);
}
```

### Finding Backlinks

```typescript
import { FindBacklinksUseCase } from '@wiki/application-cross-reference';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const findBacklinks = new FindBacklinksUseCase(
  fileSystemPort,
  markdownPort,
  frontmatterPort
);

const backlinks = await findBacklinks.execute('Angular CDK');

console.log(`Pages that link to Angular CDK:`);
for (const page of backlinks) {
  console.log(`  - ${page.frontmatter.title}`);
}
```

### Suggesting Bidirectional Links

```typescript
import { SuggestBidirectionalLinksUseCase } from '@wiki/application-cross-reference';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const suggestLinks = new SuggestBidirectionalLinksUseCase(
  fileSystemPort,
  markdownPort,
  frontmatterPort
);

const suggestions = await suggestLinks.execute('Angular CDK');

console.log('Bidirectional link suggestions:');
for (const suggestion of suggestions) {
  if (suggestion.shouldLinkBack) {
    console.log(`  - ${suggestion.targetPage.frontmatter.title}`);
    console.log(`    Reason: ${suggestion.reason}`);
    console.log(`    Relevance: ${suggestion.relevanceScore}`);
  }
}
```

### Complete Cross-Reference Workflow

```typescript
import { 
  DetectCrossReferencesUseCase,
  InsertCrossReferenceLinksUseCase,
  ValidateWikiLinksUseCase
} from '@wiki/application-cross-reference';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();
const frontmatterPort = new FrontmatterAdapter();

const detectReferences = new DetectCrossReferencesUseCase(markdownPort);
const insertLinks = new InsertCrossReferenceLinksUseCase(markdownPort);
const validateLinks = new ValidateWikiLinksUseCase(markdownPort, fileSystemPort);

const pagePath = 'entities/angular-material.md';
let content = await fileSystemPort.readWikiFile(pagePath);

const allPages = await fileSystemPort.listWikiFiles('**/*.md');
const pageTitles = [];

for (const filePath of allPages) {
  const fileContent = await fileSystemPort.readWikiFile(filePath);
  const parsed = frontmatterPort.parseFrontmatter(fileContent);
  pageTitles.push(parsed.frontmatter.title);
}

const references = detectReferences.execute({
  content,
  existingPages: pageTitles
});

content = insertLinks.execute(content, references);

const validation = await validateLinks.execute(content);
if (validation.valid) {
  await fileSystemPort.writeWikiFile(pagePath, content);
  console.log(`Updated ${pagePath} with ${references.length} new links`);
} else {
  console.log(`Found ${validation.brokenLinks.length} broken links, not updating`);
}
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPage type
- `@wiki/application-ports` - MarkdownPort, FileSystemPort, FrontmatterPort interfaces

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - Automated cross-reference workflows
- `@wiki/application-maintenance` - Broken link detection
- `@wiki/core` - Public API facade for cross-reference operations
