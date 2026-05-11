# Requirements Document

## Introduction

A standalone Model Context Protocol (MCP) server that exposes the wiki knowledge base for querying from any repository or project. The server provides structured access to wiki pages (entities, concepts, sources), supports full-text search, tag-based filtering, cross-reference traversal, and content ingestion — all via the MCP tool interface. It runs as an independent process configurable in any project's MCP settings.

## Glossary

- **MCP_Server**: The standalone Node.js process implementing the Model Context Protocol, exposing wiki knowledge as MCP tools and resources
- **Wiki_Page**: A markdown file with YAML frontmatter located in the `wiki/` directory, classified as entity, concept, or source
- **Frontmatter**: YAML metadata block at the top of each wiki page containing title, type, tags, created, updated, and optional fields
- **WikiLink**: A cross-reference between wiki pages using `[[Page Title]]` syntax
- **Page_Type**: Classification of a wiki page — one of: entity, concept, or source
- **Query_Result**: A structured response containing matched wiki pages with metadata and content excerpts
- **Wiki_Index**: The `wiki/index.md` file serving as the navigation hub and page registry
- **Nx_App**: An Nx-managed project registered in the Nx task graph via a `project.json` file, enabling caching, dependency tracking, and executor-based targets
- **Nx_Target**: A named task defined in `project.json` (e.g. `build`, `serve`, `test`, `debug`) that Nx can execute, cache, and chain via `dependsOn`
- **MCP_Inspector**: The `@modelcontextprotocol/inspector` CLI tool used to interactively test and debug MCP servers during local development
- **Webpack_Bundle**: A single-file JavaScript output produced by webpack, suitable for distribution and `npx` execution without requiring the host project's `node_modules`

## Requirements

### Requirement 1: Server Initialization

**User Story:** As a developer, I want to start the MCP server pointing at my wiki directory, so that I can query my knowledge base from any project.

#### Acceptance Criteria

1. WHEN the MCP_Server is started with a wiki directory path, THE MCP_Server SHALL validate that the directory contains a valid wiki structure (index.md, entities/, concepts/, sources/ subdirectories)
2. IF the provided wiki directory path does not exist or lacks required structure, THEN THE MCP_Server SHALL return a descriptive error message and refuse to start
3. THE MCP_Server SHALL communicate using the Model Context Protocol over stdio transport
4. WHEN the MCP_Server starts successfully, THE MCP_Server SHALL index all wiki pages and their frontmatter metadata into memory

### Requirement 2: List Wiki Pages

**User Story:** As a developer, I want to list available wiki pages filtered by type, so that I can discover what knowledge exists in the wiki.

#### Acceptance Criteria

1. WHEN a list request is received without filters, THE MCP_Server SHALL return all wiki pages with their title, type, tags, and file path
2. WHEN a list request includes a page type filter (entity, concept, or source), THE MCP_Server SHALL return only pages matching that type
3. WHEN a list request includes a tag filter, THE MCP_Server SHALL return only pages whose frontmatter tags contain the specified tag
4. THE MCP_Server SHALL return results sorted alphabetically by title

### Requirement 3: Read Wiki Page

**User Story:** As a developer, I want to read the full content of a specific wiki page, so that I can access detailed knowledge on a topic.

#### Acceptance Criteria

1. WHEN a read request is received with a valid page title or file path, THE MCP_Server SHALL return the full markdown content of the page including frontmatter
2. IF a read request references a page that does not exist, THEN THE MCP_Server SHALL return an error indicating the page was not found
3. WHEN a page is read, THE MCP_Server SHALL include a list of backlinks (other pages that reference this page via WikiLinks) in the response metadata

### Requirement 4: Search Wiki Content

**User Story:** As a developer, I want to search across all wiki pages by keyword, so that I can find relevant knowledge without knowing exact page names.

#### Acceptance Criteria

1. WHEN a search request is received with a query string, THE MCP_Server SHALL perform case-insensitive full-text search across all wiki page content and titles
2. THE MCP_Server SHALL return matching pages with title, type, file path, and a content excerpt showing the match context
3. WHEN multiple matches exist in a single page, THE MCP_Server SHALL return the first match excerpt for that page
4. IF no pages match the search query, THEN THE MCP_Server SHALL return an empty result set with zero matches indicated

### Requirement 5: Resolve Cross-References

**User Story:** As a developer, I want to follow cross-references between wiki pages, so that I can navigate the knowledge graph and discover related information.

#### Acceptance Criteria

1. WHEN a cross-reference resolution request is received with a page title, THE MCP_Server SHALL return all outgoing WikiLinks from that page with their target titles and whether the target page exists
2. WHEN a cross-reference resolution request is received with a page title, THE MCP_Server SHALL return all incoming WikiLinks (backlinks) pointing to that page
3. IF a WikiLink target does not correspond to an existing page, THEN THE MCP_Server SHALL mark that link as broken in the response

### Requirement 6: Search by Tags

**User Story:** As a developer, I want to search for pages by tag, so that I can find all knowledge related to a specific topic area.

#### Acceptance Criteria

1. WHEN a tag search request is received with one or more tags, THE MCP_Server SHALL return all pages whose frontmatter tags include at least one of the specified tags
2. THE MCP_Server SHALL support listing all unique tags present across the wiki with their page counts
3. THE MCP_Server SHALL return tag search results with page title, type, file path, and the full tag list for each matching page

### Requirement 7: MCP Configuration and Standalone Operation

**User Story:** As a developer, I want to configure the wiki MCP server in any project's MCP settings file, so that I can access my wiki knowledge base from different repositories.

#### Acceptance Criteria

1. THE MCP_Server SHALL be executable as a standalone Node.js script without requiring the host project's dependencies
2. THE MCP_Server SHALL accept the wiki directory path as a command-line argument or environment variable
3. WHEN configured in an MCP settings file (e.g., `.kiro/settings.json` or `mcp.json`), THE MCP_Server SHALL be launchable with a command pointing to the server entry file and the wiki path argument
4. THE MCP_Server SHALL expose its capabilities as MCP tools with clear names and parameter descriptions

### Requirement 8: Frontmatter Parsing

**User Story:** As a developer, I want the server to correctly parse wiki page metadata, so that filtering and listing operations work reliably.

#### Acceptance Criteria

1. THE MCP_Server SHALL parse YAML frontmatter from all wiki pages extracting title, type, tags, created, updated, and optional fields (sources, author, date, url)
2. IF a wiki page has malformed or missing frontmatter, THEN THE MCP_Server SHALL log a warning and exclude that page from indexed results rather than failing entirely
3. FOR ALL valid wiki pages, parsing frontmatter then serializing it back SHALL produce equivalent metadata (round-trip property)

### Requirement 9: Wiki Content Ingestion

**User Story:** As a developer, I want to add new pages to the wiki through the MCP server, so that I can capture knowledge from any project context.

#### Acceptance Criteria

1. WHEN an ingestion request is received with a title, type, tags, and content, THE MCP_Server SHALL create a new wiki page following the naming conventions defined in WIKI_SCHEMA.md
2. WHEN a new page is created, THE MCP_Server SHALL generate valid YAML frontmatter with the provided metadata and current date for created/updated fields
3. WHEN a new page is created, THE MCP_Server SHALL update the wiki index file to include the new page entry
4. IF an ingestion request specifies a title that already exists as a wiki page, THEN THE MCP_Server SHALL return an error indicating the page already exists rather than overwriting it
5. WHEN a new source page is created, THE MCP_Server SHALL use the naming convention `source-title-yyyy-mm-dd.md`
6. WHEN a new entity or concept page is created, THE MCP_Server SHALL use the naming convention `kebab-case-noun.md`

### Requirement 10: Nx Build Infrastructure

**User Story:** As a developer, I want the wiki MCP server to be structured as a proper Nx node application, so that it benefits from Nx caching, webpack bundling, and can be published and run via `npx`.

#### Acceptance Criteria

1. THE MCP_Server SHALL be located at `apps/wiki-mcp-server/` and registered in the Nx task graph via a `project.json` file
2. THE MCP_Server SHALL define a `build` Nx_Target that produces a Webpack_Bundle using the `@nx/node:application` executor or equivalent webpack-based executor
3. THE MCP_Server SHALL define a `serve` Nx_Target using the `@nx/js:node` executor with `dependsOn: ["build"]` so the server is rebuilt before each run
4. THE MCP_Server SHALL define a `test` Nx_Target wired to the existing vitest configuration, with caching enabled
5. THE MCP_Server SHALL define a `debug` Nx_Target that launches the MCP_Inspector against the built output for local interactive testing
6. WHEN the `debug` Nx_Target is invoked, THE MCP_Server SHALL use `@modelcontextprotocol/inspector` as the debug host process
7. THE Webpack_Bundle SHALL include a Unix shebang line (`#!/usr/bin/env node`) as its first line to enable direct execution
8. THE MCP_Server `package.json` SHALL include a `bin` field pointing to the Webpack_Bundle output so the server is executable via `npx`
9. THE MCP_Server `package.json` SHALL set `"private": false` to allow npm publishing
10. THE `build` Nx_Target SHALL be configured with Nx caching enabled and `inputs` scoped to the project source files
11. WHEN source files change, THE Nx_App SHALL invalidate the build cache and trigger a fresh Webpack_Bundle on the next `build` invocation
12. THE MCP_Server tool registrations SHALL use the current (non-deprecated) object-form `server.tool` call signature from `@modelcontextprotocol/sdk`
