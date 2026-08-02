# Reactive Data & State Services (`apps/wiki-graph/src/app/services`)

This directory contains the core services responsible for fetching static wiki manifests, parsing raw markdown documents and `[[wikilink]]` references, and maintaining centralized reactive state using Angular Signals.

---

## 🏛️ Data Pipeline & Reactive State Architecture

### 1. Document Parsing & Pipeline (`WikiParserService`)
- **Parallel Manifest Fetching**: Asynchronously retrieves `wiki/manifest.json` and loads individual markdown page files concurrently.
- **Wikilink & Frontmatter Extraction**: Parses YAML metadata headers and extracts `[[wikilink]]` target strings to construct directed reference edges.
- **Graph Transformation**: Transforms raw markdown payloads into fully resolved `GraphData`, calculating incoming/outgoing degree counts, identifying ghost nodes, and aggregating unique tags.

### 2. Centralized Signal State Store (`GraphStateService`)
- **Single Source of Truth**: Manages application state using Angular Signals (`graphData`, `selectedNode`, `activeTypeFilters`, `searchQuery`, `activeTagFilter`).
- **Computed Subsets**: Derives reactive computed signals for filtered node subsets, top connected **hub pages**, and isolated **orphan pages** (degree 0) in real time.
- **State Actions**: Exposes reactive action handlers for search input changes, node selection, tag filter toggling, and reset triggers.

---

## 💡 Functional Capabilities

- **Automated Ghost Node Synthesis**: Detects uncreated wikilink targets and synthesizes placeholder ghost nodes with dashed encodings.
- **Real-Time Reactive Filtering**: Combines title search queries, multi-select node type filters (`entity`, `concept`, `source`), and tag selections seamlessly into a computed node view.
- **Hub & Orphan Analytics**: Identifies highly connected central knowledge hubs and isolated unlinked documents for targeted maintenance.

---

## 📁 File Index

| File | Conceptual & Functional Purpose |
| --- | --- |
| [`./wiki-parser.service.ts`](./wiki-parser.service.ts) | HTTP client service fetching manifests, parsing markdown frontmatter, and extracting wikilinks. |
| [`./graph-state.service.ts`](./graph-state.service.ts) | Centralized Signal state store managing graph selection, filtering, computed views, and analytics. |
| [`./wiki-parser.service.spec.ts`](./wiki-parser.service.spec.ts) | Unit test suite validating wikilink extraction, frontmatter parsing, and error handling. |
| [`./graph-state.service.spec.ts`](./graph-state.service.spec.ts) | Unit test suite verifying signal state reactivity, multi-criteria filtering, and computed signals. |
