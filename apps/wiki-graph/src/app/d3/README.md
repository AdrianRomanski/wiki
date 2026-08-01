# D3 Graph Renderer

This directory contains the D3.js interactive force-directed graph engine for the **Wiki Graph** application. It renders entities, concepts, and **sources** as an interactive node-edge network diagram.

---

## 💡 Key Features & Functionality

- **Interactive Force-Directed Layout**
  - Uses physics-based simulation (repulsion, link strength, collision avoidance).
  - Drag-and-drop nodes to explore connections interactively.
  - Dynamically sizes nodes based on their number of connections.

- **Visual Encoding & Styling**
  - **Color-coded by type**: Entities (`orange`), Concepts (`cyan`), and Sources (`green`).
  - **Ghost nodes**: Displayed with dashed borders for uncreated or referenced entities.
  - **Directed arrows**: Indicate clear reference directions between items.

- **Navigation & Exploration**
  - **Zoom & Pan**: Smooth viewport zooming (0.1x to 8x) and canvas panning.
  - **Node Highlight & Focus**: Selecting a node highlights its direct connections while dimming unrelated elements.
  - **Visibility Filtering**: Easily show or hide subsets of nodes without resetting the layout state.

- **Accessibility**
  - Full keyboard navigation support (`Enter` / `Space` to select nodes).
  - ARIA attributes on SVG elements for screen readers.

---

## 📁 Module Summary

| File | Primary Function |
| --- | --- |
| [`d3-force-renderer.ts`](./d3-force-renderer.ts) | Main entry class (`D3ForceRenderer`) coordinating rendering, simulation lifecycle, and updates. |
| [`force-simulation.ts`](./force-simulation.ts) | Configures D3 force simulation (charge, collision, links) and drag controls. |
| [`graph-svg.ts`](./graph-svg.ts) | Handles SVG DOM generation for nodes, edges, arrow markers, and zoom behaviors. |
| [`graph-state.ts`](./graph-state.ts) | Manages selection highlights, dimming effect, and visibility state updates. |
| [`graph-data.ts`](./graph-data.ts) | Filters raw graph data into renderable nodes and links. |
| [`graph-style.ts`](./graph-style.ts) | Visual constants (type color schemes, radii limits, dimming opacity). |
| [`renderer.types.ts`](./renderer.types.ts) | TypeScript type aliases for D3 selections and simulation objects. |
