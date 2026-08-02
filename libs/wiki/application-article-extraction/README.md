# Article Extraction Pipeline (`libs/wiki/application-article-extraction`)

`@wiki/application-article-extraction` handles parsing external web articles, blog posts, and raw documentation files into normalized source data ready for ingestion into the wiki knowledge base.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Application Use Cases & Extraction Pipeline
- **Core Responsibility**: Extracts main text content, cleans HTML/Markdown markup, parses author and publishing date headers from external raw articles.
- **Upstream Dependencies**: `@wiki/domain-*`, `@wiki/application-ports`
- **Downstream Consumers**: Article research skills, ingestion workflows.

---

## ⚡ Domain Capabilities

- **Article Content Normalization**: Extracts core article text while stripping navigation elements, ads, and unneeded markup.
- **Metadata Discovery**: Extracts publication date, author details, source URL, and suggested tags.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/extract-article.use-case.ts`](./src/lib/extract-article.use-case.ts) | Use case extracting normalized source data from raw article inputs. |
