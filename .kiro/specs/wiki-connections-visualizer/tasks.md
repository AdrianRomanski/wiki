# Implementation Plan: Wiki Connections Visualizer

## Overview

Implement the `/wiki-graph` route in `apps/deep-dive-angular-aria` as an interactive force-directed knowledge graph. The work proceeds in six phases: infrastructure setup, data models, services, Angular components, D3 rendering, and tests. Each phase builds directly on the previous one.

## Tasks

- [x] 1. Infrastructure setup
  - Install `d3` and `@types/d3` as dependencies in the workspace root `package.json`
  - Verify `gray-matter` is already installed (used by `wiki-mcp-server`); install it at the workspace root if absent
  - Add a `scripts/generate-wiki-manifest.mjs` Node.js script that scans `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/` for `.md` files and writes `wiki/manifest.json` with the `WikiManifest` shape (`files`, `generatedAt`)
  - Add a `wiki:manifest` npm script to the root `package.json` that runs `node scripts/generate-wiki-manifest.mjs`
  - Update `apps/deep-dive-angular-aria/project.json` `build.options.assets` to include `{ "glob": "**/*", "input": "wiki", "output": "wiki" }` so the `wiki/` directory is served as static assets
  - _Requirements: 1.1, 6.1_

- [x] 2. Data models
  - Create `apps/deep-dive-angular-aria/src/app/wiki-graph/models/graph.models.ts` with all TypeScript types: `NodeType`, `GraphNode`, `GraphEdge`, `GraphData`, `SimulationNode`, `WikiManifest`
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 3. WikiParserService
  - [x] 3.1 Implement `WikiParserService` in `apps/deep-dive-angular-aria/src/app/wiki-graph/services/wiki-parser.service.ts`
    - Inject `HttpClient`; implement `loadGraph(): Observable<GraphData>`
    - Fetch `wiki/manifest.json`, then fetch all `.md` files in parallel with `forkJoin`
    - Parse frontmatter with `gray-matter` to extract `title`, `type`, `tags`; skip files with invalid/missing frontmatter (log warning)
    - Extract `[[wikilink]]` targets from content body using a regex; strip display text (`|`) and section anchors (`#`); deduplicate per page
    - Build `GraphData`: populate `nodes` Map, create ghost nodes for missing link targets, build `edges` array, compute `inDegree`/`outDegree` on each node, collect `allTags`
    - Handle 404 on manifest with a descriptive error; log warnings for individual file fetch failures and continue
    - Use `switchMap` so a refresh cancels any in-flight request
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 6.3, 6.4_

  - [ ]* 3.2 Write property test for wikilink extraction (Property 1)
    - **Property 1: Wikilink extraction round-trip completeness**
    - **Validates: Requirements 1.4, 1.6, 1.7**
    - File: `apps/deep-dive-angular-aria/src/app/wiki-graph/services/wiki-parser.service.spec.ts`
    - Tag: `Feature: wiki-connections-visualizer, Property 1: wikilink extraction round-trip completeness`

  - [ ]* 3.3 Write property test for ghost node creation (Property 2)
    - **Property 2: Ghost node creation for broken links**
    - **Validates: Requirements 1.5**
    - Tag: `Feature: wiki-connections-visualizer, Property 2: ghost node creation for broken links`

  - [ ]* 3.4 Write property test for node count (Property 3)
    - **Property 3: Graph node count equals unique page titles**
    - **Validates: Requirements 1.2, 1.5**
    - Tag: `Feature: wiki-connections-visualizer, Property 3: graph node count equals unique page titles`

  - [ ]* 3.5 Write property test for edge deduplication (Property 4)
    - **Property 4: Edge deduplication**
    - **Validates: Requirements 1.7**
    - Tag: `Feature: wiki-connections-visualizer, Property 4: edge deduplication`

  - [ ]* 3.6 Write property test for degree consistency (Property 5)
    - **Property 5: Degree consistency**
    - **Validates: Requirements 1.4, 1.8**
    - Tag: `Feature: wiki-connections-visualizer, Property 5: degree consistency`

  - [x] 3.7 Write unit tests for WikiParserService
    - Mock `HttpClient`; test graph construction from fixture markdown strings
    - Test error handling: 404 manifest, individual file failure, missing frontmatter
    - _Requirements: 1.1–1.8, 6.3, 6.4_

- [x] 4. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. GraphStateService
  - [x] 5.1 Implement `GraphStateService` in `apps/deep-dive-angular-aria/src/app/wiki-graph/services/graph-state.service.ts`
    - Inject `WikiParserService`; implement all signals: `graphData`, `selectedNode`, `activeTypeFilters`, `searchQuery`, `activeTagFilter`, `isLoading`, `error`
    - Implement derived signals: `visibleNodes` (filtered by active type filters, search query, and tag filter), `hubNodes` (top 5 by `inDegree + outDegree` descending), `orphanNodes` (`inDegree === 0 && outDegree === 0`)
    - Implement actions: `loadGraph()`, `selectNode()`, `setTypeFilter()`, `setSearchQuery()`, `setTagFilter()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 5.1, 5.2, 6.1, 6.2_

  - [ ]* 5.2 Write property test for type filter (Property 6)
    - **Property 6: Type filter preserves visible node invariant**
    - **Validates: Requirements 4.1, 4.2**
    - File: `apps/deep-dive-angular-aria/src/app/wiki-graph/services/graph-state.service.spec.ts`
    - Tag: `Feature: wiki-connections-visualizer, Property 6: type filter preserves visible node invariant`

  - [ ]* 5.3 Write property test for search filter (Property 7)
    - **Property 7: Search filter correctness**
    - **Validates: Requirements 4.3, 4.4**
    - Tag: `Feature: wiki-connections-visualizer, Property 7: search filter correctness`

  - [ ]* 5.4 Write property test for tag filter (Property 8)
    - **Property 8: Tag filter correctness**
    - **Validates: Requirements 4.6, 4.7**
    - Tag: `Feature: wiki-connections-visualizer, Property 8: tag filter correctness`

  - [ ]* 5.5 Write property test for hub node ordering (Property 9)
    - **Property 9: Hub node ordering**
    - **Validates: Requirements 5.2**
    - Tag: `Feature: wiki-connections-visualizer, Property 9: hub node ordering`

  - [ ]* 5.6 Write property test for orphan node identification (Property 10)
    - **Property 10: Orphan node identification**
    - **Validates: Requirements 5.1, 5.4**
    - Tag: `Feature: wiki-connections-visualizer, Property 10: orphan node identification`

  - [x] 5.7 Write unit tests for GraphStateService
    - Test derived signal computations: hub ordering, orphan detection, filter combinations
    - Test `loadGraph()` sets `isLoading` and clears `error` on success
    - _Requirements: 4.1–4.7, 5.1–5.5_

- [ ] 6. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Angular components
  - [x] 7.1 Create `GraphControlsComponent` in `apps/deep-dive-angular-aria/src/app/wiki-graph/components/graph-controls/`
    - Standalone component; inject `GraphStateService`
    - Render type toggle buttons (entity/concept/source) bound to `activeTypeFilters` signal; call `setTypeFilter()` on toggle
    - Render search `<input>` bound to `searchQuery` signal; call `setSearchQuery()` on input
    - Render tag filter `<select>` populated from `graphData().allTags`; call `setTagFilter()` on change
    - Render "Refresh" `<button>` that calls `loadGraph()`
    - All controls have ARIA labels; meet WCAG 2.1 AA contrast
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.8, 6.1_

  - [x] 7.2 Create `NodeDetailPanelComponent` in `apps/deep-dive-angular-aria/src/app/wiki-graph/components/node-detail-panel/`
    - Standalone component; inject `GraphStateService`; reads `selectedNode` signal
    - Display title, type, tags, outgoing link count, incoming link count
    - Show ghost indicator when `selectedNode().isGhost` is true
    - Use `role="region"` with `aria-label`; receive focus when a node is selected; dismiss on Escape key (calls `selectNode(null)`)
    - _Requirements: 3.2, 3.5, 3.6_

  - [x] 7.3 Create `GraphSummaryPanelComponent` in `apps/deep-dive-angular-aria/src/app/wiki-graph/components/graph-summary-panel/`
    - Standalone component; inject `GraphStateService`; reads `hubNodes`, `orphanNodes`, `graphData` signals
    - Display total node count, total edge count, orphan count (clickable — calls `selectNode` for each orphan highlight), and top-5 hub nodes as a `<ul>` of `<button>` items
    - Clicking a hub node calls `selectNode(node.id)`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.4 Create `GraphCanvasComponent` in `apps/deep-dive-angular-aria/src/app/wiki-graph/components/graph-canvas/`
    - Standalone component with `<svg>` element accessed via `ElementRef`
    - Inputs: `graphData: GraphData`, `visibleNodeIds: Set<string>`, `selectedNodeId: string | null`
    - Output: `nodeSelected = new EventEmitter<string | null>()`
    - Instantiate `D3ForceRenderer` in `ngOnInit`; call `renderer.render()` in `ngOnChanges` when `graphData` or `visibleNodeIds` change; call `renderer.updateSelection()` when `selectedNodeId` changes; call `renderer.destroy()` in `ngOnDestroy`
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8_

  - [x] 7.5 Create `WikiGraphPageComponent` in `apps/deep-dive-angular-aria/src/app/wiki-graph/`
    - Standalone route component; inject `GraphStateService`; call `loadGraph()` in `ngOnInit`
    - Compose `GraphControlsComponent`, `GraphCanvasComponent`, `NodeDetailPanelComponent`, `GraphSummaryPanelComponent`
    - Pass `visibleNodes` IDs and `selectedNode` ID from signals into `GraphCanvasComponent` inputs
    - Handle `nodeSelected` output by calling `graphStateService.selectNode()`
    - Show loading indicator when `isLoading()` is true; show error banner when `error()` is non-null
    - _Requirements: 2.1, 3.1, 3.4, 6.1, 6.4_

  - [x] 7.6 Register the `/wiki-graph` route
    - Add lazy-loaded route for `WikiGraphPageComponent` to `apps/deep-dive-angular-aria/src/app/app.routes.ts`
    - Ensure `HttpClient` is provided in `apps/deep-dive-angular-aria/src/app/app.config.ts` via `provideHttpClient()`
    - _Requirements: 2.1_

- [x] 8. D3ForceRenderer
  - Implement `D3ForceRenderer` as a plain TypeScript class in `apps/deep-dive-angular-aria/src/app/wiki-graph/d3/d3-force-renderer.ts`
  - Constructor accepts `SVGElement` and `onNodeClick: (id: string | null) => void`
  - `render(data: GraphData, visibleNodeIds: Set<string>)`: initialize `d3.forceSimulation` with `forceLink`, `forceManyBody`, `forceCenter`; render `<line>` edges and `<circle>` + `<text>` node groups; apply visual encoding (color by type, radius by degree, ghost style)
  - `updateSelection(selectedId: string | null)`: apply selected stroke ring; dim unconnected nodes/edges to 15% opacity; restore default state when `null`
  - `updateVisibility(visibleNodeIds: Set<string>)`: show/hide nodes and their connected edges based on the set
  - Attach `d3.zoom` to the SVG for pan/zoom; attach drag behavior to nodes; call `onNodeClick` on node click and on background click
  - `destroy()`: stop simulation, remove all event listeners
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.3_

- [x] 9. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integration tests for WikiGraphPageComponent
  - [ ]* 10.1 Write integration tests for WikiGraphPageComponent
    - File: `apps/deep-dive-angular-aria/src/app/wiki-graph/wiki-graph-page.component.spec.ts`
    - Render with mock `GraphStateService`; verify `GraphControlsComponent`, `GraphCanvasComponent`, `NodeDetailPanelComponent`, `GraphSummaryPanelComponent` are present in the DOM
    - Test node selection flow: emit `nodeSelected` from canvas → detail panel shows correct title/type/tags
    - Test Escape key deselects node and restores default state
    - Test Refresh button triggers `loadGraph()`
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 6.1_

- [x] 11. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` + `@fast-check/vitest` (already installed); run a minimum of 100 iterations each
- All components are standalone (Angular 21); use signals for reactive state throughout
- D3 owns the SVG DOM entirely — Angular components never manipulate SVG nodes directly
- Run `npm run wiki:manifest` before starting the dev server to generate `wiki/manifest.json`
