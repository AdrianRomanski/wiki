# Implementation Plan: Wiki MCP Server

## Overview

Implement a standalone MCP server in TypeScript that indexes a wiki directory and exposes tools for listing, reading, searching, cross-referencing, tag browsing, and content ingestion. Uses `@modelcontextprotocol/sdk` for the MCP protocol layer, `gray-matter` for frontmatter parsing, and `fast-check` + `vitest` for testing.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Create directory structure and entry point stub
    - Create `src/wiki-mcp-server/` directory with `index.ts`, `wiki-index.ts`, `wikilink-parser.ts`, `frontmatter.ts`, `search.ts`, `filename-gen.ts`
    - Create `src/wiki-mcp-server/tools/` directory with handler file stubs
    - Create `src/wiki-mcp-server/__tests__/` directory
    - Define shared TypeScript interfaces: `PageMeta`, `WikiIndex`, `ParseResult`, `SearchResult`, and tool response types
    - _Requirements: 7.1, 7.4_

  - [x] 1.2 Implement WikiLink parser
    - Implement `extractWikiLinks(content: string): string[]` that handles `[[Title]]`, `[[Title|Display]]`, and `[[Title#Section]]` forms
    - Return deduplicated array of target titles
    - _Requirements: 5.1, 3.3_

  - [ ]* 1.3 Write property test for WikiLink extraction
    - **Property 15: WikiLink extraction**
    - **Validates: Requirements 5.1, 3.3**

  - [x] 1.4 Write unit tests for WikiLink parser edge cases
    - Test nested brackets, escaped brackets, empty links, duplicate links, links with special characters
    - _Requirements: 5.1, 3.3_

- [x] 2. Implement frontmatter parsing and filename generation
  - [x] 2.1 Implement frontmatter parser
    - Wrap `gray-matter` with validation logic in `frontmatter.ts`
    - Implement `parseFrontmatter(filePath: string, rawContent: string): ParseResult`
    - Validate required fields (title, type, tags, created, updated) and optional fields (sources, author, date, url)
    - Return `{ success: false, error }` for malformed/missing frontmatter instead of throwing
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 2.2 Write property test for frontmatter round-trip
    - **Property 11: Frontmatter round-trip**
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 2.3 Write property test for malformed frontmatter resilience
    - **Property 12: Malformed frontmatter resilience**
    - **Validates: Requirements 8.2**

  - [x] 2.4 Implement filename generator
    - Implement `generateFileName(title: string, type: 'entity' | 'concept' | 'source'): string`
    - Entity/concept: convert title to kebab-case, append `.md`
    - Source: `source-{kebab-title}-{yyyy-mm-dd}.md`
    - _Requirements: 9.1, 9.5, 9.6_

  - [ ]* 2.5 Write property test for filename generation
    - **Property 13: Filename generation follows naming conventions**
    - **Validates: Requirements 9.1, 9.5, 9.6**

  - [x] 2.6 Write unit tests for filename generation edge cases
    - Test special characters, unicode, very long titles, titles with multiple spaces
    - _Requirements: 9.5, 9.6_

- [x] 3. Implement WikiIndex and structure validation
  - [x] 3.1 Implement structure validation
    - Implement `validateStructure(wikiDir: string): { valid: boolean; error?: string }` in `wiki-index.ts`
    - Check for existence of `index.md`, `entities/`, `concepts/`, `sources/` subdirectories
    - Return descriptive error message naming missing components
    - _Requirements: 1.1, 1.2_

  - [ ]* 3.2 Write property test for structure validation
    - **Property 1: Structure validation correctness**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 3.3 Implement index building
    - Implement `buildIndex(wikiDir: string): Promise<WikiIndex>` that scans entities/, concepts/, sources/ for .md files
    - Parse frontmatter for each file, skip malformed pages with warning
    - Extract WikiLinks from content to populate `outgoingLinks`
    - Build `backlinks` map (target title → source titles) and `tags` map (tag → page titles)
    - _Requirements: 1.4, 8.1, 8.2_

  - [ ]* 3.4 Write property test for index completeness
    - **Property 2: Index completeness**
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement tool handlers — listing and reading
  - [x] 5.1 Implement `wiki_list_pages` tool handler
    - Accept optional `type` and `tag` parameters
    - Filter pages from index based on parameters
    - Return results sorted alphabetically by title (case-insensitive)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 5.2 Write property tests for list filtering and sorting
    - **Property 3: List filtering correctness**
    - **Property 4: List results are sorted alphabetically**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 5.3 Implement `wiki_read_page` tool handler
    - Accept `title` or `path` parameter
    - Read full file content from disk
    - Include parsed frontmatter and backlinks from index in response
    - Return error for non-existent pages
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 5.4 Write property tests for read and backlinks
    - **Property 5: Read returns file content faithfully**
    - **Property 6: Backlink correctness**
    - **Validates: Requirements 3.1, 3.3, 5.2**

- [x] 6. Implement tool handlers — search and references
  - [x] 6.1 Implement search engine
    - Implement `searchContent(wikiDir: string, index: WikiIndex, query: string): SearchResult[]` in `search.ts`
    - Case-insensitive full-text search across page content and titles
    - Return first match excerpt (~100 chars around match) per page
    - Return empty array for no matches
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Implement `wiki_search` tool handler
    - Wire search engine to MCP tool interface
    - Return matches with title, type, filePath, excerpt, and totalMatches count
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.3 Write property test for search correctness
    - **Property 7: Search result correctness**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 6.4 Implement `wiki_resolve_references` tool handler
    - Accept page title parameter
    - Return outgoing links with exists flag from index
    - Return incoming links (backlinks) from index
    - Mark broken links (target doesn't exist) appropriately
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.5 Write property test for outgoing link resolution
    - **Property 8: Outgoing link resolution**
    - **Validates: Requirements 5.1, 5.3**

- [x] 7. Implement tool handlers — tags
  - [x] 7.1 Implement `wiki_search_tags` tool handler
    - Accept array of tags parameter
    - Return pages that have at least one matching tag
    - Include title, type, filePath, and full tag list in results
    - _Requirements: 6.1, 6.3_

  - [x] 7.2 Implement `wiki_list_tags` tool handler
    - Return all unique tags with page counts from index
    - _Requirements: 6.2_

  - [ ]* 7.3 Write property tests for tag operations
    - **Property 9: Tag search correctness**
    - **Property 10: Tag listing completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement content ingestion
  - [x] 9.1 Implement `wiki_create_page` tool handler
    - Accept title, type, tags, content, and optional sources/author/date/url
    - Check for duplicate title — return error if exists
    - Generate filename using filename generator
    - Generate valid YAML frontmatter with current date for created/updated
    - Write file to appropriate subdirectory (entities/, concepts/, sources/)
    - Update wiki/index.md with new page entry
    - Return created filePath and title
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 9.2 Write property test for duplicate title rejection
    - **Property 14: Duplicate title rejection**
    - **Validates: Requirements 9.4**

- [x] 10. Wire MCP server entry point
  - [x] 10.1 Implement CLI entry point and server setup
    - Parse wiki directory from `--wiki-dir` CLI argument or `WIKI_DIR` environment variable
    - Validate wiki structure, exit with descriptive error if invalid
    - Build index on startup
    - Create MCP Server instance with stdio transport
    - Register all 7 tools with parameter schemas and descriptions
    - Start server
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Write integration test for server startup and tool registration
    - Verify server starts with valid wiki directory
    - Verify tools are registered and callable
    - Test end-to-end: create page → list → read → search → verify cross-references
    - _Requirements: 1.3, 7.1, 7.4_

- [x] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Refactor to Nx node application
  - [x] 12.1 Install @nx/esbuild plugin
    - Run `npm install --save-dev @nx/esbuild` if not already present
    - Verify `@nx/esbuild` is available in devDependencies
    - _Requirements: 10.2_

  - [x] 12.2 Move server source to apps/wiki-mcp-server/
    - Create `apps/wiki-mcp-server/` directory
    - Move all source files from `src/wiki-mcp-server/` to `apps/wiki-mcp-server/src/`
    - Move `__tests__/` directory to `apps/wiki-mcp-server/src/__tests__/`
    - Move `tools/` directory to `apps/wiki-mcp-server/src/tools/`
    - Move `vitest.config.ts` to `apps/wiki-mcp-server/vitest.config.ts`
    - _Requirements: 10.1_

  - [x] 12.3 Create project.json with Nx targets
    - Create `apps/wiki-mcp-server/project.json` with `build` (`@nx/esbuild:esbuild`), `serve` (`@nx/js:node`), `test` (`@nx/vite:test`), and `debug` (MCP Inspector command) targets
    - Set `outputPath` to `dist/apps/wiki-mcp-server`
    - Configure esbuild `banner` option to inject `#!/usr/bin/env node` shebang
    - Set `platform: "node"`, `format: ["cjs"]`, `bundle: true`
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.10_

  - [x] 12.4 Update tsconfig files
    - Create `apps/wiki-mcp-server/tsconfig.json` extending root `tsconfig.base.json`
    - Create `apps/wiki-mcp-server/tsconfig.app.json` excluding test files
    - Remove old `src/wiki-mcp-server/tsconfig.build.json` (replaced by esbuild)
    - _Requirements: 10.2_

  - [x] 12.5 Update package.json
    - Set `"private": false`
    - Add `"bin": { "wiki-mcp-server": "./dist/apps/wiki-mcp-server/main.js" }`
    - Remove the raw `"build": "tsc -p tsconfig.build.json"` script
    - _Requirements: 10.8, 10.9_

  - [x] 12.6 Fix deprecated server.tool API
    - Update all 7 `server.tool(name, description, schema, handler)` calls in `index.ts` to the current object-form signature
    - _Requirements: 10.12_

  - [x] 12.7 Update nx.json targetDefaults
    - Add `@nx/esbuild:esbuild` cache config with `inputs` and `outputs`
    - Add `@nx/vite:test` cache config
    - _Requirements: 10.10, 10.11_

  - [x] 12.8 Verify build and test
    - Run `nx run wiki-mcp-server:build` and confirm output at `dist/apps/wiki-mcp-server/main.js`
    - Confirm shebang is present in the output file
    - Run `nx run wiki-mcp-server:test` and confirm all tests pass
    - _Requirements: 10.2, 10.4, 10.7_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (v4.7.0) and `@fast-check/vitest` (v0.4.1), both already installed
- `gray-matter` and `@modelcontextprotocol/sdk` are available as project dependencies
- Task 12 migrates the build infrastructure to Nx — existing source logic is unchanged
