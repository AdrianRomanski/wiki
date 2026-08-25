---
title: "ADR-0001: Monorepo Structure & Hexagonal Architecture for Wiki Core"
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, hexagonal, ports-and-adapters, nx-monorepo, clean-architecture, wiki-core]
---

# ADR-0001: Monorepo Structure & Hexagonal Architecture for Wiki Core

## Status
**Accepted**

---

## Context & Problem Statement

The Wiki system serves as an AI-augmented developer second brain and technical knowledge management platform. It encompasses several distinct functional surfaces:
1. Automated ingestion, validation, and maintenance of markdown knowledge documents (`wiki/`).
2. Command-line tooling for indexing, tag verification, and manifest generation (`apps/wiki-cli`).
3. Interactive 2D knowledge graph visualization and mastery tracking (`apps/wiki-graph`).
4. On-demand AI assistant integration over Model Context Protocol (`apps/wiki-mcp-server`).
5. A sandbox for research prototyping and component testing (`libs/prototype-playground`).

Without a principled architectural boundary, domain logic (such as frontmatter parsing, wikilink resolution, backlink calculation, and tag validation) would become tangled with I/O drivers (Node `fs`, browser File System Access API, standard I/O) or UI frameworks.

We needed an architecture that:
- Maximizes code sharing between CLI tools, browser apps, and MCP servers.
- Isolates pure domain rules from I/O mechanisms and external libraries.
- Ensures fast, reliable unit testing without complex disk/network mocking.
- Supports future growth (e.g. cloud storage, alternative visualizers, new AI tooling).

---

## Decision Drivers

- **Domain Isolation**: Business rules regarding wiki schemas, naming conventions, and link resolution must remain agnostic of execution environments (Node.js vs. Browser).
- **Testability**: Use cases and domain models must be 100% testable in memory using fast unit tests without disk touching.
- **Portability & Reusability**: The core engine must be consumable by CLI commands, web apps, and AI servers without duplication.
- **Modular Boundaries**: Clear dependency enforcement preventing circular imports or UI-to-infrastructure leakage.
- **Open Standards**: Human-readable, durable knowledge storage using Markdown, YAML frontmatter, and `[[WikiLink]]` cross-referencing compatible with Obsidian and standard CLI search tools.

---

## Considered Options

1. **Option 1: Monolithic CLI Application with Integrated Visualizer**
   - *Pros*: Simple single-package setup.
   - *Cons*: Poor separation of concerns; browser app would struggle to share Node-dependent logic; testing requires extensive mocking.

2. **Option 2: Multi-Repository Architecture**
   - *Pros*: Completely isolated repositories.
   - *Cons*: High overhead for cross-package changes; version synchronization friction; slow development feedback loop.

3. **Option 3: Nx Monorepo with Hexagonal (Ports & Adapters) Clean Architecture (Chosen)**
   - *Pros*: Single repository with strict modular boundaries; shared TypeScript configuration and build caching; complete decoupling of domain, application, and infrastructure layers.
   - *Cons*: Higher initial setup overhead and boilerplate for ports/adapters interfaces.

---

## Decision Outcome

We decided on **Option 3: Nx Monorepo with Hexagonal Architecture**.

### 1. Monorepo Organization
- **`apps/`**: Execution targets and delivery mechanisms:
  - `apps/wiki-cli`: Node CLI driver for index generation, tag validation, and manifest creation.
  - `apps/wiki-graph`: Angular/D3.js web visualizer and knowledge assessment application.
  - `apps/wiki-mcp-server`: Stdio Model Context Protocol server exposing wiki tools to AI agents.
- **`libs/wiki/`**: Modular packages organized by architectural layer:
  - `domain-*`: Pure domain entities, value objects, and domain services. Zero dependencies.
  - `application-ports`: Inward-facing port interfaces (`FileSystemPort`, `MarkdownPort`, `FrontmatterPort`).
  - `application-*`: Application use cases (`application-index-manager`, `application-cross-reference`, `application-adr`, etc.).
  - `infrastructure-*`: Outward-facing adapters implementing ports (`infrastructure-filesystem`, `infrastructure-markdown`, `infrastructure-frontmatter`).
  - `core`: Public facade composing use cases for downstream consumers.
- **`libs/prototype-playground`**: Isolated prototyping sandbox with Storybook integration.

```text
                    ┌─────────────────────────────────────────┐
                    │     Presentation / Driver Layer         │
                    │  (apps/wiki-cli, apps/wiki-mcp-server)  │
                    │         (@wiki/core Facade)             │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                       Application Layer                         │
        │  ┌───────────────────────────────────────────────────────────┐  │
        │  │                    Port Interfaces                        │  │
        │  │   FileSystemPort    MarkdownPort    FrontmatterPort       │  │
        │  └───────────────────────────────────────────────────────────┘  │
        │                                                                 │
        │  ┌───────────────────────────────────────────────────────────┐  │
        │  │                  Use Case Services                        │  │
        │  │   GenerateIndexUseCase     GenerateManifestUseCase        │  │
        │  │   ValidateTagsUseCase      ExtractADRMetadataUseCase      │  │
        │  └───────────────────────────────────────────────────────────┘  │
        └────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │       Domain Layer (Core)       │
                        │  ┌───────────────────────────┐  │
                        │  │     Domain Entities       │  │
                        │  │  WikiPage, RawSource, ... │  │
                        │  └───────────────────────────┘  │
                        │  ┌───────────────────────────┐  │
                        │  │       Value Objects       │  │
                        │  │  WikiPageFrontmatter, ... │  │
                        │  └───────────────────────────┘  │
                        │  ┌───────────────────────────┐  │
                        │  │      Domain Services      │  │
                        │  │  Naming, Validation       │  │
                        │  └───────────────────────────┘  │
                        └─────────────────────────────────┘
                                         ▲
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                     Infrastructure Layer                        │
        │  ┌───────────────────────────────────────────────────────────┐  │
        │  │                 Adapter Implementations                   │  │
        │  │   FileSystemAdapter  →  FileSystemPort                    │  │
        │  │   MarkdownAdapter    →  MarkdownPort                      │  │
        │  │   FrontmatterAdapter →  FrontmatterPort                   │  │
        │  └───────────────────────────────────────────────────────────┘  │
        │                                                                 │
        │  ┌───────────────────────────────────────────────────────────┐  │
        │  │                 External Dependencies                     │  │
        │  │   Node.js fs/promises, gray-matter, glob                  │  │
        │  └───────────────────────────────────────────────────────────┘  │
        └─────────────────────────────────────────────────────────────────┘
```

### 2. Dependency Rules
1. **Dependencies Point Inward**: `Infrastructure` and `Application` depend on `Domain`. `Domain` never depends on anything outside itself.
2. **Ports Insulate the Core**: Application use cases only interact with abstract port interfaces, never direct file or network APIs.
3. **Pure Domain Logic**: No external npm packages or runtime dependencies inside `domain-*` packages.

---

## Consequences

### Positive
- **High Testability**: 100% of domain and application logic is testable via fast, in-memory Vitest suites using test doubles for ports.
- **Portability**: Adapters can easily be created for browser storage (File System Access API), cloud object storage (S3/GCS), or git providers without touching use cases.
- **Maintainability**: Clear module boundaries allow incremental refactoring and painless feature additions.
- **Shared Type Safety**: Full TypeScript strict mode across all applications and libraries with zero `any` types.

### Negative & Trade-offs
- **Boilerplate**: Requires defining separate port interfaces, adapter classes, and composition roots.
- **Cognitive Overhead**: Contributors must understand Hexagonal Layering conventions before contributing.

---

## Graph Relationships & Cross-References
- Implements [[Hexagonal Architecture]]
- Implements [[Clean Architecture]]
- Relates to [[Nx Monorepo]]
- Relates to [[TypeScript Strict Mode]]
