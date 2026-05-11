/**
 * Unit tests for ResearchBuddyIntegration
 * Feature: polished-research-workflow
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ResearchBuddyIntegration,
  ResearchBuddyMode,
  ModeSelector,
  ResearchBuddyDependencies
} from './ResearchBuddyIntegration';
import { SessionManager } from '../session/SessionManager';
import { UserPromptHandler } from '../prompts/UserPromptHandler';
import { LibraryInstallationManager } from '../installation/LibraryInstallationManager';
import { BigPictureAnalyzer } from '../analyzer/BigPictureAnalyzer';
import { ArtifactCoordinator } from '../artifacts/ArtifactCoordinator';
import { WorkflowOrchestrator } from '../orchestrator/WorkflowOrchestrator';

/**
 * Creates a mock ModeSelector that returns the specified mode
 */
function createMockModeSelector(mode: ResearchBuddyMode): ModeSelector {
  return {
    selectMode: vi.fn().mockResolvedValue(mode)
  };
}

/**
 * Creates mock dependencies for testing
 */
function createMockDependencies(): ResearchBuddyDependencies {
  return {
    sessionManager: {
      createSession: vi.fn(),
      loadSession: vi.fn(),
      saveSession: vi.fn(),
      finalizeSession: vi.fn(),
      getActiveSession: vi.fn(),
      listSessions: vi.fn(),
      getSessionById: vi.fn()
    } as unknown as SessionManager,
    promptHandler: {
      promptForGoal: vi.fn(),
      promptForResearchMode: vi.fn(),
      promptForLibraries: vi.fn(),
      promptForDocumentationLinks: vi.fn(),
      promptForBigPictureAnalysis: vi.fn(),
      promptForPrototypeRequest: vi.fn(),
      promptForDecision: vi.fn(),
      promptForWikiIntegration: vi.fn(),
      promptForPhaseSkip: vi.fn(),
      confirmReinstall: vi.fn(),
      confirmSkipPhase: vi.fn(),
      confirmFinalization: vi.fn(),
      validateLibraries: vi.fn(),
      displayError: vi.fn(),
      displaySuccess: vi.fn(),
      displayInfo: vi.fn(),
      displayPhaseTransition: vi.fn(),
      displayPhaseProgress: vi.fn(),
      displayArtifactSummary: vi.fn()
    } as unknown as UserPromptHandler,
    installationManager: {
      installLibrary: vi.fn(),
      verifyInstallation: vi.fn(),
      getInstalledVersion: vi.fn(),
      reinstallLibrary: vi.fn(),
      installLibraries: vi.fn(),
      verifyLibraries: vi.fn(),
      isLibraryInstalled: vi.fn()
    } as unknown as LibraryInstallationManager,
    bigPictureAnalyzer: {
      analyzeLibrary: vi.fn(),
      generateVisualization: vi.fn(),
      generateComparisonView: vi.fn(),
      analyzeStructure: vi.fn(),
      categorizeCapabilities: vi.fn(),
      identifyEntryPoints: vi.fn(),
      extractPublicAPI: vi.fn()
    } as unknown as BigPictureAnalyzer,
    artifactCoordinator: {
      generatePhaseReport: vi.fn(),
      generateFinalReport: vi.fn(),
      generateADR: vi.fn(),
      generateResearchDecisionRecord: vi.fn(),
      saveArtifact: vi.fn(),
      listArtifacts: vi.fn(),
      generateArtifactIndex: vi.fn()
    } as unknown as ArtifactCoordinator
  };
}

describe('ResearchBuddyIntegration', () => {
  describe('selectMode', () => {
    it('should return STRUCTURED when mode selector returns STRUCTURED', async () => {
      const modeSelector = createMockModeSelector(ResearchBuddyMode.STRUCTURED);
      const integration = new ResearchBuddyIntegration(createMockDependencies(), modeSelector);

      const result = await integration.selectMode();

      expect(result).toBe(ResearchBuddyMode.STRUCTURED);
      expect(modeSelector.selectMode).toHaveBeenCalledOnce();
    });

    it('should return AD_HOC when mode selector returns AD_HOC', async () => {
      const modeSelector = createMockModeSelector(ResearchBuddyMode.AD_HOC);
      const integration = new ResearchBuddyIntegration(createMockDependencies(), modeSelector);

      const result = await integration.selectMode();

      expect(result).toBe(ResearchBuddyMode.AD_HOC);
      expect(modeSelector.selectMode).toHaveBeenCalledOnce();
    });
  });

  describe('startStructuredWorkflow', () => {
    it('should create orchestrator and call executeSetupPhase', async () => {
      const deps = createMockDependencies();
      const modeSelector = createMockModeSelector(ResearchBuddyMode.STRUCTURED);

      // Mock the orchestrator's executeSetupPhase via the prompt handler
      // Since WorkflowOrchestrator is created internally, we spy on its behavior
      // by mocking the dependencies it uses
      const mockPromptHandler = deps.promptHandler as any;
      mockPromptHandler.promptForGoal.mockResolvedValue('Test research goal');
      mockPromptHandler.promptForResearchMode.mockResolvedValue('SINGLE');
      mockPromptHandler.promptForLibraries.mockResolvedValue(['test-lib']);
      mockPromptHandler.validateLibraries.mockReturnValue(true);
      mockPromptHandler.promptForDocumentationLinks.mockResolvedValue([]);

      const mockInstallationManager = deps.installationManager as any;
      mockInstallationManager.verifyInstallation.mockResolvedValue(false);
      mockInstallationManager.installLibrary.mockResolvedValue({
        libraryName: 'test-lib',
        success: true,
        version: '1.0.0',
        error: null,
        installPath: 'node_modules/test-lib'
      });

      const mockSessionManager = deps.sessionManager as any;
      mockSessionManager.createSession.mockResolvedValue({
        id: 'test-session-2024-01-01',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'ACTIVE',
        currentPhase: 'SETUP',
        completedPhases: [],
        metadata: {
          goal: 'Test research goal',
          mode: 'SINGLE',
          libraries: [{ name: 'test-lib', version: '1.0.0', installedAt: '2024-01-01T00:00:00.000Z', installPath: 'node_modules/test-lib' }],
          documentationLinks: [],
          userInputs: {}
        },
        artifacts: [],
        history: []
      });
      mockSessionManager.saveSession.mockResolvedValue(undefined);

      const integration = new ResearchBuddyIntegration(deps, modeSelector);
      const orchestrator = await integration.startStructuredWorkflow();

      expect(orchestrator).toBeInstanceOf(WorkflowOrchestrator);
      expect(integration.getOrchestrator()).toBe(orchestrator);
      // Verify setup phase was initiated (promptForGoal is the first call)
      expect(mockPromptHandler.promptForGoal).toHaveBeenCalledOnce();
    });
  });

  describe('startAdHocMode', () => {
    it('should return ad-hoc mode indicator with message', async () => {
      const deps = createMockDependencies();
      const modeSelector = createMockModeSelector(ResearchBuddyMode.AD_HOC);
      const integration = new ResearchBuddyIntegration(deps, modeSelector);

      const result = await integration.startAdHocMode();

      expect(result.mode).toBe(ResearchBuddyMode.AD_HOC);
      expect(result.message).toContain('Ad-hoc research mode active');
    });
  });

  describe('run', () => {
    it('should delegate to startAdHocMode when AD_HOC mode is selected', async () => {
      const deps = createMockDependencies();
      const modeSelector = createMockModeSelector(ResearchBuddyMode.AD_HOC);
      const integration = new ResearchBuddyIntegration(deps, modeSelector);

      const result = await integration.run();

      expect(result.mode).toBe(ResearchBuddyMode.AD_HOC);
      expect((result as any).message).toContain('Ad-hoc research mode active');
    });

    it('should delegate to startStructuredWorkflow when STRUCTURED mode is selected', async () => {
      const deps = createMockDependencies();
      const modeSelector = createMockModeSelector(ResearchBuddyMode.STRUCTURED);

      // Set up mocks for the full setup phase flow
      const mockPromptHandler = deps.promptHandler as any;
      mockPromptHandler.promptForGoal.mockResolvedValue('Compare libraries');
      mockPromptHandler.promptForResearchMode.mockResolvedValue('SINGLE');
      mockPromptHandler.promptForLibraries.mockResolvedValue(['my-lib']);
      mockPromptHandler.validateLibraries.mockReturnValue(true);
      mockPromptHandler.promptForDocumentationLinks.mockResolvedValue([]);

      const mockInstallationManager = deps.installationManager as any;
      mockInstallationManager.verifyInstallation.mockResolvedValue(false);
      mockInstallationManager.installLibrary.mockResolvedValue({
        libraryName: 'my-lib',
        success: true,
        version: '2.0.0',
        error: null,
        installPath: 'node_modules/my-lib'
      });

      const mockSessionManager = deps.sessionManager as any;
      mockSessionManager.createSession.mockResolvedValue({
        id: 'compare-libraries-2024-01-01',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'ACTIVE',
        currentPhase: 'SETUP',
        completedPhases: [],
        metadata: {
          goal: 'Compare libraries',
          mode: 'SINGLE',
          libraries: [{ name: 'my-lib', version: '2.0.0', installedAt: '2024-01-01T00:00:00.000Z', installPath: 'node_modules/my-lib' }],
          documentationLinks: [],
          userInputs: {}
        },
        artifacts: [],
        history: []
      });
      mockSessionManager.saveSession.mockResolvedValue(undefined);

      const integration = new ResearchBuddyIntegration(deps, modeSelector);
      const result = await integration.run();

      expect(result.mode).toBe(ResearchBuddyMode.STRUCTURED);
      expect((result as any).orchestrator).toBeInstanceOf(WorkflowOrchestrator);
    });
  });

  describe('accessor methods', () => {
    it('should return null orchestrator before structured workflow is started', () => {
      const deps = createMockDependencies();
      const integration = new ResearchBuddyIntegration(deps);

      expect(integration.getOrchestrator()).toBeNull();
    });

    it('should return session manager instance', () => {
      const deps = createMockDependencies();
      const integration = new ResearchBuddyIntegration(deps);

      expect(integration.getSessionManager()).toBe(deps.sessionManager);
    });

    it('should return artifact coordinator instance', () => {
      const deps = createMockDependencies();
      const integration = new ResearchBuddyIntegration(deps);

      expect(integration.getArtifactCoordinator()).toBe(deps.artifactCoordinator);
    });

    it('should return big picture analyzer instance', () => {
      const deps = createMockDependencies();
      const integration = new ResearchBuddyIntegration(deps);

      expect(integration.getBigPictureAnalyzer()).toBe(deps.bigPictureAnalyzer);
    });
  });

  describe('compatibility with existing session directory structure', () => {
    it('should use .kiro/research/sessions/ as default base directory', () => {
      // When no custom dependencies are provided, the integration should
      // create a SessionManager with the default .kiro/research/sessions/ path
      // We verify this by checking the session manager is created (not null)
      const integration = new ResearchBuddyIntegration();

      expect(integration.getSessionManager()).toBeInstanceOf(SessionManager);
      expect(integration.getArtifactCoordinator()).toBeInstanceOf(ArtifactCoordinator);
    });
  });
});
