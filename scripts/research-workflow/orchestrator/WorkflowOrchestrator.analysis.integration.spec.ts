/**
 * Integration tests for Phase 2: Analysis
 * Feature: polished-research-workflow
 * Requirements: 2.2
 *
 * These tests exercise the complete analysis flow end-to-end,
 * using real SessionManager with mocked I/O (prompts, BigPictureAnalyzer).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { SessionManager } from '../session/SessionManager';
import { UserPromptHandler } from '../prompts/UserPromptHandler';
import { LibraryInstallationManager } from '../installation/LibraryInstallationManager';
import { BigPictureAnalyzer } from '../analyzer/BigPictureAnalyzer';
import { Phase, ResearchMode, SessionStatus, ArtifactType } from '../types/core';
import type { LibraryAnalysis, StructureAnalysis, CapabilityCategories, EntryPoint, APIExport, DependencyInfo } from '../types/analysis';

describe('Phase 2: Analysis - Integration Tests', () => {
  const testBaseDir = path.join(process.cwd(), '.test-integration-analysis');
  let sessionManager: SessionManager;

  beforeEach(async () => {
    await fs.mkdir(testBaseDir, { recursive: true });
    sessionManager = new SessionManager(testBaseDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Creates a minimal LibraryAnalysis for mocking
   */
  function createMockAnalysis(libraryName: string, version: string = '1.0.0'): LibraryAnalysis {
    const structure: StructureAnalysis = {
      rootPath: `node_modules/${libraryName}`,
      directories: [{ name: 'src', path: `node_modules/${libraryName}/src`, children: [] }],
      files: [{ name: 'index.js', path: `node_modules/${libraryName}/index.js`, extension: '.js', size: 1024 }],
      totalFiles: 5,
      totalDirectories: 2
    };

    const capabilities: CapabilityCategories = {
      categories: new Map([
        ['core', [{ name: 'MainService', type: 'class', description: 'Main service', exportPath: './src/main' }]]
      ]),
      uncategorized: []
    };

    const entryPoints: EntryPoint[] = [
      { path: './index.js', type: 'main', exports: ['MainService', 'configure'] }
    ];

    const publicAPI: APIExport[] = [
      { name: 'MainService', type: 'class', signature: 'class MainService', documentation: null },
      { name: 'configure', type: 'function', signature: 'function configure(options: Options): void', documentation: null }
    ];

    const dependencies: DependencyInfo[] = [
      { name: 'tslib', version: '^2.0.0', type: 'dependency' }
    ];

    return { libraryName, version, structure, capabilities, entryPoints, publicAPI, dependencies };
  }

  /**
   * Creates a mock prompt handler with configurable responses
   */
  function createMockPromptHandler(overrides: Record<string, any> = {}) {
    return {
      promptForGoal: vi.fn().mockResolvedValue('Research libraries'),
      promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.SINGLE),
      promptForLibraries: vi.fn().mockResolvedValue(['focus-trap']),
      promptForDocumentationLinks: vi.fn().mockResolvedValue([]),
      promptForBigPictureAnalysis: vi.fn().mockResolvedValue(true),
      promptForPrototypeRequest: vi.fn().mockResolvedValue(null),
      promptForDecision: vi.fn().mockResolvedValue('focus-trap'),
      promptForDecisionRationale: vi.fn().mockResolvedValue('Best fit'),
      promptForWikiIntegration: vi.fn().mockResolvedValue(false),
      promptForPhaseSkip: vi.fn().mockResolvedValue(false),
      validateLibraries: vi.fn().mockReturnValue(true),
      confirmReinstall: vi.fn().mockResolvedValue(false),
      confirmSkipPhase: vi.fn().mockResolvedValue(false),
      confirmFinalization: vi.fn().mockResolvedValue(true),
      displayError: vi.fn(),
      displaySuccess: vi.fn(),
      displayInfo: vi.fn(),
      displayPhaseTransition: vi.fn(),
      displayPhaseProgress: vi.fn(),
      displayArtifactSummary: vi.fn(),
      ...overrides
    } as unknown as UserPromptHandler;
  }

  /**
   * Creates a mock installation manager
   */
  function createMockInstallationManager(libraries: string[] = ['focus-trap']) {
    return {
      installLibrary: vi.fn().mockImplementation(async (name: string) => ({
        libraryName: name,
        success: true,
        version: '1.0.0',
        error: null,
        installPath: `node_modules/${name}`
      })),
      verifyInstallation: vi.fn().mockResolvedValue(false),
      getInstalledVersion: vi.fn().mockResolvedValue('1.0.0'),
      reinstallLibrary: vi.fn().mockResolvedValue({ success: true }),
      installLibraries: vi.fn().mockResolvedValue([]),
      verifyLibraries: vi.fn().mockResolvedValue({ allVerified: true, results: new Map(), missingLibraries: [] }),
      isLibraryInstalled: vi.fn().mockResolvedValue(false),
      getLibraryInfo: vi.fn().mockResolvedValue({ name: '', version: null, path: '', installed: false }),
    } as unknown as LibraryInstallationManager;
  }

  /**
   * Creates a mock BigPictureAnalyzer
   */
  function createMockBigPictureAnalyzer(overrides: Record<string, any> = {}) {
    return {
      analyzeLibrary: vi.fn().mockImplementation(async (name: string) => createMockAnalysis(name)),
      generateVisualization: vi.fn().mockReturnValue('# Big Picture\n\nVisualization content'),
      generateComparisonView: vi.fn().mockReturnValue('# Comparison View\n\nComparison content'),
      analyzeStructure: vi.fn().mockResolvedValue({ rootPath: '', directories: [], files: [], totalFiles: 0, totalDirectories: 0 }),
      categorizeCapabilities: vi.fn().mockReturnValue({ categories: new Map(), uncategorized: [] }),
      identifyEntryPoints: vi.fn().mockResolvedValue([]),
      extractPublicAPI: vi.fn().mockResolvedValue([]),
      ...overrides
    } as unknown as BigPictureAnalyzer;
  }

  /**
   * Helper: runs setup phase to get orchestrator into ANALYSIS state
   */
  async function setupToAnalysisPhase(
    orchestrator: WorkflowOrchestrator
  ): Promise<void> {
    await orchestrator.executeSetupPhase();
    expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
  }

  describe('Big picture generation for single library', () => {
    it('should generate big picture and transition to PROTOTYPING', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(orchestrator.getCurrentPhase()).toBe(Phase.PROTOTYPING);
    });

    it('should call analyzeLibrary for the single library', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(analyzer.analyzeLibrary).toHaveBeenCalledWith('focus-trap');
      expect(analyzer.analyzeLibrary).toHaveBeenCalledTimes(1);
    });

    it('should generate visualization for the analyzed library', async () => {
      const mockAnalysis = createMockAnalysis('focus-trap', '7.5.4');
      const analyzer = createMockBigPictureAnalyzer({
        analyzeLibrary: vi.fn().mockResolvedValue(mockAnalysis)
      });
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(analyzer.generateVisualization).toHaveBeenCalledWith(mockAnalysis);
    });

    it('should save big picture artifact in session', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const bigPictureArtifacts = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
      expect(bigPictureArtifacts).toHaveLength(1);
      expect(bigPictureArtifacts[0].name).toContain('focus-trap');
      expect(bigPictureArtifacts[0].path).toContain('big-picture.md');
    });

    it('should NOT generate comparison view in single mode', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const comparisonArtifacts = session.artifacts.filter(a => a.type === ArtifactType.COMPARISON_VIEW);
      expect(comparisonArtifacts).toHaveLength(0);
      expect(analyzer.generateComparisonView).not.toHaveBeenCalled();
    });

    it('should record analysis actions in phase history', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const analysisHistory = session.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory).toBeDefined();
      expect(analysisHistory!.actions).toContain('Generated big picture for focus-trap');
      expect(analysisHistory!.completedAt).not.toBeNull();
    });

    it('should persist session after analysis phase completes', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.currentPhase).toBe(Phase.PROTOTYPING);
      expect(loadedSession.completedPhases).toContain(Phase.ANALYSIS);
      expect(loadedSession.artifacts.some(a => a.type === ArtifactType.BIG_PICTURE)).toBe(true);
    });
  });

  describe('Big picture generation for multiple libraries', () => {
    it('should generate big picture for each library in comparison mode', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager(['focus-trap', '@angular/cdk']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      // analyzeLibrary called for each library during visualization + comparison
      expect(analyzer.analyzeLibrary).toHaveBeenCalledWith('focus-trap');
      expect(analyzer.analyzeLibrary).toHaveBeenCalledWith('@angular/cdk');
    });

    it('should save a big picture artifact for each library', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager(['focus-trap', '@angular/cdk']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const bigPictureArtifacts = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
      expect(bigPictureArtifacts).toHaveLength(2);

      const artifactNames = bigPictureArtifacts.map(a => a.name);
      expect(artifactNames.some(n => n.includes('focus-trap'))).toBe(true);
      expect(artifactNames.some(n => n.includes('angular'))).toBe(true);
    });

    it('should generate big picture for 3 libraries in comparison mode', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b', 'lib-c'])
      });
      const installManager = createMockInstallationManager(['lib-a', 'lib-b', 'lib-c']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const bigPictureArtifacts = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
      expect(bigPictureArtifacts).toHaveLength(3);
    });

    it('should record analysis actions for all libraries in history', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager(['focus-trap', '@angular/cdk']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const analysisHistory = session.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory!.actions).toContain('Generated big picture for focus-trap');
      expect(analysisHistory!.actions).toContain('Generated big picture for @angular/cdk');
    });

    it('should continue analysis for remaining libraries if one fails', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager(['lib-a', 'lib-b']);
      const analyzer = createMockBigPictureAnalyzer({
        analyzeLibrary: vi.fn().mockImplementation(async (name: string) => {
          if (name === 'lib-a') {
            throw new Error('Analysis failed for lib-a');
          }
          return createMockAnalysis(name);
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      // Should still transition to PROTOTYPING
      expect(orchestrator.getCurrentPhase()).toBe(Phase.PROTOTYPING);

      const session = orchestrator.getSession()!;
      // Only lib-b should have a big picture artifact
      const bigPictureArtifacts = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
      expect(bigPictureArtifacts).toHaveLength(1);
      expect(bigPictureArtifacts[0].name).toContain('lib-b');

      // Error should be displayed
      expect(promptHandler.displayError).toHaveBeenCalledWith(
        expect.stringContaining('lib-a')
      );
    });
  });

  describe('Comparison view generation', () => {
    it('should generate comparison view in comparison mode with 2 libraries', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager(['focus-trap', '@angular/cdk']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(analyzer.generateComparisonView).toHaveBeenCalled();
      const callArgs = (analyzer.generateComparisonView as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
    });

    it('should save comparison view artifact in session', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager(['focus-trap', '@angular/cdk']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const comparisonArtifacts = session.artifacts.filter(a => a.type === ArtifactType.COMPARISON_VIEW);
      expect(comparisonArtifacts).toHaveLength(1);
      expect(comparisonArtifacts[0].name).toBe('comparison-view.md');
      expect(comparisonArtifacts[0].path).toBe('comparison-view.md');
    });

    it('should record comparison view generation in history', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager(['lib-a', 'lib-b']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const analysisHistory = session.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory!.actions).toContain('Generated comparison view');
    });

    it('should skip comparison view if fewer than 2 analyses succeed', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager(['lib-a', 'lib-b']);

      // Both analyses fail during the visualization pass, only one succeeds
      let callCount = 0;
      const analyzer = createMockBigPictureAnalyzer({
        analyzeLibrary: vi.fn().mockImplementation(async (name: string) => {
          callCount++;
          // First two calls are for visualization (both fail except lib-b)
          // Next calls are for comparison
          if (name === 'lib-a') {
            throw new Error('Analysis failed');
          }
          return createMockAnalysis(name);
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      // Only 1 big picture artifact (lib-b succeeded)
      const bigPictureArtifacts = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
      expect(bigPictureArtifacts).toHaveLength(1);
    });

    it('should generate comparison view with 3 libraries', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b', 'lib-c'])
      });
      const installManager = createMockInstallationManager(['lib-a', 'lib-b', 'lib-c']);
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(analyzer.generateComparisonView).toHaveBeenCalled();
      const callArgs = (analyzer.generateComparisonView as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs).toHaveLength(3);

      const session = orchestrator.getSession()!;
      const comparisonArtifacts = session.artifacts.filter(a => a.type === ArtifactType.COMPARISON_VIEW);
      expect(comparisonArtifacts).toHaveLength(1);
    });
  });

  describe('Skipping analysis phase', () => {
    it('should skip to PROTOTYPING when user declines big picture', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(orchestrator.getCurrentPhase()).toBe(Phase.PROTOTYPING);
    });

    it('should NOT call analyzeLibrary when user declines', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      expect(analyzer.analyzeLibrary).not.toHaveBeenCalled();
      expect(analyzer.generateVisualization).not.toHaveBeenCalled();
      expect(analyzer.generateComparisonView).not.toHaveBeenCalled();
    });

    it('should record skip action in phase history', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const analysisHistory = session.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory).toBeDefined();
      expect(analysisHistory!.actions.some(a => a.toLowerCase().includes('skip') || a.toLowerCase().includes('declined'))).toBe(true);
    });

    it('should NOT generate any artifacts when skipping', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const analysisArtifacts = session.artifacts.filter(
        a => a.type === ArtifactType.BIG_PICTURE || a.type === ArtifactType.COMPARISON_VIEW
      );
      expect(analysisArtifacts).toHaveLength(0);
    });

    it('should record bigPictureRequested as false in session metadata', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      expect(session.metadata.userInputs.bigPictureRequested).toBe(false);
    });

    it('should persist session state after skipping analysis', async () => {
      const promptHandler = createMockPromptHandler({
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false)
      });
      const installManager = createMockInstallationManager();
      const analyzer = createMockBigPictureAnalyzer();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager,
        analyzer
      );

      await setupToAnalysisPhase(orchestrator);
      await orchestrator.executeAnalysisPhase();

      const session = orchestrator.getSession()!;
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.currentPhase).toBe(Phase.PROTOTYPING);
      expect(loadedSession.completedPhases).toContain(Phase.ANALYSIS);
    });
  });
});
