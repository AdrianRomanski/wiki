import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddConceptToIndexUseCase } from './add-concept-to-index.use-case';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';
import { WikiPage } from '@wiki/domain-models';

describe('AddConceptToIndexUseCase', () => {
  let useCase: AddConceptToIndexUseCase;
  let mockAddEntryUseCase: AddEntryToIndexUseCase;

  beforeEach(() => {
    mockAddEntryUseCase = {
      execute: vi.fn(),
    } as any;

    useCase = new AddConceptToIndexUseCase(mockAddEntryUseCase);
  });

  it('should add concept to index', async () => {
    const conceptPage: WikiPage = {
      path: 'concepts/progressive-enhancement.md',
      filename: 'progressive-enhancement.md',
      frontmatter: {
        title: 'Progressive Enhancement',
        type: 'concept',
        tags: ['accessibility', 'web-development'],
        created: '2024-01-01',
        updated: '2024-01-01',
      },
      content: 'Test content',
      sections: [],
      outgoingLinks: [],
      incomingLinks: [],
    };

    await useCase.execute(
      conceptPage,
      'Building accessible experiences that work for everyone'
    );

    expect(mockAddEntryUseCase.execute).toHaveBeenCalledWith({
      title: 'Progressive Enhancement',
      path: 'concepts/progressive-enhancement.md',
      description: 'Building accessible experiences that work for everyone',
      type: 'concept',
    });
  });
});
