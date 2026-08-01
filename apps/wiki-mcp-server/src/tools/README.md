# MCP Tool Handlers (`apps/wiki-mcp-server/src/tools`)

This directory contains the individual tool handlers that implement the business logic for all 7 Model Context Protocol (MCP) tools exposed by the server.

---

## 💡 Key Features & Functionality

- **Document Querying & Retrieval**
  - Enables listing documents by type (`entity`, `concept`, `source`) or tag with alphabetical sorting.
  - Retrieves full page markdown content along with parsed frontmatter metadata and incoming backlinks.

- **Knowledge Graph Reference Resolution**
  - Resolves cross-references for any page, distinguishing existing vs broken outgoing links and mapping incoming backlinks.

- **Content Creation & Re-Indexing**
  - Handles automated file creation with formatted frontmatter and kebab-case filenames.
  - Automatically updates `wiki/index.md` and rebuilds the server's in-memory index upon page creation.

---

## 📁 Module Summary

| File | Primary Function |
| --- | --- |
| [`./list-pages.ts`](./list-pages.ts) | Implements `wiki_list_pages` tool to list pages filtered by type and tag. |
| [`./read-page.ts`](./read-page.ts) | Implements `wiki_read_page` tool to fetch document body, frontmatter, and backlinks. |
| [`./search-content.ts`](./search-content.ts) | Implements `wiki_search` tool for full-text search across document contents. |
| [`./resolve-references.ts`](./resolve-references.ts) | Implements `wiki_resolve_references` tool to map incoming and outgoing links. |
| [`./search-tags.ts`](./search-tags.ts) | Implements `wiki_search_tags` tool to find pages matching specified tags. |
| [`./list-tags.ts`](./list-tags.ts) | Implements `wiki_list_tags` tool to list all unique tags and page counts. |
| [`./create-page.ts`](./create-page.ts) | Implements `wiki_create_page` tool to write new markdown files and update index. |
