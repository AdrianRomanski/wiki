/**
 * Unit tests for ArtifactCoordinator
 * Feature: polished-research-workflow
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ArtifactCoordinator } from './ArtifactCoordinator';
import {
  Session,
  Phase,
  ArtifactType,
  ArtifactReference,
  SessionStatus,
  ResearchMode
} from '../types/core';
import { Decision, ComparisonData } from '../types/artifacts';

// Mock fs/promises
vi.mock('fs/promises');

describe('ArtifactCoordinator', () => {
  let coordinator: ArtifactCoordinator;
  let mockSession: Session;

  beforeEach(() => {
    coordinator = new ArtifactCoordinator('/test/sessions');
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    mockSession = createMockSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePhaseReport', () => {
    it('should generate a phase report with actions and artifacts', async () => {
      const artifact = await coordinator.generatePhaseReport(Phase.SETUP, mockSession);

      expect(artifact.type).toBe(ArtifactType.PHASE_REPORT);
      expect(artifact.name).toBe('setup-report.md');
      expect(artifact.content).toContain('# Phase Report: SETUP');
      expect(artifact.content).toContain(mockSession.metadata.goal);
      expect(artifact.content).toContain('focus-trap');
      expect(artifact.metadata.phase).toBe(Phase.SETUP);
      expect(artifact.metadata.relatedLibraries).toEqual(['focus-trap', '@angular/cdk']);
    });

    it('should include actions from phase history', async () => {
      const artifact = await coordinator.generatePhaseReport(Phase.SETUP, mockSession);

      expect(artifact.content).toContain('Installed focus-trap');
      expect(artifact.content).toContain('Installed @angular/cdk');
    });

    it('should handle phase with no history entry', async () => {
      const artifact = await coordinator.generatePhaseReport(Phase.PROTOTYPING, mockSession);

      expect(artifact.content).toContain('_No actions recorded._');
    });
  });

  describe('generateFinalReport', () => {
    it('should generate a comprehensive final report', async () => {
      const artifact = await coordinator.generateFinalReport(mockSession);

      expect(artifact.type).toBe(ArtifactType.FINAL_REPORT);
      expect(artifact.name).toBe('final-report.md');
      expect(artifact.content).toContain('# Final Research Report');
      expect(artifact.content).toContain(mockSession.metadata.goal);
      expect(artifact.content).toContain('focus-trap');
      expect(artifact.content).toContain('@angular/cdk');
    });

    it('should include documentation links when present', async () => {
      const artifact = await coordinator.generateFinalReport(mockSession);

      expect(artifact.content).toContain('https://docs.example.com');
    });

    it('should include phase summaries from history', async () => {
      const artifact = await coordinator.generateFinalReport(mockSession);

      expect(artifact.content).toContain('### SETUP');
      expect(artifact.content).toContain('Installed focus-trap');
    });

    it('should include all artifact references', async () => {
      const artifact = await coordinator.generateFinalReport(mockSession);

      expect(artifact.content).toContain('## All Artifacts');
      expect(artifact.content).toContain('focus-trap-big-picture.md');
    });
  });

  describe('generateADR', () => {
    it('should generate an ADR with all required sections', async () => {
      const decision = createMockDecision();
      const artifact = await coordinator.generateADR(mockSession, decision);

      expect(artifact.type).toBe(ArtifactType.ADR);
      expect(artifact.name).toBe('decision.adr.md');

      // Verify all required ADR sections exist
      expect(artifact.content).toContain('## Context and Problem Statement');
      expect(artifact.content).toContain('## Decision Drivers');
      expect(artifact.content).toContain('## Considered Options');
      expect(artifact.content).toContain('## Decision Outcome');
      expect(artifact.content).toContain('## Consequences');
      expect(artifact.content).toContain('## Comparison Summary');
    });

    it('should include the selected library in decision outcome', async () => {
      const decision = createMockDecision();
      const artifact = await coordinator.generateADR(mockSession, decision);

      expect(artifact.content).toContain('Chosen option: **focus-trap**');
    });

    it('should include rationale', async () => {
      const decision = createMockDecision();
      const artifact = await coordinator.generateADR(mockSession, decision);

      expect(artifact.content).toContain('Simpler API and smaller bundle size');
    });

    it('should include comparison table in comparison mode', async () => {
      const decision = createMockDecision();
      const artifact = await coordinator.generateADR(mockSession, decision);

      expect(artifact.content).toContain('| Dimension |');
      expect(artifact.content).toContain('| Complexity |');
      expect(artifact.content).toContain('| Modularity |');
    });

    it('should handle single mode without comparison table', async () => {
      mockSession.metadata.mode = ResearchMode.SINGLE;
      mockSession.metadata.libraries = [mockSession.metadata.libraries[0]];
      const decision = createMockDecision();

      const artifact = await coordinator.generateADR(mockSession, decision);

      expect(artifact.content).toContain('_Single library mode — no comparison data._');
    });
  });

  describe('generateResearchDecisionRecord', () => {
    it('should generate a research decision record', async () => {
      const artifact = await coordinator.generateResearchDecisionRecord(mockSession);

      expect(artifact.type).toBe(ArtifactType.RESEARCH_DECISION_RECORD);
      expect(artifact.name).toBe('research-decision-record.md');
      expect(artifact.content).toContain('# Research Decision Record');
      expect(artifact.content).toContain(mockSession.metadata.goal);
    });

    it('should include library details', async () => {
      const artifact = await coordinator.generateResearchDecisionRecord(mockSession);

      expect(artifact.content).toContain('### focus-trap');
      expect(artifact.content).toContain('### @angular/cdk');
    });

    it('should include prototype references', async () => {
      mockSession.artifacts.push({
        type: ArtifactType.PROTOTYPE,
        name: 'basic-trap.ts',
        path: 'prototypes/basic-trap.ts',
        createdAt: '2024-01-15T12:00:00Z'
      });

      const artifact = await coordinator.generateResearchDecisionRecord(mockSession);

      expect(artifact.content).toContain('## Code Examples');
      expect(artifact.content).toContain('basic-trap.ts');
    });

    it('should include documentation links', async () => {
      const artifact = await coordinator.generateResearchDecisionRecord(mockSession);

      expect(artifact.content).toContain('## References');
      expect(artifact.content).toContain('https://docs.example.com');
    });
  });

  describe('saveArtifact', () => {
    it('should save artifact to correct path based on type', async () => {
      const artifact = await coordinator.generateFinalReport(mockSession);
      const savedPath = await coordinator.saveArtifact(artifact, mockSession);

      expect(savedPath).toBe('final-report.md');
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('final-report.md'),
        artifact.content,
        'utf-8'
      );
    });

    it('should save big picture to library subdirectory', async () => {
      const artifact = await coordinator.generatePhaseReport(Phase.ANALYSIS, mockSession);
      // Create a big picture artifact manually
      const bigPicture = {
        type: ArtifactType.BIG_PICTURE,
        name: 'focus-trap-big-picture.md',
        content: '# Big Picture',
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.ANALYSIS,
          relatedLibraries: ['focus-trap'],
          tags: ['big-picture']
        }
      };

      const savedPath = await coordinator.saveArtifact(bigPicture, mockSession);

      expect(savedPath).toBe('libraries/focus-trap/big-picture.md');
    });

    it('should save prototype to prototypes directory', async () => {
      const prototype = {
        type: ArtifactType.PROTOTYPE,
        name: 'basic-example.ts',
        content: '// example code',
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.PROTOTYPING,
          relatedLibraries: ['focus-trap'],
          tags: ['prototype']
        }
      };

      const savedPath = await coordinator.saveArtifact(prototype, mockSession);

      expect(savedPath).toBe('prototypes/basic-example.ts');
    });

    it('should save phase report to phase-reports directory', async () => {
      const report = await coordinator.generatePhaseReport(Phase.SETUP, mockSession);
      const savedPath = await coordinator.saveArtifact(report, mockSession);

      expect(savedPath).toBe('phase-reports/setup-report.md');
    });

    it('should throw ArtifactGenerationError on file system failure', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('ENOSPC: no space left'));

      const artifact = await coordinator.generateFinalReport(mockSession);

      await expect(coordinator.saveArtifact(artifact, mockSession))
        .rejects.toThrow('Failed to save artifact');
    });
  });

  describe('listArtifacts', () => {
    it('should return all artifacts from session', async () => {
      const artifacts = await coordinator.listArtifacts(mockSession);

      expect(artifacts).toEqual(mockSession.artifacts);
      expect(artifacts).toHaveLength(1);
    });

    it('should return empty array for session with no artifacts', async () => {
      mockSession.artifacts = [];
      const artifacts = await coordinator.listArtifacts(mockSession);

      expect(artifacts).toEqual([]);
    });
  });

  describe('generateArtifactIndex', () => {
    it('should generate an index file with all artifacts', async () => {
      await coordinator.generateArtifactIndex(mockSession);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('artifacts-index.md'),
        expect.stringContaining('# Artifact Index'),
        'utf-8'
      );
    });

    it('should group artifacts by type', async () => {
      const sessionWithMultipleArtifacts = createMockSession();
      sessionWithMultipleArtifacts.artifacts.push({
        type: ArtifactType.PROTOTYPE,
        name: 'example.ts',
        path: 'prototypes/example.ts',
        createdAt: '2024-01-15T12:00:00Z'
      });

      // Clear any previous mock calls
      vi.mocked(fs.writeFile).mockClear();

      await coordinator.generateArtifactIndex(sessionWithMultipleArtifacts);

      const writeCalls = vi.mocked(fs.writeFile).mock.calls;
      expect(writeCalls.length).toBeGreaterThan(0);
      const indexCall = writeCalls.find(call => (call[0] as string).includes('artifacts-index.md'));
      expect(indexCall).toBeDefined();
      const content = indexCall![1] as string;

      expect(content).toContain('### Big Picture');
      expect(content).toContain('### Prototype');
      expect(content).toContain('**Total Artifacts**: 2');
    });

    it('should include artifact count', async () => {
      vi.mocked(fs.writeFile).mockClear();

      await coordinator.generateArtifactIndex(mockSession);

      const writeCalls = vi.mocked(fs.writeFile).mock.calls;
      const indexCall = writeCalls.find(call => (call[0] as string).includes('artifacts-index.md'));
      expect(indexCall).toBeDefined();
      const content = indexCall![1] as string;

      expect(content).toContain(`**Total Artifacts**: ${mockSession.artifacts.length}`);
    });

    it('should throw on file system error', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(coordinator.generateArtifactIndex(mockSession))
        .rejects.toThrow('Failed to generate artifact index');
    });
  });

  describe('artifact naming conventions', () => {
    it('should follow naming conventions for ADR', async () => {
      const decision = createMockDecision();
      const artifact = await coordinator.generateADR(mockSession, decision);
      const savedPath = await coordinator.saveArtifact(artifact, mockSession);

      expect(savedPath).toBe('decision.adr.md');
    });

    it('should sanitize scoped package names in paths', async () => {
      const bigPicture = {
        type: ArtifactType.BIG_PICTURE,
        name: 'angular-cdk-big-picture.md',
        content: '# Big Picture',
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.ANALYSIS,
          relatedLibraries: ['@angular/cdk'],
          tags: ['big-picture']
        }
      };

      const savedPath = await coordinator.saveArtifact(bigPicture, mockSession);

      expect(savedPath).toBe('libraries/angular-cdk/big-picture.md');
      expect(savedPath).not.toContain('@');
      expect(savedPath).not.toContain('//');
    });
  });
});

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createMockSession(): Session {
  return {
    id: 'focus-trap-research-2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
    status: SessionStatus.ACTIVE,
    currentPhase: Phase.ANALYSIS,
    completedPhases: [Phase.SETUP],
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
      }
    ]
  };
}

function createMockDecision(): Decision {
  const comparisonData: ComparisonData = {
    complexityScores: new Map([['focus-trap', 3], ['@angular/cdk', 5]]),
    modularityScores: new Map([['focus-trap', 6], ['@angular/cdk', 8]]),
    bundleSizes: new Map([
      ['focus-trap', { minified: 5000, gzipped: 2000, raw: 15000 }],
      ['@angular/cdk', { minified: 25000, gzipped: 8000, raw: 80000 }]
    ]),
    tokenEstimates: new Map([
      ['focus-trap', { setup: 100, implementation: 200, debugging: 50, total: 350, model: 'claude-3' }],
      ['@angular/cdk', { setup: 200, implementation: 400, debugging: 100, total: 700, model: 'claude-3' }]
    ])
  };

  return {
    selectedLibrary: 'focus-trap',
    rationale: 'Simpler API and smaller bundle size',
    comparisonData
  };
}
