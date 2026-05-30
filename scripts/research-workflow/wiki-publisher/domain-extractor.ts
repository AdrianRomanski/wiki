/**
 * Domain extraction utility
 * Feature: article-author-source-discovery
 * Requirements: 2.1, 6.1
 *
 * Extracts the publication domain from an article URL and converts it
 * to a filename-safe slug. Pure functions, no side effects.
 */

/**
 * Extracts the hostname from a URL string.
 *
 * @param url - A valid URL beginning with http:// or https://
 * @returns The hostname (e.g., "nx.dev", "medium.com", "push-based.io")
 * @throws Error if the URL is empty/null, invalid, or uses a non-http(s) scheme
 */
export function extractDomain(url: string): string {
  if (!url || !url.trim()) {
    throw new Error('URL must not be empty or null');
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported URL scheme: ${parsed.protocol} — only http and https are allowed`);
  }

  return parsed.hostname;
}

/**
 * Converts a domain name to a valid filename slug.
 * Replaces dots with hyphens and lowercases the result.
 *
 * @param domain - A domain name (e.g., "push-based.io")
 * @returns A slug suitable for filenames (e.g., "push-based-io")
 */
export function domainToSlug(domain: string): string {
  return domain.replace(/\./g, '-').toLowerCase();
}
