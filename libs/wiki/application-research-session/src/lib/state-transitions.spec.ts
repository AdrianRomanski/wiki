/**
 * Unit tests for state transition logic
 * Feature: article-research-session
 * Requirements: 8.1, 9.5
 *
 * Migrated from scripts/research-workflow/session-manager/state-transitions.test.ts.
 * This module is a pure function with no I/O, so the migration is limited to
 * updating import paths to @wiki/domain-research-session.
 */

import { describe, it, expect } from 'vitest';
import { transitionState, InvalidTransitionError } from './state-transitions';
import type { SessionJson } from '@wiki/domain-research-session';

/**
 * Helper to create a minimal valid SessionJson for testing.
 */
function makeSession(overrides: Partial<SessionJson> = {}): SessionJson {
  return {
    id: 'test-session',
    topic: 'Test topic',
    state: 'EXPLORE',
    scope: 'article',
    createdAt: '2025-01-15',
    articleInputType: 'url',
    articleUrl: 'https://example.com/article',
    ...overrides,
  };
}

describe('transitionState', () => {
  describe('EXPLORE → SYNTHESIZE', () => {
    it('succeeds when articleTitle is confirmed', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: 'My Article Title',
      });
      const result = transitionState(session, 'SYNTHESIZE');
      expect(result.state).toBe('SYNTHESIZE');
    });

    it('preserves all other session fields', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: 'My Article Title',
        articleAuthor: 'Author Name',
        articleDate: '2025-01-10',
      });
      const result = transitionState(session, 'SYNTHESIZE');
      expect(result.id).toBe(session.id);
      expect(result.topic).toBe(session.topic);
      expect(result.articleTitle).toBe(session.articleTitle);
      expect(result.articleAuthor).toBe(session.articleAuthor);
      expect(result.articleDate).toBe(session.articleDate);
    });

    it('throws InvalidTransitionError when articleTitle is missing', () => {
      const session = makeSession({ state: 'EXPLORE' });
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
    });

    it('throws InvalidTransitionError when articleTitle is undefined', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: undefined,
      });
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
    });

    it('throws with informative message about articleTitle not confirmed', () => {
      const session = makeSession({ state: 'EXPLORE' });
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        /articleTitle has not been confirmed/
      );
    });

    it('throws when articleTitle is empty string', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: '',
      });
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('SYNTHESIZE → FINALIZE', () => {
    it('succeeds from SYNTHESIZE to FINALIZE', () => {
      const session = makeSession({
        state: 'SYNTHESIZE',
        articleTitle: 'My Article',
      });
      const result = transitionState(session, 'FINALIZE');
      expect(result.state).toBe('FINALIZE');
    });

    it('preserves session data', () => {
      const session = makeSession({
        state: 'SYNTHESIZE',
        articleTitle: 'My Article',
      });
      const result = transitionState(session, 'FINALIZE');
      expect(result.id).toBe(session.id);
      expect(result.articleTitle).toBe(session.articleTitle);
    });
  });

  describe('FINALIZE → FINALIZED', () => {
    it('succeeds from FINALIZE to FINALIZED', () => {
      const session = makeSession({
        state: 'FINALIZE',
        articleTitle: 'My Article',
      });
      const result = transitionState(session, 'FINALIZED');
      expect(result.state).toBe('FINALIZED');
    });
  });

  describe('any active state → PAUSED', () => {
    it('allows EXPLORE → PAUSED', () => {
      const session = makeSession({ state: 'EXPLORE' });
      const result = transitionState(session, 'PAUSED');
      expect(result.state).toBe('PAUSED');
    });

    it('allows SYNTHESIZE → PAUSED', () => {
      const session = makeSession({
        state: 'SYNTHESIZE',
        articleTitle: 'My Article',
      });
      const result = transitionState(session, 'PAUSED');
      expect(result.state).toBe('PAUSED');
    });

    it('allows FINALIZE → PAUSED', () => {
      const session = makeSession({
        state: 'FINALIZE',
        articleTitle: 'My Article',
      });
      const result = transitionState(session, 'PAUSED');
      expect(result.state).toBe('PAUSED');
    });
  });

  describe('invalid transitions', () => {
    it('rejects EXPLORE → FINALIZE (skipping SYNTHESIZE)', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'FINALIZE')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects EXPLORE → FINALIZED (skipping steps)', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'FINALIZED')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects SYNTHESIZE → FINALIZED (skipping FINALIZE)', () => {
      const session = makeSession({
        state: 'SYNTHESIZE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'FINALIZED')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects SYNTHESIZE → EXPLORE (backward transition)', () => {
      const session = makeSession({
        state: 'SYNTHESIZE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'EXPLORE')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects FINALIZE → EXPLORE (backward transition)', () => {
      const session = makeSession({
        state: 'FINALIZE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'EXPLORE')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects FINALIZE → SYNTHESIZE (backward transition)', () => {
      const session = makeSession({
        state: 'FINALIZE',
        articleTitle: 'My Article',
      });
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects FINALIZED → any state', () => {
      const session = makeSession({
        state: 'FINALIZED',
        articleTitle: 'My Article',
        finalizedAt: '2025-01-15',
        wikiPages: [],
      });
      expect(() => transitionState(session, 'EXPLORE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'FINALIZE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'PAUSED')).toThrow(
        InvalidTransitionError
      );
    });

    it('rejects PAUSED → any state (must use resume)', () => {
      const session = makeSession({
        state: 'PAUSED',
        pausedAt: '2025-01-15',
        resumeFrom: 'EXPLORE',
      });
      expect(() => transitionState(session, 'EXPLORE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'SYNTHESIZE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'FINALIZE')).toThrow(
        InvalidTransitionError
      );
      expect(() => transitionState(session, 'FINALIZED')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('error messages are informative', () => {
    it('includes from and to states in error', () => {
      const session = makeSession({ state: 'EXPLORE' });
      try {
        transitionState(session, 'FINALIZED');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTransitionError);
        const err = e as InvalidTransitionError;
        expect(err.fromState).toBe('EXPLORE');
        expect(err.toState).toBe('FINALIZED');
        expect(err.message).toContain('EXPLORE');
        expect(err.message).toContain('FINALIZED');
      }
    });

    it('provides reason for PAUSED rejection', () => {
      const session = makeSession({
        state: 'PAUSED',
        pausedAt: '2025-01-15',
        resumeFrom: 'EXPLORE',
      });
      try {
        transitionState(session, 'EXPLORE');
      } catch (e) {
        const err = e as InvalidTransitionError;
        expect(err.reason).toContain('resume');
      }
    });

    it('provides reason for FINALIZED rejection', () => {
      const session = makeSession({
        state: 'FINALIZED',
        articleTitle: 'My Article',
        finalizedAt: '2025-01-15',
        wikiPages: [],
      });
      try {
        transitionState(session, 'EXPLORE');
      } catch (e) {
        const err = e as InvalidTransitionError;
        expect(err.reason).toContain('Finalized');
      }
    });
  });

  describe('immutability', () => {
    it('does not mutate the original session object', () => {
      const session = makeSession({
        state: 'EXPLORE',
        articleTitle: 'My Article',
      });
      const originalState = session.state;
      transitionState(session, 'SYNTHESIZE');
      expect(session.state).toBe(originalState);
    });
  });
});
