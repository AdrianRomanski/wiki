# Wiki Graph App

The `apps/wiki-graph/src/app` directory contains the main application architecture for the Wiki Connections Visualizer. It provides interactive visualization, search, filtering, and topological analysis of interlinked wiki markdown documents.

## Directory Structure

```text
apps/wiki-graph/src/app/
├── components/           # Component architecture (UI, Containers, Smart)
│   ├── ui/               # Pure presentation UI components (Inputs & Outputs ONLY)
│   ├── containers/       # Layout composition & wrapper container components
│   └── smart/            # State-aware smart components (Service injectors)
├── d3/                   # D3 force simulation & SVG rendering engine
├── models/               # Graph domain models & manifest types
├── services/             # Parser service & reactive Signal state management
├── app.config.ts         # Application configuration & providers
├── app.routes.ts         # Route definitions
└── README.md             # Top-level application documentation
```

## Component Architecture

1. **UI Components (`components/ui/`)**:
   - Pure presentational components receiving data strictly via `input()` signals and communicating user interactions strictly via `output()` events. No data/state services are injected.
   - Includes `GraphCanvasComponent`, `GraphToolbarUiComponent`, `NodeDetailUiComponent`.

2. **Container Components (`components/containers/`)**:
   - Structural composition components that assemble layout grids/containers, wrap UI components, and handle template rendering.
   - Includes `GraphViewportContainerComponent`.

3. **Smart Components (`components/smart/`)**:
   - State-aware orchestrators that inject data/state services (`GraphStateService`), query signals, and bind state inputs/action outputs.
   - Includes `WikiGraphPageComponent` (`smart/wiki-graph-smart/`).
