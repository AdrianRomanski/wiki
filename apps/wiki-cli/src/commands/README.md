# Wiki CLI Commands (`src/commands`)

This directory contains the **thin composition roots** (drivers) for each subcommand supported by `wiki-cli`.

## Architectural Role

Following Clean / Hexagonal Architecture principles:
- **Zero Business Logic**: No business rules, file parsing logic, tag calculations, or directory creation algorithms are defined here.
- **Dependency Injection**: Each module instantiates concrete Infrastructure adapters (e.g., `FileSystemAdapter`, `FrontmatterAdapter`, `MarkdownAdapter`) and injects them into pure Application use cases.
- **I/O & Reporting**: Commands run use cases, log progress or summary metrics to `stdout`, and return process exit codes where required.

---

## Command Reference

### `generate-manifest.command.ts`

- **Function**: `runGenerateManifest(workspaceRoot: string): Promise<void>`
- **Wired Adapters**:
  - `FileSystemAdapter` (from `@wiki/infrastructure-filesystem`)
- **Use Case**: `GenerateManifestUseCase` (from `@wiki/application-index-manager`)
- **Target Command**: `nx run wiki-cli:generate-manifest`
- **Behavior**:
  1. Scans `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/`.
  2. Generates and writes `wiki/manifest.json`.
  3. Logs the total count and list of indexed files to standard output.

---

### `generate-index.command.ts`

- **Function**: `runGenerateIndex(workspaceRoot: string): Promise<void>`
- **Wired Adapters**:
  - `FileSystemAdapter` (from `@wiki/infrastructure-filesystem`)
  - `FrontmatterAdapter` (from `@wiki/infrastructure-frontmatter`)
  - `MarkdownAdapter` (from `@wiki/infrastructure-markdown`)
- **Use Case**: `GenerateIndexUseCase` (from `@wiki/application-index-manager`)
- **Target Command**: `nx run wiki-cli:generate-index`
- **Behavior**:
  1. Scans `wiki/` pages and parses YAML frontmatter and markdown headings.
  2. Builds categorized lists of entities, concepts, and sources.
  3. Rewrites `wiki/index.md` with structured links and descriptions.
  4. Reports counts for each page category.

---

### `validate-tags.command.ts`

- **Function**: `runValidateTags(workspaceRoot: string): Promise<number>`
- **Wired Adapters**:
  - `FileSystemAdapter` (from `@wiki/infrastructure-filesystem`)
  - `FrontmatterAdapter` (from `@wiki/infrastructure-frontmatter`)
- **Use Case**: `ValidateTagDistributionUseCase` (from `@wiki/application-tag-validation`)
- **Target Command**: `nx run wiki-cli:validate-tags`
- **Behavior**:
  1. Scans all wiki pages to compute tag frequencies across the corpus.
  2. Evaluates each tag against a **60% maximum frequency threshold**.
  3. Displays a formatted table listing the top 20 most frequent tags, counts, frequencies, and PASS/FAIL statuses.
  4. Outputs actionable recommendations if threshold violations exist.
- **Return Code**:
  - `0`: Validation passed (no tags exceed 60%).
  - `1`: Validation failed (one or more tags exceed 60%).

---

### `init.command.ts`

- **Function**: `runInit(workspaceRoot: string): Promise<void>`
- **Wired Adapters**:
  - `FileSystemAdapter` (from `@wiki/infrastructure-filesystem`)
- **Use Case**: `ScaffoldWikiUseCase` (from `@wiki/application-scaffolding`)
- **Target Command**: `nx run wiki-cli:init`
- **Behavior**:
  1. Performs informational checks for existing Angular project markers (`apps/`, `libs/`, `.kiro/`, `angular.json`).
  2. Invokes `ScaffoldWikiUseCase` to ensure `wiki/` and `raw/` directory hierarchies exist.
  3. Reports created vs. existing directories.
  4. Displays helpful next steps for workspace setup.
