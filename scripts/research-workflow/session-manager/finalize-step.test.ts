/**
 * Unit tests for FINALIZE step orchestration
 * Feature: article-research-session
 * Requirements: 6.1, 6.7, 6.8, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getFindingsSummaryForReview,
  declinePublication,
  acceptPublication,
  finalizeSession,
} from './finalize-step';

describe('finalize-step', () => {
  let workspaceRoot: string;
  let sessionDir: string;

  beforeEach(() => {
    workspaceRoot = join(tmpdir(), `finalize-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    sessionDir = join(workspaceRoot, '.kiro/research/sessions/test-session');
    mkdirSync(sessionDir, { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/sources'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/entities'), { recursive: true });
    mkdirSync(join(workspaceRoot, 'wiki/concepts'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspaceRoot)) {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  function writeSessionJson(overrides: Record<string, unknown> = {}): void {
    const session = {
      id: 'test-session',
      topic: 'Test Article Research',
      state: 'FINALIZE',
      scope: 'article',
      createdAt: '2024-05-15',
      articleInputType: 'url',
      articleUrl: 'https://example.com/article',
      articleTitle: 'Understanding Signals in Angular',
      articleAuthor: 'Jane Doe',
      articleDate: '2024-05-01',
      ...overrides,
    };
    writeFileSync(join(sessionDir, 'session.json'), JSON.stringify(session, null, 2), 'utf-8');
  }

  function writeFindingsSummary(): void {
    const content = `# Findings Summary: Understanding Signals in Angular

## Document Metadata
- **Article Title:** Understanding Signals in Angular
- **Author:** Jane Doe
- **Date:** 2024-05-01
- **Source URL:** https://example.com/article
- **Session Scope:** article
- **Research Date:** 2024-05-15

## Key Insights
- Angular Signals provide fine-grained reactivity without RxJS.
- Signals simplify state management in components.

## Identified Entities

- **Angular Signals** — A reactive primitive for managing state in Angular applications.
- **RxJS** — A library for reactive programming using observables.

## Identified Concepts

- **Fine-grained Reactivity** — A pattern where only the specific parts of the UI that depend on changed data are updated.
- **Signal-based State Management** — Managing component state using signal primitives instead of observables.

## Recommended Wiki Pages

| Path | Type | Rationale |
|------|------|-----------|
| wiki/sources/understanding-signals-in-angular.md | source | Preserves the article as a citable source. |
| wiki/entities/angular-signals.md | entity | Documents Angular Signals as a reusable knowledge base entry. |
| wiki/entities/rxjs.md | entity | Documents RxJS as a reusable knowledge base entry. |
| wiki/concepts/fine-grained-reactivity.md | concept | Captures the concept for cross-referencing. |
| wiki/concepts/signal-based-state-management.md | concept | Captures the concept for cross-referencing. |

## Session Artifacts

- \`article-analysis.md\`
- \`article-content.json\`
- \`raw-article.md\`
- \`session.json\`
`;
    writeFileSync(join(sessionDir, 'findings-summary.md'), content, 'utf-8');
  }

  describe('getFindingsSummaryForReview', () => {
    it('should return the contents of findings-summary.md', async () => {
      writeFindingsSummary();

      const result = await getFindingsSummaryForReview(sessionDir);

      expect(result).toContain('# Findings Summary: Understanding Signals in Angular');
      expect(result).toContain('## Key Insights');
      expect(result).toContain('## Identified Entities');
      expect(result).toContain('## Identified Concepts');
    });

    it('should throw if findings-summary.md does not exist', async () => {
      await expect(getFindingsSummaryForReview(sessionDir)).rejects.toThrow();
    });
  });

  describe('declinePublication', () => {
    it('should record wikiPages as empty array and transition to FINALIZED', async () => {
      writeSessionJson();

      await declinePublication(sessionDir);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toEqual([]);
      expect(session.finalizedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('acceptPublication', () => {
    it('should create source page, entity pages, and concept pages', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // Source page should be created
      expect(result.sourcePagePath).toMatch(/^wiki\/sources\/.*\.md$/);
      expect(existsSync(join(workspaceRoot, result.sourcePagePath))).toBe(true);

      // Entity pages should be created
      expect(result.entityResults.created.length).toBeGreaterThan(0);

      // Concept pages should be created
      expect(result.conceptResults.created.length).toBeGreaterThan(0);

      // All created pages should be collected
      expect(result.allCreatedPages.length).toBeGreaterThan(0);
      expect(result.allCreatedPages).toContain(result.sourcePagePath);
    });

    it('should add reciprocal references to created entity/concept pages', async () => {
      writeSessionJson();
      writeFindingsSummary();

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // Check that entity pages have reciprocal references
      for (const entityPath of result.entityResults.created) {
        const content = readFileSync(join(workspaceRoot, entityPath), 'utf-8');
        expect(content).toContain('## Sources');
        expect(content).toContain('[[Understanding Signals in Angular]]');
      }
    });

    it('should handle entity page write failures gracefully', async () => {
      writeSessionJson();
      writeFindingsSummary();

      // Create a file at the entities directory path to block directory creation
      rmSync(join(workspaceRoot, 'wiki/entities'), { recursive: true, force: true });
      // Create a file where the directory should be — this will cause mkdirSync to fail
      writeFileSync(join(workspaceRoot, 'wiki/entities'), 'blocking file', 'utf-8');

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // Entity pages should have failures since the directory is blocked
      expect(result.entityResults.failed.length).toBeGreaterThan(0);

      // Source page should still succeed
      expect(result.sourcePagePath).toBeDefined();
    });

    it('should include updated pages in allCreatedPages when pages already exist', async () => {
      writeSessionJson();
      writeFindingsSummary();

      // Pre-create an entity page
      const existingEntityPath = join(workspaceRoot, 'wiki/entities/angular-signals.md');
      writeFileSync(existingEntityPath, `---
title: "Angular Signals"
type: entity
tags: [angular, signals]
created: "2024-01-01"
updated: "2024-01-01"
---

# Angular Signals

## Definition

Existing content about Angular Signals.
`, 'utf-8');

      const result = await acceptPublication(workspaceRoot, sessionDir);

      // The existing entity should be in updated, not created
      expect(result.entityResults.updated).toContain('wiki/entities/angular-signals.md');
      expect(result.allCreatedPages).toContain('wiki/entities/angular-signals.md');
    });
  });

  describe('finalizeSession', () => {
    it('should record finalizedAt and wikiPages and transition to FINALIZED', async () => {
      writeSessionJson();

      const wikiPages = ['wiki/sources/test.md', 'wiki/entities/angular-signals.md'];
      await finalizeSession(sessionDir, wikiPages);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      expect(session.state).toBe('FINALIZED');
      expect(session.finalizedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(session.wikiPages).toEqual(wikiPages);
    });

    it('should record empty wikiPages array when no pages created', async () => {
      writeSessionJson();

      await finalizeSession(sessionDir, []);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toEqual([]);
    });

    it('should throw if session is not in FINALIZE state', async () => {
      writeSessionJson({ state: 'EXPLORE', articleTitle: undefined });

      await expect(finalizeSession(sessionDir, [])).rejects.toThrow();
    });

    it('should record finalizedAt as current date in YYYY-MM-DD format (Req 8.5)', async () => {
      writeSessionJson();

      await finalizeSession(sessionDir, []);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(session.finalizedAt).toBe(expectedDate);
    });

    it('should record wikiPages as paths relative to workspace root (Req 10.3)', async () => {
      writeSessionJson();

      const wikiPages = [
        'wiki/sources/understanding-signals-article-2024-05-15.md',
        'wiki/entities/angular-signals.md',
        'wiki/entities/rxjs.md',
        'wiki/concepts/fine-grained-reactivity.md',
        'wiki/concepts/signal-based-state-management.md',
      ];
      await finalizeSession(sessionDir, wikiPages);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      expect(session.wikiPages).toEqual(wikiPages);
      // All paths should be relative (not absolute)
      for (const page of session.wikiPages) {
        expect(page).not.toMatch(/^\//);
        expect(page).toMatch(/^wiki\//);
      }
    });

    it('should preserve all existing session fields when finalizing (Req 8.5)', async () => {
      writeSessionJson();

      await finalizeSession(sessionDir, ['wiki/sources/test.md']);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      // Original fields should be preserved
      expect(session.id).toBe('test-session');
      expect(session.topic).toBe('Test Article Research');
      expect(session.scope).toBe('article');
      expect(session.createdAt).toBe('2024-05-15');
      expect(session.articleInputType).toBe('url');
      expect(session.articleUrl).toBe('https://example.com/article');
      expect(session.articleTitle).toBe('Understanding Signals in Angular');
      expect(session.articleAuthor).toBe('Jane Doe');
      expect(session.articleDate).toBe('2024-05-01');
      // Finalization fields should be added
      expect(session.state).toBe('FINALIZED');
      expect(session.finalizedAt).toBeDefined();
      expect(session.wikiPages).toEqual(['wiki/sources/test.md']);
    });

    it('should handle finalization with a single wiki page', async () => {
      writeSessionJson();

      await finalizeSession(sessionDir, ['wiki/sources/my-article-article-2024-05-15.md']);

      const session = JSON.parse(readFileSync(join(sessionDir, 'session.json'), 'utf-8'));
      expect(session.state).toBe('FINALIZED');
      expect(session.wikiPages).toHaveLength(1);
      expect(session.wikiPages[0]).toBe('wiki/sources/my-article-article-2024-05-15.md');
    });
  });
});
