/**
 * Integration tests for Phase 1: Setup
 * Feature: polished-research-workflow
 * Requirements: 7.6, 7.7
 *
 * These tests exercise the complete setup flow end-to-end,
 * using real SessionManager with mocked I/O (prompts, npm).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { SessionManager } from '../session/SessionManager';
import { UserPromptHandler } from '../prompts/UserPromptHandler';
import { LibraryInstallationManager } from '../installation/LibraryInstallationManager';
import { Phase, ResearchMode, SessionStatus } from '../types/core';
import { WorkflowError } from '../errors/WorkflowError';

describe('Phase 1: Setup - Integration Tests', () => {
  const testBaseDir = path.join(process.cwd(), '.test-integration-setup');
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
   * Creates a mock prompt handler with configurable responses
   */
  function createMockPromptHandler(overrides: Record<string, any> = {}) {
    return {
      promptForGoal: vi.fn().mockResolvedValue('Research focus trap libraries'),
      promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.SINGLE),
      promptForLibraries: vi.fn().mockResolvedValue(['focus-trap']),
      promptForDocumentationLinks: vi.fn().mockResolvedValue([]),
      promptForBigPictureAnalysis: vi.fn().mockResolvedValue(true),
      promptForPrototypeRequest: vi.fn().mockResolvedValue(null),
      promptForDecision: vi.fn().mockResolvedValue('focus-trap'),
      promptForDecisionRationale: vi.fn().mockResolvedValue('Best fit'),
      promptForWikiIntegration: vi.fn().mockResolvedValue(false),
      promptForPhaseSkip: vi.fn().mockResolvedValue(false),
      promptForCorrectedLibraryName: vi.fn().mockResolvedValue(null),
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
   * Creates a mock installation manager with configurable behavior
   */
  function createMockInstallationManager(overrides: Record<string, any> = {}) {
    return {
      installLibrary: vi.fn().mockResolvedValue({
        libraryName: 'focus-trap',
        success: true,
        version: '7.5.4',
        error: null,
        installPath: 'node_modules/focus-trap'
      }),
      verifyInstallation: vi.fn().mockResolvedValue(false),
      getInstalledVersion: vi.fn().mockResolvedValue('7.5.4'),
      reinstallLibrary: vi.fn().mockResolvedValue({
        libraryName: 'focus-trap',
        success: true,
        version: '7.5.4',
        error: null,
        installPath: 'node_modules/focus-trap'
      }),
      installLibraries: vi.fn().mockResolvedValue([]),
      verifyLibraries: vi.fn().mockResolvedValue({ allVerified: true, results: new Map(), missingLibraries: [] }),
      isLibraryInstalled: vi.fn().mockResolvedValue(false),
      getLibraryInfo: vi.fn().mockResolvedValue({ name: '', version: null, path: '', installed: false }),
      ...overrides
    } as unknown as LibraryInstallationManager;
  }

  describe('Complete setup flow with single library', () => {
    it('should complete full setup and transition to ANALYSIS', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should create a persisted session with correct metadata', async () => {
      const promptHandler = createMockPromptHandler({
        promptForGoal: vi.fn().mockResolvedValue('Evaluate focus-trap for modal dialogs'),
        promptForDocumentationLinks: vi.fn().mockResolvedValue([
          'https://github.com/focus-trap/focus-trap'
        ])
      });
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      expect(session).not.toBeNull();
      expect(session.metadata.goal).toBe('Evaluate focus-trap for modal dialogs');
      expect(session.metadata.mode).toBe(ResearchMode.SINGLE);
      expect(session.metadata.libraries).toHaveLength(1);
      expect(session.metadata.libraries[0].name).toBe('focus-trap');
      expect(session.metadata.libraries[0].version).toBe('7.5.4');
      expect(session.metadata.documentationLinks).toEqual([
        'https://github.com/focus-trap/focus-trap'
      ]);

      // Verify session was persisted to disk
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.metadata.goal).toBe('Evaluate focus-trap for modal dialogs');
      expect(loadedSession.currentPhase).toBe(Phase.ANALYSIS);
      expect(loadedSession.status).toBe(SessionStatus.ACTIVE);
    });

    it('should record setup actions in phase history', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      const setupHistory = session.history.find(h => h.phase === Phase.SETUP);
      expect(setupHistory).toBeDefined();
      expect(setupHistory!.actions).toContain('Collected goal: "Research focus trap libraries"');
      expect(setupHistory!.actions).toContain('Selected SINGLE mode');
      expect(setupHistory!.actions).toContain('Installed focus-trap@7.5.4');
      expect(setupHistory!.completedAt).not.toBeNull();
    });

    it('should mark SETUP as completed phase after transition', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      expect(session.completedPhases).toContain(Phase.SETUP);
    });

    it('should use existing installation when user declines reinstall', async () => {
      const installManager = createMockInstallationManager({
        verifyInstallation: vi.fn().mockResolvedValue(true),
        getInstalledVersion: vi.fn().mockResolvedValue('7.4.0')
      });
      const promptHandler = createMockPromptHandler({
        confirmReinstall: vi.fn().mockResolvedValue(false)
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(installManager.installLibrary).not.toHaveBeenCalled();
      const session = orchestrator.getSession()!;
      expect(session.metadata.libraries[0].version).toBe('7.4.0');
    });
  });

  describe('Complete setup flow with comparison mode (2-3 libraries)', () => {
    it('should complete setup with 2 libraries in comparison mode', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'focus-trap',
            success: true,
            version: '7.5.4',
            error: null,
            installPath: 'node_modules/focus-trap'
          })
          .mockResolvedValueOnce({
            libraryName: '@angular/cdk',
            success: true,
            version: '17.0.0',
            error: null,
            installPath: 'node_modules/@angular/cdk'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      expect(session.metadata.mode).toBe(ResearchMode.COMPARISON);
      expect(session.metadata.libraries).toHaveLength(2);
      expect(session.metadata.libraries[0].name).toBe('focus-trap');
      expect(session.metadata.libraries[1].name).toBe('@angular/cdk');
      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should complete setup with 3 libraries in comparison mode', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['focus-trap', '@angular/cdk', 'aria-modal'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'focus-trap',
            success: true,
            version: '7.5.4',
            error: null,
            installPath: 'node_modules/focus-trap'
          })
          .mockResolvedValueOnce({
            libraryName: '@angular/cdk',
            success: true,
            version: '17.0.0',
            error: null,
            installPath: 'node_modules/@angular/cdk'
          })
          .mockResolvedValueOnce({
            libraryName: 'aria-modal',
            success: true,
            version: '4.0.1',
            error: null,
            installPath: 'node_modules/aria-modal'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      expect(session.metadata.libraries).toHaveLength(3);
      expect(session.metadata.libraries.map(l => l.name)).toEqual([
        'focus-trap',
        '@angular/cdk',
        'aria-modal'
      ]);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should persist comparison session with all library versions', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'lib-a',
            success: true,
            version: '1.0.0',
            error: null,
            installPath: 'node_modules/lib-a'
          })
          .mockResolvedValueOnce({
            libraryName: 'lib-b',
            success: true,
            version: '2.3.1',
            error: null,
            installPath: 'node_modules/lib-b'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.metadata.libraries[0].version).toBe('1.0.0');
      expect(loadedSession.metadata.libraries[1].version).toBe('2.3.1');
    });

    it('should record all library installations in history', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'lib-a',
            success: true,
            version: '1.0.0',
            error: null,
            installPath: 'node_modules/lib-a'
          })
          .mockResolvedValueOnce({
            libraryName: 'lib-b',
            success: true,
            version: '2.0.0',
            error: null,
            installPath: 'node_modules/lib-b'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      const setupHistory = session.history.find(h => h.phase === Phase.SETUP);
      expect(setupHistory!.actions).toContain('Selected COMPARISON mode');
      expect(setupHistory!.actions).toContain('Installed lib-a@1.0.0');
      expect(setupHistory!.actions).toContain('Installed lib-b@2.0.0');
    });
  });

  describe('Handling installation failure and retry', () => {
    it('should retry installation up to 3 attempts before skipping', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'focus-trap',
          success: false,
          version: null,
          error: 'npm ERR! 404 Not Found',
          installPath: null
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      // Single library mode - all retries fail, should throw
      await expect(orchestrator.executeSetupPhase()).rejects.toThrow(WorkflowError);

      // installLibrary called 3 times (initial + 2 retries)
      expect(installManager.installLibrary).toHaveBeenCalledTimes(3);
    });

    it('should throw ALL_INSTALLATIONS_FAILED when single library fails all retries', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'nonexistent-lib',
          success: false,
          version: null,
          error: 'Package not found',
          installPath: null
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      try {
        await orchestrator.executeSetupPhase();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('ALL_INSTALLATIONS_FAILED');
      }
    });

    it('should succeed on retry after initial failure', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'focus-trap',
            success: false,
            version: null,
            error: 'Network timeout',
            installPath: null
          })
          .mockResolvedValueOnce({
            libraryName: 'focus-trap',
            success: true,
            version: '7.5.4',
            error: null,
            installPath: 'node_modules/focus-trap'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
      expect(installManager.installLibrary).toHaveBeenCalledTimes(2);
    });

    it('should throw INSUFFICIENT_LIBRARIES when comparison mode has < 2 installed', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValue({
            libraryName: 'lib-a',
            success: true,
            version: '1.0.0',
            error: null,
            installPath: 'node_modules/lib-a'
          })
      });

      // Override: first call succeeds, second always fails
      installManager.installLibrary = vi.fn()
        .mockImplementation(async (name: string) => {
          if (name === 'lib-a') {
            return { libraryName: 'lib-a', success: true, version: '1.0.0', error: null, installPath: 'node_modules/lib-a' };
          }
          return { libraryName: name, success: false, version: null, error: 'Not found', installPath: null };
        });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      try {
        await orchestrator.executeSetupPhase();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(WorkflowError);
        expect((error as WorkflowError).code).toBe('INSUFFICIENT_LIBRARIES');
      }
    });

    it('should continue with partial success in comparison mode when >= 2 installed', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn().mockResolvedValue(['lib-a', 'lib-b', 'lib-c'])
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn().mockImplementation(async (name: string) => {
          if (name === 'lib-c') {
            return { libraryName: name, success: false, version: null, error: 'Not found', installPath: null };
          }
          return { libraryName: name, success: true, version: '1.0.0', error: null, installPath: `node_modules/${name}` };
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      const session = orchestrator.getSession()!;
      // Only 2 libraries installed (lib-c failed)
      expect(session.metadata.libraries).toHaveLength(2);
      expect(session.metadata.libraries.map(l => l.name)).toEqual(['lib-a', 'lib-b']);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });

    it('should display error messages for each failed attempt', async () => {
      const promptHandler = createMockPromptHandler();
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn().mockResolvedValue({
          libraryName: 'bad-lib',
          success: false,
          version: null,
          error: 'npm ERR! 404',
          installPath: null
        })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      try {
        await orchestrator.executeSetupPhase();
      } catch {
        // Expected to throw
      }

      // Should display error for each failed attempt
      expect(promptHandler.displayError).toHaveBeenCalled();
      const errorCalls = (promptHandler.displayError as unknown as ReturnType<typeof vi.fn>).mock.calls;
      expect(errorCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Validation rejection for invalid library counts', () => {
    it('should reject empty library list in single mode and re-prompt', async () => {
      const promptHandler = createMockPromptHandler({
        promptForLibraries: vi.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce(['focus-trap']),
        validateLibraries: vi.fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      });
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(promptHandler.promptForLibraries).toHaveBeenCalledTimes(2);
      expect(promptHandler.displayError).toHaveBeenCalledWith(
        'Single mode requires exactly 1 library.'
      );
    });

    it('should reject multiple libraries in single mode and re-prompt', async () => {
      const promptHandler = createMockPromptHandler({
        promptForLibraries: vi.fn()
          .mockResolvedValueOnce(['lib-a', 'lib-b'])
          .mockResolvedValueOnce(['focus-trap']),
        validateLibraries: vi.fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      });
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(promptHandler.promptForLibraries).toHaveBeenCalledTimes(2);
      expect(promptHandler.displayError).toHaveBeenCalledWith(
        'Single mode requires exactly 1 library.'
      );
    });

    it('should reject single library in comparison mode and re-prompt', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn()
          .mockResolvedValueOnce(['only-one'])
          .mockResolvedValueOnce(['lib-a', 'lib-b']),
        validateLibraries: vi.fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'lib-a',
            success: true,
            version: '1.0.0',
            error: null,
            installPath: 'node_modules/lib-a'
          })
          .mockResolvedValueOnce({
            libraryName: 'lib-b',
            success: true,
            version: '2.0.0',
            error: null,
            installPath: 'node_modules/lib-b'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(promptHandler.promptForLibraries).toHaveBeenCalledTimes(2);
      expect(promptHandler.displayError).toHaveBeenCalledWith(
        'Comparison mode requires 2-3 libraries (max 3).'
      );
    });

    it('should reject more than 3 libraries in comparison mode and re-prompt', async () => {
      const promptHandler = createMockPromptHandler({
        promptForResearchMode: vi.fn().mockResolvedValue(ResearchMode.COMPARISON),
        promptForLibraries: vi.fn()
          .mockResolvedValueOnce(['a', 'b', 'c', 'd'])
          .mockResolvedValueOnce(['lib-a', 'lib-b']),
        validateLibraries: vi.fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      });
      const installManager = createMockInstallationManager({
        installLibrary: vi.fn()
          .mockResolvedValueOnce({
            libraryName: 'lib-a',
            success: true,
            version: '1.0.0',
            error: null,
            installPath: 'node_modules/lib-a'
          })
          .mockResolvedValueOnce({
            libraryName: 'lib-b',
            success: true,
            version: '2.0.0',
            error: null,
            installPath: 'node_modules/lib-b'
          })
      });

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(promptHandler.promptForLibraries).toHaveBeenCalledTimes(2);
      expect(promptHandler.displayError).toHaveBeenCalledWith(
        'Comparison mode requires 2-3 libraries (max 3).'
      );
    });

    it('should keep re-prompting until valid input is provided', async () => {
      const promptHandler = createMockPromptHandler({
        promptForLibraries: vi.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce(['focus-trap']),
        validateLibraries: vi.fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
      });
      const installManager = createMockInstallationManager();

      const orchestrator = new WorkflowOrchestrator(
        sessionManager,
        promptHandler,
        installManager
      );

      await orchestrator.executeSetupPhase();

      expect(promptHandler.promptForLibraries).toHaveBeenCalledTimes(3);
      expect(promptHandler.displayError).toHaveBeenCalledTimes(2);
      expect(orchestrator.getCurrentPhase()).toBe(Phase.ANALYSIS);
    });
  });
});
