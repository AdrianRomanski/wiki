/**
 * Tool Handler: wiki_search_tags
 *
 * Searches for pages by tag(s). Returns pages that have at least one matching tag.
 */

import { WikiIndex, TagSearchResult } from '../types';

/**
 * Handles the wiki_search_tags tool invocation.
 */
export function handleSearchTags(
  index: WikiIndex,
  params: { tags: string[] }
): TagSearchResult {
  if (!params.tags || params.tags.length === 0) {
    return { pages: [] };
  }

  const queryTags = params.tags.map((t) => t.toLowerCase());
  const pages: TagSearchResult['pages'] = [];

  for (const [, meta] of index.pages) {
    const pageTags = meta.tags.map((t) => t.toLowerCase());
    const hasMatch = queryTags.some((qt) => pageTags.includes(qt));
    if (hasMatch) {
      pages.push({
        title: meta.title,
        type: meta.type,
        filePath: meta.filePath,
        tags: meta.tags,
      });
    }
  }

  // Sort alphabetically by title
  pages.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

  return { pages };
}
