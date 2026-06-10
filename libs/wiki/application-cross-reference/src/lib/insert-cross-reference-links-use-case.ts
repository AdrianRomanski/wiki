import { MarkdownPort } from '@wiki/application-ports';
import { CrossReference } from './cross-reference';

export class InsertCrossReferenceLinksUseCase {
  constructor(private markdownPort: MarkdownPort) {}

  execute(content: string, references: CrossReference[]): string {
    const sortedRefs = [...references].sort((a, b) => b.position - a.position);

    let result = content;

    for (const ref of sortedRefs) {
      const before = result.substring(0, ref.position);
      const after = result.substring(ref.position + ref.matchedText.length);
      const link = this.markdownPort.generateWikiLink(ref.targetTitle);

      result = before + link + after;
    }

    return result;
  }
}
