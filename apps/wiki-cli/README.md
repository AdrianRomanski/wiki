# Wiki CLI (`apps/wiki-cli`)

`wiki-cli` is the centralized command-line interface application for the LLM Wiki Knowledge Monorepo. Built as a single bundled Node.js application, it exposes workspace maintenance tasks—manifest generation, index generation, tag distribution validation, and directory scaffolding—as native Nx targets.

---

## Architectural Role

`wiki-cli` serves as the **Presentation / Driver Layer** in the system's Clean (Hexagonal) Architecture:

```text
       ┌────────────────────────┐
       │   apps/wiki-cli        │  (Driver / Presentation Layer)
       │   - src/index.ts       │  Command CLI Router
       │   - src/commands/*.ts  │  Composition Roots
       └───────────┬────────────┘
                   │ Wires & Injects
                   ▼
┌──────────────────────────────────────┐
│  libs/application-*                  │  (Application Layer)
│  - application-index-manager         │  Use Cases (Pure Domain Logic)
│  - application-tag-validation        │
│  - application-scaffolding           │
└──────────────────▲───────────────────┘
                   │ Depends on Interfaces
┌──────────────────┴───────────────────┐
│  libs/infrastructure-*               │  (Infrastructure Layer)
│  - infrastructure-filesystem         │  Adapters (FS, YAML, Markdown)
│  - infrastructure-frontmatter        │
│  - infrastructure-markdown           │
└──────────────────────────────────────┘
```

- **Composition Roots Only**: Code inside `wiki-cli` contains no business logic. Its sole responsibility is parsing CLI arguments, instantiating concrete Infrastructure adapters, passing them to Application use cases, and rendering formatted outputs to `stdout`.
- **Decoupled Business Rules**: Features such as threshold validation, markdown index formatting, manifest scanning, and directory scaffolding live entirely within pure `@wiki/application-*` libraries.

---

## Workspace Subcommands & Nx Targets

You can execute commands via Nx targets from the workspace root:

| Nx Target | Subcommand | Description |
|---|---|---|
| `nx run wiki-cli:generate-manifest` | `generate-manifest` | Scans `wiki/` pages and generates `wiki/manifest.json`. |
| `nx run wiki-cli:generate-index` | `generate-index` | Re-indexes entities, concepts, and sources into `wiki/index.md`. |
| `nx run wiki-cli:validate-tags` | `validate-tags` | Validates tag frequency distribution against the 60% threshold. Returns exit code 0 or 1. |
| `nx run wiki-cli:init` | `init` | Scaffolds the initial `wiki/` and `raw/` directory structure. |

### Direct Binary Execution

After running `nx run wiki-cli:build`, the compiled bundle resides at `dist/apps/wiki-cli/index.cjs` and can be invoked directly:

```bash
node dist/apps/wiki-cli/index.cjs generate-manifest
node dist/apps/wiki-cli/index.cjs generate-index
node dist/apps/wiki-cli/index.cjs validate-tags
node dist/apps/wiki-cli/index.cjs init
```

---

## Directory Structure

```text
apps/wiki-cli/
├── project.json                 # Nx project configuration & targets
├── package.json                 # App package definition
├── tsconfig.json                # TypeScript base configuration
├── tsconfig.app.json            # Build-specific TS configuration
├── tsconfig.spec.json           # Test TS configuration
├── vitest.config.ts             # Vitest test runner setup
├── README.md                    # Module documentation
└── src/
    ├── index.ts                 # CLI Entry Point & command router
    ├── wrappers.smoke.spec.ts   # Smoke tests for CLI binary & contract
    └── commands/                # Subcommand composition roots
        ├── generate-manifest.command.ts
        ├── generate-index.command.ts
        ├── validate-tags.command.ts
        ├── init.command.ts
        └── README.md            # Commands documentation
```

---

## Entry Point & Command Dispatcher (`src/index.ts`)

- **Workspace Root Resolution**: Resolves the monorepo root dynamically using `path.resolve(__dirname, '..', '..', '..')` so paths remain consistent regardless of working directory.
- **CLI Dispatching**: Extracts `process.argv[2]`, matches it to handler functions in `src/commands/`, and sets `process.exitCode` appropriately.
- **Exit Code Contract**:
  - `0`: Successful execution or passing validation.
  - `1`: Unknown command, thrown error, or failed validation (e.g., tag frequency > 60%).

---

## Build & Test

### Building

The build target uses `@nx/esbuild:esbuild` to bundle `wiki-cli` into a single CommonJS executable (`dist/apps/wiki-cli/index.cjs`) with a Node hashbang banner (`#!/usr/bin/env node`):

```bash
npx nx run wiki-cli:build
```

### Testing

Smoke tests verify that the compiled binary executes properly and adheres to output and exit-code contracts:

```bash
npx nx run wiki-cli:test
```