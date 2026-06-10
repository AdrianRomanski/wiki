import { FileSystemPort } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';
import { ParseIndexEntriesUseCase } from './parse-index-entries.use-case';
import { RegenerateIndexUseCase } from './regenerate-index.use-case';

export class AddEntryToIndexUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private parseEntriesUseCase: ParseIndexEntriesUseCase,
    private regenerateIndexUseCase: RegenerateIndexUseCase
  ) {}

  async execute(entry: IndexEntry): Promise<void> {
    const indexContent = await this.fileSystemPort.readWikiFile('index.md');
    const entries = this.parseEntriesUseCase.execute(indexContent);

    const existingIndex = entries.findIndex(e => e.path === entry.path);

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    await this.regenerateIndexUseCase.execute(entries);
  }
}
