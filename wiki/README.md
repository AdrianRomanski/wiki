# Wiki Knowledge Vault (`wiki/`)

The `wiki/` directory serves as the structured Markdown knowledge vault for the project. It stores AI-generated and human-curated knowledge pages organized into entities, concepts, and source summaries that form an interconnected graph.

---

## 📜 Specification & Single Source of Truth

> ℹ️ **System Schema Contract**: The authoritative single source of truth (SSOT) for page frontmatter requirements, strict title-based `[[WikiLink]]` conventions, and automated workflows (Ingestion, Query, Maintenance) is documented in [../WIKI_SCHEMA.md](../WIKI_SCHEMA.md).

---

## 📁 Directory Structure & Categories

| Folder / File | Purpose & Role | Example / Target Files |
| --- | --- | --- |
| [`./entities/`](./entities/) | Pages describing specific tools, libraries, APIs, or components | `angular-aria.md`, `nx.md` |
| [`./concepts/`](./concepts/) | Explanations of architectural patterns, design principles, or ideas | `hexagonal-architecture.md`, `adapters.md` |
| [`./sources/`](./sources/) | Distilled summaries and key takeaways of raw research sources | `angular-aria-big-picture-2026-05-30.md` |
| [`./guides/`](./guides/) | System guides, ingestion procedures, and workflow instructions | `adr-ingestion.md` |
| [`./progress/`](./progress/) | Concept mastery progress records (`concepts/*.json`) and vault progress index | `concepts/typescript.json`, `index.json` |
| [`./index.md`](./index.md) | Synchronized top-level wiki navigation index and vault statistics | `index.md` |
| [`./activity-log.md`](./activity-log.md) | Chronological log of wiki additions, updates, and maintenance events | `activity-log.md` |

---

## 🛠️ Git Integration & Seed Scripts

The `wiki/` directory content (except `README.md` and `.gitkeep` files) is git-ignored so developers can freely generate, experiment with, and rebuild graph content locally without dirtying version control.

### Seeding & Initializing the Knowledge Graph

You can populate, reset, or experiment with the graph using the npm initialization scripts:

```bash
# Seed the full demo knowledge graph
npm run init:all

# Generate graph manifest and index files
npm run build:manifest
npm run build:wiki-index

# Clean generated markdown files
npm run init:clean
```

#### Available Seed Scripts:
- `npm run init:frontend-libs`: Generates frontend library entity pages
- `npm run init:backend-libs`: Generates backend library entity pages
- `npm run init:testing-libs`: Generates testing tool entity pages
- `npm run init:articles-blog`: Generates blog article source summaries
- `npm run init:articles-docs`: Generates documentation article source summaries
- `npm run init:close-concepts`: Generates closely related concept nodes
- `npm run init:far-concepts`: Generates distant concept nodes
- `npm run init:cross-domain`: Establishes cross-domain relationship links

---

## 🔗 Navigation & External Tooling

- **Obsidian / Markdown Graph Tools**: Open the `wiki/` directory in Obsidian or Markdown graph viewers. Use title-based `[[WikiLink]]` syntax to navigate between nodes.
- **CLI Search**:
  ```bash
  # Search graph content using ripgrep
  rg "hexagonal architecture" wiki/
  ```

---

## 📖 Reference Links

- See [WIKI_SCHEMA.md](../WIKI_SCHEMA.md) for full frontmatter schemas, field validation rules, and automated workflow contracts.
- See [index.md](index.md) for top-level wiki navigation and vault statistics.
