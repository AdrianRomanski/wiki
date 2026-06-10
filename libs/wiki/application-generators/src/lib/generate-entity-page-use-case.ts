import { MarkdownPort, FrontmatterPort } from '@wiki/application-ports';
import { generateFilename } from '@wiki/domain-naming';
import { EntityPageOptions, GeneratedPage } from './interfaces';

export class GenerateEntityPageUseCase {
  constructor(
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  execute(options: EntityPageOptions): GeneratedPage {
    const {
      name,
      definition,
      properties = [],
      relationships = [],
      examples = [],
      tags = [],
      sources = [],
      created,
    } = options;

    const frontmatter = this.frontmatterPort.createFrontmatter({
      title: name,
      type: 'entity',
      tags,
      sources: sources.length > 0 ? sources : undefined,
      created,
    });

    const filename = generateFilename(name, 'entity');

    const sections: string[] = [];

    sections.push(this.markdownPort.generateHeading(name, 1));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Definition', 2));
    sections.push(definition);
    sections.push('');

    if (properties.length > 0) {
      sections.push(this.markdownPort.generateHeading('Properties', 2));
      sections.push(this.markdownPort.generateList(properties));
      sections.push('');
    }

    if (relationships.length > 0) {
      sections.push(this.markdownPort.generateHeading('Relationships', 2));
      const relationshipItems = relationships.map(rel =>
        `${rel.description} ${this.markdownPort.generateWikiLink(rel.target)}`
      );
      sections.push(this.markdownPort.generateList(relationshipItems));
      sections.push('');
    }

    if (examples.length > 0) {
      sections.push(this.markdownPort.generateHeading('Examples', 2));
      for (const example of examples) {
        sections.push(example);
        sections.push('');
      }
    }

    if (sources.length > 0) {
      sections.push(this.markdownPort.generateHeading('References', 2));
      const sourceLinks = sources.map(source => this.markdownPort.generateWikiLink(source));
      sections.push(this.markdownPort.generateList(sourceLinks));
      sections.push('');
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
