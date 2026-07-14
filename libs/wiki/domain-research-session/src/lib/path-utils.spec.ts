/**
 * Property-based tests for path utilities
 * Feature: scripts-migration-hexagonal
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeName, validatePath } from './path-utils';

describe('path-utils', () => {
  describe('Feature: scripts-migration-hexagonal, Property 5: Path utility invariants', () => {
    it('sanitizeName is idempotent for any string', () => {
      fc.assert(
        fc.property(fc.string(), (x) => {
          const once = sanitizeName(x);
          const twice = sanitizeName(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 100 }
      );
    });

    it('validatePath returns false for any path containing a ".." traversal segment', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (before, after) => {
            const traversalPath = `${before}..${after}`;
            expect(validatePath(traversalPath)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validatePath returns false for any path containing a null byte', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (before, after) => {
            const nullBytePath = `${before}\0${after}`;
            expect(validatePath(nullBytePath)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('validatePath returns false for any absolute path', () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.stringMatching(/^[a-zA-Z0-9_-]{1,10}$/), { minLength: 0, maxLength: 5 })
            .map((segments) => '/' + segments.join('/')),
          (absolutePath) => {
            expect(validatePath(absolutePath)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
