/**
 * Unit tests for normalized source page generation
 * Feature: article-research-session
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect } from 'vitest';
import { generateSourcePage, SourcePageParams } from './generate-source-page';
import matter from 'gray-matter';

function createValidParams(overrides: Partial<SourcePageParams> = {}): SourcePageParams {
  return {
    title: 'Understanding Angular Signals',
    author: 'John Doe',
    date: '2024-05-15',
    url: 'https://blog.example.com/angular-signals',
    tags: ['angular', 'signals', 'reactivity'],
    created: '2024-06-01',
    updated: '2024-06-01',
    keyPoints: ['Signals provide fine-grained reactivity in Angular'],
    insights: ['Signal-based architecture simplifies change detection significantly.'],
    entities: ['Angular Signals', 'RxJS'],
    concepts: ['Fine-Grained Reactivity', 'Change Detection'],
    sessionDir: '.kiro/research/sessions/angular-signals-article',
    ...overrides,
  };
}

describe('generateSourcePage', () => {
  describe('YAML frontmatter generation (Req 7.1)', () => {
    it('generates valid YAML frontmatter parseable by a standard YAML parser', () => {
      const result = generateSourcePage(createValidParams());
      const parsed = matter(result);
      expect(parsed.data).toBeDefined();
      expect(parsed.data.title).toBe('Understanding Angular Signals');
    });

    it('includes title in frontmatter', () => {
      const result = generateSourcePage(createValidParams());
      const parsed = parseFrontmatter(result);
      expect(parsed.title).toBe('Understanding Angular Signals');
    });

    it('includes type: source in frontmatter', () => {
      const result = generateSourcePage(createValidParams());
      const parsed = parseFrontmatter(result);
      expect(parsed.type).toBe('source');
    });

    it('includes author in frontmatter when provided', () => {
      const result = generateSourcePage(createValidParams({ author: 'Jane Smith' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.author).toBe('Jane Smith');
    });

    it('omits author from frontmatter when not provided', () => {
      const result = generateSourcePage(createValidParams({ author: undefined }));
      const parsed = parseFrontmatter(result);
      expect(parsed.author).toBeUndefined();
    });

    it('includes date in frontmatter when provided', () => {
      const result = generateSourcePage(createValidParams({ date: '2024-03-20' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.date).toBe('2024-03-20');
    });

    it('omits date from frontmatter when not provided', () => {
      const result = generateSourcePage(createValidParams({ date: undefined }));
      const parsed = parseFrontmatter(result);
      expect(parsed.date).toBeUndefined();
    });

    it('includes url in frontmatter when provided', () => {
      const result = generateSourcePage(createValidParams({ url: 'https://example.com/article' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.url).toBe('https://example.com/article');
    });

    it('omits url from frontmatter when not provided', () => {
      const result = generateSourcePage(createValidParams({ url: undefined }));
      const parsed = parseFrontmatter(result);
      expect(parsed.url).toBeUndefined();
    });

    it('includes tags array with at least one element', () => {
      const result = generateSourcePage(createValidParams({ tags: ['angular'] }));
      const parsed = parseFrontmatter(result);
      expect(parsed.tags).toEqual(['angular']);
    });

    it('includes created date in frontmatter', () => {
      const result = generateSourcePage(createValidParams({ created: '2024-06-01' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.created).toBe('2024-06-01');
    });

    it('includes updated date in frontmatter', () => {
      const result = generateSourcePage(createValidParams({ updated: '2024-06-15' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.updated).toBe('2024-06-15');
    });

    it('handles title with special characters in YAML', () => {
      const result = generateSourcePage(createValidParams({ title: 'Angular: A "Deep" Dive' }));
      const parsed = parseFrontmatter(result);
      expect(parsed.title).toBe('Angular: A "Deep" Dive');
    });
  });

  describe('body sections (Req 7.2)', () => {
    it('includes a Metadata section', () => {
      const result = generateSourcePage(createValidParams());
      expect(result).toContain('## Metadata');
    });

    it('includes a Key Points section with at least one bullet', () => {
      const result = generateSourcePage(createValidParams({
        keyPoints: ['First point', 'Second point'],
      }));
      expect(result).toContain('## Key Points');
      expect(result).toContain('- First point');
      expect(result).toContain('- Second point');
    });

    it('includes an Insights section with at least one takeaway', () => {
      const result = generateSourcePage(createValidParams({
        insights: ['Key takeaway from the article.'],
      }));
      expect(result).toContain('## Insights');
      expect(result).toContain('Key takeaway from the article.');
    });

    it('includes a Relevant Entities section', () => {
      const result = generateSourcePage(createValidParams({
        entities: ['Angular Signals'],
      }));
      expect(result).toContain('## Relevant Entities');
    });

    it('includes a Relevant Concepts section', () => {
      const result = generateSourcePage(createValidParams({
        concepts: ['Fine-Grained Reactivity'],
      }));
      expect(result).toContain('## Relevant Concepts');
    });

    it('includes a Session Artifacts section', () => {
      const result = generateSourcePage(createValidParams());
      expect(result).toContain('## Session Artifacts');
    });

    it('lists session artifacts with correct paths', () => {
      const sessionDir = '.kiro/research/sessions/my-session';
      const result = generateSourcePage(createValidParams({ sessionDir }));
      expect(result).toContain(`\`${sessionDir}/article-analysis.md\``);
      expect(result).toContain(`\`${sessionDir}/article-content.json\``);
      expect(result).toContain(`\`${sessionDir}/raw-article.md\``);
      expect(result).toContain(`\`${sessionDir}/session.json\``);
    });

    it('includes author in Metadata section when provided', () => {
      const result = generateSourcePage(createValidParams({ author: 'Jane Smith' }));
      expect(result).toContain('**Author:** Jane Smith');
    });

    it('includes date in Metadata section when provided', () => {
      const result = generateSourcePage(createValidParams({ date: '2024-05-15' }));
      expect(result).toContain('**Date:** 2024-05-15');
    });

    it('includes URL as a link in Metadata section when provided', () => {
      const result = generateSourcePage(createValidParams({ url: 'https://example.com/article' }));
      expect(result).toContain('**URL:** [https://example.com/article](https://example.com/article)');
    });

    it('handles empty entities list gracefully', () => {
      const result = generateSourcePage(createValidParams({ entities: [] }));
      expect(result).toContain('## Relevant Entities');
      expect(result).toContain('*No entities identified.*');
    });

    it('handles empty concepts list gracefully', () => {
      const result = generateSourcePage(createValidParams({ concepts: [] }));
      expect(result).toContain('## Relevant Concepts');
      expect(result).toContain('*No concepts identified.*');
    });
  });

  describe('WikiLink syntax (Req 7.3)', () => {
    it('uses [[Page Title]] syntax for entity cross-references', () => {
      const result = generateSourcePage(createValidParams({
        entities: ['Angular Signals', 'RxJS'],
      }));
      expect(result).toContain('- [[Angular Signals]]');
      expect(result).toContain('- [[RxJS]]');
    });

    it('uses [[Page Title]] syntax for concept cross-references', () => {
      const result = generateSourcePage(createValidParams({
        concepts: ['Fine-Grained Reactivity', 'Change Detection'],
      }));
      expect(result).toContain('- [[Fine-Grained Reactivity]]');
      expect(result).toContain('- [[Change Detection]]');
    });

    it('uses page title (not filename) in WikiLinks', () => {
      const result = generateSourcePage(createValidParams({
        entities: ['Angular CDK'],
        concepts: ['Progressive Enhancement'],
      }));
      // Should use title, not slug
      expect(result).toContain('[[Angular CDK]]');
      expect(result).toContain('[[Progressive Enhancement]]');
      expect(result).not.toContain('[[angular-cdk]]');
      expect(result).not.toContain('[[progressive-enhancement]]');
    });
  });

  describe('validation', () => {
    it('throws when title is empty', () => {
      expect(() => generateSourcePage(createValidParams({ title: '' }))).toThrow('title must be a non-empty string');
    });

    it('throws when title is whitespace only', () => {
      expect(() => generateSourcePage(createValidParams({ title: '   ' }))).toThrow('title must be a non-empty string');
    });

    it('throws when tags array is empty', () => {
      expect(() => generateSourcePage(createValidParams({ tags: [] }))).toThrow('tags must contain at least one element');
    });

    it('throws when keyPoints array is empty', () => {
      expect(() => generateSourcePage(createValidParams({ keyPoints: [] }))).toThrow('keyPoints must contain at least one element');
    });

    it('throws when insights array is empty', () => {
      expect(() => generateSourcePage(createValidParams({ insights: [] }))).toThrow('insights must contain at least one element');
    });

    it('throws when created is not YYYY-MM-DD format', () => {
      expect(() => generateSourcePage(createValidParams({ created: '2024/06/01' }))).toThrow('created must be a valid date in YYYY-MM-DD format');
    });

    it('throws when updated is not YYYY-MM-DD format', () => {
      expect(() => generateSourcePage(createValidParams({ updated: 'June 1, 2024' }))).toThrow('updated must be a valid date in YYYY-MM-DD format');
    });
  });

  describe('full page structure', () => {
    it('produces a complete page with frontmatter followed by body', () => {
      const result = generateSourcePage(createValidParams());
      expect(result).toMatch(/^---\n[\s\S]*\n---\n\n# /);
    });

    it('sections appear in correct order', () => {
      const result = generateSourcePage(createValidParams());
      const metadataIdx = result.indexOf('## Metadata');
      const keyPointsIdx = result.indexOf('## Key Points');
      const insightsIdx = result.indexOf('## Insights');
      const entitiesIdx = result.indexOf('## Relevant Entities');
      const conceptsIdx = result.indexOf('## Relevant Concepts');
      const artifactsIdx = result.indexOf('## Session Artifacts');

      expect(metadataIdx).toBeLessThan(keyPointsIdx);
      expect(keyPointsIdx).toBeLessThan(insightsIdx);
      expect(insightsIdx).toBeLessThan(entitiesIdx);
      expect(entitiesIdx).toBeLessThan(conceptsIdx);
      expect(conceptsIdx).toBeLessThan(artifactsIdx);
    });
  });

  describe('author and publication source WikiLinks (Req 3.1, 3.2, 3.3, 3.4, 3.5)', () => {
    describe('with both authorWikiLink and publicationSourceWikiLink', () => {
      it('renders author as WikiLink in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Manfred Steyer',
          publicationSourceWikiLink: 'nx.dev',
        }));
        expect(result).toContain('- **Author:** [[Manfred Steyer]]');
      });

      it('renders publication source as WikiLink in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Manfred Steyer',
          publicationSourceWikiLink: 'nx.dev',
        }));
        expect(result).toContain('- **Publication Source:** [[nx.dev]]');
      });

      it('adds author kebab-case name to tags array', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Manfred Steyer',
          publicationSourceWikiLink: 'nx.dev',
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toContain('manfred-steyer');
      });

      it('adds domain slug to tags array', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Manfred Steyer',
          publicationSourceWikiLink: 'nx.dev',
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toContain('nx-dev');
      });

      it('preserves existing tags alongside new author and domain tags', () => {
        const result = generateSourcePage(createValidParams({
          tags: ['angular', 'signals'],
          authorWikiLink: 'Manfred Steyer',
          publicationSourceWikiLink: 'push-based.io',
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toContain('angular');
        expect(parsed.tags).toContain('signals');
        expect(parsed.tags).toContain('manfred-steyer');
        expect(parsed.tags).toContain('push-based-io');
      });
    });

    describe('with only authorWikiLink', () => {
      it('renders author as WikiLink in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Jane Doe',
          publicationSourceWikiLink: undefined,
        }));
        expect(result).toContain('- **Author:** [[Jane Doe]]');
      });

      it('does not include publication source line in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Jane Doe',
          publicationSourceWikiLink: undefined,
        }));
        expect(result).not.toContain('**Publication Source:**');
      });

      it('adds author kebab-case name to tags array', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: 'Jane Doe',
          publicationSourceWikiLink: undefined,
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toContain('jane-doe');
      });

      it('does not add a domain slug to tags array', () => {
        const result = generateSourcePage(createValidParams({
          tags: ['angular'],
          authorWikiLink: 'Jane Doe',
          publicationSourceWikiLink: undefined,
        }));
        const parsed = parseFrontmatter(result);
        // Only original tags + author tag, no domain tag
        expect(parsed.tags).toEqual(['angular', 'jane-doe']);
      });
    });

    describe('with only publicationSourceWikiLink', () => {
      it('renders author as raw text or Unknown when no authorWikiLink', () => {
        const result = generateSourcePage(createValidParams({
          author: 'Some Author',
          authorWikiLink: undefined,
          publicationSourceWikiLink: 'medium.com',
        }));
        expect(result).toContain('- **Author:** Some Author');
        expect(result).not.toContain('[[Some Author]]');
      });

      it('renders Unknown when both author and authorWikiLink are absent', () => {
        const result = generateSourcePage(createValidParams({
          author: undefined,
          authorWikiLink: undefined,
          publicationSourceWikiLink: 'medium.com',
        }));
        expect(result).toContain('- **Author:** Unknown');
      });

      it('renders publication source as WikiLink in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: undefined,
          publicationSourceWikiLink: 'medium.com',
        }));
        expect(result).toContain('- **Publication Source:** [[medium.com]]');
      });

      it('adds domain slug to tags array', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: undefined,
          publicationSourceWikiLink: 'medium.com',
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toContain('medium-com');
      });

      it('does not add an author tag to tags array', () => {
        const result = generateSourcePage(createValidParams({
          tags: ['angular'],
          authorWikiLink: undefined,
          publicationSourceWikiLink: 'medium.com',
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toEqual(['angular', 'medium-com']);
      });
    });

    describe('with neither authorWikiLink nor publicationSourceWikiLink', () => {
      it('renders author as Unknown when author param is also absent', () => {
        const result = generateSourcePage(createValidParams({
          author: undefined,
          authorWikiLink: undefined,
          publicationSourceWikiLink: undefined,
        }));
        expect(result).toContain('- **Author:** Unknown');
      });

      it('renders author as raw text when author param is present but no WikiLink', () => {
        const result = generateSourcePage(createValidParams({
          author: 'John Doe',
          authorWikiLink: undefined,
          publicationSourceWikiLink: undefined,
        }));
        expect(result).toContain('- **Author:** John Doe');
        expect(result).not.toContain('[[John Doe]]');
      });

      it('does not include publication source line in Metadata section', () => {
        const result = generateSourcePage(createValidParams({
          authorWikiLink: undefined,
          publicationSourceWikiLink: undefined,
        }));
        expect(result).not.toContain('**Publication Source:**');
      });

      it('does not add extra author or domain tags to tags array', () => {
        const result = generateSourcePage(createValidParams({
          tags: ['angular', 'signals'],
          authorWikiLink: undefined,
          publicationSourceWikiLink: undefined,
        }));
        const parsed = parseFrontmatter(result);
        expect(parsed.tags).toEqual(['angular', 'signals']);
      });
    });

    describe('existing tests still pass with optional params omitted', () => {
      it('generates valid page without authorWikiLink or publicationSourceWikiLink', () => {
        const result = generateSourcePage(createValidParams());
        const parsed = parseFrontmatter(result);
        expect(parsed.title).toBe('Understanding Angular Signals');
        expect(parsed.type).toBe('source');
        expect(result).toContain('## Metadata');
        expect(result).toContain('## Key Points');
      });
    });
  });
});

/** Helper to parse YAML frontmatter from a markdown string */
function parseFrontmatter(content: string): Record<string, unknown> {
  const parsed = matter(content);
  return parsed.data as Record<string, unknown>;
}
