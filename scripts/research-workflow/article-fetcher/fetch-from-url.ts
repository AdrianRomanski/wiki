/**
 * Article fetching from URL for the Article_Fetcher subsystem
 * Feature: article-research-session
 * Requirements: 2.1, 2.3
 *
 * Retrieves article content from a URL using HTTP GET with a 30-second timeout.
 * Supports up to 3 retry attempts on failure. Returns a FetchResult indicating
 * success or failure with relevant details (content, status code, error reason).
 */

import { validateUrl } from './validate-url';
import type { FetchResult } from '../types/article-session';

/** Maximum number of retry attempts before treating URL as permanently unreachable */
export const MAX_RETRIES = 3;

/** HTTP GET timeout in milliseconds (30 seconds) */
export const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetches article content from a URL using HTTP GET with a 30-second timeout.
 *
 * The function first validates the URL format (must begin with http:// or https://),
 * then performs the HTTP GET request. On failure, it returns a FetchResult with
 * the error details. Retry logic is handled separately by `fetchWithRetries`.
 *
 * @param url - The URL to fetch article content from
 * @returns A FetchResult indicating success or failure
 */
export async function fetchFromUrl(url: string): Promise<FetchResult> {
  if (!validateUrl(url)) {
    return {
      success: false,
      errorReason: 'Invalid URL: must begin with http:// or https://',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    const message =
      error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      errorReason: `Network error: ${message}`,
    };
  }
}

/**
 * Choice presented to the user when a fetch permanently fails.
 */
export type FetchFailureChoice = 'retry' | 'switch-to-pasted-text';

/**
 * Result of fetchWithRetries including the final FetchResult and
 * the number of attempts made.
 */
export interface FetchWithRetriesResult {
  /** The final FetchResult after all attempts */
  result: FetchResult;
  /** Number of attempts made (1 = initial attempt, up to MAX_RETRIES + 1 if user retries) */
  attempts: number;
}

/**
 * Fetches article content with automatic retry support (up to 3 attempts).
 *
 * On each failure, the caller can decide whether to retry or switch to pasted-text
 * input by providing a `choiceHandler` callback. If no handler is provided,
 * the function retries automatically up to MAX_RETRIES times.
 *
 * @param url - The URL to fetch article content from
 * @param choiceHandler - Optional callback invoked on failure to get user's choice.
 *   Receives the current FetchResult and attempt number. Returns 'retry' to try again
 *   or 'switch-to-pasted-text' to abort.
 * @returns The final FetchWithRetriesResult after all attempts or user abort
 */
export async function fetchWithRetries(
  url: string,
  choiceHandler?: (
    result: FetchResult,
    attempt: number
  ) => Promise<FetchFailureChoice>
): Promise<FetchWithRetriesResult> {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;
    const result = await fetchFromUrl(url);

    if (result.success) {
      return { result, attempts };
    }

    // If this was the last allowed attempt, return failure
    if (attempts >= MAX_RETRIES) {
      return { result, attempts };
    }

    // Ask the user what to do (if handler provided)
    if (choiceHandler) {
      const choice = await choiceHandler(result, attempts);
      if (choice === 'switch-to-pasted-text') {
        return { result, attempts };
      }
      // choice === 'retry' → continue loop
    }
    // No handler → auto-retry
  }

  // Should not reach here, but satisfy TypeScript
  return {
    result: {
      success: false,
      errorReason: 'Max retries exceeded',
    },
    attempts,
  };
}
