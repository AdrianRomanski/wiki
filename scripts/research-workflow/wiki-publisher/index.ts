/**
 * Wiki_Publisher subsystem
 * Feature: article-research-session
 *
 * Responsible for generating and writing wiki pages (entities, concepts, sources)
 * from the findings summary, and maintaining cross-references between pages.
 */

export { constructSourcePagePath } from './source-page-path';
export { generateSourcePage } from './generate-source-page';
export type { SourcePageParams } from './generate-source-page';
export { publishEntityPages, publishConceptPages } from './publish-pages';
export type { PublishResult } from './publish-pages';
export { addReciprocalReferences } from './reciprocal-references';
export {
  regenerateManifestAndIndex,
  verifyManifestEntries,
  verifyIndexEntries,
  rollbackPages,
} from './regenerate-manifest-index';

// article-author-source-discovery exports
export { extractDomain, domainToSlug } from './domain-extractor';
export {
  generateAuthorPage,
  publishAuthorPage,
  generateAuthorSlug,
} from './generate-author-page';
export type {
  AuthorPageParams,
  AuthorPageResult,
} from './generate-author-page';
export {
  generatePublicationSourcePage,
  publishPublicationSourcePage,
} from './generate-publication-source-page';
export type {
  PublicationSourcePageParams,
  PublicationSourcePageResult,
} from './generate-publication-source-page';
