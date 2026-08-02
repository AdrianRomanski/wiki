# D3 Force Renderer Engine (`apps/wiki-graph/src/app/d3`)

This directory encapsulates the D3.js interactive force-directed graph engine powering the visual topological graph for the Wiki Visualizer application. It transforms raw wiki document connections into an interactive, physics-based network diagram.

---

## 🏛️ Engine Architecture & Rendering Pipeline

- **Decoupled Simulation**: Physics calculations (charge repulsion, link attraction, collision detection) are decoupled from Angular component lifecycles for optimal performance.
- **SVG Elements Lifecycle**: D3 selection models manage SVG DOM creation, node circles, directed reference arrows, text labels, zoom viewports, and focus highlight overlays.
- **Reactivity & Highlight States**: Dynamically updates visual states (dimming non-connected nodes, highlighting direct neighbors, ghost node styling) without re-initializing force simulations.

---

## 💡 Visual Encodings & Functional Capabilities

- **Topological Layout Physics**: Dynamic force layout positioning nodes based on connection degree and link strengths, complete with collision avoidance and drag-and-drop mechanics.
- **Color-Coded Classification**:
  - **Entities** (`Orange`): Concrete tools, libraries, APIs, or objects.
  - **Concepts** (`Cyan`): Abstract principles, architectural patterns, or methodologies.
  - **Sources** (`Green`): Summarized research documents and external references.
  - **Ghost Nodes** (`Dashed Gray`): Referenced but uncreated `[[wikilink]]` targets.
- **Directed Reference Navigation**: Edge markers display directional arrows pointing from source documents to reference target documents.
- **Interactive Focus & Zoom**: Smooth viewport zooming (0.1x to 8x), canvas panning, and focus dimming that highlights active connections while softening unlinked background nodes.

---

## 📁 File Index

| File | Primary Role & Responsibility |
| --- | --- |
| [`./d3-force-renderer.ts`](./d3-force-renderer.ts) | Main engine controller coordinating simulation updates, SVG selections, and user interactions. |
| [`./force-simulation.ts`](./force-simulation.ts) | Configures D3 force simulation parameters (charge repulsion, collision radius, link distances). |
| [`./graph-svg.ts`](./graph-svg.ts) | DOM generator creating SVG groups, node circles, directed markers, and text labels. |
| [`./graph-state.ts`](./graph-state.ts) | Manages selection highlights, visual dimming opacity, and active node visibility sets. |
| [`./graph-data.ts`](./graph-data.ts) | Data adapter transforming raw graph structures into renderable simulation arrays. |
| [`./graph-style.ts`](./graph-style.ts) | Styling constants defining visual color schemes, node radii thresholds, and transition timings. |
| [`./renderer.types.ts`](./renderer.types.ts) | Internal TypeScript type aliases for D3 selections and force simulation objects. |
