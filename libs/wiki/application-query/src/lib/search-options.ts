export interface SearchOptions {
  maxResults?: number;
  includeRelatedPages?: boolean;
  caseSensitive?: boolean;
  snippetLength?: number;
  sortByDate?: boolean;
}

export interface SourceFilters {
  author?: string;
  date?: string;
  urlPattern?: string;
  libraryName?: string;
  sessionId?: string;
}
