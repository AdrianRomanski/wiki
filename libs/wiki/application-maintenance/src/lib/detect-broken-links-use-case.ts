import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';

export class DetectBrokenLinksUseCase {
  constructor(
    private readonly fileSystemPort: FileSystemPort,
    private readonly markdownPort: MarkdownPort,
    private readonly frontmatterPort: FrontmatterPort
  ) {}

  async execute(): Promise<{
    page: string;
    brokenLinks: string[];
  }[]> {
    const linkMap = await this.extractAllWikiLinks();
    const titleMap = await this.loadPageTitles();
    const results: { page: string; brokenLinks: string[] }[] = [];

    for (const [pagePath, links] of linkMap) {
      const brokenLinks: string[] = [];

      for (const link of links) {
        const linkLower = link.toLowerCase();
        if (!titleMap.has(linkLower)) {
          brokenLinks.push(link);
        }
      }

      if (brokenLinks.length > 0) {
        results.push({
          page: pagePath,
          brokenLinks
        });
      }
    }

    return results;
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
}
