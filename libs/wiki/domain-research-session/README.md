# Research Session Domain Models (`libs/wiki/domain-research-session`)

`@wiki/domain-research-session` defines pure domain entities and state machine models for technical research sessions, prototype evaluations, decision drivers, and research session lifecycles.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Pure Domain Model
- **Core Responsibility**: Models research session state transitions (`active`, `paused`, `finalized`), session metadata, library comparison matrices, and prototype evaluation results.
- **Upstream Dependencies**: None
- **Downstream Consumers**: `@wiki/application-research-session`, `@wiki/application-adr`, research skills.

---

## ⚡ Domain Capabilities

- **Session State Machine**: Defines valid research session status transitions and milestone checkpoints.
- **Comparison & Prototype Models**: Value objects representing multi-library comparison matrices, feature tradeoffs, and prototype benchmarks.
- **Session Reference Data**: Models bidirectional linkage between research sessions and resulting wiki pages.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/research-session.model.ts`](./src/lib/research-session.model.ts) | Domain entity modeling research sessions, statuses, and metadata. |
| [`./src/lib/comparison-matrix.model.ts`](./src/lib/comparison-matrix.model.ts) | Domain models for library evaluation matrices and decision criteria. |
