/**
 * Reciprocal reference insertion for wiki pages
 * Feature: article-research-session
 * Requirements: 7.4, 7.5
 *
 * Adds a reciprocal [[Source Page Title]] reference to each entity/concept page
 * linked from a source page. Preserves the source page and any successfully added
 * references if some targets fail.
 *
 * All file I/O is routed through FileSystemPort (Requirement 1.2, 5.6). Target
 * pages are wiki-relative (e.g. `wiki/entities/foo.md`); the `wiki/` prefix is
 * stripped before delegating to the port's wiki-scoped methods.
 */

import type { FileSystemPort } from '@wiki/application-ports';
import type { FailedReference } from '@wiki/domain-research-session';

/**
 * Strips the `wiki/` prefix from a wiki-relative path so it can be passed to
 * FileSystemPort's wiki-scoped methods (which are already rooted at `wiki/`).
 */
function toWikiRelativePath(targetPage: string): string {
  return targetPage.startsWith('wiki/') ? targetPage.slice('wiki/'.length) : targetPage;
}

/**
 * Adds reciprocal references to target wiki pages, linking back to the source page.
 *
 * For each target page:
 * 1. Reads the file content
 * 2. Checks if a "## Sources" section exists; if not, appends one
 * 3. Adds `- [[sourcePageTitle]]` to the Sources section (skips if already present)
 * 4. If a target page fails (doesn't exist, can't be read/written), records it as a FailedReference
 *
 * @param fs - FileSystemPort used for wiki page I/O
 * @param sourcePageTitle - The title of the source page to reference (used in [[WikiLink]] syntax)
 * @param targetPages - Array of target page paths relative to the workspace root (e.g., "wiki/entities/rxjs.md")
 * @returns Array of FailedReference objects for targets that could not be updated (empty if all succeeded)
 */
export async function addReciprocalReferences(
  fs: FileSystemPort,
  sourcePageTitle: string,
  targetPages: string[]
): Promise<FailedReference[]> {
  const failures: FailedReference[] = [];

  for (const targetPage of targetPages) {
    const wikiPath = toWikiRelativePath(targetPage);

    try {
      if (!(await fs.wikiFileExists(wikiPath))) {
        failures.push({
          targetPage,
          sourcePage: sourcePageTitle,
          reason: `File does not exist: ${targetPage}`,
        });
        continue;
      }

      const content = await fs.readWikiFile(wikiPath);
      const wikiLink = `[[${sourcePageTitle}]]`;

      // Check if the reference already exists in the file
      if (content.includes(wikiLink)) {
        // Already has this reference, skip without error
        continue;
      }

      const updatedContent = insertSourceReference(content, wikiLink);
      await fs.writeWikiFile(wikiPath, updatedContent);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({
        targetPage,
        sourcePage: sourcePageTitle,
        reason,
      });
    }
  }

  return failures;
}

/**
 * Inserts a source reference WikiLink into the page content.
 *
 * If a "## Sources" section already exists, appends the reference as a new bullet point.
 * If no "## Sources" section exists, appends one at the end of the file.
 */
function insertSourceReference(content: string, wikiLink: string): string {
  const sourcesHeadingRegex = /^## Sources$/m;
  const match = content.match(sourcesHeadingRegex);

  if (match && match.index !== undefined) {
    // Sources section exists — insert the reference after existing items
    const insertionPoint = findSourcesSectionEnd(content, match.index + match[0].length);
    const before = content.slice(0, insertionPoint);
    const after = content.slice(insertionPoint);

    // Ensure proper formatting: add the bullet item
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const reference = `${needsNewline ? '\n' : ''}- ${wikiLink}\n`;

    return before + reference + after;
  } else {
    // No Sources section — append one at the end
    const trimmedContent = content.trimEnd();
    const sourcesSection = `\n\n## Sources\n\n- ${wikiLink}\n`;
    return trimmedContent + sourcesSection;
  }
}

/**
 * Finds the end position of the Sources section content (before the next heading or EOF).
 * Starts searching from the position right after the "## Sources" heading.
 */
function findSourcesSectionEnd(content: string, afterHeading: number): number {
  // Find the next heading (## or higher) after the Sources heading
  const remainingContent = content.slice(afterHeading);
  const nextHeadingMatch = remainingContent.match(/\n(?=## |\n#[^#])/);

  if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
    // There's another section after Sources — insert before it
    return afterHeading + nextHeadingMatch.index + 1;
  }

  // No next heading — the Sources section goes to the end of the file
  // Find the last non-whitespace position in the remaining content
  const trimmedRemaining = remainingContent.replace(/\s+$/, '');
  return afterHeading + trimmedRemaining.length + 1;
}
