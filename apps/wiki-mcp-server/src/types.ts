/**
 * Shared TypeScript interfaces for the Wiki MCP Server.
 */

export interface PageMeta {
  title: string;
  type: 'entity' | 'concept' | 'source';
  tags: string[];
  created: string;
  updated: string;
  filePath: string;
  sources?: string[];
  author?: string;
  date?: string;
  url?: string;
  outgoingLinks: string[];
}

export interface WikiIndex {
  pages: Map<string, PageMeta>;
  backlinks: Map<string, string[]>;
  tags: Map<string, string[]>;
}

export interface ParseResult {
  success: boolean;
  meta?: PageMeta;
  error?: string;
}

export interface SearchResult {
  title: string;
  type: string;
  filePath: string;
  excerpt: string;
}

// Tool response types

export interface ListPagesResult {
  pages: Array<{ title: string; type: string; tags: string[]; filePath: string }>;
}

export interface ReadPageResult {
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  backlinks: string[];
}

export interface SearchContentResult {
  matches: Array<{ title: string; type: string; filePath: string; excerpt: string }>;
  totalMatches: number;
}

export interface ResolveRefsResult {
  outgoing: Array<{ title: string; exists: boolean }>;
  incoming: string[];
}

export interface TagSearchResult {
  pages: Array<{ title: string; type: string; filePath: string; tags: string[] }>;
}

export interface ListTagsResult {
  tags: Array<{ tag: string; count: number }>;
}

export interface CreatePageResult {
  filePath: string;
  title: string;
}
