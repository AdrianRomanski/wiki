# Wiki MCP Server (`apps/wiki-mcp-server`)

`wiki-mcp-server` is a standalone Model Context Protocol (MCP) server that provides AI assistants with direct tool-based access to read, query, search, resolve cross-references, and create content within the wiki knowledge base over standard I/O (Stdio).

---

## 🏛️ Unified Hexagonal Architecture

`wiki-mcp-server` aligns with the monorepo-wide Clean Architecture principles shared across `apps/wiki-cli` and `apps/wiki-graph`:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/wiki-mcp-server                            │
│  - src/index.ts (Execution Entry Point Executable)                      │
│  - src/server.ts (MCP Server Factory & Tool Registry)                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Presentation / Driver Layer                   │  │
│  │  - src/tools/*.ts (MCP Tool Composition Roots)                   │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │ Invokes Services & Models            │
│                                 ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Application Services Layer                       │  │
│  │  - WikiIndexService (Directory validation & in-memory index)     │  │
│  │  - SearchService (Full-text matching & excerpt extraction)       │  │
│  └──────────────┬───────────────────────────────┬───────────────────┘  │
│                 │ Imports Models                │ Uses Domain Logic    │
│                 ▼                               ▼                      │
│  ┌──────────────────────────────┐ ┌─────────────────────────────────┐  │
│  │         Models Layer         │ │          Domain Layer           │  │
│  │  - src/models/types.ts       │ │  - src/domain/frontmatter.ts    │  │
│  │  (Interfaces & Response DTOs)│ │  - src/domain/wikilink-parser.ts │  │
│  │                              │ │  - src/domain/filename-gen.ts   │  │
│  └──────────────────────────────┘ └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Features & Functionality

- **Model Context Protocol Integration**
  - Implements official `@modelcontextprotocol/sdk` Stdio server transport.
  - Exposes 7 strongly typed tools with Zod validation for navigating interlinked markdown documents.

- **Dynamic In-Memory Wiki Indexing**
  - Validates folder structure (`index.md`, `entities/`, `concepts/`, `sources/`).
  - Scans YAML frontmatter metadata, extracts `[[WikiLink]]` cross-references, and computes incoming backlinks and tag maps.

- **Full-Text Content & Tag Search Engine**
  - Performs case-insensitive full-text search with context excerpts across page titles and body content.
  - Enables tag distribution queries and multi-tag filtering across entity, concept, and source documents.

- **Automated Page Creation & Filename Generation**
  - Generates standardized kebab-case filenames with date suffixes for source pages.
  - Automatically appends created pages to `wiki/index.md` and dynamically rebuilds the in-memory index.

---

## 📁 Module Summary

| File / Folder                                                                  | Primary Function                                                                    |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| [`./src/index.ts`](./src/index.ts)                                             | Pure CLI entry point binary parsing arguments and launching Stdio transport.        |
| [`./src/server.ts`](./src/server.ts)                                           | MCP Server factory creating `McpServer` and registering all 7 tool schemas.         |
| [`./src/models/types.ts`](./src/models/types.ts)                               | Domain interfaces for page metadata, index state, search results, and tool outputs. |
| [`./src/domain/frontmatter.ts`](./src/domain/frontmatter.ts)                   | Frontmatter YAML parser and schema validator using gray-matter.                     |
| [`./src/domain/filename-gen.ts`](./src/domain/filename-gen.ts)                 | Kebab-case title transformer and source publication date filename generator.        |
| [`./src/domain/wikilink-parser.ts`](./src/domain/wikilink-parser.ts)           | Regex-based `[[WikiLink]]` title extractor for alias and section formats.           |
| [`./src/services/wiki-index.service.ts`](./src/services/wiki-index.service.ts) | Directory structure validator and async multi-directory index builder service.      |
| [`./src/services/search.service.ts`](./src/services/search.service.ts)         | Full-text search engine service with excerpt context extraction.                    |
| [`./src/tools/`](./src/tools/README.md)                                        | Dedicated tool handler composition roots for all 7 MCP tool definitions.            |

---

## 🚀 Execution Commands

| Target  | Command                            | Description                                                   |
| ------- | ---------------------------------- | ------------------------------------------------------------- |
| `build` | `npx nx run wiki-mcp-server:build` | Bundles application to `dist/apps/wiki-mcp-server/index.cjs`. |
| `test`  | `npx nx run wiki-mcp-server:test`  | Runs Vitest unit and integration test suite.                  |
| `debug` | `npx nx run wiki-mcp-server:debug` | Launches server inside MCP Inspector for interactive testing. |
