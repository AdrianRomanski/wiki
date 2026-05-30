/**
 * Unit tests for ComparisonManager
 * Feature: polished-research-workflow
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonManager } from './ComparisonManager';
import {
  Session,
  Phase,
  ArtifactType,
  SessionStatus,
  ResearchMode,
  LibraryInfo
} from '../types/core';

describe('ComparisonManager', () => {
  let manager: ComparisonManager;

  beforeEach(() => {
    manager = new ComparisonManager();
  });

  describe('validateLibraryCount', () => {
    it('should accept 2 libraries', () => {
      expect(manager.validateLibraryCount(['lib-a', 'lib-b'])).toBe(true);
    });

    it('should accept 3 libraries', () => {
      expect(manager.validateLibraryCount(['lib-a', 'lib-b', 'lib-c'])).toBe(true);
    });

    it('should reject 0 libraries', () => {
      expect(manager.validateLibraryCount([])).toBe(false);
    });

    it('should reject 1 library', () => {
      expect(manager.validateLibraryCount(['lib-a'])).toBe(false);
    });

    it('should reject 4 libraries', () => {
      expect(manager.validateLibraryCount(['a', 'b', 'c', 'd'])).toBe(false);
    });

    it('should reject 5+ libraries', () => {
      expect(manager.validateLibraryCount(['a', 'b', 'c', 'd', 'e'])).toBe(false);
    });
  });

  describe('generateComparisonMatrices', () => {
    it('should generate matrices with correct structure for 2 libraries', () => {
      const libraries = createLibraries(2);
      const data = manager.generateComparisonMatrices(libraries);

      expect(data.complexityScores).toBeInstanceOf(Map);
      expect(data.modularityScores).toBeInstanceOf(Map);
      expect(data.bundleSizes).toBeInstanceOf(Map);
      expect(data.tokenEstimates).toBeInstanceOf(Map);
    });

    it('should generate matrices with correct structure for 3 libraries', () => {
      const libraries = createLibraries(3);
      const data = manager.generateComparisonMatrices(libraries);

      expect(data.complexityScores.size).toBe(3);
      expect(data.modularityScores.size).toBe(3);
      expect(data.bundleSizes.size).toBe(3);
      expect(data.tokenEstimates.size).toBe(3);
    });

    it('should include an entry for each library in every dimension', () => {
      const libraries = createLibraries(2);
      const data = manager.generateComparisonMatrices(libraries);

      for (const lib of libraries) {
        expect(data.complexityScores.has(lib.name)).toBe(true);
        expect(data.modularityScores.has(lib.name)).toBe(true);
        expect(data.bundleSizes.has(lib.name)).toBe(true);
        expect(data.tokenEstimates.has(lib.name)).toBe(true);
      }
    });

    it('should use placeholder values (zeros) for scores', () => {
      const libraries = createLibraries(2);
      const data = manager.generateComparisonMatrices(libraries);

      for (const lib of libraries) {
        expect(data.complexityScores.get(lib.name)).toBe(0);
        expect(data.modularityScores.get(lib.name)).toBe(0);
      }
    });

    it('should use placeholder bundle sizes', () => {
      const libraries = createLibraries(2);
      const data = manager.generateComparisonMatrices(libraries);

      const bundleSize = data.bundleSizes.get(libraries[0].name);
      expect(bundleSize).toEqual({ minified: 0, gzipped: 0, raw: 0 });
    });

    it('should use placeholder token estimates with pending model', () => {
      const libraries = createLibraries(2);
      const data = manager.generateComparisonMatrices(libraries);

      const estimate = data.tokenEstimates.get(libraries[0].name);
      expect(estimate).toEqual({
        setup: 0,
        implementation: 0,
        debugging: 0,
        total: 0,
        model: 'pending'
      });
    });

    it('should throw WorkflowError for 1 library', () => {
      const libraries = createLibraries(1);

      expect(() => manager.generateComparisonMatrices(libraries))
        .toThrow('Comparison mode requires 2-3 libraries, got 1');
    });

    it('should throw WorkflowError for 4 libraries', () => {
      const libraries = createLibraries(4);

      expect(() => manager.generateComparisonMatrices(libraries))
        .toThrow('Comparison mode requires 2-3 libraries, got 4');
    });

    it('should throw WorkflowError for 0 libraries', () => {
      expect(() => manager.generateComparisonMatrices([]))
        .toThrow('Comparison mode requires 2-3 libraries, got 0');
    });
  });

  describe('generateComparisonReport', () => {
    it('should include all libraries in the report', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('focus-trap');
      expect(report).toContain('@angular/cdk');
    });

    it('should include the session goal', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain(session.metadata.goal);
    });

    it('should include comparison matrices section', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('## Comparison Matrices');
      expect(report).toContain('| Dimension |');
      expect(report).toContain('| Complexity |');
      expect(report).toContain('| Modularity |');
      expect(report).toContain('| Bundle Size (gzip) |');
      expect(report).toContain('| Token Usage |');
    });

    it('should include per-library analysis section', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('## Per-Library Analysis');
      expect(report).toContain('### focus-trap');
      expect(report).toContain('### @angular/cdk');
    });

    it('should include documentation references when present', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('## Documentation References');
      expect(report).toContain('https://docs.example.com');
    });

    it('should include analysis artifacts section when big pictures exist', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('## Analysis Artifacts');
      expect(report).toContain('focus-trap-big-picture.md');
    });

    it('should include prototypes section when prototypes exist', () => {
      const session = createMockSession();
      session.artifacts.push({
        type: ArtifactType.PROTOTYPE,
        name: 'focus-trap-example.ts',
        path: 'prototypes/focus-trap-example.ts',
        createdAt: '2024-01-15T12:00:00Z'
      });

      const report = manager.generateComparisonReport(session);

      expect(report).toContain('## Prototypes');
      expect(report).toContain('focus-trap-example.ts');
    });

    it('should include library version information', () => {
      const session = createMockSession();
      const report = manager.generateComparisonReport(session);

      expect(report).toContain('7.5.4');
      expect(report).toContain('17.0.0');
    });
  });

  describe('getLibraryComparisonSummary', () => {
    it('should return a summary for each library', () => {
      const session = createMockSession();
      const summaries = manager.getLibraryComparisonSummary(session);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].libraryName).toBe('focus-trap');
      expect(summaries[1].libraryName).toBe('@angular/cdk');
    });

    it('should correctly count artifacts per library', () => {
      const session = createMockSession();
      // Session already has a focus-trap big picture artifact
      const summaries = manager.getLibraryComparisonSummary(session);

      const focusTrapSummary = summaries.find(s => s.libraryName === 'focus-trap');
      expect(focusTrapSummary!.artifactCount).toBe(1);
    });

    it('should correctly count prototypes per library', () => {
      const session = createMockSession();
      session.artifacts.push({
        type: ArtifactType.PROTOTYPE,
        name: 'focus-trap-modal-example.ts',
        path: 'prototypes/focus-trap-modal-example.ts',
        createdAt: '2024-01-15T12:00:00Z'
      });

      const summaries = manager.getLibraryComparisonSummary(session);

      const focusTrapSummary = summaries.find(s => s.libraryName === 'focus-trap');
      expect(focusTrapSummary!.prototypeCount).toBe(1);
    });

    it('should return zero counts for libraries with no artifacts', () => {
      const session = createMockSession();
      // Remove all artifacts
      session.artifacts = [];

      const summaries = manager.getLibraryComparisonSummary(session);

      for (const summary of summaries) {
        expect(summary.artifactCount).toBe(0);
        expect(summary.prototypeCount).toBe(0);
      }
    });

    it('should handle scoped package names correctly', () => {
      const session = createMockSession();
      session.artifacts.push({
        type: ArtifactType.BIG_PICTURE,
        name: 'angular-cdk-big-picture.md',
        path: 'libraries/angular-cdk/big-picture.md',
        createdAt: '2024-01-15T11:30:00Z'
      });

      const summaries = manager.getLibraryComparisonSummary(session);

      const cdkSummary = summaries.find(s => s.libraryName === '@angular/cdk');
      expect(cdkSummary!.artifactCount).toBe(1);
    });
  });
});

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createLibraries(count: number): LibraryInfo[] {
  const names = ['focus-trap', '@angular/cdk', 'aria-modal', 'extra-lib'];
  return names.slice(0, count).map(name => ({
    name,
    version: '1.0.0',
    installedAt: '2024-01-15T10:00:00Z',
    installPath: `node_modules/${name}`
  }));
}

function createMockSession(): Session {
  return {
    id: 'comparison-research-2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
    status: SessionStatus.ACTIVE,
    currentPhase: Phase.DECISION,
    completedPhases: [Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING],
    metadata: {
      goal: 'Compare focus trap libraries for modal dialog',
      mode: ResearchMode.COMPARISON,
      libraries: [
        {
          name: 'focus-trap',
          version: '7.5.4',
          installedAt: '2024-01-15T10:05:00Z',
          installPath: 'node_modules/focus-trap'
        },
        {
          name: '@angular/cdk',
          version: '17.0.0',
          installedAt: '2024-01-15T10:06:00Z',
          installPath: 'node_modules/@angular/cdk'
        }
      ],
      documentationLinks: ['https://docs.example.com'],
      userInputs: { bigPictureRequested: true }
    },
    artifacts: [
      {
        type: ArtifactType.BIG_PICTURE,
        name: 'focus-trap-big-picture.md',
        path: 'libraries/focus-trap/big-picture.md',
        createdAt: '2024-01-15T11:00:00Z'
      }
    ],
    history: [
      {
        phase: Phase.SETUP,
        startedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:30:00Z',
        actions: ['Installed focus-trap', 'Installed @angular/cdk']
      },
      {
        phase: Phase.ANALYSIS,
        startedAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T11:30:00Z',
        actions: ['Generated big picture for focus-trap', 'Generated big picture for @angular/cdk']
      }
    ]
  };
}
