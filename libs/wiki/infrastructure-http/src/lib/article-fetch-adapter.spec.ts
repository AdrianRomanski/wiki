import { describe, it, expect, afterEach, vi } from 'vitest';

import { ArticleFetchAdapter } from './article-fetch-adapter';

/**
 * Integration tests for ArticleFetchAdapter.
 *
 * The global `fetch` is mocked via `vi.stubGlobal` for every case. For the
 * timeout scenario we do NOT rely on the adapter's real 30s
 * `setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)` wiring - instead we
 * mock `fetch` itself to directly reject with an `AbortError`-named `Error`,
 * simulating what the internal AbortController produces when it fires. This
 * keeps the test fast (no real waiting, no fake timers) while still
 * exercising the exact catch-branch the adapter uses to translate an abort
 * into a `FetchResult`.
 */
describe('ArticleFetchAdapter', () => {
  const adapter = new ArticleFetchAdapter();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns success with content and status code on a 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'content',
      })
    );

    const result = await adapter.fetchArticle('https://example.com/article');

    expect(result).toEqual({
      success: true,
      content: 'content',
      statusCode: 200,
    });
  });

  it('returns a failure result with statusCode and errorReason on a non-200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );

    const result = await adapter.fetchArticle('https://example.com/missing');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.errorReason).toEqual(expect.stringContaining('404'));
  });

  it('returns a failure result mentioning a timeout when fetch rejects with an AbortError', async () => {
    const abortError = Object.assign(new Error('The operation was aborted'), {
      name: 'AbortError',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const result = await adapter.fetchArticle('https://example.com/slow');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeUndefined();
    expect(result.errorReason).toEqual(expect.stringContaining('timed out'));
  });

  it('returns a failure result mentioning a network error for generic fetch rejections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await adapter.fetchArticle('https://example.com/unreachable');

    expect(result.success).toBe(false);
    expect(result.errorReason).toEqual(expect.stringContaining('Network error'));
  });
});
