import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddSourceToIndexUseCase } from './add-source-to-index.use-case';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';
import { WikiPage } from '@wiki/domain-models';

describe('AddSourceToIndexUseCase', () => {
  let useCase: AddSourceToIndexUseCase;
  let mockAddEntryUseCase: AddEntryToIndexUseCase;

  beforeEach(() => {
    mockAddEntryUseCase = {
      execute: vi.fn(),
    } as any;

    useCase = new AddSourceToIndexUseCase(mockAddEntryUseCase);
  });

  it('should add source to index with date', async () => {
    const sourcePage: WikiPage = {
      path: 'sources/example-source-2024-05-10.md',
      filename: 'example-source-2024-05-10.md',
      frontmatter: {
        title: 'Example Source',
        type: 'source',
        tags: ['research'],
        date: '2024-05-10',
        created: '2024-05-10',
        updated: '2024-05-10',
      },
      content: 'Test content',
      sections: [],
      outgoingLinks: [],
      incomingLinks: [],
    };

    await useCase.execute(sourcePage, 'Example source summary');

    expect(mockAddEntryUseCase.execute).toHaveBeenCalledWith({
      title: 'Example Source',
      path: 'sources/example-source-2024-05-10.md',
      description: 'Example source summary',
      type: 'source',
      date: '2024-05-10',
    });
  });

  it('should use created date when date is not provided', async () => {
    const sourcePage: WikiPage = {
      path: 'sources/example-source.md',
      filename: 'example-source.md',
      frontmatter: {
        title: 'Example Source',
        type: 'source',
        tags: ['research'],
        created: '2024-01-01',
        updated: '2024-01-01',
      },
      content: 'Test content',
      sections: [],
      outgoingLinks: [],
      incomingLinks: [],
    };

    await useCase.execute(sourcePage, 'Example source summary');

    expect(mockAddEntryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2024-01-01',
      })
    );
  });
});
