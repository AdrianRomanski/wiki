/**
 * Session creation logic for article research sessions
 * Feature: article-research-session
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 *
 * Handles:
 * - Creating the session directory
 * - Writing initial session.json
 * - Validating article input (URL or pasted text)
 * - Cleaning up session directory on failure
 *
 * All file I/O is routed through FileSystemPort (Requirement 1.2, 5.6).
 */

import type { FileSystemPort } from '@wiki/application-ports';
import { generateSessionId } from '@wiki/domain-research-session';
import type { ArticleInputType, SessionJson } from '@wiki/domain-research-session';

/** The base path for research sessions relative to workspace root */
const SESSIONS_BASE_PATH = '.kiro/research/sessions';

/**
 * Result of creating a new session.
 */
export interface CreateSessionResult {
  /** The generated kebab-case session ID */
  sessionId: string;
  /** The session directory path, relative to the workspace root */
  sessionDir: string;
}

/**
 * Result of validating article input.
 */
export interface ValidateArticleInputResult {
  /** Whether the input is valid */
  valid: boolean;
  /** The determined input type (present when valid) */
  inputType?: ArticleInputType;
  /** Error message (present when invalid) */
  error?: string;
}

/**
 * Creates a new article research session.
 *
 * 1. Generates a session ID from the topic
 * 2. Creates the session directory at `.kiro/research/sessions/[session-id]/`
 * 3. Writes initial session.json with scope="article", state="EXPLORE", createdAt
 * 4. Returns the session ID and directory path (relative to workspace root)
 *
 * @param fs - FileSystemPort used to create the session directory and write session.json
 * @param topic - The human-readable research topic
 * @returns The session ID and directory path
 * @throws Error if the topic is invalid or directory creation fails
 */
export async function createSession(
  fs: FileSystemPort,
  topic: string
): Promise<CreateSessionResult> {
  const sessionId = generateSessionId(topic);
  const sessionDir = `${SESSIONS_BASE_PATH}/${sessionId}`;

  // Create session directory (recursive to ensure parent dirs exist)
  await fs.ensureDir(sessionDir);

  // Write initial session.json
  const now = new Date();
  const createdAt = formatDate(now);

  const initialSession: Omit<SessionJson, 'articleInputType'> = {
    id: sessionId,
    topic,
    state: 'EXPLORE',
    scope: 'article',
    createdAt,
  };

  await fs.writeFile(
    `${sessionDir}/session.json`,
    JSON.stringify(initialSession, null, 2)
  );

  return { sessionId, sessionDir };
}

/**
 * Validates article input provided by the user.
 *
 * Rules:
 * - Exactly one of `url` or `pastedText` must be provided
 * - A URL must begin with `http://` or `https://`
 * - Pasted text must contain at least 1 non-whitespace character
 * - Providing both is rejected (Req 1.4)
 * - Providing neither is rejected (Req 1.5)
 *
 * @param url - Optional URL input
 * @param pastedText - Optional pasted text input
 * @returns Validation result with input type or error
 */
export function validateArticleInput(
  url?: string,
  pastedText?: string
): ValidateArticleInputResult {
  const hasUrl = url !== undefined && url.trim().length > 0;
  const hasPastedText = pastedText !== undefined && pastedText.trim().length > 0;

  // Reject dual input (Req 1.4)
  if (hasUrl && hasPastedText) {
    return {
      valid: false,
      error:
        'Both a URL and pasted text were provided. Please provide exactly one input type.',
    };
  }

  // Reject no input (Req 1.5)
  if (!hasUrl && !hasPastedText) {
    return {
      valid: false,
      error:
        'Neither a URL nor pasted text was provided. Please provide exactly one input type.',
    };
  }

  // Validate URL format
  if (hasUrl) {
    if (!url!.startsWith('http://') && !url!.startsWith('https://')) {
      return {
        valid: false,
        error:
          'URL must begin with http:// or https://. Please provide a valid URL.',
      };
    }
    return { valid: true, inputType: 'url' };
  }

  // Pasted text is valid (already checked non-whitespace above)
  return { valid: true, inputType: 'pasted-text' };
}

/**
 * Records the article input type in session.json.
 *
 * Updates the session.json file with the `articleInputType` field.
 *
 * @param fs - FileSystemPort used to read/write session.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @param inputType - The validated article input type
 */
export async function recordArticleInputType(
  fs: FileSystemPort,
  sessionDir: string,
  inputType: ArticleInputType
): Promise<void> {
  const sessionJsonPath = `${sessionDir}/session.json`;
  const content = await fs.readFile(sessionJsonPath);
  const session = JSON.parse(content);

  session.articleInputType = inputType;

  await fs.writeFile(sessionJsonPath, JSON.stringify(session, null, 2));
}

/**
 * Removes the session directory.
 *
 * Used when the user fails to provide valid input after the re-prompt (Req 1.6).
 * Removes the entire session directory and all its contents.
 *
 * @param fs - FileSystemPort used to remove the session directory
 * @param sessionDir - Path to the session directory to remove, relative to the workspace root
 */
export async function cleanupSession(
  fs: FileSystemPort,
  sessionDir: string
): Promise<void> {
  await fs.deleteDir(sessionDir);
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
