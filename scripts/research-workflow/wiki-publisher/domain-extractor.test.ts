/**
 * Unit tests for domain extractor
 * Feature: article-author-source-discovery
 * Requirements: 2.1, 6.1
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
// Property-Based Tests
// Feature: article-author-source-discovery
// ============================================================================

describe('Property-Based Tests: Domain Extraction', () => {
  /**
   * Property 1: Domain extraction produces valid hostnames
   *
   * For any valid URL string beginning with http:// or https://,
   * the extractDomain function SHALL return a non-empty string that does not
   * contain the protocol scheme, path, query parameters, or fragment.
   *
   * **Validates: Requirements 2.1, 6.1**
   */
  describe('Property 1: Domain extraction produces valid hostnames', () => {
    it('should return a non-empty hostname without protocol, path, query params, or fragment for any valid http/https URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ withFragments: true, withQueryParameters: true }),
          (url) => {
            const domain = extractDomain(url);

            // Must be non-empty
            expect(domain.length).toBeGreaterThan(0);

            // Must not contain protocol scheme
            expect(domain).not.toContain('http://');
            expect(domain).not.toContain('https://');
            expect(domain).not.toContain('://');

            // Must not contain path separators (no slash means no path)
            expect(domain).not.toContain('/');

            // Must not contain query parameters
            expect(domain).not.toContain('?');
            expect(domain).not.toContain('=');

            // Must not contain fragment
            expect(domain).not.toContain('#');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match the URL hostname exactly as parsed by the URL constructor', () => {
      fc.assert(
        fc.property(
          fc.webUrl({ withFragments: true, withQueryParameters: true }),
          (url) => {
            const domain = extractDomain(url);
            const parsed = new URL(url);

            // The extracted domain must match the URL's hostname exactly
            expect(domain).toBe(parsed.hostname);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Domain slug is a valid filename
   *
   * For any domain string containing alphanumeric characters, dots, and hyphens,
   * the domainToSlug function SHALL produce a string that:
   * (a) contains only lowercase alphanumeric characters and hyphens,
   * (b) does not begin or end with a hyphen, and
   * (c) does not contain consecutive hyphens.
   *
   * **Validates: Requirements 2.1**
   */
  describe('Property 2: Domain slug is a valid filename', () => {
    // Generate domain-like strings: segments of lowercase alphanumeric separated by dots
    // e.g., "abc.def.io", "example.com"
    const domainSegment = fc.stringMatching(/^[a-z0-9]{1,10}$/);
    const domainArbitrary = fc
      .tuple(
        domainSegment,
        fc.array(domainSegment, { minLength: 1, maxLength: 4 })
      )
      .map(([first, rest]) => [first, ...rest].join('.'));

    it('should contain only lowercase alphanumeric characters and hyphens', () => {
      fc.assert(
        fc.property(domainArbitrary, (domain) => {
          const slug = domainToSlug(domain);

          // (a) Only lowercase alphanumeric and hyphens
          expect(slug).toMatch(/^[a-z0-9-]+$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should not begin or end with a hyphen', () => {
      fc.assert(
        fc.property(domainArbitrary, (domain) => {
          const slug = domainToSlug(domain);

          // (b) No leading or trailing hyphens
          expect(slug).not.toMatch(/^-/);
          expect(slug).not.toMatch(/-$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should not contain consecutive hyphens', () => {
      fc.assert(
        fc.property(domainArbitrary, (domain) => {
          const slug = domainToSlug(domain);

          // (c) No consecutive hyphens
          expect(slug).not.toContain('--');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Domain extraction round-trip with slug
   *
   * For any valid URL, extracting the domain and converting it to a slug SHALL
   * produce a string that, when used as a filename `wiki/entities/[slug].md`,
   * forms a valid file path (no special characters, no spaces, no dots except
   * in the `.md` extension).
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 10: Domain extraction round-trip with slug', () => {
    it('should produce a valid file path when combined with wiki/entities/ prefix and .md extension', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (url) => {
            const domain = extractDomain(url);
            const slug = domainToSlug(domain);
            const filePath = `wiki/entities/${slug}.md`;

            // The slug portion should not contain dots (they become hyphens)
            expect(slug).not.toContain('.');

            // The slug should not contain spaces
            expect(slug).not.toContain(' ');

            // The slug should only contain valid filename characters
            expect(slug).toMatch(/^[a-z0-9-]+$/);

            // The full path should be a valid file path
            // No special characters except forward slashes (path separators), hyphens, and the dot in .md
            expect(filePath).toMatch(/^wiki\/entities\/[a-z0-9-]+\.md$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce a non-empty slug for any valid URL', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (url) => {
            const domain = extractDomain(url);
            const slug = domainToSlug(domain);

            // Slug must be non-empty
            expect(slug.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
