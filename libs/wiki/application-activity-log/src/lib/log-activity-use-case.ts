import { ActivityLogEntry } from '@wiki/domain-models';
import { FileSystemPort, MarkdownPort } from '@wiki/application-ports';

export class LogActivityUseCase {
  constructor(
    private fileSystemPort: FileSystemPort,
    private markdownPort: MarkdownPort
  ) {}

  async recordIngestion(
    sourcePath: string,
    generatedPages: string[],
    timestamp: Date = new Date()
  ): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp,
      type: 'ingestion',
      sourcePath,
      generatedPages,
    };

    await this.addLogEntry(entry);
  }

  async recordCreation(
    pagePath: string,
    pageTitle: string,
    pageType: 'entity' | 'concept' | 'source',
    sourcePath?: string,
    tags?: string[],
    timestamp: Date = new Date()
  ): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp,
      type: 'creation',
      pagePath,
      pageTitle,
      pageType,
      tags,
    };

    if (sourcePath) {
      entry.sourcePath = sourcePath;
    }

    await this.addLogEntry(entry);
  }

  async recordUpdate(
    pagePath: string,
    pageTitle: string,
    changes: string,
    reason: string,
    timestamp: Date = new Date()
  ): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp,
      type: 'update',
      pagePath,
      pageTitle,
      changes,
      reason,
    };

    await this.addLogEntry(entry);
  }

  private async addLogEntry(entry: ActivityLogEntry): Promise<void> {
    const logContent = await this.fileSystemPort.readWikiFile('activity-log.md');
    const entryMarkdown = this.generateLogEntryMarkdown(entry);
    const updatedContent = this.insertLogEntry(logContent, entryMarkdown);
    await this.fileSystemPort.writeWikiFile('activity-log.md', updatedContent);
  }

  private generateLogEntryMarkdown(entry: ActivityLogEntry): string {
    const parts: string[] = [];

    const dateStr = this.formatDate(entry.timestamp);
    const timeStr = this.formatTime(entry.timestamp);

    parts.push(`## ${dateStr} ${timeStr}`);
    parts.push('');

    switch (entry.type) {
      case 'creation':
        if (entry.pageTitle) {
          parts.push(`### Created: ${this.markdownPort.generateWikiLink(entry.pageTitle)}`);
          parts.push(`- Type: ${entry.pageType}`);
          if (entry.sourcePath) {
            parts.push(`- Source: ${entry.sourcePath}`);
          }
          if (entry.tags && entry.tags.length > 0) {
            parts.push(`- Tags: ${entry.tags.join(', ')}`);
          }
        }
        break;

      case 'update':
        if (entry.pageTitle) {
          parts.push(`### Updated: ${this.markdownPort.generateWikiLink(entry.pageTitle)}`);
          parts.push(`- Changes: ${entry.changes}`);
          parts.push(`- Reason: ${entry.reason}`);
        }
        break;

      case 'ingestion':
        parts.push(`### Ingested: ${entry.sourcePath}`);
        if (entry.generatedPages && entry.generatedPages.length > 0) {
          const pageLinks = entry.generatedPages
            .map(path => {
              const parts = path.split('/');
              const filename = parts[parts.length - 1] || '';
              const title = filename.replace('.md', '').replace(/-/g, ' ');
              const capitalizedTitle = title
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              return this.markdownPort.generateWikiLink(capitalizedTitle);
            })
            .join(', ');
          parts.push(`- Generated: ${pageLinks}`);
        }
        break;
    }

    parts.push('');
    parts.push('---');
    parts.push('');

    return parts.join('\n');
  }

  private insertLogEntry(logContent: string, entryMarkdown: string): string {
    const lines = logContent.split('\n');

    let insertIndex = 0;
    let foundHeader = false;
    let foundFirstSeparator = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# Activity Log')) {
        foundHeader = true;
        continue;
      }

      if (foundHeader && line.trim() === '---') {
        if (!foundFirstSeparator) {
          foundFirstSeparator = true;
          insertIndex = i + 1;
          while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
            insertIndex++;
          }
          break;
        }
      }
    }

    if (insertIndex === 0) {
      insertIndex = lines.length;
    }

    const before = lines.slice(0, insertIndex);
    const after = lines.slice(insertIndex);

    return [...before, entryMarkdown, ...after].join('\n');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
