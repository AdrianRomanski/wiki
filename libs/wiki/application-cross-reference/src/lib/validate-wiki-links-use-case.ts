import { MarkdownPort } from '@wiki/application-ports';
import { LinkValidationResult } from './link-validation-result';

export class ValidateWikiLinksUseCase {
  constructor(private markdownPort: MarkdownPort) {}

  execute(content: string, existingPages: string[]): LinkValidationResult {
    const links = this.markdownPort.extractWikiLinks(content);
    const existingSet = new Set(existingPages.map(p => p.toLowerCase()));

    const validLinks: string[] = [];
    const brokenLinks: string[] = [];

    for (const link of links) {
      if (existingSet.has(link.toLowerCase())) {
        validLinks.push(link);
      } else {
        brokenLinks.push(link);
      }
    }

    return {
      validLinks,
      brokenLinks,
      totalLinks: links.length,
    };
  }
}
