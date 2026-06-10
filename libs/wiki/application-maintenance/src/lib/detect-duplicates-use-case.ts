import { FileSystemPort } from '@wiki/application-ports';
import { FrontmatterPort } from '@wiki/application-ports';

export class DetectDuplicatesUseCase {
  constructor(
    private readonly fileSystemPort: FileSystemPort,
    private readonly frontmatterPort: FrontmatterPort
  ) {}

  async execute(
    similarityThreshold = 0.7
  ): Promise<{
    page1: string;
    page2: string;
    similarity: number;
    recommendation: string;
  }[]> {
    const duplicates: {
      page1: string;
      page2: string;
      similarity: number;
      recommendation: string;
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

    const pages = Array.from(pageContents.keys());

    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const page1 = pages[i];
        const page2 = pages[j];
        const content1 = pageContents.get(page1);
        const content2 = pageContents.get(page2);

        if (!content1 || !content2) continue;

        const similarity = this.calculateSimilarity(content1, content2);

        if (similarity >= similarityThreshold) {
          duplicates.push({
            page1,
            page2,
            similarity,
            recommendation: `Consider merging these pages (${Math.round(similarity * 100)}% similar)`
          });
        }
      }
    }

    return duplicates;
  }

  private calculateSimilarity(content1: string, content2: string): number {
    const words1 = new Set(
      content1
        .toLowerCase()
        .match(/\b\w+\b/g) || []
    );

    const words2 = new Set(
      content2
        .toLowerCase()
        .match(/\b\w+\b/g) || []
    );

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }
}
