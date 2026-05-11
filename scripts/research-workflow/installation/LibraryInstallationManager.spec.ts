/**
 * LibraryInstallationManager unit tests
 * Feature: polished-research-workflow
 * Requirements: 6.2, 6.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LibraryInstallationManager } from './LibraryInstallationManager';
import { InstallationError, VerificationError } from '../errors/WorkflowError';

// Mock child_process exec
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

const execAsync = promisify(exec);

describe('LibraryInstallationManager', () => {
  const testProjectRoot = path.join(process.cwd(), '.test-installation');
  const testNodeModules = path.join(testProjectRoot, 'node_modules');
  let manager: LibraryInstallationManager;

  beforeEach(async () => {
    // Create test directories
    await fs.mkdir(testNodeModules, { recursive: true });
    manager = new LibraryInstallationManager(testProjectRoot);
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    vi.restoreAllMocks();
  });

  describe('installLibrary', () => {
    it('should successfully install a single library', async () => {
      const libraryName = 'test-library';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Mock successful npm install
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          // Create the library directory to simulate successful installation
          fs.mkdir(libraryPath, { recursive: true })
            .then(() => fs.writeFile(
              path.join(libraryPath, 'package.json'),
              JSON.stringify({ name: libraryName, version: '1.0.0' }),
              'utf-8'
            ))
            .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
            .catch(callback);
        }
        return {} as any;
      });

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(true);
      expect(result.libraryName).toBe(libraryName);
      expect(result.version).toBe('1.0.0');
      expect(result.error).toBeNull();
      expect(result.installPath).toBe(libraryPath);
    });

    it('should handle installation failure', async () => {
      const libraryName = 'non-existent-library';

      // Mock failed npm install
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('npm ERR! 404 Not Found'), { stdout: '', stderr: 'npm ERR! 404 Not Found' } as any);
        }
        return {} as any;
      });

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(false);
      expect(result.libraryName).toBe(libraryName);
      expect(result.version).toBeNull();
      expect(result.error).toContain('npm ERR! 404 Not Found');
      expect(result.installPath).toBeNull();
    });

    it('should return existing installation if library already installed', async () => {
      const libraryName = 'existing-library';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Pre-create library to simulate existing installation
      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName, version: '2.5.0' }),
        'utf-8'
      );

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(true);
      expect(result.libraryName).toBe(libraryName);
      expect(result.version).toBe('2.5.0');
      expect(result.error).toBeNull();
      expect(result.installPath).toBe(libraryPath);
      
      // Verify npm install was not called
      expect(exec).not.toHaveBeenCalled();
    });

    it('should handle scoped package names', async () => {
      const libraryName = '@angular/core';
      const libraryPath = path.join(testNodeModules, '@angular', 'core');

      // Mock successful npm install
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          fs.mkdir(libraryPath, { recursive: true })
            .then(() => fs.writeFile(
              path.join(libraryPath, 'package.json'),
              JSON.stringify({ name: libraryName, version: '17.0.0' }),
              'utf-8'
            ))
            .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
            .catch(callback);
        }
        return {} as any;
      });

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(true);
      expect(result.libraryName).toBe(libraryName);
      expect(result.version).toBe('17.0.0');
      expect(result.installPath).toBe(libraryPath);
    });

    it('should handle installation timeout', async () => {
      const libraryName = 'slow-library';

      // Mock timeout error
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Command timed out') as NodeJS.ErrnoException;
          error.code = 'ETIMEDOUT';
          callback(error, { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should fail if library not found in node_modules after installation', async () => {
      const libraryName = 'phantom-library';

      // Mock npm install that succeeds but doesn't create directory
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'installed', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await manager.installLibrary(libraryName);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in node_modules after installation');
    });
  });

  describe('verifyInstallation', () => {
    it('should verify library exists in node_modules', async () => {
      const libraryName = 'test-library';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Create library directory
      await fs.mkdir(libraryPath, { recursive: true });

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(true);
    });

    it('should return false for non-existent library', async () => {
      const libraryName = 'non-existent-library';

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(false);
    });

    it('should verify scoped packages', async () => {
      const libraryName = '@angular/core';
      const libraryPath = path.join(testNodeModules, '@angular', 'core');

      await fs.mkdir(libraryPath, { recursive: true });

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(true);
    });

    it('should return false if path exists but is not a directory', async () => {
      const libraryName = 'file-not-dir';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Create a file instead of directory
      await fs.writeFile(libraryPath, 'not a directory', 'utf-8');

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(false);
    });

    it('should throw VerificationError for unexpected errors', async () => {
      const libraryName = 'error-library';

      // Create a manager with a path that will cause permission errors
      // We'll test this by creating a file where a directory should be
      const badPath = path.join(testProjectRoot, 'bad-node-modules');
      await fs.writeFile(badPath, 'not a directory', 'utf-8');
      
      const badManager = new LibraryInstallationManager(badPath);

      // This should throw VerificationError because node_modules is a file, not a directory
      // The library path will be invalid
      await expect(badManager.verifyInstallation(libraryName)).rejects.toThrow(VerificationError);
    });
  });

  describe('getInstalledVersion', () => {
    it('should get installed version from package.json', async () => {
      const libraryName = 'test-library';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName, version: '3.2.1' }),
        'utf-8'
      );

      const version = await manager.getInstalledVersion(libraryName);

      expect(version).toBe('3.2.1');
    });

    it('should return null if package.json does not exist', async () => {
      const libraryName = 'no-package-json';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });

      const version = await manager.getInstalledVersion(libraryName);

      expect(version).toBeNull();
    });

    it('should return null if package.json is malformed', async () => {
      const libraryName = 'bad-package-json';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        'invalid json content',
        'utf-8'
      );

      const version = await manager.getInstalledVersion(libraryName);

      expect(version).toBeNull();
    });

    it('should return null if version field is missing', async () => {
      const libraryName = 'no-version';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName }),
        'utf-8'
      );

      const version = await manager.getInstalledVersion(libraryName);

      expect(version).toBeNull();
    });

    it('should handle scoped packages', async () => {
      const libraryName = '@angular/core';
      const libraryPath = path.join(testNodeModules, '@angular', 'core');

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName, version: '17.0.0' }),
        'utf-8'
      );

      const version = await manager.getInstalledVersion(libraryName);

      expect(version).toBe('17.0.0');
    });
  });

  describe('reinstallLibrary', () => {
    it('should uninstall then install library', async () => {
      const libraryName = 'reinstall-library';
      const libraryPath = path.join(testNodeModules, libraryName);

      let uninstallCalled = false;
      let installCalled = false;

      // Mock npm commands
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          if (cmd.includes('uninstall')) {
            uninstallCalled = true;
            callback(null, { stdout: 'uninstalled', stderr: '' } as any);
          } else if (cmd.includes('install')) {
            installCalled = true;
            fs.mkdir(libraryPath, { recursive: true })
              .then(() => fs.writeFile(
                path.join(libraryPath, 'package.json'),
                JSON.stringify({ name: libraryName, version: '2.0.0' }),
                'utf-8'
              ))
              .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
              .catch(callback);
          }
        }
        return {} as any;
      });

      const result = await manager.reinstallLibrary(libraryName);

      expect(uninstallCalled).toBe(true);
      expect(installCalled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.version).toBe('2.0.0');
    });

    it('should handle uninstall failure', async () => {
      const libraryName = 'uninstall-fail';

      // Mock uninstall failure
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          if (cmd.includes('uninstall')) {
            callback(new Error('Uninstall failed'), { stdout: '', stderr: 'error' } as any);
          }
        }
        return {} as any;
      });

      const result = await manager.reinstallLibrary(libraryName);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Reinstall failed');
      expect(result.error).toContain('Uninstall failed');
    });

    it('should handle install failure after successful uninstall', async () => {
      const libraryName = 'install-fail-after-uninstall';

      // Mock uninstall success, install failure
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          if (cmd.includes('uninstall')) {
            callback(null, { stdout: 'uninstalled', stderr: '' } as any);
          } else if (cmd.includes('install')) {
            callback(new Error('Install failed'), { stdout: '', stderr: 'error' } as any);
          }
        }
        return {} as any;
      });

      const result = await manager.reinstallLibrary(libraryName);

      expect(result.success).toBe(false);
      // The error could be either the direct install error or the verification error
      expect(result.error).toBeDefined();
      expect(result.error).not.toBeNull();
    });
  });

  describe('installLibraries', () => {
    it('should install multiple libraries in batch', async () => {
      const libraries = ['lib1', 'lib2', 'lib3'];

      // Mock successful installations
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          const match = cmd.match(/npm install (\S+)/);
          if (match) {
            const libName = match[1];
            const libPath = path.join(testNodeModules, libName);
            
            fs.mkdir(libPath, { recursive: true })
              .then(() => fs.writeFile(
                path.join(libPath, 'package.json'),
                JSON.stringify({ name: libName, version: '1.0.0' }),
                'utf-8'
              ))
              .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
              .catch(callback);
          }
        }
        return {} as any;
      });

      const results = await manager.installLibraries(libraries);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].libraryName).toBe('lib1');
      expect(results[1].success).toBe(true);
      expect(results[1].libraryName).toBe('lib2');
      expect(results[2].success).toBe(true);
      expect(results[2].libraryName).toBe('lib3');
    });

    it('should handle partial batch installation failure', async () => {
      const libraries = ['lib1', 'bad-lib', 'lib3'];

      // Mock mixed success/failure
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          const match = cmd.match(/npm install (\S+)/);
          if (match) {
            const libName = match[1];
            
            if (libName === 'bad-lib') {
              callback(new Error('Installation failed'), { stdout: '', stderr: 'error' } as any);
            } else {
              const libPath = path.join(testNodeModules, libName);
              fs.mkdir(libPath, { recursive: true })
                .then(() => fs.writeFile(
                  path.join(libPath, 'package.json'),
                  JSON.stringify({ name: libName, version: '1.0.0' }),
                  'utf-8'
                ))
                .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
                .catch(callback);
            }
          }
        }
        return {} as any;
      });

      const results = await manager.installLibraries(libraries);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].libraryName).toBe('lib1');
      expect(results[1].success).toBe(false);
      expect(results[1].libraryName).toBe('bad-lib');
      expect(results[1].error).toContain('Installation failed');
      expect(results[2].success).toBe(true);
      expect(results[2].libraryName).toBe('lib3');
    });

    it('should handle empty library list', async () => {
      const results = await manager.installLibraries([]);

      expect(results).toEqual([]);
    });

    it('should install libraries sequentially', async () => {
      const libraries = ['lib1', 'lib2'];
      const installOrder: string[] = [];

      // Track installation order
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          const match = cmd.match(/npm install (\S+)/);
          if (match) {
            const libName = match[1];
            installOrder.push(libName);
            
            const libPath = path.join(testNodeModules, libName);
            fs.mkdir(libPath, { recursive: true })
              .then(() => fs.writeFile(
                path.join(libPath, 'package.json'),
                JSON.stringify({ name: libName, version: '1.0.0' }),
                'utf-8'
              ))
              .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
              .catch(callback);
          }
        }
        return {} as any;
      });

      await manager.installLibraries(libraries);

      expect(installOrder).toEqual(['lib1', 'lib2']);
    });
  });

  describe('verifyLibraries', () => {
    it('should verify all libraries exist', async () => {
      const libraries = ['lib1', 'lib2', 'lib3'];

      // Create all libraries
      for (const lib of libraries) {
        const libPath = path.join(testNodeModules, lib);
        await fs.mkdir(libPath, { recursive: true });
      }

      const result = await manager.verifyLibraries(libraries);

      expect(result.allVerified).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.results.get('lib1')).toBe(true);
      expect(result.results.get('lib2')).toBe(true);
      expect(result.results.get('lib3')).toBe(true);
      expect(result.missingLibraries).toEqual([]);
    });

    it('should identify missing libraries', async () => {
      const libraries = ['lib1', 'lib2', 'lib3'];

      // Create only lib1 and lib3
      await fs.mkdir(path.join(testNodeModules, 'lib1'), { recursive: true });
      await fs.mkdir(path.join(testNodeModules, 'lib3'), { recursive: true });

      const result = await manager.verifyLibraries(libraries);

      expect(result.allVerified).toBe(false);
      expect(result.results.size).toBe(3);
      expect(result.results.get('lib1')).toBe(true);
      expect(result.results.get('lib2')).toBe(false);
      expect(result.results.get('lib3')).toBe(true);
      expect(result.missingLibraries).toEqual(['lib2']);
    });

    it('should handle empty library list', async () => {
      const result = await manager.verifyLibraries([]);

      expect(result.allVerified).toBe(true);
      expect(result.results.size).toBe(0);
      expect(result.missingLibraries).toEqual([]);
    });

    it('should handle all libraries missing', async () => {
      const libraries = ['lib1', 'lib2'];

      const result = await manager.verifyLibraries(libraries);

      expect(result.allVerified).toBe(false);
      expect(result.results.size).toBe(2);
      expect(result.results.get('lib1')).toBe(false);
      expect(result.results.get('lib2')).toBe(false);
      expect(result.missingLibraries).toEqual(['lib1', 'lib2']);
    });

    it('should verify scoped packages', async () => {
      const libraries = ['@angular/core', '@angular/common'];

      // Create scoped packages
      await fs.mkdir(path.join(testNodeModules, '@angular', 'core'), { recursive: true });
      await fs.mkdir(path.join(testNodeModules, '@angular', 'common'), { recursive: true });

      const result = await manager.verifyLibraries(libraries);

      expect(result.allVerified).toBe(true);
      expect(result.results.get('@angular/core')).toBe(true);
      expect(result.results.get('@angular/common')).toBe(true);
    });
  });

  describe('isLibraryInstalled', () => {
    it('should return true for installed library', async () => {
      const libraryName = 'installed-lib';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });

      const isInstalled = await manager.isLibraryInstalled(libraryName);

      expect(isInstalled).toBe(true);
    });

    it('should return false for non-installed library', async () => {
      const libraryName = 'not-installed-lib';

      const isInstalled = await manager.isLibraryInstalled(libraryName);

      expect(isInstalled).toBe(false);
    });
  });

  describe('getLibraryInfo', () => {
    it('should get complete library information', async () => {
      const libraryName = 'info-lib';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName, version: '4.5.6' }),
        'utf-8'
      );

      const info = await manager.getLibraryInfo(libraryName);

      expect(info.name).toBe(libraryName);
      expect(info.version).toBe('4.5.6');
      expect(info.path).toBe(libraryPath);
      expect(info.installed).toBe(true);
    });

    it('should return info for non-installed library', async () => {
      const libraryName = 'not-installed';
      const libraryPath = path.join(testNodeModules, libraryName);

      const info = await manager.getLibraryInfo(libraryName);

      expect(info.name).toBe(libraryName);
      expect(info.version).toBeNull();
      expect(info.path).toBe(libraryPath);
      expect(info.installed).toBe(false);
    });

    it('should handle library without version', async () => {
      const libraryName = 'no-version-lib';
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName }),
        'utf-8'
      );

      const info = await manager.getLibraryInfo(libraryName);

      expect(info.name).toBe(libraryName);
      expect(info.version).toBeNull();
      expect(info.installed).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle library names with special characters', async () => {
      const libraryName = '@scope/lib-name_123';
      const libraryPath = path.join(testNodeModules, '@scope', 'lib-name_123');

      await fs.mkdir(libraryPath, { recursive: true });

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(true);
    });

    it('should handle concurrent installation requests gracefully', async () => {
      const libraryName = 'concurrent-lib';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Mock installation
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          setTimeout(() => {
            fs.mkdir(libraryPath, { recursive: true })
              .then(() => fs.writeFile(
                path.join(libraryPath, 'package.json'),
                JSON.stringify({ name: libraryName, version: '1.0.0' }),
                'utf-8'
              ))
              .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
              .catch(callback);
          }, 10);
        }
        return {} as any;
      });

      // Start two installations concurrently
      const [result1, result2] = await Promise.all([
        manager.installLibrary(libraryName),
        manager.installLibrary(libraryName)
      ]);

      // At least one should succeed
      expect(result1.success || result2.success).toBe(true);
    });

    it('should handle very long library names', async () => {
      const libraryName = 'a'.repeat(200);
      const libraryPath = path.join(testNodeModules, libraryName);

      await fs.mkdir(libraryPath, { recursive: true });

      const verified = await manager.verifyInstallation(libraryName);

      expect(verified).toBe(true);
    });

    it('should handle reinstall prompt when library exists', async () => {
      const libraryName = 'existing-for-reinstall';
      const libraryPath = path.join(testNodeModules, libraryName);

      // Pre-create library
      await fs.mkdir(libraryPath, { recursive: true });
      await fs.writeFile(
        path.join(libraryPath, 'package.json'),
        JSON.stringify({ name: libraryName, version: '1.0.0' }),
        'utf-8'
      );

      // First call should return existing installation
      const result1 = await manager.installLibrary(libraryName);
      expect(result1.success).toBe(true);
      expect(result1.version).toBe('1.0.0');

      // Reinstall should work
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        if (typeof callback === 'function') {
          if (cmd.includes('uninstall')) {
            fs.rm(libraryPath, { recursive: true, force: true })
              .then(() => callback(null, { stdout: 'uninstalled', stderr: '' } as any))
              .catch(callback);
          } else if (cmd.includes('install')) {
            fs.mkdir(libraryPath, { recursive: true })
              .then(() => fs.writeFile(
                path.join(libraryPath, 'package.json'),
                JSON.stringify({ name: libraryName, version: '2.0.0' }),
                'utf-8'
              ))
              .then(() => callback(null, { stdout: 'installed', stderr: '' } as any))
              .catch(callback);
          }
        }
        return {} as any;
      });

      const result2 = await manager.reinstallLibrary(libraryName);
      expect(result2.success).toBe(true);
      expect(result2.version).toBe('2.0.0');
    });
  });
});
