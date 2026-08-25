---
title: "ADR-0003: Model Context Protocol (MCP) Server for AI Agent Integration"
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, mcp, model-context-protocol, ai-agents, stdio, tooling]
---

# ADR-0003: Model Context Protocol (MCP) Server for AI Agent Integration

## Status
**Accepted**

---

## Context & Problem Statement

Large Language Models (LLMs) and autonomous AI coding agents (such as Antigravity, Claude Desktop, Cursor, or custom subagents) excel at analyzing codebases and technical research when provided with precise, structured context.

However, interacting with a local markdown-based wiki knowledge base and ADR repository poses challenges:
- Feeding entire directories into LLM context windows is wasteful and exceeds token budgets.
- Generic filesystem grep lacks understanding of YAML frontmatter, `[[WikiLink]]` cross-references, and incoming backlinks.
- Agents generating new knowledge files or ADRs need standardized filename conventions, schema validation, and automatic index updates.

We needed a standardized, on-demand communication bridge allowing any AI client to interact with the wiki system without requiring HTTP daemon overhead or specialized plugins.

---

## Decision Drivers

- **Open Standard**: Align with the industry-standard **Model Context Protocol (MCP)** supported across modern AI tools.
- **Zero Configuration / Stdio Transport**: Standard I/O (Stdio) communication without managing open network ports, firewall rules, or persistent background daemons.
- **Type-Safe Tool Schemas**: Strong input validation via Zod schemas for all tool calls.
- **Dynamic In-Memory Indexing**: Fast sub-millisecond search, tag filtering, and backlink resolution across all wiki and ADR markdown files.
- **Autonomous Knowledge Generation**: Capabilities for agents to create well-formed pages with automated title kebab-casing and index updates.

---

## Considered Options

1. **Option 1: Ad-hoc CLI Scripts Invoked via Terminal**
   - *Pros*: Simple shell execution.
   - *Cons*: High latency per invocation; brittle JSON parsing in shell outputs; agent context thrashing; lacks structured error contracts.

2. **Option 2: Standalone HTTP/REST Daemon Server**
   - *Pros*: Familiar web protocol.
   - *Cons*: Requires managing background processes, port collision handling, CORS, and network security authentication.

3. **Option 3: Dedicated Model Context Protocol (MCP) Server over Stdio (Chosen)**
   - *Pros*: Direct JSON-RPC protocol over Stdio; native support in Claude Desktop, Antigravity, and MCP clients; automatic tool discovery with strongly typed parameters; sub-millisecond in-process query performance.
   - *Cons*: Requires Node.js runtime on host machine; stdio debugging requires MCP inspector tooling.

---

## Decision Outcome

We decided on **Option 3: Dedicated MCP Server over Stdio (`apps/wiki-mcp-server`)**.

### 1. Hexagonal Integration Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/wiki-mcp-server                            │
│  - src/index.ts (Pure CLI Entrypoint Binary over Stdio)                │
│  - src/server.ts (McpServer Factory & Tool Registry)                   │
├────────────────────────────────────────────────────────────────────────┤
│ Presentation / MCP Tool Handlers                                      │
│  - read_page          - search_content       - list_tags               │
│  - get_backlinks      - resolve_wikilink     - create_page             │
│  - get_wiki_index                                                      │
├────────────────────────────────────────────────────────────────────────┤
│ Application Services                                                   │
│  - WikiIndexService (Multi-directory index builder & backlink map)     │
│  - SearchService (Full-text search engine with excerpt extraction)     │
├────────────────────────────────────────────────────────────────────────┤
│ Domain Layer                                                           │
│  - Frontmatter Parser (gray-matter validator)                          │
│  - WikiLink Parser (Regex extractor for aliases and section links)     │
│  - Filename Generator (Kebab-case normalizer & date appender)          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Registered MCP Tools

| Tool Name | Parameters | Purpose |
|---|---|---|
| `get_wiki_index` | `none` | Returns high-level statistics, page counts, and full directory index. |
| `read_page` | `title: string` | Fetches parsed YAML frontmatter and raw Markdown content of a specific page or ADR. |
| `search_content` | `query: string, tag?: string` | Performs case-insensitive full-text search with context excerpts. |
| `list_tags` | `none` | Returns all registered tags across the system with frequency distributions. |
| `get_backlinks` | `title: string` | Computes and returns all incoming cross-references pointing to the target title. |
| `resolve_wikilink` | `wikilink: string` | Resolves standard `[[Title]]`, alias `[[Title\|Display]]`, and section `[[Title#Section]]` links. |
| `create_page` | `type, title, tags, content, ...` | Validates, generates filename, writes markdown, and dynamically rebuilds the index. |

---

## Consequences

### Positive
- **Plug-and-Play AI Connectivity**: Instant connection from any MCP-compatible environment via `node dist/apps/wiki-mcp-server/index.cjs`.
- **Accurate Grounding**: AI agents can inspect exact backlinks, tag structures, and concept definitions without hallucinations.
- **Fast Execution**: In-memory index provides instantaneous responses for search and link queries.
- **Bidirectional Collaboration**: Agents can both consume knowledge and author new entries following strict schema rules.

### Negative & Trade-offs
- **In-Memory Cache Invalidation**: Files edited externally outside the MCP tool require triggering an index reload.
- **Concurrency**: Stdio server assumes single-client connection per spawned process.

---

## Graph Relationships & Cross-References
- Relates to [[ADR-0001: Monorepo Structure & Hexagonal Architecture for Wiki Core]]
- Relates to [[ADR-0002: Interactive Knowledge Graph & Dual-Mode Learning Engine]]
- Implements [[Model Context Protocol]]
- Implements [[Clean Architecture]]
