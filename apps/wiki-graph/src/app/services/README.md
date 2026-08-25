# Reactive Data, State & Persistence Services (`apps/wiki-graph/src/app/services`)

This directory contains the core services responsible for fetching wiki manifests, building the directed knowledge graph, orchestrating AI-driven knowledge assessments, maintaining reactive Signal stores, and persisting learner progress via the browser File System Access API.

---

## 🏛️ System Architecture & Service Responsibilities

### 1. Document Parsing & Graph Assembly (`WikiParserService`)
- **Parallel Manifest Fetching**: Concurrently retrieves `wiki/manifest.json` and associated markdown page files.
- **Wikilink & Frontmatter Extraction**: Parses YAML metadata headers and extracts `[[wikilink]]` target strings to construct directed reference edges.
- **Graph Transformation**: Transforms raw markdown payloads into fully resolved `GraphData`, calculating incoming/outgoing degree counts, identifying ghost nodes, and aggregating unique tags.

### 2. Centralized Graph Signal Store (`GraphStateService`)
- **Single Source of Truth**: Manages visual graph state using Angular Signals (`graphData`, `selectedNode`, `activeTypeFilters`, `searchQuery`, `activeTagFilter`, `visualizationMode`, `activeProgressFilters`).
- **Dual Visualization Modes**: Supports toggling between standard **Wiki Taxonomy** mode (Entity, Concept, Source colors) and **Learning Graph** mode (Mastery progress colors).
- **Computed Subsets & Analytics**: Derives reactive signals for filtered nodes, hub pages, isolated orphan nodes, and progress-filtered subgraphs in real time.

### 3. Learning Progress Management (`ProgressStateService`)
- **Mastery State Store**: Tracks progress states (`Not_Started`, `In_Progress`, `Understood`, `Mastered`) and assessment completion counts across all wiki concepts.
- **External Change & Conflict Detection**: Monitors file timestamps and detects external file modifications, quarantining merge-conflicted files safely while preserving session continuity.
- **Progress Synchronization**: Coordinates batch loading from disk and atomic updates to both individual concept files and the global progress index.

### 4. File System Persistence Adapter (`StorageService`)
- **Browser File System Access API**: Provides direct read/write access to the local `wiki/progress/` folder through directory handles.
- **Zod Schema Validation**: Validates JSON payloads against strict Zod schemas before writing or reading from disk.
- **Conflict Marker Detection & Quarantine**: Detects Git merge conflict markers (`<<<<<<<`, `=======`) and isolates corrupted files with a `.conflict` extension to avoid data loss.

### 5. Knowledge Assessment Orchestration (`AssessmentService`)
- **Interactive Evaluation Sessions**: Manages multi-question assessment workflows tailored to concept difficulty and previous mastery history.
- **AI Evaluation Simulation**: Evaluates open-ended, scenario, and factual responses, returning qualitative feedback and recommending progressive mastery transitions.
- **Error Recovery & Retry**: Handles transient network/AI failures with user-friendly alerts and session retry capability.

---

## 📁 File Index

| File | Conceptual & Functional Purpose |
| --- | --- |
| [`./assessment.service.ts`](./assessment.service.ts) | Coordinates knowledge assessment sessions, question generation, and AI evaluation heuristics. |
| [`./graph-state.service.ts`](./graph-state.service.ts) | Centralized Signal state store managing graph selection, filtering, mode toggles, and computed views. |
| [`./progress-state.service.ts`](./progress-state.service.ts) | Reactive state store for concept mastery levels, timestamp tracking, and conflict notifications. |
| [`./storage.service.ts`](./storage.service.ts) | File System Access API persistence adapter with Zod validation and merge conflict quarantine. |
| [`./wiki-parser.service.ts`](./wiki-parser.service.ts) | HTTP client service fetching manifests, parsing markdown frontmatter, and extracting wikilinks. |
| [`./assessment.service.spec.ts`](./assessment.service.spec.ts) | Unit tests verifying assessment session lifecycle, question flow, evaluation scoring, and error handling. |
| [`./graph-state.service.spec.ts`](./graph-state.service.spec.ts) | Unit tests verifying signal reactivity, visualization mode switches, and computed graph analytics. |
| [`./progress-state.service.spec.ts`](./progress-state.service.spec.ts) | Unit tests verifying progress state updates, timestamp checks, conflict quarantine, and index rebuilding. |
| [`./storage.service.spec.ts`](./storage.service.spec.ts) | Unit tests verifying directory access, JSON schema validation, error boundaries, and conflict isolation. |
| [`./wiki-parser.service.spec.ts`](./wiki-parser.service.spec.ts) | Unit tests validating wikilink extraction, frontmatter parsing, and manifest error responses. |

