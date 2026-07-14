import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';

type IndexPageType = 'entity' | 'concept' | 'source';

interface ScannedPage {
  type: IndexPageType;
  title: string;
  file: string;
  description: string;
  date: string;
}

const SECTION_DIRS: Array<{ subdir: string; type: IndexPageType }> = [
  { subdir: 'entities', type: 'entity' },
  { subdir: 'concepts', type: 'concept' },
  { subdir: 'sources', type: 'source' },
];

const MAX_RECENT_SOURCES = 10;
const DESCRIPTION_TRUNCATE_AT = 120;
const DESCRIPTION_TRUNCATE_TO = 117;

/**
 * Regenerates wiki/index.md from the actual files on disk.
 *
 * Scans entities/, concepts/, and sources/, parses each file's frontmatter
 * for title/date/created, derives a description from the first paragraph
 * after the H1 heading, and renders the fixed index layout verbatim
 * (content-equivalent to the pre-migration `generate-wiki-index.mjs` script).
 */
export class GenerateIndexUseCase {
  constructor(
    private readonly fs: FileSystemPort,
    private readonly frontmatter: FrontmatterPort,
    private readonly markdown: MarkdownPort
  ) {}

  async execute(): Promise<{ entities: number; concepts: number; sources: number }> {
    const scanned: Record<IndexPageType, ScannedPage[]> = {
      entity: [],
      concept: [],
      source: [],
    };

    for (const { subdir, type } of SECTION_DIRS) {
      scanned[type] = await this.scanSection(subdir, type);
    }

    const entities = [...scanned.entity].sort((a, b) => a.title.localeCompare(b.title));
    const concepts = [...scanned.concept].sort((a, b) => a.title.localeCompare(b.title));
    const sources = [...scanned.source]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_RECENT_SOURCES);

    const content = this.renderIndex(entities, concepts, sources);
    await this.fs.writeWikiFile('index.md', content);

    return { entities: entities.length, concepts: concepts.length, sources: sources.length };
  }

  private async scanSection(subdir: string, type: IndexPageType): Promise<ScannedPage[]> {
    const files = await this.fs.listWikiFiles(`${subdir}/*.md`);
    const pages: ScannedPage[] = [];

    for (const file of files) {
      const raw = await this.fs.readWikiFile(file);
      const { frontmatter, content } = this.frontmatter.parseFrontmatter(raw);

      pages.push({
        type,
        title: frontmatter.title || file,
        file,
        description: this.extractDescription(content),
        date: frontmatter.date || frontmatter.created || '',
      });
    }

    return pages;
  }

  /** Pull the first non-empty paragraph after the H1 as a description. */
  private extractDescription(body: string): string {
    const lines = body.split('\n');
    let pastTitle = false;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        pastTitle = true;
        continue;
      }
      if (!pastTitle || !line.trim() || line.startsWith('#')) continue;

      const desc = line.trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
      return desc.length > DESCRIPTION_TRUNCATE_AT
        ? desc.slice(0, DESCRIPTION_TRUNCATE_TO) + '...'
        : desc;
    }

    return '';
  }

  private renderSection(
    label: string,
    italic: string,
    items: ScannedPage[],
    renderLine: (item: ScannedPage) => string
  ): string {
    const lines = [`## ${label}`, '', `*${italic}*`, ''];
    if (items.length) {
      items.forEach((item) => lines.push(renderLine(item)));
    } else {
      lines.push(`*No ${label.toLowerCase()} yet*`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private renderIndex(
    entities: ScannedPage[],
    concepts: ScannedPage[],
    sources: ScannedPage[]
  ): string {
    const today = new Date().toISOString().split('T')[0];
    const total = entities.length + concepts.length + sources.length;
    const toWikiLink = (title: string) => this.markdown.generateWikiLink(title);

    const index = [
      '# Wiki Index',
      '',
      '## Overview',
      '',
      'Welcome to the LLM Wiki Second Brain - an AI-powered knowledge management system for the Angular Aria research project. This wiki maintains a curated, cross-referenced knowledge base that compounds research findings over time.',
      '',
      '**Key Features:**',
      '- 📚 Immutable raw sources in `raw/` directory',
      '- 🤖 AI-generated, structured wiki pages',
      '- 🔗 Cross-referenced knowledge graph using [[WikiLink]] syntax',
      '- 📝 Git-versioned for history and collaboration',
      '- 🔍 Compatible with Obsidian and search tools',
      '',
      '## Getting Started',
      '',
      '1. **Add Sources**: Place documents in `raw/` subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)',
      '2. **Ingest Content**: Run ingestion workflow to generate wiki pages',
      '3. **Query Knowledge**: Search by tags, names, or full-text',
      '4. **Maintain Quality**: Run periodic maintenance to consolidate and validate',
      '',
      this.renderSection(
        'Entities',
        'Entity pages describe specific things: libraries, tools, components, APIs',
        entities,
        (e) => `- ${toWikiLink(e.title)}${e.description ? ' — ' + e.description : ''}`
      ),
      this.renderSection(
        'Concepts',
        'Concept pages explain ideas, patterns, and principles',
        concepts,
        (c) => `- ${toWikiLink(c.title)}${c.description ? ' — ' + c.description : ''}`
      ),
      this.renderSection(
        'Recent Sources',
        'Source summaries distill key information from raw documents',
        sources,
        (s) => `- ${toWikiLink(s.title)}${s.description ? ' — ' + s.description : ''}`
      ),
      '## Navigation',
      '',
      '- [Activity Log](activity-log.md) - Chronological record of wiki changes',
      '- [All Entities](entities/) - Browse all entity pages',
      '- [All Concepts](concepts/) - Browse all concept pages',
      '- [All Sources](sources/) - Browse all source summaries',
      '- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions',
      '',
      '## Statistics',
      '',
      `- **Total Pages**: ${total} (${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}, ${concepts.length} concepts, ${sources.length} ${sources.length === 1 ? 'source' : 'sources'})`,
      `- **Last Updated**: ${today}`,
      '- **Wiki Health**: ✅',
      '',
      '## Quick Reference',
      '',
      '**Search by Tag:**',
      '- `#angular` - Angular-related content',
      '- `#accessibility` - Accessibility topics',
      '- `#aria` - ARIA specifications and patterns',
      '',
      '**Common Workflows:**',
      '- Ingestion: `raw/` → wiki pages → index update → activity log → git commit',
      '- Query: search → results → cross-references → context',
      '- Maintenance: validate links → detect duplicates → consolidate → report',
    ].join('\n');

    return index + '\n';
  }
}
