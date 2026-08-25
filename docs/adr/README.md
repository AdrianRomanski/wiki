# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) capturing significant architectural and technical decisions made in this repository.

## 📋 ADR Index

| ADR | Title | Status | Date | Area |
|---|---|---|---|---|
| [ADR-0001](0001-monorepo-structure-and-hexagonal-wiki-core.md) | Monorepo Structure & Hexagonal Architecture for Wiki Core | `Accepted` | 2026-08-25 | Core Architecture |
| [ADR-0002](0002-interactive-knowledge-graph-and-learning-engine.md) | Interactive Knowledge Graph & Dual-Mode Learning Engine | `Accepted` | 2026-08-25 | Frontend & Visualization |
| [ADR-0003](0003-model-context-protocol-mcp-server-integration.md) | Model Context Protocol (MCP) Server for AI Agent Integration | `Accepted` | 2026-08-25 | AI & Tooling |
| [ADR-0004](0004-character-dashboard-and-life-gamification-architecture.md) | Character Dashboard & Life Gamification Platform (Wiki as Character Brain) | `Accepted` | 2026-08-25 | Core Architecture & Gamification |
| [ADR-0005](0005-firebase-deployment-and-firestore-persistence.md) | Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture | `Accepted` | 2026-08-25 | Cloud, Infrastructure & Persistence |


---

## 📐 ADR Template & Format

All ADRs in this directory are written in Markdown with YAML frontmatter. This format enables bidirectional cross-linking and direct ingestion into the **Wiki Graph** visualizer.

```markdown
---
title: "ADR-XXXX: Title of Decision"
type: adr
status: proposed | accepted | deprecated | superseded
date: YYYY-MM-DD
tags: [architecture, tag1, tag2]
---

# ADR-XXXX: Title of Decision

## Status
Accepted

## Context & Problem Statement
What context led to this decision? What challenges are we addressing?

## Decision Drivers
- Driver 1 (e.g. strict decoupling)
- Driver 2 (e.g. testability without I/O mocks)

## Considered Options
1. Option A
2. Option B

## Decision Outcome
Chosen option and detailed rationale.

## Consequences
### Positive
- Benefit 1

### Negative & Trade-offs
- Trade-off 1

## Graph Relationships & Cross References
- Implements [[Concept Name]]
- Relates to [[Entity Name]]
- References [[Source Title]]
```
