# @wiki/infrastructure-filesystem

File system adapter implementing port interfaces for wiki content access.

## Overview

**Library Name:** `@wiki/infrastructure-filesystem`  
**Scope:** `@wiki`  
**Architectural Layer:** Infrastructure  
**Tags:** `infrastructure`

This library provides a concrete implementation of the `FileSystemPort` interface, handling all file system operations for both raw source documents and wiki pages. It includes path validation, atomic writes, and glob pattern support for safe and reliable file operations.

## Purpose and Responsibilities

The `@wiki/infrastructure-filesystem` library is responsible for:

- **Port Implementation**: Implements the `FileSystemPort` interface defined in the Application Layer
- **File Operations**: Provides read, write, list, and delete operations for raw and wiki files
- **Path Validation**: Validates all file paths to prevent directory traversal attacks
- **Atomic Writes**: Uses temporary files and rename operations to ensure write atomicity
- **Directory Management**: Creates directories as needed and ensures proper structure
- **Glob Support**: Enables pattern-based file listing for flexible queries
- **Error Handling**: Provides detailed error messages with context for troubleshooting

This library isolates file system operations from application logic, enabling alternative storage implementations and comprehensive testing through in-memory adapters.

## Public API

### Classes

**FileSystemAdapter**
```typescript
class FileSystemAdapter implements FileSystemPort {
  constructor(config?: FileSystemConfig);
  
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

**FileSystemConfig**
```typescript
interface FileSystemConfig {
  rootDir: string;   // Root directory for the wiki system
  rawDir: string;    // Subdirectory for raw source documents
  wikiDir: string;   // Subdirectory for wiki pages
}
```

**DEFAULT_CONFIG**
```typescript
const DEFAULT_CONFIG: FileSystemConfig = {
  rootDir: process.cwd(),
  rawDir: 'raw',
  wikiDir: 'wiki',
};
```

### Error Classes

**InvalidPathError**
```typescript
class InvalidPathError extends Error {
  constructor(message: string, public path: string);
}
```

**FileOperationError**
```typescript
class FileOperationError extends Error {
  constructor(
    message: string,
    public path: string,
    public cause?: Error
  );
}
```

## Usage Examples

### Reading and Writing Wiki Files

```typescript
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const adapter = new FileSystemAdapter();

const content = await adapter.readWikiFile('entities/angular-cdk.md');
console.log(content);

const updatedContent = content.replace('old text', 'new text');
await adapter.writeWikiFile('entities/angular-cdk.md', updatedContent);
```

### Listing Files with Glob Patterns

```typescript
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const adapter = new FileSystemAdapter();

const entityPages = await adapter.listWikiFiles('entities/*.md');
console.log('Entity pages:', entityPages);

const allMarkdownFiles = await adapter.listWikiFiles('**/*.md');
console.log('All markdown files:', allMarkdownFiles);

const rawSources = await adapter.listRawFiles('**/*.pdf');
console.log('PDF sources:', rawSources);
```

### Custom Configuration

```typescript
import { FileSystemAdapter, FileSystemConfig } from '@wiki/infrastructure-filesystem';

const config: FileSystemConfig = {
  rootDir: '/home/user/projects/my-wiki',
  rawDir: 'sources',
  wikiDir: 'content'
};

const adapter = new FileSystemAdapter(config);

await adapter.readWikiFile('entities/example.md');
```

### Checking File Existence

```typescript
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const adapter = new FileSystemAdapter();

const exists = await adapter.wikiFileExists('entities/angular-cdk.md');
if (exists) {
  const content = await adapter.readWikiFile('entities/angular-cdk.md');
  console.log(content);
}
```

### Getting File Statistics

```typescript
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';

const adapter = new FileSystemAdapter();

const stats = await adapter.getWikiFileStats('entities/angular-cdk.md');
console.log('Size:', stats.size);
console.log('Created:', stats.created);
console.log('Modified:', stats.modified);
```

### Error Handling

```typescript
import { 
  FileSystemAdapter, 
  InvalidPathError, 
  FileOperationError 
} from '@wiki/infrastructure-filesystem';

const adapter = new FileSystemAdapter();

try {
  await adapter.readWikiFile('../../../etc/passwd');
} catch (error) {
  if (error instanceof InvalidPathError) {
    console.error('Invalid path:', error.path);
  }
}

try {
  await adapter.writeWikiFile('entities/new-page.md', 'content');
} catch (error) {
  if (error instanceof FileOperationError) {
    console.error('Operation failed:', error.message);
    console.error('Cause:', error.cause);
  }
}
```

## Dependencies

**External Dependencies:**
- Node.js `fs/promises` - File system operations
- Node.js `path` - Path manipulation
- `glob` - Pattern-based file matching

**Internal Dependencies:**
- `@wiki/application-ports` - FileSystemPort interface, FileStats type

## Related Libraries

This library is used by:
- `@wiki/application-query` - Searches and retrieves wiki pages from file system
- `@wiki/application-generators` - Writes generated pages to file system
- `@wiki/application-activity-log` - Reads and writes activity log files
- `@wiki/application-maintenance` - Scans file system for maintenance checks
- `@wiki/application-workflow` - Orchestrates file operations across workflows
- `@wiki/core` - Provides file system adapter to external consumers
