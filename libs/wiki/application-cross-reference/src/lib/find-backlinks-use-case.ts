import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';

export class FindBacklinksUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  async execute(pageTitle: string, wikiDir: string): Promise<string[]> {
    const backlinks: string[] = [];
    const subdirs = ['entities', 'concepts', 'sources'];

    for (const subdir of subdirs) {
      const pattern = `${wikiDir}/${subdir}/*.md`;
      const files = await this.fileSystemPort.listWikiFiles(pattern);

      for (const filePath of files) {
        const content = await this.fileSystemPort.readWikiFile(filePath);
        const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);

        if (frontmatter.title === pageTitle) {
          continue;
        }

        const links = this.markdownPort.extractWikiLinks(content);
        if (links.some(link => link.toLowerCase() === pageTitle.toLowerCase())) {
          backlinks.push(frontmatter.title);
        }
      }
    }

    return backlinks;
  }
}
