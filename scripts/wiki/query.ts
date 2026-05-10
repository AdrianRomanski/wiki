/**
 * Query and search functionality for the LLM Wiki Second Brain system.
 * 
 * This module provides:
 * - Full-text search across all wiki page content
 * - Tag-based search
 * - Name-based search for entities and concepts
 * - Search result ranking by relevance
 * - Cross-reference context in search results
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 13.5
 */

import { WikiPage } from './models.js';
import { listWikiFiles, readWikiFile, FileSystemConfig, DEFAULT_CONFIG } from './filesystem.js';
import { parseFrontmatter } from './frontmatter.js';
import { extractWikiLinks } from './markdown.js';
import { findBacklinks } from './cross-reference.js';
import * as path from 'path';

/**
 * Represents a search result with relevance scoring and context.
 */
export interface SearchResult {
  /** The wiki page that matched the search */
  page: WikiPage;
  
  /** Relevance score (0-1, higher is more relevant) */
  relevance: number;
  
  /** Snippets of content that matched the search query */
  matchedContent: string[];
  
  /** Related pages for context (via cross-references) */
  relatedPages: WikiPage[];
}

/**
 * Options for full-text search.
 */
export interface SearchOptions {
  /** Maximum number of results to return */
  maxResults?: number;
  
  /** Whether to include related pages in results */
  includeRelatedPages?: boolean;
  
  /** Whether to perform case-sensitive search */
  caseSensitive?: boolean;
  
  /** Maximum length of content snippets */
  snippetLength?: number;
  
  /** Whether to sort results by date (most recent first) */
  sortByDate?: boolean;
}

/**
 * Filters for source-based search.
 */
export interface SourceFilters {
  /** Filter by author name */
  author?: string;
  
  /** Filter by date (YYYY-MM-DD) */
  date?: string;
  
  /** Filter by URL pattern */
  urlPattern?: string;
  
  /** Filter by library name (for ADR-generated sources) */
  libraryName?: string;
  
  /** Filter by session ID (for ADR-generated sources) */
  sessionId?: string;
}

/**
 * Query engine for searching and retrieving wiki content.
 */
export class QueryEngine {
  private config: FileSystemConfig;
  
  constructor(config: FileSystemConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
  
  /**
   * Performs full-text search across all wiki content.
   * 
   * Searches through page titles, tags, and content body.
   * Results are ranked by relevance based on:
   * - Title matches (highest weight)
   * - Tag matches (medium weight)
   * - Content matches (lower weight)
   * - Number of matches
   * 
   * @param query - The search query string
   * @param options - Search options
   * @returns Array of search results sorted by relevance
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * const results = await engine.search('accessibility');
   * 
   * for (const result of results) {
   *   console.log(`${result.page.frontmatter.title} (${result.relevance})`);
   *   console.log(result.matchedContent.join('\n'));
   * }
   * ```
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      maxResults = 20,
      includeRelatedPages = true,
      caseSensitive = false,
      snippetLength = 150,
      sortByDate = false,
    } = options;
    
    if (!query.trim()) {
      return [];
    }
    
    // Load all wiki pages
    const pages = await this.loadAllPages();
    
    // Normalize query for searching
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Score each page
    const scoredResults: Array<{ page: WikiPage; score: number; matches: string[] }> = [];
    
    for (const page of pages) {
      const { score, matches } = this.scorePage(page, queryTerms, caseSensitive);
      
      if (score > 0) {
        scoredResults.push({ page, score, matches });
      }
    }
    
    // Sort by score (descending) or by date if requested
    if (sortByDate) {
      scoredResults.sort((a, b) => {
        const dateA = a.page.frontmatter.date || a.page.frontmatter.created;
        const dateB = b.page.frontmatter.date || b.page.frontmatter.created;
        
        if (!dateA && !dateB) return b.score - a.score;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } else {
      scoredResults.sort((a, b) => b.score - a.score);
    }
    
    // Take top results
    const topResults = scoredResults.slice(0, maxResults);
    
    // Build search results with context
    const results: SearchResult[] = [];
    
    for (const { page, score, matches } of topResults) {
      const matchedContent = this.extractSnippets(page.content, queryTerms, snippetLength, caseSensitive);
      
      let relatedPages: WikiPage[] = [];
      if (includeRelatedPages) {
        relatedPages = await this.getRelatedPages(page, pages);
      }
      
      results.push({
        page,
        relevance: score,
        matchedContent,
        relatedPages,
      });
    }
    
    return results;
  }
  
  /**
   * Searches wiki pages by tag.
   * 
   * Supports both frontmatter tags and inline #tag syntax.
   * 
   * @param tag - The tag to search for (with or without # prefix)
   * @returns Array of wiki pages that have the specified tag
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * const pages = await engine.searchByTag('accessibility');
   * // or
   * const pages = await engine.searchByTag('#accessibility');
   * ```
   */
  async searchByTag(tag: string): Promise<WikiPage[]> {
    // Remove # prefix if present
    const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;
    
    const pages = await this.loadAllPages();
    const results: WikiPage[] = [];
    
    for (const page of pages) {
      // Check frontmatter tags
      const hasFrontmatterTag = page.frontmatter.tags.some(
        t => t.toLowerCase() === normalizedTag.toLowerCase()
      );
      
      // Check inline #tag syntax in content
      const inlineTagRegex = new RegExp(`#${normalizedTag}\\b`, 'i');
      const hasInlineTag = inlineTagRegex.test(page.content);
      
      if (hasFrontmatterTag || hasInlineTag) {
        results.push(page);
      }
    }
    
    return results;
  }
  
  /**
   * Finds entity pages by name pattern.
   * 
   * @param namePattern - Optional regex pattern to match entity names
   * @returns Array of entity pages
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * 
   * // Get all entities
   * const allEntities = await engine.findEntities();
   * 
   * // Get entities matching pattern
   * const angularEntities = await engine.findEntities('angular');
   * ```
   */
  async findEntities(namePattern?: string): Promise<WikiPage[]> {
    return this.findPagesByType('entity', namePattern);
  }
  
  /**
   * Finds concept pages by name pattern.
   * 
   * @param namePattern - Optional regex pattern to match concept names
   * @returns Array of concept pages
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * 
   * // Get all concepts
   * const allConcepts = await engine.findConcepts();
   * 
   * // Get concepts matching pattern
   * const accessibilityConcepts = await engine.findConcepts('accessibility');
   * ```
   */
  async findConcepts(namePattern?: string): Promise<WikiPage[]> {
    return this.findPagesByType('concept', namePattern);
  }
  
  /**
   * Finds source summary pages with optional filters.
   * 
   * @param filters - Optional filters for author, date, URL, library name, session ID
   * @returns Array of source summary pages
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * 
   * // Get all sources
   * const allSources = await engine.findSources();
   * 
   * // Get sources by author
   * const authorSources = await engine.findSources({ author: 'John Doe' });
   * 
   * // Get sources by date
   * const dateSources = await engine.findSources({ date: '2024-01-01' });
   * 
   * // Get ADR sources by library name
   * const librarySources = await engine.findSources({ libraryName: 'angular' });
   * 
   * // Get ADR sources by session ID
   * const sessionSources = await engine.findSources({ sessionId: 'session-001' });
   * ```
   */
  async findSources(filters?: SourceFilters): Promise<WikiPage[]> {
    const pages = await this.findPagesByType('source');
    
    if (!filters) {
      return pages;
    }
    
    return pages.filter(page => {
      if (filters.author && page.frontmatter.author !== filters.author) {
        return false;
      }
      
      if (filters.date && page.frontmatter.date !== filters.date) {
        return false;
      }
      
      if (filters.urlPattern && page.frontmatter.url) {
        const regex = new RegExp(filters.urlPattern, 'i');
        if (!regex.test(page.frontmatter.url)) {
          return false;
        }
      }
      
      if (filters.libraryName) {
        const normalizedLibrary = filters.libraryName.toLowerCase();
        const inTitle = page.frontmatter.title.toLowerCase().includes(normalizedLibrary);
        const inTags = page.frontmatter.tags.some(t => t.toLowerCase().includes(normalizedLibrary));
        const inContent = page.content.toLowerCase().includes(normalizedLibrary);
        
        if (!inTitle && !inTags && !inContent) {
          return false;
        }
      }
      
      if (filters.sessionId) {
        const frontmatter = page.frontmatter as any;
        const hasSessionId = frontmatter.sessionId === filters.sessionId;
        const inContent = page.content.includes(filters.sessionId);
        
        if (!hasSessionId && !inContent) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Finds all pages that link to the specified page (backlinks).
   * 
   * @param pagePath - Path to the page (relative to wiki/)
   * @returns Array of pages that link to the specified page
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * const backlinks = await engine.findBacklinks('entities/angular-cdk.md');
   * ```
   */
  async findBacklinks(pagePath: string): Promise<WikiPage[]> {
    const pages = await this.loadAllPages();
    const targetPage = pages.find(p => p.path === pagePath);
    
    if (!targetPage) {
      return [];
    }
    
    const targetTitle = targetPage.frontmatter.title;
    const backlinks: WikiPage[] = [];
    
    for (const page of pages) {
      if (page.path === pagePath) {
        continue; // Skip the page itself
      }
      
      const links = extractWikiLinks(page.content);
      if (links.some(link => link.toLowerCase() === targetTitle.toLowerCase())) {
        backlinks.push(page);
      }
    }
    
    return backlinks;
  }
  
  /**
   * Searches for research decisions (ADR-generated Source_Summary pages).
   * 
   * Supports searching by:
   * - Tags: "research", "adr", "decision"
   * - Library name: finds decisions related to specific libraries
   * - Session ID: finds decisions from specific research sessions
   * 
   * Results are ranked by decision date (most recent first) and include
   * Session_Reference links back to research context.
   * 
   * @param options - Search options
   * @returns Array of research decision pages sorted by date
   * 
   * @example
   * ```typescript
   * const engine = new QueryEngine();
   * 
   * // Find all research decisions
   * const allDecisions = await engine.findResearchDecisions();
   * 
   * // Find decisions by tag
   * const adrDecisions = await engine.findResearchDecisions({ tag: 'adr' });
   * 
   * // Find decisions related to a library
   * const angularDecisions = await engine.findResearchDecisions({ libraryName: 'angular' });
   * 
   * // Find decisions from a specific session
   * const sessionDecisions = await engine.findResearchDecisions({ sessionId: 'session-001' });
   * ```
   */
  async findResearchDecisions(options: {
    tag?: string;
    libraryName?: string;
    sessionId?: string;
    maxResults?: number;
  } = {}): Promise<WikiPage[]> {
    const { tag, libraryName, sessionId, maxResults = 50 } = options;
    
    // Load all pages
    const pages = await this.loadAllPages();
    
    // Filter for Source_Summary pages with research/adr tags
    let results = pages.filter(page => {
      // Must be a source page
      if (page.frontmatter.type !== 'source') {
        return false;
      }
      
      // Must have at least one research-related tag
      const hasResearchTag = page.frontmatter.tags.some(t => 
        ['research', 'adr', 'decision'].includes(t.toLowerCase())
      );
      
      if (!hasResearchTag) {
        return false;
      }
      
      return true;
    });
    
    // Apply tag filter if specified
    if (tag) {
      const normalizedTag = tag.toLowerCase();
      results = results.filter(page => 
        page.frontmatter.tags.some(t => t.toLowerCase() === normalizedTag)
      );
    }
    
    // Apply library name filter if specified
    if (libraryName) {
      const normalizedLibrary = libraryName.toLowerCase();
      results = results.filter(page => {
        // Check if library name appears in title, tags, or content
        const inTitle = page.frontmatter.title.toLowerCase().includes(normalizedLibrary);
        const inTags = page.frontmatter.tags.some(t => t.toLowerCase().includes(normalizedLibrary));
        const inContent = page.content.toLowerCase().includes(normalizedLibrary);
        
        return inTitle || inTags || inContent;
      });
    }
    
    // Apply session ID filter if specified
    if (sessionId) {
      results = results.filter(page => {
        // Check frontmatter for sessionId field
        const frontmatter = page.frontmatter as any;
        if (frontmatter.sessionId === sessionId) {
          return true;
        }
        
        // Also check content for session reference
        return page.content.includes(sessionId);
      });
    }
    
    // Sort by date (most recent first)
    results.sort((a, b) => {
      const dateA = a.frontmatter.date || a.frontmatter.created;
      const dateB = b.frontmatter.date || b.frontmatter.created;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    // Limit results
    return results.slice(0, maxResults);
  }
  
  /**
   * Loads all wiki pages from the wiki directory.
   * 
   * @returns Array of all wiki pages
   */
  private async loadAllPages(): Promise<WikiPage[]> {
    const pages: WikiPage[] = [];
    
    // List all markdown files in wiki/
    const files = await listWikiFiles('**/*.md', this.config);
    
    for (const filePath of files) {
      // Skip index and activity log
      if (filePath === 'index.md' || filePath === 'activity-log.md') {
        continue;
      }
      
      try {
        const content = await readWikiFile(filePath, this.config);
        const { frontmatter, content: body } = parseFrontmatter(content);
        
        const page: WikiPage = {
          path: filePath,
          filename: path.basename(filePath),
          frontmatter,
          content: body,
          sections: [], // Not needed for search
          outgoingLinks: extractWikiLinks(body),
          incomingLinks: [], // Will be populated if needed
        };
        
        pages.push(page);
      } catch (error) {
        // Skip files that can't be parsed
        console.warn(`Warning: Could not parse ${filePath}:`, error);
      }
    }
    
    return pages;
  }
  
  /**
   * Scores a page based on how well it matches the query terms.
   * 
   * Scoring weights:
   * - Title match: 10 points per term
   * - Tag match: 5 points per term
   * - Content match: 1 point per term
   * 
   * @param page - The page to score
   * @param queryTerms - Normalized query terms
   * @param caseSensitive - Whether to perform case-sensitive matching
   * @returns Score and matched content snippets
   */
  private scorePage(
    page: WikiPage,
    queryTerms: string[],
    caseSensitive: boolean
  ): { score: number; matches: string[] } {
    let score = 0;
    const matches: string[] = [];
    
    const normalizeText = (text: string) => caseSensitive ? text : text.toLowerCase();
    
    const title = normalizeText(page.frontmatter.title);
    const tags = page.frontmatter.tags.map(normalizeText);
    const content = normalizeText(page.content);
    
    for (const term of queryTerms) {
      // Title matches (highest weight)
      if (title.includes(term)) {
        score += 10;
        matches.push(`Title: ${page.frontmatter.title}`);
      }
      
      // Tag matches (medium weight)
      for (const tag of tags) {
        if (tag.includes(term)) {
          score += 5;
          matches.push(`Tag: ${tag}`);
        }
      }
      
      // Content matches (lower weight)
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches;
    }
    
    return { score, matches };
  }
  
  /**
   * Extracts content snippets around query term matches.
   * 
   * @param content - The content to extract snippets from
   * @param queryTerms - Normalized query terms
   * @param snippetLength - Maximum length of each snippet
   * @param caseSensitive - Whether to perform case-sensitive matching
   * @returns Array of content snippets
   */
  private extractSnippets(
    content: string,
    queryTerms: string[],
    snippetLength: number,
    caseSensitive: boolean
  ): string[] {
    const snippets: string[] = [];
    const normalizedContent = caseSensitive ? content : content.toLowerCase();
    
    for (const term of queryTerms) {
      let startIndex = 0;
      let matchIndex: number;
      
      while ((matchIndex = normalizedContent.indexOf(term, startIndex)) !== -1) {
        // Extract snippet around the match
        const snippetStart = Math.max(0, matchIndex - Math.floor(snippetLength / 2));
        const snippetEnd = Math.min(content.length, matchIndex + term.length + Math.floor(snippetLength / 2));
        
        let snippet = content.substring(snippetStart, snippetEnd);
        
        // Add ellipsis if truncated
        if (snippetStart > 0) {
          snippet = '...' + snippet;
        }
        if (snippetEnd < content.length) {
          snippet = snippet + '...';
        }
        
        snippets.push(snippet.trim());
        
        // Move to next potential match
        startIndex = matchIndex + term.length;
        
        // Limit snippets per term
        if (snippets.length >= 3) {
          break;
        }
      }
      
      if (snippets.length >= 3) {
        break;
      }
    }
    
    return snippets;
  }
  
  /**
   * Gets related pages for a given page based on cross-references.
   * 
   * @param page - The page to find related pages for
   * @param allPages - All available pages
   * @returns Array of related pages
   */
  private async getRelatedPages(page: WikiPage, allPages: WikiPage[]): Promise<WikiPage[]> {
    const relatedPages: WikiPage[] = [];
    const relatedTitles = new Set<string>();
    
    // Add pages that this page links to
    for (const link of page.outgoingLinks) {
      const linkedPage = allPages.find(
        p => p.frontmatter.title.toLowerCase() === link.toLowerCase()
      );
      
      if (linkedPage && !relatedTitles.has(linkedPage.frontmatter.title)) {
        relatedPages.push(linkedPage);
        relatedTitles.add(linkedPage.frontmatter.title);
      }
    }
    
    // Add pages that link to this page (backlinks)
    const pageTitle = page.frontmatter.title;
    for (const otherPage of allPages) {
      if (otherPage.path === page.path) {
        continue;
      }
      
      const links = extractWikiLinks(otherPage.content);
      if (links.some(link => link.toLowerCase() === pageTitle.toLowerCase())) {
        if (!relatedTitles.has(otherPage.frontmatter.title)) {
          relatedPages.push(otherPage);
          relatedTitles.add(otherPage.frontmatter.title);
        }
      }
    }
    
    // Limit to top 5 related pages
    return relatedPages.slice(0, 5);
  }
  
  /**
   * Finds pages by type with optional name pattern.
   * 
   * @param type - The page type to filter by
   * @param namePattern - Optional regex pattern to match page titles
   * @returns Array of matching pages
   */
  private async findPagesByType(
    type: 'entity' | 'concept' | 'source',
    namePattern?: string
  ): Promise<WikiPage[]> {
    const pages = await this.loadAllPages();
    
    let results = pages.filter(page => page.frontmatter.type === type);
    
    if (namePattern) {
      const regex = new RegExp(namePattern, 'i');
      results = results.filter(page => regex.test(page.frontmatter.title));
    }
    
    return results;
  }
}

/**
 * Creates a new query engine instance.
 * 
 * @param config - Optional file system configuration
 * @returns A new QueryEngine instance
 * 
 * @example
 * ```typescript
 * const engine = createQueryEngine();
 * const results = await engine.search('accessibility');
 * ```
 */
export function createQueryEngine(config?: FileSystemConfig): QueryEngine {
  return new QueryEngine(config);
}
