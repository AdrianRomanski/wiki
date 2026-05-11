/**
 * Type definitions for library installation management
 * Feature: polished-research-workflow
 */

/**
 * Result of a library installation operation
 */
export interface InstallationResult {
  libraryName: string;
  success: boolean;
  version: string | null;
  error: string | null;
  installPath: string | null;
}

/**
 * Result of library verification operations
 */
export interface VerificationResult {
  allVerified: boolean;
  results: Map<string, boolean>;
  missingLibraries: string[];
}
