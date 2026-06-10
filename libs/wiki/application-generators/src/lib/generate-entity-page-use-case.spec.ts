import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateEntityPageUseCase } from './generate-entity-page-use-case';
import { EntityPageOptions } from './interfaces';
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
${frontmatter.sources ? `sources: ${JSON.stringify(frontmatter.sources)}` : ''}
created: ${frontmatter.created}
updated: ${frontmatter.updated}
---

${content || ''}`;
    return yaml;
  }
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    return {
      title: partial.title || '',
      type: partial.type || 'entity',
      tags: partial.tags || [],
      sources: partial.sources,
      created: partial.created || '2024-01-01',
      updated: partial.created || '2024-01-01',
    };
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    return frontmatter;
  }
}

describe('GenerateEntityPageUseCase', () => {
  let useCase: GenerateEntityPageUseCase;
  let markdownPort: MarkdownPort;
  let frontmatterPort: FrontmatterPort;

  beforeEach(() => {
    markdownPort = new MockMarkdownPort();
    frontmatterPort = new MockFrontmatterPort();
    useCase = new GenerateEntityPageUseCase(markdownPort, frontmatterPort);
  });

  it('should generate entity page with all sections', () => {
    const options: EntityPageOptions = {
      name: 'Angular CDK',
      definition: 'The Angular Component Dev Kit provides behavior primitives for building UI components.',
      properties: [
        'Provides accessibility utilities',
        'Includes layout helpers',
        'Offers drag-and-drop functionality',
      ],
      relationships: [
        { target: 'Angular Material', description: 'Used in' },
        { target: 'Accessibility', description: 'Implements' },
      ],
      examples: ['```typescript\nimport { A11yModule } from "@angular/cdk/a11y";\n```'],
      tags: ['angular', 'accessibility', 'component-library'],
      sources: ['angular-cdk-docs-2024-05-10'],
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('angular-cdk.md');
    expect(page.frontmatter.title).toBe('Angular CDK');
    expect(page.frontmatter.type).toBe('entity');
    expect(page.frontmatter.tags).toEqual(['angular', 'accessibility', 'component-library']);
    expect(page.frontmatter.sources).toEqual(['angular-cdk-docs-2024-05-10']);

    expect(page.content).toContain('# Angular CDK');
    expect(page.content).toContain('## Definition');
    expect(page.content).toContain('behavior primitives');
    expect(page.content).toContain('## Properties');
    expect(page.content).toContain('- Provides accessibility utilities');
    expect(page.content).toContain('## Relationships');
    expect(page.content).toContain('Used in [[Angular Material]]');
    expect(page.content).toContain('Implements [[Accessibility]]');
    expect(page.content).toContain('## Examples');
    expect(page.content).toContain('```typescript');
    expect(page.content).toContain('## References');
    expect(page.content).toContain('[[angular-cdk-docs-2024-05-10]]');
  });

  it('should generate minimal entity page with only required fields', () => {
    const options: EntityPageOptions = {
      name: 'ARIA Live Region',
      definition: 'An ARIA live region is a section of a page that announces updates to screen readers.',
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('aria-live-region.md');
    expect(page.frontmatter.title).toBe('ARIA Live Region');
    expect(page.frontmatter.type).toBe('entity');
    expect(page.content).toContain('# ARIA Live Region');
    expect(page.content).toContain('## Definition');
    expect(page.content).toContain('announces updates to screen readers');

    expect(page.content).not.toContain('## Properties');
    expect(page.content).not.toContain('## Relationships');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });

  it('should handle special characters in entity name', () => {
    const options: EntityPageOptions = {
      name: 'Angular @Component Decorator',
      definition: 'The @Component decorator marks a class as an Angular component.',
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('angular-component-decorator.md');
    expect(page.frontmatter.title).toBe('Angular @Component Decorator');
    expect(page.content).toContain('# Angular @Component Decorator');
  });

  it('should handle empty arrays gracefully', () => {
    const options: EntityPageOptions = {
      name: 'Empty Entity',
      definition: 'Test',
      properties: [],
      relationships: [],
      examples: [],
      tags: [],
      sources: [],
    };

    const page = useCase.execute(options);

    expect(page.content).not.toContain('## Properties');
    expect(page.content).not.toContain('## Relationships');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });
});
