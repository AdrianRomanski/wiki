import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';

export interface BidirectionalLinkSuggestion {
  from: string;
  to: string;
  reason: string;
}

export class SuggestBidirectionalLinksUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  async execute(wikiDir: string): Promise<BidirectionalLinkSuggestion[]> {
    const suggestions: BidirectionalLinkSuggestion[] = [];
    const subdirs = ['entities', 'concepts', 'sources'];

    const pageLinks = new Map<string, string[]>();

    for (const subdir of subdirs) {
      const pattern = `${wikiDir}/${subdir}/*.md`;
      const files = await this.fileSystemPort.listWikiFiles(pattern);

      for (const filePath of files) {
        const content = await this.fileSystemPort.readWikiFile(filePath);
        const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);
        const links = this.markdownPort.extractWikiLinks(content);

        pageLinks.set(frontmatter.title, links);
      }
    }

    for (const [pageTitle, outgoingLinks] of pageLinks.entries()) {
      for (const targetTitle of outgoingLinks) {
        const targetLinks = pageLinks.get(targetTitle);

        if (targetLinks && !targetLinks.some(link => link.toLowerCase() === pageTitle.toLowerCase())) {
          suggestions.push({
            from: targetTitle,
            to: pageTitle,
            reason: `${pageTitle} links to ${targetTitle}`,
          });
        }
      }
    }

    return suggestions;
  }
}
