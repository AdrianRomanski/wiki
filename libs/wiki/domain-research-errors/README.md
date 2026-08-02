# Research Domain Errors (`libs/wiki/domain-research-errors`)

`@wiki/domain-research-errors` provides domain-specific exception hierarchies for research workflows, ADR ingestion failures, session validation errors, and pipeline interruptions.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Pure Domain Exceptions
- **Core Responsibility**: Provides strongly-typed domain error classes with error codes, contextual diagnostics, and failure recovery hints.
- **Upstream Dependencies**: None
- **Downstream Consumers**: Research workflow services, ADR processors, CLI tools, and subagents.

---

## ⚡ Domain Capabilities

- **Structured Error Hierarchy**: Base domain error class with specialized subclasses (`SessionNotFoundError`, `InvalidADRFormatError`, `IngestionPipelineError`).
- **Diagnostic Metadata**: Attaches file paths, session IDs, and validation failure details to thrown exceptions for clean debugging.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/research-error.ts`](./src/lib/research-error.ts) | Base domain error class and specialized research pipeline exceptions. |
