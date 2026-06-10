import { MarkdownPort, FrontmatterPort } from '@wiki/application-ports';
import { generateFilename } from '@wiki/domain-naming';
import { ConceptPageOptions, GeneratedPage } from './interfaces';

export class GenerateConceptPageUseCase {
  constructor(
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  execute(options: ConceptPageOptions): GeneratedPage {
    const {
      name,
      explanation,
      applications = [],
      relatedConcepts = [],
      examples = [],
      tags = [],
      sources = [],
      created,
    } = options;

    const frontmatter = this.frontmatterPort.createFrontmatter({
      title: name,
      type: 'concept',
      tags,
      sources: sources.length > 0 ? sources : undefined,
      created,
    });

    const filename = generateFilename(name, 'concept');

    const sections: string[] = [];

    sections.push(this.markdownPort.generateHeading(name, 1));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Explanation', 2));
    sections.push(explanation);
    sections.push('');

    if (applications.length > 0) {
      sections.push(this.markdownPort.generateHeading('Applications', 2));
      sections.push(this.markdownPort.generateList(applications));
      sections.push('');
    }

    if (relatedConcepts.length > 0) {
      sections.push(this.markdownPort.generateHeading('Related Concepts', 2));
      const conceptLinks = relatedConcepts.map(concept => this.markdownPort.generateWikiLink(concept));
      sections.push(this.markdownPort.generateList(conceptLinks));
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
