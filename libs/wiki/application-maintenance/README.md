# Wiki Health & Maintenance (`libs/wiki/application-maintenance`)

`@wiki/application-maintenance` implements health check use cases for detecting broken `[[wikilink]]` references, duplicate entities, unlinked orphan pages, and generating maintenance reports.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Provides automated health check suite ensuring knowledge base integrity, link validity, and identifying orphaned or redundant pages.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`, `@wiki/application-cross-reference`
- **Downstream Consumers**: CLI maintenance targets, scheduled maintenance workflows, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Broken Link Detection (`DetectBrokenLinksUseCase`)**: Identifies `[[wikilink]]` targets pointing to non-existent document paths.
- **Orphan Page Detection (`DetectOrphansUseCase`)**: Identifies wiki pages with zero incoming backlinks (degree 0).
- **Duplicate & Overlap Detection (`DetectDuplicatesUseCase`)**: Scans for redundant page titles or duplicate entity definitions.
- **Maintenance Report Aggregator (`GenerateMaintenanceReportUseCase`)**: Combines all health checks into a unified `MaintenanceReport`.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/detect-broken-links.use-case.ts`](./src/lib/detect-broken-links.use-case.ts) | Scans for unresolved link targets. |
| [`./src/lib/detect-orphans.use-case.ts`](./src/lib/detect-orphans.use-case.ts) | Scans for isolated unlinked documents. |
| [`./src/lib/detect-duplicates.use-case.ts`](./src/lib/detect-duplicates.use-case.ts) | Scans for title collisions or redundant pages. |
| [`./src/lib/generate-maintenance-report.use-case.ts`](./src/lib/generate-maintenance-report.use-case.ts) | Aggregates all checks into a health report. |
