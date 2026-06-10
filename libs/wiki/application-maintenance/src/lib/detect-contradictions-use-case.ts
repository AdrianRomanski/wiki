import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';

export class DetectContradictionsUseCase {
  private readonly contradictionMarkers = [
    'however',
    'but',
    'on the other hand',
    'contrary to',
    'unlike',
    'different from'
  ];

  constructor(
    private readonly fileSystemPort: FileSystemPort,
    private readonly markdownPort: MarkdownPort,
    private readonly frontmatterPort: FrontmatterPort
  ) {}

  async execute(): Promise<{
    pages: string[];
    contradiction: string;
    severity: 'low' | 'medium' | 'high';
  }[]> {
    const contradictions: {
      pages: string[];
      contradiction: string;
      severity: 'low' | 'medium' | 'high';
    }[] = [];

    const pageContents = new Map<string, string>();
    const subdirs = ['entities', 'concepts', 'sources'];

    for (const subdir of subdirs) {
      const pattern = `${subdir}/*.md`;

      try {
        const files = await this.fileSystemPort.listWikiFiles(pattern);

        for (const file of files) {
          try {
            const fileContent = await this.fileSystemPort.readWikiFile(file);
            const { content } = this.frontmatterPort.parseFrontmatter(fileContent);
            pageContents.set(file, content);
          } catch (error) {
            console.warn(`Warning: Could not read ${file}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not list files in ${subdir}:`, error);
      }
    }

    const linkMap = await this.extractAllWikiLinks();
    const titleMap = await this.loadPageTitles();

    const pathToTitle = new Map<string, string>();
    for (const [title, path] of titleMap) {
      pathToTitle.set(path, title);
    }

    for (const [pagePath, links] of linkMap) {
      const content = pageContents.get(pagePath);
      if (!content) continue;

      const contentLower = content.toLowerCase();

      const hasContradictionMarker = this.contradictionMarkers.some(marker =>
        contentLower.includes(marker)
      );

      if (hasContradictionMarker && links.length > 0) {
        const linkedPages: string[] = [];
        for (const link of links) {
          const linkedPath = titleMap.get(link.toLowerCase());
          if (linkedPath) {
            linkedPages.push(linkedPath);
          }
        }

        if (linkedPages.length > 0) {
          const pagesSet = new Set([pagePath, ...linkedPages].sort());
          const alreadyAdded = contradictions.some(c => {
            const existingSet = new Set(c.pages.sort());
            return pagesSet.size === existingSet.size &&
              [...pagesSet].every(p => existingSet.has(p));
          });

          if (!alreadyAdded) {
            contradictions.push({
              pages: [pagePath, ...linkedPages],
              contradiction: `Page contains contradiction markers and references other pages`,
              severity: 'low'
            });
          }
        }
      }
    }

    return contradictions;
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
