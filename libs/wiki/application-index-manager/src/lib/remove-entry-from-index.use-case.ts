import { FileSystemPort } from '@wiki/application-ports';
import { ParseIndexEntriesUseCase } from './parse-index-entries.use-case';
import { RegenerateIndexUseCase } from './regenerate-index.use-case';

export class RemoveEntryFromIndexUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private parseEntriesUseCase: ParseIndexEntriesUseCase,
    private regenerateIndexUseCase: RegenerateIndexUseCase
  ) {}

  async execute(pagePath: string): Promise<void> {
    const indexContent = await this.fileSystemPort.readWikiFile('index.md');
    const entries = this.parseEntriesUseCase.execute(indexContent);
    const filteredEntries = entries.filter(entry => entry.path !== pagePath);

    await this.regenerateIndexUseCase.execute(filteredEntries);
  }
}
