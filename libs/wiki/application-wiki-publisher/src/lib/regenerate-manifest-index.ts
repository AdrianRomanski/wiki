/**
 * Manifest and index regeneration for wiki publication
 * Feature: article-research-session
 * Requirements: 6.9, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4
 *
 * Runs the `wiki-cli:generate-manifest` and `wiki-cli:generate-index` Nx
 * targets from the workspace root, verifies entries exist for created
 * pages, and handles rollback on failure.
 *
 * The `child_process` shell-out is isolated behind CommandRunnerPort
 * (Requirement 2.6, 4.5, 4.7) so this Application Layer module imports no
 * concrete `child_process` dependency.
 */

import { CommandRunnerPort, FileSystemPort } from '@wiki/application-ports';
import { ScriptResult } from '@wiki/domain-research-session';

/**
 * Runs both the `wiki-cli:generate-manifest` and `wiki-cli:generate-index`
 * Nx targets from the workspace root to regenerate the wiki manifest and
 * index.
 *
 * @param runner - CommandRunnerPort used to invoke the targets via a shell-out
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @returns A ScriptResult indicating success or failure with details
 */
export function regenerateManifestAndIndex(
  runner: CommandRunnerPort,
  workspaceRoot: string
): ScriptResult {
  const manifestCommand = 'npx nx run wiki-cli:generate-manifest';
  const indexCommand = 'npx nx run wiki-cli:generate-index';

  try {
    runner.runSync(manifestCommand, workspaceRoot);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedScript: 'wiki-cli:generate-manifest',
      errorMessage,
    };
  }

  try {
    runner.runSync(indexCommand, workspaceRoot);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedScript: 'wiki-cli:generate-index',
      errorMessage,
    };
  }

  return { success: true };
}

/**
 * Verifies that wiki/manifest.json contains entries for all created wiki pages.
 *
 * The manifest stores paths relative to the wiki/ directory (e.g., "entities/rxjs.md"),
 * while wikiPages are relative to workspace root (e.g., "wiki/entities/rxjs.md").
 *
 * @param fs - FileSystemPort used to read wiki/manifest.json
 * @param wikiPages - Array of wiki page paths relative to workspace root
 * @returns true if all pages are found in the manifest, false otherwise
 */
export async function verifyManifestEntries(
  fs: FileSystemPort,
  wikiPages: string[]
): Promise<boolean> {
  if (wikiPages.length === 0) {
    return true;
  }

  let manifestContent: string;
  try {
    manifestContent = await fs.readWikiFile('manifest.json');
  } catch {
    return false;
  }

  try {
    const manifest = JSON.parse(manifestContent) as { files: string[] };

    if (!Array.isArray(manifest.files)) {
      return false;
    }

    // wikiPages are like "wiki/entities/foo.md", manifest stores "entities/foo.md"
    return wikiPages.every((page) => {
      const manifestRelativePath = page.replace(/^wiki\//, '');
      return manifest.files.includes(manifestRelativePath);
    });
  } catch {
    return false;
  }
}

/**
 * Verifies that wiki/index.md contains entries (headings or list items) for all created wiki pages.
 *
 * The index uses [[Page Title]] WikiLink syntax, so we check that the page title
 * (derived from the filename) appears somewhere in the index content.
 *
 * @param fs - FileSystemPort used to read wiki/index.md and each wiki page
 * @param wikiPages - Array of wiki page paths relative to workspace root
 * @returns true if all pages have corresponding entries in the index, false otherwise
 */
export async function verifyIndexEntries(
  fs: FileSystemPort,
  wikiPages: string[]
): Promise<boolean> {
  if (wikiPages.length === 0) {
    return true;
  }

  let indexContent: string;
  try {
    indexContent = await fs.readWikiFile('index.md');
  } catch {
    return false;
  }

  try {
    const results = await Promise.all(
      wikiPages.map(async (page) => {
        const wikiRelativePath = page.startsWith('wiki/') ? page.slice('wiki/'.length) : page;

        let pageContent: string;
        try {
          pageContent = await fs.readWikiFile(wikiRelativePath);
        } catch {
          return false;
        }

        const title = extractTitleFromFrontmatter(pageContent);

        if (!title) {
          // Fall back to checking if the filename slug appears in the index
          const filename = page.split('/').pop()?.replace(/\.md$/, '') || '';
          return indexContent.includes(filename);
        }

        return indexContent.includes(title);
      })
    );

    return results.every(Boolean);
  } catch {
    return false;
  }
}

/**
 * Deletes all specified wiki pages from disk (used for rollback on script failure).
 *
 * @param fs - FileSystemPort used to delete each wiki page
 * @param pages - Array of wiki page paths relative to workspace root to delete
 */
export async function rollbackPages(fs: FileSystemPort, pages: string[]): Promise<void> {
  for (const page of pages) {
    const wikiRelativePath = page.startsWith('wiki/') ? page.slice('wiki/'.length) : page;
    try {
      if (await fs.wikiFileExists(wikiRelativePath)) {
        await fs.deleteWikiFile(wikiRelativePath);
      }
    } catch {
      // Best-effort rollback: ignore individual deletion failures.
    }
  }
}

/**
 * Extracts the title from YAML frontmatter of a wiki page.
 */
function extractTitleFromFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return null;
  }

  const frontmatter = match[1];
  const titleMatch = frontmatter.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}
