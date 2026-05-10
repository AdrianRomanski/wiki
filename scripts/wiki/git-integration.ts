/**
 * Git integration for the LLM Wiki Second Brain system.
 * 
 * This module provides git operations for:
 * - Generating meaningful commit messages for wiki changes
 * - Creating commits when wiki pages are created or updated
 * - Batching related changes into single commits
 * - Verifying git storage of wiki pages and raw sources
 * - Supporting git history viewing (log, diff)
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import simpleGit, { SimpleGit, LogResult, DiffResult } from 'simple-git';
import * as path from 'path';
import { FileSystemConfig, DEFAULT_CONFIG } from './filesystem.js';

/**
 * Error thrown when a git operation fails.
 */
export class GitOperationError extends Error {
  constructor(message: string, public operation: string, public cause?: Error) {
    super(message);
    this.name = 'GitOperationError';
  }
}

/**
 * Configuration for git operations.
 */
export interface GitConfig extends FileSystemConfig {
  /** Whether to automatically commit changes */
  autoCommit?: boolean;
  
  /** Whether to batch multiple changes into single commits */
  batchCommits?: boolean;
  
  /** Delay in milliseconds before batching commits (default: 1000ms) */
  batchDelay?: number;
}

/**
 * Default git configuration.
 */
export const DEFAULT_GIT_CONFIG: GitConfig = {
  ...DEFAULT_CONFIG,
  autoCommit: true,
  batchCommits: true,
  batchDelay: 1000,
};

/**
 * Type of wiki operation for commit message generation.
 */
export type WikiOperationType = 'create' | 'update' | 'delete' | 'ingest';

/**
 * Information about a wiki change for commit message generation.
 */
export interface WikiChange {
  /** Type of operation */
  type: WikiOperationType;
  
  /** Path to the changed file (relative to repository root) */
  filePath: string;
  
  /** Title of the wiki page (for create/update operations) */
  pageTitle?: string;
  
  /** Type of wiki page (entity, concept, source) */
  pageType?: 'entity' | 'concept' | 'source';
  
  /** Description of changes (for update operations) */
  changes?: string;
  
  /** Raw source path (for ingest operations) */
  sourcePath?: string;
  
  /** Generated pages (for ingest operations) */
  generatedPages?: string[];
}

/**
 * Batch of wiki changes to be committed together.
 */
interface CommitBatch {
  changes: WikiChange[];
  timeoutId?: NodeJS.Timeout;
}

// Global commit batch for batching related changes
let currentBatch: CommitBatch | null = null;

/**
 * Generates a meaningful commit message for wiki changes.
 * 
 * @param changes - Array of wiki changes to commit
 * @returns Commit message string
 * 
 * @example
 * ```typescript
 * const message = generateCommitMessage([
 *   {
 *     type: 'create',
 *     filePath: 'wiki/entities/angular-cdk.md',
 *     pageTitle: 'Angular CDK',
 *     pageType: 'entity'
 *   }
 * ]);
 * // Returns: "wiki: create entity page 'Angular CDK'"
 * ```
 */
export function generateCommitMessage(changes: WikiChange[]): string {
  if (changes.length === 0) {
    return 'wiki: update';
  }
  
  // Single change - generate specific message
  if (changes.length === 1) {
    const change = changes[0];
    
    switch (change.type) {
      case 'create':
        if (change.pageType && change.pageTitle) {
          return `wiki: create ${change.pageType} page '${change.pageTitle}'`;
        }
        return `wiki: create page ${path.basename(change.filePath)}`;
        
      case 'update':
        if (change.pageTitle) {
          const changeDesc = change.changes ? ` - ${change.changes}` : '';
          return `wiki: update '${change.pageTitle}'${changeDesc}`;
        }
        return `wiki: update ${path.basename(change.filePath)}`;
        
      case 'delete':
        if (change.pageTitle) {
          return `wiki: delete '${change.pageTitle}'`;
        }
        return `wiki: delete ${path.basename(change.filePath)}`;
        
      case 'ingest':
        if (change.sourcePath && change.generatedPages) {
          const pageCount = change.generatedPages.length;
          return `wiki: ingest ${path.basename(change.sourcePath)} (${pageCount} page${pageCount > 1 ? 's' : ''})`;
        }
        return `wiki: ingest source`;
    }
  }
  
  // Multiple changes - generate summary message
  const createCount = changes.filter(c => c.type === 'create').length;
  const updateCount = changes.filter(c => c.type === 'update').length;
  const deleteCount = changes.filter(c => c.type === 'delete').length;
  const ingestCount = changes.filter(c => c.type === 'ingest').length;
  
  const parts: string[] = [];
  
  if (createCount > 0) {
    parts.push(`create ${createCount} page${createCount > 1 ? 's' : ''}`);
  }
  if (updateCount > 0) {
    parts.push(`update ${updateCount} page${updateCount > 1 ? 's' : ''}`);
  }
  if (deleteCount > 0) {
    parts.push(`delete ${deleteCount} page${deleteCount > 1 ? 's' : ''}`);
  }
  if (ingestCount > 0) {
    parts.push(`ingest ${ingestCount} source${ingestCount > 1 ? 's' : ''}`);
  }
  
  return `wiki: ${parts.join(', ')}`;
}

/**
 * Creates a git instance for the repository.
 * 
 * @param config - Git configuration
 * @returns SimpleGit instance
 */
function createGitInstance(config: GitConfig = DEFAULT_GIT_CONFIG): SimpleGit {
  return simpleGit(config.rootDir);
}

/**
 * Checks if a directory is a git repository.
 * 
 * @param config - Git configuration
 * @returns True if the directory is a git repository
 * 
 * @example
 * ```typescript
 * if (await isGitRepository()) {
 *   // Perform git operations
 * }
 * ```
 */
export async function isGitRepository(config: GitConfig = DEFAULT_GIT_CONFIG): Promise<boolean> {
  try {
    const git = createGitInstance(config);
    await git.status();
    return true;
  } catch {
    return false;
  }
}

/**
 * Stages files for commit.
 * 
 * @param filePaths - Array of file paths to stage (relative to repository root)
 * @param config - Git configuration
 * @throws {GitOperationError} If staging fails
 * 
 * @example
 * ```typescript
 * await stageFiles(['wiki/entities/angular-cdk.md', 'wiki/index.md']);
 * ```
 */
export async function stageFiles(
  filePaths: string[],
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<void> {
  try {
    const git = createGitInstance(config);
    await git.add(filePaths);
  } catch (error) {
    throw new GitOperationError(
      `Failed to stage files: ${filePaths.join(', ')}`,
      'stage',
      error as Error
    );
  }
}

/**
 * Creates a git commit with the specified message.
 * 
 * @param message - Commit message
 * @param config - Git configuration
 * @returns Commit hash
 * @throws {GitOperationError} If commit fails
 * 
 * @example
 * ```typescript
 * const hash = await createCommit("wiki: create entity page 'Angular CDK'");
 * console.log(`Created commit: ${hash}`);
 * ```
 */
export async function createCommit(
  message: string,
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<string> {
  try {
    const git = createGitInstance(config);
    const result = await git.commit(message);
    return result.commit;
  } catch (error) {
    throw new GitOperationError(
      `Failed to create commit: ${message}`,
      'commit',
      error as Error
    );
  }
}

/**
 * Commits wiki changes with an automatically generated message.
 * 
 * This function stages the changed files and creates a commit with
 * a meaningful message based on the type of changes.
 * 
 * @param changes - Array of wiki changes to commit
 * @param config - Git configuration
 * @returns Commit hash
 * @throws {GitOperationError} If commit fails
 * 
 * @example
 * ```typescript
 * const hash = await commitWikiChanges([
 *   {
 *     type: 'create',
 *     filePath: 'wiki/entities/angular-cdk.md',
 *     pageTitle: 'Angular CDK',
 *     pageType: 'entity'
 *   }
 * ]);
 * ```
 */
export async function commitWikiChanges(
  changes: WikiChange[],
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<string> {
  if (changes.length === 0) {
    throw new GitOperationError('No changes to commit', 'commit');
  }
  
  // Check if we're in a git repository
  if (!(await isGitRepository(config))) {
    throw new GitOperationError(
      'Not a git repository',
      'commit'
    );
  }
  
  // Extract file paths from changes
  const filePaths = changes.map(c => c.filePath);
  
  // Also include index and activity log if they exist
  const indexPath = path.join(config.wikiDir, 'index.md');
  const activityLogPath = path.join(config.wikiDir, 'activity-log.md');
  
  const allPaths = [...filePaths, indexPath, activityLogPath];
  
  // Stage files
  await stageFiles(allPaths, config);
  
  // Generate commit message
  const message = generateCommitMessage(changes);
  
  // Create commit
  return await createCommit(message, config);
}

/**
 * Adds a change to the current batch for batched commits.
 * 
 * If batching is enabled, changes are accumulated and committed together
 * after a delay. This reduces the number of commits for related changes.
 * 
 * @param change - Wiki change to add to batch
 * @param config - Git configuration
 * 
 * @example
 * ```typescript
 * // These changes will be batched into a single commit
 * await batchWikiChange({
 *   type: 'create',
 *   filePath: 'wiki/entities/angular-cdk.md',
 *   pageTitle: 'Angular CDK',
 *   pageType: 'entity'
 * });
 * 
 * await batchWikiChange({
 *   type: 'update',
 *   filePath: 'wiki/index.md',
 *   pageTitle: 'Index'
 * });
 * ```
 */
export async function batchWikiChange(
  change: WikiChange,
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<void> {
  if (!config.batchCommits) {
    // If batching is disabled, commit immediately
    await commitWikiChanges([change], config);
    return;
  }
  
  // Initialize batch if needed
  if (!currentBatch) {
    currentBatch = { changes: [] };
  }
  
  // Add change to batch
  currentBatch.changes.push(change);
  
  // Clear existing timeout
  if (currentBatch.timeoutId) {
    clearTimeout(currentBatch.timeoutId);
  }
  
  // Set new timeout to commit batch
  currentBatch.timeoutId = setTimeout(async () => {
    if (currentBatch && currentBatch.changes.length > 0) {
      const changes = [...currentBatch.changes];
      currentBatch = null;
      
      try {
        await commitWikiChanges(changes, config);
      } catch (error) {
        console.error('Failed to commit batched changes:', error);
      }
    }
  }, config.batchDelay || 1000);
}

/**
 * Flushes the current commit batch immediately.
 * 
 * This forces any pending batched changes to be committed right away
 * instead of waiting for the batch delay.
 * 
 * @param config - Git configuration
 * @returns Commit hash if changes were committed, undefined otherwise
 * 
 * @example
 * ```typescript
 * // Flush pending changes before exiting
 * await flushCommitBatch();
 * ```
 */
export async function flushCommitBatch(
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<string | undefined> {
  if (!currentBatch || currentBatch.changes.length === 0) {
    return undefined;
  }
  
  // Clear timeout
  if (currentBatch.timeoutId) {
    clearTimeout(currentBatch.timeoutId);
  }
  
  // Commit changes
  const changes = [...currentBatch.changes];
  currentBatch = null;
  
  return await commitWikiChanges(changes, config);
}

/**
 * Verifies that a file is stored in git.
 * 
 * @param filePath - Path to file (relative to repository root)
 * @param config - Git configuration
 * @returns True if file is tracked by git
 * @throws {GitOperationError} If verification fails
 * 
 * @example
 * ```typescript
 * const isTracked = await verifyFileInGit('wiki/entities/angular-cdk.md');
 * ```
 */
export async function verifyFileInGit(
  filePath: string,
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<boolean> {
  try {
    const git = createGitInstance(config);
    const result = await git.raw(['ls-files', filePath]);
    return result.trim().length > 0;
  } catch (error) {
    throw new GitOperationError(
      `Failed to verify file in git: ${filePath}`,
      'verify',
      error as Error
    );
  }
}

/**
 * Verifies that wiki pages are stored as plain markdown files in git.
 * 
 * @param config - Git configuration
 * @returns Object with verification results
 * @throws {GitOperationError} If verification fails
 * 
 * @example
 * ```typescript
 * const result = await verifyWikiPagesInGit();
 * console.log(`Verified ${result.trackedCount} wiki pages`);
 * ```
 */
export async function verifyWikiPagesInGit(
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<{ trackedCount: number; untrackedFiles: string[] }> {
  try {
    const git = createGitInstance(config);
    const wikiPath = config.wikiDir;
    
    // Get all tracked files in wiki/ directory
    const trackedResult = await git.raw(['ls-files', `${wikiPath}/**/*.md`]);
    const trackedFiles = trackedResult
      .split('\n')
      .filter(line => line.trim().length > 0);
    
    // Get all untracked files in wiki/ directory
    const statusResult = await git.status();
    const untrackedFiles = statusResult.not_added
      .filter(file => file.startsWith(wikiPath) && file.endsWith('.md'));
    
    return {
      trackedCount: trackedFiles.length,
      untrackedFiles,
    };
  } catch (error) {
    throw new GitOperationError(
      'Failed to verify wiki pages in git',
      'verify',
      error as Error
    );
  }
}

/**
 * Verifies that raw sources are stored in their original format in git.
 * 
 * @param config - Git configuration
 * @returns Object with verification results
 * @throws {GitOperationError} If verification fails
 * 
 * @example
 * ```typescript
 * const result = await verifyRawSourcesInGit();
 * console.log(`Verified ${result.trackedCount} raw sources`);
 * ```
 */
export async function verifyRawSourcesInGit(
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<{ trackedCount: number; untrackedFiles: string[] }> {
  try {
    const git = createGitInstance(config);
    const rawPath = config.rawDir;
    
    // Get all tracked files in raw/ directory
    const trackedResult = await git.raw(['ls-files', `${rawPath}/**/*`]);
    const trackedFiles = trackedResult
      .split('\n')
      .filter(line => line.trim().length > 0 && !line.endsWith('README.md'));
    
    // Get all untracked files in raw/ directory
    const statusResult = await git.status();
    const untrackedFiles = statusResult.not_added
      .filter(file => file.startsWith(rawPath) && !file.endsWith('README.md'));
    
    return {
      trackedCount: trackedFiles.length,
      untrackedFiles,
    };
  } catch (error) {
    throw new GitOperationError(
      'Failed to verify raw sources in git',
      'verify',
      error as Error
    );
  }
}

/**
 * Gets git history for a file.
 * 
 * @param filePath - Path to file (relative to repository root)
 * @param maxCount - Maximum number of commits to retrieve (default: 10)
 * @param config - Git configuration
 * @returns Git log result with commit history
 * @throws {GitOperationError} If log retrieval fails
 * 
 * @example
 * ```typescript
 * const history = await getFileHistory('wiki/entities/angular-cdk.md');
 * history.all.forEach(commit => {
 *   console.log(`${commit.date}: ${commit.message}`);
 * });
 * ```
 */
export async function getFileHistory(
  filePath: string,
  maxCount: number = 10,
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<LogResult> {
  try {
    const git = createGitInstance(config);
    return await git.log({
      file: filePath,
      maxCount,
    });
  } catch (error) {
    throw new GitOperationError(
      `Failed to get history for file: ${filePath}`,
      'log',
      error as Error
    );
  }
}

/**
 * Gets git diff for a file.
 * 
 * @param filePath - Path to file (relative to repository root)
 * @param fromCommit - Starting commit (optional, defaults to HEAD)
 * @param toCommit - Ending commit (optional, defaults to working directory)
 * @param config - Git configuration
 * @returns Git diff result
 * @throws {GitOperationError} If diff retrieval fails
 * 
 * @example
 * ```typescript
 * // Get diff between HEAD and working directory
 * const diff = await getFileDiff('wiki/entities/angular-cdk.md');
 * 
 * // Get diff between two commits
 * const diff = await getFileDiff('wiki/entities/angular-cdk.md', 'abc123', 'def456');
 * ```
 */
export async function getFileDiff(
  filePath: string,
  fromCommit?: string,
  toCommit?: string,
  config: GitConfig = DEFAULT_GIT_CONFIG
): Promise<string> {
  try {
    const git = createGitInstance(config);
    
    if (fromCommit && toCommit) {
      return await git.diff([`${fromCommit}..${toCommit}`, '--', filePath]);
    } else if (fromCommit) {
      return await git.diff([fromCommit, '--', filePath]);
    } else {
      return await git.diff(['--', filePath]);
    }
  } catch (error) {
    throw new GitOperationError(
      `Failed to get diff for file: ${filePath}`,
      'diff',
      error as Error
    );
  }
}

/**
 * Gets the current git status.
 * 
 * @param config - Git configuration
 * @returns Git status result
 * @throws {GitOperationError} If status retrieval fails
 * 
 * @example
 * ```typescript
 * const status = await getGitStatus();
 * console.log(`Modified files: ${status.modified.length}`);
 * console.log(`Untracked files: ${status.not_added.length}`);
 * ```
 */
export async function getGitStatus(config: GitConfig = DEFAULT_GIT_CONFIG) {
  try {
    const git = createGitInstance(config);
    return await git.status();
  } catch (error) {
    throw new GitOperationError(
      'Failed to get git status',
      'status',
      error as Error
    );
  }
}
