---
name: readme-generator
description: >-
  Generates super human-readable, high-clarity README.md files for repositories, applications,
  libraries, and directories/modules. Focuses on architectural intent, domain capabilities,
  visual/functional behavior, and high-level responsibilities rather than dry public API dumps,
  type definitions, or robotic code usage examples. Uses clean Markdown tables with relative file paths.
---

# README Generator Skill

Use this skill whenever asked to generate or refactor a `README.md` file anywhere in the workspace—whether for the main repository, a standalone application, a domain/infrastructure library, or an internal directory module.

---

## 🎯 Core Directives & Anti-Patterns

### 1. 📖 High-Clarity Human Readability First
- Explain **what** the repository, application, library, or module is actually doing and **why** it exists.
- Describe real-world domain responsibilities, system architecture, visual encodings, visual/UX flows, and business capabilities.
- Write for human engineers joining the project who need to grasp the conceptual purpose immediately.

### 2. 🚫 STAGE-1 ANTI-PATTERNS (STRICTLY PROHIBITED)
- **NO Dry Public API Dumps**: Do NOT list raw interface field-by-field definitions (`interface Foo { bar: string; baz: number }`), type aliases, or function signatures with parameter lists.
- **NO Robotic Boilerplate Usage Snippets**: Do NOT paste generic copy-pasted TypeScript import/usage blocks (`import { X } from './x'; const x = new X();`) unless explaining a critical integration flow.
- **NO Line-by-Line Code Trivia**: Avoid mentioning trivial implementation mechanics or line counts.
- **NO Redundant Application Inner READMEs**: Every application has **EXACTLY ONE** application README at `apps/[app-name]/README.md`. NEVER create redundant inner `src/app/README.md` or `src/README.md` files right below an application root.

### 3. 🔗 Mandatory Relative Paths
- All links in file summaries, module tables, and architecture sections **MUST** use relative Markdown paths (e.g., [`./file-name.ts`](./file-name.ts) or [`./subfolder/README.md`](./subfolder/README.md)).
- **NEVER** use absolute `file://` URLs in generated README files.

---

## 📐 README Types & Templates

Identify which type of README you are generating and follow its dedicated template.

---

### Type 1: Repository README (`README.md` at root)

Used for the top-level repository or monorepo root documentation.

```markdown
# [Repository Name]

[1-2 sentences summarizing the overarching mission, technology stack, and core capability of this repository.]

---

## 🌟 Capabilities & System Mission

- **[Core Capability 1]**: [High-level explanation of what this repository accomplishes]
- **[Core Capability 2]**: [High-level explanation of second core capability]

---

## 🏗️ Architecture & Project Structure

[Brief overview of the monorepo design, clean architecture layers, or workspace organisation.]

```text
[ASCII / Mermaid Architectural Diagram showing applications, libraries, and external integrations]
```

| Layer / Workspace Area | Location | Purpose & Role |
| --- | --- | --- |
| **Applications** | [`./apps/`](./apps/) | Standalone executables, web applications, and CLI tools. |
| **Libraries** | [`./libs/`](./libs/) | Reusable domain models, application use cases, and infrastructure adapters. |
| **Knowledge Base** | [`./wiki/`](./wiki/) | Structured entities, concepts, and research documentation. |

---

## 🚀 Getting Started & Dev Commands

| Nx Target / Script | Purpose | Command |
| --- | --- | --- |
| `serve` | Launches primary local dev application | `npx nx serve [app-name]` |
| `build` | Compiles production application bundles | `npx nx run-many -t build` |
| `test` | Runs test suites across the repository | `npx nx run-many -t test` |

---

## 🔄 Core System Workflows

1. **[Workflow Step 1 Name]**: [Explanation of workflow]
2. **[Workflow Step 2 Name]**: [Explanation of workflow]
```

---

### Type 2: Application README (`apps/[app-name]/README.md`)

Used for standalone web apps, CLI tools, or executable applications.

> ⚠️ **Rule**: Create this file ONLY at `apps/[app-name]/README.md`. Do NOT create `apps/[app-name]/src/app/README.md`.

```markdown
# [Application Title] (`apps/[app-name]`)

[1-2 sentence description of what this application provides from a user/system perspective.]

---

## 🏛️ Architectural Role & Visual Flow

[Explanation of where this app fits in the system architecture, its component hierarchy, reactive state flow, or data processing pipeline.]

```text
[ASCII / Mermaid Diagram depicting UI presentation, state service layer, and data sources]
```

---

## 💡 Key Capabilities & UX Features

- **[Feature 1 Name]**
  - [Short bullet explaining functional behavior and user interaction]
  - [Short bullet explaining visual encoding or UI response]

- **[Feature 2 Name]**
  - [Short bullet explaining domain processing or output format]

---

## 📁 Subsystem & Module Map

| Subsystem | Folder | Responsibility |
| --- | --- | --- |
| **[Subsystem 1]** | [`./src/app/components/`](./src/app/components/README.md) | [Presentational UI components and container layouts] |
| **[Subsystem 2]** | [`./src/app/services/`](./src/app/services/README.md) | [Data parsing and reactive Signal state store] |

---

## 🚀 Build, Run & Test Targets

| Target | Command | Purpose |
| --- | --- | --- |
| `serve` | `npx nx run [app-name]:serve` | Starts local dev server with live reload |
| `build` | `npx nx run [app-name]:build` | Compiles production bundle |
| `test` | `npx nx run [app-name]:test` | Executes test suite |
```

---

### Type 3: Library README (`libs/[lib-name]/README.md`)

Used for reusable libraries, domain packages, application orchestrators, or infrastructure adapters.

```markdown
# [Library Title] (`libs/[lib-name]`)

[1-2 sentence high-level summary of the business domain or infrastructure utility this library provides.]

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: [Domain Models / Application Use Cases / Infrastructure Adapter / Core Facade]
- **Core Responsibility**: [Clear description of the specific business or technical problem solved by this library]
- **Upstream Dependencies**: [What this library depends on]
- **Downstream Consumers**: [What applications or libraries consume this library]

---

## ⚡ Domain Capabilities

- **[Capability 1]**: [Functional explanation of business logic or adapter functionality]
- **[Capability 2]**: [Functional explanation of validation, transformation, or orchestration]

---

## 📁 Module Summary

| Module / Directory | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/domain/`](./src/lib/domain/) | Pure domain entities, value objects, and business rules |
| [`./src/lib/ports/`](./src/lib/ports/) | Port interfaces defining infrastructural contracts |
| [`./src/lib/services/`](./src/lib/services/) | Application orchestrators coordinating use-case flows |

---

## 🔄 Integration Context

[Brief conceptual explanation of how this library integrates into broader system workflows without dumping dry code usage blocks.]
```

---

### Type 4: Directory / Module README (`[path-to-dir]/README.md`)

Used for specific internal subdirectories (e.g. `components`, `services`, `d3`, `models`, `commands`).

```markdown
# [Module / Subsystem Title]

[1-2 sentence explanation of the architectural role and collective purpose of the files in this folder.]

---

## 🏛️ Design Architecture & Rules

- **[Pattern / Rule 1]**: [Explanation of architectural design pattern used in this folder, e.g. Smart vs UI components, immutable domain models, pure transformation services.]
- **[Pattern / Rule 2]**: [Explanation of state management, events, or rendering flow.]

---

## 💡 Functional Capabilities

- **[Capability 1]**: [What features or behaviors these files collectively enable]
- **[Capability 2]**: [Visual encodings, data transformations, or state reactivity]

---

## 📁 File Index

| File | Conceptual & Functional Purpose |
| --- | --- |
| [`./file-one.ts`](./file-one.ts) | High-level functional description of file-one. |
| [`./file-two.ts`](./file-two.ts) | High-level functional description of file-two. |
```

---

## 🚀 Execution Steps

1. **Classify Target**: Determine if the target is a Repository, Application, Library, or Module/Directory.
2. **Inspect Files**: Read the contents of the target directory to understand its true domain purpose, architectural patterns, and functional capabilities.
3. **Verify App Uniqueness**: If writing an application README, verify it lives at `apps/[app-name]/README.md` and remove any redundant `src/app/README.md` or `src/README.md` files.
4. **Enforce Readability Rules**: Ensure no dry interface dumps, parameter lists, or robotic usage code blocks are present.
5. **Generate README**: Write `README.md` following the exact corresponding template and ensuring relative file links (`./filename.ts`).
