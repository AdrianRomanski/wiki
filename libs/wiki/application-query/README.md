# Wiki Search & Query Engine (`libs/wiki/application-query`)

`@wiki/application-query` provides application use cases for searching and retrieving wiki content by full-text matching, tag multi-filtering, page classifications, or ADR metadata attributes.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases & Query Engine
- **Core Responsibility**: Search engine orchestrator (`QueryEngine`) providing fast full-text searching, tag distribution filtering, and specialized page lookups.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: MCP Server (`apps/wiki-mcp-server`), CLI tools, workflows, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Full-Text Search (`SearchUseCase`)**: Scans title headers and document body text, returning relevance scores and contextual text excerpts.
- **Tag-Based Filtering (`SearchByTagUseCase`)**: Filters wiki pages matching single or multiple YAML frontmatter tags.
- **Categorized Retrievals**: Dedicated retrieval use cases for Entity pages, Concept pages, Source Summaries, and Architecture Decision Records.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/query-engine.ts`](./src/lib/query-engine.ts) | Centralized query orchestrator combining search and lookup use cases. |
| [`./src/lib/search.use-case.ts`](./src/lib/search.use-case.ts) | Full-text search implementation with relevance scoring and excerpts. |
| [`./src/lib/search-by-tag.use-case.ts`](./src/lib/search-by-tag.use-case.ts) | Multi-tag filter use case. |
| [`./src/lib/find-entities.use-case.ts`](./src/lib/find-entities.use-case.ts) | Retrieves all Entity pages. |
| [`./src/lib/find-concepts.use-case.ts`](./src/lib/find-concepts.use-case.ts) | Retrieves all Concept pages. |
| [`./src/lib/find-sources.use-case.ts`](./src/lib/find-sources.use-case.ts) | Retrieves all Source Summary pages. |
