/**
 * SessionManager - Manages research session lifecycle and persistence
 * Feature: polished-research-workflow
 * Requirements: 1.8, 8.1, 8.2, 8.3
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Session,
  SessionMetadata,
  SessionSummary,
  SessionStatus,
  Phase,
  ResearchMode
} from '../types/core';
import { WorkflowError } from '../errors/WorkflowError';

/**
 * SessionManager handles session lifecycle operations including
 * creation, persistence, loading, and finalization of research sessions.
 */
export class SessionManager {
  private readonly sessionsDir: string;
  private activeSession: Session | null = null;

  constructor(baseDir: string = '.kiro/research/sessions') {
    this.sessionsDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Creates a new research session with the provided metadata
   * Requirement 1.8: Create session directory with metadata
   * Requirement 8.3: Include all user inputs in session state
   */
  async createSession(metadata: SessionMetadata): Promise<Session> {
    // Validate metadata
    this.validateMetadata(metadata);

    // Generate session ID from goal and timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const goalSlug = this.slugify(metadata.goal);
    const sessionId = `${goalSlug}-${timestamp}`;

    // Create session object
    const now = new Date().toISOString();
    const session: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      status: SessionStatus.ACTIVE,
      currentPhase: Phase.SETUP,
      completedPhases: [],
      metadata,
      artifacts: [],
      history: []
    };

    // Create session directory structure
    await this.createSessionDirectory(sessionId);

    // Save session to disk
    await this.saveSession(session);

    // Set as active session
    this.activeSession = session;

    return session;
  }

  /**
   * Loads an existing session from disk by session ID
   * Requirement 8.2: Restore session state when resuming
   * Requirement 8.4, 8.5: Attempt backup file if main session file is corrupted
   */
  async loadSession(sessionId: string): Promise<Session> {
    const sessionPath = this.getSessionFilePath(sessionId);

    try {
      const content = await fs.readFile(sessionPath, 'utf-8');
      const session: Session = JSON.parse(content);

      // Validate loaded session
      this.validateSession(session);

      // Set as active session
      this.activeSession = session;

      return session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowError(
          `Session not found: ${sessionId}`,
          'SESSION_NOT_FOUND',
          { sessionId }
        );
      }

      // Main session file is corrupted - attempt to load from backup
      const backupSession = await this.loadBackupSession(sessionId);
      if (backupSession) {
        this.activeSession = backupSession;
        return backupSession;
      }

      // Handle corrupted session file (both main and backup failed)
      throw new WorkflowError(
        `Failed to load session: ${sessionId}`,
        'SESSION_LOAD_ERROR',
        { sessionId, error: (error as Error).message }
      );
    }
  }

  /**
   * Saves the current session state to disk
   * Requirement 8.1: Save current phase and collected data when pausing
   * Also saves a backup file for recovery from corruption
   */
  async saveSession(session: Session): Promise<void> {
    // Update timestamp
    session.updatedAt = new Date().toISOString();

    const sessionPath = this.getSessionFilePath(session.id);
    const backupPath = this.getBackupSessionFilePath(session.id);

    try {
      const content = JSON.stringify(session, null, 2);
      await fs.writeFile(sessionPath, content, 'utf-8');
      // Also write backup file for recovery
      await fs.writeFile(backupPath, content, 'utf-8');
    } catch (error) {
      throw new WorkflowError(
        `Failed to save session: ${session.id}`,
        'SESSION_SAVE_ERROR',
        { sessionId: session.id, error: (error as Error).message }
      );
    }
  }

  /**
   * Finalizes a session, marking it as read-only
   * Requirement 8.3: Mark finalized sessions as read-only
   */
  async finalizeSession(session: Session): Promise<void> {
    if (session.status === SessionStatus.FINALIZED) {
      throw new WorkflowError(
        'Session is already finalized',
        'SESSION_ALREADY_FINALIZED',
        { sessionId: session.id }
      );
    }

    // Update session status
    session.status = SessionStatus.FINALIZED;
    session.currentPhase = Phase.FINALIZED;

    // Save finalized state
    await this.saveSession(session);

    // Clear active session if this was it
    if (this.activeSession?.id === session.id) {
      this.activeSession = null;
    }
  }

  /**
   * Gets the currently active session
   */
  getActiveSession(): Session | null {
    return this.activeSession;
  }

  /**
   * Lists all research sessions
   */
  async listSessions(): Promise<SessionSummary[]> {
    try {
      // Ensure sessions directory exists
      await fs.mkdir(this.sessionsDir, { recursive: true });

      const entries = await fs.readdir(this.sessionsDir, { withFileTypes: true });
      const sessionDirs = entries.filter(entry => entry.isDirectory());

      const summaries: SessionSummary[] = [];

      for (const dir of sessionDirs) {
        try {
          const session = await this.loadSessionWithoutActivating(dir.name);
          summaries.push(this.createSessionSummary(session));
        } catch (error) {
          // Skip corrupted or invalid sessions
          console.warn(`Skipping invalid session: ${dir.name}`);
        }
      }

      // Sort by creation date (newest first)
      summaries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return summaries;
    } catch (error) {
      throw new WorkflowError(
        'Failed to list sessions',
        'SESSION_LIST_ERROR',
        { error: (error as Error).message }
      );
    }
  }

  /**
   * Gets a specific session by ID without setting it as active
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      return await this.loadSessionWithoutActivating(sessionId);
    } catch (error) {
      if ((error as WorkflowError).code === 'SESSION_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Private helper: Load session without setting as active
   */
  private async loadSessionWithoutActivating(sessionId: string): Promise<Session> {
    const sessionPath = this.getSessionFilePath(sessionId);

    try {
      const content = await fs.readFile(sessionPath, 'utf-8');
      const session: Session = JSON.parse(content);
      this.validateSession(session);
      return session;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowError(
          `Session not found: ${sessionId}`,
          'SESSION_NOT_FOUND',
          { sessionId }
        );
      }
      throw new WorkflowError(
        `Failed to load session: ${sessionId}`,
        'SESSION_LOAD_ERROR',
        { sessionId, error: (error as Error).message }
      );
    }
  }

  /**
   * Private helper: Get session file path
   */
  private getSessionFilePath(sessionId: string): string {
    return path.join(this.sessionsDir, sessionId, 'session.json');
  }

  /**
   * Private helper: Get backup session file path
   */
  private getBackupSessionFilePath(sessionId: string): string {
    return path.join(this.sessionsDir, sessionId, 'session.backup.json');
  }

  /**
   * Private helper: Attempt to load session from backup file
   * Returns the session if backup is valid, null otherwise
   */
  private async loadBackupSession(sessionId: string): Promise<Session | null> {
    const backupPath = this.getBackupSessionFilePath(sessionId);

    try {
      const content = await fs.readFile(backupPath, 'utf-8');
      const session: Session = JSON.parse(content);
      this.validateSession(session);
      return session;
    } catch {
      // Backup also failed (missing or corrupted)
      return null;
    }
  }

  /**
   * Private helper: Create session directory structure
   */
  private async createSessionDirectory(sessionId: string): Promise<void> {
    const sessionDir = path.join(this.sessionsDir, sessionId);

    try {
      // Create main session directory
      await fs.mkdir(sessionDir, { recursive: true });

      // Create subdirectories
      await fs.mkdir(path.join(sessionDir, 'libraries'), { recursive: true });
      await fs.mkdir(path.join(sessionDir, 'prototypes'), { recursive: true });
      await fs.mkdir(path.join(sessionDir, 'phase-reports'), { recursive: true });
    } catch (error) {
      throw new WorkflowError(
        `Failed to create session directory: ${sessionId}`,
        'SESSION_DIR_CREATE_ERROR',
        { sessionId, error: (error as Error).message }
      );
    }
  }

  /**
   * Private helper: Validate session metadata
   */
  private validateMetadata(metadata: SessionMetadata): void {
    if (!metadata.goal || metadata.goal.trim().length === 0) {
      throw new WorkflowError(
        'Session goal is required',
        'INVALID_METADATA',
        { field: 'goal' }
      );
    }

    if (!Object.values(ResearchMode).includes(metadata.mode)) {
      throw new WorkflowError(
        'Invalid research mode',
        'INVALID_METADATA',
        { field: 'mode', value: metadata.mode }
      );
    }

    if (!metadata.libraries || metadata.libraries.length === 0) {
      throw new WorkflowError(
        'At least one library is required',
        'INVALID_METADATA',
        { field: 'libraries' }
      );
    }

    // Validate library count based on mode
    if (metadata.mode === ResearchMode.SINGLE && metadata.libraries.length !== 1) {
      throw new WorkflowError(
        'Single mode requires exactly 1 library',
        'INVALID_METADATA',
        { field: 'libraries', count: metadata.libraries.length }
      );
    }

    if (metadata.mode === ResearchMode.COMPARISON) {
      if (metadata.libraries.length < 2 || metadata.libraries.length > 3) {
        throw new WorkflowError(
          'Comparison mode requires 2-3 libraries',
          'INVALID_METADATA',
          { field: 'libraries', count: metadata.libraries.length }
        );
      }
    }
  }

  /**
   * Private helper: Validate loaded session structure
   */
  private validateSession(session: Session): void {
    if (!session.id || !session.createdAt || !session.metadata) {
      throw new WorkflowError(
        'Invalid session structure',
        'INVALID_SESSION',
        { sessionId: session.id }
      );
    }
  }

  /**
   * Private helper: Create session summary from full session
   */
  private createSessionSummary(session: Session): SessionSummary {
    return {
      id: session.id,
      goal: session.metadata.goal,
      mode: session.metadata.mode,
      status: session.status,
      currentPhase: session.currentPhase,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      libraryCount: session.metadata.libraries.length
    };
  }

  /**
   * Private helper: Convert string to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // Limit length
  }
}
