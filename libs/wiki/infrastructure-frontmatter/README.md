# Frontmatter Processing Adapter (`libs/wiki/infrastructure-frontmatter`)

`@wiki/infrastructure-frontmatter` implements the `FrontmatterPort` interface using `gray-matter` for parsing and serializing YAML frontmatter headers embedded in markdown documents.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Infrastructure Adapter
- **Core Responsibility**: Provides concrete YAML parsing and stringification implementations for extracting metadata headers from markdown files.
- **Implemented Port**: `FrontmatterPort` (`@wiki/application-ports`)
- **Downstream Consumers**: Injected into `@wiki/core` facade and application workflows.

---

## ⚡ Domain Capabilities

- **YAML Header Parsing**: Extracts frontmatter attributes (`title`, `type`, `tags`, `sources`, `created`, `updated`) from markdown documents.
- **YAML Header Serialization**: Formats frontmatter JavaScript objects into clean, standardized YAML header blocks.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/frontmatter-adapter.ts`](./src/lib/frontmatter-adapter.ts) | Concrete adapter class implementing `FrontmatterPort` using `gray-matter`. |
