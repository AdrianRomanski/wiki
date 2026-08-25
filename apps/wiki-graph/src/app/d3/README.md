# D3 Force Renderer Engine (`apps/wiki-graph/src/app/d3`)

This directory encapsulates the D3.js interactive force-directed graph engine powering the visual topological graph for the Wiki Visualizer and Learning Graph application. It transforms raw wiki document connections into an interactive, physics-based network diagram with dual visualization modes.

---

## 🏛️ Engine Architecture & Rendering Pipeline

- **Decoupled Simulation**: Physics calculations (charge repulsion, link attraction, collision detection) are decoupled from Angular component lifecycles for high-fps rendering performance.
- **SVG Elements Lifecycle**: D3 selection models manage SVG DOM creation, node circles, directed reference arrows, text labels, zoom viewports, and focus highlight overlays.
- **Dual Visualization Modes**: Dynamically recolors and restyles graph nodes based on active visualization mode:
  - **Wiki Taxonomy Mode**: Colors nodes by document classification (Entity, Concept, Source).
  - **Learning Graph Mode**: Colors nodes by user mastery progress state (Mastered, Understood, In Progress, Not Started).
- **Reactivity & Highlight States**: Dynamically updates visual states (dimming non-connected nodes, highlighting direct neighbors, ghost node styling) without re-initializing force simulations.

---

## 💡 Visual Encodings & Functional Capabilities

- **Topological Layout Physics**: Dynamic force layout positioning nodes based on connection degree and link strengths, complete with collision avoidance and drag-and-drop mechanics.
- **Dual Mode Color Encodings**:
  - **Wiki Taxonomy Mode**:
    - **Entities** (`Orange` / `#f97316`): Concrete tools, libraries, APIs, or objects.
    - **Concepts** (`Cyan` / `#06b6d4`): Abstract principles, architectural patterns, or methodologies.
    - **Sources** (`Green` / `#22c55e`): Summarized research documents and external references.
    - **Ghost Nodes** (`Dashed Gray`): Referenced but uncreated `[[wikilink]]` targets.
  - **Learning Graph Mode**:
    - **Mastered** (`Emerald Green` / `#10b981`): Thoroughly understood with verified assessment history.
    - **Understood** (`Blue` / `#3b82f6`): Good conceptual grasp with completed evaluations.
    - **In Progress** (`Amber` / `#f59e0b`): Active learning or partially assessed concept.
    - **Not Started** (`Slate Gray` / `#6b7280`): Unvisited or unassessed concept node.
- **Directed Reference Navigation**: Edge markers display directional arrows pointing from source documents to reference target documents.
- **Interactive Focus & Zoom**: Smooth viewport zooming (0.1x to 8x), canvas panning, and focus dimming that highlights active connections while softening unlinked background nodes.

---

## 📁 File Index

| File | Primary Role & Responsibility |
| --- | --- |
| [`./d3-force-renderer.ts`](./d3-force-renderer.ts) | Main engine controller coordinating simulation updates, SVG selections, and user interactions. |
| [`./force-simulation.ts`](./force-simulation.ts) | Configures D3 force simulation parameters (charge repulsion, collision radius, link distances). |
| [`./graph-svg.ts`](./graph-svg.ts) | DOM generator creating SVG groups, node circles, directed markers, and text labels. |
| [`./graph-state.ts`](./graph-state.ts) | Manages selection highlights, visual dimming opacity, visualization mode, and active node visibility sets. |
| [`./graph-data.ts`](./graph-data.ts) | Data adapter transforming raw graph structures into renderable simulation arrays. |
| [`./graph-style.ts`](./graph-style.ts) | Styling constants defining visual color schemes, node radii thresholds, and transition timings. |
| [`./renderer.types.ts`](./renderer.types.ts) | Internal TypeScript type aliases for D3 selections and force simulation objects. |
| [`./d3-force-renderer.spec.ts`](./d3-force-renderer.spec.ts) | Unit tests verifying renderer initialization, node creation, and interaction delegates. |
| [`./force-simulation.spec.ts`](./force-simulation.spec.ts) | Unit tests verifying force physics configuration, collision parameters, and simulation events. |
| [`./graph-state.spec.ts`](./graph-state.spec.ts) | Unit tests verifying highlight state calculations, mode changes, and filter evaluations. |
| [`./graph-svg.spec.ts`](./graph-svg.spec.ts) | Unit tests verifying SVG markup generation, marker definitions, and label positioning. |

