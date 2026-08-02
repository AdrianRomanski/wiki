# ADR Ingestion & Processing (`libs/wiki/application-adr`)

`@wiki/application-adr` provides use cases and workflows for parsing Architecture Decision Records (`decision.adr.md`), extracting decision drivers and comparison matrices, and ingesting them into structured wiki pages.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases & ADR Pipeline
- **Core Responsibility**: Automates the pipeline converting technical research ADRs into Entity pages, Concept pages, and Source Summaries while establishing bidirectional research-session links.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-generators`, `@wiki/application-ports`
- **Downstream Consumers**: Research workflow skills, CLI tools (`apps/wiki-cli`), `@wiki/core`.

---

## ⚡ Domain Capabilities

- **ADR Metadata Extraction (`ExtractADRMetadataUseCase`)**: Parses YAML frontmatter headers, decision outcomes, considered options, and comparison matrices from ADR documents.
- **ADR Page Generation (`GenerateADRPageUseCase`)**: Converts extracted ADR metadata into structured wiki pages.
- **Session Reference Linking (`LinkADRToSessionUseCase`)**: Establishes explicit links between generated wiki pages and original `.kiro/research/` session artifacts.
- **ADR Ingestion Workflow (`runADRIngestionWorkflow`)**: Complete end-to-end orchestrator for ADR ingestion.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/extract-adr-metadata.use-case.ts`](./src/lib/extract-adr-metadata.use-case.ts) | Extracts decision metadata, options, and comparison matrices. |
| [`./src/lib/generate-adr-page.use-case.ts`](./src/lib/generate-adr-page.use-case.ts) | Generates wiki pages from extracted ADR metadata. |
| [`./src/lib/link-adr-to-session.use-case.ts`](./src/lib/link-adr-to-session.use-case.ts) | Connects generated pages back to research session files. |
| [`./src/lib/adr-ingestion.workflow.ts`](./src/lib/adr-ingestion.workflow.ts) | End-to-end ADR ingestion workflow runner. |
