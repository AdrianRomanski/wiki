# Wiki MCP Server Source Core (`apps/wiki-mcp-server/src`)

This directory houses the core application logic, domain data structures, search engines, markdown parsing utilities, and MCP tool routers for the Wiki MCP Server organized into clean architectural layers.

---

## 💡 Key Features & Functionality

- **Application Composition & Stdio Transport**
  - **`./index.ts`**: Pure execution entry point parsing CLI/environment arguments and initializing Stdio transport.
  - **`./server.ts`**: MCP Server factory function (`createMcpServer`) declaring Zod tool schemas and routing calls to tool handlers.

- **Layered Clean Architecture & Co-located Specs**
  - **Models Layer (`./models/`)**: Defines type contracts for `PageMeta`, `WikiIndex`, `SearchResult`, and tool response structures.
  - **Domain Layer (`./domain/`)**: Pure parsing utilities (`frontmatter.ts`, `wikilink-parser.ts`, `filename-gen.ts`) with co-located unit tests (`*.spec.ts`).
  - **Services Layer (`./services/`)**: Async stateful services (`wiki-index.service.ts`, `search.service.ts`) with co-located service tests (`*.spec.ts`).
  - **Tools Layer (`./tools/`)**: Driver composition roots for all 7 MCP tool handlers with co-located tool tests (`*.spec.ts`).

---

## 📁 Module Summary

| File / Folder | Primary Function |
| --- | --- |
| [`./index.ts`](./index.ts) | Pure CLI entry point binary parsing arguments and launching Stdio transport. |
| [`./server.ts`](./server.ts) | MCP Server factory creating `McpServer` and registering all 7 tool schemas. |
| [`./models/types.ts`](./models/types.ts) | Core TypeScript interfaces and tool result type contracts. |
| [`./domain/frontmatter.ts`](./domain/frontmatter.ts) | YAML frontmatter extractor and field validator using `gray-matter`. |
| [`./domain/filename-gen.ts`](./domain/filename-gen.ts) | Filename generator for kebab-case titles and source document dates. |
| [`./domain/wikilink-parser.ts`](./domain/wikilink-parser.ts) | Regex-based parser for extracting deduplicated WikiLink targets. |
| [`./services/wiki-index.service.ts`](./services/wiki-index.service.ts) | Directory structure validator and in-memory index scanner service. |
| [`./services/search.service.ts`](./services/search.service.ts) | Search engine service providing case-insensitive matching and excerpts. |
| [`./tools/`](./tools/README.md) | Handler functions executing business logic for individual MCP tool calls. |
