# Wiki Application Ports (`libs/wiki/application-ports`)

`@wiki/application-ports` defines abstract boundary port interfaces for file system access, markdown rendering, YAML frontmatter processing, and network operations following Clean Architecture principles.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Boundary Ports (Contracts)
- **Core Responsibility**: Provides TypeScript port interfaces (`FileSystemPort`, `MarkdownPort`, `FrontmatterPort`, `HttpPort`) decoupling application use cases from concrete technical adapters.
- **Upstream Dependencies**: `@wiki/domain-models`
- **Downstream Consumers**: All `@wiki/application-*` use cases, `@wiki/infrastructure-*` adapters, and `@wiki/core`.

---

## ⚡ Domain Capabilities

- **File System Port Contract (`FileSystemPort`)**: Interface for reading, writing, searching, and validating directory paths across `wiki/`, `raw/`, and research folders.
- **Markdown Port Contract (`MarkdownPort`)**: Interface for AST parsing, section extraction, and link syntax manipulation.
- **Frontmatter Port Contract (`FrontmatterPort`)**: Interface for parsing and serializing YAML header blocks.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/filesystem.port.ts`](./src/lib/filesystem.port.ts) | Interface defining file system read, write, directory scanning, and check operations. |
| [`./src/lib/markdown.port.ts`](./src/lib/markdown.port.ts) | Interface defining markdown parsing, section extraction, and link manipulation. |
| [`./src/lib/frontmatter.port.ts`](./src/lib/frontmatter.port.ts) | Interface defining YAML frontmatter parsing, validation, and serialization. |
