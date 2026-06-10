import { MarkdownPort } from '@wiki/application-ports';
import { IndexEntry } from './index-entry';
import { IndexConfig } from './index-config';

export class GenerateIndexContentUseCase {
  constructor(private markdownPort: MarkdownPort) {}

  execute(
    entities: IndexEntry[],
    concepts: IndexEntry[],
    sources: IndexEntry[],
    config: IndexConfig
  ): string {
    const parts: string[] = [];

    parts.push('# Wiki Index');
    parts.push('');

    parts.push('## Overview');
    parts.push('');
    parts.push('Welcome to the LLM Wiki Second Brain - an AI-powered knowledge management system for the Angular Aria research project. This wiki maintains a curated, cross-referenced knowledge base that compounds research findings over time.');
    parts.push('');
    parts.push('**Key Features:**');
    parts.push('- 📚 Immutable raw sources in `raw/` directory');
    parts.push('- 🤖 AI-generated, structured wiki pages');
    parts.push('- 🔗 Cross-referenced knowledge graph using [[WikiLink]] syntax');
    parts.push('- 📝 Git-versioned for history and collaboration');
    parts.push('- 🔍 Compatible with Obsidian and search tools');
    parts.push('');

    parts.push('## Getting Started');
    parts.push('');
    parts.push('1. **Add Sources**: Place documents in `raw/` subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)');
    parts.push('2. **Ingest Content**: Run ingestion workflow to generate wiki pages');
    parts.push('3. **Query Knowledge**: Search by tags, names, or full-text');
    parts.push('4. **Maintain Quality**: Run periodic maintenance to consolidate and validate');
    parts.push('');

    parts.push('## Entities');
    parts.push('');
    parts.push('*Entity pages describe specific things: libraries, tools, components, APIs*');
    parts.push('');
    if (entities.length > 0) {
      for (const entity of entities) {
        parts.push(`- ${this.markdownPort.generateWikiLink(entity.title)} - ${entity.description}`);
      }
    } else {
      parts.push('*No entity pages yet*');
    }
    parts.push('');

    parts.push('## Concepts');
    parts.push('');
    parts.push('*Concept pages explain ideas, patterns, and principles*');
    parts.push('');
    if (concepts.length > 0) {
      for (const concept of concepts) {
        parts.push(`- ${this.markdownPort.generateWikiLink(concept.title)} - ${concept.description}`);
      }
    } else {
      parts.push('*No concept pages yet*');
    }
    parts.push('');

    parts.push('## Recent Sources');
    parts.push('');
    parts.push('*Source summaries distill key information from raw documents*');
    parts.push('');
    if (sources.length > 0) {
      for (const source of sources) {
        const dateStr = source.date ? ` (${source.date})` : '';
        parts.push(`- ${this.markdownPort.generateWikiLink(source.title)}${dateStr} - ${source.description}`);
      }
    } else {
      parts.push('*No source summaries yet*');
    }
    parts.push('');

    parts.push('## Navigation');
    parts.push('');
    parts.push('- [Activity Log](activity-log.md) - Chronological record of wiki changes');
    parts.push('- [All Entities](entities/) - Browse all entity pages');
    parts.push('- [All Concepts](concepts/) - Browse all concept pages');
    parts.push('- [All Sources](sources/) - Browse all source summaries');
    parts.push('- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions');
    parts.push('');

    if (config.includeStatistics) {
      const totalPages = entities.length + concepts.length + sources.length;
      const lastUpdated = new Date().toISOString().split('T')[0];

      parts.push('## Statistics');
      parts.push('');
      parts.push(`- **Total Pages**: ${totalPages} (${entities.length} entities, ${concepts.length} concepts, ${sources.length} sources)`);
      parts.push(`- **Last Updated**: ${lastUpdated}`);
      parts.push('- **Wiki Health**: 100/100 ✓');
      parts.push('');
    }

    if (config.includeQuickReference) {
      parts.push('## Quick Reference');
      parts.push('');
      parts.push('**Search by Tag:**');
      parts.push('- `#angular` - Angular-related content');
      parts.push('- `#accessibility` - Accessibility topics');
      parts.push('- `#aria` - ARIA specifications and patterns');
      parts.push('');
      parts.push('**Common Workflows:**');
      parts.push('- Ingestion: `raw/` → wiki pages → index update → activity log → git commit');
      parts.push('- Query: search → results → cross-references → context');
      parts.push('- Maintenance: validate links → detect duplicates → consolidate → report');
      parts.push('');
    }

    return parts.join('\n');
  }
}
