/**
 * Article_Fetcher subsystem
 * Feature: article-research-session
 *
 * Responsible for retrieving article content from a URL or accepting
 * pasted text, and saving it as raw-article.md in the session directory.
 */

export { validateUrl } from './validate-url';
export { acceptPastedText } from './accept-pasted-text';
export {
  fetchFromUrl,
  fetchWithRetries,
  MAX_RETRIES,
  FETCH_TIMEOUT_MS,
} from './fetch-from-url';
export type { FetchFailureChoice, FetchWithRetriesResult } from './fetch-from-url';
export { saveRawArticle, extractPublicationSource } from './save-raw-article';
