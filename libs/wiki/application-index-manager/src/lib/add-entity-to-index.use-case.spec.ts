import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddEntityToIndexUseCase } from './add-entity-to-index.use-case';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';
import { WikiPage } from '@wiki/domain-models';

describe('AddEntityToIndexUseCase', () => {
  let useCase: AddEntityToIndexUseCase;
  let mockAddEntryUseCase: AddEntryToIndexUseCase;

  beforeEach(() => {
    mockAddEntryUseCase = {
      execute: vi.fn(),
    } as any;

    useCase = new AddEntityToIndexUseCase(mockAddEntryUseCase);
  });

  it('should add entity to index', async () => {
    const entityPage: WikiPage = {
      path: 'entities/angular-cdk.md',
      filename: 'angular-cdk.md',
      frontmatter: {
        title: 'Angular CDK',
        type: 'entity',
        tags: ['angular', 'accessibility'],
        created: '2024-01-01',
        updated: '2024-01-01',
      },
      content: 'Test content',
      sections: [],
      outgoingLinks: [],
      incomingLinks: [],
    };

    await useCase.execute(entityPage, 'Angular Component Dev Kit');

    expect(mockAddEntryUseCase.execute).toHaveBeenCalledWith({
      title: 'Angular CDK',
      path: 'entities/angular-cdk.md',
      description: 'Angular Component Dev Kit',
      type: 'entity',
    });
  });
});
