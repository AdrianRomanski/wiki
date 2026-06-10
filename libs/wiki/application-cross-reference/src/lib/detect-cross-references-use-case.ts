import { MarkdownPort } from '@wiki/application-ports';
import { CrossReference } from './cross-reference';

export interface DetectCrossReferencesOptions {
  content: string;
  existingPages: string[];
  caseInsensitive?: boolean;
  minWordLength?: number;
}

export class DetectCrossReferencesUseCase {
  constructor(private markdownPort: MarkdownPort) {}

  execute(options: DetectCrossReferencesOptions): CrossReference[] {
    const {
      content,
      existingPages,
      caseInsensitive = true,
      minWordLength = 3,
    } = options;

    const references: CrossReference[] = [];
    const coveredRanges: Array<{ start: number; end: number }> = [];

    const validPages = existingPages.filter(page => page.length >= minWordLength);
    const sortedPages = [...validPages].sort((a, b) => b.length - a.length);

    for (const pageTitle of sortedPages) {
      const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?<=^|\\s|[^\\w])${escapedTitle}(?=$|\\s|[^\\w])`, caseInsensitive ? 'gi' : 'g');

      let match;
      while ((match = pattern.exec(content)) !== null) {
        const matchedText = match[0];
        const position = match.index;
        const endPosition = position + matchedText.length;

        if (this.isInsideWikiLink(content, position)) {
          continue;
        }

        const overlaps = coveredRanges.some(range =>
          (position >= range.start && position < range.end) ||
          (endPosition > range.start && endPosition <= range.end) ||
          (position <= range.start && endPosition >= range.end)
        );

        if (overlaps) {
          continue;
        }

        coveredRanges.push({ start: position, end: endPosition });

        references.push({
          matchedText,
          targetTitle: pageTitle,
          exists: true,
          position,
        });
      }
    }

    return references.sort((a, b) => a.position - b.position);
  }

  private isInsideWikiLink(content: string, position: number): boolean {
    const openBracket = content.lastIndexOf('[[', position);
    if (openBracket === -1) {
      return false;
    }

    const closeBracket = content.indexOf(']]', openBracket);
    if (closeBracket === -1) {
      return false;
    }

    return position >= openBracket && position <= closeBracket + 2;
  }
}
