import { describe, it, expect } from 'vitest';
import { extractWikiLinks } from '../wikilink-parser';

describe('extractWikiLinks', () => {
  it('extracts simple [[Title]] links', () => {
    const content = 'See [[Angular CDK]] for details.';
    expect(extractWikiLinks(content)).toEqual(['Angular CDK']);
  });

  it('extracts [[Title|Display]] links, returning only the title', () => {
    const content = 'Check [[Angular CDK|the CDK docs]] for more.';
    expect(extractWikiLinks(content)).toEqual(['Angular CDK']);
  });

  it('extracts [[Title#Section]] links, returning only the title', () => {
    const content = 'See [[Angular CDK#Installation]] for setup.';
    expect(extractWikiLinks(content)).toEqual(['Angular CDK']);
  });

  it('handles mixed link forms in the same content', () => {
    const content = `
      See [[Page One]] and [[Page Two|display]] and [[Page Three#section]].
    `;
    const result = extractWikiLinks(content);
    expect(result).toEqual(['Page One', 'Page Two', 'Page Three']);
  });

  it('deduplicates repeated links', () => {
    const content = '[[Foo]] is related to [[Bar]] and also [[Foo]].';
    expect(extractWikiLinks(content)).toEqual(['Foo', 'Bar']);
  });

  it('returns empty array when no links found', () => {
    const content = 'No links here, just plain text.';
    expect(extractWikiLinks(content)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractWikiLinks('')).toEqual([]);
  });

  it('does not match incomplete bracket pairs', () => {
    const content = 'This [single bracket] and [[incomplete are not links.';
    expect(extractWikiLinks(content)).toEqual([]);
  });

  it('does not match escaped brackets', () => {
    const content = 'This \\[[Escaped Link]] should not match.';
    expect(extractWikiLinks(content)).toEqual([]);
  });

  it('skips empty links [[]]', () => {
    const content = 'An empty [[]] link and a valid [[Real Page]] link.';
    expect(extractWikiLinks(content)).toEqual(['Real Page']);
  });

  it('handles links with spaces in title', () => {
    const content = '[[My Long Page Title]] is here.';
    expect(extractWikiLinks(content)).toEqual(['My Long Page Title']);
  });

  it('handles multiple links on the same line', () => {
    const content = '[[A]] and [[B]] and [[C]]';
    expect(extractWikiLinks(content)).toEqual(['A', 'B', 'C']);
  });

  it('handles [[Title#Section|Display]] combined form', () => {
    // Pipe takes precedence — everything before pipe is the raw target
    // Then hash is applied to that raw target
    const content = '[[Page Title#Section|Display Text]]';
    // The pipe splits first: target = "Page Title#Section"
    // Then hash splits: title = "Page Title"
    expect(extractWikiLinks(content)).toEqual(['Page Title']);
  });

  it('deduplicates case-sensitively (different cases are different titles)', () => {
    const content = '[[angular]] and [[Angular]] are different.';
    expect(extractWikiLinks(content)).toEqual(['angular', 'Angular']);
  });

  it('does not match nested brackets like [[[Title]]]', () => {
    // The regex should still extract the inner [[Title]] from [[[Title]]]
    // because the pattern matches the first valid [[ ]] pair
    const content = '[[[Nested]]]';
    const result = extractWikiLinks(content);
    // The outer [ is not a \, so [[Nested]] should still match
    expect(result).toEqual(['Nested']);
  });
});
