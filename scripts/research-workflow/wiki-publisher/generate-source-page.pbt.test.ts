/**
 * Property-Based Tests for enhanced source page generation
 * Feature: article-author-source-discovery
 *
 * Properties tested:
 * - Property 9: Source page metadata includes author and publication source WikiLinks
 * - Property 11: Tag arrays contain required discovery tags (source page variant)
 *
 * **Validates: Requirements 3.2, 3.3, 5.3, 5.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import matter from 'gray-matter';
import { generateSourcePage, SourcePageParams } from './generate-source-page';

// ============================================================================
// Custom Arbitraries
// ============================================================================

/** Generates non-empty article titles (alphanumeric with spaces, 1-80 chars) */
const articleTitleArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,79}$/)
  .filter((s) => s.trim().length > 0);

/** Generates valid YYYY-MM-DD date strings */
const dateArbitrary = fc
  .tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(
    ([y, m, d]) =>
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  );

/** Generates non-empty tag strings (lowercase kebab-case) */
const tagArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,19}$/)
  .filter((s) => !s.endsWith('-'));

/** Generates non-empty key points */
const keyPointArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ,.]{0,99}$/)
  .filter((s) => s.trim().length > 0);

/** Generates non-empty insights */
const insightArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ,.]{0,99}$/)
  .filter((s) => s.trim().length > 0);

/** Generates entity/concept names */
const wikiNameArbitrary = fc
  .stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,29}$/)
  .filter((s) => s.trim().length > 0);

/** Generates session directory paths */
const sessionDirArbitrary = fc
  .stringMatching(/^\.kiro\/research\/sessions\/[a-z][a-z0-9-]{2,20}$/)
  .filter((s) => !s.endsWith('-'));

/** Generates author WikiLink targets (full names like "Manfred Steyer") */
const authorWikiLinkArbitrary = fc
  .tuple(
    fc.stringMatching(/^[A-Z][a-z]{1,14}$/),
    fc.stringMatching(/^[A-Z][a-z]{1,14}$/)
  )
  .map(([first, last]) => `${first} ${last}`);

/** Generates valid domain segments */
const domainSegment = fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);

/** Generates publication source WikiLink targets (domain names like "nx.dev") */
const publicationSourceWikiLinkArbitrary = fc
  .tuple(domainSegment, fc.array(domainSegment, { minLength: 1, maxLength: 2 }))
  .map(([first, rest]) => [first, ...rest].join('.'));

/** Generates valid SourcePageParams with authorWikiLink and publicationSourceWikiLink */
const validParamsWithBothLinksArbitrary = fc
  .tuple(
    articleTitleArbitrary,
    dateArbitrary,
    dateArbitrary,
    fc.array(tagArbitrary, { minLength: 1, maxLength: 5 }),
    fc.array(keyPointArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(insightArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    sessionDirArbitrary,
    authorWikiLinkArbitrary,
    publicationSourceWikiLinkArbitrary
  )
  .map(
    ([
      title,
      created,
      updated,
      tags,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      authorWikiLink,
      publicationSourceWikiLink,
    ]): SourcePageParams => ({
      title,
      tags,
      created,
      updated,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      authorWikiLink,
      publicationSourceWikiLink,
    })
  );

/** Generates valid SourcePageParams with only authorWikiLink */
const validParamsWithAuthorOnlyArbitrary = fc
  .tuple(
    articleTitleArbitrary,
    dateArbitrary,
    dateArbitrary,
    fc.array(tagArbitrary, { minLength: 1, maxLength: 5 }),
    fc.array(keyPointArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(insightArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    sessionDirArbitrary,
    authorWikiLinkArbitrary
  )
  .map(
    ([
      title,
      created,
      updated,
      tags,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      authorWikiLink,
    ]): SourcePageParams => ({
      title,
      tags,
      created,
      updated,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      authorWikiLink,
    })
  );

/** Generates valid SourcePageParams with only publicationSourceWikiLink */
const validParamsWithPubSourceOnlyArbitrary = fc
  .tuple(
    articleTitleArbitrary,
    dateArbitrary,
    dateArbitrary,
    fc.array(tagArbitrary, { minLength: 1, maxLength: 5 }),
    fc.array(keyPointArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(insightArbitrary, { minLength: 1, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    fc.array(wikiNameArbitrary, { minLength: 0, maxLength: 3 }),
    sessionDirArbitrary,
    publicationSourceWikiLinkArbitrary
  )
  .map(
    ([
      title,
      created,
      updated,
      tags,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      publicationSourceWikiLink,
    ]): SourcePageParams => ({
      title,
      tags,
      created,
      updated,
      keyPoints,
      insights,
      entities,
      concepts,
      sessionDir,
      publicationSourceWikiLink,
    })
  );

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests: Enhanced Source Page Generation', () => {
  /**
   * Property 9: Source page metadata includes author and publication source WikiLinks
   *
   * For any source page generated with both authorWikiLink and publicationSourceWikiLink
   * present, the Metadata section SHALL contain [[authorWikiLink]] and
   * [[publicationSourceWikiLink]] as WikiLinks.
   *
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property 9: Source page metadata includes author and publication source WikiLinks', () => {
    it('metadata section contains [[authorWikiLink]] when authorWikiLink param is present', () => {
      fc.assert(
        fc.property(validParamsWithBothLinksArbitrary, (params) => {
          const content = generateSourcePage(params);

          // Extract the Metadata section
          const metadataMatch = content.match(
            /## Metadata\n([\s\S]*?)(?=\n## )/
          );
          expect(metadataMatch).not.toBeNull();

          const metadataSection = metadataMatch![1];

          // Should contain WikiLink to author
          expect(metadataSection).toContain(`[[${params.authorWikiLink}]]`);
        }),
        { numRuns: 100 }
      );
    });

    it('metadata section contains [[publicationSourceWikiLink]] when publicationSourceWikiLink param is present', () => {
      fc.assert(
        fc.property(validParamsWithBothLinksArbitrary, (params) => {
          const content = generateSourcePage(params);

          // Extract the Metadata section
          const metadataMatch = content.match(
            /## Metadata\n([\s\S]*?)(?=\n## )/
          );
          expect(metadataMatch).not.toBeNull();

          const metadataSection = metadataMatch![1];

          // Should contain WikiLink to publication source
          expect(metadataSection).toContain(
            `[[${params.publicationSourceWikiLink}]]`
          );
        }),
        { numRuns: 100 }
      );
    });

    it('metadata section contains [[authorWikiLink]] even when publicationSourceWikiLink is absent', () => {
      fc.assert(
        fc.property(validParamsWithAuthorOnlyArbitrary, (params) => {
          const content = generateSourcePage(params);

          // Extract the Metadata section
          const metadataMatch = content.match(
            /## Metadata\n([\s\S]*?)(?=\n## )/
          );
          expect(metadataMatch).not.toBeNull();

          const metadataSection = metadataMatch![1];

          // Should contain WikiLink to author
          expect(metadataSection).toContain(`[[${params.authorWikiLink}]]`);
        }),
        { numRuns: 100 }
      );
    });

    it('metadata section contains [[publicationSourceWikiLink]] even when authorWikiLink is absent', () => {
      fc.assert(
        fc.property(validParamsWithPubSourceOnlyArbitrary, (params) => {
          const content = generateSourcePage(params);

          // Extract the Metadata section
          const metadataMatch = content.match(
            /## Metadata\n([\s\S]*?)(?=\n## )/
          );
          expect(metadataMatch).not.toBeNull();

          const metadataSection = metadataMatch![1];

          // Should contain WikiLink to publication source
          expect(metadataSection).toContain(
            `[[${params.publicationSourceWikiLink}]]`
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Tag arrays contain required discovery tags (source page variant)
   *
   * For any source page with authorWikiLink present, the tags array SHALL contain
   * the author's kebab-case name. For any source page with publicationSourceWikiLink
   * present, the tags array SHALL contain the domain slug (dots→hyphens).
   *
   * **Validates: Requirements 5.3, 5.4**
   */
  describe('Property 11: Tag arrays contain required discovery tags', () => {
    it('tags array contains author kebab-case name when authorWikiLink is present', () => {
      fc.assert(
        fc.property(validParamsWithAuthorOnlyArbitrary, (params) => {
          const content = generateSourcePage(params);
          const parsed = matter(content);

          // Compute expected kebab-case tag from authorWikiLink
          const expectedTag = params
            .authorWikiLink!.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          expect(parsed.data.tags).toContain(expectedTag);
        }),
        { numRuns: 100 }
      );
    });

    it('tags array contains domain slug (dots→hyphens) when publicationSourceWikiLink is present', () => {
      fc.assert(
        fc.property(validParamsWithPubSourceOnlyArbitrary, (params) => {
          const content = generateSourcePage(params);
          const parsed = matter(content);

          // Compute expected domain tag: dots replaced with hyphens
          const expectedTag = params.publicationSourceWikiLink!.replace(
            /\./g,
            '-'
          );

          expect(parsed.data.tags).toContain(expectedTag);
        }),
        { numRuns: 100 }
      );
    });

    it('tags array contains both author tag and domain tag when both params are present', () => {
      fc.assert(
        fc.property(validParamsWithBothLinksArbitrary, (params) => {
          const content = generateSourcePage(params);
          const parsed = matter(content);

          const expectedAuthorTag = params
            .authorWikiLink!.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const expectedDomainTag = params.publicationSourceWikiLink!.replace(
            /\./g,
            '-'
          );

          expect(parsed.data.tags).toContain(expectedAuthorTag);
          expect(parsed.data.tags).toContain(expectedDomainTag);
        }),
        { numRuns: 100 }
      );
    });
  });
});
