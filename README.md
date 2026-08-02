# Knowledge Wiki

👋 **Welcome to the Knowledge Wiki Workspace!**

This workspace is an Angular/Nx monorepo engineered for exploring, prototyping, and building a domain-agnostic, structured knowledge wiki around any technology stack, architectural pattern, library, or research domain. Powered by Angular 21 (standalone components & signals), D3.js, Storybook, and an automated wiki ingestion workflow, it seamlessly bridges hands-on code prototyping with a generic, highly extensible Markdown knowledge graph.

---

## 💡 What is this Repository About?

The core objective of this repository is to turn technical library research, architectural evaluations, and component experimentation into an interconnected, searchable knowledge graph for any domain. Instead of letting research findings or architectural decisions get buried in ephemeral notes, this generic wiki engine formalizes research sessions into structured Architectural Decision Records (ADRs) and ingests them directly into a Markdown knowledge vault.

### Key Highlights
- **Generic Knowledge Vault**: Fully customizable taxonomy for organizing entities, concepts, source summaries, and guides across any technical or business domain.
- **Interactive Graph Visualizer (`wiki-graph`)**: Dynamic D3.js visualizer rendering real-time interactive graph networks of entities, concepts, and research sources.
- **Prototype Playground (`libs/prototype-playground`)**: Isolated laboratory for prototyping Angular ARIA and UI patterns with full Storybook integration.
- **Automated Wiki Ingestion (`wiki-cli`)**: Clean-architecture pipeline for generating manifests, indexes, validating tags, and maintaining bidirectional cross-references.
- **AI-Native MCP Server (`wiki-mcp-server`)**: Model Context Protocol interface exposing wiki query, search, and knowledge operations directly to AI tools.

---

## 🏗️ Architecture & Project Structure

The workspace is organized into application executables, domain/infrastructure libraries, and a structured Markdown knowledge vault.

```text
               ┌────────────────────────────────────────────────────────┐
               │                User & AI Interfaces                    │
               └───────────────┬────────────────────────┬───────────────┘
                               │                        │
                    ┌──────────▼──────────┐   ┌─────────▼─────────┐
                    │  apps/wiki-graph    │   │ apps/wiki-mcp-s.. │
                    │ (D3.js Visualizer)  │   │  (AI Agent API)   │
                    └──────────┬──────────┘   └─────────┬─────────┘
                               │                        │
                               └──────────┬─────────────┘
                                          │
                               ┌──────────▼──────────┐
                               │   libs/wiki (Core)  │
                               │ Domain / App / Infra│
                               └──────────┬──────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
         ┌──────────▼──────────┐                     ┌──────────▼──────────┐
         │     wiki/ Vault     │                     │ apps/wiki-cli &     │
         │ (Entities, Concepts)│                     │ .kiro/ research     │
         └─────────────────────┘                     └─────────────────────┘
```

| Workspace Area / Layer | Location | Purpose & Role |
| --- | --- | --- |
| **Graph Application** | [`./apps/wiki-graph/`](./apps/wiki-graph/) | Standalone Angular visualizer for exploring knowledge nodes, links, and cross-references using D3.js. |
| **CLI Tooling** | [`./apps/wiki-cli/`](./apps/wiki-cli/) | Command-line application exposing Nx targets for manifest generation, index management, tag validation, and scaffolding. |
| **MCP Server** | [`./apps/wiki-mcp-server/`](./apps/wiki-mcp-server/) | Model Context Protocol server enabling AI assistants to query and interact with the knowledge graph. |
| **Prototype Playground** | [`./libs/prototype-playground/`](./libs/prototype-playground/) | Reusable library containing research prototypes, ARIA accessibility experiments, and Storybook stories. |
| **Wiki Domain System** | [`./libs/wiki/`](./libs/wiki/) | Layered Nx library architecture (Domain, Application, Infrastructure, Core Facade) handling parsing, indexing, and ADR ingestion. |
| **Knowledge Base Vault** | [`./wiki/`](./wiki/) | Markdown knowledge vault containing entities, concepts, guides, and source summaries. |

---

## 🚀 How to Use & Get Started

Follow these steps to set up and run the workspace locally.

### Prerequisites
- Node.js (v18+ recommended)
- npm (or pnpm / yarn)

### Quick Start Commands
```bash
# 1. Install dependencies
npm install

# 2. Start the primary graph visualizer application (runs on http://localhost:4300)
npm run start:graph

# 3. Launch Storybook to explore research prototypes
npx nx storybook prototype-playground
```

### Essential Dev & Build Commands
| Nx Target / Script | Command | Description |
| --- | --- | --- |
| `start:graph` | `npm run start:graph` | Starts dev server for `wiki-graph` at http://localhost:4300 |
| `build:manifest` | `npm run build:manifest` | Regenerates `wiki/manifest.json` for graph visualization |
| `build:wiki-index` | `npm run build:wiki-index` | Regenerates `wiki/index.md` indexing all entities and concepts |
| `validate:tags` | `npm run validate:tags` | Validates tag compliance across all wiki Markdown files |
| `build:mcp` | `npm run build:mcp` | Compiles production build for `wiki-mcp-server` |
| `test` | `npx nx run-many -t test` | Executes unit and integration test suites across all apps and libs |

---

## 🔄 Common Workflows & Navigation

1. **Exploring the Knowledge Graph**: Run `npm run start:graph` to inspect entities, concepts, and connection hubs in the D3 graph interface.
2. **Developing Prototypes**: Head to [`./libs/prototype-playground/`](./libs/prototype-playground/) to build standalone Angular components and review them in Storybook.
3. **Conducting Research**: Follow the research workflow in `.kiro/research/` to evaluate libraries, produce ADRs, and ingest findings into [`./wiki/`](./wiki/).
4. **Wiki Schema & Specifications**: Consult [`./WIKI_SCHEMA.md`](./WIKI_SCHEMA.md) for authoritative frontmatter schemas and [`./wiki/README.md`](./wiki/README.md) for folder structure navigation.

