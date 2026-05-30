/**
 * Unit tests for article fetching from URL
 * Feature: article-research-session
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchFromUrl,
  fetchWithRetries,
  MAX_RETRIES,
  FETCH_TIMEOUT_MS,
} from './fetch-from-url';
import type { FetchResult } from '../types/article-session';

describe('fetchFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL validation', () => {
    it('rejects invalid URLs without making a network request', async () => {
      const result = await fetchFromUrl('ftp://example.com');
      expect(result.success).toBe(false);
      expect(result.errorReason).toContain('Invalid URL');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects empty string', async () => {
      const result = await fetchFromUrl('');
      expect(result.success).toBe(false);
      expect(result.errorReason).toContain('Invalid URL');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('successful fetch', () => {
    it('returns content on HTTP 200', async () => {
      const mockContent = '<html><body>Article content</body></html>';
      vi.mocked(fetch).mockResolvedValue(
        new Response(mockContent, { status: 200, statusText: 'OK' })
      );

      const result = await fetchFromUrl('https://example.com/article');

      expect(result.success).toBe(true);
      expect(result.content).toBe(mockContent);
      expect(result.statusCode).toBe(200);
      expect(result.errorReason).toBeUndefined();
    });

    it('passes AbortSignal to fetch for timeout control', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('content', { status: 200 })
      );

      await fetchFromUrl('https://example.com/article');

      expect(fetch).toHaveBeenCalledWith('https://example.com/article', {
        method: 'GET',
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('HTTP error responses', () => {
    it('returns failure with status code on 404', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
      );

      const result = await fetchFromUrl('https://example.com/missing');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.errorReason).toBe('HTTP 404: Not Found');
    });

    it('returns failure with status code on 500', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

      const result = await fetchFromUrl('https://example.com/broken');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.errorReason).toBe('HTTP 500: Internal Server Error');
    });

    it('returns failure with status code on 403', async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      );

      const result = await fetchFromUrl('https://example.com/private');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.errorReason).toBe('HTTP 403: Forbidden');
    });
  });

  describe('timeout handling', () => {
    it('returns timeout error when request exceeds 30 seconds', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValue(abortError);

      const result = await fetchFromUrl('https://slow-server.com/article');

      expect(result.success).toBe(false);
      expect(result.errorReason).toBe('Request timed out after 30 seconds');
      expect(result.statusCode).toBeUndefined();
    });
  });

  describe('network errors', () => {
    it('returns network error on DNS failure', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND nonexistent.example.com')
      );

      const result = await fetchFromUrl('https://nonexistent.example.com');

      expect(result.success).toBe(false);
      expect(result.errorReason).toContain('Network error');
      expect(result.errorReason).toContain('ENOTFOUND');
    });

    it('returns network error on connection refused', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new Error('connect ECONNREFUSED 127.0.0.1:443')
      );

      const result = await fetchFromUrl('https://localhost/article');

      expect(result.success).toBe(false);
      expect(result.errorReason).toContain('Network error');
      expect(result.errorReason).toContain('ECONNREFUSED');
    });

    it('handles non-Error thrown values', async () => {
      vi.mocked(fetch).mockRejectedValue('unexpected string error');

      const result = await fetchFromUrl('https://example.com/article');

      expect(result.success).toBe(false);
      expect(result.errorReason).toBe('Network error: Unknown network error');
    });
  });

  describe('constants', () => {
    it('MAX_RETRIES is 3', () => {
      expect(MAX_RETRIES).toBe(3);
    });

    it('FETCH_TIMEOUT_MS is 30000', () => {
      expect(FETCH_TIMEOUT_MS).toBe(30_000);
    });
  });
});

describe('fetchWithRetries', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns immediately on success (1 attempt)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Article content', { status: 200 })
    );

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries automatically up to MAX_RETRIES without a choice handler', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' })
    );

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/missing'
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(MAX_RETRIES);
    expect(fetch).toHaveBeenCalledTimes(MAX_RETRIES);
  });

  it('succeeds on second attempt after initial failure', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response('Error', { status: 500, statusText: 'Server Error' })
      )
      .mockResolvedValueOnce(
        new Response('Article content', { status: 200 })
      );

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(2);
  });

  it('succeeds on third attempt after two failures', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response('Error', { status: 503, statusText: 'Service Unavailable' })
      )
      .mockResolvedValueOnce(
        new Response('Error', { status: 503, statusText: 'Service Unavailable' })
      )
      .mockResolvedValueOnce(
        new Response('Article content', { status: 200 })
      );

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/article'
    );

    expect(result.success).toBe(true);
    expect(result.content).toBe('Article content');
    expect(attempts).toBe(3);
  });

  it('stops retrying when choice handler returns switch-to-pasted-text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' })
    );

    const choiceHandler = vi.fn().mockResolvedValue('switch-to-pasted-text');

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/missing',
      choiceHandler
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(choiceHandler).toHaveBeenCalledTimes(1);
    expect(choiceHandler).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, statusCode: 404 }),
      1
    );
  });

  it('continues retrying when choice handler returns retry', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response('Error', { status: 500, statusText: 'Server Error' })
      )
      .mockResolvedValueOnce(
        new Response('Error', { status: 500, statusText: 'Server Error' })
      )
      .mockResolvedValueOnce(
        new Response('Error', { status: 500, statusText: 'Server Error' })
      );

    const choiceHandler = vi.fn().mockResolvedValue('retry');

    const { result, attempts } = await fetchWithRetries(
      'https://example.com/broken',
      choiceHandler
    );

    expect(result.success).toBe(false);
    expect(attempts).toBe(MAX_RETRIES);
    expect(fetch).toHaveBeenCalledTimes(MAX_RETRIES);
    // Handler called for attempts 1 and 2 (not the last one)
    expect(choiceHandler).toHaveBeenCalledTimes(MAX_RETRIES - 1);
  });

  it('does not call choice handler on the final attempt', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Error', { status: 500, statusText: 'Server Error' })
    );

    const choiceHandler = vi.fn().mockResolvedValue('retry');

    await fetchWithRetries('https://example.com/broken', choiceHandler);

    // MAX_RETRIES = 3, handler called on attempts 1 and 2, not on 3
    expect(choiceHandler).toHaveBeenCalledTimes(MAX_RETRIES - 1);
  });

  it('returns invalid URL error without retrying', async () => {
    const { result, attempts } = await fetchWithRetries('ftp://invalid.com');

    expect(result.success).toBe(false);
    expect(result.errorReason).toContain('Invalid URL');
    expect(attempts).toBe(MAX_RETRIES);
    expect(fetch).not.toHaveBeenCalled();
  });
});
