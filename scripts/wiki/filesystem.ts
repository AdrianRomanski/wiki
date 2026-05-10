/**
 * File system utilities for the LLM Wiki Second Brain system.
 * 
 * This module provides secure file system operations for:
 * - Reading files from raw/ and wiki/ directories
 * - Writing files to wiki/ directory with atomic operations
 * - Listing files matching patterns using glob
 * - Validating file paths to prevent directory traversal
 * 
 * Requirements: 1.1, 1.2, 3.5
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Error thrown when a file path is invalid or unsafe.
 */
export class InvalidPathError extends Error {
  constructor(message: string, public attemptedPath: string) {
    super(message);
    this.name = 'InvalidPathError';
  }
}

/**
 * Error thrown when a file operation fails.
 */
export class FileOperationError extends Error {
  constructor(message: string, public filePath: string, public cause?: Error) {
    super(message);
    this.name = 'FileOperationError';
  }
}

/**
 * Configuration for file system operations.
 */
export interface FileSystemConfig {
  /** Root directory of the repository */
  rootDir: string;
  
  /** Raw sources directory (relative to rootDir) */
  rawDir: string;
  
  /** Wiki pages directory (relative to rootDir) */
  wikiDir: string;
}

/**
 * Default configuration using standard directory structure.
 */
export const DEFAULT_CONFIG: FileSystemConfig = {
  rootDir: process.cwd(),
  rawDir: 'raw',
  wikiDir: 'wiki',
};

/**
 * Validates that a file path is safe and within allowed directories.
 * 
 * Prevents directory traversal attacks by ensuring the resolved path
 * stays within the specified base directory.
 * 
 * @param filePath - The file path to validate
 * @param baseDir - The base directory that the path must be within
 * @returns The normalized, absolute path if valid
 * @throws {InvalidPathError} If the path is invalid or attempts directory traversal
 * 
 * @example
 * ```typescript
 * validatePath('entities/angular-cdk.md', '/repo/wiki');
 * // Returns: '/repo/wiki/entities/angular-cdk.md'
 * 
 * validatePath('../../../etc/passwd', '/repo/wiki');
 * // Throws: InvalidPathError
 * ```
 */
export function validatePath(filePath: string, baseDir: string): string {
  // Resolve to absolute paths
  const absoluteBase = path.resolve(baseDir);
  const absolutePath = path.resolve(baseDir, filePath);
  
  // Check if the resolved path is within the base directory
  if (!absolutePath.startsWith(absoluteBase + path.sep) && absolutePath !== absoluteBase) {
    throw new InvalidPathError(
      `Path '${filePath}' attempts to access outside allowed directory`,
      filePath
    );
  }
  
  return absolutePath;
}

/**
 * Reads a file from the raw/ directory.
 * 
 * @param filePath - Path relative to raw/ directory
 * @param config - File system configuration (optional)
 * @returns File content as string
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If file cannot be read
 * 
 * @example
 * ```typescript
 * const content = await readRawFile('articles/angular-aria.md');
 * ```
 */
export async function readRawFile(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<string> {
  const rawBase = path.join(config.rootDir, config.rawDir);
  const absolutePath = validatePath(filePath, rawBase);
  
  try {
    return await fs.readFile(absolutePath, 'utf-8');
  } catch (error) {
    throw new FileOperationError(
      `Failed to read raw file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Reads a file from the wiki/ directory.
 * 
 * @param filePath - Path relative to wiki/ directory
 * @param config - File system configuration (optional)
 * @returns File content as string
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If file cannot be read
 * 
 * @example
 * ```typescript
 * const content = await readWikiFile('entities/angular-cdk.md');
 * ```
 */
export async function readWikiFile(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<string> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  const absolutePath = validatePath(filePath, wikiBase);
  
  try {
    return await fs.readFile(absolutePath, 'utf-8');
  } catch (error) {
    throw new FileOperationError(
      `Failed to read wiki file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Writes content to a file in the wiki/ directory with atomic operation.
 * 
 * Uses atomic write pattern: write to temporary file, then rename.
 * This ensures the file is never in a partially written state.
 * 
 * @param filePath - Path relative to wiki/ directory
 * @param content - Content to write
 * @param config - File system configuration (optional)
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If file cannot be written
 * 
 * @example
 * ```typescript
 * await writeWikiFile('entities/angular-cdk.md', markdownContent);
 * ```
 */
export async function writeWikiFile(
  filePath: string,
  content: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<void> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  const absolutePath = validatePath(filePath, wikiBase);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(absolutePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    throw new FileOperationError(
      `Failed to create directory for: ${filePath}`,
      filePath,
      error as Error
    );
  }
  
  // Atomic write: write to temp file, then rename
  const tempPath = `${absolutePath}.tmp`;
  
  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, absolutePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    
    throw new FileOperationError(
      `Failed to write wiki file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Lists files in the raw/ directory matching a glob pattern.
 * 
 * @param pattern - Glob pattern (e.g., '**\/*.md', 'articles/*.pdf')
 * @param config - File system configuration (optional)
 * @returns Array of file paths relative to raw/ directory
 * @throws {FileOperationError} If listing fails
 * 
 * @example
 * ```typescript
 * // List all markdown files in raw/
 * const mdFiles = await listRawFiles('**\/*.md');
 * 
 * // List all files in articles subdirectory
 * const articles = await listRawFiles('articles/*');
 * ```
 */
export async function listRawFiles(
  pattern: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<string[]> {
  const rawBase = path.join(config.rootDir, config.rawDir);
  
  try {
    const files = await glob(pattern, {
      cwd: rawBase,
      nodir: true,
      dot: false,
    });
    
    return files;
  } catch (error) {
    throw new FileOperationError(
      `Failed to list raw files with pattern: ${pattern}`,
      pattern,
      error as Error
    );
  }
}

/**
 * Lists files in the wiki/ directory matching a glob pattern.
 * 
 * @param pattern - Glob pattern (e.g., '**\/*.md', 'entities/*.md')
 * @param config - File system configuration (optional)
 * @returns Array of file paths relative to wiki/ directory
 * @throws {FileOperationError} If listing fails
 * 
 * @example
 * ```typescript
 * // List all wiki pages
 * const allPages = await listWikiFiles('**\/*.md');
 * 
 * // List only entity pages
 * const entities = await listWikiFiles('entities/*.md');
 * ```
 */
export async function listWikiFiles(
  pattern: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<string[]> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  
  try {
    const files = await glob(pattern, {
      cwd: wikiBase,
      nodir: true,
      dot: false,
    });
    
    return files;
  } catch (error) {
    throw new FileOperationError(
      `Failed to list wiki files with pattern: ${pattern}`,
      pattern,
      error as Error
    );
  }
}

/**
 * Checks if a file exists in the raw/ directory.
 * 
 * @param filePath - Path relative to raw/ directory
 * @param config - File system configuration (optional)
 * @returns True if file exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (await rawFileExists('articles/angular-aria.md')) {
 *   // File exists
 * }
 * ```
 */
export async function rawFileExists(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const rawBase = path.join(config.rootDir, config.rawDir);
  
  try {
    const absolutePath = validatePath(filePath, rawBase);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists in the wiki/ directory.
 * 
 * @param filePath - Path relative to wiki/ directory
 * @param config - File system configuration (optional)
 * @returns True if file exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (await wikiFileExists('entities/angular-cdk.md')) {
 *   // File exists
 * }
 * ```
 */
export async function wikiFileExists(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  
  try {
    const absolutePath = validatePath(filePath, wikiBase);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets file metadata (size, timestamps) for a raw file.
 * 
 * @param filePath - Path relative to raw/ directory
 * @param config - File system configuration (optional)
 * @returns File stats object
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If stats cannot be retrieved
 * 
 * @example
 * ```typescript
 * const stats = await getRawFileStats('articles/angular-aria.md');
 * console.log(stats.size, stats.mtime);
 * ```
 */
export async function getRawFileStats(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<{ size: number; mtime: Date; ctime: Date }> {
  const rawBase = path.join(config.rootDir, config.rawDir);
  const absolutePath = validatePath(filePath, rawBase);
  
  try {
    const stats = await fs.stat(absolutePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  } catch (error) {
    throw new FileOperationError(
      `Failed to get stats for raw file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Gets file metadata (size, timestamps) for a wiki file.
 * 
 * @param filePath - Path relative to wiki/ directory
 * @param config - File system configuration (optional)
 * @returns File stats object
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If stats cannot be retrieved
 * 
 * @example
 * ```typescript
 * const stats = await getWikiFileStats('entities/angular-cdk.md');
 * console.log(stats.size, stats.mtime);
 * ```
 */
export async function getWikiFileStats(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<{ size: number; mtime: Date; ctime: Date }> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  const absolutePath = validatePath(filePath, wikiBase);
  
  try {
    const stats = await fs.stat(absolutePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
    };
  } catch (error) {
    throw new FileOperationError(
      `Failed to get stats for wiki file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Ensures a directory exists in the wiki/ directory.
 * Creates the directory and any necessary parent directories.
 * 
 * @param dirPath - Directory path relative to wiki/ directory
 * @param config - File system configuration (optional)
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If directory cannot be created
 * 
 * @example
 * ```typescript
 * await ensureWikiDir('entities');
 * await ensureWikiDir('concepts/accessibility');
 * ```
 */
export async function ensureWikiDir(
  dirPath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<void> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  const absolutePath = validatePath(dirPath, wikiBase);
  
  try {
    await fs.mkdir(absolutePath, { recursive: true });
  } catch (error) {
    throw new FileOperationError(
      `Failed to create wiki directory: ${dirPath}`,
      dirPath,
      error as Error
    );
  }
}

/**
 * Deletes a file from the wiki/ directory.
 * 
 * Note: Raw files should never be deleted (immutability requirement).
 * This function only works with wiki files.
 * 
 * @param filePath - Path relative to wiki/ directory
 * @param config - File system configuration (optional)
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileOperationError} If file cannot be deleted
 * 
 * @example
 * ```typescript
 * await deleteWikiFile('entities/old-page.md');
 * ```
 */
export async function deleteWikiFile(
  filePath: string,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<void> {
  const wikiBase = path.join(config.rootDir, config.wikiDir);
  const absolutePath = validatePath(filePath, wikiBase);
  
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    throw new FileOperationError(
      `Failed to delete wiki file: ${filePath}`,
      filePath,
      error as Error
    );
  }
}
