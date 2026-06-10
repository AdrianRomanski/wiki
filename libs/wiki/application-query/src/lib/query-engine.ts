import { WikiPage } from '@wiki/domain-models';
import {
  FileSystemPort,
  FrontmatterPort,
  MarkdownPort,
} from '@wiki/application-ports';
import { SearchResult } from './search-result';
import { SearchOptions, SourceFilters } from './search-options';

interface ExtendedFrontmatter {
  sessionId?: string;
  [key: string]: unknown;
}

export class QueryEngine {
  constructor(
    private fileSystemPort: FileSystemPort,
    private frontmatterPort: FrontmatterPort,
    private markdownPort: MarkdownPort
  ) {}

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
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

    const pages = await this.loadAllPages();

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 0);

    const scoredResults: Array<{
      page: WikiPage;
      score: number;
      matches: string[];
    }> = [];

    for (const page of pages) {
      const { score, matches } = this.scorePage(page, queryTerms, caseSensitive);

      if (score > 0) {
        scoredResults.push({ page, score, matches });
      }
    }

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

    const topResults = scoredResults.slice(0, maxResults);

    const results: SearchResult[] = [];

    for (const { page, score } of topResults) {
      const matchedContent = this.extractSnippets(
        page.content,
        queryTerms,
        snippetLength,
        caseSensitive
      );

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

  async searchByTag(tag: string): Promise<WikiPage[]> {
    const normalizedTag = tag.startsWith('#') ? tag.slice(1) : tag;

    const pages = await this.loadAllPages();
    const results: WikiPage[] = [];

    for (const page of pages) {
      const hasFrontmatterTag = page.frontmatter.tags.some(
        (t) => t.toLowerCase() === normalizedTag.toLowerCase()
      );

      const inlineTagRegex = new RegExp(`#${normalizedTag}\\b`, 'i');
      const hasInlineTag = inlineTagRegex.test(page.content);

      if (hasFrontmatterTag || hasInlineTag) {
        results.push(page);
      }
    }

    return results;
  }

  async findEntities(namePattern?: string): Promise<WikiPage[]> {
    return this.findPagesByType('entity', namePattern);
  }

  async findConcepts(namePattern?: string): Promise<WikiPage[]> {
    return this.findPagesByType('concept', namePattern);
  }

  async findSources(filters?: SourceFilters): Promise<WikiPage[]> {
    const pages = await this.findPagesByType('source');

    if (!filters) {
      return pages;
    }

    return pages.filter((page) => {
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
        const inTags = page.frontmatter.tags.some((t) =>
          t.toLowerCase().includes(normalizedLibrary)
        );
        const inContent = page.content.toLowerCase().includes(normalizedLibrary);

        if (!inTitle && !inTags && !inContent) {
          return false;
        }
      }

      if (filters.sessionId) {
        const frontmatter = page.frontmatter as unknown as ExtendedFrontmatter;
        const hasSessionId = frontmatter.sessionId === filters.sessionId;
        const inContent = page.content.includes(filters.sessionId);

        if (!hasSessionId && !inContent) {
          return false;
        }
      }

      return true;
    });
  }

  async findBacklinks(pagePath: string): Promise<WikiPage[]> {
    const pages = await this.loadAllPages();
    const targetPage = pages.find((p) => p.path === pagePath);

    if (!targetPage) {
      return [];
    }

    const targetTitle = targetPage.frontmatter.title;
    const backlinks: WikiPage[] = [];

    for (const page of pages) {
      if (page.path === pagePath) {
        continue;
      }

      const links = this.markdownPort.extractWikiLinks(page.content);
      if (
        links.some((link) => link.toLowerCase() === targetTitle.toLowerCase())
      ) {
        backlinks.push(page);
      }
    }

    return backlinks;
  }

  async findResearchDecisions(
    options: {
      tag?: string;
      libraryName?: string;
      sessionId?: string;
      maxResults?: number;
    } = {}
  ): Promise<WikiPage[]> {
    const { tag, libraryName, sessionId, maxResults = 50 } = options;

    const pages = await this.loadAllPages();

    let results = pages.filter((page) => {
      if (page.frontmatter.type !== 'source') {
        return false;
      }

      const hasResearchTag = page.frontmatter.tags.some((t) =>
        ['research', 'adr', 'decision'].includes(t.toLowerCase())
      );

      if (!hasResearchTag) {
        return false;
      }

      return true;
    });

    if (tag) {
      const normalizedTag = tag.toLowerCase();
      results = results.filter((page) =>
        page.frontmatter.tags.some((t) => t.toLowerCase() === normalizedTag)
      );
    }

    if (libraryName) {
      const normalizedLibrary = libraryName.toLowerCase();
      results = results.filter((page) => {
        const inTitle = page.frontmatter.title.toLowerCase().includes(normalizedLibrary);
        const inTags = page.frontmatter.tags.some((t) =>
          t.toLowerCase().includes(normalizedLibrary)
        );
        const inContent = page.content.toLowerCase().includes(normalizedLibrary);

        return inTitle || inTags || inContent;
      });
    }

    if (sessionId) {
      results = results.filter((page) => {
        const frontmatter = page.frontmatter as unknown as ExtendedFrontmatter;
        if (frontmatter.sessionId === sessionId) {
          return true;
        }

        return page.content.includes(sessionId);
      });
    }

    results.sort((a, b) => {
      const dateA = a.frontmatter.date || a.frontmatter.created;
      const dateB = b.frontmatter.date || b.frontmatter.created;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return results.slice(0, maxResults);
  }

  private async loadAllPages(): Promise<WikiPage[]> {
    const pages: WikiPage[] = [];

    const files = await this.fileSystemPort.listWikiFiles('**/*.md');

    for (const filePath of files) {
      if (filePath === 'index.md' || filePath === 'activity-log.md') {
        continue;
      }

      try {
        const content = await this.fileSystemPort.readWikiFile(filePath);
        const { frontmatter, content: body } =
          this.frontmatterPort.parseFrontmatter(content);

        const page: WikiPage = {
          path: filePath,
          filename: filePath.split('/').pop() || filePath,
          frontmatter,
          content: body,
          sections: [],
          outgoingLinks: this.markdownPort.extractWikiLinks(body),
          incomingLinks: [],
        };

        pages.push(page);
      } catch (error) {
        console.warn(`Warning: Could not parse ${filePath}:`, error);
      }
    }

    return pages;
  }

  private scorePage(
    page: WikiPage,
    queryTerms: string[],
    caseSensitive: boolean
  ): { score: number; matches: string[] } {
    let score = 0;
    const matches: string[] = [];

    const normalizeText = (text: string) =>
      caseSensitive ? text : text.toLowerCase();

    const title = normalizeText(page.frontmatter.title);
    const tags = page.frontmatter.tags.map(normalizeText);
    const content = normalizeText(page.content);

    for (const term of queryTerms) {
      if (title.includes(term)) {
        score += 10;
        matches.push(`Title: ${page.frontmatter.title}`);
      }

      for (const tag of tags) {
        if (tag.includes(term)) {
          score += 5;
          matches.push(`Tag: ${tag}`);
        }
      }

      const contentMatches = (content.match(new RegExp(term, 'g')) || [])
        .length;
      score += contentMatches;
    }

    return { score, matches };
  }

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

      while (
        (matchIndex = normalizedContent.indexOf(term, startIndex)) !== -1
      ) {
        const snippetStart = Math.max(
          0,
          matchIndex - Math.floor(snippetLength / 2)
        );
        const snippetEnd = Math.min(
          content.length,
          matchIndex + term.length + Math.floor(snippetLength / 2)
        );

        let snippet = content.substring(snippetStart, snippetEnd);

        if (snippetStart > 0) {
          snippet = '...' + snippet;
        }
        if (snippetEnd < content.length) {
          snippet = snippet + '...';
        }

        snippets.push(snippet.trim());

        startIndex = matchIndex + term.length;

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

  private async getRelatedPages(
    page: WikiPage,
    allPages: WikiPage[]
  ): Promise<WikiPage[]> {
    const relatedPages: WikiPage[] = [];
    const relatedTitles = new Set<string>();

    for (const link of page.outgoingLinks) {
      const linkedPage = allPages.find(
        (p) => p.frontmatter.title.toLowerCase() === link.toLowerCase()
      );

      if (linkedPage && !relatedTitles.has(linkedPage.frontmatter.title)) {
        relatedPages.push(linkedPage);
        relatedTitles.add(linkedPage.frontmatter.title);
      }
    }

    const pageTitle = page.frontmatter.title;
    for (const otherPage of allPages) {
      if (otherPage.path === page.path) {
        continue;
      }

      const links = this.markdownPort.extractWikiLinks(otherPage.content);
      if (
        links.some((link) => link.toLowerCase() === pageTitle.toLowerCase())
      ) {
        if (!relatedTitles.has(otherPage.frontmatter.title)) {
          relatedPages.push(otherPage);
          relatedTitles.add(otherPage.frontmatter.title);
        }
      }
    }

    return relatedPages.slice(0, 5);
  }

  private async findPagesByType(
    type: 'entity' | 'concept' | 'source',
    namePattern?: string
  ): Promise<WikiPage[]> {
    const pages = await this.loadAllPages();

    let results = pages.filter((page) => page.frontmatter.type === type);

    if (namePattern) {
      const regex = new RegExp(namePattern, 'i');
      results = results.filter((page) => regex.test(page.frontmatter.title));
    }

    return results;
  }
}
