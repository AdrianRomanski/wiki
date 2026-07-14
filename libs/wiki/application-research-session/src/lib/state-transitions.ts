/**
 * State transition logic for article research sessions
 * Feature: article-research-session
 * Requirements: 8.1, 9.5
 *
 * Enforces the state machine:
 *   EXPLORE → SYNTHESIZE (when articleTitle confirmed)
 *   SYNTHESIZE → FINALIZE (when user approved)
 *   FINALIZE → FINALIZED
 *   Any active state (EXPLORE, SYNTHESIZE, FINALIZE) → PAUSED
 *
 * All other transitions are rejected with an informative error.
 *
 * Pure function — no I/O in this module (migrated as-is from
 * scripts/research-workflow/session-manager/state-transitions.ts, only
 * import paths updated).
 */

import type { SessionJson, SessionState } from '@wiki/domain-research-session';

/**
 * Active states that can transition to PAUSED.
 */
const ACTIVE_STATES: ReadonlySet<SessionState> = new Set([
  'EXPLORE',
  'SYNTHESIZE',
  'FINALIZE',
]);

/**
 * Error thrown when an invalid state transition is attempted.
 */
export class InvalidTransitionError extends Error {
  public readonly fromState: SessionState;
  public readonly toState: SessionState;
  public readonly reason: string;

  constructor(fromState: SessionState, toState: SessionState, reason: string) {
    super(
      `Invalid state transition from "${fromState}" to "${toState}": ${reason}`
    );
    this.name = 'InvalidTransitionError';
    this.fromState = fromState;
    this.toState = toState;
    this.reason = reason;
  }
}

/**
 * Transitions an article session from its current state to the target state.
 *
 * Validates:
 * 1. The transition is valid according to the state machine
 * 2. For EXPLORE→SYNTHESIZE: articleTitle must be present in session
 * 3. For any→PAUSED: only active states (EXPLORE, SYNTHESIZE, FINALIZE) can be paused
 * 4. FINALIZED and PAUSED cannot transition (except PAUSED→resume, handled separately)
 *
 * @param session - The current session state (SessionJson)
 * @param toState - The target state to transition to
 * @returns A new SessionJson with the updated state
 * @throws InvalidTransitionError if the transition is not allowed
 */
export function transitionState(
  session: SessionJson,
  toState: SessionState
): SessionJson {
  const fromState = session.state;

  // PAUSED transitions are handled by resume logic, not this function
  if (fromState === 'PAUSED') {
    throw new InvalidTransitionError(
      fromState,
      toState,
      'Paused sessions must be resumed using the resume function, not transitioned directly.'
    );
  }

  // FINALIZED is a terminal state — no transitions allowed
  if (fromState === 'FINALIZED') {
    throw new InvalidTransitionError(
      fromState,
      toState,
      'Finalized sessions cannot transition to any other state.'
    );
  }

  // Handle transition to PAUSED from any active state
  if (toState === 'PAUSED') {
    if (!ACTIVE_STATES.has(fromState)) {
      throw new InvalidTransitionError(
        fromState,
        toState,
        `Only active states (EXPLORE, SYNTHESIZE, FINALIZE) can be paused. Current state "${fromState}" cannot be paused.`
      );
    }
    return { ...session, state: 'PAUSED' };
  }

  // Validate specific forward transitions
  switch (fromState) {
    case 'EXPLORE': {
      if (toState !== 'SYNTHESIZE') {
        throw new InvalidTransitionError(
          fromState,
          toState,
          'From EXPLORE, the only valid forward transition is to SYNTHESIZE.'
        );
      }
      // Requirement 9.5: articleTitle must be confirmed before leaving EXPLORE
      if (!session.articleTitle) {
        throw new InvalidTransitionError(
          fromState,
          toState,
          'Cannot advance from EXPLORE to SYNTHESIZE: articleTitle has not been confirmed.'
        );
      }
      return { ...session, state: 'SYNTHESIZE' };
    }

    case 'SYNTHESIZE': {
      if (toState !== 'FINALIZE') {
        throw new InvalidTransitionError(
          fromState,
          toState,
          'From SYNTHESIZE, the only valid forward transition is to FINALIZE.'
        );
      }
      return { ...session, state: 'FINALIZE' };
    }

    case 'FINALIZE': {
      if (toState !== 'FINALIZED') {
        throw new InvalidTransitionError(
          fromState,
          toState,
          'From FINALIZE, the only valid forward transition is to FINALIZED.'
        );
      }
      return { ...session, state: 'FINALIZED' };
    }

    default: {
      throw new InvalidTransitionError(
        fromState,
        toState,
        `Unknown current state "${fromState}".`
      );
    }
  }
}
