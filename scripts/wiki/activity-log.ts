/**
 * Activity log manager for the LLM Wiki Second Brain system.
 * 
 * This module manages the wiki/activity-log.md file, which records
 * all wiki operations in reverse chronological order (newest first).
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */

import { ActivityLogEntry } from './models.js';
import { readWikiFile, writeWikiFile } from './filesystem.js';
import { generateWikiLink } from './markdown.js';

/**
 * Records a raw source ingestion event in the activity log.
 * 
 * @param sourcePath - Path to the raw source file
 * @param generatedPages - Array of wiki page paths generated from the source
 * @param timestamp - Optional timestamp (defaults to now)
 * 
 * @example
 * ```typescript
 * await recordIngestion(
 *   'articles/angular-aria.md',
 *   ['entities/angular-cdk.md', 'concepts/accessibility.md']
 * );
 * ```
 */
export async function recordIngestion(
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
  
  await addLogEntry(entry);
}

/**
 * Records a wiki page creation event in the activity log.
 * 
 * @param pagePath - Path to the created wiki page
 * @param pageTitle - Title of the created page
 * @param pageType - Type of the created page
 * @param sourcePath - Optional path to the raw source that generated this page
 * @param tags - Optional tags associated with the page
 * @param timestamp - Optional timestamp (defaults to now)
 * 
 * @example
 * ```typescript
 * await recordCreation(
 *   'entities/angular-cdk.md',
 *   'Angular CDK',
 *   'entity',
 *   'articles/angular-aria.md',
 *   ['angular', 'accessibility']
 * );
 * ```
 */
export async function recordCreation(
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
  
  // If source path is provided, also record it in the entry
  if (sourcePath) {
    entry.sourcePath = sourcePath;
  }
  
  await addLogEntry(entry);
}

/**
 * Records a wiki page update event in the activity log.
 * 
 * @param pagePath - Path to the updated wiki page
 * @param pageTitle - Title of the updated page
 * @param changes - Description of changes made
 * @param reason - Reason for the update
 * @param timestamp - Optional timestamp (defaults to now)
 * 
 * @example
 * ```typescript
 * await recordUpdate(
 *   'entities/angular-cdk.md',
 *   'Angular CDK',
 *   'Added new examples for focus management',
 *   'Incorporated feedback from code review'
 * );
 * ```
 */
export async function recordUpdate(
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
  
  await addLogEntry(entry);
}

/**
 * Adds a log entry to the activity log.
 * 
 * Entries are added in reverse chronological order (newest first).
 * 
 * @param entry - The activity log entry to add
 */
async function addLogEntry(entry: ActivityLogEntry): Promise<void> {
  // Read current activity log
  const logContent = await readWikiFile('activity-log.md');
  
  // Generate new entry markdown
  const entryMarkdown = generateLogEntryMarkdown(entry);
  
  // Insert new entry after the header section
  const updatedContent = insertLogEntry(logContent, entryMarkdown);
  
  // Write back to file
  await writeWikiFile('activity-log.md', updatedContent);
}

/**
 * Generates markdown for a log entry.
 * 
 * @param entry - The activity log entry
 * @returns Markdown representation of the entry
 */
function generateLogEntryMarkdown(entry: ActivityLogEntry): string {
  const parts: string[] = [];
  
  // Format timestamp
  const dateStr = formatDate(entry.timestamp);
  const timeStr = formatTime(entry.timestamp);
  
  parts.push(`## ${dateStr} ${timeStr}`);
  parts.push('');
  
  // Generate entry content based on type
  switch (entry.type) {
    case 'creation':
      parts.push(`### Created: ${generateWikiLink(entry.pageTitle!)}`);
      parts.push(`- Type: ${entry.pageType}`);
      if (entry.sourcePath) {
        parts.push(`- Source: ${entry.sourcePath}`);
      }
      if (entry.tags && entry.tags.length > 0) {
        parts.push(`- Tags: ${entry.tags.join(', ')}`);
      }
      break;
      
    case 'update':
      parts.push(`### Updated: ${generateWikiLink(entry.pageTitle!)}`);
      parts.push(`- Changes: ${entry.changes}`);
      parts.push(`- Reason: ${entry.reason}`);
      break;
      
    case 'ingestion':
      parts.push(`### Ingested: ${entry.sourcePath}`);
      if (entry.generatedPages && entry.generatedPages.length > 0) {
        const pageLinks = entry.generatedPages
          .map(path => {
            // Extract title from path (remove directory and .md extension)
            const filename = path.split('/').pop()!;
            const title = filename.replace('.md', '').replace(/-/g, ' ');
            // Capitalize first letter of each word
            const capitalizedTitle = title
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return generateWikiLink(capitalizedTitle);
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

/**
 * Inserts a new log entry into the activity log content.
 * 
 * Entries are inserted after the header section and before existing entries
 * to maintain reverse chronological order.
 * 
 * @param logContent - Current activity log content
 * @param entryMarkdown - New entry markdown to insert
 * @returns Updated activity log content
 */
function insertLogEntry(logContent: string, entryMarkdown: string): string {
  const lines = logContent.split('\n');
  
  // Find the insertion point (after the header section)
  let insertIndex = 0;
  let foundHeader = false;
  let foundFirstSeparator = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for the main header
    if (line.startsWith('# Activity Log')) {
      foundHeader = true;
      continue;
    }
    
    // Look for the first separator (---)
    if (foundHeader && line.trim() === '---') {
      if (!foundFirstSeparator) {
        foundFirstSeparator = true;
        insertIndex = i + 1;
        // Skip empty lines after separator
        while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
          insertIndex++;
        }
        break;
      }
    }
  }
  
  // If we didn't find the insertion point, append to the end
  if (insertIndex === 0) {
    insertIndex = lines.length;
  }
  
  // Insert the new entry
  const before = lines.slice(0, insertIndex);
  const after = lines.slice(insertIndex);
  
  return [...before, entryMarkdown, ...after].join('\n');
}

/**
 * Formats a date as YYYY-MM-DD.
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a time as HH:MM.
 * 
 * @param date - The date to format
 * @returns Formatted time string
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Gets recent activity log entries.
 * 
 * @param count - Number of recent entries to retrieve
 * @returns Array of recent activity log entries
 * 
 * @example
 * ```typescript
 * const recentEntries = await getRecentEntries(5);
 * ```
 */
export async function getRecentEntries(count: number): Promise<ActivityLogEntry[]> {
  const logContent = await readWikiFile('activity-log.md');
  return parseLogEntries(logContent, count);
}

/**
 * Parses activity log entries from the log content.
 * 
 * @param logContent - The activity log content
 * @param maxCount - Maximum number of entries to parse
 * @returns Array of parsed activity log entries
 */
function parseLogEntries(logContent: string, maxCount?: number): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const lines = logContent.split('\n');
  
  let currentEntry: Partial<ActivityLogEntry> | null = null;
  let currentSection: string | null = null;
  
  for (const line of lines) {
    // Check if we've reached the limit
    if (maxCount && entries.length >= maxCount) {
      break;
    }
    
    // Detect entry header (## YYYY-MM-DD HH:MM)
    const headerMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    if (headerMatch) {
      // Save previous entry if exists
      if (currentEntry && currentEntry.type) {
        entries.push(currentEntry as ActivityLogEntry);
      }
      
      // Start new entry
      const [, dateStr, timeStr] = headerMatch;
      const timestamp = parseDateTime(dateStr, timeStr);
      currentEntry = { timestamp };
      currentSection = null;
      continue;
    }
    
    // Detect section header (### Created/Updated/Ingested)
    const sectionMatch = line.match(/^###\s+(Created|Updated|Ingested):\s+(.+)/);
    if (sectionMatch && currentEntry) {
      const [, type, target] = sectionMatch;
      currentSection = type.toLowerCase();
      
      if (type === 'Created') {
        currentEntry.type = 'creation';
        // Extract title from wiki link
        const titleMatch = target.match(/\[\[([^\]]+)\]\]/);
        currentEntry.pageTitle = titleMatch ? titleMatch[1] : target;
      } else if (type === 'Updated') {
        currentEntry.type = 'update';
        // Extract title from wiki link
        const titleMatch = target.match(/\[\[([^\]]+)\]\]/);
        currentEntry.pageTitle = titleMatch ? titleMatch[1] : target;
      } else if (type === 'Ingested') {
        currentEntry.type = 'ingestion';
        currentEntry.sourcePath = target;
      }
      continue;
    }
    
    // Parse entry details
    if (currentEntry && line.trim().startsWith('- ')) {
      const detailMatch = line.match(/^-\s+([^:]+):\s+(.+)/);
      if (detailMatch) {
        const [, key, value] = detailMatch;
        
        switch (key) {
          case 'Type':
            currentEntry.pageType = value as 'entity' | 'concept' | 'source';
            break;
          case 'Source':
            currentEntry.sourcePath = value;
            break;
          case 'Tags':
            currentEntry.tags = value.split(',').map(t => t.trim());
            break;
          case 'Changes':
            currentEntry.changes = value;
            break;
          case 'Reason':
            currentEntry.reason = value;
            break;
          case 'Generated':
            // Parse wiki links
            const links = value.match(/\[\[([^\]]+)\]\]/g);
            if (links) {
              currentEntry.generatedPages = links.map(link => {
                const title = link.replace(/\[\[|\]\]/g, '');
                // Convert title back to path (rough approximation)
                return title.toLowerCase().replace(/\s+/g, '-') + '.md';
              });
            }
            break;
        }
      }
    }
  }
  
  // Save last entry
  if (currentEntry && currentEntry.type) {
    entries.push(currentEntry as ActivityLogEntry);
  }
  
  return entries;
}

/**
 * Parses a date and time string into a Date object.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns Parsed Date object
 */
function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}
