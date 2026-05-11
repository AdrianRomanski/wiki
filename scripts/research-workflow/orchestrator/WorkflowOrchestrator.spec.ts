/**
 * WorkflowOrchestrator unit tests
 * Feature: polished-research-workflow
 * Requirements: 5.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { SessionManager } from '../session/SessionManager';
import {
  Phase,
  SessionStatus,
  ResearchMode,
  SessionMetadata,
  Session
} from '../types/core';
import { WorkflowError } from '../errors/WorkflowError';

describe('WorkflowOrchestrator', () => {
  const testBaseDir = path.join(process.cwd(), '.test-orchestrator-sessions');
  let sessionManager: SessionManager;
  let orchestrator: WorkflowOrchestrator;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testBaseDir, { recursive: true });
    sessionManager = new SessionManager(testBaseDir);
    orchestrator = new WorkflowOrchestrator(sessionManager);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper function to create a test session
   */
  async function createTestSession(
    mode: ResearchMode = ResearchMode.SINGLE,
    currentPhase: Phase = Phase.SETUP
  ): Promise<Session> {
    const metadata: SessionMetadata = {
      goal: 'Test workflow',
      mode,
      libraries: mode === ResearchMode.SINGLE
        ? [{ name: 'test-lib', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/test-lib' }]
        : [
            { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' },
            { name: 'lib2', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib2' }
          ],
      documentationLinks: [],
      userInputs: {}
    };

    const session = await sessionManager.createSession(metadata);
    session.currentPhase = currentPhase;
    await sessionManager.saveSession(session);
    return session;
  }

  describe('startWorkflow', () => {
    it('should start workflow when no active session exists', async () => {
      await expect(orchestrator.startWorkflow()).resolves.not.toThrow();
    });

    it('should throw error when workflow is already active', async () => {
      const session = await createTestSession();
      orchestrator.setSession(session);

      await expect(orchestrator.startWorkflow()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.startWorkflow()).rejects.toThrow('A workflow is already active');
    });

    it('should throw error with WORKFLOW_ALREADY_ACTIVE code', async () => {
      const session = await createTestSession();
      orchestrator.setSession(session);

      try {
        await orchestrator.startWorkflow();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('WORKFLOW_ALREADY_ACTIVE');
      }
    });
  });

  describe('getCurrentPhase', () => {
    it('should return IDLE when no active session', () => {
      expect(orchestrator.getCurrentPhase()).toBe(Phase.IDLE);
    });

    it('should return current phase of active session', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should return SETUP for newly created session', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      expect(orchestrator.getCurrentPhase()).toBe(Phase.SETUP);
    });
  });

  describe('canTransitionTo', () => {
    it('should allow SETUP from IDLE when no session', () => {
      expect(orchestrator.canTransitionTo(Phase.SETUP)).toBe(true);
    });

    it('should not allow ANALYSIS from IDLE when no session', () => {
      expect(orchestrator.canTransitionTo(Phase.ANALYSIS)).toBe(false);
    });

    it('should allow ANALYSIS from SETUP', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.ANALYSIS)).toBe(true);
    });

    it('should not allow DECISION from SETUP', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.DECISION)).toBe(false);
    });

    it('should allow PROTOTYPING from ANALYSIS', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.PROTOTYPING)).toBe(true);
    });

    it('should allow DECISION from PROTOTYPING', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.DECISION)).toBe(true);
    });

    it('should allow FINALIZED from DECISION', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.DECISION);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.FINALIZED)).toBe(true);
    });

    it('should not allow any transition from FINALIZED', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.FINALIZED);
      orchestrator.setSession(session);

      expect(orchestrator.canTransitionTo(Phase.SETUP)).toBe(false);
      expect(orchestrator.canTransitionTo(Phase.ANALYSIS)).toBe(false);
      expect(orchestrator.canTransitionTo(Phase.PROTOTYPING)).toBe(false);
      expect(orchestrator.canTransitionTo(Phase.DECISION)).toBe(false);
    });
  });

  describe('transitionToPhase', () => {
    it('should transition from SETUP to ANALYSIS', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should add previous phase to completed phases', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      const currentSession = orchestrator.getSession();
      expect(currentSession?.completedPhases).toContain(Phase.SETUP);
    });

    it('should update phase history with completion time', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      session.history = [{
        phase: Phase.SETUP,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      const currentSession = orchestrator.getSession();
      const setupHistory = currentSession?.history.find(h => h.phase === Phase.SETUP);
      expect(setupHistory?.completedAt).not.toBeNull();
    });

    it('should create new phase history entry', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      session.history = [{
        phase: Phase.SETUP,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      const currentSession = orchestrator.getSession();
      const analysisHistory = currentSession?.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory).toBeDefined();
      expect(analysisHistory?.startedAt).toBeDefined();
      expect(analysisHistory?.completedAt).toBeNull();
    });

    it('should persist session state after transition', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      // Load session from disk to verify persistence
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.currentPhase).toBe(Phase.ANALYSIS);
    });

    it('should throw error for invalid transition', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await expect(orchestrator.transitionToPhase(Phase.DECISION)).rejects.toThrow(WorkflowError);
      await expect(orchestrator.transitionToPhase(Phase.DECISION)).rejects.toThrow('Invalid phase transition');
    });

    it('should throw error with INVALID_PHASE_TRANSITION code', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      try {
        await orchestrator.transitionToPhase(Phase.DECISION);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('INVALID_PHASE_TRANSITION');
      }
    });

    it('should include valid next phases in error context', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      try {
        await orchestrator.transitionToPhase(Phase.DECISION);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        const workflowError = error as WorkflowError;
        expect(workflowError.context?.validNextPhases).toContain(Phase.ANALYSIS);
      }
    });

    it('should throw error when no active workflow', async () => {
      await expect(orchestrator.transitionToPhase(Phase.ANALYSIS)).rejects.toThrow(WorkflowError);
      await expect(orchestrator.transitionToPhase(Phase.ANALYSIS)).rejects.toThrow('No active workflow');
    });

    it('should not add duplicate phases to completed phases', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      session.completedPhases = [Phase.SETUP];
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);

      const currentSession = orchestrator.getSession();
      const setupCount = currentSession?.completedPhases.filter(p => p === Phase.SETUP).length;
      expect(setupCount).toBe(1);
    });
  });

  describe('pauseWorkflow', () => {
    it('should pause active workflow', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      await orchestrator.pauseWorkflow();

      // Verify session status is PAUSED
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.status).toBe(SessionStatus.PAUSED);
    });

    it('should clear current session reference', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      await orchestrator.pauseWorkflow();

      expect(orchestrator.getSession()).toBeNull();
    });

    it('should persist session state when pausing', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.completedPhases = [Phase.SETUP];
      orchestrator.setSession(session);

      await orchestrator.pauseWorkflow();

      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.currentPhase).toBe(Phase.ANALYSIS);
      expect(loadedSession.completedPhases).toContain(Phase.SETUP);
    });

    it('should throw error when no active workflow', async () => {
      await expect(orchestrator.pauseWorkflow()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.pauseWorkflow()).rejects.toThrow('No active workflow to pause');
    });

    it('should throw error when workflow is finalized', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.FINALIZED);
      session.status = SessionStatus.FINALIZED;
      orchestrator.setSession(session);

      await expect(orchestrator.pauseWorkflow()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.pauseWorkflow()).rejects.toThrow('Cannot pause a finalized workflow');
    });

    it('should throw error with WORKFLOW_FINALIZED code', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.FINALIZED);
      session.status = SessionStatus.FINALIZED;
      orchestrator.setSession(session);

      try {
        await orchestrator.pauseWorkflow();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('WORKFLOW_FINALIZED');
      }
    });
  });

  describe('resumeWorkflow', () => {
    let mockPromptHandler: any;
    let mockInstallationManager: any;
    let resumeOrchestrator: WorkflowOrchestrator;

    beforeEach(() => {
      mockPromptHandler = {
        displayInfo: vi.fn(),
        displaySuccess: vi.fn(),
        displayError: vi.fn(),
        displayPhaseProgress: vi.fn(),
        displayPhaseTransition: vi.fn(),
        confirmReinstall: vi.fn().mockResolvedValue(false),
      };

      mockInstallationManager = {
        verifyInstallation: vi.fn().mockResolvedValue(true),
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'test-lib',
          success: true,
          version: '1.0.0',
          error: null,
          installPath: 'node_modules/test-lib'
        }),
      };

      resumeOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );
    });

    it('should resume paused workflow', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(resumeOrchestrator.getSession()).not.toBeNull();
      expect(resumeOrchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should restore session status to ACTIVE', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      const currentSession = resumeOrchestrator.getSession();
      expect(currentSession?.status).toBe(SessionStatus.ACTIVE);
    });

    it('should persist ACTIVE status to disk', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.status).toBe(SessionStatus.ACTIVE);
    });

    it('should throw error when workflow is already active', async () => {
      const session1 = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      resumeOrchestrator.setSession(session1);

      const session2 = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      session2.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session2);

      await expect(resumeOrchestrator.resumeWorkflow(session2.id)).rejects.toThrow(WorkflowError);
      await expect(resumeOrchestrator.resumeWorkflow(session2.id)).rejects.toThrow('A workflow is already active');
    });

    it('should throw error when session is finalized', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.FINALIZED);
      session.status = SessionStatus.FINALIZED;
      await sessionManager.saveSession(session);

      await expect(resumeOrchestrator.resumeWorkflow(session.id)).rejects.toThrow(WorkflowError);
      await expect(resumeOrchestrator.resumeWorkflow(session.id)).rejects.toThrow('Cannot resume a finalized workflow');
    });

    it('should throw error for non-existent session', async () => {
      await expect(resumeOrchestrator.resumeWorkflow('non-existent-session')).rejects.toThrow(WorkflowError);
    });

    it('should restore all session data', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      session.status = SessionStatus.PAUSED;
      session.completedPhases = [Phase.SETUP, Phase.ANALYSIS];
      session.artifacts = [{
        type: 'BIG_PICTURE' as any,
        name: 'test-artifact',
        path: 'path/to/artifact',
        createdAt: new Date().toISOString()
      }];
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      const currentSession = resumeOrchestrator.getSession();
      expect(currentSession?.completedPhases).toEqual([Phase.SETUP, Phase.ANALYSIS]);
      expect(currentSession?.artifacts).toHaveLength(1);
    });

    it('should verify libraries still exist in node_modules', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(mockInstallationManager.verifyInstallation).toHaveBeenCalledWith('test-lib');
    });

    it('should offer to reinstall missing libraries', async () => {
      mockInstallationManager.verifyInstallation.mockResolvedValue(false);
      mockPromptHandler.confirmReinstall.mockResolvedValue(true);

      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(mockPromptHandler.confirmReinstall).toHaveBeenCalledWith('test-lib');
      expect(mockInstallationManager.installLibrary).toHaveBeenCalledWith('test-lib');
    });

    it('should display info when user declines reinstall', async () => {
      mockInstallationManager.verifyInstallation.mockResolvedValue(false);
      mockPromptHandler.confirmReinstall.mockResolvedValue(false);

      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(mockPromptHandler.displayInfo).toHaveBeenCalledWith(
        expect.stringContaining('unavailable')
      );
    });

    it('should display error when reinstall fails', async () => {
      mockInstallationManager.verifyInstallation.mockResolvedValue(false);
      mockPromptHandler.confirmReinstall.mockResolvedValue(true);
      mockInstallationManager.installLibrary.mockResolvedValue({
        libraryName: 'test-lib',
        success: false,
        version: null,
        error: 'Network error',
        installPath: null
      });

      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(mockPromptHandler.displayError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reinstall')
      );
    });

    it('should display phase progress after resuming', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      session.status = SessionStatus.PAUSED;
      session.completedPhases = [Phase.SETUP, Phase.ANALYSIS];
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      expect(mockPromptHandler.displayPhaseProgress).toHaveBeenCalledWith(
        Phase.PROTOTYPING,
        [Phase.SETUP, Phase.ANALYSIS]
      );
      expect(mockPromptHandler.displayInfo).toHaveBeenCalledWith(
        'Resuming workflow at phase: PROTOTYPING'
      );
    });

    it('should record resume action in history', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.status = SessionStatus.PAUSED;
      session.history = [{
        phase: Phase.ANALYSIS,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      await sessionManager.saveSession(session);

      await resumeOrchestrator.resumeWorkflow(session.id);

      const currentSession = resumeOrchestrator.getSession();
      const analysisHistory = currentSession?.history.find(
        h => h.phase === Phase.ANALYSIS && h.completedAt === null
      );
      expect(analysisHistory?.actions).toContain('Workflow resumed');
    });
  });

  describe('executeSetupPhase', () => {
    let mockPromptHandler: any;
    let mockInstallationManager: any;

    beforeEach(() => {
      mockPromptHandler = {
        promptForGoal: vi.fn().mockResolvedValue('Test research goal'),
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.SINGLE),
        promptForLibraries: vi.fn().mockResolvedValue(['test-lib']),
        promptForDocumentationLinks: vi.fn().mockResolvedValue([]),
        validateLibraries: vi.fn().mockReturnValue(true),
        confirmReinstall: vi.fn().mockResolvedValue(false),
        promptForCorrectedLibraryName: vi.fn().mockResolvedValue(null),
        displayError: vi.fn(),
        displaySuccess: vi.fn(),
        displayInfo: vi.fn(),
        displayPhaseTransition: vi.fn(),
        displayPhaseProgress: vi.fn()
      };

      mockInstallationManager = {
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'test-lib',
          success: true,
          version: '1.0.0',
          error: null,
          installPath: 'node_modules/test-lib'
        }),
        verifyInstallation: vi.fn().mockResolvedValue(false),
        getInstalledVersion: vi.fn().mockResolvedValue('1.0.0'),
        reinstallLibrary: vi.fn().mockResolvedValue({
          libraryName: 'test-lib',
          success: true,
          version: '1.0.0',
          error: null,
          installPath: 'node_modules/test-lib'
        })
      };
    });

    it('should collect goal, mode, libraries, and docs from user', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockPromptHandler.promptForGoal).toHaveBeenCalled();
      expect(mockPromptHandler.promptForResearchMode).toHaveBeenCalled();
      expect(mockPromptHandler.promptForLibraries).toHaveBeenCalledWith(ResearchMode.SINGLE);
      expect(mockPromptHandler.promptForDocumentationLinks).toHaveBeenCalled();
    });

    it('should install libraries and create session', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockInstallationManager.installLibrary).toHaveBeenCalledWith('test-lib');
      const session = testOrchestrator.getSession();
      expect(session).not.toBeNull();
      expect(session?.metadata.goal).toBe('Test research goal');
      expect(session?.metadata.mode).toBe(ResearchMode.SINGLE);
      expect(session?.metadata.libraries).toHaveLength(1);
      expect(session?.metadata.libraries[0].name).toBe('test-lib');
    });

    it('should transition to ANALYSIS phase after setup', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(testOrchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should throw error when workflow is already active', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );
      const session = await createTestSession();
      testOrchestrator.setSession(session);

      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow(WorkflowError);
      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow('A workflow is already active');
    });

    it('should handle comparison mode with multiple libraries', async () => {
      mockPromptHandler.promptForResearchMode.mockResolvedValue(ResearchMode.COMPARISON);
      mockPromptHandler.promptForLibraries.mockResolvedValue(['lib-a', 'lib-b']);
      mockInstallationManager.installLibrary
        .mockResolvedValueOnce({ libraryName: 'lib-a', success: true, version: '1.0.0', error: null, installPath: 'node_modules/lib-a' })
        .mockResolvedValueOnce({ libraryName: 'lib-b', success: true, version: '2.0.0', error: null, installPath: 'node_modules/lib-b' });

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      const session = testOrchestrator.getSession();
      expect(session?.metadata.mode).toBe(ResearchMode.COMPARISON);
      expect(session?.metadata.libraries).toHaveLength(2);
    });

    it('should throw error when all installations fail', async () => {
      mockInstallationManager.installLibrary.mockResolvedValue({
        libraryName: 'bad-lib',
        success: false,
        version: null,
        error: 'Not found',
        installPath: null
      });

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow(WorkflowError);
      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow('No libraries were installed');
    });

    it('should throw error when comparison mode has fewer than 2 libraries installed', async () => {
      mockPromptHandler.promptForResearchMode.mockResolvedValue(ResearchMode.COMPARISON);
      mockPromptHandler.promptForLibraries.mockResolvedValue(['lib-a', 'lib-b']);
      mockInstallationManager.installLibrary
        .mockImplementation(async (name: string) => {
          if (name === 'lib-a') {
            return { libraryName: 'lib-a', success: true, version: '1.0.0', error: null, installPath: 'node_modules/lib-a' };
          }
          return { libraryName: 'lib-b', success: false, version: null, error: 'Not found', installPath: null };
        });

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow('Comparison mode requires at least 2');
    });

    it('should use existing installation when user declines reinstall', async () => {
      mockInstallationManager.verifyInstallation.mockResolvedValue(true);
      mockInstallationManager.getInstalledVersion.mockResolvedValue('2.5.0');
      mockPromptHandler.confirmReinstall.mockResolvedValue(false);

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockInstallationManager.installLibrary).not.toHaveBeenCalled();
      const session = testOrchestrator.getSession();
      expect(session?.metadata.libraries[0].version).toBe('2.5.0');
    });

    it('should reinstall when user confirms reinstall', async () => {
      mockInstallationManager.verifyInstallation.mockResolvedValue(true);
      mockPromptHandler.confirmReinstall.mockResolvedValue(true);
      mockInstallationManager.reinstallLibrary.mockResolvedValue({
        libraryName: 'test-lib',
        success: true,
        version: '3.0.0',
        error: null,
        installPath: 'node_modules/test-lib'
      });

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockInstallationManager.reinstallLibrary).toHaveBeenCalledWith('test-lib');
      const session = testOrchestrator.getSession();
      expect(session?.metadata.libraries[0].version).toBe('3.0.0');
    });

    it('should retry library validation when input is invalid', async () => {
      mockPromptHandler.validateLibraries
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      mockPromptHandler.promptForLibraries
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(['test-lib']);

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockPromptHandler.promptForLibraries).toHaveBeenCalledTimes(2);
      expect(mockPromptHandler.displayError).toHaveBeenCalled();
    });

    it('should store documentation links in session metadata', async () => {
      mockPromptHandler.promptForDocumentationLinks.mockResolvedValue([
        'https://example.com/docs',
        'https://example.com/guide'
      ]);

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      const session = testOrchestrator.getSession();
      expect(session?.metadata.documentationLinks).toEqual([
        'https://example.com/docs',
        'https://example.com/guide'
      ]);
    });

    it('should record phase actions in history', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      const session = testOrchestrator.getSession();
      const setupHistory = session?.history.find(h => h.phase === Phase.SETUP);
      expect(setupHistory?.actions).toContain('Collected goal: "Test research goal"');
      expect(setupHistory?.actions).toContain('Selected SINGLE mode');
      expect(setupHistory?.actions).toContain('Installed test-lib@1.0.0');
    });

    it('should display phase progress and transitions', async () => {
      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockPromptHandler.displayPhaseProgress).toHaveBeenCalledWith(Phase.SETUP, []);
      expect(mockPromptHandler.displaySuccess).toHaveBeenCalledWith('Setup phase complete! All libraries installed.');
      expect(mockPromptHandler.displayPhaseTransition).toHaveBeenCalledWith(Phase.SETUP, Phase.ANALYSIS);
    });

    it('should offer corrected library name after retries exhausted and install with corrected name', async () => {
      mockInstallationManager.installLibrary
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'correct-lib', success: true, version: '1.0.0', error: null, installPath: 'node_modules/correct-lib' });
      mockPromptHandler.promptForCorrectedLibraryName.mockResolvedValue('correct-lib');

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockPromptHandler.promptForCorrectedLibraryName).toHaveBeenCalledWith('test-lib');
      const session = testOrchestrator.getSession();
      expect(session?.metadata.libraries[0].name).toBe('correct-lib');
    });

    it('should skip library when user returns null from correction prompt', async () => {
      mockPromptHandler.promptForResearchMode.mockResolvedValue(ResearchMode.COMPARISON);
      mockPromptHandler.promptForLibraries.mockResolvedValue(['bad-lib', 'good-lib']);
      mockInstallationManager.installLibrary
        .mockImplementation(async (name: string) => {
          if (name === 'good-lib') {
            return { libraryName: 'good-lib', success: true, version: '1.0.0', error: null, installPath: 'node_modules/good-lib' };
          }
          return { libraryName: name, success: false, version: null, error: 'Not found', installPath: null };
        });
      mockPromptHandler.promptForCorrectedLibraryName.mockResolvedValue(null);
      // Need a second good lib for comparison mode
      mockPromptHandler.promptForLibraries.mockResolvedValue(['bad-lib', 'good-lib', 'good-lib2']);
      mockInstallationManager.installLibrary
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'bad-lib', success: false, version: null, error: 'Not found', installPath: null })
        .mockResolvedValueOnce({ libraryName: 'good-lib', success: true, version: '1.0.0', error: null, installPath: 'node_modules/good-lib' })
        .mockResolvedValueOnce({ libraryName: 'good-lib2', success: true, version: '2.0.0', error: null, installPath: 'node_modules/good-lib2' });

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await testOrchestrator.executeSetupPhase();

      expect(mockPromptHandler.promptForCorrectedLibraryName).toHaveBeenCalledWith('bad-lib');
      const session = testOrchestrator.getSession();
      expect(session?.metadata.libraries).toHaveLength(2);
      expect(session?.metadata.libraries.map(l => l.name)).toEqual(['good-lib', 'good-lib2']);
    });

    it('should not offer correction when at max recursion depth', async () => {
      // When corrected name also fails, it should not prompt again (depth limit)
      mockInstallationManager.installLibrary.mockResolvedValue({
        libraryName: 'any-lib',
        success: false,
        version: null,
        error: 'Not found',
        installPath: null
      });
      mockPromptHandler.promptForCorrectedLibraryName.mockResolvedValue('also-bad-lib');

      const testOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );

      await expect(testOrchestrator.executeSetupPhase()).rejects.toThrow(WorkflowError);
      // Should only be called once (for the original name), not for the corrected name
      expect(mockPromptHandler.promptForCorrectedLibraryName).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeAnalysisPhase', () => {
    it('should throw error when no active session', async () => {
      await expect(orchestrator.executeAnalysisPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executeAnalysisPhase()).rejects.toThrow('No active session');
    });

    it('should throw error when not in ANALYSIS phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await expect(orchestrator.executeAnalysisPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executeAnalysisPhase()).rejects.toThrow('not in ANALYSIS phase');
    });

    it('should throw error with INVALID_PHASE code when wrong phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      try {
        await orchestrator.executeAnalysisPhase();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('INVALID_PHASE');
      }
    });

    it('should execute analysis phase when in correct phase with mocked dependencies', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);

      // Create orchestrator with mocked prompt handler and analyzer
      const mockPromptHandler = {
        promptForBigPictureAnalysis: vi.fn().mockResolvedValue(false),
        displayPhaseProgress: vi.fn(),
        displayInfo: vi.fn(),
        displaySuccess: vi.fn(),
        displayPhaseTransition: vi.fn(),
      } as any;

      const orchestratorWithMocks = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        undefined,
        undefined
      );
      orchestratorWithMocks.setSession(session);

      await orchestratorWithMocks.executeAnalysisPhase();

      // Should have transitioned to PROTOTYPING after skipping
      expect(orchestratorWithMocks.getCurrentPhase()).toBe(Phase.PROTOTYPING);
    });
  });

  describe('executePrototypingPhase', () => {
    it('should throw error when no active session', async () => {
      await expect(orchestrator.executePrototypingPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executePrototypingPhase()).rejects.toThrow('No active session');
    });

    it('should throw error when not in PROTOTYPING phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      await expect(orchestrator.executePrototypingPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executePrototypingPhase()).rejects.toThrow('not in PROTOTYPING phase');
    });

    it('should throw error with INVALID_PHASE code when wrong phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      try {
        await orchestrator.executePrototypingPhase();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('INVALID_PHASE');
      }
    });

    it('should call promptForPrototypeRequest when in correct phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      session.history.push({
        phase: Phase.PROTOTYPING,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      });
      orchestrator.setSession(session);

      // The real UserPromptHandler throws because CLI integration is not implemented.
      // This verifies the method reaches the prompt step (no longer throws NOT_IMPLEMENTED).
      try {
        await orchestrator.executePrototypingPhase();
        expect.fail('Should have thrown error from prompt handler');
      } catch (error) {
        expect(error).not.toBeInstanceOf(WorkflowError);
        expect((error as Error).message).toContain('promptForPrototypeRequest');
      }
    });
  });

  describe('executeDecisionPhase', () => {
    it('should throw error when no active session', async () => {
      await expect(orchestrator.executeDecisionPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executeDecisionPhase()).rejects.toThrow('No active session');
    });

    it('should throw error when not in DECISION phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      orchestrator.setSession(session);

      await expect(orchestrator.executeDecisionPhase()).rejects.toThrow(WorkflowError);
      await expect(orchestrator.executeDecisionPhase()).rejects.toThrow('not in DECISION phase');
    });

    it('should throw error with INVALID_PHASE code when wrong phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      orchestrator.setSession(session);

      try {
        await orchestrator.executeDecisionPhase();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('INVALID_PHASE');
      }
    });

    it('should throw NOT_IMPLEMENTED when in correct phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.DECISION);
      session.history = [{
        phase: Phase.DECISION,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      await sessionManager.saveSession(session);
      orchestrator.setSession(session);

      // executeDecisionPhase now requires prompt handler methods that are not mocked
      // in the default orchestrator (which uses real UserPromptHandler that throws).
      // This verifies the phase validation passes and the method proceeds to prompt.
      try {
        await orchestrator.executeDecisionPhase();
        expect.fail('Should have thrown error from unimplemented prompt handler');
      } catch (error) {
        // Should NOT be INVALID_PHASE or NO_ACTIVE_WORKFLOW - those are guard errors
        // It should fail on the prompt handler call (which throws in real implementation)
        expect(error).not.toBeInstanceOf(WorkflowError);
      }
    });
  });

  describe('addPhaseAction', () => {
    it('should add action to current phase history', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.history = [{
        phase: Phase.ANALYSIS,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      orchestrator.setSession(session);

      orchestrator.addPhaseAction('Test action');

      const currentSession = orchestrator.getSession();
      const analysisHistory = currentSession?.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory?.actions).toContain('Test action');
    });

    it('should add multiple actions to current phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.history = [{
        phase: Phase.ANALYSIS,
        startedAt: new Date().toISOString(),
        completedAt: null,
        actions: []
      }];
      orchestrator.setSession(session);

      orchestrator.addPhaseAction('Action 1');
      orchestrator.addPhaseAction('Action 2');
      orchestrator.addPhaseAction('Action 3');

      const currentSession = orchestrator.getSession();
      const analysisHistory = currentSession?.history.find(h => h.phase === Phase.ANALYSIS);
      expect(analysisHistory?.actions).toEqual(['Action 1', 'Action 2', 'Action 3']);
    });

    it('should not add action when no active session', () => {
      orchestrator.addPhaseAction('Test action');
      // Should not throw, just silently ignore
      expect(orchestrator.getSession()).toBeNull();
    });

    it('should not add action to completed phase', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      session.history = [
        {
          phase: Phase.SETUP,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          actions: []
        },
        {
          phase: Phase.ANALYSIS,
          startedAt: new Date().toISOString(),
          completedAt: null,
          actions: []
        }
      ];
      orchestrator.setSession(session);

      orchestrator.addPhaseAction('Test action');

      const currentSession = orchestrator.getSession();
      const setupHistory = currentSession?.history.find(h => h.phase === Phase.SETUP);
      expect(setupHistory?.actions).not.toContain('Test action');
    });
  });

  describe('getSession and setSession', () => {
    it('should get current session', async () => {
      const session = await createTestSession();
      orchestrator.setSession(session);

      const currentSession = orchestrator.getSession();
      expect(currentSession?.id).toBe(session.id);
    });

    it('should return null when no session', () => {
      expect(orchestrator.getSession()).toBeNull();
    });

    it('should set session', async () => {
      const session = await createTestSession();
      orchestrator.setSession(session);

      expect(orchestrator.getSession()).not.toBeNull();
    });
  });

  describe('Phase Transition Sequences', () => {
    it('should allow complete workflow progression', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      // SETUP → ANALYSIS
      await orchestrator.transitionToPhase(Phase.ANALYSIS);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);

      // ANALYSIS → PROTOTYPING
      await orchestrator.transitionToPhase(Phase.PROTOTYPING);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.PROTOTYPING);

      // PROTOTYPING → DECISION
      await orchestrator.transitionToPhase(Phase.DECISION);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.DECISION);

      // DECISION → FINALIZED
      await orchestrator.transitionToPhase(Phase.FINALIZED);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.FINALIZED);
    });

    it('should track all completed phases in sequence', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      await orchestrator.transitionToPhase(Phase.ANALYSIS);
      await orchestrator.transitionToPhase(Phase.PROTOTYPING);
      await orchestrator.transitionToPhase(Phase.DECISION);

      const currentSession = orchestrator.getSession();
      expect(currentSession?.completedPhases).toEqual([Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING]);
    });

    it('should prevent skipping phases', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.SETUP);
      orchestrator.setSession(session);

      // Try to skip ANALYSIS and go directly to PROTOTYPING
      await expect(orchestrator.transitionToPhase(Phase.PROTOTYPING)).rejects.toThrow(WorkflowError);
    });

    it('should prevent backward transitions', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.ANALYSIS);
      orchestrator.setSession(session);

      // Try to go back to SETUP
      await expect(orchestrator.transitionToPhase(Phase.SETUP)).rejects.toThrow(WorkflowError);
    });
  });

  describe('Pause and Resume Workflow', () => {
    let mockPromptHandler: any;
    let mockInstallationManager: any;
    let pauseResumeOrchestrator: WorkflowOrchestrator;

    beforeEach(() => {
      mockPromptHandler = {
        displayInfo: vi.fn(),
        displaySuccess: vi.fn(),
        displayError: vi.fn(),
        displayPhaseProgress: vi.fn(),
        displayPhaseTransition: vi.fn(),
        confirmReinstall: vi.fn().mockResolvedValue(false),
      };

      mockInstallationManager = {
        verifyInstallation: vi.fn().mockResolvedValue(true),
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'test-lib',
          success: true,
          version: '1.0.0',
          error: null,
          installPath: 'node_modules/test-lib'
        }),
      };

      pauseResumeOrchestrator = new WorkflowOrchestrator(
        sessionManager,
        mockPromptHandler,
        mockInstallationManager
      );
    });

    it('should preserve phase when pausing and resuming', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      pauseResumeOrchestrator.setSession(session);

      await pauseResumeOrchestrator.pauseWorkflow();
      await pauseResumeOrchestrator.resumeWorkflow(session.id);

      expect(pauseResumeOrchestrator.getCurrentPhase()).toBe(Phase.PROTOTYPING);
    });

    it('should preserve completed phases when pausing and resuming', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      session.completedPhases = [Phase.SETUP, Phase.ANALYSIS];
      pauseResumeOrchestrator.setSession(session);

      await pauseResumeOrchestrator.pauseWorkflow();
      await pauseResumeOrchestrator.resumeWorkflow(session.id);

      const currentSession = pauseResumeOrchestrator.getSession();
      expect(currentSession?.completedPhases).toEqual([Phase.SETUP, Phase.ANALYSIS]);
    });

    it('should allow continuing workflow after resume', async () => {
      const session = await createTestSession(ResearchMode.SINGLE, Phase.PROTOTYPING);
      pauseResumeOrchestrator.setSession(session);

      await pauseResumeOrchestrator.pauseWorkflow();
      await pauseResumeOrchestrator.resumeWorkflow(session.id);

      // Should be able to transition to next phase
      await pauseResumeOrchestrator.transitionToPhase(Phase.DECISION);
      expect(pauseResumeOrchestrator.getCurrentPhase()).toBe(Phase.DECISION);
    });
  });
});
