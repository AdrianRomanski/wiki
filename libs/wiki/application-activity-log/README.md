# Wiki Activity Logging (`libs/wiki/application-activity-log`)

`@wiki/application-activity-log` handles recording chronological operation entries to `wiki/activity-log.md` and querying historical wiki modification events.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Maintains an immutable chronological audit trail of all ingestion, update, maintenance, and ADR publishing events.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: Ingestion workflows, CLI commands, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Activity Logging (`LogActivityUseCase`)**: Appends structured, timestamped log entries to `wiki/activity-log.md`.
- **History Querying (`QueryActivityLogUseCase`)**: Reads and parses historical log entries filtered by date range or operation type.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/log-activity.use-case.ts`](./src/lib/log-activity.use-case.ts) | Appends new activity log entries to `wiki/activity-log.md`. |
| [`./src/lib/query-activity-log.use-case.ts`](./src/lib/query-activity-log.use-case.ts) | Reads and parses activity log entries. |
