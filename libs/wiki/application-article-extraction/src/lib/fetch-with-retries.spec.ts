/**
 * Unit tests for the fetchWithRetries retry/abort orchestration policy.
 * Feature: article-research-session
 * Requirements: 6.1, 6.4, 6.6
 *
 * Adapted from the pre-migration `fetch-from-url.test.ts` fetchWithRetries
 * suite: exercises the pure retry policy over a scripted `ArticleFetchPort`
 * double so no real network access is required.
 */

import { describe, it, expect, vi } from 'vitest';
import type { ArticleFetchPort } from '@wiki/application-ports';
import type { FetchResult } from '@wiki/domain-research-session';
import { fetchWithRetries, MAX_RETRIES } from './fetch-with-retries';

/**
 * Test double for ArticleFetchPort that returns a scripted sequence of
 * FetchResults, one per call to fetchArticle. If the queue is exhausted,
 * the last provided result is repeated (mirroring `mockResolvedValue`
 * fallback behavior from the pre-migration vi.fn() mocks).
 */
class FakeArticleFetchPort implements ArticleFetchPort {
  private readonly queue: FetchResult[];
  private index = 0;
  readonly calls: string[] = [];

  constructor(results: FetchResult[]) {
    this.queue = results;
  }

  async fetchArticle(url: string): Promise<FetchResult> {
    this.calls.push(url);
    const result = this.queue[Math.min(this.index, this.queue.length - 1)];
    this.index++;
    return result;
  }
}

const successResult: FetchResult = {
  success: true,
  content: 'Article content',
  statusCode: 200,
};

const notFoundResult: FetchResult = {
  success: false,
  statusCode: 404,
  errorReason: 'HTTP 404: Not Found',
};

const serverErrorResult: FetchResult = {
  success: false,
  statusCode: 500,
  errorReason: 'HTTP 500: Server Error',
};

describe('fetchWithRetries', () => {
  it('returns immediately on success (1 attempt)', async () => {
    const port = new FakeArticleFetchPort([successResult]);

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(1);
    expect(port.calls).toHaveLength(1);
  });

  it('retries automatically up to MAX_RETRIES without a choice handler', async () => {
    const port = new FakeArticleFetchPort([notFoundResult]);

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/missing'
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(MAX_RETRIES);
    expect(port.calls).toHaveLength(MAX_RETRIES);
  });

  it('succeeds on second attempt after initial failure', async () => {
    const port = new FakeArticleFetchPort([serverErrorResult, successResult]);

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(2);
  });

  it('succeeds on third attempt after two failures (exhausts up to MAX_RETRIES)', async () => {
    const port = new FakeArticleFetchPort([
      serverErrorResult,
      serverErrorResult,
      successResult,
    ]);

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(3);
  });

  it('exhausts MAX_RETRIES (3) and returns final failure', async () => {
    const port = new FakeArticleFetchPort([
      serverErrorResult,
      serverErrorResult,
      serverErrorResult,
    ]);

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/broken'
    );

    expect(result.success).toBe(false);
    expect(result).toEqual(serverErrorResult);
    expect(attempts).toBe(MAX_RETRIES);
    expect(port.calls).toHaveLength(MAX_RETRIES);
  });

  it('fails invalid URL immediately without calling the port at all (0 attempts)', async () => {
    const port = new FakeArticleFetchPort([successResult]);

    const { result, attempts } = await fetchWithRetries(port, 'ftp://invalid.com');

    expect(result.success).toBe(false);
    expect(result.errorReason).toContain('Invalid URL');
    expect(attempts).toBe(0);
    expect(port.calls).toHaveLength(0);
  });

  it('stops retrying when choice handler returns switch-to-pasted-text', async () => {
    const port = new FakeArticleFetchPort([notFoundResult]);
    const choiceHandler = vi.fn().mockResolvedValue('switch-to-pasted-text');

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/missing',
      choiceHandler
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(1);
    expect(port.calls).toHaveLength(1);
    expect(choiceHandler).toHaveBeenCalledTimes(1);
    expect(choiceHandler).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, statusCode: 404 }),
      1
    );
  });

  it('continues retrying when choice handler returns retry, and does not call the handler on the final attempt', async () => {
    const port = new FakeArticleFetchPort([serverErrorResult]);
    const choiceHandler = vi.fn().mockResolvedValue('retry');

    const { result, attempts } = await fetchWithRetries(
      port,
      'https://example.com/broken',
      choiceHandler
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(MAX_RETRIES);
    expect(port.calls).toHaveLength(MAX_RETRIES);
    // Handler is asked after attempts 1 and 2, not after the final attempt (3).
    expect(choiceHandler).toHaveBeenCalledTimes(MAX_RETRIES - 1);
  });
});
