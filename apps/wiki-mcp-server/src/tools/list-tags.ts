/**
 * Tool Handler: wiki_list_tags
 *
 * Lists all unique tags with page counts.
 */

import { WikiIndex, ListTagsResult } from '../types';

/**
 * Handles the wiki_list_tags tool invocation.
 */
export function handleListTags(index: WikiIndex): ListTagsResult {
  const tagCounts = new Map<string, number>();

  for (const [, meta] of index.pages) {
    for (const tag of meta.tags) {
      const count = tagCounts.get(tag) ?? 0;
      tagCounts.set(tag, count + 1);
    }
  }

  const tags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, undefined, { sensitivity: 'base' }));

  return { tags };
}
