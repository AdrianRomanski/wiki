# Markdown Processing Adapter (`libs/wiki/infrastructure-markdown`)

`@wiki/infrastructure-markdown` implements the `MarkdownPort` interface for parsing markdown AST structures, manipulating section headings, and processing `[[wikilink]]` syntax using Markdown libraries (`marked`).

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Infrastructure Adapter
- **Core Responsibility**: Provides concrete implementations for parsing markdown text, extracting section blocks, formatting headings, and transforming wikilink text.
- **Implemented Port**: `MarkdownPort` (`@wiki/application-ports`)
- **Downstream Consumers**: Injected into `@wiki/core` facade and application workflows.

---

## ⚡ Domain Capabilities

- **Markdown AST Parsing**: Parses raw markdown text into tokens and structured section arrays.
- **Wikilink Syntax Processing**: Extracts target titles from `[[wikilink]]` strings and formats link references cleanly.
- **Section & Heading Manipulation**: Reads and replaces specific section blocks in markdown documents without corrupting surrounding formatting.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/markdown-adapter.ts`](./src/lib/markdown-adapter.ts) | Concrete adapter class implementing `MarkdownPort`. |
