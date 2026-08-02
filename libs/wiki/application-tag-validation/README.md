# Tag Distribution Validation (`libs/wiki/application-tag-validation`)

`@wiki/application-tag-validation` provides use cases enforcing tag frequency distribution rules (such as ensuring no individual tag exceeds 60% of total document volume) to prevent tag dilution.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases
- **Core Responsibility**: Enforces tag quality policies, calculates tag frequency distributions across pages, and returns pass/fail validation metrics.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: `nx run wiki-cli:validate-tags`, CI workflows, `@wiki/core`.

---

## ⚡ Domain Capabilities

- **Tag Distribution Validation (`ValidateTagDistributionUseCase`)**: Computes occurrence frequencies for all YAML tags and checks them against the maximum 60% threshold limit.
- **Frequency Report Generation**: Returns structured breakdown of tag counts, percentages, and over-represented tags.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/validate-tag-distribution.use-case.ts`](./src/lib/validate-tag-distribution.use-case.ts) | Use case computing tag distribution metrics and enforcing 60% threshold rules. |
