# Wiki Workflow Orchestration (`libs/wiki/application-workflow`)

`@wiki/application-workflow` provides high-level orchestrator classes coordinating multi-step processes—such as raw source ingestion, document updates, index synchronization, and health maintenance runs.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: High-Level Application Workflows
- **Core Responsibility**: Coordinates sequence execution across page generators, cross-reference linkers, file system adapters, and activity loggers.
- **Upstream Dependencies**: All `@wiki/application-*` use case libraries and `@wiki/application-ports`
- **Downstream Consumers**: CLI commands (`apps/wiki-cli`), facade (`@wiki/core`), automated pipeline triggers.

---

## ⚡ Domain Capabilities

- **Source Ingestion Workflow (`IngestSourceWorkflow`)**: Reads raw source documents (`raw/`), extracts entities/concepts/sources, inserts wikilinks, updates indices, and records activity log entries.
- **Page Update Workflow (`UpdatePageWorkflow`)**: Handles safe updating of existing markdown pages while preserving cross-references and updating timestamp headers.
- **Index Maintenance Workflow (`GenerateIndexWorkflow`)**: Orchestrates index file and manifest regenerations.
- **Maintenance Execution Workflow (`MaintenanceWorkflow`)**: Runs all health check use cases and outputs summary reports.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/ingest-source.workflow.ts`](./src/lib/ingest-source.workflow.ts) | Orchestrates complete raw document ingestion pipeline. |
| [`./src/lib/update-page.workflow.ts`](./src/lib/update-page.workflow.ts) | Orchestrates safe wiki page update sequence. |
| [`./src/lib/generate-index.workflow.ts`](./src/lib/generate-index.workflow.ts) | Orchestrates index and manifest generation. |
| [`./src/lib/maintenance.workflow.ts`](./src/lib/maintenance.workflow.ts) | Orchestrates comprehensive health check execution. |
