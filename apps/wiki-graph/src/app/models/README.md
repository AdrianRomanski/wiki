# Domain & Progress Models (`apps/wiki-graph/src/app/models`)

This directory defines the core domain models, TypeScript types, constants, and Zod validation schemas used throughout the Wiki Visualizer application. It establishes a unified domain contract for graph network topology, progressive learning mastery states, and interactive assessment workflows.

---

## 🏛️ Domain Concepts & Data Modeling

### 1. Topological Graph Entities (`graph.models.ts`)
- **Document Classifications (`NodeType`)**: Classifies knowledge nodes into **Entity** (tools/libraries), **Concept** (patterns/principles), and **Source** (research summaries) pages.
- **Graph Topology (`GraphNode`, `GraphEdge`, `GraphData`)**: Models vertices, directed `[[wikilink]]` references, ghost node indicators for missing pages, degree metrics, and full graph collections.
- **Physics Simulation Coordinates (`SimulationNode`)**: Extends graph nodes with dynamic positioning (`x`, `y`), velocity vectors, and pin coordinates for D3 force simulation.
- **Manifest Payload (`WikiManifest`)**: Represents the static manifest payload generated during build-time ingestion.

### 2. Learning Progress Mastery Continuum (`progress.models.ts`)
- **Mastery States (`ProgressState`)**: Tracks learner mastery across four discrete levels: `Not_Started` ➔ `In_Progress` ➔ `Understood` ➔ `Mastered`.
- **Progress Records (`ProgressEntry`, `ProgressIndex`)**: Encapsulates per-concept metadata (assessment count, timestamps, current state) and vault-wide progress index catalogs.

### 3. Runtime Validation & Schemas (`progress.schemas.ts`)
- **Zod Schema Contracts**: Enforces strict runtime validation on persisted JSON files, ensuring correct schema versions (`SCHEMA_VERSION`), valid timestamp formats, non-negative counters, and strict kebab-case identifiers.
- **Merge Conflict Resilience**: Validates incoming data before writing to disk and guards against corrupt payloads.

### 4. Visual Encodings & Constants (`progress.constants.ts`)
- **Color Palettes (`PROGRESS_COLORS`, `PROGRESS_COLOR_HEX`, `WIKI_NODE_COLORS`)**: Semantic color tokens for graph visualization in both wiki taxonomy and progress mastery modes.
- **Layout Thresholds**: Standard node radii, focus scale factors, and SVG canvas dimensions.

### 5. Knowledge Assessment Workflow (`assessment.models.ts`)
- **Assessment Sessions (`AssessmentSession`)**: Manages multi-question assessment sessions, tracking question sequences (`open-ended`, `scenario`, `factual`), candidate responses, and active session status.
- **Evaluation Payloads (`AssessmentResult`)**: Structures AI evaluation outputs, suggested next states, confidence scores, and qualitative feedback.

---

## 📁 File Index

| File | Conceptual Purpose |
| --- | --- |
| [`./graph.models.ts`](./graph.models.ts) | Domain interfaces for graph nodes, node types, directed edges, graph data containers, and simulation coordinates. |
| [`./progress.models.ts`](./progress.models.ts) | Core types for learner progress states, concept progress entries, and vault index summaries. |
| [`./progress.schemas.ts`](./progress.schemas.ts) | Zod runtime validation schemas for progress entries, index files, and schema version constants. |
| [`./progress.constants.ts`](./progress.constants.ts) | Color mapping constants, hex palettes, and visual sizing constants for graph modes. |
| [`./assessment.models.ts`](./assessment.models.ts) | Session interfaces, question definitions, response containers, and evaluation result models. |
| [`./index.ts`](./index.ts) | Barrel export re-exporting all graph, progress, and assessment types from a single entry point. |
