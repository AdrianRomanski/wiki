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

### 2. 👋 Warm & Inviting Entry Point (Main Repository README)
- The root `README.md` serves as the primary entrance and front door to the repository.
- Provide a friendly, approachable welcome that introduces what the repository is about, its mission, core stack, how to use it, and how to get started in minutes without drowning the reader in jargon upfront.

### 3. 🚫 STAGE-1 ANTI-PATTERNS (STRICTLY PROHIBITED)
- **NO Dry Public API Dumps**: Do NOT list raw interface field-by-field definitions (`interface Foo { bar: string; baz: number }`), type aliases, or function signatures with parameter lists.
- **NO Robotic Boilerplate Usage Snippets**: Do NOT paste generic copy-pasted TypeScript import/usage blocks (`import { X } from './x'; const x = new X();`) unless explaining a critical integration flow.
- **NO Line-by-Line Code Trivia**: Avoid mentioning trivial implementation mechanics or line counts.
- **NO Redundant Application Inner READMEs**: Every application has **EXACTLY ONE** application README at `apps/[app-name]/README.md`. NEVER create redundant inner `src/app/README.md` or `src/README.md` files right below an application root.

### 4. 🔗 Mandatory Relative Paths
- All links in file summaries, module tables, and architecture sections **MUST** use relative Markdown paths (e.g., [`./file-name.ts`](./file-name.ts) or [`./subfolder/README.md`](./subfolder/README.md)).
- **NEVER** use absolute `file://` URLs in generated README files.

### 5. 📜 Schema Specification vs. Directory README (Separation of Concerns)
- **Schema Specification (`WIKI_SCHEMA.md` / `[SYSTEM]_SCHEMA.md`)**: When a subsystem or knowledge base has a dedicated schema specification document, that file serves as the **Single Source of Truth (SSOT)** for strict frontmatter schemas, field validation rules, naming conventions, and automated workflow triggers (for AI agents & CLI tools).
- **Directory README (`wiki/README.md`)**: Subfolder README files act as **lightweight entry points and human navigation guides**. They must **NOT** duplicate detailed schema specifications, workflow rules, or field-by-field validation contracts. Instead, they provide high-level folder structure, usage/search examples, and link directly to the schema specification (`WIKI_SCHEMA.md`).
- **Title-Based WikiLink Rules**: In wiki/knowledge-base documentation, always enforce title-based WikiLink syntax (`[[Page Title]]`) rather than filename slugs (`[[page-slug]]`) to prevent ghost nodes in graph visualizers (e.g. Obsidian).

---

## 📐 README Types & Templates

Identify which type of README you are generating and follow its dedicated template.

---

### Type 1: Repository README (`README.md` at root)

Used for the top-level repository or monorepo root documentation. Acts as a **warm welcome**, explaining the repository's purpose, workspace organization, and how to run and use it.

```markdown
# [Repository Name]

👋 **Welcome to [Repository Name]!** 

[Friendly 2-3 sentence welcome introducing the repository, its mission, key capabilities, and underlying technology stack in clear, accessible language.]

---

## 💡 What is this Repository About?

[A clear, engaging explanation of what the repository does, the primary problems it solves, and why it exists. Written so anyone joining the project can immediately grasp the domain and vision.]

### Key Highlights
- **[Highlight 1]**: [Short description of core feature or architecture pillar]
- **[Highlight 2]**: [Short description of core feature or architecture pillar]
- **[Highlight 3]**: [Short description of core feature or architecture pillar]

---

## 🏗️ Architecture & Project Structure

[Overview of the workspace structure, monorepo layout, and key boundaries.]

```text
[ASCII / Mermaid Architectural Diagram showing applications, libraries, and external integrations]
```

| Workspace Area / Layer | Location | Purpose & Role |
| --- | --- | --- |
| **Applications** | [`./apps/`](./apps/) | Standalone web applications, CLI tools, and demo targets. |
| **Libraries** | [`./libs/`](./libs/) | Reusable domain models, UI components, application logic, and infrastructure adapters. |
| **Knowledge Base / Wiki** | [`./wiki/`](./wiki/) | Structured knowledge base containing entities, concepts, and research sources. |

---

## 🚀 How to Use & Get Started

[Quick, step-by-step guide for getting up and running locally.]

### Prerequisites
- Node.js (v18+ recommended)
- npm / pnpm / yarn

### Quick Start Commands
```bash
# 1. Install dependencies
npm install

# 2. Start the primary local application
npx nx serve [app-name]
```

### Essential Dev Commands
| Nx Target / Script | Command | Description |
| --- | --- | --- |
| `serve` | `npx nx serve [app-name]` | Launches dev server with live reload |
| `build` | `npx nx run-many -t build` | Compiles production build artifacts across the workspace |
| `test` | `npx nx run-many -t test` | Executes unit and integration test suites |

---

## 🔄 Common Workflows & Navigation

1. **Exploring Applications**: Head over to [`./apps/`](./apps/) to see executable applications and UI entry points.
2. **Developing Libraries**: Check out [`./libs/`](./libs/) for modular components and business logic.
3. **Research & Wiki**: Browse [`./wiki/`](./wiki/) for architectural concepts, research notes, and domain documentation.
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

### Type 5: Knowledge Base / Subsystem Directory README (`wiki/README.md`)

Used for knowledge base root folders, structured vault directories, or subsystems governed by a separate schema specification file (e.g., `WIKI_SCHEMA.md`).

```markdown
# [Knowledge Base / Subsystem Title]

[1-2 sentence overview of the directory content, knowledge base purpose, or system store.]

---

## 📜 Specification & Single Source of Truth

> ℹ️ **System Schema Contract**: The authoritative single source of truth (SSOT) for page frontmatter requirements, strict title-based `[[WikiLink]]` conventions, and automated workflows is documented in [../WIKI_SCHEMA.md](../WIKI_SCHEMA.md).

---

## 📁 Directory Structure & Categories

| Folder / Category | Purpose & Content | Example Files |
| --- | --- | --- |
| [`./entities/`](./entities/) | Pages describing specific things (tools, APIs, libraries) | `angular-cdk.md` |
| [`./concepts/`](./concepts/) | Explanations of ideas, patterns, or architecture principles | `progressive-enhancement.md` |
| [`./sources/`](./sources/) | Distilled summaries of raw source documents | `wcag-guide-2024-05-10.md` |

---

## 🔗 Navigation & External Tooling

- **Graph & Vault Browsing**: Open directory in Obsidian or equivalent tools using `[[Page Title]]` WikiLink syntax.
- **Search CLI**:
  ```bash
  rg "search query" wiki/
  ```

---

## 📖 Reference Links

- See [WIKI_SCHEMA.md](../WIKI_SCHEMA.md) for full schema specifications and validation rules.
- See [index.md](index.md) for current top-level navigation and statistics.
```

---

## 🚀 Execution Steps

1. **Classify Target**: Determine if the target is a Repository, Application, Library, Knowledge Base/Subsystem Directory, or Module/Directory.
2. **Inspect Files**: Read the contents of the target directory to understand its true domain purpose, architectural patterns, and functional capabilities.
3. **Verify App Uniqueness**: If writing an application README, verify it lives at `apps/[app-name]/README.md` and remove any redundant `src/app/README.md` or `src/README.md` files.
4. **Separate Schema vs README Concerns**: If a dedicated schema specification exists (e.g. `WIKI_SCHEMA.md`), ensure the subfolder `README.md` does not duplicate detailed schema rules or workflow triggers, but links directly to the schema file as SSOT.
5. **Enforce Readability & Link Conventions**: Ensure no dry interface dumps or robotic usage blocks. Ensure all WikiLinks use title-based syntax (`[[Page Title]]`) and relative file links (`./filename.md`).
6. **Generate README**: Write `README.md` following the exact corresponding template.
