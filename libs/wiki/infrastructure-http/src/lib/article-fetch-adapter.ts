import { ArticleFetchPort } from '@wiki/application-ports';
import { FetchResult } from '@wiki/domain-research-session';

/** HTTP GET timeout in milliseconds (30 seconds), matching the pre-migration article-fetcher. */
export const FETCH_TIMEOUT_MS = 30_000;

/**
 * Infrastructure Layer Driven_Adapter implementing ArticleFetchPort using the
 * global `fetch` API with a 30-second AbortController timeout.
 *
 * Never throws for network/HTTP failures: all such cases (non-200 status,
 * timeout, DNS/network errors) are translated into a FetchResult with
 * `success: false` and a human-readable `errorReason`.
 */
export class ArticleFetchAdapter implements ArticleFetchPort {
  async fetchArticle(url: string): Promise<FetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      if (response.ok) {
        const content = await response.text();
        return {
          success: true,
          content,
          statusCode: response.status,
        };
      }

      return {
        success: false,
        statusCode: response.status,
        errorReason: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          errorReason: 'Request timed out after 30 seconds',
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown network error';
      return {
        success: false,
        errorReason: `Network error: ${message}`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
