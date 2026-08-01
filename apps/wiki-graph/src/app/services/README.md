# Graph Services

This directory contains services managing data fetching, frontmatter/wikilink parsing, and reactive state.

## Services Overview

### `WikiParserService` (`wiki-parser.service.ts`)
Handles network operations and document parsing:
- Fetches `wiki/manifest.json` and referenced `.md` files in parallel.
- `extractWikilinks()`: Helper function for parsing `[[wikilink]]` target titles.
- `parseFilesToGraphData()`: Pure transformation function constructing nodes, edges, ghost nodes, degree counts, and aggregated tags.
- Provides robust error handling for missing manifests or invalid file formats.

### `GraphStateService` (`graph-state.service.ts`)
Provides centralized Signal-based state management:
- `graphData`: Readonly signal containing current `GraphData`.
- `selectedNode`: Readonly signal of currently focused node.
- `activeTypeFilters`: Readonly set of active `NodeType` filters.
- `searchQuery`: Search string signal for title matching.
- `activeTagFilter`: Selected tag filter signal.
- `visibleNodes`: Computed signal producing node subsets after applying active filters.
- `hubNodes`: Computed signal identifying top connected hub pages.
- `orphanNodes`: Computed signal identifying isolated pages (degree 0).

## Unit Tests
- `wiki-parser.service.spec.ts`: Tests for wikilink extraction, frontmatter parsing, ghost node handling, and HttpClient operations.
- `graph-state.service.spec.ts`: Tests for state transitions, signal reactivity, combined filtering logic, and hub/orphan calculations.
