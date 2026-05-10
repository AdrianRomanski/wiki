/**
 * Unit tests for the complete ingestion workflow.
 * 
 * Tests cover:
 * - Running the complete workflow for a single source
 * - Batch processing multiple sources
 * - Workflow validation
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  runIngestionWorkflow,
  runBatchIngestionWorkflow,
  validateWorkflowOptions,
} from './workflow';
import { FileSystemConfig } from './filesystem';

describe('runIngestionWorkflow', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-workflow-test-'));
    
    // Create directory structure
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'sources'), { recursive: true });
    
    // Create index and activity log files with proper structure
    const indexContent = `# Wiki Index

## Overview

Welcome to the wiki.

## Entities

## Concepts

## Recent Sources

## Navigation
`;
    await fs.writeFile(path.join(tempDir, 'wiki', 'index.md'), indexContent);
    await fs.writeFile(path.join(tempDir, 'wiki', 'activity-log.md'), '# Activity Log\n\n---\n\n');
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should execute complete workflow for entity page', async () => {
    // Create raw source
    const content = '# Angular CDK\n\nComponent Dev Kit for Angular';
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'angular-cdk.md'), content);
    
    // Run workflow
    const result = await runIngestionWorkflow({
      sourcePath: 'articles/angular-cdk.md',
      entityOptions: {
        name: 'Angular CDK',
        definition: 'The Angular Component Dev Kit provides behavior primitives.',
        properties: ['Accessibility utilities', 'Layout helpers'],
        tags: ['angular', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    // Verify result
    expect(result.source).toBeDefined();
    expect(result.source.path).toBe('articles/angular-cdk.md');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('entity');
    expect(result.writtenPaths).toHaveLength(1);
    
    // Verify file was written
    const filePath = path.join(tempDir, 'wiki', result.writtenPaths[0]);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    // Note: Index and activity log updates use DEFAULT_CONFIG which points to actual project directories
    // In a real scenario, these would be updated, but in tests we can't easily verify this
    // without refactoring the index-manager and activity-log modules to accept config parameters
  });

  it('should execute complete workflow for concept page', async () => {
    const content = '# Progressive Enhancement\n\nA design philosophy';
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'progressive-enhancement.md'), content);
    
    const result = await runIngestionWorkflow({
      sourcePath: 'articles/progressive-enhancement.md',
      conceptOptions: {
        name: 'Progressive Enhancement',
        explanation: 'Progressive enhancement provides a baseline experience.',
        applications: ['Building accessible web apps'],
        tags: ['web-development', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('concept');
  });

  it('should execute complete workflow for source summary', async () => {
    const content = '# Angular ARIA Guide\n\nAccessibility guide';
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'angular-aria-guide.md'), content);
    
    const result = await runIngestionWorkflow({
      sourcePath: 'articles/angular-aria-guide.md',
      sourceSummaryOptions: {
        title: 'Angular ARIA Guide',
        author: 'Angular Team',
        date: '2024-05-10',
        keyPoints: ['Use semantic HTML', 'Test with screen readers'],
        tags: ['angular', 'accessibility'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].frontmatter.type).toBe('source');
  });

  it('should generate multiple pages from single source', async () => {
    const content = '# Comprehensive Guide\n\nCovers multiple topics';
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'comprehensive.md'), content);
    
    const result = await runIngestionWorkflow({
      sourcePath: 'articles/comprehensive.md',
      entityOptions: {
        name: 'Test Entity',
        definition: 'An entity for testing',
        tags: ['test'],
      },
      conceptOptions: {
        name: 'Test Concept',
        explanation: 'A concept for testing',
        tags: ['test'],
      },
      addCrossReferences: false,
      config,
    });
    
    expect(result.pages).toHaveLength(2);
    expect(result.writtenPaths).toHaveLength(2);
  });
});

describe('runBatchIngestionWorkflow', () => {
  let tempDir: string;
  let config: FileSystemConfig;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wiki-batch-test-'));
    
    await fs.mkdir(path.join(tempDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'raw', 'articles'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'entities'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'concepts'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'wiki', 'sources'), { recursive: true });
    
    const indexContent = `# Wiki Index

## Overview

Welcome to the wiki.

## Entities

## Concepts

## Recent Sources

## Navigation
`;
    await fs.writeFile(path.join(tempDir, 'wiki', 'index.md'), indexContent);
    await fs.writeFile(path.join(tempDir, 'wiki', 'activity-log.md'), '# Activity Log\n\n---\n\n');
    
    config = {
      rootDir: tempDir,
      rawDir: 'raw',
      wikiDir: 'wiki',
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should process multiple sources successfully', async () => {
    // Create multiple raw sources
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article1.md'), '# Article 1');
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article2.md'), '# Article 2');
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article3.md'), '# Article 3');
    
    const results = await runBatchIngestionWorkflow([
      {
        sourcePath: 'articles/article1.md',
        entityOptions: {
          name: 'Entity 1',
          definition: 'First entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
      {
        sourcePath: 'articles/article2.md',
        entityOptions: {
          name: 'Entity 2',
          definition: 'Second entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
      {
        sourcePath: 'articles/article3.md',
        entityOptions: {
          name: 'Entity 3',
          definition: 'Third entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
    ]);
    
    expect(results).toHaveLength(3);
    expect(results[0].pages[0].frontmatter.title).toBe('Entity 1');
    expect(results[1].pages[0].frontmatter.title).toBe('Entity 2');
    expect(results[2].pages[0].frontmatter.title).toBe('Entity 3');
  });

  it('should continue processing even if some sources fail', async () => {
    // Create only 2 out of 3 sources
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article1.md'), '# Article 1');
    // article2.md does not exist
    await fs.writeFile(path.join(tempDir, 'raw', 'articles', 'article3.md'), '# Article 3');
    
    const results = await runBatchIngestionWorkflow([
      {
        sourcePath: 'articles/article1.md',
        entityOptions: {
          name: 'Entity 1',
          definition: 'First entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
      {
        sourcePath: 'articles/article2.md', // This will fail
        entityOptions: {
          name: 'Entity 2',
          definition: 'Second entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
      {
        sourcePath: 'articles/article3.md',
        entityOptions: {
          name: 'Entity 3',
          definition: 'Third entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
    ]);
    
    // Should successfully process 2 out of 3
    expect(results).toHaveLength(2);
    expect(results[0].pages[0].frontmatter.title).toBe('Entity 1');
    expect(results[1].pages[0].frontmatter.title).toBe('Entity 3');
  });

  it('should return empty array when all sources fail', async () => {
    const results = await runBatchIngestionWorkflow([
      {
        sourcePath: 'articles/nonexistent1.md',
        entityOptions: {
          name: 'Entity 1',
          definition: 'First entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
      {
        sourcePath: 'articles/nonexistent2.md',
        entityOptions: {
          name: 'Entity 2',
          definition: 'Second entity',
          tags: ['test'],
        },
        addCrossReferences: false,
        config,
      },
    ]);
    
    expect(results).toEqual([]);
  });
});

describe('validateWorkflowOptions', () => {
  it('should validate valid entity options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      entityOptions: {
        name: 'Test Entity',
        definition: 'A test entity',
        tags: ['test'],
      },
    });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate valid concept options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      conceptOptions: {
        name: 'Test Concept',
        explanation: 'A test concept',
        tags: ['test'],
      },
    });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate valid source summary options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      sourceSummaryOptions: {
        title: 'Test Source',
        keyPoints: ['Point 1', 'Point 2'],
        tags: ['test'],
      },
    });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing source path', () => {
    const result = validateWorkflowOptions({
      sourcePath: '',
      entityOptions: {
        name: 'Test',
        definition: 'Test',
        tags: [],
      },
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('sourcePath is required');
  });

  it('should reject missing page options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one of entityOptions, conceptOptions, or sourceSummaryOptions must be provided');
  });

  it('should reject invalid entity options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      entityOptions: {
        name: '',
        definition: '',
        tags: [],
      },
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('entityOptions.name is required');
    expect(result.errors).toContain('entityOptions.definition is required');
  });

  it('should reject invalid concept options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      conceptOptions: {
        name: '',
        explanation: '',
        tags: [],
      },
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('conceptOptions.name is required');
    expect(result.errors).toContain('conceptOptions.explanation is required');
  });

  it('should reject invalid source summary options', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      sourceSummaryOptions: {
        title: '',
        keyPoints: [],
        tags: [],
      },
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('sourceSummaryOptions.title is required');
    expect(result.errors).toContain('sourceSummaryOptions.keyPoints must contain at least one point');
  });

  it('should validate multiple page options together', () => {
    const result = validateWorkflowOptions({
      sourcePath: 'articles/test.md',
      entityOptions: {
        name: 'Test Entity',
        definition: 'A test entity',
        tags: ['test'],
      },
      conceptOptions: {
        name: 'Test Concept',
        explanation: 'A test concept',
        tags: ['test'],
      },
    });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
