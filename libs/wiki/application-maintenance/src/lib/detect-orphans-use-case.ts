import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';

export class DetectOrphansUseCase {
  constructor(
    private readonly fileSystemPort: FileSystemPort,
    private readonly markdownPort: MarkdownPort,
    private readonly frontmatterPort: FrontmatterPort
  ) {}

  async execute(): Promise<{
    page: string;
    reason: string;
  }[]> {
    const orphans: { page: string; reason: string }[] = [];

    const titleMap = await this.loadPageTitles();
    const linkMap = await this.extractAllWikiLinks();

    const incomingLinks = new Map<string, number>();

    for (const path of titleMap.values()) {
      incomingLinks.set(path, 0);
    }

    for (const [, links] of linkMap) {
      for (const link of links) {
        const targetPath = titleMap.get(link.toLowerCase());
        if (targetPath) {
          incomingLinks.set(targetPath, (incomingLinks.get(targetPath) || 0) + 1);
        }
      }
    }

    for (const [path, count] of incomingLinks) {
      if (count === 0) {
        orphans.push({
          page: path,
          reason: 'No incoming links from other pages'
        });
      }
    }

    return orphans;
  }

  private async loadPageTitles(): Promise<Map<string, string>> {
    const titleMap = new Map<string, string>();
    const subdirs = ['entities', 'concepts', 'sources'];

    for (const subdir of subdirs) {
      const pattern = `${subdir}/*.md`;

      try {
        const files = await this.fileSystemPort.listWikiFiles(pattern);

        for (const file of files) {
          try {
            const content = await this.fileSystemPort.readWikiFile(file);
            const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);

            titleMap.set(frontmatter.title.toLowerCase(), file);
          } catch (error) {
            console.warn(`Warning: Could not parse ${file}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not list files in ${subdir}:`, error);
      }
    }

    return titleMap;
  }

  private async extractAllWikiLinks(): Promise<Map<string, string[]>> {
    const linkMap = new Map<string, string[]>();
    const subdirs = ['entities', 'concepts', 'sources'];

    for (const subdir of subdirs) {
      const pattern = `${subdir}/*.md`;

      try {
        const files = await this.fileSystemPort.listWikiFiles(pattern);

        for (const file of files) {
          try {
            const content = await this.fileSystemPort.readWikiFile(file);
            const links = this.markdownPort.extractWikiLinks(content);
            linkMap.set(file, links);
          } catch (error) {
            console.warn(`Warning: Could not read ${file}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not list files in ${subdir}:`, error);
      }
    }

    return linkMap;
  }
}
