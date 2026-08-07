# Wiki Graph (`apps/wiki-graph`)

An interactive 2D learning graph visualizer and AI-driven knowledge assessment application built with Angular, D3.js force-directed physics, and Signal-based reactive state.

---

## 🏛️ Architectural Role & Visual Flow

`apps/wiki-graph` serves as the primary visual interface for exploring, assessing, and tracking mastery across concepts in the knowledge wiki. It uses a clean Smart-Container-UI architecture separation to isolate state management from visual rendering.

```text
+-----------------------------------------------------------------------+
|                         Wiki Graph Application                        |
+-----------------------------------------------------------------------+
| Smart Tier (WikiGraphSmartComponent)                                  |
|  ├── Injects GraphStateService, AssessmentService, ProgressStateStore |
|  └── Coordinates State Signals, Assessment Dialogs & Storage Sync    |
+-----------------------------------------------------------------------+
| Container Tier (GraphViewportContainerComponent)                      |
|  ├── Header Toolbar (GraphToolbarUiComponent)                         |
|  ├── Visual Graph Canvas (GraphCanvasComponent -> D3 Renderer Engine) |
|  ├── Node Inspector (NodeDetailUiComponent)                           |
|  ├── Progress Dashboard (ProgressDashboardUiComponent)                |
|  └── Knowledge Assessment Modal (AssessmentDialogUiComponent)         |
+-----------------------------------------------------------------------+
```

---

## 💡 Key Capabilities & UX Features

- **Interactive Force-Directed Graph Visualization**
  - D3.js force simulation rendering concept nodes, dependencies, and structural relationships
  - Smooth pan/zoom controls, node highlight focus, and dynamic filters by domain status and tags

- **AI-Driven Knowledge Assessment Sessions**
  - Presentational dialog workflow for step-by-step concept evaluations
  - Real-time scoring advancing learner progress from *Not Started* through *In Progress*, *Understood*, to *Mastered*

- **Progress Dashboard & Accessibility**
  - Domain coverage breakdown, completion metrics, and category stats
  - Screen reader announcements for state updates via dedicated ARIA live regions

- **Resilient Persistence & Storage Adapters**
  - Persistent state backup supporting File System Access API with local storage fallbacks

---

## 📁 Subsystem & Module Map

| Subsystem | Folder | Responsibility |
| --- | --- | --- |
| **Containers** | [`./src/app/components/containers/`](./src/app/components/containers/) | Layout composition and presentational wrappers |
| **Smart Components** | [`./src/app/components/smart/`](./src/app/components/smart/) | Service injection, signal binding, and reactive state orchestration |
| **UI Components** | [`./src/app/components/ui/`](./src/app/components/ui/) | Pure presentational components receiving `input()` and emitting `output()` |
| **D3 Simulation Engine** | [`./src/app/d3/`](./src/app/d3/) | Force simulation physics, SVG DOM manipulation, and style encodings |
| **Domain Models** | [`./src/app/models/`](./src/app/models/) | Domain entities, Zod validation schemas, and constants |
| **Services & State** | [`./src/app/services/`](./src/app/services/) | Assessment workflow, graph state stores, and persistence adapters |

---

## 🚀 Build, Run & Test Targets

| Target | Command | Purpose |
| --- | --- | --- |
| `serve` | `npx nx run wiki-graph:serve` | Starts local dev server with live reload |
| `build` | `npx nx run wiki-graph:build` | Compiles production application bundle |
| `test` | `npx nx run wiki-graph:test` | Executes complete unit test suite |
