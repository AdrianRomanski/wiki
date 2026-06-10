import { FileSystemPort } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';
import { IndexConfig, DEFAULT_INDEX_CONFIG } from './index-config';
import { ScanWikiPagesUseCase } from './scan-wiki-pages.use-case';
import { GenerateIndexContentUseCase } from './generate-index-content.use-case';

export class RegenerateIndexUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private scanPagesUseCase: ScanWikiPagesUseCase,
    private generateContentUseCase: GenerateIndexContentUseCase
  ) {}

  async execute(entries?: IndexEntry[], config: IndexConfig = DEFAULT_INDEX_CONFIG): Promise<void> {
    if (!entries) {
      entries = await this.scanPagesUseCase.execute();
    }

    const entities = entries
      .filter(e => e.type === 'entity')
      .sort((a, b) => a.title.localeCompare(b.title));

    const concepts = entries
      .filter(e => e.type === 'concept')
      .sort((a, b) => a.title.localeCompare(b.title));

    const sources = entries
      .filter(e => e.type === 'source')
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, config.maxRecentSources);

    const content = this.generateContentUseCase.execute(entities, concepts, sources, config);

    await this.fileSystemPort.writeWikiFile('index.md', content);
  }
}
