import { FileSystemPort } from '@wiki/application-ports';
import { WikiManifest } from './wiki-manifest';

const SUBDIRECTORIES = ['entities', 'concepts', 'sources'] as const;

/**
 * Scans wiki/entities/, wiki/concepts/, and wiki/sources/ for .md files
 * and writes wiki/manifest.json with the WikiManifest shape.
 *
 * Mirrors the pre-migration scripts/generate-wiki-manifest.mjs behavior:
 * - Subdirectories are scanned in the fixed order entities -> concepts -> sources.
 * - A missing subdirectory contributes zero files and is not created.
 * - Paths are forward-slash, relative to wiki/.
 */
export class GenerateManifestUseCase {
  constructor(private readonly fs: FileSystemPort) {}

  async execute(): Promise<{ manifest: WikiManifest; missingDirs: string[] }> {
    const files: string[] = [];
    const missingDirs: string[] = [];

    for (const subdir of SUBDIRECTORIES) {
      const matches = await this.fs.listWikiFiles(`${subdir}/*.md`);
      if (matches.length === 0) {
        missingDirs.push(subdir);
      }
      files.push(...matches);
    }

    const manifest: WikiManifest = {
      files,
      generatedAt: new Date().toISOString(),
    };

    await this.fs.writeWikiFile(
      'manifest.json',
      JSON.stringify(manifest, null, 2) + '\n'
    );

    return { manifest, missingDirs };
  }
}
