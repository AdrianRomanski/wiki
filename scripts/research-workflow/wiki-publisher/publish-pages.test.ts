/**
 * Unit tests for entity and concept page creation/update logic
 * Feature: article-research-session
 * Requirements: 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { publishEntityPages, publishConceptPages } from './publish-pages';
import { EntityCandidate, ConceptCandidate } from '../types/article-session';

describe('publishEntityPages', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'entities'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('creates a new entity page when file does not exist', () => {
    const entities: EntityCandidate[] = [
      {
        name: 'RxJS',
        description: 'A reactive extensions library for JavaScript.',
        proposedPath: 'wiki/entities/rxjs.md',
      },
    ];

    const result = publishEntityPages(workspaceRoot, entities, 'Understanding Reactive Streams', '2025-01-15');

    expect(result.created).toEqual(['wiki/entities/rxjs.md']);
    expect(result.updated).toEqual([]);
    expect(result.failed).toEqual([]);

    const content = readFileSync(join(workspaceRoot, 'wiki/entities/rxjs.md'), 'utf-8');
    expect(content).toContain('title: "RxJS"');
    expect(content).toContain('type: entity');
    expect(content).toContain('# RxJS');
    expect(content).toContain('A reactive extensions library for JavaScript.');
    expect(content).toContain('2025-01-15');
  });

  it('appends a reference section to an existing entity page', () => {
    const existingContent = [
      '---',
      'title: "Angular Signals"',
      'type: entity',
      'tags: [angular, signals]',
      'created: "2024-12-01"',
      'updated: "2024-12-01"',
      '---',
      '',
      '# Angular Signals',
      '',
      '## Definition',
      '',
      'Angular Signals is a reactive primitive.',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/angular-signals.md'), existingContent, 'utf-8');

    const entities: EntityCandidate[] = [
      {
        name: 'Angular Signals',
        description: 'A reactive primitive for Angular.',
        proposedPath: 'wiki/entities/angular-signals.md',
      },
    ];

    const result = publishEntityPages(workspaceRoot, entities, 'Fine-Grained Reactivity in Angular', '2025-02-20');

    expect(result.created).toEqual([]);
    expect(result.updated).toEqual(['wiki/entities/angular-signals.md']);
    expect(result.failed).toEqual([]);

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/angular-signals.md'), 'utf-8');
    // Existing content preserved
    expect(updatedContent).toContain('# Angular Signals');
    expect(updatedContent).toContain('Angular Signals is a reactive primitive.');
    // New section appended
    expect(updatedContent).toContain('## Referenced in: Fine-Grained Reactivity in Angular');
    expect(updatedContent).toContain('**Article:** Fine-Grained Reactivity in Angular');
    expect(updatedContent).toContain('**Date:** 2025-02-20');
    // Updated date in frontmatter
    expect(updatedContent).toContain('updated: "2025-02-20"');
  });

  it('preserves existing content intact when appending', () => {
    const existingContent = [
      '---',
      'title: "TypeScript"',
      'type: entity',
      'tags: [typescript, language]',
      'created: "2024-06-01"',
      'updated: "2024-06-01"',
      '---',
      '',
      '# TypeScript',
      '',
      '## Definition',
      '',
      'TypeScript is a typed superset of JavaScript.',
      '',
      '## Properties',
      '',
      '- Static type checking',
      '- Interfaces and generics',
      '',
      '## Examples',
      '',
      '```ts',
      'const x: number = 42;',
      '```',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/entities/typescript.md'), existingContent, 'utf-8');

    const entities: EntityCandidate[] = [
      {
        name: 'TypeScript',
        description: 'A typed superset of JavaScript.',
        proposedPath: 'wiki/entities/typescript.md',
      },
    ];

    publishEntityPages(workspaceRoot, entities, 'Advanced TypeScript Patterns', '2025-03-10');

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/entities/typescript.md'), 'utf-8');
    // All original sections preserved
    expect(updatedContent).toContain('## Definition');
    expect(updatedContent).toContain('TypeScript is a typed superset of JavaScript.');
    expect(updatedContent).toContain('## Properties');
    expect(updatedContent).toContain('- Static type checking');
    expect(updatedContent).toContain('- Interfaces and generics');
    expect(updatedContent).toContain('## Examples');
    expect(updatedContent).toContain('const x: number = 42;');
  });

  it('handles multiple entities with mixed create and update', () => {
    writeFileSync(
      join(workspaceRoot, 'wiki/entities/existing-lib.md'),
      '---\ntitle: "Existing Lib"\ntype: entity\ntags: [lib]\ncreated: "2024-01-01"\nupdated: "2024-01-01"\n---\n\n# Existing Lib\n',
      'utf-8'
    );

    const entities: EntityCandidate[] = [
      {
        name: 'Existing Lib',
        description: 'An existing library.',
        proposedPath: 'wiki/entities/existing-lib.md',
      },
      {
        name: 'New Framework',
        description: 'A brand new framework.',
        proposedPath: 'wiki/entities/new-framework.md',
      },
    ];

    const result = publishEntityPages(workspaceRoot, entities, 'Comparing Libraries', '2025-04-01');

    expect(result.created).toEqual(['wiki/entities/new-framework.md']);
    expect(result.updated).toEqual(['wiki/entities/existing-lib.md']);
    expect(result.failed).toEqual([]);
  });

  it('returns empty results for empty candidates array', () => {
    const result = publishEntityPages(workspaceRoot, [], 'Some Article', '2025-01-01');

    expect(result.created).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.failed).toEqual([]);
  });
});

describe('publishConceptPages', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `wiki-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(workspaceRoot, 'wiki', 'concepts'), { recursive: true });
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it('creates a new concept page when file does not exist', () => {
    const concepts: ConceptCandidate[] = [
      {
        name: 'Reactive Programming',
        description: 'A programming paradigm oriented around data flows and propagation of change.',
        proposedPath: 'wiki/concepts/reactive-programming.md',
      },
    ];

    const result = publishConceptPages(workspaceRoot, concepts, 'Intro to Reactive Streams', '2025-01-20');

    expect(result.created).toEqual(['wiki/concepts/reactive-programming.md']);
    expect(result.updated).toEqual([]);
    expect(result.failed).toEqual([]);

    const content = readFileSync(join(workspaceRoot, 'wiki/concepts/reactive-programming.md'), 'utf-8');
    expect(content).toContain('title: "Reactive Programming"');
    expect(content).toContain('type: concept');
    expect(content).toContain('# Reactive Programming');
    expect(content).toContain('A programming paradigm oriented around data flows and propagation of change.');
    expect(content).toContain('2025-01-20');
  });

  it('appends a reference section to an existing concept page', () => {
    const existingContent = [
      '---',
      'title: "Dependency Injection"',
      'type: concept',
      'tags: [di, pattern, architecture]',
      'created: "2024-11-01"',
      'updated: "2024-11-01"',
      '---',
      '',
      '# Dependency Injection',
      '',
      '## Explanation',
      '',
      'Dependency Injection is a design pattern for achieving IoC.',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/concepts/dependency-injection.md'), existingContent, 'utf-8');

    const concepts: ConceptCandidate[] = [
      {
        name: 'Dependency Injection',
        description: 'A design pattern for achieving IoC.',
        proposedPath: 'wiki/concepts/dependency-injection.md',
      },
    ];

    const result = publishConceptPages(workspaceRoot, concepts, 'Angular DI Deep Dive', '2025-05-15');

    expect(result.created).toEqual([]);
    expect(result.updated).toEqual(['wiki/concepts/dependency-injection.md']);
    expect(result.failed).toEqual([]);

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/concepts/dependency-injection.md'), 'utf-8');
    // Existing content preserved
    expect(updatedContent).toContain('# Dependency Injection');
    expect(updatedContent).toContain('Dependency Injection is a design pattern for achieving IoC.');
    // New section appended
    expect(updatedContent).toContain('## Referenced in: Angular DI Deep Dive');
    expect(updatedContent).toContain('**Article:** Angular DI Deep Dive');
    expect(updatedContent).toContain('**Date:** 2025-05-15');
    // Updated date in frontmatter
    expect(updatedContent).toContain('updated: "2025-05-15"');
  });

  it('preserves existing content intact when appending to concept page', () => {
    const existingContent = [
      '---',
      'title: "Observer Pattern"',
      'type: concept',
      'tags: [pattern, design-pattern]',
      'created: "2024-08-01"',
      'updated: "2024-08-01"',
      '---',
      '',
      '# Observer Pattern',
      '',
      '## Explanation',
      '',
      'The Observer pattern defines a one-to-many dependency.',
      '',
      '## Applications',
      '',
      '- Event systems',
      '- Reactive streams',
      '',
      '## Related Concepts',
      '',
      '- [[Reactive Programming]]',
      '- [[Pub/Sub]]',
      '',
    ].join('\n');

    writeFileSync(join(workspaceRoot, 'wiki/concepts/observer-pattern.md'), existingContent, 'utf-8');

    const concepts: ConceptCandidate[] = [
      {
        name: 'Observer Pattern',
        description: 'A behavioral design pattern.',
        proposedPath: 'wiki/concepts/observer-pattern.md',
      },
    ];

    publishConceptPages(workspaceRoot, concepts, 'Design Patterns in JS', '2025-06-01');

    const updatedContent = readFileSync(join(workspaceRoot, 'wiki/concepts/observer-pattern.md'), 'utf-8');
    // All original sections preserved
    expect(updatedContent).toContain('## Explanation');
    expect(updatedContent).toContain('The Observer pattern defines a one-to-many dependency.');
    expect(updatedContent).toContain('## Applications');
    expect(updatedContent).toContain('- Event systems');
    expect(updatedContent).toContain('- Reactive streams');
    expect(updatedContent).toContain('## Related Concepts');
    expect(updatedContent).toContain('- [[Reactive Programming]]');
    expect(updatedContent).toContain('- [[Pub/Sub]]');
  });

  it('handles multiple concepts with mixed create and update', () => {
    writeFileSync(
      join(workspaceRoot, 'wiki/concepts/existing-concept.md'),
      '---\ntitle: "Existing Concept"\ntype: concept\ntags: [concept]\ncreated: "2024-01-01"\nupdated: "2024-01-01"\n---\n\n# Existing Concept\n',
      'utf-8'
    );

    const concepts: ConceptCandidate[] = [
      {
        name: 'Existing Concept',
        description: 'An existing concept.',
        proposedPath: 'wiki/concepts/existing-concept.md',
      },
      {
        name: 'New Pattern',
        description: 'A brand new pattern.',
        proposedPath: 'wiki/concepts/new-pattern.md',
      },
    ];

    const result = publishConceptPages(workspaceRoot, concepts, 'Patterns Article', '2025-07-01');

    expect(result.created).toEqual(['wiki/concepts/new-pattern.md']);
    expect(result.updated).toEqual(['wiki/concepts/existing-concept.md']);
    expect(result.failed).toEqual([]);
  });

  it('returns empty results for empty candidates array', () => {
    const result = publishConceptPages(workspaceRoot, [], 'Some Article', '2025-01-01');

    expect(result.created).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.failed).toEqual([]);
  });

  it('creates directories recursively if they do not exist', () => {
    // Remove the pre-created concepts directory
    rmSync(join(workspaceRoot, 'wiki'), { recursive: true, force: true });

    const concepts: ConceptCandidate[] = [
      {
        name: 'Deep Nested Concept',
        description: 'A concept in a nested path.',
        proposedPath: 'wiki/concepts/deep-nested-concept.md',
      },
    ];

    const result = publishConceptPages(workspaceRoot, concepts, 'Nested Article', '2025-08-01');

    expect(result.created).toEqual(['wiki/concepts/deep-nested-concept.md']);
    expect(existsSync(join(workspaceRoot, 'wiki/concepts/deep-nested-concept.md'))).toBe(true);
  });
});
