# Core Wiki Facade (`libs/wiki/core`)

`@wiki/core` is the primary public API facade for the LLM Wiki Knowledge System. It provides a unified, clean interface encapsulating all underlying domain entities, application use cases, and workflow orchestrators behind a single entry point.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Presentation / Public Facade
- **Core Responsibility**: Unified API facade providing factory functions (`createWikiSystem`), type exports, and single-import access to all generators, query engines, cross-reference analyzers, and workflow orchestrators.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-*`
- **Downstream Consumers**: Applications (`apps/wiki-cli`, `apps/wiki-mcp-server`, `apps/wiki-graph`) and consumer integrations.

---

## ⚡ Domain Capabilities

- **Unified System Factory (`createWikiSystem`)**: Instantiates and wires together all application services, use cases, and infrastructure adapters into a single cohesive `WikiSystem` instance.
- **Unified Generator Suite**: Exposes page generation use cases for Entity pages (`entities/`), Concept pages (`concepts/`), and Source Summary pages (`sources/`).
- **Comprehensive Query Engine**: Provides unified search capabilities across titles, full-text content, YAML tags, and specific document classifications.
- **Cross-Reference Management**: Detects `[[wikilink]]` targets, validates link existence, finds incoming backlinks, and suggests missing bidirectional links.
- **Workflow Orchestration**: Re-exports high-level ingestion, page update, index maintenance, and ADR ingestion workflows.

---

## 📁 Module Summary

| Module / Directory | Primary Role & Responsibility |
| --- | --- |
| [`./src/index.ts`](./src/index.ts) | Main public entry point re-exporting all facade services, factory functions, types, and domain models. |
| [`./src/lib/wiki-system.ts`](./src/lib/wiki-system.ts) | Factory implementation (`createWikiSystem`) wiring core ports to application use-case instances. |

---

## 🔄 Integration Context

Applications and external tools should import exclusively from `@wiki/core` rather than depending directly on individual `@wiki/application-*` or `@wiki/domain-*` packages. Infrastructure adapters (`@wiki/infrastructure-*`) are injected into the facade at application bootstrap.
