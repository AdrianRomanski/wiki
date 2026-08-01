# Component Architecture (UI / Containers / Smart)

This directory implements a strict three-tier component architecture for clarity, testability, and separation of concerns.

## Architectural Layers

### 1. UI Components (`components/ui/`)
**Rule**: UI components can ONLY have `input()` signals and `output()` events. They must NEVER inject state/data services directly.

- **`GraphCanvasComponent` (`ui/graph-canvas/`)**:
  - Inputs: `graphData`, `visibleNodeIds`, `selectedNodeId`
  - Output: `nodeSelected`
- **`GraphToolbarUiComponent` (`ui/graph-toolbar-ui/`)**:
  - Inputs: `nodeTypes`, `activeTypeFilters`, `searchQuery`, `activeTagFilter`, `allTags`, `visibleNodeCount`, `visibleEdgeCount`, `orphanCount`, `hubNodes`, `toolbarVisible`
  - Outputs: `typeToggled`, `searchChanged`, `tagChanged`, `orphanHighlighted`, `hubSelected`, `refreshRequested`, `toolbarVisibilityToggled`
- **`NodeDetailUiComponent` (`ui/node-detail-ui/`)**:
  - Input: `node`
  - Output: `closed`

### 2. Container Components (`components/containers/`)
**Rule**: Container components are responsible for wrapping UI components, composing layouts, and organizing lists/containers.

- **`GraphViewportContainerComponent` (`containers/graph-viewport-container/`)**:
  - Composes the interactive graph canvas, control toolbar UI, detail panel overlay, loading state, and error banner into a responsive viewport container.

### 3. Smart Components (`components/smart/`)
**Rule**: Smart components know where data comes from. They inject state/data services (`GraphStateService`), bind reactive state to container/UI inputs, and map action outputs to service actions.

- **`WikiGraphPageComponent` (`smart/wiki-graph-smart/`)**:
  - Main page route orchestrator injecting `GraphStateService`.
