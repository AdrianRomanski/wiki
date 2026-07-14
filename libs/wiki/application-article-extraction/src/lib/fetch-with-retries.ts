/**
 * Retry/abort orchestration policy for article fetching.
 * Feature: article-research-session
 *
 * This module contains only pure Application Layer logic: the URL
 * validation gate and the retry-vs-switch-to-pasted-text decision loop.
 * The single impure step (the actual HTTP call) is delegated to
 * `ArticleFetchPort.fetchArticle`, injected by the caller. This keeps the
 * retry policy fully testable with a mock/fake port and free of any
 * concrete Infrastructure dependency.
 */

import type { ArticleFetchPort } from '@wiki/application-ports';
import type { FetchResult } from '@wiki/domain-research-session';
import { validateUrl } from '@wiki/domain-research-session';

/** Maximum number of fetch attempts before treating the URL as permanently unreachable. */
export const MAX_RETRIES = 3;

/** Choice presented to the caller when a fetch attempt fails but retries remain. */
export type FetchFailureChoice = 'retry' | 'switch-to-pasted-text';

/** Result of fetchWithRetries including the final FetchResult and the number of attempts made. */
export interface FetchWithRetriesResult {
  /** The final FetchResult after all attempts */
  result: FetchResult;
  /** Number of attempts made (1 = initial attempt only, up to MAX_RETRIES) */
  attempts: number;
}

/**
 * Fetches article content with automatic retry support (up to MAX_RETRIES attempts),
 * delegating the actual network call to the injected ArticleFetchPort.
 *
 * The URL is validated before any fetch attempt is made; an invalid URL fails
 * immediately without consuming a retry or calling the port.
 *
 * On each failure with retries remaining, the caller can decide whether to
 * retry or switch to pasted-text input via the optional `choiceHandler`
 * callback. If no handler is provided, the function retries automatically
 * up to MAX_RETRIES times.
 *
 * @param port - ArticleFetchPort used to perform the actual HTTP GET
 * @param url - The URL to fetch article content from
 * @param choiceHandler - Optional callback invoked on failure (with retries
 *   remaining) to get the caller's choice. Receives the current FetchResult
 *   and the attempt number just completed. Returns 'retry' to try again or
 *   'switch-to-pasted-text' to abort further attempts.
 * @returns The final FetchWithRetriesResult after all attempts or caller abort
 */
export async function fetchWithRetries(
  port: ArticleFetchPort,
  url: string,
  choiceHandler?: (result: FetchResult, attempt: number) => Promise<FetchFailureChoice>
): Promise<FetchWithRetriesResult> {
  if (!validateUrl(url)) {
    return {
      result: {
        success: false,
        errorReason: 'Invalid URL: must begin with http:// or https://',
      },
      attempts: 0,
    };
  }

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;
    const result = await port.fetchArticle(url);

    if (result.success) {
      return { result, attempts };
    }

    // If this was the last allowed attempt, return failure.
    if (attempts >= MAX_RETRIES) {
      return { result, attempts };
    }

    // Ask the caller what to do (if a handler was provided).
    if (choiceHandler) {
      const choice = await choiceHandler(result, attempts);
      if (choice === 'switch-to-pasted-text') {
        return { result, attempts };
      }
      // choice === 'retry' → continue loop
    }
    // No handler → auto-retry
  }

  // Unreachable in practice (loop always returns before exceeding MAX_RETRIES),
  // but satisfies TypeScript's control-flow analysis.
  return {
    result: {
      success: false,
      errorReason: 'Max retries exceeded',
    },
    attempts,
  };
}
