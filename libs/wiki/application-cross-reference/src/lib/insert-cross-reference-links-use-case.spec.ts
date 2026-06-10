import { describe, it, expect } from 'vitest';
import { InsertCrossReferenceLinksUseCase } from './insert-cross-reference-links-use-case';
import { MarkdownPort } from '@wiki/application-ports';
import { CrossReference } from './cross-reference';

describe('InsertCrossReferenceLinksUseCase', () => {
  const mockMarkdownPort: MarkdownPort = {
    generateWikiLink: (target: string) => `[[${target}]]`,
  } as MarkdownPort;
  const useCase = new InsertCrossReferenceLinksUseCase(mockMarkdownPort);

  it('should insert wiki links for detected references', () => {
    const content = 'The Angular CDK provides utilities.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 4,
      },
    ];

    const result = useCase.execute(content, refs);

    expect(result).toBe('The [[Angular CDK]] provides utilities.');
  });

  it('should handle multiple references', () => {
    const content = 'Angular CDK and Accessibility are important.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 0,
      },
      {
        matchedText: 'Accessibility',
        targetTitle: 'Accessibility',
        exists: true,
        position: 16,
      },
    ];

    const result = useCase.execute(content, refs);

    expect(result).toBe('[[Angular CDK]] and [[Accessibility]] are important.');
  });

  it('should handle references in reverse order', () => {
    const content = 'First and Second are here.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Second',
        targetTitle: 'Second',
        exists: true,
        position: 10,
      },
      {
        matchedText: 'First',
        targetTitle: 'First',
        exists: true,
        position: 0,
      },
    ];

    const result = useCase.execute(content, refs);

    expect(result).toBe('[[First]] and [[Second]] are here.');
  });

  it('should handle empty references array', () => {
    const content = 'No references here.';
    const refs: CrossReference[] = [];

    const result = useCase.execute(content, refs);

    expect(result).toBe(content);
  });

  it('should preserve existing content structure', () => {
    const content = 'Line 1\nAngular CDK\nLine 3';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 7,
      },
    ];

    const result = useCase.execute(content, refs);

    expect(result).toBe('Line 1\n[[Angular CDK]]\nLine 3');
  });
});
