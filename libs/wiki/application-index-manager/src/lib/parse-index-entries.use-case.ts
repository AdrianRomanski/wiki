import { IndexEntry } from './index-entry';

export class ParseIndexEntriesUseCase {
  execute(content: string): IndexEntry[] {
    const entries: IndexEntry[] = [];
    const lines = content.split('\n');

    let currentSection: 'entity' | 'concept' | 'source' | null = null;

    for (const line of lines) {
      if (line.includes('## Entities')) {
        currentSection = 'entity';
        continue;
      } else if (line.includes('## Concepts')) {
        currentSection = 'concept';
        continue;
      } else if (line.includes('## Recent Sources')) {
        currentSection = 'source';
        continue;
      } else if (line.startsWith('## ')) {
        currentSection = null;
        continue;
      }

      if (currentSection && line.trim().startsWith('- [[')) {
        const entry = this.parseIndexEntryLine(line, currentSection);
        if (entry) {
          entries.push(entry);
        }
      }
    }

    return entries;
  }

  private parseIndexEntryLine(
    line: string,
    type: 'entity' | 'concept' | 'source'
  ): IndexEntry | null {
    const titleMatch = line.match(/\[\[([^\]]+)\]\]/);
    if (!titleMatch) return null;

    const title = titleMatch[1];
    const dateMatch = line.match(/\((\d{4}-\d{2}-\d{2})\)/);
    const date = dateMatch ? dateMatch[1] : undefined;
    const descMatch = line.match(/\]\]\s*(?:\([^)]+\))?\s*-\s*(.+)$/);
    const description = descMatch ? descMatch[1].trim() : '';

    const filename = this.titleToFilename(title);
    const path = `${type === 'entity' ? 'entities' : type === 'concept' ? 'concepts' : 'sources'}/${filename}`;

    return {
      title,
      path,
      description,
      type,
      date,
    };
  }

  private titleToFilename(title: string): string {
    const kebab = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${kebab}.md`;
  }
}
