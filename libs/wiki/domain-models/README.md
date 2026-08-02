# Wiki Domain Models (`libs/wiki/domain-models`)

`@wiki/domain-models` defines the fundamental business entities, value objects, and domain data structures of the LLM Wiki Knowledge System with zero external framework or I/O dependencies.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Pure Domain Model
- **Core Responsibility**: Encapsulates core business concepts (`WikiPage`, `WikiPageFrontmatter`, `Section`, `RawSource`, `ActivityLogEntry`, `MaintenanceReport`).
- **Upstream Dependencies**: None (Zero external dependencies)
- **Downstream Consumers**: All `@wiki/application-*`, `@wiki/infrastructure-*`, and `@wiki/core` libraries.

---

## ⚡ Domain Capabilities

- **Structured Page Representation (`WikiPage`)**: Represents complete wiki documents containing parsed YAML frontmatter metadata, structured content sections, and extracted cross-reference links.
- **Frontmatter Metadata Schema (`WikiPageFrontmatter`)**: Defines standardized document attributes (`title`, `type`, `tags`, `sources`, `created`, `updated`).
- **Raw Document Entity (`RawSource`)**: Models immutable source files (`raw/`) prior to wiki ingestion.
- **Activity & Health Models**: Provides value objects for activity logging entries and wiki health maintenance reports.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/wiki-page.model.ts`](./src/lib/wiki-page.model.ts) | Domain entity modeling wiki pages, sections, frontmatter, and cross-references. |
| [`./src/lib/raw-source.model.ts`](./src/lib/raw-source.model.ts) | Domain entity modeling raw source documents ingested into the system. |
| [`./src/lib/activity-log.model.ts`](./src/lib/activity-log.model.ts) | Value objects for chronological wiki activity logging. |
| [`./src/lib/maintenance.model.ts`](./src/lib/maintenance.model.ts) | Domain models for wiki health check results, broken links, and duplicate reports. |
