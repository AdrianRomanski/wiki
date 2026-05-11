/**
 * Property-based testing configuration and utilities
 * Feature: polished-research-workflow
 */

import * as fc from 'fast-check';

/**
 * Default configuration for property tests
 * Minimum 100 iterations per property test as per design spec
 */
export const PROPERTY_TEST_CONFIG = {
  numRuns: 100,
  verbose: false,
  seed: undefined, // Use random seed by default
  path: undefined,
  endOnFailure: false,
};

/**
 * Extended configuration for more thorough testing
 */
export const EXTENDED_PROPERTY_TEST_CONFIG = {
  ...PROPERTY_TEST_CONFIG,
  numRuns: 1000,
};

/**
 * Arbitrary generators for workflow types
 */

/**
 * Generate arbitrary research mode
 */
export const arbitraryResearchMode = () =>
  fc.constantFrom('SINGLE', 'COMPARISON');

/**
 * Generate arbitrary library name
 */
export const arbitraryLibraryName = () =>
  fc.stringMatching(/^[a-z0-9-@/]+$/);

/**
 * Generate arbitrary library list for single mode (exactly 1)
 */
export const arbitrarySingleModeLibraries = () =>
  fc.array(arbitraryLibraryName(), { minLength: 1, maxLength: 1 });

/**
 * Generate arbitrary library list for comparison mode (2-3)
 */
export const arbitraryComparisonModeLibraries = () =>
  fc.array(arbitraryLibraryName(), { minLength: 2, maxLength: 3 });

/**
 * Generate arbitrary phase
 */
export const arbitraryPhase = () =>
  fc.constantFrom('IDLE', 'SETUP', 'ANALYSIS', 'PROTOTYPING', 'DECISION', 'FINALIZED');

/**
 * Generate arbitrary session status
 */
export const arbitrarySessionStatus = () =>
  fc.constantFrom('ACTIVE', 'PAUSED', 'FINALIZED');

/**
 * Generate arbitrary artifact type
 */
export const arbitraryArtifactType = () =>
  fc.constantFrom(
    'BIG_PICTURE',
    'COMPARISON_VIEW',
    'PROTOTYPE',
    'PHASE_REPORT',
    'FINAL_REPORT',
    'ADR',
    'RESEARCH_DECISION_RECORD'
  );

/**
 * Generate arbitrary ISO date string
 */
export const arbitraryISODate = () =>
  fc.integer({ min: 1577836800000, max: 1893456000000 }).map(ts => new Date(ts).toISOString());

/**
 * Generate arbitrary library info
 */
export const arbitraryLibraryInfo = () =>
  fc.record({
    name: arbitraryLibraryName(),
    version: fc.stringMatching(/^\d+\.\d+\.\d+$/),
    installedAt: arbitraryISODate(),
    installPath: fc.string(),
  });

/**
 * Generate arbitrary session metadata
 */
export const arbitrarySessionMetadata = () =>
  fc.record({
    goal: fc.string({ minLength: 10, maxLength: 200 }),
    mode: arbitraryResearchMode(),
    libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 3 }),
    documentationLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
    userInputs: fc.dictionary(fc.string(), fc.anything()),
  });

/**
 * Generate arbitrary phase history entry
 */
export const arbitraryPhaseHistory = () =>
  fc.record({
    phase: arbitraryPhase(),
    startedAt: arbitraryISODate(),
    completedAt: fc.option(arbitraryISODate(), { nil: null }),
    actions: fc.array(fc.string(), { maxLength: 10 }),
  });

/**
 * Generate arbitrary artifact reference
 */
export const arbitraryArtifactReference = () =>
  fc.record({
    type: arbitraryArtifactType(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    path: fc.string(),
    createdAt: arbitraryISODate(),
  });

/**
 * Generate arbitrary session
 */
export const arbitrarySession = () =>
  fc.record({
    id: fc.uuid(),
    createdAt: arbitraryISODate(),
    updatedAt: arbitraryISODate(),
    status: arbitrarySessionStatus(),
    currentPhase: arbitraryPhase(),
    completedPhases: fc.array(arbitraryPhase(), { maxLength: 5 }),
    metadata: arbitrarySessionMetadata(),
    artifacts: fc.array(arbitraryArtifactReference(), { maxLength: 10 }),
    history: fc.array(arbitraryPhaseHistory(), { maxLength: 6 }),
  });
