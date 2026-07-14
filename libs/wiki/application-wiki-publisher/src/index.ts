/**
 * Wiki_Publisher subsystem — Application Layer use cases
 * Feature: article-research-session
 *
 * Responsible for generating and writing wiki pages (entities, concepts, sources)
 * from the findings summary, and maintaining cross-references between pages.
 */

export { constructSourcePagePath } from './lib/source-page-path';
export { generateSourcePage } from './lib/generate-source-page';
export type { SourcePageParams } from './lib/generate-source-page';
export { publishEntityPages, publishConceptPages } from './lib/publish-pages';
export type { PublishResult } from './lib/publish-pages';
export { addReciprocalReferences } from './lib/reciprocal-references';

// article-author-source-discovery exports
export {
  generateAuthorPage,
  publishAuthorPage,
  generateAuthorSlug,
} from './lib/generate-author-page';
export type {
  AuthorPageParams,
  AuthorPageResult,
} from './lib/generate-author-page';
export {
  generatePublicationSourcePage,
  publishPublicationSourcePage,
} from './lib/generate-publication-source-page';
export type {
  PublicationSourcePageParams,
  PublicationSourcePageResult,
} from './lib/generate-publication-source-page';

export {
  regenerateManifestAndIndex,
  verifyManifestEntries,
  verifyIndexEntries,
  rollbackPages,
} from './lib/regenerate-manifest-index';
