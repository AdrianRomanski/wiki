import { WikiIndex, SearchContentResult } from '../models/types';
import { searchContent } from '../services/search.service';

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
