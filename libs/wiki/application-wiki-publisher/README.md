# application-wiki-publisher

Application Layer library for the Wiki_Publisher subsystem of the article
research workflow.

Provides use cases for generating and writing wiki pages (entities, concepts,
sources) from a research session's findings summary, and maintaining
cross-references between pages:

- `constructSourcePagePath` — pure function building the normalized source
  page path (`wiki/sources/[slug]-article-[date].md`).
- `generateSourcePage` — pure function rendering the full source page markdown
  (frontmatter + body) from `SourcePageParams`. No I/O.
- `publishEntityPages` / `publishConceptPages` — create-or-append entity and
  concept wiki pages via `FileSystemPort`.
- `addReciprocalReferences` — inserts a reciprocal `[[Source Page]]` WikiLink
  into each target entity/concept page via `FileSystemPort`, accumulating
  `FailedReference`s for targets that could not be updated.
- `generateAuthorPage` / `publishAuthorPage` — pure generation and
  create-or-append publishing of author entity pages via `FileSystemPort` +
  `FrontmatterPort`.
- `generatePublicationSourcePage` / `publishPublicationSourcePage` — pure
  generation and create-or-append publishing of publication-source entity
  pages via `FileSystemPort` + `FrontmatterPort`.

All I/O is routed through `FileSystemPort`'s wiki-scoped methods
(`wikiFileExists`, `readWikiFile`, `writeWikiFile`) — callers pass paths
already relative to `wiki/` (e.g. `wiki/entities/foo.md`); these use cases
strip the `wiki/` prefix internally before calling the port. Frontmatter
parsing/rendering for the append (idempotent-update) path of author and
publication-source pages routes through `FrontmatterPort.parseFrontmatter` /
`generateFrontmatter` rather than the `gray-matter` package directly. Pure
markdown templating (the "create new page" pure builder functions) does not
parse or render existing frontmatter, so it remains plain string templating,
consistent with `generateSourcePage`.

Note: `regenerate-manifest-index` (the `execSync` shell-out to the manifest
and index CLI scripts) is migrated separately (task 8.2) and is intentionally
not part of this library yet.
