import { describe, it, expect } from 'vitest';
import {
  wikiLinkSyntaxExamples,
  markdownGenerationExamples,
  frontmatterCreationExamples,
  frontmatterValidationExample,
  completePageGenerationExample,
  advancedMarkdownFeaturesExample
} from './wikilink-and-markdown.example';

describe('WikiLink and Markdown Examples', () => {
  describe('wikiLinkSyntaxExamples', () => {
    it('should generate basic WikiLink', () => {
      const result = wikiLinkSyntaxExamples();

      expect(result.basicLink).toBe('[[Angular CDK]]');
    });

    it('should generate WikiLink with display text', () => {
      const result = wikiLinkSyntaxExamples();

      expect(result.linkWithDisplayText).toBe('[[Angular CDK|the CDK]]');
    });

    it('should generate WikiLink with section', () => {
      const result = wikiLinkSyntaxExamples();

      expect(result.linkWithSection).toBe('[[Angular CDK#Installation]]');
    });

    it('should generate WikiLink with display text and section', () => {
      const result = wikiLinkSyntaxExamples();

      expect(result.linkWithBoth).toBe('[[Angular CDK#Installation|CDK installation]]');
    });

    it('should generate list of WikiLinks', () => {
      const result = wikiLinkSyntaxExamples();

      expect(result.linkList).toContain('[[TypeScript]]');
      expect(result.linkList).toContain('[[Angular]]');
      expect(result.linkList).toContain('[[RxJS]]');
    });
  });

  describe('markdownGenerationExamples', () => {
    it('should generate headings at different levels', () => {
      const result = markdownGenerationExamples();

      expect(result.headings.h1).toBe('# Main Title');
      expect(result.headings.h2).toBe('## Section Title');
      expect(result.headings.h3).toBe('### Subsection Title');
    });

    it('should generate unordered list', () => {
      const result = markdownGenerationExamples();

      expect(result.lists.unorderedList).toContain('- First item');
      expect(result.lists.unorderedList).toContain('- Second item');
      expect(result.lists.unorderedList).toContain('- Third item');
    });

    it('should generate ordered list', () => {
      const result = markdownGenerationExamples();

      expect(result.lists.orderedList).toContain('1. Step one');
      expect(result.lists.orderedList).toContain('2. Step two');
      expect(result.lists.orderedList).toContain('3. Step three');
    });

    it('should generate nested list with indentation', () => {
      const result = markdownGenerationExamples();

      expect(result.lists.nestedList).toContain('- Parent item');
      expect(result.lists.nestedList).toContain('  - Child item 1');
      expect(result.lists.nestedList).toContain('  - Child item 2');
    });

    it('should generate code block with language', () => {
      const result = markdownGenerationExamples();

      expect(result.codeBlock).toContain('```typescript');
      expect(result.codeBlock).toContain('const greeting = "Hello, World!";');
      expect(result.codeBlock).toContain('```');
    });

    it('should generate blockquote', () => {
      const result = markdownGenerationExamples();

      expect(result.quote).toContain('> This is a blockquote');
      expect(result.quote).toContain('> It demonstrates quote formatting');
    });

    it('should generate table with headers and rows', () => {
      const result = markdownGenerationExamples();

      expect(result.table).toContain('| Feature | Supported | Notes |');
      expect(result.table).toContain('| Signals | Yes | Fine-grained reactivity |');
      expect(result.table).toContain('|------|------|------|');
    });
  });

  describe('frontmatterCreationExamples', () => {
    it('should create entity frontmatter', () => {
      const result = frontmatterCreationExamples();

      expect(result.entityFrontmatter.title).toBe('Angular CDK');
      expect(result.entityFrontmatter.type).toBe('entity');
      expect(result.entityFrontmatter.tags).toContain('angular');
      expect(result.entityFrontmatter.sources).toContain('angular-cdk-documentation-2024-01-15');
    });

    it('should create concept frontmatter', () => {
      const result = frontmatterCreationExamples();

      expect(result.conceptFrontmatter.title).toBe('Dependency Injection');
      expect(result.conceptFrontmatter.type).toBe('concept');
      expect(result.conceptFrontmatter.tags).toContain('design-pattern');
    });

    it('should create source frontmatter with author and URL', () => {
      const result = frontmatterCreationExamples();

      expect(result.sourceFrontmatter.title).toBe('Modern Web Development with Angular');
      expect(result.sourceFrontmatter.type).toBe('source');
      expect(result.sourceFrontmatter.author).toBe('Jane Developer');
      expect(result.sourceFrontmatter.date).toBe('2024-01-15');
      expect(result.sourceFrontmatter.url).toBe('https://example.com/article');
    });

    it('should auto-generate created and updated timestamps', () => {
      const result = frontmatterCreationExamples();

      expect(result.entityFrontmatter.created).toBeDefined();
      expect(result.entityFrontmatter.updated).toBeDefined();
    });
  });

  describe('frontmatterValidationExample', () => {
    it('should generate and parse frontmatter correctly', () => {
      const result = frontmatterValidationExample();

      expect(result.markdown).toContain('---');
      expect(result.markdown).toContain('title: Test Page');
      expect(result.markdown).toContain('type: entity');
    });

    it('should parse frontmatter back to object', () => {
      const result = frontmatterValidationExample();

      expect(result.parsed.frontmatter.title).toBe('Test Page');
      expect(result.parsed.frontmatter.type).toBe('entity');
      expect(result.parsed.frontmatter.tags).toContain('test');
    });

    it('should separate frontmatter from content', () => {
      const result = frontmatterValidationExample();

      expect(result.parsed.content).toBe('');
    });

    it('should preserve all frontmatter fields through parse cycle', () => {
      const result = frontmatterValidationExample();

      expect(result.parsed.frontmatter.created).toBe('2024-01-01');
      expect(result.parsed.frontmatter.updated).toBe('2024-01-01');
    });
  });

  describe('completePageGenerationExample', () => {
    it('should generate complete page with frontmatter and content', () => {
      const markdown = completePageGenerationExample();

      expect(markdown).toContain('---');
      expect(markdown).toContain('title: Example Library');
      expect(markdown).toContain('type: entity');
      expect(markdown).toContain('---');
    });

    it('should include all major sections', () => {
      const markdown = completePageGenerationExample();

      expect(markdown).toContain('# Example Library');
      expect(markdown).toContain('## Overview');
      expect(markdown).toContain('## Features');
      expect(markdown).toContain('## Installation');
      expect(markdown).toContain('## Usage');
      expect(markdown).toContain('## Related Libraries');
      expect(markdown).toContain('## Key Concepts');
      expect(markdown).toContain('## References');
    });

    it('should include code blocks', () => {
      const markdown = completePageGenerationExample();

      expect(markdown).toContain('```bash');
      expect(markdown).toContain('npm install example-library');
      expect(markdown).toContain('```typescript');
    });

    it('should include WikiLinks', () => {
      const markdown = completePageGenerationExample();

      expect(markdown).toContain('[[TypeScript]]');
      expect(markdown).toContain('[[Node.js]]');
      expect(markdown).toContain('[[Dependency Injection|dependency injection]]');
    });

    it('should include lists', () => {
      const markdown = completePageGenerationExample();

      expect(markdown).toContain('- TypeScript support');
      expect(markdown).toContain('- Tree-shaking enabled');
    });
  });

  describe('advancedMarkdownFeaturesExample', () => {
    it('should generate comparison table', () => {
      const result = advancedMarkdownFeaturesExample();

      expect(result.comparisonTable).toContain('| Approach | Pros | Cons |');
      expect(result.comparisonTable).toContain('| Option A | Simple | Limited features |');
    });

    it('should generate multi-line blockquote', () => {
      const result = advancedMarkdownFeaturesExample();

      expect(result.multilineQuote).toContain('> First principle');
      expect(result.multilineQuote).toContain('> Second principle');
      expect(result.multilineQuote).toContain('> Third principle');
    });

    it('should generate nested categorized lists', () => {
      const result = advancedMarkdownFeaturesExample();

      expect(result.nestedLists).toContain('Frontend frameworks');
      expect(result.nestedLists).toContain('  - [[React]]');
      expect(result.nestedLists).toContain('Backend frameworks');
      expect(result.nestedLists).toContain('  - [[NestJS]]');
    });
  });
});
