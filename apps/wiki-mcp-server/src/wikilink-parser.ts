/**
 * WikiLink Parser - Extracts [[WikiLink]] references from markdown content.
 *
 * Handles:
 * - [[Page Title]]
 * - [[Page Title|Display Text]] -> extracts "Page Title"
 * - [[Page Title#Section]] -> extracts "Page Title"
 */

/**
 * Extracts WikiLink targets from markdown content.
 * Returns a deduplicated array of target titles.
 */
export function extractWikiLinks(content: string): string[] {
  const wikiLinkPattern = /(?<!\\)\[\[([^[\]]+?)\]\]/g;
  const titles = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    let target = match[1];

    // Skip empty links
    if (!target.trim()) {
      continue;
    }

    // Handle [[Title|Display]] — extract part before the pipe
    const pipeIndex = target.indexOf('|');
    if (pipeIndex !== -1) {
      target = target.substring(0, pipeIndex);
    }

    // Handle [[Title#Section]] — extract part before the hash
    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      target = target.substring(0, hashIndex);
    }

    // Only add non-empty titles after extraction
    const trimmed = target.trim();
    if (trimmed) {
      titles.add(trimmed);
    }
  }

  return Array.from(titles);
}
