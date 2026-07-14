/**
 * Unit tests for reciprocal reference insertion
 * Feature: article-research-session, scripts-migration-hexagonal
 *
 * Migrated from scripts/research-workflow/wiki-publisher/reciprocal-references.test.ts
 *
 * `addReciprocalReferences` now takes `(fs: FileSystemPort, ...)` instead of
 * `(workspaceRoot: string, ...)` and is async. Real `os.tmpdir()` fixtures are
 * replaced with a `FakeFileSystemPort` in-memory test double.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { addReciprocalReferences } from './reciprocal-references';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';

describe('addReciprocalReferences', () => {
  let fs: FakeFileSystemPort;

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('adds a Sources section with WikiLink to a page that has no Sources section', async () => {
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

    fs.setWikiFile('entities/rxjs.md', entityContent);

    const failures = await addReciprocalReferences(
      fs,
      'Understanding Reactive Streams — 2025-01-15',
      ['wiki/entities/rxjs.md']
    );

    expect(failures).toEqual([]);

    const updatedContent = fs.getWikiFile('entities/rxjs.md')!;
    expect(updatedContent).toContain('## Sources');
    expect(updatedContent).toContain('- [[Understanding Reactive Streams — 2025-01-15]]');
  });

  it('appends WikiLink to an existing Sources section', async () => {
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

    fs.setWikiFile('entities/angular-signals.md', entityContent);

    const failures = await addReciprocalReferences(fs, 'Fine-Grained Reactivity — 2025-02-20', [
      'wiki/entities/angular-signals.md',
    ]);

    expect(failures).toEqual([]);

    const updatedContent = fs.getWikiFile('entities/angular-signals.md')!;
    expect(updatedContent).toContain('- [[Previous Article — 2024-12-01]]');
    expect(updatedContent).toContain('- [[Fine-Grained Reactivity — 2025-02-20]]');
  });

  it('records a FailedReference when target page does not exist', async () => {
    const failures = await addReciprocalReferences(fs, 'Some Article — 2025-03-01', [
      'wiki/entities/nonexistent.md',
    ]);

    expect(failures).toHaveLength(1);
    expect(failures[0]).toEqual({
      targetPage: 'wiki/entities/nonexistent.md',
      sourcePage: 'Some Article — 2025-03-01',
      reason: 'File does not exist: wiki/entities/nonexistent.md',
    });
  });

  it('preserves successful references when some targets fail', async () => {
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

    fs.setWikiFile('entities/typescript.md', entityContent);

    const failures = await addReciprocalReferences(fs, 'Advanced Types — 2025-04-01', [
      'wiki/entities/typescript.md',
      'wiki/entities/nonexistent.md',
      'wiki/concepts/missing.md',
    ]);

    const updatedContent = fs.getWikiFile('entities/typescript.md')!;
    expect(updatedContent).toContain('- [[Advanced Types — 2025-04-01]]');

    expect(failures).toHaveLength(2);
    expect(failures[0].targetPage).toBe('wiki/entities/nonexistent.md');
    expect(failures[1].targetPage).toBe('wiki/concepts/missing.md');
  });

  it('skips adding a duplicate reference if already present', async () => {
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

    fs.setWikiFile('entities/rxjs.md', entityContent);

    const failures = await addReciprocalReferences(fs, 'My Article — 2025-01-15', ['wiki/entities/rxjs.md']);

    expect(failures).toEqual([]);

    const updatedContent = fs.getWikiFile('entities/rxjs.md')!;
    const occurrences = updatedContent.split('[[My Article — 2025-01-15]]').length - 1;
    expect(occurrences).toBe(1);
  });

  it('handles multiple target pages successfully', async () => {
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

    fs.setWikiFile('entities/angular.md', entityContent);
    fs.setWikiFile('concepts/dependency-injection.md', conceptContent);

    const failures = await addReciprocalReferences(fs, 'Angular DI Guide — 2025-05-01', [
      'wiki/entities/angular.md',
      'wiki/concepts/dependency-injection.md',
    ]);

    expect(failures).toEqual([]);

    const entityUpdated = fs.getWikiFile('entities/angular.md')!;
    expect(entityUpdated).toContain('## Sources');
    expect(entityUpdated).toContain('- [[Angular DI Guide — 2025-05-01]]');

    const conceptUpdated = fs.getWikiFile('concepts/dependency-injection.md')!;
    expect(conceptUpdated).toContain('## Sources');
    expect(conceptUpdated).toContain('- [[Angular DI Guide — 2025-05-01]]');
  });

  it('returns empty array when all targets succeed', async () => {
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

    fs.setWikiFile('entities/test-page.md', content);

    const failures = await addReciprocalReferences(fs, 'Source Article — 2025-06-01', [
      'wiki/entities/test-page.md',
    ]);

    expect(failures).toEqual([]);
  });

  it('returns empty array for empty target pages array', async () => {
    const failures = await addReciprocalReferences(fs, 'Some Article — 2025-01-01', []);

    expect(failures).toEqual([]);
  });

  it('preserves existing content when adding Sources section', async () => {
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

    fs.setWikiFile('entities/vue.md', entityContent);

    const failures = await addReciprocalReferences(fs, 'Vue 3 Composition API — 2025-07-01', [
      'wiki/entities/vue.md',
    ]);

    expect(failures).toEqual([]);

    const updatedContent = fs.getWikiFile('entities/vue.md')!;
    expect(updatedContent).toContain('# Vue');
    expect(updatedContent).toContain('## Definition');
    expect(updatedContent).toContain('Vue is a progressive JavaScript framework.');
    expect(updatedContent).toContain('## Properties');
    expect(updatedContent).toContain('- Reactive data binding');
    expect(updatedContent).toContain('## References');
    expect(updatedContent).toContain('- [[Some Other Source]]');
    expect(updatedContent).toContain('## Sources');
    expect(updatedContent).toContain('- [[Vue 3 Composition API — 2025-07-01]]');
  });
});
