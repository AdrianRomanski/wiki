# Wiki Domain Validation (`libs/wiki/domain-validation`)

`@wiki/domain-validation` provides business rules and validators for verifying frontmatter metadata completeness, document section hierarchies, and cross-reference integrity.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Pure Domain Logic
- **Core Responsibility**: Enforces structural validity of wiki pages, YAML metadata compliance, and cross-reference sanity rules.
- **Upstream Dependencies**: `@wiki/domain-models`, `@wiki/domain-naming`
- **Downstream Consumers**: Application use cases (`@wiki/application-*`) and facade (`@wiki/core`).

---

## ⚡ Domain Capabilities

- **Frontmatter Metadata Validation**: Ensures mandatory YAML fields (`title`, `type`, `tags`) are present and valid.
- **Document Structure Checking**: Verifies heading hierarchies, section titles, and markdown layout standards.
- **Cross-Reference Validation**: Checks internal `[[wikilink]]` syntax validity and prevents circular self-references.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/frontmatter-validation.ts`](./src/lib/frontmatter-validation.ts) | Pure functions validating frontmatter fields, dates, and tag formats. |
| [`./src/lib/structure-validation.ts`](./src/lib/structure-validation.ts) | Pure functions validating heading structure and section content. |
| [`./src/lib/reference-validation.ts`](./src/lib/reference-validation.ts) | Pure functions validating cross-reference link formats and targets. |
