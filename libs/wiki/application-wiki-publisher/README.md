# Wiki Content Publisher (`libs/wiki/application-wiki-publisher`)

`@wiki/application-wiki-publisher` provides use cases for publishing generated or modified wiki pages to output destinations, ensuring file writing safety, and synchronizing wiki state.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Manages safe file writing target updates, output path resolution, and publication atomic state tracking.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: Ingestion workflows, CLI commands, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Page Publisher Use Case**: Writes generated wiki page models to disk with target overwrite checks and formatting validation.
- **Batch Output Synchronization**: Publishes multi-page ingestion results atomically.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/publish-wiki-page.use-case.ts`](./src/lib/publish-wiki-page.use-case.ts) | Use case publishing wiki pages to target file system destinations. |
