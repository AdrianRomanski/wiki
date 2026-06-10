# @wiki/application-ports

Port interface definitions for infrastructure dependencies following the Hexagonal Architecture pattern.

## Overview

**Library Name:** `@wiki/application-ports`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library defines port interfaces that establish the contract between the Application Layer and Infrastructure Layer. These interfaces enable dependency inversion, allowing application use cases to remain independent of technical implementation details while infrastructure adapters provide concrete implementations.

## Purpose and Responsibilities

The `@wiki/application-ports` library is responsible for:

- **Port Interface Definitions**: Defines abstract interfaces for infrastructure dependencies
- **Dependency Inversion**: Enables application layer to depend on abstractions rather than concrete implementations
- **Technology Agnosticism**: Keeps business logic free from framework-specific types
- **Testability**: Facilitates mocking and in-memory implementations for unit testing
- **Adapter Pattern**: Establishes contracts that infrastructure adapters must fulfill
- **Type Safety**: Provides strongly-typed interfaces for all infrastructure operations

This library serves as the boundary between application use cases and technical infrastructure, ensuring that business logic remains portable and testable.

## Public API

### Port Interfaces

**FileSystemPort**
```typescript
interface FileSystemPort {
  readRawFile(filePath: string): Promise<string>;
  readWikiFile(filePath: string): Promise<string>;
  writeWikiFile(filePath: string, content: string): Promise<void>;
  listRawFiles(pattern: string): Promise<string[]>;
  listWikiFiles(pattern: string): Promise<string[]>;
  rawFileExists(filePath: string): Promise<boolean>;
  wikiFileExists(filePath: string): Promise<boolean>;
  getRawFileStats(filePath: string): Promise<FileStats>;
  getWikiFileStats(filePath: string): Promise<FileStats>;
  ensureWikiDir(dirPath: string): Promise<void>;
  deleteWikiFile(filePath: string): Promise<void>;
}
```

**MarkdownPort**
```typescript
interface MarkdownPort {
  parseMarkdownSections(content: string): Section[];
  extractWikiLinks(content: string): string[];
  generateWikiLink(target: string, displayText?: string, section?: string): string;
  generateHeading(text: string, level: number): string;
  generateList(items: string[], ordered?: boolean, indent?: number): string;
  generateCodeBlock(code: string, language?: string): string;
  generateBlockquote(text: string): string;
  generateTable(headers: string[], rows: string[][]): string;
  validateMarkdownSyntax(content: string): ValidationResult;
  sectionsToMarkdown(sections: Section[]): string;
  escapeMarkdown(text: string): string;
}
```

**FrontmatterPort**
```typescript
interface FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter;
  generateFrontmatter(frontmatter: WikiPageFrontmatter, content?: string): string;
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter;
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter;
}
```

### Supporting Types

**FileStats**
```typescript
interface FileStats {
  size: number;
  created: Date;
  modified: Date;
}
```

**ValidationResult**
```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
  suggestions?: string[];
}
```

**ParsedFrontmatter**
```typescript
interface ParsedFrontmatter {
  frontmatter: WikiPageFrontmatter;
  content: string;
}
```

## Usage Examples

### Using Ports in Application Use Cases

```typescript
import { FileSystemPort, MarkdownPort } from '@wiki/application-ports';

class MyUseCase {
  constructor(
    private fileSystem: FileSystemPort,
    private markdown: MarkdownPort
  ) {}

  async execute(pageName: string): Promise<void> {
    const content = await this.fileSystem.readWikiFile(`${pageName}.md`);
    const links = this.markdown.extractWikiLinks(content);
    console.log('Found links:', links);
  }
}
```

### Dependency Injection with Ports

```typescript
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { MyUseCase } from './my-use-case';

const fileSystem = new FileSystemAdapter();
const markdown = new MarkdownAdapter();

const useCase = new MyUseCase(fileSystem, markdown);
await useCase.execute('angular-cdk');
```

### Creating Test Mocks

```typescript
import { FileSystemPort } from '@wiki/application-ports';

class MockFileSystemPort implements FileSystemPort {
  private files = new Map<string, string>();

  async readWikiFile(filePath: string): Promise<string> {
    return this.files.get(filePath) || '';
  }

  async writeWikiFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  async wikiFileExists(filePath: string): Promise<boolean> {
    return this.files.has(filePath);
  }
}

const mockFileSystem = new MockFileSystemPort();
const useCase = new MyUseCase(mockFileSystem, mockMarkdown);
```

### Composing Multiple Ports

```typescript
import { 
  FileSystemPort, 
  MarkdownPort, 
  FrontmatterPort 
} from '@wiki/application-ports';

class GeneratePageUseCase {
  constructor(
    private fileSystem: FileSystemPort,
    private markdown: MarkdownPort,
    private frontmatter: FrontmatterPort
  ) {}

  async execute(title: string, content: string): Promise<void> {
    const metadata = this.frontmatter.createFrontmatter({
      title,
      type: 'entity',
      tags: []
    });

    const sections = [
      this.markdown.generateHeading(title, 1),
      content
    ];

    const markdown = this.frontmatter.generateFrontmatter(
      metadata,
      sections.join('\n\n')
    );

    await this.fileSystem.writeWikiFile(`${title}.md`, markdown);
  }
}
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - WikiPageFrontmatter, Section types

## Related Libraries

This library is implemented by:
- `@wiki/infrastructure-filesystem` - FileSystemPort implementation
- `@wiki/infrastructure-markdown` - MarkdownPort implementation
- `@wiki/infrastructure-frontmatter` - FrontmatterPort implementation

This library is used by:
- `@wiki/application-generators` - Page generation use cases
- `@wiki/application-cross-reference` - Cross-reference detection
- `@wiki/application-index-manager` - Index management
- `@wiki/application-activity-log` - Activity logging
- `@wiki/application-query` - Search and query operations
- `@wiki/application-maintenance` - Maintenance checks
- `@wiki/application-workflow` - Workflow orchestration
- `@wiki/application-adr` - ADR operations
