/**
 * Tool Handler: wiki_search
 *
 * Performs full-text search across wiki pages.
 */

import { WikiIndex, SearchContentResult } from '../types';
import { searchContent } from '../search';

/**
 * Handles the wiki_search tool invocation.
 */
export function handleSearchContent(
  wikiDir: string,
  index: WikiIndex,
  params: { query: string }
): SearchContentResult {
  const matches = searchContent(wikiDir, index, params.query);
  return {
    matches,
    totalMatches: matches.length,
  };
}
