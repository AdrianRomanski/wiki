/**
 * Tool Handler: wiki_list_pages
 *
 * Lists wiki pages with optional type and tag filtering.
 * Returns results sorted alphabetically by title (case-insensitive).
 */

import { WikiIndex, ListPagesResult } from '../types';

/**
 * Handles the wiki_list_pages tool invocation.
 *
 * @param index - The in-memory wiki index
 * @param params - Optional type and tag filters
 * @returns Filtered and sorted list of pages
 */
export function handleListPages(
  index: WikiIndex,
  params: { type?: string; tag?: string }
): ListPagesResult {
  const { type, tag } = params;

  let pages = Array.from(index.pages.values());

  // Filter by type if specified
  if (type) {
    pages = pages.filter((page) => page.type === type);
  }

  // Filter by tag if specified (case-insensitive comparison)
  if (tag) {
    const normalizedTag = tag.toLowerCase();
    pages = pages.filter((page) =>
      page.tags.some((t) => t.toLowerCase() === normalizedTag)
    );
  }

  // Sort alphabetically by title (case-insensitive)
  pages.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );

  // Map to result shape
  return {
    pages: pages.map((page) => ({
      title: page.title,
      type: page.type,
      tags: page.tags,
      filePath: page.filePath,
    })),
  };
}
