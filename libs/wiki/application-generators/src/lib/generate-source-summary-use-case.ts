import { MarkdownPort, FrontmatterPort } from '@wiki/application-ports';
import { generateFilename } from '@wiki/domain-naming';
import { SourceSummaryOptions, GeneratedPage } from './interfaces';

export class GenerateSourceSummaryUseCase {
  constructor(
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  execute(options: SourceSummaryOptions): GeneratedPage {
    const {
      title,
      author,
      date,
      url,
      sourceType,
      rawSourcePath,
      keyPoints,
      insights,
      relevantEntities = [],
      relevantConcepts = [],
      quotes = [],
      tags = [],
      created,
    } = options;

    const frontmatter = this.frontmatterPort.createFrontmatter({
      title,
      type: 'source',
      tags,
      author,
      date,
      url,
      created,
    });

    const filename = generateFilename(title, 'source', date ? new Date(date) : undefined);

    const sections: string[] = [];

    sections.push(this.markdownPort.generateHeading(title, 1));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Metadata', 2));
    const metadata: string[] = [];
    if (author) metadata.push(`**Author**: ${author}`);
    if (date) metadata.push(`**Date**: ${date}`);
    if (url) metadata.push(`**URL**: [link](${url})`);
    if (sourceType) metadata.push(`**Type**: ${sourceType}`);
    if (rawSourcePath) metadata.push(`**Raw Source**: \`${rawSourcePath}\``);
    sections.push(metadata.join('\n'));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Key Points', 2));
    sections.push(this.markdownPort.generateList(keyPoints));
    sections.push('');

    if (insights) {
      sections.push(this.markdownPort.generateHeading('Insights', 2));
      sections.push(insights);
      sections.push('');
    }

    if (relevantEntities.length > 0) {
      sections.push(this.markdownPort.generateHeading('Relevant Entities', 2));
      const entityLinks = relevantEntities.map(entity => this.markdownPort.generateWikiLink(entity));
      sections.push(this.markdownPort.generateList(entityLinks));
      sections.push('');
    }

    if (relevantConcepts.length > 0) {
      sections.push(this.markdownPort.generateHeading('Relevant Concepts', 2));
      const conceptLinks = relevantConcepts.map(concept => this.markdownPort.generateWikiLink(concept));
      sections.push(this.markdownPort.generateList(conceptLinks));
      sections.push('');
    }

    if (quotes.length > 0) {
      sections.push(this.markdownPort.generateHeading('Quotes', 2));
      for (const quote of quotes) {
        sections.push(`> ${quote}`);
        sections.push('');
      }
    }

    const bodyContent = sections.join('\n').trim();

    const content = this.frontmatterPort.generateFrontmatter(frontmatter, bodyContent);

    return {
      content,
      filename,
      frontmatter,
    };
  }
}
