# Wiki Cross-Reference Management (`libs/wiki/application-cross-reference`)

`@wiki/application-cross-reference` provides use cases for detecting `[[wikilink]]` targets, validating link integrity, discovering incoming backlinks, and suggesting missing bidirectional connections.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Manages the topological link graph between wiki pages, ensuring all references point to valid destinations and encouraging dense inter-linking.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: Workflows (`@wiki/application-workflow`), maintenance checkers, and `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Cross-Reference Detection (`DetectCrossReferencesUseCase`)**: Scans document text to identify potential entity/concept names and matches them to wiki pages.
- **Link Insertion (`InsertCrossReferenceLinksUseCase`)**: Automatically wraps detected entity and concept mentions in `[[wikilink]]` syntax.
- **Link Validation (`ValidateWikiLinksUseCase`)**: Verifies whether `[[wikilink]]` targets exist or point to broken references.
- **Backlink Discovery & Suggestions**: Finds all incoming references to a given document and suggests missing reciprocal links.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/detect-cross-references.use-case.ts`](./src/lib/detect-cross-references.use-case.ts) | Scans text for entity/concept mentions. |
| [`./src/lib/insert-cross-reference-links.use-case.ts`](./src/lib/insert-cross-reference-links.use-case.ts) | Inserts `[[wikilink]]` syntax into content. |
| [`./src/lib/validate-wikilinks.use-case.ts`](./src/lib/validate-wikilinks.use-case.ts) | Validates existence of wikilink targets. |
| [`./src/lib/find-backlinks.use-case.ts`](./src/lib/find-backlinks.use-case.ts) | Computes incoming backlink sets for pages. |
| [`./src/lib/suggest-bidirectional-links.use-case.ts`](./src/lib/suggest-bidirectional-links.use-case.ts) | Suggests reciprocal links between connected pages. |
