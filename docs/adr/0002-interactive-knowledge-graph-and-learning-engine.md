---
title: "ADR-0002: Interactive Knowledge Graph & Dual-Mode Learning Engine"
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, angular, signals, d3, knowledge-graph, learning-system, smart-container-ui]
---

# ADR-0002: Interactive Knowledge Graph & Dual-Mode Learning Engine

## Status
**Accepted**

---

## Context & Problem Statement

Technical knowledge bases often suffer from discovery paralysis: markdown files organized in flat or nested folders become difficult to navigate, cross-connections are invisible, and a learner cannot easily assess their depth of mastery over complex interrelated topics.

We needed a web-based visual interface (`apps/wiki-graph`) that:
1. Renders the knowledge network dynamically using interactive force-directed physics.
2. Distinguishes structural content categories (Entities, Concepts, Sources, and ADRs).
3. Provides an active learning and assessment workflow allowing engineers to evaluate and track their comprehension over time.
4. Maintains clean component boundaries following Angular standalone and Signal-based reactive state principles.

---

## Decision Drivers

- **Visual Clarity & Exploration**: Interactive 2D graph with pan/zoom, physics stabilization, dynamic filtering, and tag exploration.
- **Dual Perspective**: Ability to switch seamlessly between **Taxonomy View** (structural knowledge relationships) and **Learning Graph View** (mastery progress).
- **Separation of Concerns (Smart-Container-UI)**: Strict component layering so presentational components remain pure and reusable while smart services handle state and storage synchronization.
- **Strict Scope Separation for ADRs**: Architectural Decision Records (ADRs) must be fully visible and navigable in the Taxonomy View to display architectural context, but excluded from the active Learning/Assessment engine (which focuses on conceptual mastery).
- **Local-First & Offline Resilience**: Local storage and File System Access API support for progress tracking without mandatory cloud backends.

---

## Considered Options

1. **Option 1: Static HTML/Markdown Documentation Site (e.g. MkDocs, Docusaurus)**
   - *Pros*: Simple to build and deploy.
   - *Cons*: Static page hierarchy; lacks live interactive graph exploration; no built-in spaced repetition or active assessment workflows.

2. **Option 2: Third-Party Graph Visualization Library (e.g., Cytoscape.js, vis.js, React-Force-Graph)**
   - *Pros*: Off-the-shelf graph physics.
   - *Cons*: Heavy bundle size; rigid styling models; awkward integration with Angular Signals and custom SVG accessibility semantics.

3. **Option 3: Custom Angular Standalone Application with D3.js Force Simulation & Signals (Chosen)**
   - *Pros*: Direct control over D3 force physics and SVG rendering; tight integration with Angular 19+ Signals (`computed`, `signal`); zero NgModule overhead; complete control over accessible ARIA attributes and custom layout animations.
   - *Cons*: Requires building custom force rendering and simulation management logic.

---

## Decision Outcome

We decided on **Option 3: Custom Angular Standalone Application with D3.js and Signals**.

### 1. Architectural Tiers (Smart - Container - UI)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Wiki Graph Application Architecture                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. Smart Layer (WikiGraphSmartComponent)                                │
│    - Injects GraphStateService, ProgressStateService, AssessmentService │
│    - Coordinates Signal state, assessment modals & storage sync         │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. Container Layer (GraphViewportContainerComponent)                    │
│    - Orchestrates layout, sidebar drawers, and toolbar bindings         │
│    - Delegates user actions upward to Smart layer                       │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. UI Layer (Pure Presentational Components)                            │
│    - GraphToolbarUiComponent (Search, filters, view mode toggle)        │
│    - GraphCanvasComponent (D3 force-directed SVG canvas)                │
│    - NodeDetailUiComponent (Inspector sidebar & backlink navigator)     │
│    - ProgressDashboardUiComponent (Mastery statistics & domain metrics) │
│    - AssessmentDialogUiComponent (Interactive concept quiz modal)       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Dual Visualization Modes

| Mode | Node Color & Encoding | Target Scope | Purpose |
|---|---|---|---|
| **Wiki Taxonomy** | Entity (`#F5A623`), Concept (`#00BCD4`), Source (`#50C878`), ADR (`#A855F7`) | All Wiki Pages & ADRs | Structural exploration, architectural context, cross-link discovery |
| **Learning Graph** | Not Started (`#94a3b8`), In Progress (`#38bdf8`), Understood (`#34d399`), Mastered (`#a78bfa`) | Concept Pages Only | Knowledge evaluation, mastery tracking, self-assessment |

### 3. D3 Physics Simulation Engine
- Managed by `ForceSimulationService` and `D3ForceRenderer`.
- Uses `d3.forceManyBody()`, `d3.forceLink()`, `d3.forceCollide()`, and `d3.forceCenter()`.
- Signal-driven filters dynamically adjust simulation node alpha and trigger smooth transitions.

---

## Consequences

### Positive
- **Instantaneous Reactivity**: Angular Signals provide fine-grained reactivity without Zone.js overhead or unnecessary change detection cycles.
- **Rich User Experience**: Fluid physics, customizable zoom/pan, visual node clustering, and instant filtering by tag or type.
- **Effective Learning Loop**: Self-contained assessment workflow enabling targeted knowledge reinforcement directly from the graph.
- **Architectural Visibility**: ADRs appear naturally in the taxonomy graph connected to the libraries (`[[Entity]]`) and patterns (`[[Concept]]`) they govern.

### Negative & Trade-offs
- **Rendering Performance at Scale**: Large graphs (>2,000 nodes) in SVG can experience frame drops; may require Canvas or WebGL fallback in the future if the wiki scales dramatically.
- **Custom D3 Lifecycle Management**: Requires careful lifecycle synchronization between Angular DOM hooks (`afterNextRender`, `effect`) and D3 simulation ticks.

---

## Graph Relationships & Cross-References
- Relates to [[ADR-0001: Monorepo Structure & Hexagonal Architecture for Wiki Core]]
- Implements [[D3 Force Simulation]]
- Implements [[Angular Signals]]
- Implements [[Smart-Container-UI Pattern]]
