/**
 * Manifest and index regeneration for wiki publication
 * Feature: article-research-session
 * Requirements: 6.9, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4
 *
 * Runs generate-wiki-manifest.mjs and generate-wiki-index.mjs from workspace root,
 * verifies entries exist for created pages, and handles rollback on failure.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ScriptResult } from '../types/article-session';

/**
 * Runs both `generate-wiki-manifest.mjs` and `generate-wiki-index.mjs` scripts
 * from the workspace root to regenerate the wiki manifest and index.
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @returns A ScriptResult indicating success or failure with details
 */
export function regenerateManifestAndIndex(workspaceRoot: string): ScriptResult {
  const manifestScript = 'node scripts/generate-wiki-manifest.mjs';
  const indexScript = 'node scripts/generate-wiki-index.mjs';

  try {
    execSync(manifestScript, {
      cwd: workspaceRoot,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedScript: 'generate-wiki-manifest.mjs',
      errorMessage,
    };
  }

  try {
    execSync(indexScript, {
      cwd: workspaceRoot,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      failedScript: 'generate-wiki-index.mjs',
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
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param wikiPages - Array of wiki page paths relative to workspace root
 * @returns true if all pages are found in the manifest, false otherwise
 */
export function verifyManifestEntries(workspaceRoot: string, wikiPages: string[]): boolean {
  if (wikiPages.length === 0) {
    return true;
  }

  const manifestPath = join(workspaceRoot, 'wiki', 'manifest.json');
  if (!existsSync(manifestPath)) {
    return false;
  }

  try {
    const manifestContent = readFileSync(manifestPath, 'utf-8');
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
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param wikiPages - Array of wiki page paths relative to workspace root
 * @returns true if all pages have corresponding entries in the index, false otherwise
 */
export function verifyIndexEntries(workspaceRoot: string, wikiPages: string[]): boolean {
  if (wikiPages.length === 0) {
    return true;
  }

  const indexPath = join(workspaceRoot, 'wiki', 'index.md');
  if (!existsSync(indexPath)) {
    return false;
  }

  try {
    const indexContent = readFileSync(indexPath, 'utf-8');

    // For each wiki page, check that its title appears in the index.
    // The index uses [[Page Title]] WikiLinks, so we read the page's frontmatter title
    // and check if it appears in the index content.
    return wikiPages.every((page) => {
      const pagePath = join(workspaceRoot, page);
      if (!existsSync(pagePath)) {
        return false;
      }

      const pageContent = readFileSync(pagePath, 'utf-8');
      const title = extractTitleFromFrontmatter(pageContent);

      if (!title) {
        // Fall back to checking if the filename slug appears in the index
        const filename = page.split('/').pop()?.replace(/\.md$/, '') || '';
        return indexContent.includes(filename);
      }

      return indexContent.includes(title);
    });
  } catch {
    return false;
  }
}

/**
 * Deletes all specified wiki pages from disk (used for rollback on script failure).
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @param pages - Array of wiki page paths relative to workspace root to delete
 */
export function rollbackPages(workspaceRoot: string, pages: string[]): void {
  for (const page of pages) {
    const absolutePath = join(workspaceRoot, page);
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
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
