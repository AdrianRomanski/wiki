# Wiki Visualizer App (`apps/wiki-graph`)

`wiki-graph` is the interactive web visualizer application for the LLM Wiki Knowledge Monorepo. Built as a standalone Angular application with a D3 force-directed rendering engine, it provides topological graph exploration, search, multi-criteria filtering, and detailed metadata inspection for interlinked markdown documents (`entities`, `concepts`, and `sources`).

---

## Architectural Role

`wiki-graph` serves as the **Interactive Presentation & Exploration Layer** of the monorepo architecture:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        apps/wiki-graph                                 │
│  - src/main.ts / app.routes.ts                                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Smart Components                              │  │
│  │  - WikiGraphPageComponent (Route Orchestrator)                   │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │ Injects & Binds State                │
│                                 ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Reactive State & Data Layer                      │  │
│  │  - GraphStateService (Angular Signals state & filtering)        │  │
│  │  - WikiParserService (Manifest & Markdown Parsing)              │  │
│  └──────────────┬───────────────────────────────┬───────────────────┘  │
│                 │                               │                      │
│                 ▼ Binds Data                    ▼ Fetches Static Assets│
│  ┌──────────────────────────────┐ ┌─────────────────────────────────┐  │
│  │     Containers & UI          │ │     Static Assets / Build       │  │
│  │  - Viewport Container        │ │  - wiki/manifest.json           │  │
│  │  - Canvas / Toolbar / Detail │ │  - wiki/**/*.md                 │  │
│  └──────────────┬───────────────┘ └─────────────────────────────────┘  │
│                 │ Renders SVG DOM                                      │
│                 ▼                                                      │
│  ┌──────────────────────────────┐                                      │
│  │    D3 Force Engine           │                                      │
│  │  - D3ForceRenderer           │                                      │
│  │  - Force Simulation & SVG    │                                      │
│  └──────────────────────────────┘                                      │
└────────────────────────────────────────────────────────────────────────┘
```

- **Clean Component Hierarchy**: Enforces a strict 3-tier architecture: presentational UI components (`components/ui/`), layout container components (`components/containers/`), and service-injecting smart page components (`components/smart/`).
- **Reactive Signal-Driven State**: All application state (node selection, type/tag filters, search query, visible node subsets, hub and orphan nodes) is managed reactively via Angular Signals in `GraphStateService`.
- **Decoupled Physics Engine**: Graph layout simulation, DOM rendering, zoom/pan behaviors, and visual highlight state are encapsulated within a dedicated D3 rendering engine (`d3/`).

---

## Key Capabilities & Features

- **Topological Force-Directed Layout**: Physics-based D3 simulation with collision avoidance, link strength repulsion, dynamic node radii based on connection degree, and smooth drag-and-drop node positioning.
- **Visual Encoding & Type System**:
  - Color-coded node classifications: `entity` (orange), `concept` (cyan), and `source` (green).
  - Ghost nodes rendered with dashed borders for referenced but uncreated `[[wikilink]]` pages.
  - Directed edge arrows pointing from source documents to reference targets.
- **Search & Multi-criteria Filtering**:
  - Real-time title search matching.
  - Multi-select node type toggles (`entity`, `concept`, `source`).
  - Tag filter selector for fine-grained category isolation.
  - One-click filters for top connected **hub nodes** and isolated **orphan pages** (degree 0).
- **Navigation & Detail Panel Overlay**:
  - Smooth viewport zoom (0.1x to 8x) and canvas panning controls.
  - Slide-over detail panel displaying frontmatter attributes, degree metrics, direct link connections, and raw markdown preview.
- **Accessibility & UX**:
  - Full keyboard selection support (`Enter` / `Space` to inspect nodes, `Esc` to dismiss detail panel).
  - ARIA element attributes for screen readers.
  - Visual loading states and error banner handling.

---

## Directory Structure

```text
apps/wiki-graph/
├── project.json                 # Nx project configuration & target definitions
├── eslint.config.mjs            # ESLint rules configuration
├── tsconfig.json                # TypeScript base configuration
├── tsconfig.app.json            # Application-specific TS configuration
├── tsconfig.spec.json           # Unit test TS configuration
├── README.md                    # Main application documentation
├── public/                      # Static public web assets
└── src/
    ├── index.html               # Main HTML entry document
    ├── main.ts                  # Application bootstrap entry point
    ├── styles.scss              # Global application styles & design tokens
    └── app/
        ├── app.config.ts        # Standalone app providers & router setup
        ├── app.routes.ts        # Application route definitions
        ├── app.ts               # Root component container
        ├── README.md            # App architecture documentation
        ├── components/          # Standalone component hierarchy
        │   ├── ui/              # Presentational components (Inputs & Outputs ONLY)
        │   ├── containers/      # Layout composition & wrapper containers
        │   └── smart/           # State-aware page components
        ├── d3/                  # D3 force-directed simulation & SVG renderer
        ├── models/              # Graph domain & manifest TypeScript models
        └── services/            # Parser service & reactive signal state management
```

---

## Core Modules & Engine Subsystems

### 1. Component Architecture ([`src/app/components/`](file:///home/adrian-romanski/projects/demo/wiki/apps/wiki-graph/src/app/components/README.md))

- **UI Tier (`components/ui/`)**: Pure presentation components receiving data strictly via `input()` signals and emitting actions via `output()` events. Includes `GraphCanvasComponent`, `GraphToolbarUiComponent`, and `NodeDetailUiComponent`.
- **Container Tier (`components/containers/`)**: Structural wrapper components like `GraphViewportContainerComponent` composing layout grids, overlays, and canvas wrappers.
- **Smart Tier (`components/smart/`)**: Page-level orchestrator components like `WikiGraphPageComponent` injecting state services and binding signals to template containers.

### 2. D3 Renderer Engine ([`src/app/d3/`](file:///home/adrian-romanski/projects/demo/wiki/apps/wiki-graph/src/app/d3/README.md))

- **`D3ForceRenderer`**: Coordinates graph rendering, simulation ticks, zoom/pan behaviors, and drag interactions.
- **`force-simulation.ts`**: Configures force charge, link distance, and collision forces.
- **`graph-svg.ts`**: Handles SVG element creation, node circles, edge path markers, and text labels.
- **`graph-state.ts`**: Manages node selection focus, highlight links, and dimmed background states.

### 3. Data & State Services ([`src/app/services/`](file:///home/adrian-romanski/projects/demo/wiki/apps/wiki-graph/src/app/services/README.md))

- **`WikiParserService`**: Asynchronously fetches `wiki/manifest.json` and referenced markdown files, parses frontmatter and `[[wikilink]]` syntax, and transforms content into renderable `GraphData`.
- **`GraphStateService`**: Centralized Signal store managing reactive state properties (`graphData`, `selectedNode`, `activeTypeFilters`, `searchQuery`, `activeTagFilter`, `visibleNodes`, `hubNodes`, `orphanNodes`).

### 4. Domain Models ([`src/app/models/`](file:///home/adrian-romanski/projects/demo/wiki/apps/wiki-graph/src/app/models/README.md))

- TypeScript interfaces and types for `NodeType`, `GraphNode`, `GraphEdge`, `GraphData`, `SimulationNode`, and `WikiManifest`.

---

## Build, Serve & Test Commands

Commands are executed via Nx targets from the monorepo root:

| Nx Target      | Purpose                                                          | Command                              |
| -------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `serve`        | Starts local development server with live reloading              | `npx nx run wiki-graph:serve`        |
| `build`        | Compiles production application bundle to `dist/apps/wiki-graph` | `npx nx run wiki-graph:build`        |
| `test`         | Executes unit test suite                                         | `npx nx run wiki-graph:test`         |
| `lint`         | Runs ESLint analysis across the application codebase             | `npx nx run wiki-graph:lint`         |
| `serve-static` | Serves compiled production build locally on port 4200            | `npx nx run wiki-graph:serve-static` |

### Development Workflow

1. Generate or update wiki manifest using `wiki-cli`:

   ```bash
   npx nx run wiki-cli:generate-manifest
   ```

2. Start local `wiki-graph` development server:

   ```bash
   npx nx run wiki-graph:serve
   ```

3. Open your browser and navigate to `http://localhost:4200/`.
