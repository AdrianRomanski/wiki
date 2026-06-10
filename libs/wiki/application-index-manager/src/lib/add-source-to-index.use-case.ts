import { WikiPage } from '@wiki/domain-models';
import { IndexEntry } from './index-entry';
import { AddEntryToIndexUseCase } from './add-entry-to-index.use-case';

export class AddSourceToIndexUseCase {
  constructor(private addEntryUseCase: AddEntryToIndexUseCase) {}

  async execute(page: WikiPage, description: string): Promise<void> {
    const entry: IndexEntry = {
      title: page.frontmatter.title,
      path: page.path,
      description,
      type: 'source',
      date: page.frontmatter.date || page.frontmatter.created,
    };

    await this.addEntryUseCase.execute(entry);
  }
}
