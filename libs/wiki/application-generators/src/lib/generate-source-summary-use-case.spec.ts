import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateSourceSummaryUseCase } from './generate-source-summary-use-case';
import { SourceSummaryOptions } from './interfaces';
import { MarkdownPort, FrontmatterPort, ParsedFrontmatter } from '@wiki/application-ports';
import { WikiPageFrontmatter } from '@wiki/domain-models';

class MockMarkdownPort implements MarkdownPort {
  parseMarkdownSections() { return []; }
  extractWikiLinks() { return []; }
  generateWikiLink(target: string) { return `[[${target}]]`; }
  generateHeading(text: string, level: number) { return `${'#'.repeat(level)} ${text}`; }
  generateList(items: string[]) { return items.map(i => `- ${i}`).join('\n'); }
  generateCodeBlock() { return ''; }
  generateBlockquote() { return ''; }
  generateTable() { return ''; }
  validateMarkdownSyntax() { return { valid: true }; }
  sectionsToMarkdown() { return ''; }
  escapeMarkdown(text: string) { return text; }
}

class MockFrontmatterPort implements FrontmatterPort {
  parseFrontmatter(): ParsedFrontmatter {
    return { 
      frontmatter: {} as WikiPageFrontmatter, 
      content: '' 
    };
  }
  generateFrontmatter(frontmatter: WikiPageFrontmatter, content?: string) {
    const yaml = `---
title: ${frontmatter.title}
type: ${frontmatter.type}
tags: ${JSON.stringify(frontmatter.tags)}
${frontmatter.author ? `author: ${frontmatter.author}` : ''}
${frontmatter.date ? `date: ${frontmatter.date}` : ''}
${frontmatter.url ? `url: ${frontmatter.url}` : ''}
created: ${frontmatter.created}
updated: ${frontmatter.updated}
---

${content || ''}`;
    return yaml;
  }
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    return {
      title: partial.title || '',
      type: partial.type || 'source',
      tags: partial.tags || [],
      author: partial.author,
      date: partial.date,
      url: partial.url,
      created: partial.created || '2024-01-01',
      updated: partial.created || '2024-01-01',
    };
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    return frontmatter;
  }
}

describe('GenerateSourceSummaryUseCase', () => {
  let useCase: GenerateSourceSummaryUseCase;
  let markdownPort: MarkdownPort;
  let frontmatterPort: FrontmatterPort;

  beforeEach(() => {
    markdownPort = new MockMarkdownPort();
    frontmatterPort = new MockFrontmatterPort();
    useCase = new GenerateSourceSummaryUseCase(markdownPort, frontmatterPort);
  });

  it('should generate source summary page with all sections', () => {
    const options: SourceSummaryOptions = {
      title: 'Angular ARIA Guide',
      author: 'Angular Team',
      date: '2024-05-10',
      url: 'https://angular.dev/guide/accessibility',
      sourceType: 'article',
      rawSourcePath: 'raw/articles/angular-aria-guide.md',
      keyPoints: [
        'Angular provides built-in accessibility features',
        'Use semantic HTML elements',
        'Test with screen readers',
      ],
      insights: 'The guide emphasizes the importance of semantic HTML as the foundation for accessibility.',
      relevantEntities: ['Angular CDK', 'ARIA'],
      relevantConcepts: ['Accessibility', 'Semantic HTML'],
      quotes: [
        'Accessibility is not optional.',
        'Start with semantic HTML.',
      ],
      tags: ['angular', 'accessibility', 'guide'],
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('angular-aria-guide-2024-05-10.md');
    expect(page.frontmatter.title).toBe('Angular ARIA Guide');
    expect(page.frontmatter.type).toBe('source');
    expect(page.frontmatter.author).toBe('Angular Team');
    expect(page.frontmatter.date).toBe('2024-05-10');
    expect(page.frontmatter.url).toBe('https://angular.dev/guide/accessibility');
    expect(page.frontmatter.tags).toEqual(['angular', 'accessibility', 'guide']);

    expect(page.content).toContain('# Angular ARIA Guide');
    expect(page.content).toContain('## Metadata');
    expect(page.content).toContain('**Author**: Angular Team');
    expect(page.content).toContain('**Date**: 2024-05-10');
    expect(page.content).toContain('**URL**: [link](https://angular.dev/guide/accessibility)');
    expect(page.content).toContain('**Type**: article');
    expect(page.content).toContain('**Raw Source**: `raw/articles/angular-aria-guide.md`');
    expect(page.content).toContain('## Key Points');
    expect(page.content).toContain('- Angular provides built-in accessibility features');
    expect(page.content).toContain('## Insights');
    expect(page.content).toContain('semantic HTML as the foundation');
    expect(page.content).toContain('## Relevant Entities');
    expect(page.content).toContain('[[Angular CDK]]');
    expect(page.content).toContain('[[ARIA]]');
    expect(page.content).toContain('## Relevant Concepts');
    expect(page.content).toContain('[[Accessibility]]');
    expect(page.content).toContain('## Quotes');
    expect(page.content).toContain('> Accessibility is not optional.');
    expect(page.content).toContain('> Start with semantic HTML.');
  });

  it('should generate minimal source summary with only required fields', () => {
    const options: SourceSummaryOptions = {
      title: 'Quick Note',
      keyPoints: ['Point 1', 'Point 2'],
    };

    const page = useCase.execute(options);

    expect(page.filename).toMatch(/^quick-note-\d{4}-\d{2}-\d{2}\.md$/);
    expect(page.frontmatter.title).toBe('Quick Note');
    expect(page.frontmatter.type).toBe('source');
    expect(page.content).toContain('# Quick Note');
    expect(page.content).toContain('## Key Points');

    expect(page.content).not.toContain('## Insights');
    expect(page.content).not.toContain('## Relevant Entities');
    expect(page.content).not.toContain('## Relevant Concepts');
    expect(page.content).not.toContain('## Quotes');
  });

  it('should use provided date in filename', () => {
    const options: SourceSummaryOptions = {
      title: 'Test Source',
      date: '2023-12-25',
      keyPoints: ['Test'],
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('test-source-2023-12-25.md');
    expect(page.frontmatter.date).toBe('2023-12-25');
  });

  it('should handle all source types', () => {
    const types: Array<'article' | 'paper' | 'code' | 'note'> = ['article', 'paper', 'code', 'note'];

    for (const sourceType of types) {
      const options: SourceSummaryOptions = {
        title: `Test ${sourceType}`,
        sourceType,
        keyPoints: ['Test'],
      };

      const page = useCase.execute(options);
      expect(page.content).toContain(`**Type**: ${sourceType}`);
    }
  });
});
