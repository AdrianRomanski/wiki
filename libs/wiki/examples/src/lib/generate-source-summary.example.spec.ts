import { describe, it, expect } from 'vitest';
import {
  generateSourceSummaryArticleExample,
  generateSourceSummaryDocumentationExample,
  generateSourceSummaryWithMinimalOptions,
  generateSourceSummaryForResearchPaper,
  generateSourceSummaryForCodeExample
} from './generate-source-summary.example';

describe('Generate Source Summary Examples', () => {
  describe('generateSourceSummaryArticleExample', () => {
    it('should generate article source summary with all metadata', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.filename).toContain('modern-web-development-with-angular');
      expect(result.filename).toContain('2024-01-15');
      expect(result.frontmatter.title).toBe('Modern Web Development with Angular');
      expect(result.frontmatter.type).toBe('source');
      expect(result.frontmatter.author).toBe('Jane Developer');
      expect(result.frontmatter.date).toBe('2024-01-15');
      expect(result.frontmatter.url).toBe('https://example.com/modern-angular-dev');
    });

    it('should include frontmatter in content', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: Modern Web Development with Angular');
      expect(result.content).toContain('type: source');
      expect(result.content).toContain('author: Jane Developer');
    });

    it('should generate Metadata section', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Metadata');
      expect(result.content).toContain('**Author**: Jane Developer');
      expect(result.content).toContain('**Date**: 2024-01-15');
      expect(result.content).toContain('**URL**: [link](https://example.com/modern-angular-dev)');
      expect(result.content).toContain('**Type**: article');
    });

    it('should generate Key Points section', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Key Points');
      expect(result.content).toContain('Standalone components simplify');
      expect(result.content).toContain('Signal-based reactivity');
    });

    it('should generate Insights section', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Insights');
      expect(result.content).toContain('evolution toward simplicity');
    });

    it('should generate Relevant Entities section with WikiLinks', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Relevant Entities');
      expect(result.content).toContain('[[Angular]]');
      expect(result.content).toContain('[[TypeScript]]');
      expect(result.content).toContain('[[RxJS]]');
    });

    it('should generate Relevant Concepts section with WikiLinks', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Relevant Concepts');
      expect(result.content).toContain('[[Reactive Programming]]');
      expect(result.content).toContain('[[Component-Based Architecture]]');
    });

    it('should generate Quotes section', () => {
      const result = generateSourceSummaryArticleExample();

      expect(result.content).toContain('## Quotes');
      expect(result.content).toContain('> Standalone components represent');
      expect(result.content).toContain('> Signals bring fine-grained');
    });
  });

  describe('generateSourceSummaryDocumentationExample', () => {
    it('should generate documentation source summary', () => {
      const result = generateSourceSummaryDocumentationExample();

      expect(result.filename).toContain('angular-aria-guide');
      expect(result.filename).toContain('2024-05-10');
      expect(result.frontmatter.title).toBe('Angular ARIA Guide');
      expect(result.frontmatter.type).toBe('source');
    });

    it('should include documentation-specific metadata', () => {
      const result = generateSourceSummaryDocumentationExample();

      expect(result.content).toContain('**URL**: [link](https://angular.dev/best-practices/a11y)');
      expect(result.content).toContain('**Type**: article');
    });

    it('should include relevant entities and concepts', () => {
      const result = generateSourceSummaryDocumentationExample();

      expect(result.content).toContain('[[Angular CDK]]');
      expect(result.content).toContain('[[ARIA]]');
      expect(result.content).toContain('[[Semantic HTML]]');
    });
  });

  describe('generateSourceSummaryWithMinimalOptions', () => {
    it('should generate minimal source summary', () => {
      const result = generateSourceSummaryWithMinimalOptions();

      expect(result.filename).toContain('typescript-best-practices');
      expect(result.frontmatter.title).toBe('TypeScript Best Practices');
      expect(result.frontmatter.type).toBe('source');
    });

    it('should not include optional sections when not provided', () => {
      const result = generateSourceSummaryWithMinimalOptions();

      expect(result.content).not.toContain('## Insights');
      expect(result.content).not.toContain('## Relevant Entities');
      expect(result.content).not.toContain('## Relevant Concepts');
      expect(result.content).not.toContain('## Quotes');
    });

    it('should include Key Points section', () => {
      const result = generateSourceSummaryWithMinimalOptions();

      expect(result.content).toContain('## Key Points');
      expect(result.content).toContain('Use strict mode');
    });

    it('should have minimal metadata', () => {
      const result = generateSourceSummaryWithMinimalOptions();

      expect(result.content).toContain('## Metadata');
      expect(result.content).not.toContain('**Author**:');
      expect(result.content).not.toContain('**URL**:');
    });
  });

  describe('generateSourceSummaryForResearchPaper', () => {
    it('should generate research paper source summary', () => {
      const result = generateSourceSummaryForResearchPaper();

      expect(result.filename).toContain('the-reactive-manifesto');
      expect(result.frontmatter.title).toBe('The Reactive Manifesto');
      expect(result.frontmatter.type).toBe('source');
      expect(result.frontmatter.author).toContain('Jonas Bonér');
    });

    it('should include multiple authors in metadata', () => {
      const result = generateSourceSummaryForResearchPaper();

      expect(result.content).toContain('Jonas Bonér, Dave Farley, Roland Kuhn, Martin Thompson');
    });

    it('should include quotes and insights', () => {
      const result = generateSourceSummaryForResearchPaper();

      expect(result.content).toContain('## Quotes');
      expect(result.content).toContain('> Reactive Systems are');
      expect(result.content).toContain('## Insights');
    });
  });

  describe('generateSourceSummaryForCodeExample', () => {
    it('should generate code example source summary', () => {
      const result = generateSourceSummaryForCodeExample();

      expect(result.filename).toContain('angular-signals-implementation-pattern');
      expect(result.frontmatter.title).toBe('Angular Signals Implementation Pattern');
      expect(result.frontmatter.type).toBe('source');
    });

    it('should include code-specific metadata', () => {
      const result = generateSourceSummaryForCodeExample();

      expect(result.content).toContain('**Type**: code');
      expect(result.content).toContain('**Raw Source**: `code/angular-signals-pattern.ts`');
    });

    it('should include key points about code pattern', () => {
      const result = generateSourceSummaryForCodeExample();

      expect(result.content).toContain('Signals provide fine-grained reactivity');
      expect(result.content).toContain('Computed signals');
    });
  });
});
