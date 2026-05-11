/**
 * SessionManager unit tests
 * Feature: polished-research-workflow
 * Requirements: 8.7
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionManager } from './SessionManager';
import {
  SessionMetadata,
  ResearchMode,
  SessionStatus,
  Phase,
  LibraryInfo,
  ArtifactType
} from '../types/core';
import { WorkflowError } from '../errors/WorkflowError';
import {
  PROPERTY_TEST_CONFIG,
  arbitrarySessionMetadata,
  arbitraryLibraryInfo
} from '../test-utils/property-test-config';

describe('SessionManager', () => {
  const testBaseDir = path.join(process.cwd(), '.test-sessions');
  let sessionManager: SessionManager;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testBaseDir, { recursive: true });
    sessionManager = new SessionManager(testBaseDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testBaseDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createSession', () => {
    it('should create session with valid metadata', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test focus trap libraries',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'focus-trap',
            version: '7.5.4',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/focus-trap'
          }
        ],
        documentationLinks: ['https://example.com/docs'],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);

      expect(session.id).toBeDefined();
      expect(session.id).toContain('test-focus-trap-libraries');
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.currentPhase).toBe(Phase.SETUP);
      expect(session.completedPhases).toEqual([]);
      expect(session.metadata).toEqual(metadata);
      expect(session.artifacts).toEqual([]);
      expect(session.history).toEqual([]);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    it('should create session directory structure', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);

      // Verify directories exist
      const sessionDir = path.join(testBaseDir, session.id);
      const librariesDir = path.join(sessionDir, 'libraries');
      const prototypesDir = path.join(sessionDir, 'prototypes');
      const phaseReportsDir = path.join(sessionDir, 'phase-reports');

      const [sessionExists, libExists, protoExists, reportsExists] = await Promise.all([
        fs.access(sessionDir).then(() => true).catch(() => false),
        fs.access(librariesDir).then(() => true).catch(() => false),
        fs.access(prototypesDir).then(() => true).catch(() => false),
        fs.access(phaseReportsDir).then(() => true).catch(() => false)
      ]);

      expect(sessionExists).toBe(true);
      expect(libExists).toBe(true);
      expect(protoExists).toBe(true);
      expect(reportsExists).toBe(true);
    });

    it('should set created session as active', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      const activeSession = sessionManager.getActiveSession();

      expect(activeSession).toBeDefined();
      expect(activeSession?.id).toBe(session.id);
    });

    it('should reject metadata with empty goal', async () => {
      const metadata: SessionMetadata = {
        goal: '',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await expect(sessionManager.createSession(metadata)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.createSession(metadata)).rejects.toThrow('Session goal is required');
    });

    it('should reject single mode with multiple libraries', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'lib1',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/lib1'
          },
          {
            name: 'lib2',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/lib2'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await expect(sessionManager.createSession(metadata)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.createSession(metadata)).rejects.toThrow('Single mode requires exactly 1 library');
    });

    it('should reject comparison mode with 1 library', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.COMPARISON,
        libraries: [
          {
            name: 'lib1',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/lib1'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await expect(sessionManager.createSession(metadata)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.createSession(metadata)).rejects.toThrow('Comparison mode requires 2-3 libraries');
    });

    it('should reject comparison mode with 4+ libraries', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.COMPARISON,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' },
          { name: 'lib2', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib2' },
          { name: 'lib3', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib3' },
          { name: 'lib4', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib4' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await expect(sessionManager.createSession(metadata)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.createSession(metadata)).rejects.toThrow('Comparison mode requires 2-3 libraries');
    });

    it('should accept comparison mode with 2 libraries', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.COMPARISON,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' },
          { name: 'lib2', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib2' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      expect(session.metadata.libraries).toHaveLength(2);
    });

    it('should accept comparison mode with 3 libraries', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.COMPARISON,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' },
          { name: 'lib2', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib2' },
          { name: 'lib3', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib3' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      expect(session.metadata.libraries).toHaveLength(3);
    });
  });

  describe('loadSession', () => {
    it('should load existing session from file', async () => {
      // Create a session first
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const createdSession = await sessionManager.createSession(metadata);

      // Create new manager instance to test loading
      const newManager = new SessionManager(testBaseDir);
      const loadedSession = await newManager.loadSession(createdSession.id);

      expect(loadedSession.id).toBe(createdSession.id);
      expect(loadedSession.metadata.goal).toBe(metadata.goal);
      expect(loadedSession.status).toBe(SessionStatus.ACTIVE);
    });

    it('should set loaded session as active', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const createdSession = await sessionManager.createSession(metadata);

      const newManager = new SessionManager(testBaseDir);
      await newManager.loadSession(createdSession.id);

      const activeSession = newManager.getActiveSession();
      expect(activeSession).toBeDefined();
      expect(activeSession?.id).toBe(createdSession.id);
    });

    it('should throw error for non-existent session', async () => {
      await expect(sessionManager.loadSession('non-existent-session')).rejects.toThrow(WorkflowError);
      await expect(sessionManager.loadSession('non-existent-session')).rejects.toThrow('Session not found');
    });

    it('should handle corrupted session files', async () => {
      // Create session directory with corrupted file
      const sessionId = 'corrupted-session';
      const sessionDir = path.join(testBaseDir, sessionId);
      await fs.mkdir(sessionDir, { recursive: true });
      await fs.writeFile(
        path.join(sessionDir, 'session.json'),
        'invalid json content',
        'utf-8'
      );

      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow('Failed to load session');
    });

    it('should recover from corrupted session file using backup', async () => {
      // Create a valid session first
      const metadata: SessionMetadata = {
        goal: 'Test backup recovery',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      const sessionId = session.id;

      // Corrupt the main session file
      const sessionDir = path.join(testBaseDir, sessionId);
      await fs.writeFile(
        path.join(sessionDir, 'session.json'),
        'corrupted data!!!',
        'utf-8'
      );

      // Load should recover from backup
      const newManager = new SessionManager(testBaseDir);
      const loadedSession = await newManager.loadSession(sessionId);

      expect(loadedSession.id).toBe(sessionId);
      expect(loadedSession.metadata.goal).toBe('Test backup recovery');
    });

    it('should throw error when both main and backup session files are corrupted', async () => {
      const sessionId = 'both-corrupted';
      const sessionDir = path.join(testBaseDir, sessionId);
      await fs.mkdir(sessionDir, { recursive: true });

      // Write corrupted main file
      await fs.writeFile(
        path.join(sessionDir, 'session.json'),
        'invalid json',
        'utf-8'
      );

      // Write corrupted backup file
      await fs.writeFile(
        path.join(sessionDir, 'session.backup.json'),
        'also invalid json',
        'utf-8'
      );

      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow('Failed to load session');
    });

    it('should throw error when main is corrupted and no backup exists', async () => {
      const sessionId = 'no-backup';
      const sessionDir = path.join(testBaseDir, sessionId);
      await fs.mkdir(sessionDir, { recursive: true });

      // Write corrupted main file only (no backup)
      await fs.writeFile(
        path.join(sessionDir, 'session.json'),
        'invalid json',
        'utf-8'
      );

      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.loadSession(sessionId)).rejects.toThrow('Failed to load session');
    });
  });

  describe('saveSession', () => {
    it('should save session state to file', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);

      // Modify session
      session.currentPhase = Phase.ANALYSIS;
      session.completedPhases.push(Phase.SETUP);

      await sessionManager.saveSession(session);

      // Load and verify
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.currentPhase).toBe(Phase.ANALYSIS);
      expect(loadedSession.completedPhases).toContain(Phase.SETUP);
    });

    it('should update timestamp when saving', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      const originalUpdatedAt = session.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await sessionManager.saveSession(session);

      expect(session.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should create a backup file when saving', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test backup creation',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);

      // Verify backup file exists
      const backupPath = path.join(testBaseDir, session.id, 'session.backup.json');
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);

      // Verify backup content matches main session
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backupSession = JSON.parse(backupContent);
      expect(backupSession.id).toBe(session.id);
      expect(backupSession.metadata.goal).toBe('Test backup creation');
    });
  });

  describe('finalizeSession', () => {
    it('should finalize session and mark read-only', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);

      await sessionManager.finalizeSession(session);

      expect(session.status).toBe(SessionStatus.FINALIZED);
      expect(session.currentPhase).toBe(Phase.FINALIZED);

      // Verify persisted
      const loadedSession = await sessionManager.loadSession(session.id);
      expect(loadedSession.status).toBe(SessionStatus.FINALIZED);
    });

    it('should clear active session after finalization', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      expect(sessionManager.getActiveSession()).toBeDefined();

      await sessionManager.finalizeSession(session);
      expect(sessionManager.getActiveSession()).toBeNull();
    });

    it('should throw error when finalizing already finalized session', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          {
            name: 'test-lib',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
            installPath: 'node_modules/test-lib'
          }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const session = await sessionManager.createSession(metadata);
      await sessionManager.finalizeSession(session);

      await expect(sessionManager.finalizeSession(session)).rejects.toThrow(WorkflowError);
      await expect(sessionManager.finalizeSession(session)).rejects.toThrow('Session is already finalized');
    });
  });

  describe('listSessions', () => {
    it('should list all sessions', async () => {
      const metadata1: SessionMetadata = {
        goal: 'First session',
        mode: ResearchMode.SINGLE,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const metadata2: SessionMetadata = {
        goal: 'Second session',
        mode: ResearchMode.COMPARISON,
        libraries: [
          { name: 'lib2', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib2' },
          { name: 'lib3', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib3' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await sessionManager.createSession(metadata1);
      
      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await sessionManager.createSession(metadata2);

      const sessions = await sessionManager.listSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].goal).toBe('Second session'); // Newest first
      expect(sessions[1].goal).toBe('First session');
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await sessionManager.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should skip corrupted sessions', async () => {
      // Create valid session
      const metadata: SessionMetadata = {
        goal: 'Valid session',
        mode: ResearchMode.SINGLE,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      await sessionManager.createSession(metadata);

      // Create corrupted session
      const corruptedDir = path.join(testBaseDir, 'corrupted-session');
      await fs.mkdir(corruptedDir, { recursive: true });
      await fs.writeFile(
        path.join(corruptedDir, 'session.json'),
        'invalid json',
        'utf-8'
      );

      const sessions = await sessionManager.listSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].goal).toBe('Valid session');
    });
  });

  describe('getSessionById', () => {
    it('should get session by ID without activating', async () => {
      const metadata: SessionMetadata = {
        goal: 'Test session',
        mode: ResearchMode.SINGLE,
        libraries: [
          { name: 'lib1', version: '1.0.0', installedAt: new Date().toISOString(), installPath: 'node_modules/lib1' }
        ],
        documentationLinks: [],
        userInputs: {}
      };

      const createdSession = await sessionManager.createSession(metadata);

      // Clear active session
      await sessionManager.finalizeSession(createdSession);

      const retrievedSession = await sessionManager.getSessionById(createdSession.id);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.id).toBe(createdSession.id);
      expect(sessionManager.getActiveSession()).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionManager.getSessionById('non-existent');
      expect(session).toBeNull();
    });
  });

  describe('Property Tests', () => {
    // Feature: polished-research-workflow, Property 5: Session Persistence Round-Trip
    describe('Property 5: Session Persistence Round-Trip', () => {
      it('should preserve all session data through pause and resume cycle', async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate arbitrary session state
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constantFrom(ResearchMode.SINGLE, ResearchMode.COMPARISON),
              documentationLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
              userInputs: fc.dictionary(fc.string(), fc.jsonValue()),
            }).chain(baseMetadata => {
              // Generate libraries based on mode
              const librariesArbitrary = baseMetadata.mode === ResearchMode.SINGLE
                ? fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 })
                : fc.array(arbitraryLibraryInfo(), { minLength: 2, maxLength: 3 });

              return librariesArbitrary.map(libraries => ({
                ...baseMetadata,
                libraries
              }));
            }),
            // Generate phase state
            fc.constantFrom(Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING, Phase.DECISION),
            // Generate completed phases
            fc.array(fc.constantFrom(Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING), { maxLength: 3 }),
            // Generate artifacts
            fc.array(
              fc.record({
                type: fc.constantFrom(
                  ArtifactType.BIG_PICTURE,
                  ArtifactType.COMPARISON_VIEW,
                  ArtifactType.PROTOTYPE,
                  ArtifactType.PHASE_REPORT
                ),
                name: fc.string({ minLength: 5, maxLength: 50 }),
                path: fc.string({ minLength: 5, maxLength: 100 }),
                createdAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map(ts => new Date(ts).toISOString()),
              }),
              { maxLength: 5 }
            ),
            // Generate history
            fc.array(
              fc.record({
                phase: fc.constantFrom(Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING),
                startedAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map(ts => new Date(ts).toISOString()),
                completedAt: fc.option(fc.integer({ min: 1577836800000, max: 1893456000000 }).map(ts => new Date(ts).toISOString()), { nil: null }),
                actions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
              }),
              { maxLength: 4 }
            ),
            async (metadata, currentPhase, completedPhases, artifacts, history) => {
              // Create initial session
              const session = await sessionManager.createSession(metadata);

              // Modify session to simulate workflow progress
              session.currentPhase = currentPhase;
              session.completedPhases = [...new Set(completedPhases)]; // Remove duplicates
              session.artifacts = artifacts;
              session.history = history;

              // Capture original state
              const originalId = session.id;
              const originalCreatedAt = session.createdAt;
              const originalStatus = session.status;
              const originalCurrentPhase = session.currentPhase;
              const originalCompletedPhases = [...session.completedPhases];
              const originalMetadata = JSON.parse(JSON.stringify(session.metadata));
              const originalArtifacts = JSON.parse(JSON.stringify(session.artifacts));
              const originalHistory = JSON.parse(JSON.stringify(session.history));

              // PAUSE: Save session (serialize)
              await sessionManager.saveSession(session);

              // Create new manager instance to simulate restart
              const newManager = new SessionManager(testBaseDir);

              // RESUME: Load session (deserialize)
              const loadedSession = await newManager.loadSession(originalId);

              // Verify all session data is preserved with no data loss
              expect(loadedSession.id).toBe(originalId);
              expect(loadedSession.createdAt).toBe(originalCreatedAt);
              expect(loadedSession.status).toBe(originalStatus);
              expect(loadedSession.currentPhase).toBe(originalCurrentPhase);

              // Verify completed phases
              expect(loadedSession.completedPhases).toHaveLength(originalCompletedPhases.length);
              expect(loadedSession.completedPhases).toEqual(originalCompletedPhases);

              // Verify metadata preservation
              expect(loadedSession.metadata.goal).toBe(originalMetadata.goal);
              expect(loadedSession.metadata.mode).toBe(originalMetadata.mode);
              expect(loadedSession.metadata.libraries).toHaveLength(originalMetadata.libraries.length);
              expect(loadedSession.metadata.documentationLinks).toEqual(originalMetadata.documentationLinks);
              
              // Deep equality check for userInputs with JSON round-trip normalization
              // JSON.stringify/parse normalizes -0 to 0, which is expected behavior
              expect(JSON.parse(JSON.stringify(loadedSession.metadata.userInputs))).toEqual(
                JSON.parse(JSON.stringify(originalMetadata.userInputs))
              );

              // Verify each library
              for (let i = 0; i < originalMetadata.libraries.length; i++) {
                expect(loadedSession.metadata.libraries[i]).toEqual(originalMetadata.libraries[i]);
              }

              // Verify artifacts preservation
              expect(loadedSession.artifacts).toHaveLength(originalArtifacts.length);
              for (let i = 0; i < originalArtifacts.length; i++) {
                expect(loadedSession.artifacts[i]).toEqual(originalArtifacts[i]);
              }

              // Verify history preservation
              expect(loadedSession.history).toHaveLength(originalHistory.length);
              for (let i = 0; i < originalHistory.length; i++) {
                expect(loadedSession.history[i]).toEqual(originalHistory[i]);
              }

              // Clean up
              await newManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should preserve session state through multiple save/load cycles', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constant(ResearchMode.SINGLE),
              libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 }),
              documentationLinks: fc.array(fc.webUrl(), { maxLength: 3 }),
              userInputs: fc.dictionary(fc.string(), fc.jsonValue()),
            }),
            fc.integer({ min: 2, max: 5 }), // Number of save/load cycles
            async (metadata, cycles) => {
              // Create initial session
              let session = await sessionManager.createSession(metadata);
              const originalId = session.id;

              // Perform multiple save/load cycles
              for (let i = 0; i < cycles; i++) {
                // Modify session slightly
                session.completedPhases.push(Phase.SETUP);
                session.currentPhase = Phase.ANALYSIS;

                // Save
                await sessionManager.saveSession(session);

                // Load
                const newManager = new SessionManager(testBaseDir);
                session = await newManager.loadSession(originalId);

                // Verify ID remains constant
                expect(session.id).toBe(originalId);

                // Verify metadata is still intact
                expect(session.metadata.goal).toBe(metadata.goal);
                expect(session.metadata.mode).toBe(metadata.mode);
                expect(session.metadata.libraries).toHaveLength(metadata.libraries.length);
              }

              // Final verification
              expect(session.metadata).toMatchObject({
                goal: metadata.goal,
                mode: metadata.mode,
              });

              // Clean up
              await sessionManager.finalizeSession(session);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should preserve complex nested data structures in session state', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constant(ResearchMode.SINGLE),
              libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 }),
              documentationLinks: fc.array(fc.webUrl(), { maxLength: 3 }),
              userInputs: fc.dictionary(
                fc.string(),
                fc.oneof(
                  fc.string(),
                  fc.integer(),
                  fc.boolean(),
                  fc.array(fc.string()),
                  fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
                  fc.array(fc.dictionary(fc.string(), fc.string()))
                )
              ),
            }),
            async (metadata) => {
              // Create session with complex nested data
              const session = await sessionManager.createSession(metadata);

              // Add complex artifacts and history
              session.artifacts = [
                {
                  type: ArtifactType.BIG_PICTURE,
                  name: 'test-artifact',
                  path: 'path/to/artifact',
                  createdAt: new Date().toISOString(),
                },
              ];

              session.history = [
                {
                  phase: Phase.SETUP,
                  startedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  actions: ['action1', 'action2', 'action3'],
                },
              ];

              // Capture original state
              const originalState = JSON.parse(JSON.stringify({
                metadata: session.metadata,
                artifacts: session.artifacts,
                history: session.history,
              }));

              // Save and load
              await sessionManager.saveSession(session);
              const newManager = new SessionManager(testBaseDir);
              const loadedSession = await newManager.loadSession(session.id);

              // Verify deep equality of complex structures
              expect(loadedSession.metadata).toEqual(originalState.metadata);
              expect(loadedSession.artifacts).toEqual(originalState.artifacts);
              expect(loadedSession.history).toEqual(originalState.history);

              // Verify no extra properties were added
              expect(Object.keys(loadedSession.metadata.userInputs)).toEqual(
                Object.keys(originalState.metadata.userInputs)
              );

              // Clean up
              await newManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should handle edge cases: empty arrays and null values', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constant(ResearchMode.SINGLE),
              libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 }),
              documentationLinks: fc.constant([]), // Empty array
              userInputs: fc.constant({}), // Empty object
            }),
            async (metadata) => {
              const session = await sessionManager.createSession(metadata);

              // Set edge case values
              session.completedPhases = []; // Empty array
              session.artifacts = []; // Empty array
              session.history = []; // Empty array

              // Save and load
              await sessionManager.saveSession(session);
              const newManager = new SessionManager(testBaseDir);
              const loadedSession = await newManager.loadSession(session.id);

              // Verify empty arrays are preserved
              expect(loadedSession.completedPhases).toEqual([]);
              expect(loadedSession.artifacts).toEqual([]);
              expect(loadedSession.history).toEqual([]);
              expect(loadedSession.metadata.documentationLinks).toEqual([]);
              expect(loadedSession.metadata.userInputs).toEqual({});

              // Clean up
              await newManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });
    });

    // Feature: polished-research-workflow, Property 8: History Accumulation
    // **Validates: Requirements 8.6**
    describe('Property 8: History Accumulation', () => {
      it('should contain entries for all completed phases in chronological order with no duplicates or omissions', async () => {
        /**
         * For any sequence of phase completions, the session history SHALL contain
         * entries for all completed phases in chronological order with no duplicates
         * or omissions.
         */
        const WORKFLOW_PHASES = [Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING, Phase.DECISION] as const;

        await fc.assert(
          fc.asyncProperty(
            // Generate a random number of phases to complete (1 to 4)
            fc.integer({ min: 1, max: 4 }),
            // Generate random actions per phase (0 to 5 actions each)
            fc.array(
              fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
              { minLength: 4, maxLength: 4 }
            ),
            async (numPhasesToComplete, actionsPerPhase) => {
              // Create a valid session
              const metadata: SessionMetadata = {
                goal: 'Test history accumulation property',
                mode: ResearchMode.SINGLE,
                libraries: [
                  {
                    name: 'test-lib',
                    version: '1.0.0',
                    installedAt: new Date().toISOString(),
                    installPath: 'node_modules/test-lib'
                  }
                ],
                documentationLinks: [],
                userInputs: {}
              };

              const session = await sessionManager.createSession(metadata);

              // Simulate completing phases in order by building history entries
              const phasesToComplete = WORKFLOW_PHASES.slice(0, numPhasesToComplete);
              let baseTime = Date.now();

              for (let i = 0; i < phasesToComplete.length; i++) {
                const phase = phasesToComplete[i];
                const startedAt = new Date(baseTime).toISOString();
                baseTime += 1000; // Advance time by 1 second
                const completedAt = new Date(baseTime).toISOString();
                baseTime += 1000; // Advance time between phases

                session.history.push({
                  phase,
                  startedAt,
                  completedAt,
                  actions: actionsPerPhase[i]
                });

                session.completedPhases.push(phase);
              }

              // Save and reload to verify persistence
              await sessionManager.saveSession(session);
              const newManager = new SessionManager(testBaseDir);
              const loadedSession = await newManager.loadSession(session.id);

              // PROPERTY: History contains entries for ALL completed phases (no omissions)
              for (const completedPhase of phasesToComplete) {
                const historyEntry = loadedSession.history.find(h => h.phase === completedPhase);
                expect(historyEntry).toBeDefined();
                expect(historyEntry!.completedAt).not.toBeNull();
              }

              // PROPERTY: No duplicates - each completed phase appears exactly once
              const completedPhaseEntries = loadedSession.history.filter(
                h => h.completedAt !== null
              );
              const phaseNames = completedPhaseEntries.map(h => h.phase);
              const uniquePhaseNames = [...new Set(phaseNames)];
              expect(phaseNames.length).toBe(uniquePhaseNames.length);

              // PROPERTY: Chronological order - startedAt timestamps are non-decreasing
              for (let i = 1; i < loadedSession.history.length; i++) {
                const prevStart = new Date(loadedSession.history[i - 1].startedAt).getTime();
                const currStart = new Date(loadedSession.history[i].startedAt).getTime();
                expect(currStart).toBeGreaterThanOrEqual(prevStart);
              }

              // PROPERTY: History length matches number of completed phases
              expect(loadedSession.history.length).toBe(phasesToComplete.length);

              // PROPERTY: Actions are preserved for each phase
              for (let i = 0; i < phasesToComplete.length; i++) {
                expect(loadedSession.history[i].actions).toEqual(actionsPerPhase[i]);
              }

              // Clean up
              await newManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should maintain chronological order even with varying time gaps between phases', async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate random time gaps between phases (in milliseconds)
            fc.array(
              fc.integer({ min: 100, max: 100000 }),
              { minLength: 3, maxLength: 3 }
            ),
            // Generate number of phases to complete
            fc.integer({ min: 2, max: 4 }),
            async (timeGaps, numPhases) => {
              const metadata: SessionMetadata = {
                goal: 'Test chronological ordering',
                mode: ResearchMode.SINGLE,
                libraries: [
                  {
                    name: 'test-lib',
                    version: '1.0.0',
                    installedAt: new Date().toISOString(),
                    installPath: 'node_modules/test-lib'
                  }
                ],
                documentationLinks: [],
                userInputs: {}
              };

              const session = await sessionManager.createSession(metadata);
              const phasesToComplete = [Phase.SETUP, Phase.ANALYSIS, Phase.PROTOTYPING, Phase.DECISION].slice(0, numPhases);

              let currentTime = Date.now();

              for (let i = 0; i < phasesToComplete.length; i++) {
                const startedAt = new Date(currentTime).toISOString();
                currentTime += timeGaps[i % timeGaps.length]; // Use varying gaps
                const completedAt = new Date(currentTime).toISOString();
                currentTime += timeGaps[(i + 1) % timeGaps.length]; // Gap before next phase

                session.history.push({
                  phase: phasesToComplete[i],
                  startedAt,
                  completedAt,
                  actions: [`completed-${phasesToComplete[i].toLowerCase()}`]
                });

                session.completedPhases.push(phasesToComplete[i]);
              }

              // Save and reload
              await sessionManager.saveSession(session);
              const newManager = new SessionManager(testBaseDir);
              const loadedSession = await newManager.loadSession(session.id);

              // PROPERTY: Chronological order preserved after persistence
              for (let i = 1; i < loadedSession.history.length; i++) {
                const prevStart = new Date(loadedSession.history[i - 1].startedAt).getTime();
                const currStart = new Date(loadedSession.history[i].startedAt).getTime();
                expect(currStart).toBeGreaterThan(prevStart);

                // completedAt of previous phase should be <= startedAt of next phase
                const prevCompleted = new Date(loadedSession.history[i - 1].completedAt!).getTime();
                expect(currStart).toBeGreaterThanOrEqual(prevCompleted);
              }

              // PROPERTY: No omissions - all phases in the sequence are present
              for (let i = 0; i < phasesToComplete.length; i++) {
                expect(loadedSession.history[i].phase).toBe(phasesToComplete[i]);
              }

              // PROPERTY: No duplicates
              const phases = loadedSession.history.map(h => h.phase);
              expect(new Set(phases).size).toBe(phases.length);

              // Clean up
              await newManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });
    });

    // Feature: polished-research-workflow, Property 2: Session Metadata Completeness
    describe('Property 2: Session Metadata Completeness', () => {
      it('should preserve all metadata fields when creating and persisting session', async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate valid metadata with proper library counts
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constantFrom(ResearchMode.SINGLE, ResearchMode.COMPARISON),
              documentationLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
              // Use fc.json() to generate only JSON-serializable values
              // This avoids issues with -0/+0, undefined/null, and other non-JSON values
              userInputs: fc.dictionary(fc.string(), fc.json()),
            }).chain(baseMetadata => {
              // Generate libraries based on mode
              const librariesArbitrary = baseMetadata.mode === ResearchMode.SINGLE
                ? fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 })
                : fc.array(arbitraryLibraryInfo(), { minLength: 2, maxLength: 3 });

              return librariesArbitrary.map(libraries => ({
                ...baseMetadata,
                libraries
              }));
            }),
            async (metadata: SessionMetadata) => {
              // Create session with generated metadata
              const session = await sessionManager.createSession(metadata);

              // Verify all metadata fields are preserved in memory
              expect(session.metadata.goal).toBe(metadata.goal);
              expect(session.metadata.mode).toBe(metadata.mode);
              expect(session.metadata.libraries).toHaveLength(metadata.libraries.length);
              expect(session.metadata.documentationLinks).toEqual(metadata.documentationLinks);
              expect(session.metadata.userInputs).toEqual(metadata.userInputs);

              // Verify each library is preserved
              for (let i = 0; i < metadata.libraries.length; i++) {
                expect(session.metadata.libraries[i].name).toBe(metadata.libraries[i].name);
                expect(session.metadata.libraries[i].version).toBe(metadata.libraries[i].version);
                expect(session.metadata.libraries[i].installedAt).toBe(metadata.libraries[i].installedAt);
                expect(session.metadata.libraries[i].installPath).toBe(metadata.libraries[i].installPath);
              }

              // Save session to disk
              await sessionManager.saveSession(session);

              // Load session from disk
              const loadedSession = await sessionManager.loadSession(session.id);

              // Verify all metadata fields are preserved after persistence round-trip
              expect(loadedSession.metadata.goal).toBe(metadata.goal);
              expect(loadedSession.metadata.mode).toBe(metadata.mode);
              expect(loadedSession.metadata.libraries).toHaveLength(metadata.libraries.length);
              expect(loadedSession.metadata.documentationLinks).toEqual(metadata.documentationLinks);
              expect(loadedSession.metadata.userInputs).toEqual(metadata.userInputs);

              // Verify each library is preserved after persistence
              for (let i = 0; i < metadata.libraries.length; i++) {
                expect(loadedSession.metadata.libraries[i].name).toBe(metadata.libraries[i].name);
                expect(loadedSession.metadata.libraries[i].version).toBe(metadata.libraries[i].version);
                expect(loadedSession.metadata.libraries[i].installedAt).toBe(metadata.libraries[i].installedAt);
                expect(loadedSession.metadata.libraries[i].installPath).toBe(metadata.libraries[i].installPath);
              }

              // Verify userInputs with JSON round-trip normalization
              // JSON.stringify/parse normalizes -0 to 0, which is expected behavior for persistence
              expect(JSON.parse(JSON.stringify(loadedSession.metadata.userInputs))).toEqual(
                JSON.parse(JSON.stringify(metadata.userInputs))
              );

              // Clean up
              await sessionManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should preserve complex userInputs objects without data loss', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constant(ResearchMode.SINGLE),
              libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 }),
              documentationLinks: fc.array(fc.webUrl(), { maxLength: 3 }),
              userInputs: fc.dictionary(
                fc.string(),
                fc.oneof(
                  fc.string(),
                  fc.integer(),
                  fc.boolean(),
                  fc.array(fc.string()),
                  fc.dictionary(fc.string(), fc.string())
                )
              ),
            }),
            async (metadata: SessionMetadata) => {
              const session = await sessionManager.createSession(metadata);
              await sessionManager.saveSession(session);
              const loadedSession = await sessionManager.loadSession(session.id);

              // Deep equality check for complex userInputs with JSON round-trip normalization
              // JSON.stringify/parse normalizes -0 to 0, which is expected behavior
              expect(JSON.parse(JSON.stringify(loadedSession.metadata.userInputs))).toEqual(
                JSON.parse(JSON.stringify(metadata.userInputs))
              );

              // Verify no extra keys were added
              expect(Object.keys(loadedSession.metadata.userInputs)).toEqual(
                Object.keys(metadata.userInputs)
              );

              // Clean up
              await sessionManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });

      it('should preserve empty arrays and objects in metadata', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              goal: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
              mode: fc.constant(ResearchMode.SINGLE),
              libraries: fc.array(arbitraryLibraryInfo(), { minLength: 1, maxLength: 1 }),
              documentationLinks: fc.constant([]), // Empty array
              userInputs: fc.constant({}), // Empty object
            }),
            async (metadata: SessionMetadata) => {
              const session = await sessionManager.createSession(metadata);
              await sessionManager.saveSession(session);
              const loadedSession = await sessionManager.loadSession(session.id);

              // Verify empty arrays remain empty
              expect(loadedSession.metadata.documentationLinks).toEqual([]);
              expect(loadedSession.metadata.documentationLinks).toHaveLength(0);

              // Verify empty objects remain empty
              expect(loadedSession.metadata.userInputs).toEqual({});
              expect(Object.keys(loadedSession.metadata.userInputs)).toHaveLength(0);

              // Clean up
              await sessionManager.finalizeSession(loadedSession);
            }
          ),
          PROPERTY_TEST_CONFIG
        );
      });
    });
  });
});
