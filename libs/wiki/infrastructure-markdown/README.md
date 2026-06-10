# @wiki/infrastructure-markdown

Markdown parsing and generation adapter for wiki content.

## Overview

**Library Name:** `@wiki/infrastructure-markdown`  
**Scope:** `@wiki`  
**Architectural Layer:** Infrastructure  
**Tags:** `infrastructure`

This library provides a concrete implementation of the `MarkdownPort` interface, handling all markdown parsing, generation, and validation operations. It supports hierarchical section parsing, WikiLink extraction, and Obsidian-compatible markdown generation.

## Purpose and Responsibilities

The `@wiki/infrastructure-markdown` library is responsible for:

- **Port Implementation**: Implements the `MarkdownPort` interface defined in the Application Layer
- **Section Parsing**: Parses markdown content into hierarchical Section structures
- **WikiLink Processing**: Extracts and generates WikiLink references with support for sections and display text
- **Content Generation**: Generates markdown elements including headings, lists, code blocks, tables, and blockquotes
- **Syntax Validation**: Validates markdown syntax for Obsidian compatibility
- **Format Conversion**: Converts between Section structures and markdown text
- **Character Escaping**: Escapes special markdown characters for safe text insertion

This library isolates markdown processing logic, enabling alternative markdown parsers or custom syntax extensions without affecting application logic.

## Public API

### Classes

**MarkdownAdapter**
```typescript
class MarkdownAdapter implements MarkdownPort {
  parseMarkdownSections(content: string): Section[];
  extractWikiLinks(content: string): string[];
  generateWikiLink(target: string, displayText?: string, section?: string): string;
  generateHeading(text: string, level: number): string;
  generateList(items: string[], ordered?: boolean, indent?: number): string;
  generateCodeBlock(code: string, language?: string): string;
  generateBlockquote(text: string): string;
  generateTable(headers: string[], rows: string[][]): string;
  validateMarkdownSyntax(content: string): ValidationResult;
  escapeMarkdown(text: string): string;
  sectionsToMarkdown(sections: Section[]): string;
}
```

## Usage Examples

### Parsing Markdown Sections

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const markdown = `
# Overview

This is the overview section.

## Architecture

Details about architecture.

### Components

Information about components.
`;

const sections = adapter.parseMarkdownSections(markdown);

console.log(sections[0].heading);           // "Overview"
console.log(sections[0].level);             // 1
console.log(sections[0].subsections[0].heading); // "Architecture"
console.log(sections[0].subsections[0].level);   // 2
```

### Extracting WikiLinks

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const content = `
See [[Angular CDK]] for component utilities.
Related to [[Angular Material|Material Design]] and [[RxJS#Observables]].
`;

const links = adapter.extractWikiLinks(content);
console.log(links);
// ['Angular CDK', 'Angular Material', 'RxJS']
```

### Generating WikiLinks

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const simpleLink = adapter.generateWikiLink('Angular CDK');
console.log(simpleLink);
// [[Angular CDK]]

const linkWithDisplay = adapter.generateWikiLink(
  'Angular CDK',
  'Component Dev Kit'
);
console.log(linkWithDisplay);
// [[Angular CDK|Component Dev Kit]]

const linkWithSection = adapter.generateWikiLink(
  'Angular CDK',
  'CDK',
  'Installation'
);
console.log(linkWithSection);
// [[Angular CDK#Installation|CDK]]
```

### Generating Markdown Content

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const heading = adapter.generateHeading('Overview', 2);
console.log(heading);
// ## Overview

const list = adapter.generateList(['Item 1', 'Item 2', 'Item 3']);
console.log(list);
// - Item 1
// - Item 2
// - Item 3

const orderedList = adapter.generateList(['First', 'Second', 'Third'], true);
console.log(orderedList);
// 1. First
// 2. Second
// 3. Third

const indentedList = adapter.generateList(['Nested item'], false, 1);
console.log(indentedList);
//   - Nested item

const codeBlock = adapter.generateCodeBlock('const x = 5;', 'typescript');
console.log(codeBlock);
// ```typescript
// const x = 5;
// ```

const blockquote = adapter.generateBlockquote('Important note\nSpanning lines');
console.log(blockquote);
// > Important note
// > Spanning lines

const table = adapter.generateTable(
  ['Name', 'Type', 'Description'],
  [
    ['title', 'string', 'Page title'],
    ['tags', 'string[]', 'Categories']
  ]
);
console.log(table);
// | Name | Type | Description |
// |------|------|------|
// | title | string | Page title |
// | tags | string[] | Categories |
```

### Converting Sections to Markdown

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { Section } from '@wiki/domain-models';

const adapter = new MarkdownAdapter();

const sections: Section[] = [
  {
    heading: 'Overview',
    level: 2,
    content: 'This is an overview.',
    subsections: [
      {
        heading: 'Details',
        level: 3,
        content: 'Additional details here.',
        subsections: []
      }
    ]
  }
];

const markdown = adapter.sectionsToMarkdown(sections);
console.log(markdown);
// ## Overview
//
// This is an overview.
//
// ### Details
//
// Additional details here.
```

### Validating Markdown Syntax

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const validMarkdown = '## Heading\n\nSome content.';
const result1 = adapter.validateMarkdownSyntax(validMarkdown);
console.log(result1.valid); // true

const invalidMarkdown = '####### Heading\n\n[[Unclosed link';
const result2 = adapter.validateMarkdownSyntax(invalidMarkdown);
console.log(result2.valid);  // false
console.log(result2.error);  
// "Line 1: Invalid heading level: 7; Line 2: Unclosed wiki link"
```

### Escaping Special Characters

```typescript
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const adapter = new MarkdownAdapter();

const rawText = 'Use *asterisks* and [brackets] carefully';
const escaped = adapter.escapeMarkdown(rawText);
console.log(escaped);
// Use \*asterisks\* and \[brackets\] carefully
```

## Dependencies

**External Dependencies:** None  
**Internal Dependencies:**
- `@wiki/application-ports` - MarkdownPort interface, ValidationResult type
- `@wiki/domain-models` - Section entity

## Related Libraries

This library is used by:
- `@wiki/application-generators` - Generates markdown content for new wiki pages
- `@wiki/application-cross-reference` - Extracts and generates WikiLink references
- `@wiki/application-query` - Parses markdown for search indexing
- `@wiki/application-maintenance` - Validates markdown syntax during health checks
- `@wiki/application-workflow` - Processes markdown during ingestion workflows
- `@wiki/core` - Provides markdown adapter to external consumers
