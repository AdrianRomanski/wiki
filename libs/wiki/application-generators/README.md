# Wiki Page Generators (`libs/wiki/application-generators`)

`@wiki/application-generators` contains application use cases responsible for generating structured Entity, Concept, and Source Summary markdown pages with consistent formatting and frontmatter.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Implements generation logic for `entities/*.md`, `concepts/*.md`, and `sources/*.md` files from options objects or raw inputs.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: `@wiki/application-workflow`, `@wiki/application-adr`, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Entity Page Generator (`GenerateEntityPageUseCase`)**: Generates structured documentation for libraries, tools, APIs, and components.
- **Concept Page Generator (`GenerateConceptPageUseCase`)**: Generates structured pages explaining architectural patterns, design principles, and ideas.
- **Source Summary Generator (`GenerateSourceSummaryUseCase`)**: Generates structured summaries distilled from raw articles, research sessions, or ADRs.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/generate-entity-page.use-case.ts`](./src/lib/generate-entity-page.use-case.ts) | Use case generating formatted Entity markdown pages. |
| [`./src/lib/generate-concept-page.use-case.ts`](./src/lib/generate-concept-page.use-case.ts) | Use case generating formatted Concept markdown pages. |
| [`./src/lib/generate-source-summary.use-case.ts`](./src/lib/generate-source-summary.use-case.ts) | Use case generating formatted Source Summary markdown pages. |
