# Component Subsystem (`apps/wiki-graph/src/app/components`)

This directory houses the Angular presentation components for the Wiki Visualizer application, organized into a strict three-tier architecture that guarantees complete separation of presentational logic, structural layouts, and reactive state management.

---

## 🏛️ Architecture & Component Design Rules

### 1. Presentation Tier (`ui/`)
- **Strict Isolation**: UI components are purely presentational views. They receive state strictly through Angular `input()` signals and communicate user interactions strictly through `output()` event emitters.
- **Zero Side Effects**: NEVER inject state management services (`GraphStateService`), data services (`WikiParserService`), or external stores directly into UI components.

### 2. Composition & Layout Tier (`containers/`)
- **Layout & Structure**: Containers wrap presentational UI components, compose grid and overlay viewports, handle responsive positioning, and host loading or error states.

### 3. Orchestration Tier (`smart/`)
- **State & Data Aware**: Smart components serve as page orchestrators. They inject reactive state services (`GraphStateService`), extract active signal slices, bind state to container and UI inputs, and dispatch user actions back to state services.

---

## 💡 Functional Capabilities

- **Interactive Graph Canvas**: Renders the SVG force simulation, nodes, links, and selection overlays while delegating physics calculations to the D3 rendering engine.
- **Visual Toolbar & Controls**: Enables search query filtering, node classification toggling (Entities, Concepts, Sources), tag isolation, hub page inspection, and isolated orphan detection.
- **Slide-Over Node Inspector**: Displays comprehensive metadata, frontmatter attributes, degree metrics, outgoing/incoming connection links, and raw markdown previews for any focused node.

---

## 📁 File Index

| Subdirectory / Component | Component Class | Tier | Conceptual Purpose |
| --- | --- | --- | --- |
| [`./ui/graph-canvas/`](./ui/graph-canvas/) | `GraphCanvasComponent` | UI | Presentational SVG canvas container hosting the D3 simulation element. |
| [`./ui/graph-toolbar-ui/`](./ui/graph-toolbar-ui/) | `GraphToolbarUiComponent` | UI | Filter bar presenting search, type toggles, tag dropdowns, and statistics. |
| [`./ui/node-detail-ui/`](./ui/node-detail-ui/) | `NodeDetailUiComponent` | UI | Slide-over inspector panel displaying focused node properties and links. |
| [`./containers/graph-viewport-container/`](./containers/graph-viewport-container/) | `GraphViewportContainerComponent` | Container | Layout composition container wrapping canvas, toolbar, overlays, and status banners. |
| [`./smart/wiki-graph-smart/`](./smart/wiki-graph-smart/) | `WikiGraphPageComponent` | Smart | Top-level route page component binding reactive signal state to presentation tiers. |
