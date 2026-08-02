# Research Session Management (`libs/wiki/application-research-session`)

`@wiki/application-research-session` provides application use cases for initiating, pausing, resuming, and finalizing interactive technical research sessions and saving session artifacts.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Manages research session state lifecycles (`.kiro/research/sessions/`), stores session reports, prototype evaluations, and coordinates finalize triggers.
- **Upstream Dependencies**: `@wiki/domain-research-session`, `@wiki/application-ports`
- **Downstream Consumers**: Research assistant skills, research workflows, CLI runners.

---

## ⚡ Domain Capabilities

- **Session Initialization (`StartResearchSessionUseCase`)**: Scaffolds research session folder, initializes questionnaires, and sets active status.
- **Session State Transitions (`PauseResearchSessionUseCase`, `ResumeResearchSessionUseCase`)**: Manages pausing and resuming research sessions seamlessly.
- **Research Finalization (`FinalizeResearchSessionUseCase`)**: Finalizes session findings, generates decision ADRs, and triggers wiki ingestion.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/start-research-session.use-case.ts`](./src/lib/start-research-session.use-case.ts) | Use case initializing new research session directories. |
| [`./src/lib/finalize-research-session.use-case.ts`](./src/lib/finalize-research-session.use-case.ts) | Use case finalizing research findings and generating ADRs. |
