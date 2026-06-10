import { describe, it, expect } from 'vitest';
import { DetectCrossReferencesUseCase } from './detect-cross-references-use-case';
import { InsertCrossReferenceLinksUseCase } from './insert-cross-reference-links-use-case';
import { ValidateWikiLinksUseCase } from './validate-wiki-links-use-case';
import { MarkdownPort } from '@wiki/application-ports';

describe('Integration: detect and insert', () => {
  const mockMarkdownPort: MarkdownPort = {
    generateWikiLink: (target: string) => `[[${target}]]`,
    extractWikiLinks: (content: string) => {
      const regex = /\[\[([^\]|#]+)(?:[|#][^\]]*?)?\]\]/g;
      const links: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        links.push(match[1]);
      }
      return [...new Set(links)];
    },
  } as MarkdownPort;

  const detectUseCase = new DetectCrossReferencesUseCase(mockMarkdownPort);
  const insertUseCase = new InsertCrossReferenceLinksUseCase(mockMarkdownPort);
  const validateUseCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

  it('should detect and insert links in one workflow', () => {
    const content = 'The Angular CDK provides accessibility utilities.';
    const existingPages = ['Angular CDK', 'Accessibility'];

    const refs = detectUseCase.execute({ content, existingPages });
    const linked = insertUseCase.execute(content, refs);

    expect(linked).toContain('[[Angular CDK]]');
    expect(linked).toContain('[[Accessibility]]');

    const validation = validateUseCase.execute(linked, existingPages);
    expect(validation.brokenLinks.length).toBe(0);
  });

  it('should not double-link already linked content', () => {
    const content = 'See [[Angular CDK]] for Angular CDK details.';
    const existingPages = ['Angular CDK'];

    const refs = detectUseCase.execute({ content, existingPages });
    const linked = insertUseCase.execute(content, refs);

    const linkCount = (linked.match(/\[\[Angular CDK\]\]/g) || []).length;
    expect(linkCount).toBe(2);
  });
});
