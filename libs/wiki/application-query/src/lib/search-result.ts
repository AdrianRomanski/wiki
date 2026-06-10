import { WikiPage } from '@wiki/domain-models';

export interface SearchResult {
  page: WikiPage;
  relevance: number;
  matchedContent: string[];
  relatedPages: WikiPage[];
}
