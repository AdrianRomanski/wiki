import { ActivityLogEntry } from '@wiki/domain-models';
import { FileSystemPort } from '@wiki/application-ports';

export class QueryActivityLogUseCase {
  constructor(private fileSystemPort: FileSystemPort) {}

  async getRecentEntries(count: number): Promise<ActivityLogEntry[]> {
    const logContent = await this.fileSystemPort.readWikiFile('activity-log.md');
    return this.parseLogEntries(logContent, count);
  }

  private parseLogEntries(logContent: string, maxCount?: number): ActivityLogEntry[] {
    const entries: ActivityLogEntry[] = [];
    const lines = logContent.split('\n');

    let currentEntry: Partial<ActivityLogEntry> | null = null;

    for (const line of lines) {
      if (maxCount && entries.length >= maxCount) {
        break;
      }

      const headerMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (headerMatch) {
        if (currentEntry && currentEntry.type) {
          entries.push(currentEntry as ActivityLogEntry);
        }

        const [, dateStr, timeStr] = headerMatch;
        const timestamp = this.parseDateTime(dateStr, timeStr);
        currentEntry = { timestamp };
        continue;
      }

      const sectionMatch = line.match(/^###\s+(Created|Updated|Ingested):\s+(.+)/);
      if (sectionMatch && currentEntry) {
        const [, type, target] = sectionMatch;

        if (type === 'Created') {
          currentEntry.type = 'creation';
          const titleMatch = target.match(/\[\[([^\]]+)\]\]/);
          currentEntry.pageTitle = titleMatch ? titleMatch[1] : target;
        } else if (type === 'Updated') {
          currentEntry.type = 'update';
          const titleMatch = target.match(/\[\[([^\]]+)\]\]/);
          currentEntry.pageTitle = titleMatch ? titleMatch[1] : target;
        } else if (type === 'Ingested') {
          currentEntry.type = 'ingestion';
          currentEntry.sourcePath = target;
        }
        continue;
      }

      if (currentEntry && line.trim().startsWith('- ')) {
        const detailMatch = line.match(/^-\s+([^:]+):\s+(.+)/);
        if (detailMatch) {
          const [, key, value] = detailMatch;

          switch (key) {
            case 'Type': {
              currentEntry.pageType = value as 'entity' | 'concept' | 'source';
              break;
            }
            case 'Source': {
              currentEntry.sourcePath = value;
              break;
            }
            case 'Tags': {
              currentEntry.tags = value.split(',').map(t => t.trim());
              break;
            }
            case 'Changes': {
              currentEntry.changes = value;
              break;
            }
            case 'Reason': {
              currentEntry.reason = value;
              break;
            }
            case 'Generated': {
              const links = value.match(/\[\[([^\]]+)\]\]/g);
              if (links) {
                currentEntry.generatedPages = links.map(link => {
                  const title = link.replace(/\[\[|\]\]/g, '');
                  return title.toLowerCase().replace(/\s+/g, '-') + '.md';
                });
              }
              break;
            }
          }
        }
      }
    }

    if (currentEntry && currentEntry.type) {
      entries.push(currentEntry as ActivityLogEntry);
    }

    return entries;
  }

  private parseDateTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }
}
