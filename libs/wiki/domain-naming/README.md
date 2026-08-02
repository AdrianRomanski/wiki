# Wiki Domain Naming (`libs/wiki/domain-naming`)

`@wiki/domain-naming` encapsulates domain rules, regex validators, and transformation functions for wiki filenames, kebab-case conventions, and document title normalization.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Pure Domain Rules
- **Core Responsibility**: Enforces file naming standards (`kebab-case.md`), date-suffixed source filenames (`title-YYYY-MM-DD.md`), and validates names against category rules (`entities`, `concepts`, `sources`).
- **Upstream Dependencies**: None
- **Downstream Consumers**: `@wiki/application-*`, `@wiki/core`, `@wiki/domain-validation`.

---

## ⚡ Domain Capabilities

- **Strict Kebab-Case Validation**: Validates string compliance against strict lowercase alphanumeric hyphenated patterns (`isKebabCase`).
- **Filename Generation**: Transforms document titles into valid, sanitized filenames according to page category (`generateFilename`).
- **Type-Specific Name Validation**: Enforces specialized naming rules for Entity pages, Concept pages, and Source Summary pages.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/kebab-case.ts`](./src/lib/kebab-case.ts) | Pure functions for kebab-case string transformation and validation. |
| [`./src/lib/name-validation.ts`](./src/lib/name-validation.ts) | Domain validators for entity, concept, and source summary filenames. |
| [`./src/lib/filename-generator.ts`](./src/lib/filename-generator.ts) | Filename generator for titles, page types, and date suffixes. |
