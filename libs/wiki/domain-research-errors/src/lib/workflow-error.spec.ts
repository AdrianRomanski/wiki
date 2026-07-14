/**
 * Unit tests for workflow error classes
 * Feature: scripts-migration-hexagonal
 */

import { describe, it, expect } from 'vitest';
import {
  WorkflowError,
  InvalidPhaseTransitionError,
  SessionError,
  SessionNotFoundError,
  SessionCorruptedError,
  SessionFinalizedError,
  InstallationError,
  VerificationError,
  ArtifactGenerationError,
  ValidationError,
  PrerequisiteError,
} from './workflow-error';

describe('Workflow Error Classes', () => {
  describe('WorkflowError', () => {
    it('should create error with message and code', () => {
      const error = new WorkflowError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('WorkflowError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidPhaseTransitionError', () => {
    it('should create error with phase information', () => {
      const error = new InvalidPhaseTransitionError('SETUP', 'DECISION', 'Missing prerequisites');
      expect(error.fromPhase).toBe('SETUP');
      expect(error.toPhase).toBe('DECISION');
      expect(error.message).toContain('SETUP');
      expect(error.message).toContain('DECISION');
      expect(error.message).toContain('Missing prerequisites');
      expect(error.code).toBe('INVALID_PHASE_TRANSITION');
      expect(error.name).toBe('InvalidPhaseTransitionError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(InvalidPhaseTransitionError);
    });
  });

  describe('SessionError', () => {
    it('should create error with session ID', () => {
      const error = new SessionError('Session failed', 'session-123');
      expect(error.message).toBe('Session failed');
      expect(error.sessionId).toBe('session-123');
      expect(error.code).toBe('SESSION_ERROR');
      expect(error.name).toBe('SessionError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(SessionError);
    });
  });

  describe('SessionNotFoundError', () => {
    it('should create error for missing session', () => {
      const error = new SessionNotFoundError('session-456');
      expect(error.sessionId).toBe('session-456');
      expect(error.message).toContain('session-456');
      expect(error.code).toBe('SESSION_NOT_FOUND');
      expect(error.name).toBe('SessionNotFoundError');
      expect(error).toBeInstanceOf(SessionError);
      expect(error).toBeInstanceOf(SessionNotFoundError);
    });
  });

  describe('SessionCorruptedError', () => {
    it('should create error for corrupted session', () => {
      const error = new SessionCorruptedError('session-789', 'Invalid JSON');
      expect(error.sessionId).toBe('session-789');
      expect(error.message).toContain('Invalid JSON');
      expect(error.code).toBe('SESSION_CORRUPTED');
      expect(error.name).toBe('SessionCorruptedError');
      expect(error).toBeInstanceOf(SessionError);
      expect(error).toBeInstanceOf(SessionCorruptedError);
    });
  });

  describe('SessionFinalizedError', () => {
    it('should create error for finalized session modification', () => {
      const error = new SessionFinalizedError('session-final');
      expect(error.sessionId).toBe('session-final');
      expect(error.message).toContain('finalized');
      expect(error.code).toBe('SESSION_FINALIZED');
      expect(error.name).toBe('SessionFinalizedError');
      expect(error).toBeInstanceOf(SessionError);
      expect(error).toBeInstanceOf(SessionFinalizedError);
    });
  });

  describe('InstallationError', () => {
    it('should create error with library name', () => {
      const error = new InstallationError('react', 'Network timeout');
      expect(error.libraryName).toBe('react');
      expect(error.message).toContain('react');
      expect(error.message).toContain('Network timeout');
      expect(error.code).toBe('INSTALLATION_ERROR');
      expect(error.name).toBe('InstallationError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(InstallationError);
    });
  });

  describe('VerificationError', () => {
    it('should create error with library name', () => {
      const error = new VerificationError('vue', 'Not found in node_modules');
      expect(error.libraryName).toBe('vue');
      expect(error.message).toContain('vue');
      expect(error.message).toContain('Not found in node_modules');
      expect(error.code).toBe('VERIFICATION_ERROR');
      expect(error.name).toBe('VerificationError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(VerificationError);
    });
  });

  describe('ArtifactGenerationError', () => {
    it('should create error with artifact type', () => {
      const error = new ArtifactGenerationError('ADR', 'Template not found');
      expect(error.artifactType).toBe('ADR');
      expect(error.message).toContain('ADR');
      expect(error.message).toContain('Template not found');
      expect(error.code).toBe('ARTIFACT_GENERATION_ERROR');
      expect(error.name).toBe('ArtifactGenerationError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(ArtifactGenerationError);
    });
  });

  describe('ValidationError', () => {
    it('should create error with field name', () => {
      const error = new ValidationError('libraries', 'Must have 2-3 libraries in comparison mode');
      expect(error.field).toBe('libraries');
      expect(error.message).toContain('libraries');
      expect(error.message).toContain('Must have 2-3 libraries');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('PrerequisiteError', () => {
    it('should create error with prerequisite name', () => {
      const error = new PrerequisiteError('big-picture-analysis', 'Analysis phase not completed');
      expect(error.prerequisite).toBe('big-picture-analysis');
      expect(error.message).toContain('big-picture-analysis');
      expect(error.message).toContain('Analysis phase not completed');
      expect(error.code).toBe('PREREQUISITE_ERROR');
      expect(error.name).toBe('PrerequisiteError');
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error).toBeInstanceOf(PrerequisiteError);
    });
  });
});
