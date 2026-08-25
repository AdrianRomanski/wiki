---
title: 'ADR-0004: Character Dashboard & Life Gamification Platform (Wiki as Character Brain)'
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, gamification, character-dashboard, character-brain, life-gamification, clean-architecture, wiki-core]
---

# ADR-0004: Character Dashboard & Life Gamification Platform (Wiki as Character Brain)

## Status

**Accepted**

---

## Context & Problem Statement

The workspace initially focused on structured developer research, interactive knowledge visualization (`apps/wiki-graph`), and AI tool integration (`apps/wiki-mcp-server`). However, technical learning and personal growth are continuous processes that extend beyond isolated document ingestion.

Engineers and lifelong learners face recurring challenges:

- **Abstract Knowledge vs. Real-World Execution**: Ingested articles and documentation lack direct progression hooks to track personal mastery and practical skill application over time.
- **Motivation & Skill Decay**: Without clear feedback loops, skill retention degrades and complex learning trajectories lose momentum.
- **Fragmented Life Context**: Technical knowledge, daily habits, coding projects, and personal accomplishments are managed in disconnected tools.

To solve this, we are expanding the platform from a standalone knowledge base into a **Life Gamification Platform**. In this architecture, the **Wiki functions as the Cognitive Brain / Knowledge Cortex of the RPG Character** that we are actively building and leveling up through real-world learning and software engineering.

---

## Decision Drivers

- **Wiki as Character Brain**: The Wiki serves as the character's long-term memory, mental model, and cognitive graph. Every entity, concept, source, and decision record forms neural connections in the character's brain.
- **Interactive Character Dashboard (`apps/character-dashboard`)**: A visual, RPG-style interface providing real-time views of character attributes, active quests, skill trees, level progression, and stat radar charts.
- **Dual Engine Integration (Knowledge & Progression)**: Seamless synchronicity between the Wiki Graph assessment engine (mastery levels) and the Character Progression Engine (Experience Points, Skill Points, Attribute Allocation).
- **AI Questmaster via MCP**: Utilizing Model Context Protocol (`apps/wiki-mcp-server`) to allow AI agents to evaluate code/wiki contributions, synthesize personalized quests, and award XP based on real-world achievements.
- **Clean Bounded Contexts**: Strict separation between core domain contexts (`Domain-Character`, `Domain-Quests`, `Domain-SkillTree`, and `Domain-Wiki`) using Hexagonal Architecture.
- **Wiki-Backed Persistence (`wiki/character.md`)**: Character Sheet state (Level, XP, Attributes, Titles) is stored as a Markdown document with YAML frontmatter directly in the `wiki/` knowledge repository (`wiki/character.md`), ensuring full git versioning, human readability, and AI inspectability instead of ephemeral browser local storage.

---

## Considered Options

1. **Option 1: Ad-hoc Gamification Layer Embedded Directly in `apps/wiki-graph`**
   - _Pros_: Faster initial implementation within the existing Angular web app.
   - _Cons_: Tight coupling between visual graph rendering and gamification domain rules; violates single responsibility principle; limits future dedicated character experiences (e.g. mobile dashboards or CLI quest trackers).

2. **Option 2: External Integration with Existing Third-Party RPG Tools (e.g. Habitica, Obsidian Plugins)**
   - _Pros_: Avoids building custom UI controls.
   - _Cons_: Vendor lock-in; poor integration with our custom Hexagonal Wiki domain, D3 force-directed graph, and local MCP server; lacks customized skill trees mapped to developer knowledge.

3. **Option 3: Dedicated Character Dashboard & Gamification Engine in Nx Monorepo (Chosen)**
   - _Pros_: Treats the **Wiki as the Cognitive Brain** of a dedicated **Character Dashboard** application (`apps/character-dashboard`). Enables custom skill trees, real-time stat synchronization, and full AI Questmaster support via clean hexagonal ports and adapters.
   - _Cons_: Requires establishing new domain modules (`libs/gamification/*`) and UI presentational components.

---

## Decision Outcome

We decided on **Option 3: Dedicated Character Dashboard & Gamification Engine in Nx Monorepo**, formalizing the **Wiki as the Cognitive Brain of the Character**.

### 1. Conceptual Roles & Architectural Boundaries

- **The LifeForge Platform Application (`apps/life-forge-app` | `scope:life-forge`)**: The main umbrella application composing the Character Dashboard, Quest System, Skill Trees, and Life Gamification surfaces.
- **The Character Domain (`libs/character/*` | `scope:character`)**: Dedicated domain managing Character Sheet state, Experience (XP), Character Levels, Attributes (Intelligence, Wisdom, Discipline), and Progression rules.
- **The Brain (`libs/wiki/*` | `scope:wiki`)**: The cognitive core of the character. Holds memories, technical concepts, framework entities, research sources, and architectural decisions. Knowledge retention directly drives cognitive character stats.
- **The Neural Bridge (`apps/wiki-mcp-server`)**: Standardized AI interface enabling subagents and LLMs to inspect the character's brain state, identify knowledge gaps, and assign tailored learning or coding quests.

#### Layered Architecture & Module Boundaries (Enforced via ESLint)

The Gamify domain follows a standard **Nx Layered Architecture** categorized by layer tags (`layer:*`), type tags (`type:*`), and scope tags (`scope:wiki`, `scope:character`, `scope:life-forge`):

1. **`layer:feature` | `type:feature`**: Smart container components, page routes, and complex user flow orchestrators.
   - *Allowed Dependencies*: `layer:feature`, `layer:ui`, `layer:data-access`, `layer:domain`.
2. **`layer:ui` | `type:ui`**: Presentational & dumb UI components (strictly using Angular `input()` and `output()`, zero injected services).
   - *Allowed Dependencies*: `layer:ui`, `layer:domain`, `type:ui`, `type:util`.
3. **`layer:data-access` | `type:data-access`**: Services, state management (Angular Signals / RxJS), API clients, and storage adapters.
   - *Allowed Dependencies*: `layer:data-access`, `layer:domain`, `type:data-access`, `type:util`.
4. **`layer:domain` | `type:util`**: Pure domain models, helper functions, constants, and value objects.
   - *Allowed Dependencies*: `layer:domain`, `type:util`.

- **Scope Isolation Rules**:
  - `scope:life-forge`: Main application scope. Allowed to depend on `scope:life-forge`, `scope:character`, `scope:wiki`, and `scope:shared`.
  - `scope:character`: Character domain packages. May depend on `scope:character`, `scope:wiki` (to query the Character's Brain), and `scope:shared`.
  - `scope:wiki`: Brain domain packages. May only depend on `scope:wiki` or `scope:shared`.
  - `scope:shared`: Common utility libraries accessible across all domains.



### 2. Architecture Overview

```text
                     ┌──────────────────────────────────────────────┐
                     │          CHARACTER DASHBOARD SURFACE         │
                     │          (apps/character-dashboard)          │
                     │  ┌───────────────┐ ┌──────────────────────┐  │
                     │  │Character Sheet│ │ Skill Tree Visualizer│  │
                     │  └───────────────┘ └──────────────────────┘  │
                     │  ┌───────────────┐ ┌──────────────────────┐  │
                     │  │   Quest Log   │ │   Stat Radar Chart   │  │
                     │  └───────────────┘ └──────────────────────┘  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         GAMIFICATION & PROGRESSION ENGINE                    │
    │  ┌─────────────────────────┐ ┌─────────────────────┐ ┌────────────────────┐  │
    │  │ Character Domain Model  │ │ Quest & Habit State │ │ Skill Tree Engine  │  │
    │  │ (XP, Level, Attributes) │ │ (Daily/Main Quests) │ │ (Prereq Resolution)│  │
    │  └─────────────────────────┘ └─────────────────────┘ └────────────────────┘  │
    └───────────────────────────────────────┬──────────────────────────────────────┘
                                            │
                                            ▼ (Cognitive Sync)
    ┌──────────────────────────────────────────────────────────────────────────────┐
    │                         THE CHARACTER'S BRAIN (WIKI CORE)                    │
    │  ┌─────────────────────────┐ ┌─────────────────────┐ ┌────────────────────┐  │
    │  │    Knowledge Cortex     │ │  Assessment Engine  │ │ Architectural Mem  │  │
    │  │  (Entities & Concepts)  │ │ (Mastery Ratings)   │ │  (ADR Repositories)│  │
    │  └─────────────────────────┘ └─────────────────────┘ └────────────────────┘  │
    └───────────────────────────────────────┬──────────────────────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          AI QUESTMASTER NEURAL LINK          │
                     │           (apps/wiki-mcp-server)             │
                     │   Generates quests & evaluates progress      │
                     └──────────────────────────────────────────────┘
```

### 3. Character Stat Mapping

Cognitive and character attributes map directly to wiki interactions and real-world execution:

- **Intelligence (INT)**: Driven by Wiki Concept mastery, research session completions, and article/library extractions.
- **Discipline (DIS)**: Sustained through daily habit consistency, active task execution, and quest completion streaks.

---

## Consequences

### Positive

- **High Engagement & Clarity**: Transforms passive knowledge collection into an active, rewarding RPG progression system.
- **Unified Life Context**: Connects real-world coding, reading, and architectural decisions directly to character growth.
- **Decoupled Architecture**: Clean separation between the **Brain** (Wiki Core) and the **Dashboard** (Gamification UI), keeping business rules testable.
- **AI-Native Questing**: AI agents act as intelligent Questmasters, leveraging MCP to offer context-aware challenges based on current wiki state.

### Negative & Trade-offs

- **Domain Complexity**: Expands the monorepo to encompass gamification domain models (XP formulas, quest state machines, skill tree validation).
- **State Synchronization**: Requires robust state syncing between local storage, wiki manifest metadata, and character progression state.

---

## Graph Relationships & Cross-References

- Implements [[Life Gamification]]
- Implements [[Character Dashboard]]
- Implements [[Skill Tree Engine]]
- Relates to [[Monorepo Structure & Hexagonal Architecture for Wiki Core]] (ADR-0001)
- Relates to [[Interactive Knowledge Graph & Dual-Mode Learning Engine]] (ADR-0002)
- Relates to [[Model Context Protocol (MCP) Server for AI Agent Integration]] (ADR-0003)
