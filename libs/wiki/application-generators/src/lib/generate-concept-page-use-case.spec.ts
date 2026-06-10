import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateConceptPageUseCase } from './generate-concept-page-use-case';
import { ConceptPageOptions } from './interfaces';
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
      type: partial.type || 'concept',
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

describe('GenerateConceptPageUseCase', () => {
  let useCase: GenerateConceptPageUseCase;
  let markdownPort: MarkdownPort;
  let frontmatterPort: FrontmatterPort;

  beforeEach(() => {
    markdownPort = new MockMarkdownPort();
    frontmatterPort = new MockFrontmatterPort();
    useCase = new GenerateConceptPageUseCase(markdownPort, frontmatterPort);
  });

  it('should generate concept page with all sections', () => {
    const options: ConceptPageOptions = {
      name: 'Progressive Enhancement',
      explanation: 'Progressive enhancement is a design philosophy that provides a baseline experience to all users while enhancing the experience for users with more capable browsers.',
      applications: [
        'Building accessible web applications',
        'Ensuring functionality without JavaScript',
        'Supporting older browsers',
      ],
      relatedConcepts: ['Graceful Degradation', 'Accessibility', 'Semantic HTML'],
      examples: ['Start with semantic HTML, then add CSS, then add JavaScript.'],
      tags: ['web-development', 'accessibility', 'design-pattern'],
      sources: ['progressive-enhancement-guide-2024-03-15'],
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('progressive-enhancement.md');
    expect(page.frontmatter.title).toBe('Progressive Enhancement');
    expect(page.frontmatter.type).toBe('concept');
    expect(page.frontmatter.tags).toEqual(['web-development', 'accessibility', 'design-pattern']);

    expect(page.content).toContain('# Progressive Enhancement');
    expect(page.content).toContain('## Explanation');
    expect(page.content).toContain('design philosophy');
    expect(page.content).toContain('## Applications');
    expect(page.content).toContain('- Building accessible web applications');
    expect(page.content).toContain('## Related Concepts');
    expect(page.content).toContain('[[Graceful Degradation]]');
    expect(page.content).toContain('[[Accessibility]]');
    expect(page.content).toContain('## Examples');
    expect(page.content).toContain('semantic HTML');
    expect(page.content).toContain('## References');
  });

  it('should generate minimal concept page with only required fields', () => {
    const options: ConceptPageOptions = {
      name: 'Keyboard Navigation',
      explanation: 'Keyboard navigation allows users to interact with a website using only keyboard inputs.',
    };

    const page = useCase.execute(options);

    expect(page.filename).toBe('keyboard-navigation.md');
    expect(page.frontmatter.title).toBe('Keyboard Navigation');
    expect(page.frontmatter.type).toBe('concept');
    expect(page.content).toContain('# Keyboard Navigation');
    expect(page.content).toContain('## Explanation');

    expect(page.content).not.toContain('## Applications');
    expect(page.content).not.toContain('## Related Concepts');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });
});
