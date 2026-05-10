/**
 * ADR Copier Module
 * 
 * Automatically copies finalized ADRs from research sessions to the raw/ directory.
 * Maintains immutability of original ADRs while making them available for wiki ingestion.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { FileSystemConfig, DEFAULT_CONFIG } from './filesystem';

/**
 * Options for copying an ADR from a research session.
 */
export interface CopyADROptions {
  /** Path to the research session directory */
  sessionPath: string;
  
  /** Session ID (extracted from path or provided) */
  sessionId: string;
  
  /** Target directory in raw/ (defaults to 'research-decisions') */
  targetCategory?: string;
  
  /** File system configuration */
  config?: FileSystemConfig;
}

/**
 * Result of copying an ADR.
 */
export interface CopyADRResult {
  /** Path to the original ADR in the research session */
  sourcePath: string;
  
  /** Path to the copied ADR in raw/ */
  targetPath: string;
  
  /** ADR filename */
  filename: string;
  
  /** Whether the target directory was created */
  createdDirectory: boolean;
}

/**
 * Error thrown when ADR copy operation fails.
 */
export class ADRCopyError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ADRCopyError';
  }
}

/**
 * Finds the ADR file in a research session directory.
 * 
 * @param sessionPath - Path to the research session
 * @returns Path to the ADR file, or null if not found
 */
export async function findADRInSession(
  sessionPath: string
): Promise<string | null> {
  try {
    const adrPath = path.join(sessionPath, 'decision.adr.md');
    
    // Check if the ADR file exists
    await fs.access(adrPath);
    
    return adrPath;
  } catch (error) {
    // File doesn't exist or is not accessible
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    
    // Other errors (permission issues, etc.) - return null gracefully
    return null;
  }
}

/**
 * Copies an ADR from a research session to raw/research-decisions/.
 * 
 * This function:
 * - Reads the ADR from the session directory
 * - Creates raw/research-decisions/ if it doesn't exist
 * - Copies the ADR preserving filename format
 * - Maintains the original ADR in the session directory
 * 
 * @param options - Copy configuration
 * @returns Result with source and target paths
 * @throws {ADRCopyError} If the ADR cannot be copied
 */
export async function copyADRToRaw(
  options: CopyADROptions
): Promise<CopyADRResult> {
  const config = options.config || DEFAULT_CONFIG;
  const targetCategory = options.targetCategory || 'research-decisions';
  
  try {
    // Find the ADR in the session directory
    const sourcePath = await findADRInSession(options.sessionPath);
    
    if (!sourcePath) {
      throw new ADRCopyError(
        `ADR file 'decision.adr.md' not found in session directory: ${options.sessionPath}`
      );
    }
    
    // Read the ADR content
    let adrContent: string;
    try {
      adrContent = await fs.readFile(sourcePath, 'utf-8');
    } catch (error) {
      throw new ADRCopyError(
        `Failed to read ADR from ${sourcePath}`,
        error as Error
      );
    }
    
    // Extract filename from the ADR (preserve original filename format)
    const filename = path.basename(sourcePath);
    
    // Construct target directory path
    const targetDir = path.join(config.rootDir, config.rawDir, targetCategory);
    
    // Check if target directory exists, create if it doesn't
    let createdDirectory = false;
    try {
      await fs.access(targetDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        try {
          await fs.mkdir(targetDir, { recursive: true });
          createdDirectory = true;
        } catch (mkdirError) {
          throw new ADRCopyError(
            `Failed to create target directory: ${targetDir}`,
            mkdirError as Error
          );
        }
      } else {
        throw new ADRCopyError(
          `Failed to access target directory: ${targetDir}`,
          error as Error
        );
      }
    }
    
    // Construct target file path
    const targetPath = path.join(targetDir, filename);
    
    // Write the ADR to the target location
    try {
      await fs.writeFile(targetPath, adrContent, 'utf-8');
    } catch (error) {
      throw new ADRCopyError(
        `Failed to write ADR to ${targetPath}`,
        error as Error
      );
    }
    
    return {
      sourcePath,
      targetPath,
      filename,
      createdDirectory,
    };
  } catch (error) {
    if (error instanceof ADRCopyError) {
      throw error;
    }
    throw new ADRCopyError(
      `Unexpected error during ADR copy operation`,
      error as Error
    );
  }
}
