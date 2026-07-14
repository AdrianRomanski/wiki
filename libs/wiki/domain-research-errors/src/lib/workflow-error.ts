/**
 * Base error classes for workflow-specific errors
 * Feature: polished-research-workflow
 */

/**
 * Base error class for all workflow errors
 */
export class WorkflowError extends Error {
  public readonly context?: Record<string, any>;

  constructor(message: string, public readonly code: string, context?: Record<string, any>) {
    super(message);
    this.name = 'WorkflowError';
    this.context = context;
    Object.setPrototypeOf(this, WorkflowError.prototype);
  }
}

/**
 * Error thrown when phase transition is invalid
 */
export class InvalidPhaseTransitionError extends WorkflowError {
  constructor(
    public readonly fromPhase: string,
    public readonly toPhase: string,
    reason: string
  ) {
    super(
      `Invalid phase transition from ${fromPhase} to ${toPhase}: ${reason}`,
      'INVALID_PHASE_TRANSITION'
    );
    this.name = 'InvalidPhaseTransitionError';
    Object.setPrototypeOf(this, InvalidPhaseTransitionError.prototype);
  }
}

/**
 * Error thrown when session operations fail
 */
export class SessionError extends WorkflowError {
  constructor(message: string, public readonly sessionId?: string) {
    super(message, 'SESSION_ERROR');
    this.name = 'SessionError';
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}

/**
 * Error thrown when session is not found
 */
export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, sessionId);
    this.name = 'SessionNotFoundError';
    // Override the code property from parent
    Object.defineProperty(this, 'code', {
      value: 'SESSION_NOT_FOUND',
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.setPrototypeOf(this, SessionNotFoundError.prototype);
  }
}

/**
 * Error thrown when session state is corrupted
 */
export class SessionCorruptedError extends SessionError {
  constructor(sessionId: string, reason: string) {
    super(`Session corrupted: ${reason}`, sessionId);
    this.name = 'SessionCorruptedError';
    // Override the code property from parent
    Object.defineProperty(this, 'code', {
      value: 'SESSION_CORRUPTED',
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.setPrototypeOf(this, SessionCorruptedError.prototype);
  }
}

/**
 * Error thrown when attempting to modify finalized session
 */
export class SessionFinalizedError extends SessionError {
  constructor(sessionId: string) {
    super(`Cannot modify finalized session: ${sessionId}`, sessionId);
    this.name = 'SessionFinalizedError';
    // Override the code property from parent
    Object.defineProperty(this, 'code', {
      value: 'SESSION_FINALIZED',
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.setPrototypeOf(this, SessionFinalizedError.prototype);
  }
}

/**
 * Error thrown when library installation fails
 */
export class InstallationError extends WorkflowError {
  constructor(
    public readonly libraryName: string,
    reason: string
  ) {
    super(`Failed to install library ${libraryName}: ${reason}`, 'INSTALLATION_ERROR');
    this.name = 'InstallationError';
    Object.setPrototypeOf(this, InstallationError.prototype);
  }
}

/**
 * Error thrown when library verification fails
 */
export class VerificationError extends WorkflowError {
  constructor(
    public readonly libraryName: string,
    reason: string
  ) {
    super(`Failed to verify library ${libraryName}: ${reason}`, 'VERIFICATION_ERROR');
    this.name = 'VerificationError';
    Object.setPrototypeOf(this, VerificationError.prototype);
  }
}

/**
 * Error thrown when artifact generation fails
 */
export class ArtifactGenerationError extends WorkflowError {
  constructor(
    public readonly artifactType: string,
    reason: string
  ) {
    super(`Failed to generate artifact ${artifactType}: ${reason}`, 'ARTIFACT_GENERATION_ERROR');
    this.name = 'ArtifactGenerationError';
    Object.setPrototypeOf(this, ArtifactGenerationError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends WorkflowError {
  constructor(
    public readonly field: string,
    reason: string
  ) {
    super(`Validation failed for ${field}: ${reason}`, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when prerequisite check fails
 */
export class PrerequisiteError extends WorkflowError {
  constructor(
    public readonly prerequisite: string,
    reason: string
  ) {
    super(`Prerequisite not met: ${prerequisite} - ${reason}`, 'PREREQUISITE_ERROR');
    this.name = 'PrerequisiteError';
    Object.setPrototypeOf(this, PrerequisiteError.prototype);
  }
}
