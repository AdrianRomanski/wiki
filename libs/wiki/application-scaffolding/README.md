# Wiki Directory Scaffolding (`libs/wiki/application-scaffolding`)

`@wiki/application-scaffolding` implements use cases for initializing and bootstrapping workspace directory structures (`wiki/`, `wiki/entities`, `wiki/concepts`, `wiki/sources`, `raw/`).

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Scaffolding Use Cases
- **Core Responsibility**: Initializes required directory hierarchies, seeds baseline `index.md` files, and ensures missing folders exist prior to ingestion runs.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: `nx run wiki-cli:init`, setup scripts, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Directory Scaffolding (`ScaffoldWikiDirectoriesUseCase`)**: Scaffolds standard folder hierarchy with appropriate initial overview markdown files.
- **Initialization Check**: Validates whether target directory structure is already present.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/scaffold-wiki-directories.use-case.ts`](./src/lib/scaffold-wiki-directories.use-case.ts) | Use case bootstrapping initial folder hierarchy and baseline files. |
