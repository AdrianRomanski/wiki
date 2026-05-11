/**
 * Unit tests for UserPromptHandler
 * Feature: polished-research-workflow
 * Requirements: 7.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPromptHandler } from './UserPromptHandler.js';
import { Phase, ResearchMode } from '../types/index.js';

describe('UserPromptHandler', () => {
  let handler: UserPromptHandler;

  beforeEach(() => {
    handler = new UserPromptHandler();
  });

  describe('validateLibraries', () => {
    describe('SINGLE mode validation', () => {
      it('should accept exactly 1 library in SINGLE mode', () => {
        const result = handler.validateLibraries(['focus-trap'], ResearchMode.SINGLE);
        expect(result).toBe(true);
      });

      it('should reject 0 libraries in SINGLE mode', () => {
        const result = handler.validateLibraries([], ResearchMode.SINGLE);
        expect(result).toBe(false);
      });

      it('should reject 2 libraries in SINGLE mode', () => {
        const result = handler.validateLibraries(['focus-trap', 'aria-modal'], ResearchMode.SINGLE);
        expect(result).toBe(false);
      });

      it('should reject 3 libraries in SINGLE mode', () => {
        const result = handler.validateLibraries(
          ['focus-trap', 'aria-modal', '@angular/cdk/a11y'],
          ResearchMode.SINGLE
        );
        expect(result).toBe(false);
      });
    });

    describe('COMPARISON mode validation', () => {
      it('should accept 2 libraries in COMPARISON mode', () => {
        const result = handler.validateLibraries(
          ['focus-trap', 'aria-modal'],
          ResearchMode.COMPARISON
        );
        expect(result).toBe(true);
      });

      it('should accept 3 libraries in COMPARISON mode', () => {
        const result = handler.validateLibraries(
          ['focus-trap', 'aria-modal', '@angular/cdk/a11y'],
          ResearchMode.COMPARISON
        );
        expect(result).toBe(true);
      });

      it('should reject 1 library in COMPARISON mode', () => {
        const result = handler.validateLibraries(['focus-trap'], ResearchMode.COMPARISON);
        expect(result).toBe(false);
      });

      it('should reject 0 libraries in COMPARISON mode', () => {
        const result = handler.validateLibraries([], ResearchMode.COMPARISON);
        expect(result).toBe(false);
      });

      it('should reject 4 libraries in COMPARISON mode', () => {
        const result = handler.validateLibraries(
          ['focus-trap', 'aria-modal', '@angular/cdk/a11y', 'tabbable'],
          ResearchMode.COMPARISON
        );
        expect(result).toBe(false);
      });
    });
  });

  describe('displayError', () => {
    it('should display error message with error icon', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      handler.displayError('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith('\n❌ Error: Test error message\n');
      consoleSpy.mockRestore();
    });
  });

  describe('displaySuccess', () => {
    it('should display success message with success icon', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displaySuccess('Test success message');
      
      expect(consoleSpy).toHaveBeenCalledWith('\n✅ Test success message\n');
      consoleSpy.mockRestore();
    });
  });

  describe('displayInfo', () => {
    it('should display info message with info icon', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayInfo('Test info message');
      
      expect(consoleSpy).toHaveBeenCalledWith('\nℹ️  Test info message\n');
      consoleSpy.mockRestore();
    });
  });

  describe('displayPhaseTransition', () => {
    it('should display phase transition message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayPhaseTransition(Phase.SETUP, Phase.ANALYSIS);
      
      expect(consoleSpy).toHaveBeenCalledWith('\n🔄 Transitioning from SETUP to ANALYSIS...\n');
      consoleSpy.mockRestore();
    });
  });

  describe('displayPhaseProgress', () => {
    it('should display progress with no completed phases', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayPhaseProgress(Phase.SETUP, []);
      
      expect(consoleSpy).toHaveBeenCalledWith('\n=== Workflow Progress ===');
      expect(consoleSpy).toHaveBeenCalledWith('🔵 SETUP');
      expect(consoleSpy).toHaveBeenCalledWith('⚪ ANALYSIS');
      expect(consoleSpy).toHaveBeenCalledWith('⚪ PROTOTYPING');
      expect(consoleSpy).toHaveBeenCalledWith('⚪ DECISION');
      
      consoleSpy.mockRestore();
    });

    it('should display progress with some completed phases', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayPhaseProgress(Phase.PROTOTYPING, [Phase.SETUP, Phase.ANALYSIS]);
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ SETUP');
      expect(consoleSpy).toHaveBeenCalledWith('✅ ANALYSIS');
      expect(consoleSpy).toHaveBeenCalledWith('🔵 PROTOTYPING');
      expect(consoleSpy).toHaveBeenCalledWith('⚪ DECISION');
      
      consoleSpy.mockRestore();
    });

    it('should display progress with all phases completed', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayPhaseProgress(
        Phase.FINALIZED,
        [Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING, Phase.DECISION]
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ SETUP');
      expect(consoleSpy).toHaveBeenCalledWith('✅ ANALYSIS');
      expect(consoleSpy).toHaveBeenCalledWith('✅ PROTOTYPING');
      expect(consoleSpy).toHaveBeenCalledWith('✅ DECISION');
      
      consoleSpy.mockRestore();
    });
  });

  describe('displayArtifactSummary', () => {
    it('should display message when no artifacts exist', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      handler.displayArtifactSummary([]);
      
      expect(consoleSpy).toHaveBeenCalledWith('\n=== Generated Artifacts ===');
      expect(consoleSpy).toHaveBeenCalledWith('No artifacts generated yet.');
      
      consoleSpy.mockRestore();
    });

    it('should display artifact list when artifacts exist', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const artifacts = [
        {
          type: 'BIG_PICTURE',
          name: 'focus-trap-big-picture.md',
          path: 'libraries/focus-trap/big-picture.md'
        },
        {
          type: 'PROTOTYPE',
          name: 'basic-modal.ts',
          path: 'prototypes/basic-modal.ts'
        }
      ];
      
      handler.displayArtifactSummary(artifacts);
      
      expect(consoleSpy).toHaveBeenCalledWith('\n=== Generated Artifacts ===');
      expect(consoleSpy).toHaveBeenCalledWith('📄 BIG_PICTURE: focus-trap-big-picture.md');
      expect(consoleSpy).toHaveBeenCalledWith('   Location: libraries/focus-trap/big-picture.md');
      expect(consoleSpy).toHaveBeenCalledWith('📄 PROTOTYPE: basic-modal.ts');
      expect(consoleSpy).toHaveBeenCalledWith('   Location: prototypes/basic-modal.ts');
      
      consoleSpy.mockRestore();
    });
  });

  describe('prompt methods', () => {
    it('promptForGoal should throw not implemented error', async () => {
      await expect(handler.promptForGoal()).rejects.toThrow(
        'promptForGoal: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForResearchMode should throw not implemented error', async () => {
      await expect(handler.promptForResearchMode()).rejects.toThrow(
        'promptForResearchMode: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForLibraries should throw not implemented error', async () => {
      await expect(handler.promptForLibraries(ResearchMode.SINGLE)).rejects.toThrow(
        'promptForLibraries: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForDocumentationLinks should throw not implemented error', async () => {
      await expect(handler.promptForDocumentationLinks()).rejects.toThrow(
        'promptForDocumentationLinks: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForBigPictureAnalysis should throw not implemented error', async () => {
      await expect(handler.promptForBigPictureAnalysis()).rejects.toThrow(
        'promptForBigPictureAnalysis: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForPrototypeRequest should throw not implemented error', async () => {
      await expect(handler.promptForPrototypeRequest()).rejects.toThrow(
        'promptForPrototypeRequest: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForDecision should throw not implemented error', async () => {
      await expect(handler.promptForDecision(['focus-trap'], ResearchMode.SINGLE)).rejects.toThrow(
        'promptForDecision: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForDecisionRationale should throw not implemented error', async () => {
      await expect(handler.promptForDecisionRationale()).rejects.toThrow(
        'promptForDecisionRationale: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForWikiIntegration should throw not implemented error', async () => {
      await expect(handler.promptForWikiIntegration()).rejects.toThrow(
        'promptForWikiIntegration: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('promptForPhaseSkip should throw not implemented error', async () => {
      await expect(handler.promptForPhaseSkip(Phase.ANALYSIS)).rejects.toThrow(
        'promptForPhaseSkip: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('confirmReinstall should throw not implemented error', async () => {
      await expect(handler.confirmReinstall('focus-trap')).rejects.toThrow(
        'confirmReinstall: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('confirmSkipPhase should throw not implemented error', async () => {
      await expect(handler.confirmSkipPhase(Phase.ANALYSIS)).rejects.toThrow(
        'promptForPhaseSkip: User input collection not yet implemented - requires CLI integration'
      );
    });

    it('confirmFinalization should throw not implemented error', async () => {
      await expect(handler.confirmFinalization()).rejects.toThrow(
        'confirmFinalization: User input collection not yet implemented - requires CLI integration'
      );
    });
  });
});
