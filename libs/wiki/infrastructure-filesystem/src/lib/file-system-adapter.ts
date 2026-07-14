import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FileSystemPort, FileStats } from '@wiki/application-ports';
import { InvalidPathError } from './invalid-path-error';
import { FileOperationError } from './file-operation-error';

export interface FileSystemConfig {
  rootDir: string;
  rawDir: string;
  wikiDir: string;
}

export const DEFAULT_CONFIG: FileSystemConfig = {
  rootDir: process.cwd(),
  rawDir: 'raw',
  wikiDir: 'wiki',
};

export class FileSystemAdapter implements FileSystemPort {
  constructor(private config: FileSystemConfig = DEFAULT_CONFIG) {}

  private validatePath(filePath: string, baseDir: string): string {
    const absoluteBase = path.resolve(baseDir);
    const absolutePath = path.resolve(baseDir, filePath);

    if (!absolutePath.startsWith(absoluteBase + path.sep) && absolutePath !== absoluteBase) {
      throw new InvalidPathError(
        `Path '${filePath}' attempts to access outside allowed directory`,
        filePath
      );
    }

    return absolutePath;
  }

  async readRawFile(filePath: string): Promise<string> {
    const rawBase = path.join(this.config.rootDir, this.config.rawDir);
    const absolutePath = this.validatePath(filePath, rawBase);

    try {
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      throw new FileOperationError(
        `Failed to read raw file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async readWikiFile(filePath: string): Promise<string> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);
    const absolutePath = this.validatePath(filePath, wikiBase);

    try {
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      throw new FileOperationError(
        `Failed to read wiki file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async writeWikiFile(filePath: string, content: string): Promise<void> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);
    const absolutePath = this.validatePath(filePath, wikiBase);

    const dir = path.dirname(absolutePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to create directory for: ${filePath}`,
        filePath,
        error as Error
      );
    }

    const tempPath = `${absolutePath}.tmp`;

    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, absolutePath);
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        void cleanupError;
      }

      throw new FileOperationError(
        `Failed to write wiki file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async listRawFiles(pattern: string): Promise<string[]> {
    const rawBase = path.join(this.config.rootDir, this.config.rawDir);

    try {
      const files = await glob(pattern, {
        cwd: rawBase,
        nodir: true,
        dot: false,
      });

      return files;
    } catch (error) {
      throw new FileOperationError(
        `Failed to list raw files with pattern: ${pattern}`,
        pattern,
        error as Error
      );
    }
  }

  async listWikiFiles(pattern: string): Promise<string[]> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);

    try {
      const files = await glob(pattern, {
        cwd: wikiBase,
        nodir: true,
        dot: false,
      });

      return files;
    } catch (error) {
      throw new FileOperationError(
        `Failed to list wiki files with pattern: ${pattern}`,
        pattern,
        error as Error
      );
    }
  }

  async rawFileExists(filePath: string): Promise<boolean> {
    const rawBase = path.join(this.config.rootDir, this.config.rawDir);

    try {
      const absolutePath = this.validatePath(filePath, rawBase);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async wikiFileExists(filePath: string): Promise<boolean> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);

    try {
      const absolutePath = this.validatePath(filePath, wikiBase);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async getRawFileStats(filePath: string): Promise<FileStats> {
    const rawBase = path.join(this.config.rootDir, this.config.rawDir);
    const absolutePath = this.validatePath(filePath, rawBase);

    try {
      const stats = await fs.stat(absolutePath);
      return {
        size: stats.size,
        created: stats.ctime,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new FileOperationError(
        `Failed to get stats for raw file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async getWikiFileStats(filePath: string): Promise<FileStats> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);
    const absolutePath = this.validatePath(filePath, wikiBase);

    try {
      const stats = await fs.stat(absolutePath);
      return {
        size: stats.size,
        created: stats.ctime,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new FileOperationError(
        `Failed to get stats for wiki file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async ensureWikiDir(dirPath: string): Promise<void> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);
    const absolutePath = this.validatePath(dirPath, wikiBase);

    try {
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to create wiki directory: ${dirPath}`,
        dirPath,
        error as Error
      );
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    const absolutePath = this.validatePath(dirPath, this.config.rootDir);

    try {
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to create directory: ${dirPath}`,
        dirPath,
        error as Error
      );
    }
  }

  async deleteWikiFile(filePath: string): Promise<void> {
    const wikiBase = path.join(this.config.rootDir, this.config.wikiDir);
    const absolutePath = this.validatePath(filePath, wikiBase);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      throw new FileOperationError(
        `Failed to delete wiki file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async readFile(filePath: string): Promise<string> {
    const absolutePath = this.validatePath(filePath, this.config.rootDir);

    try {
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      throw new FileOperationError(
        `Failed to read file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const absolutePath = this.validatePath(filePath, this.config.rootDir);

    const dir = path.dirname(absolutePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to create directory for: ${filePath}`,
        filePath,
        error as Error
      );
    }

    try {
      await fs.writeFile(absolutePath, content, 'utf-8');
    } catch (error) {
      throw new FileOperationError(
        `Failed to write file: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  async deleteDir(dirPath: string): Promise<void> {
    const absolutePath = this.validatePath(dirPath, this.config.rootDir);

    try {
      await fs.rm(absolutePath, { recursive: true, force: true });
    } catch (error) {
      throw new FileOperationError(
        `Failed to delete directory: ${dirPath}`,
        dirPath,
        error as Error
      );
    }
  }
}
