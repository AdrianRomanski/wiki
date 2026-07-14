/**
 * Unit tests for domain extractor
 * Feature: scripts-migration-hexagonal
 * Requirements: 6.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractDomain, domainToSlug } from './domain-extractor';

describe('extractDomain', () => {
  describe('specific domains', () => {
    it('extracts "nx.dev" from https://nx.dev/blog/some-article', () => {
      expect(extractDomain('https://nx.dev/blog/some-article')).toBe('nx.dev');
    });

    it('extracts "push-based.io" from https://push-based.io/article/rxjs', () => {
      expect(extractDomain('https://push-based.io/article/rxjs')).toBe('push-based.io');
    });

    it('extracts "medium.com" from https://medium.com/@user/article', () => {
      expect(extractDomain('https://medium.com/@user/article')).toBe('medium.com');
    });

    it('extracts "angular.dev" from https://angular.dev/guide/components', () => {
      expect(extractDomain('https://angular.dev/guide/components')).toBe('angular.dev');
    });

    it('extracts "dev.to" from https://dev.to/user/post', () => {
      expect(extractDomain('https://dev.to/user/post')).toBe('dev.to');
    });

    it('extracts "blog.angular.dev" from https://blog.angular.dev/post', () => {
      expect(extractDomain('https://blog.angular.dev/post')).toBe('blog.angular.dev');
    });
  });

  describe('URLs with ports', () => {
    it('extracts "localhost" from http://localhost:3000/path', () => {
      expect(extractDomain('http://localhost:3000/path')).toBe('localhost');
    });
  });

  describe('URLs with paths', () => {
    it('extracts "nx.dev" from https://nx.dev/blog/2024/article-name', () => {
      expect(extractDomain('https://nx.dev/blog/2024/article-name')).toBe('nx.dev');
    });
  });

  describe('URLs with query params', () => {
    it('extracts "medium.com" from https://medium.com/article?ref=search', () => {
      expect(extractDomain('https://medium.com/article?ref=search')).toBe('medium.com');
    });
  });

  describe('URLs with fragments', () => {
    it('extracts "angular.dev" from https://angular.dev/guide#section', () => {
      expect(extractDomain('https://angular.dev/guide#section')).toBe('angular.dev');
    });
  });

  describe('error cases', () => {
    it('throws on empty string', () => {
      expect(() => extractDomain('')).toThrow('URL must not be empty or null');
    });

    it('throws on null/undefined (passed as any)', () => {
      expect(() => extractDomain(null as any)).toThrow('URL must not be empty or null');
      expect(() => extractDomain(undefined as any)).toThrow('URL must not be empty or null');
    });

    it('throws on invalid URL', () => {
      expect(() => extractDomain('not-a-url')).toThrow('Invalid URL format');
    });

    it('throws on non-http scheme (ftp://)', () => {
      expect(() => extractDomain('ftp://files.example.com/doc.pdf')).toThrow('Unsupported URL scheme');
    });

    it('throws on non-http scheme (file://)', () => {
      expect(() => extractDomain('file:///home/user/doc.html')).toThrow('Unsupported URL scheme');
    });
  });
});

describe('domainToSlug', () => {
  it('converts "nx.dev" to "nx-dev"', () => {
    expect(domainToSlug('nx.dev')).toBe('nx-dev');
  });

  it('converts "push-based.io" to "push-based-io"', () => {
    expect(domainToSlug('push-based.io')).toBe('push-based-io');
  });

  it('converts "blog.angular.dev" to "blog-angular-dev"', () => {
    expect(domainToSlug('blog.angular.dev')).toBe('blog-angular-dev');
  });

  it('converts "medium.com" to "medium-com"', () => {
    expect(domainToSlug('medium.com')).toBe('medium-com');
  });

  it('converts "dev.to" to "dev-to"', () => {
    expect(domainToSlug('dev.to')).toBe('dev-to');
  });
});

// ============================================================================
// Property-Based Test
// Feature: scripts-migration-hexagonal, Property 9: Domain extraction round-trip to safe slug
// ============================================================================

describe('Feature: scripts-migration-hexagonal, Property 9: Domain extraction round-trip to safe slug', () => {
  /**
   * Property 9: Domain extraction round-trip to safe slug
   *
   * For any valid http(s) URL, extractDomain SHALL return the hostname and
   * domainToSlug SHALL convert it to a lowercase, filename-safe slug (dots
   * replaced with hyphens); non-http(s) or malformed URLs SHALL raise an
   * error rather than produce a slug.
   *
   * **Validates: Requirements 6.2**
   */
  it('returns the hostname and a lowercase filename-safe slug for any valid http(s) URL', () => {
    fc.assert(
      fc.property(fc.webUrl({ withFragments: true, withQueryParameters: true }), (url) => {
        const parsed = new URL(url);
        const domain = extractDomain(url);

        // extractDomain returns exactly the hostname
        expect(domain).toBe(parsed.hostname);

        const slug = domainToSlug(domain);

        // domainToSlug produces a lowercase, filename-safe slug
        expect(slug).toBe(slug.toLowerCase());
        expect(slug).not.toContain('.');
        expect(slug).toMatch(/^[a-z0-9-]*$/);

        // dots are replaced with hyphens 1:1
        expect(slug).toBe(domain.toLowerCase().replace(/\./g, '-'));
      }),
      { numRuns: 100 }
    );
  });

  it('raises an error for non-http(s) or malformed URLs', () => {
    const nonHttpSchemes = fc.constantFrom('ftp', 'file', 'ws', 'mailto', 'data');

    fc.assert(
      fc.property(
        fc.oneof(
          // Non-http(s) schemes with a plausible authority/path
          fc.tuple(nonHttpSchemes, fc.domain()).map(([scheme, host]) => `${scheme}://${host}/resource`),
          // Malformed URL strings that fc's URL constructor cannot parse
          fc.string().filter((s) => {
            try {
              // eslint-disable-next-line no-new
              new URL(s);
              return false; // parseable — not a malformed case
            } catch {
              return true;
            }
          })
        ),
        (invalidUrl) => {
          expect(() => extractDomain(invalidUrl)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
