# application-article-extraction

Application Layer library for the Content_Extractor subsystem of the article
research workflow.

Provides use cases for turning raw article markdown into structured,
analyzable content:

- `parseArticle` — parses raw markdown (frontmatter + body) into an
  `ArticleContent` (title, author, date, body, code blocks, links). Pure
  function, no I/O.
- `identifyCandidates` — heuristically identifies candidate entity and
  concept names from article body text. Pure function, no I/O.
- `generateAnalysis` — renders `article-analysis.md` from `ArticleContent` +
  `ArticleMetadata` and writes it via `FileSystemPort.writeFile`.
- `saveArticleContent` / `loadArticleContent` — serializes/deserializes
  `article-content.json` via `FileSystemPort.writeFile` / `readFile`.

All session-directory file I/O is routed through the generic
`FileSystemPort.readFile` / `writeFile` methods (workspace-root-relative),
since research session directories (`.kiro/research/sessions/[id]/`) live
outside the `raw/` and `wiki/` trees that the port's other methods are scoped
to.
