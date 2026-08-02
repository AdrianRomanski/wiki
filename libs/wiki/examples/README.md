# Wiki Initialization & Example Scripts (`libs/wiki/examples`)

This directory provides initialization scripts that populate a demo wiki graph with sample entities, concepts, and source pages for demonstration, integration testing, and visual graph exploration.

---

## 🏛️ Purpose & Capabilities

- **Realistic Graph Seeding**: Populates realistic interconnected markdown pages (`entities/`, `concepts/`, `sources/`) showcasing entity relationships and cross-domain knowledge graphs.
- **Categorized Script Execution**: Seed scripts organized by domain domain: frontend libraries, backend frameworks, testing tools, blog articles, documentation sources, and concept relationships.
- **Clean Slate Utility**: Includes clean-up scripts to reset generated demo files safely.

---

## 📁 Available Initialization Targets

| Command Script | Category | Generated Content Role |
| --- | --- | --- |
| `npm run init:frontend-libs` | Frontend Entities | Seeds Entity pages for React, Vue, and Svelte libraries. |
| `npm run init:backend-libs` | Backend Entities | Seeds Entity pages for NestJS, Express, and Fastify frameworks. |
| `npm run init:testing-libs` | Testing Entities | Seeds Entity pages for Vitest, Jest, and Playwright tools. |
| `npm run init:articles-blog` | Blog Sources | Seeds Source Summaries for blog articles with author metadata. |
| `npm run init:articles-docs` | Documentation Sources | Seeds Source Summaries for official framework documentation. |
| `npm run init:close-concepts` | Same-Domain Concepts | Seeds highly connected concept pages within Web Accessibility. |
| `npm run init:far-concepts` | Cross-Domain Concepts | Seeds concept pages across architectural paradigms. |
| `npm run init:cross-domain` | Cross-Domain Graph | Seeds heterogeneous entities and concepts spanning multiple domains. |
| `npm run init:all` | All Categories | Executes all 8 seeding scripts sequentially to build a complete demo graph. |
| `npm run init:clean` | Reset Utility | Clears all generated demo files from `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/`. |

---

## 📁 File Index

| File | Primary Role & Responsibility |
| --- | --- |
| [`./src/init-all.ts`](./src/init-all.ts) | Master runner executing all demo seeding scripts sequentially. |
| [`./src/clean.ts`](./src/clean.ts) | Clean-up utility resetting generated demo files in the `wiki/` directory. |
| [`./src/frontend-libs.ts`](./src/frontend-libs.ts) | Seeding script for frontend library entity pages. |
| [`./src/backend-libs.ts`](./src/backend-libs.ts) | Seeding script for backend framework entity pages. |
| [`./src/testing-libs.ts`](./src/testing-libs.ts) | Seeding script for testing tool entity pages. |
