import { describe, it, expect } from 'vitest';
import { DetectCrossReferencesUseCase } from './detect-cross-references-use-case';
import { MarkdownPort } from '@wiki/application-ports';

describe('DetectCrossReferencesUseCase', () => {
  const mockMarkdownPort: MarkdownPort = {} as MarkdownPort;
  const useCase = new DetectCrossReferencesUseCase(mockMarkdownPort);

  it('should detect entity mentions in content', () => {
    const content = 'The Angular CDK provides accessibility utilities for building components.';
    const existingPages = ['Angular CDK', 'Accessibility'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Accessibility')).toBe(true);
  });

  it('should perform case-insensitive matching by default', () => {
    const content = 'The angular cdk provides ACCESSIBILITY utilities.';
    const existingPages = ['Angular CDK', 'Accessibility'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(2);
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Accessibility')).toBe(true);
  });

  it('should match longer phrases before shorter ones', () => {
    const content = 'The Angular CDK and Angular Material are related.';
    const existingPages = ['Angular', 'Angular CDK', 'Angular Material'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Angular Material')).toBe(true);

    const angularMatches = refs.filter(r => r.targetTitle === 'Angular');
    expect(angularMatches.length).toBe(0);
  });

  it('should not match inside existing wiki links', () => {
    const content = 'See [[Angular CDK]] for details about Angular CDK.';
    const existingPages = ['Angular CDK'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(1);
    expect(refs[0].position).toBeGreaterThan(content.indexOf(']]'));
  });

  it('should respect minimum word length', () => {
    const content = 'The UI is built with Angular.';
    const existingPages = ['UI', 'Angular'];

    const refs = useCase.execute({
      content,
      existingPages,
      minWordLength: 3,
    });

    expect(refs.some(r => r.targetTitle === 'Angular')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'UI')).toBe(false);
  });

  it('should handle special characters in page titles', () => {
    const content = 'Use the @Component decorator in Angular.';
    const existingPages = ['@Component'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.some(r => r.targetTitle === '@Component')).toBe(true);
  });

  it('should return references sorted by position', () => {
    const content = 'Angular CDK and Accessibility are important. Angular CDK is useful.';
    const existingPages = ['Angular CDK', 'Accessibility'];

    const refs = useCase.execute({ content, existingPages });

    for (let i = 1; i < refs.length; i++) {
      expect(refs[i].position).toBeGreaterThanOrEqual(refs[i - 1].position);
    }
  });

  it('should handle empty existing pages list', () => {
    const content = 'Some content here.';
    const existingPages: string[] = [];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(0);
  });

  it('should handle empty content', () => {
    const content = '';
    const existingPages = ['Angular CDK'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(0);
  });

  it('should match at word boundaries only', () => {
    const content = 'The accessibility-tree and accessibility are different.';
    const existingPages = ['accessibility'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(2);
    expect(refs.every(r => r.targetTitle === 'accessibility')).toBe(true);
  });

  it('should handle overlapping page titles', () => {
    const content = 'Angular and Angular CDK are different.';
    const existingPages = ['Angular', 'Angular CDK'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
  });

  it('should handle page titles with punctuation', () => {
    const content = 'Use the @Component decorator.';
    const existingPages = ['@Component'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.some(r => r.targetTitle === '@Component')).toBe(true);
  });

  it('should handle multiline content', () => {
    const content = `First line with Angular CDK.
Second line with Accessibility.
Third line.`;
    const existingPages = ['Angular CDK', 'Accessibility'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(2);
  });

  it('should handle content with code blocks', () => {
    const content = '```typescript\nimport { Angular } from "angular";\n```\nUse Angular here.';
    const existingPages = ['Angular'];

    const refs = useCase.execute({ content, existingPages });

    expect(refs.length).toBe(3);
  });
});
