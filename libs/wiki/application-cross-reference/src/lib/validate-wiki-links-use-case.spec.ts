import { describe, it, expect } from 'vitest';
import { ValidateWikiLinksUseCase } from './validate-wiki-links-use-case';
import { MarkdownPort } from '@wiki/application-ports';

describe('ValidateWikiLinksUseCase', () => {
  const createMockMarkdownPort = (links: string[]): MarkdownPort => ({
    extractWikiLinks: () => links,
  } as MarkdownPort);

  it('should identify valid links', () => {
    const content = 'See [[Angular CDK]] and [[Accessibility]] for details.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    const mockMarkdownPort = createMockMarkdownPort(['Angular CDK', 'Accessibility']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual(['Angular CDK', 'Accessibility']);
    expect(result.brokenLinks).toEqual([]);
    expect(result.totalLinks).toBe(2);
  });

  it('should identify broken links', () => {
    const content = 'See [[Angular CDK]] and [[NonExistent]] for details.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort(['Angular CDK', 'NonExistent']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.brokenLinks).toEqual(['NonExistent']);
    expect(result.totalLinks).toBe(2);
  });

  it('should perform case-insensitive validation', () => {
    const content = 'See [[angular cdk]] for details.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort(['angular cdk']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual(['angular cdk']);
    expect(result.brokenLinks).toEqual([]);
  });

  it('should handle content with no links', () => {
    const content = 'No links here.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort([]);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual([]);
    expect(result.brokenLinks).toEqual([]);
    expect(result.totalLinks).toBe(0);
  });

  it('should handle links with display text', () => {
    const content = 'See [[Angular CDK|the CDK]] for details.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort(['Angular CDK']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.totalLinks).toBe(1);
  });

  it('should handle links with section anchors', () => {
    const content = 'See [[Angular CDK#Properties]] for details.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort(['Angular CDK']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.totalLinks).toBe(1);
  });

  it('should handle duplicate links', () => {
    const content = 'See [[Angular CDK]] and [[Angular CDK]] again.';
    const existingPages = ['Angular CDK'];
    const mockMarkdownPort = createMockMarkdownPort(['Angular CDK']);
    const useCase = new ValidateWikiLinksUseCase(mockMarkdownPort);

    const result = useCase.execute(content, existingPages);

    expect(result.totalLinks).toBe(1);
    expect(result.validLinks).toEqual(['Angular CDK']);
  });
});
