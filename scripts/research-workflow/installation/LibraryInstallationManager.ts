/**
 * LibraryInstallationManager - Manages library installation and verification
 * Feature: polished-research-workflow
 * Requirements: 1.6, 1.7, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InstallationResult, VerificationResult } from '../types/installation.js';
import { InstallationError, VerificationError } from '../errors/WorkflowError.js';

const execAsync = promisify(exec);

/**
 * LibraryInstallationManager handles npm installation operations,
 * verification of installed libraries, and version tracking.
 */
export class LibraryInstallationManager {
  private readonly nodeModulesPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.nodeModulesPath = path.join(projectRoot, 'node_modules');
  }

  /**
   * Installs a single library using npm
   * Requirement 6.3: Use npm install with exact library name
   * Requirement 1.6: Install libraries before Phase 2
   */
  async installLibrary(libraryName: string): Promise<InstallationResult> {
    try {
      // Check if already installed
      const alreadyInstalled = await this.verifyInstallation(libraryName);
      
      if (alreadyInstalled) {
        // Get existing version
        const version = await this.getInstalledVersion(libraryName);
        const installPath = this.getLibraryPath(libraryName);
        
        return {
          libraryName,
          success: true,
          version,
          error: null,
          installPath
        };
      }

      // Execute npm install
      await execAsync(`npm install ${libraryName}`, {
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });

      // Verify installation succeeded
      const verified = await this.verifyInstallation(libraryName);
      
      if (!verified) {
        throw new InstallationError(
          libraryName,
          'Library not found in node_modules after installation'
        );
      }

      // Get installed version
      const version = await this.getInstalledVersion(libraryName);
      const installPath = this.getLibraryPath(libraryName);

      return {
        libraryName,
        success: true,
        version,
        error: null,
        installPath
      };
    } catch (error) {
      // Handle installation failure
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        libraryName,
        success: false,
        version: null,
        error: errorMessage,
        installPath: null
      };
    }
  }

  /**
   * Verifies that a library exists in node_modules
   * Requirement 6.4: Verify library exists in node_modules
   * Requirement 6.7: Use node_modules as source of truth
   */
  async verifyInstallation(libraryName: string): Promise<boolean> {
    try {
      const libraryPath = this.getLibraryPath(libraryName);
      const stats = await fs.stat(libraryPath);
      return stats.isDirectory();
    } catch (error) {
      // ENOENT means library doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      // Other errors should be thrown
      throw new VerificationError(
        libraryName,
        `Failed to verify installation: ${(error as Error).message}`
      );
    }
  }

  /**
   * Gets the installed version of a library from package.json
   * Requirement 6.6: Record installed versions in session metadata
   */
  async getInstalledVersion(libraryName: string): Promise<string | null> {
    try {
      const packageJsonPath = path.join(
        this.getLibraryPath(libraryName),
        'package.json'
      );
      
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      return packageJson.version || null;
    } catch (error) {
      // If package.json doesn't exist or can't be read, return null
      return null;
    }
  }

  /**
   * Reinstalls a library (uninstall then install)
   * Requirement 6.2: Offer to reinstall if library exists
   */
  async reinstallLibrary(libraryName: string): Promise<InstallationResult> {
    try {
      // Uninstall first
      await execAsync(`npm uninstall ${libraryName}`, {
        cwd: process.cwd(),
        timeout: 60000
      });

      // Then install
      return await this.installLibrary(libraryName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        libraryName,
        success: false,
        version: null,
        error: `Reinstall failed: ${errorMessage}`,
        installPath: null
      };
    }
  }

  /**
   * Installs multiple libraries in sequence
   * Requirement 1.6: Install all specified libraries
   */
  async installLibraries(libraryNames: string[]): Promise<InstallationResult[]> {
    const results: InstallationResult[] = [];

    for (const libraryName of libraryNames) {
      const result = await this.installLibrary(libraryName);
      results.push(result);
    }

    return results;
  }

  /**
   * Verifies multiple libraries exist in node_modules
   * Requirement 6.5: Prevent proceeding if verification fails
   */
  async verifyLibraries(libraryNames: string[]): Promise<VerificationResult> {
    const results = new Map<string, boolean>();
    const missingLibraries: string[] = [];

    for (const libraryName of libraryNames) {
      const verified = await this.verifyInstallation(libraryName);
      results.set(libraryName, verified);
      
      if (!verified) {
        missingLibraries.push(libraryName);
      }
    }

    return {
      allVerified: missingLibraries.length === 0,
      results,
      missingLibraries
    };
  }

  /**
   * Checks if a library is already installed
   * Requirement 6.1: Verify library not already installed before attempting
   */
  async isLibraryInstalled(libraryName: string): Promise<boolean> {
    return await this.verifyInstallation(libraryName);
  }

  /**
   * Gets the full path to a library in node_modules
   */
  private getLibraryPath(libraryName: string): string {
    // Handle scoped packages (e.g., @angular/core)
    return path.join(this.nodeModulesPath, libraryName);
  }

  /**
   * Gets information about an installed library
   */
  async getLibraryInfo(libraryName: string): Promise<{
    name: string;
    version: string | null;
    path: string;
    installed: boolean;
  }> {
    const installed = await this.verifyInstallation(libraryName);
    const version = installed ? await this.getInstalledVersion(libraryName) : null;
    const libraryPath = this.getLibraryPath(libraryName);

    return {
      name: libraryName,
      version,
      path: libraryPath,
      installed
    };
  }
}
