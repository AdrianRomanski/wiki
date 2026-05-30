/**
 * URL validation utility for the Article_Fetcher subsystem
 * Feature: article-research-session
 * Requirements: 2.7
 *
 * Validates that a URL begins with `http://` or `https://` before
 * any network request is made. All other schemes, empty strings,
 * and strings without a scheme are rejected.
 */

/**
 * Validates that the given string is a URL beginning with `http://` or `https://`.
 *
 * @param url - The string to validate
 * @returns `true` if the string begins with `http://` or `https://`, `false` otherwise
 */
export function validateUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
