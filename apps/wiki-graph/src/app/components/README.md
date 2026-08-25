# Component Subsystem (`apps/wiki-graph/src/app/components`)

This directory houses the Angular presentation components for the Wiki Visualizer and Learning Graph application, organized into a strict three-tier architecture (UI, Container, Smart) that guarantees complete separation of presentational logic, structural layouts, and reactive state management.

---

## 🏛️ Architecture & Component Design Rules

### 1. Presentation Tier (`ui/`)
- **Strict Isolation**: UI components are purely presentational views. They receive state strictly through Angular `input()` signals and communicate user interactions strictly through `output()` event emitters.
- **Zero Direct Services**: NEVER inject state management services (`GraphStateService`, `ProgressStateService`), assessment services, or storage adapters directly into UI components.

### 2. Composition & Layout Tier (`containers/`)
- **Layout & Structure**: Containers wrap presentational UI components, compose grid and overlay viewports, handle responsive positioning, and host loading or error states.

### 3. Orchestration Tier (`smart/`)
- **State & Data Aware**: Smart components serve as page orchestrators. They inject reactive state services (`GraphStateService`, `AssessmentService`, `ProgressStateService`, `StorageService`), extract active signal slices, bind state to container and UI inputs, and dispatch user actions back to state services.

---

## 💡 Functional Capabilities

- **Interactive Graph Canvas**: Renders SVG nodes, directed edges, and selection overlays while delegating force physics to the D3 rendering engine.
- **Dual-Mode Visual Toolbar**: Enables search query filtering, node classification toggling (Entities, Concepts, Sources), visualization mode switching (Wiki Taxonomy vs. Learning Graph), tag isolation, progress state filtering, hub inspection, and orphan detection.
- **Slide-Over Node Inspector**: Displays comprehensive metadata, frontmatter attributes, degree metrics, outgoing/incoming connection links, current mastery status, and an action trigger to launch knowledge assessments.
- **Interactive Knowledge Assessment Modal**: Conducts step-by-step concept evaluations with progress indicators, character count hints, keyboard submission shortcuts (`Ctrl+Enter` / `Cmd+Enter`), and retry handling.
- **Learning Progress Dashboard**: Visualizes concept mastery metrics (Mastered, Understood, In Progress, Not Started), completion percentages, and recent learning activity.

---

## 📁 File Index

| Subdirectory / Component | Component Class | Tier | Conceptual Purpose |
| --- | --- | --- | --- |
| [`./ui/graph-canvas/`](./ui/graph-canvas/) | `GraphCanvasComponent` | UI | Presentational SVG canvas container hosting the D3 simulation element. |
| [`./ui/graph-toolbar-ui/`](./ui/graph-toolbar-ui/) | `GraphToolbarUiComponent` | UI | Filter bar presenting search, type toggles, visualization mode switch, tag dropdowns, and progress filters. |
| [`./ui/node-detail-ui/`](./ui/node-detail-ui/) | `NodeDetailUiComponent` | UI | Slide-over inspector panel displaying focused node properties, connections, and assessment trigger. |
| [`./ui/assessment-dialog-ui/`](./ui/assessment-dialog-ui/) | `AssessmentDialogUiComponent` | UI | Accessible modal dialog for interactive question-and-answer knowledge assessment sessions. |
| [`./ui/progress-dashboard-ui/`](./ui/progress-dashboard-ui/) | `ProgressDashboardUiComponent` | UI | Progress overview panel summarizing concept mastery statistics, progress rings, and recent activity. |
| [`./containers/graph-viewport-container/`](./containers/graph-viewport-container/) | `GraphViewportContainerComponent` | Container | Layout composition container wrapping canvas, toolbar, node drawer, modals, and dashboard overlay. |
| [`./smart/wiki-graph-smart/`](./smart/wiki-graph-smart/) | `WikiGraphSmartComponent` | Smart | Top-level smart orchestrator injecting reactive services, coordinating assessments, and binding state signals. |

