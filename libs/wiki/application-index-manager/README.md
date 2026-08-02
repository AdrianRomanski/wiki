# Wiki Index Manager (`libs/wiki/application-index-manager`)

`@wiki/application-index-manager` provides application use cases for scanning `wiki/` content and generating top-level index documents (`wiki/index.md`) and static JSON manifests (`wiki/manifest.json`).

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Maintains workspace-wide navigation indices, categorized page lists, and static JSON manifest payloads consumed by search tools and graph visualizers.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: CLI targets (`apps/wiki-cli`), workflow orchestrators, and `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Markdown Index Generation (`GenerateIndexUseCase`)**: Compiles `wiki/index.md` with structured sections for entities, concepts, and recent sources.
- **Manifest File Generation (`GenerateManifestUseCase`)**: Produces `wiki/manifest.json` containing relative file paths, page classifications, and generation timestamps.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/generate-index.use-case.ts`](./src/lib/generate-index.use-case.ts) | Use case generating structured `wiki/index.md` markdown overview. |
| [`./src/lib/generate-manifest.use-case.ts`](./src/lib/generate-manifest.use-case.ts) | Use case scanning directory files and building `wiki/manifest.json`. |
