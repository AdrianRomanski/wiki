import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';
import { RegenerateIndexUseCase, ScanWikiPagesUseCase, GenerateIndexContentUseCase } from '@wiki/application-index-manager';
import { GenerateIndexOptions, GenerateIndexResult, WorkflowError } from './interfaces';

export class GenerateIndexWorkflow {
  private regenerateIndex: RegenerateIndexUseCase;

  constructor(
    private fileSystemPort: FileSystemPort,
    private frontmatterPort: FrontmatterPort,
    private markdownPort: MarkdownPort
  ) {
    const scanPages = new ScanWikiPagesUseCase(
      fileSystemPort,
      frontmatterPort
    );
    const generateContent = new GenerateIndexContentUseCase(markdownPort);
    this.regenerateIndex = new RegenerateIndexUseCase(
      fileSystemPort,
      scanPages,
      generateContent
    );
  }

  async execute(options: GenerateIndexOptions = {}): Promise<GenerateIndexResult> {
    const { regenerate = true } = options;

    try {
      if (!regenerate) {
        const indexExists = await this.fileSystemPort.wikiFileExists('index.md');
        if (indexExists) {
          const content = await this.fileSystemPort.readWikiFile('index.md');
          const entryCount = this.countIndexEntries(content);
          return {
            indexPath: 'index.md',
            entryCount,
          };
        }
      }

      await this.regenerateIndex.execute();

      const content = await this.fileSystemPort.readWikiFile('index.md');
      const entryCount = this.countIndexEntries(content);

      return {
        indexPath: 'index.md',
        entryCount,
      };
    } catch (error) {
      throw new WorkflowError(
        'Failed to generate index',
        error as Error
      );
    }
  }

  private countIndexEntries(content: string): number {
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
      if (line.trim().startsWith('-') && line.includes('[[')) {
        count++;
      }
    }

    return count;
  }
}
