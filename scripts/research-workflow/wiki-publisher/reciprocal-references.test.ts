/**
 * Unit tests for reciprocal reference insertion
 * Feature: article-research-session
 * Requirements: 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { addReciprocalReferences } from './reciprocal-references';

describe('addReciprocalReferences', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-reciprocal-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki', 'concepts'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('adds a Sources section with WikiLink to a page that has no Sources section', () => {
    const entityContent = [
      '---',
      'title: "RxJS"',
      'type: entity',
      'tags: [rxjs, reactive]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# RxJS',
      '',
      '## Definition',
      '',
      'RxJS is a reactive extensions library.',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/rxjs.md'), entityContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Understanding Reactive Streams — 2025-01-15',
      ['wiki/entities/rxjs.md']
    );

    expect(failures).toEqual([]);

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/rxjs.md'), 'utf-8');
    expect(updatedContent).toContain('## Sources');
    expect(updatedContent).toContain('- [[Understanding Reactive Streams — 2025-01-15]]');
  });

  it('appends WikiLink to an existing Sources section', () => {
    const entityContent = [
      '---',
      'title: "Angular Signals"',
      'type: entity',
      'tags: [angular, signals]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# Angular Signals',
      '',
      '## Definition',
      '',
      'Angular Signals is a reactive primitive.',
      '',
      '## Sources',
      '',
      '- [[Previous Article — 2024-12-01]]',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/angular-signals.md'), entityContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Fine-Grained Reactivity — 2025-02-20',
      ['wiki/entities/angular-signals.md']
    );

    expect(failures).toEqual([]);

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/angular-signals.md'), 'utf-8');
    expect(updatedContent).toContain('- [[Previous Article — 2024-12-01]]');
    expect(updatedContent).toContain('- [[Fine-Grained Reactivity — 2025-02-20]]');
  });

  it('records a FailedReference when target page does not exist', () => {
    const failures = addReciprocalReferences(
      workspaceRoot,
      'Some Article — 2025-03-01',
      ['wiki/entities/nonexistent.md']
    );

    expect(failures).toHaveLength(1);
    expect(failures[0]).toEqual({
      targetPage: 'wiki/entities/nonexistent.md',
      sourcePage: 'Some Article — 2025-03-01',
      reason: 'File does not exist: wiki/entities/nonexistent.md',
    });
  });

  it('preserves successful references when some targets fail', () => {
    const entityContent = [
      '---',
      'title: "TypeScript"',
      'type: entity',
      'tags: [typescript]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# TypeScript',
      '',
      '## Definition',
      '',
      'TypeScript is a typed superset of JavaScript.',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/typescript.md'), entityContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Advanced Types — 2025-04-01',
      ['wiki/entities/typescript.md', 'wiki/entities/nonexistent.md', 'wiki/concepts/missing.md']
    );

    // TypeScript page should have been updated successfully
    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/typescript.md'), 'utf-8');
    expect(updatedContent).toContain('- [[Advanced Types — 2025-04-01]]');

    // Two failures reported
    expect(failures).toHaveLength(2);
    expect(failures[0].targetPage).toBe('wiki/entities/nonexistent.md');
    expect(failures[1].targetPage).toBe('wiki/concepts/missing.md');
  });

  it('skips adding a duplicate reference if already present', () => {
    const entityContent = [
      '---',
      'title: "RxJS"',
      'type: entity',
      'tags: [rxjs]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# RxJS',
      '',
      '## Sources',
      '',
      '- [[My Article — 2025-01-15]]',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/rxjs.md'), entityContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'My Article — 2025-01-15',
      ['wiki/entities/rxjs.md']
    );

    expect(failures).toEqual([]);

    // Content should remain unchanged (no duplicate)
    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/rxjs.md'), 'utf-8');
    const occurrences = updatedContent.split('[[My Article — 2025-01-15]]').length - 1;
    expect(occurrences).toBe(1);
  });

  it('handles multiple target pages successfully', () => {
    const entityContent = [
      '---',
      'title: "Angular"',
      'type: entity',
      'tags: [angular]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# Angular',
      '',
      '## Definition',
      '',
      'Angular is a web framework.',
      '',
    ].join('\n');

    const conceptContent = [
      '---',
      'title: "Dependency Injection"',
      'type: concept',
      'tags: [di, pattern]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# Dependency Injection',
      '',
      '## Explanation',
      '',
      'DI is a design pattern.',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/angular.md'), entityContent, 'utf-8');
    writeFileSync(join(workspaceRoot, 'wiki/concepts/dependency-injection.md'), conceptContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Angular DI Guide — 2025-05-01',
      ['wiki/entities/angular.md', 'wiki/concepts/dependency-injection.md']
    );

    expect(failures).toEqual([]);

    const entityUpdated = readFileSync(join(workspaceRoot, 'wiki/entities/angular.md'), 'utf-8');
    expect(entityUpdated).toContain('## Sources');
    expect(entityUpdated).toContain('- [[Angular DI Guide — 2025-05-01]]');

    const conceptUpdated = readFileSync(join(workspaceRoot, 'wiki/concepts/dependency-injection.md'), 'utf-8');
    expect(conceptUpdated).toContain('## Sources');
    expect(conceptUpdated).toContain('- [[Angular DI Guide — 2025-05-01]]');
  });

  it('returns empty array when all targets succeed', () => {
    const content = [
      '---',
      'title: "Test Page"',
      'type: entity',
      'tags: [test]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# Test Page',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/test-page.md'), content, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Source Article — 2025-06-01',
      ['wiki/entities/test-page.md']
    );

    expect(failures).toEqual([]);
  });

  it('returns empty array for empty target pages array', () => {
    const failures = addReciprocalReferences(
      workspaceRoot,
      'Some Article — 2025-01-01',
      []
    );

    expect(failures).toEqual([]);
  });

  it('preserves existing content when adding Sources section', () => {
    const entityContent = [
      '---',
      'title: "Vue"',
      'type: entity',
      'tags: [vue, framework]',
      'created: "2025-01-01"',
      'updated: "2025-01-01"',
      '---',
      '',
      '# Vue',
      '',
      '## Definition',
      '',
      'Vue is a progressive JavaScript framework.',
      '',
      '## Properties',
      '',
      '- Reactive data binding',
      '- Component-based architecture',
      '',
      '## References',
      '',
      '- [[Some Other Source]]',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/vue.md'), entityContent, 'utf-8');

    const failures = addReciprocalReferences(
      workspaceRoot,
      'Vue 3 Composition API — 2025-07-01',
      ['wiki/entities/vue.md']
    );

    expect(failures).toEqual([]);

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/vue.md'), 'utf-8');
    // Original content preserved
    expect(updatedContent).toContain('# Vue');
    expect(updatedContent).toContain('## Definition');
    expect(updatedContent).toContain('Vue is a progressive JavaScript framework.');
    expect(updatedContent).toContain('## Properties');
    expect(updatedContent).toContain('- Reactive data binding');
    expect(updatedContent).toContain('## References');
    expect(updatedContent).toContain('- [[Some Other Source]]');
    // New Sources section added
    expect(updatedContent).toContain('## Sources');
    expect(updatedContent).toContain('- [[Vue 3 Composition API — 2025-07-01]]');
  });
});
