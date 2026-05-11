/**
 * Wiki MCP Server - Entry Point
 *
 * Parses CLI args/env for wiki directory path,
 * validates wiki structure, builds index, and starts the MCP server.
 *
 * Usage:
 *   node index.js --wiki-dir /path/to/wiki
 *   WIKI_DIR=/path/to/wiki node index.js
 */

import { z } from 'zod';
import { validateStructure, buildIndex } from './wiki-index';
import { handleListPages } from './tools/list-pages';
import { handleReadPage } from './tools/read-page';
import { handleSearchContent } from './tools/search-content';
import { handleResolveReferences } from './tools/resolve-references';
import { handleSearchTags } from './tools/search-tags';
import { handleListTags } from './tools/list-tags';
import { handleCreatePage } from './tools/create-page';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

function getWikiDir(): string {
  const args = process.argv.slice(2);
  const wikiDirArgIdx = args.indexOf('--wiki-dir');
  if (wikiDirArgIdx !== -1 && args[wikiDirArgIdx + 1]) {
    return args[wikiDirArgIdx + 1];
  }
  if (process.env.WIKI_DIR) {
    return process.env.WIKI_DIR;
  }
  console.error('Error: Wiki directory not specified. Use --wiki-dir <path> or set WIKI_DIR env var.');
  process.exit(1);
}

export async function main(): Promise<void> {
  const wikiDir = getWikiDir();

  const validation = validateStructure(wikiDir);
  if (!validation.valid) {
    console.error(`Error: Invalid wiki directory "${wikiDir}": ${validation.error}`);
    process.exit(1);
  }

  console.error(`Building wiki index from: ${wikiDir}`);
  const index = await buildIndex(wikiDir);
  console.error(`Indexed ${index.pages.size} pages.`);

  const server = new McpServer({ name: 'wiki-mcp-server', version: '1.0.0' });

  server.tool(
    'wiki_list_pages',
    'List wiki pages, optionally filtered by type and/or tag. Returns pages sorted alphabetically.',
    {
      type: z.enum(['entity', 'concept', 'source']).optional().describe('Filter by page type'),
      tag: z.string().optional().describe('Filter by tag (case-insensitive)'),
    },
    async (params: { type?: 'entity' | 'concept' | 'source'; tag?: string }) => {
      const result = handleListPages(index, params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_read_page',
    'Read the full content of a wiki page by title or file path. Includes frontmatter and backlinks.',
    {
      title: z.string().optional().describe('Page title to look up'),
      path: z.string().optional().describe('Relative file path (e.g. entities/angular-cdk.md)'),
    },
    async (params: { title?: string; path?: string }) => {
      const result = handleReadPage(wikiDir, index, params);
      if ('error' in result) {
        return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_search',
    'Full-text search across all wiki pages. Returns matching pages with excerpts.',
    { query: z.string().describe('Search query string') },
    async (params: { query: string }) => {
      const result = handleSearchContent(wikiDir, index, params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_resolve_references',
    'Resolve cross-references for a page: outgoing WikiLinks and incoming backlinks.',
    { title: z.string().describe('Page title to resolve references for') },
    async (params: { title: string }) => {
      const result = handleResolveReferences(index, params);
      if ('error' in result) {
        return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_search_tags',
    'Find wiki pages that have at least one of the specified tags.',
    { tags: z.array(z.string()).describe('Array of tags to search for') },
    async (params: { tags: string[] }) => {
      const result = handleSearchTags(index, params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_list_tags',
    'List all unique tags across the wiki with their page counts.',
    {},
    async () => {
      const result = handleListTags(index);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'wiki_create_page',
    'Create a new wiki page with frontmatter and content. Returns error if title already exists.',
    {
      title: z.string().describe('Page title'),
      type: z.enum(['entity', 'concept', 'source']).describe('Page type'),
      tags: z.array(z.string()).describe('Array of tags'),
      content: z.string().describe('Markdown content body'),
      sources: z.array(z.string()).optional().describe('Source references (optional)'),
      author: z.string().optional().describe('Author name (optional, for source pages)'),
      date: z.string().optional().describe('Publication date YYYY-MM-DD (optional, for source pages)'),
      url: z.string().optional().describe('Source URL (optional, for source pages)'),
    },
    async (params: {
      title: string;
      type: 'entity' | 'concept' | 'source';
      tags: string[];
      content: string;
      sources?: string[];
      author?: string;
      date?: string;
      url?: string;
    }) => {
      const result = handleCreatePage(wikiDir, index, params);
      if ('error' in result) {
        return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      }
      // Rebuild in-memory index to pick up the new page
      const newIndex = await buildIndex(wikiDir);
      index.pages.clear();
      index.backlinks.clear();
      index.tags.clear();
      for (const [k, v] of newIndex.pages) index.pages.set(k, v);
      for (const [k, v] of newIndex.backlinks) index.backlinks.set(k, v);
      for (const [k, v] of newIndex.tags) index.tags.set(k, v);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Wiki MCP Server running on stdio.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
