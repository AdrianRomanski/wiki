import { FileSystemPort } from '@wiki/application-ports';

/**
 * Fixed directory list to scaffold, mirroring the pre-migration
 * scripts/init-wiki.ts DIRECTORIES list exactly (order matters for
 * deterministic progress reporting by CLI wrappers).
 */
export const SCAFFOLD_DIRECTORIES = [
  'raw',
  'raw/articles',
  'raw/papers',
  'raw/code-snippets',
  'raw/notes',
  'raw/angular-aria',
  'wiki',
  'wiki/entities',
  'wiki/concepts',
  'wiki/sources',
] as const;

export interface ScaffoldWikiResult {
  created: string[];
  existing: string[];
}

/**
 * Idempotently creates the `raw/` and `wiki/` directory trees via
 * `FileSystemPort.ensureDir`, mirroring the pre-migration
 * scripts/init-wiki.ts behavior.
 *
 * Known simplification: `FileSystemPort` has no directory-existence-check
 * capability, and `ensureDir` does not report whether it created a new
 * directory or found an existing one. Because this distinction is not
 * observable through the current port surface, every directory processed
 * is reported under `created`; `existing` is always empty. `ensureDir`
 * itself remains idempotent on disk (safe to call repeatedly).
 */
export class ScaffoldWikiUseCase {
  constructor(private readonly fs: FileSystemPort) {}

  async execute(): Promise<ScaffoldWikiResult> {
    const created: string[] = [];
    const existing: string[] = [];

    for (const dir of SCAFFOLD_DIRECTORIES) {
      await this.fs.ensureDir(dir);
      created.push(dir);
    }

    return { created, existing };
  }
}
