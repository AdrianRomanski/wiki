/**
 * FileSystemUtils - Directory structure and path utilities for the research workflow
 * Feature: polished-research-workflow
 * Requirement 9.7: Organize artifacts in structured session directory with clear naming conventions
 */

import * as path from 'path';

/**
 * Standard subdirectories within a session directory
 */
export const SESSION_SUBDIRECTORIES = [
  'libraries',
  'prototypes',
  'phase-reports'
] as const;

/**
 * Artifact naming conventions by type
 */
export const ARTIFACT_NAMING: Record<string, string> = {
  BIG_PICTURE: '{library}-big-picture.md',
  COMPARISON_VIEW: 'comparison-view.md',
  PROTOTYPE: 'prototype-{index}-{description}.md',
  PHASE_REPORT: '{phase}-report.md',
  FINAL_REPORT: 'final-report.md',
  ADR: 'decision.adr.md',
  RESEARCH_DECISION_RECORD: 'research-decision-record.md'
};

/**
 * Validates a file path for safety (no directory traversal, valid characters)
 */
export function validatePath(filePath: string): boolean {
  // Reject empty paths
  if (!filePath || filePath.trim().length === 0) {
    return false;
  }

  // Reject directory traversal attempts
  if (filePath.includes('..')) {
    return false;
  }

  // Reject absolute paths
  if (path.isAbsolute(filePath)) {
    return false;
  }

  // Reject paths with null bytes
  if (filePath.includes('\0')) {
    return false;
  }

  // Reject paths that are too long (255 chars per segment, 4096 total)
  if (filePath.length > 4096) {
    return false;
  }

  const segments = filePath.split(path.sep);
  for (const segment of segments) {
    if (segment.length > 255) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a string for use in file/directory names.
 * Removes or replaces unsafe characters while preserving readability.
 */
export function sanitizeName(name: string): string {
  return name
    .replace(/^@/, '')           // Remove leading @ (scoped packages)
    .replace(/\//g, '-')         // Replace slashes with dashes
    .replace(/[^\w.-]/g, '-')    // Replace non-word chars (except . and -) with dashes
    .replace(/-+/g, '-')         // Collapse multiple dashes
    .replace(/^-|-$/g, '')       // Remove leading/trailing dashes
    .toLowerCase()
    .substring(0, 100);          // Limit length
}

/**
 * Generates an artifact filename following naming conventions
 */
export function generateArtifactName(
  type: string,
  params: Record<string, string> = {}
): string {
  const template = ARTIFACT_NAMING[type];
  if (!template) {
    // Fallback: sanitize the type as a filename
    return `${sanitizeName(type)}.md`;
  }

  let filename = template;
  for (const [key, value] of Object.entries(params)) {
    filename = filename.replace(`{${key}}`, sanitizeName(value));
  }

  // Remove any remaining template placeholders
  filename = filename.replace(/\{[^}]+\}/g, 'unknown');

  return filename;
}

/**
 * Resolves the full path for a session directory
 */
export function getSessionPath(baseDir: string, sessionId: string): string {
  const sanitizedId = sanitizeName(sessionId) || 'unnamed-session';
  return path.join(baseDir, sanitizedId);
}

/**
 * Resolves the full path for a session subdirectory
 */
export function getSessionSubdirectoryPath(
  baseDir: string,
  sessionId: string,
  subdirectory: typeof SESSION_SUBDIRECTORIES[number]
): string {
  return path.join(getSessionPath(baseDir, sessionId), subdirectory);
}

/**
 * Validates a session ID format
 */
export function validateSessionId(sessionId: string): boolean {
  if (!sessionId || sessionId.trim().length === 0) {
    return false;
  }

  // Must be a valid directory name (no path separators, no traversal)
  if (sessionId.includes('/') || sessionId.includes('\\') || sessionId.includes('..')) {
    return false;
  }

  // Must not exceed reasonable length
  if (sessionId.length > 200) {
    return false;
  }

  return true;
}
