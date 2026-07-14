/**
 * Pause and resume logic for article research sessions
 * Feature: article-research-session
 * Requirements: 8.2, 8.3, 8.4
 *
 * Handles:
 * - Pausing an active session (EXPLORE, SYNTHESIZE, FINALIZE → PAUSED)
 * - Resuming a paused session (PAUSED → resumeFrom state)
 * - Presenting a resume summary with session context
 * - Rejecting resume on non-paused sessions
 *
 * All file I/O is routed through FileSystemPort (Requirement 1.2, 5.6).
 */

import type { FileSystemPort } from '@wiki/application-ports';
import type { SessionJson, SessionState } from '@wiki/domain-research-session';

/**
 * Active states that can be paused.
 */
const PAUSABLE_STATES: ReadonlySet<SessionState> = new Set([
  'EXPLORE',
  'SYNTHESIZE',
  'FINALIZE',
]);

/**
 * Result of resuming a paused session.
 */
export interface ResumeResult {
  /** The session ID */
  sessionId: string;
  /** The article title (or topic if title not yet confirmed) */
  title: string;
  /** The session scope (always "article" for article sessions) */
  scope: 'article';
  /** The date the session was paused (YYYY-MM-DD) */
  pausedAt: string;
  /** The step being resumed */
  resumeFrom: 'EXPLORE' | 'SYNTHESIZE' | 'FINALIZE';
  /** List of completed steps with their artifact paths */
  completedSteps: CompletedStep[];
  /** Paths of all artifacts present in the session directory */
  artifactPaths: string[];
}

/**
 * A completed step with its associated artifact.
 */
export interface CompletedStep {
  /** The step name */
  step: string;
  /** Path to the artifact produced by this step (relative to session dir) */
  artifactPath?: string;
}

/**
 * Error thrown when attempting to pause a session that is not in an active state.
 */
export class PauseError extends Error {
  public readonly currentState: SessionState;

  constructor(currentState: SessionState, reason: string) {
    super(`Cannot pause session: ${reason}`);
    this.name = 'PauseError';
    this.currentState = currentState;
  }
}

/**
 * Error thrown when attempting to resume a session that is not paused.
 */
export class ResumeError extends Error {
  public readonly sessionId: string;
  public readonly currentState: SessionState;

  constructor(sessionId: string, currentState: SessionState) {
    super(
      `Session "${sessionId}" is not paused. Current state: "${currentState}".`
    );
    this.name = 'ResumeError';
    this.sessionId = sessionId;
    this.currentState = currentState;
  }
}

/**
 * Pauses an active article research session.
 *
 * Sets state to PAUSED, records pausedAt with current date (YYYY-MM-DD),
 * and records resumeFrom with the currently active step.
 *
 * @param fs - FileSystemPort used to read/write session.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns The updated SessionJson
 * @throws PauseError if the session is not in an active state
 */
export async function pauseSession(
  fs: FileSystemPort,
  sessionDir: string
): Promise<SessionJson> {
  const sessionJsonPath = `${sessionDir}/session.json`;
  const content = await fs.readFile(sessionJsonPath);
  const session: SessionJson = JSON.parse(content);

  // Validate that the session is in a pausable state
  if (!PAUSABLE_STATES.has(session.state)) {
    throw new PauseError(
      session.state,
      `Only active states (EXPLORE, SYNTHESIZE, FINALIZE) can be paused. Current state: "${session.state}".`
    );
  }

  // Record pause information
  const pausedAt = formatDate(new Date());
  const resumeFrom = session.state as 'EXPLORE' | 'SYNTHESIZE' | 'FINALIZE';

  const updatedSession: SessionJson = {
    ...session,
    state: 'PAUSED',
    pausedAt,
    resumeFrom,
  };

  await fs.writeFile(sessionJsonPath, JSON.stringify(updatedSession, null, 2));

  return updatedSession;
}

/**
 * Resumes a paused article research session.
 *
 * Validates that the session is PAUSED, restores the state to the resumeFrom value,
 * removes pausedAt and resumeFrom fields, and returns a resume summary.
 *
 * @param fs - FileSystemPort used to read/write session.json and discover artifacts
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns A ResumeResult with session context and completed steps
 * @throws ResumeError if the session is not in the PAUSED state
 */
export async function resumeSession(
  fs: FileSystemPort,
  sessionDir: string
): Promise<ResumeResult> {
  const sessionJsonPath = `${sessionDir}/session.json`;
  const content = await fs.readFile(sessionJsonPath);
  const session: SessionJson = JSON.parse(content);

  // Validate that the session is paused (Req 8.4)
  if (session.state !== 'PAUSED') {
    throw new ResumeError(session.id, session.state);
  }

  // Capture pause info before removing
  const pausedAt = session.pausedAt!;
  const resumeFrom = session.resumeFrom!;

  // Build resume summary before modifying session
  const artifactPaths = await discoverArtifacts(fs, sessionDir);
  const completedSteps = determineCompletedSteps(resumeFrom, artifactPaths);

  // Restore session state: remove pause fields, set state to resumeFrom
  const updatedSession: SessionJson = { ...session };
  delete updatedSession.pausedAt;
  delete updatedSession.resumeFrom;
  updatedSession.state = resumeFrom;

  await fs.writeFile(sessionJsonPath, JSON.stringify(updatedSession, null, 2));

  return {
    sessionId: session.id,
    title: session.articleTitle || session.topic,
    scope: session.scope,
    pausedAt,
    resumeFrom,
    completedSteps,
    artifactPaths,
  };
}

/**
 * Discovers all artifacts present in the session directory.
 *
 * @param fs - FileSystemPort used to probe for artifact presence
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns Array of artifact filenames found in the directory
 */
async function discoverArtifacts(
  fs: FileSystemPort,
  sessionDir: string
): Promise<string[]> {
  const knownArtifacts = [
    'session.json',
    'raw-article.md',
    'article-content.json',
    'article-analysis.md',
    'findings-summary.md',
  ];

  const found: string[] = [];
  for (const artifact of knownArtifacts) {
    try {
      await fs.readFile(`${sessionDir}/${artifact}`);
      found.push(artifact);
    } catch {
      // Artifact not present, skip
    }
  }

  return found;
}

/**
 * Determines which steps have been completed based on the resumeFrom state
 * and the artifacts present in the session directory.
 *
 * @param resumeFrom - The step being resumed
 * @param artifactPaths - Artifacts found in the session directory
 * @returns Array of completed steps with their artifact paths
 */
function determineCompletedSteps(
  resumeFrom: 'EXPLORE' | 'SYNTHESIZE' | 'FINALIZE',
  artifactPaths: string[]
): CompletedStep[] {
  const steps: CompletedStep[] = [];

  // EXPLORE is complete if we're resuming from SYNTHESIZE or FINALIZE
  if (resumeFrom === 'SYNTHESIZE' || resumeFrom === 'FINALIZE') {
    const analysisArtifact = artifactPaths.find(
      (p) => p === 'article-analysis.md'
    );
    steps.push({
      step: 'EXPLORE',
      artifactPath: analysisArtifact,
    });
  }

  // SYNTHESIZE is complete if we're resuming from FINALIZE
  if (resumeFrom === 'FINALIZE') {
    const findingsArtifact = artifactPaths.find(
      (p) => p === 'findings-summary.md'
    );
    steps.push({
      step: 'SYNTHESIZE',
      artifactPath: findingsArtifact,
    });
  }

  return steps;
}

/**
 * Formats a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
