import { describe, it, expect } from 'vitest';
import { validateWorkflowOptions } from './interfaces';

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
