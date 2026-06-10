import { FileSystemPort, FrontmatterPort } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';

export class ScanWikiPagesUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  async execute(): Promise<IndexEntry[]> {
    const entries: IndexEntry[] = [];

    const entityFiles = await this.fileSystemPort.listWikiFiles('entities/*.md');
    for (const file of entityFiles) {
      const content = await this.fileSystemPort.readWikiFile(file);
      const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);
      const description = this.extractDescription(content);

      entries.push({
        title: frontmatter.title,
        path: file,
        description,
        type: 'entity',
      });
    }

    const conceptFiles = await this.fileSystemPort.listWikiFiles('concepts/*.md');
    for (const file of conceptFiles) {
      const content = await this.fileSystemPort.readWikiFile(file);
      const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);
      const description = this.extractDescription(content);

      entries.push({
        title: frontmatter.title,
        path: file,
        description,
        type: 'concept',
      });
    }

    const sourceFiles = await this.fileSystemPort.listWikiFiles('sources/*.md');
    for (const file of sourceFiles) {
      const content = await this.fileSystemPort.readWikiFile(file);
      const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);
      const description = this.extractDescription(content);

      entries.push({
        title: frontmatter.title,
        path: file,
        description,
        type: 'source',
        date: frontmatter.date || frontmatter.created,
      });
    }

    return entries;
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    let foundTitle = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        foundTitle = true;
        continue;
      }

      if (!foundTitle || !line.trim() || line.startsWith('#')) {
        continue;
      }

      if (line.trim()) {
        const description = line.trim();
        return description.length > 100
          ? description.substring(0, 97) + '...'
          : description;
      }
    }

    return 'No description available';
  }
}
