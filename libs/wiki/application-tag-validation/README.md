# application-tag-validation

Application Layer library for validating tag distribution across wiki pages.

Provides `ValidateTagDistributionUseCase`, which computes per-tag frequency
across `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/` pages (via
`FileSystemPort` and `FrontmatterPort`) and reports whether any tag exceeds
the 60% frequency threshold.
