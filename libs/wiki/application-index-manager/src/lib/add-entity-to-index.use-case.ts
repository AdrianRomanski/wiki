import { WikiPage } from '@wiki/domain-models';
import { IndexEntry } from './index-entry';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';

export class AddEntityToIndexUseCase {
  constructor(private addEntryUseCase: AddEntryToIndexUseCase) {}

  async execute(page: WikiPage, description: string): Promise<void> {
    const entry: IndexEntry = {
      title: page.frontmatter.title,
      path: page.path,
      description,
      type: 'entity',
    };

    await this.addEntryUseCase.execute(entry);
  }
}
