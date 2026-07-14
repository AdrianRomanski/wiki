import { FetchResult } from '@wiki/domain-research-session';

export interface ArticleFetchPort {
  /**
   * Performs an HTTP GET for article content with a bounded timeout.
   * Returns a FetchResult; never throws for network/HTTP failures —
   * failures are represented in the returned FetchResult.
   */
  fetchArticle(url: string): Promise<FetchResult>;
}
