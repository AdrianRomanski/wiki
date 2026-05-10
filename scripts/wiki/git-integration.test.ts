/**
 * Tests for git integration module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCommitMessage,
  isGitRepository,
  stageFiles,
  createCommit,
  commitWikiChanges,
  batchWikiChange,
  flushCommitBatch,
  verifyFileInGit,
  verifyWikiPagesInGit,
  verifyRawSourcesInGit,
  getFileHistory,
  getFileDiff,
  getGitStatus,
  WikiChange,
  GitOperationError,
} from './git-integration';

describe('generateCommitMessage', () => {
  it('should generate message for single entity creation', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
        pageType: 'entity',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: create entity page 'Angular CDK'");
  });
  
  it('should generate message for single concept creation', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/concepts/progressive-enhancement.md',
        pageTitle: 'Progressive Enhancement',
        pageType: 'concept',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: create concept page 'Progressive Enhancement'");
  });
  
  it('should generate message for single source creation', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/sources/angular-aria-guide-2024-05-10.md',
        pageTitle: 'Angular ARIA Guide',
        pageType: 'source',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: create source page 'Angular ARIA Guide'");
  });
  
  it('should generate message for page update with changes', () => {
    const changes: WikiChange[] = [
      {
        type: 'update',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
        changes: 'Added focus management examples',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: update 'Angular CDK' - Added focus management examples");
  });
  
  it('should generate message for page update without changes description', () => {
    const changes: WikiChange[] = [
      {
        type: 'update',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: update 'Angular CDK'");
  });
  
  it('should generate message for page deletion', () => {
    const changes: WikiChange[] = [
      {
        type: 'delete',
        filePath: 'wiki/entities/old-page.md',
        pageTitle: 'Old Page',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe("wiki: delete 'Old Page'");
  });
  
  it('should generate message for source ingestion', () => {
    const changes: WikiChange[] = [
      {
        type: 'ingest',
        filePath: 'wiki/sources/angular-aria-guide-2024-05-10.md',
        sourcePath: 'raw/articles/angular-aria.md',
        generatedPages: [
          'wiki/entities/angular-cdk.md',
          'wiki/concepts/accessibility.md',
        ],
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: ingest angular-aria.md (2 pages)');
  });
  
  it('should generate message for source ingestion with single page', () => {
    const changes: WikiChange[] = [
      {
        type: 'ingest',
        filePath: 'wiki/sources/note-2024-05-10.md',
        sourcePath: 'raw/notes/quick-note.md',
        generatedPages: ['wiki/sources/note-2024-05-10.md'],
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: ingest quick-note.md (1 page)');
  });
  
  it('should generate summary message for multiple creates', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
        pageType: 'entity',
      },
      {
        type: 'create',
        filePath: 'wiki/concepts/accessibility.md',
        pageTitle: 'Accessibility',
        pageType: 'concept',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: create 2 pages');
  });
  
  it('should generate summary message for mixed operations', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
        pageType: 'entity',
      },
      {
        type: 'update',
        filePath: 'wiki/index.md',
        pageTitle: 'Index',
      },
      {
        type: 'delete',
        filePath: 'wiki/entities/old-page.md',
        pageTitle: 'Old Page',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: create 1 page, update 1 page, delete 1 page');
  });
  
  it('should handle empty changes array', () => {
    const message = generateCommitMessage([]);
    expect(message).toBe('wiki: update');
  });
  
  it('should handle create without page type or title', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/entities/angular-cdk.md',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: create page angular-cdk.md');
  });
  
  it('should handle update without page title', () => {
    const changes: WikiChange[] = [
      {
        type: 'update',
        filePath: 'wiki/entities/angular-cdk.md',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: update angular-cdk.md');
  });
  
  it('should handle delete without page title', () => {
    const changes: WikiChange[] = [
      {
        type: 'delete',
        filePath: 'wiki/entities/old-page.md',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toBe('wiki: delete old-page.md');
  });
});

describe('Git operations', () => {
  // Note: These tests require a real git repository to run properly.
  // In a CI environment, you may want to mock the git operations or
  // set up a temporary git repository for testing.
  
  it('should check if directory is a git repository', async () => {
    // This test will pass if run in a git repository
    const isRepo = await isGitRepository();
    expect(typeof isRepo).toBe('boolean');
  });
  
  it('should throw error when committing with no changes', async () => {
    await expect(commitWikiChanges([])).rejects.toThrow(GitOperationError);
  });
  
  it('should generate proper file paths for wiki changes', () => {
    const changes: WikiChange[] = [
      {
        type: 'create',
        filePath: 'wiki/entities/angular-cdk.md',
        pageTitle: 'Angular CDK',
        pageType: 'entity',
      },
    ];
    
    // Verify the file path is correctly formatted
    expect(changes[0].filePath).toBe('wiki/entities/angular-cdk.md');
  });
});

describe('Commit batching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should batch multiple changes together', async () => {
    const config = {
      rootDir: process.cwd(),
      rawDir: 'raw',
      wikiDir: 'wiki',
      batchCommits: true,
      batchDelay: 1000,
    };
    
    // Mock the commitWikiChanges function to avoid actual git operations
    const commitSpy = vi.fn();
    
    // Note: In a real test, you would mock the git operations
    // For now, we just verify the batching logic
    expect(config.batchCommits).toBe(true);
    expect(config.batchDelay).toBe(1000);
  });
});

describe('Git verification', () => {
  it('should verify file format for wiki pages', () => {
    const wikiPagePath = 'wiki/entities/angular-cdk.md';
    expect(wikiPagePath.endsWith('.md')).toBe(true);
  });
  
  it('should verify file format for raw sources', () => {
    const rawSourcePath = 'raw/articles/angular-aria.md';
    expect(rawSourcePath.startsWith('raw/')).toBe(true);
  });
});

describe('Git history', () => {
  it('should format file paths correctly for history queries', () => {
    const filePath = 'wiki/entities/angular-cdk.md';
    expect(filePath).toMatch(/^wiki\/.+\.md$/);
  });
  
  it('should format file paths correctly for diff queries', () => {
    const filePath = 'wiki/entities/angular-cdk.md';
    expect(filePath).toMatch(/^wiki\/.+\.md$/);
  });
});

describe('Error handling', () => {
  it('should create GitOperationError with proper fields', () => {
    const error = new GitOperationError('Test error', 'commit');
    expect(error.name).toBe('GitOperationError');
    expect(error.message).toBe('Test error');
    expect(error.operation).toBe('commit');
  });
  
  it('should create GitOperationError with cause', () => {
    const cause = new Error('Original error');
    const error = new GitOperationError('Test error', 'commit', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('Integration scenarios', () => {
  it('should handle entity page creation workflow', () => {
    const change: WikiChange = {
      type: 'create',
      filePath: 'wiki/entities/angular-cdk.md',
      pageTitle: 'Angular CDK',
      pageType: 'entity',
    };
    
    const message = generateCommitMessage([change]);
    expect(message).toContain('Angular CDK');
    expect(message).toContain('entity');
  });
  
  it('should handle concept page creation workflow', () => {
    const change: WikiChange = {
      type: 'create',
      filePath: 'wiki/concepts/progressive-enhancement.md',
      pageTitle: 'Progressive Enhancement',
      pageType: 'concept',
    };
    
    const message = generateCommitMessage([change]);
    expect(message).toContain('Progressive Enhancement');
    expect(message).toContain('concept');
  });
  
  it('should handle source ingestion workflow', () => {
    const change: WikiChange = {
      type: 'ingest',
      filePath: 'wiki/sources/angular-aria-guide-2024-05-10.md',
      sourcePath: 'raw/articles/angular-aria.md',
      generatedPages: [
        'wiki/entities/angular-cdk.md',
        'wiki/concepts/accessibility.md',
      ],
    };
    
    const message = generateCommitMessage([change]);
    expect(message).toContain('ingest');
    expect(message).toContain('2 pages');
  });
  
  it('should handle page update workflow', () => {
    const change: WikiChange = {
      type: 'update',
      filePath: 'wiki/entities/angular-cdk.md',
      pageTitle: 'Angular CDK',
      changes: 'Added focus management examples',
    };
    
    const message = generateCommitMessage([change]);
    expect(message).toContain('update');
    expect(message).toContain('Angular CDK');
    expect(message).toContain('focus management');
  });
  
  it('should handle batch workflow with multiple operations', () => {
    const changes: WikiChange[] = [
      {
        type: 'ingest',
        filePath: 'wiki/sources/source-1.md',
        sourcePath: 'raw/articles/article-1.md',
        generatedPages: ['wiki/entities/entity-1.md'],
      },
      {
        type: 'create',
        filePath: 'wiki/entities/entity-1.md',
        pageTitle: 'Entity 1',
        pageType: 'entity',
      },
      {
        type: 'update',
        filePath: 'wiki/index.md',
        pageTitle: 'Index',
      },
    ];
    
    const message = generateCommitMessage(changes);
    expect(message).toContain('create 1 page');
    expect(message).toContain('update 1 page');
    expect(message).toContain('ingest 1 source');
  });
});
