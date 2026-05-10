/**
 * Unit tests for activity log manager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordIngestion,
  recordCreation,
  recordUpdate,
  getRecentEntries,
} from './activity-log';
import * as filesystem from './filesystem';

// Mock the filesystem module
vi.mock('./filesystem');

describe('Activity Log Manager', () => {
  const mockReadWikiFile = vi.mocked(filesystem.readWikiFile);
  const mockWriteWikiFile = vi.mocked(filesystem.writeWikiFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordIngestion', () => {
    it('should record an ingestion event', async () => {
      const baseLog = `# Activity Log

This log records all wiki operations in reverse chronological order (newest first).

---

## 2024-05-10 12:00

### Initialized: LLM Wiki Second Brain

---
`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      await recordIngestion(
        'articles/angular-aria.md',
        ['entities/angular-cdk.md', 'concepts/accessibility.md'],
        new Date('2024-05-11T14:30:00')
      );

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('## 2024-05-11 14:30')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('### Ingested: articles/angular-aria.md')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('Generated:')
      );
    });

    it('should insert new entries before existing entries', async () => {
      const baseLog = `# Activity Log

---

## 2024-05-10 12:00

### Initialized: LLM Wiki Second Brain

---
`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      await recordIngestion(
        'articles/test.md',
        ['entities/test.md'],
        new Date('2024-05-11T14:30:00')
      );

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      const newEntryIndex = writtenContent.indexOf('## 2024-05-11 14:30');
      const oldEntryIndex = writtenContent.indexOf('## 2024-05-10 12:00');
      expect(newEntryIndex).toBeLessThan(oldEntryIndex);
    });
  });

  describe('recordCreation', () => {
    it('should record a page creation event', async () => {
      const baseLog = `# Activity Log

---

`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      await recordCreation(
        'entities/angular-cdk.md',
        'Angular CDK',
        'entity',
        'articles/angular-aria.md',
        ['angular', 'accessibility'],
        new Date('2024-05-11T15:00:00')
      );

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('## 2024-05-11 15:00')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('### Created: [[Angular CDK]]')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('- Type: entity')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('- Source: articles/angular-aria.md')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('- Tags: angular, accessibility')
      );
    });

    it('should record creation without optional fields', async () => {
      const baseLog = `# Activity Log

---

`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      await recordCreation(
        'concepts/test.md',
        'Test Concept',
        'concept',
        undefined,
        undefined,
        new Date('2024-05-11T15:00:00')
      );

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      expect(writtenContent).toContain('### Created: [[Test Concept]]');
      expect(writtenContent).toContain('- Type: concept');
      expect(writtenContent).not.toContain('- Source:');
      expect(writtenContent).not.toContain('- Tags:');
    });
  });

  describe('recordUpdate', () => {
    it('should record a page update event', async () => {
      const baseLog = `# Activity Log

---

`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      await recordUpdate(
        'entities/angular-cdk.md',
        'Angular CDK',
        'Added new examples for focus management',
        'Incorporated feedback from code review',
        new Date('2024-05-11T16:00:00')
      );

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('## 2024-05-11 16:00')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('### Updated: [[Angular CDK]]')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('- Changes: Added new examples for focus management')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'activity-log.md',
        expect.stringContaining('- Reason: Incorporated feedback from code review')
      );
    });
  });

  describe('getRecentEntries', () => {
    it('should parse and return recent entries', async () => {
      const logWithEntries = `# Activity Log

---

## 2024-05-11 16:00

### Updated: [[Angular CDK]]
- Changes: Added new examples
- Reason: Code review feedback

---

## 2024-05-11 15:00

### Created: [[Test Concept]]
- Type: concept
- Tags: test, example

---

## 2024-05-11 14:30

### Ingested: articles/test.md
- Generated: [[Test Entity]], [[Test Concept]]

---
`;

      mockReadWikiFile.mockResolvedValue(logWithEntries);

      const entries = await getRecentEntries(3);

      expect(entries).toHaveLength(3);
      
      // Check first entry (update)
      expect(entries[0].type).toBe('update');
      expect(entries[0].pageTitle).toBe('Angular CDK');
      expect(entries[0].changes).toBe('Added new examples');
      expect(entries[0].reason).toBe('Code review feedback');
      
      // Check second entry (creation)
      expect(entries[1].type).toBe('creation');
      expect(entries[1].pageTitle).toBe('Test Concept');
      expect(entries[1].pageType).toBe('concept');
      expect(entries[1].tags).toEqual(['test', 'example']);
      
      // Check third entry (ingestion)
      expect(entries[2].type).toBe('ingestion');
      expect(entries[2].sourcePath).toBe('articles/test.md');
      expect(entries[2].generatedPages).toBeDefined();
    });

    it('should limit entries to requested count', async () => {
      const logWithManyEntries = `# Activity Log

---

## 2024-05-11 16:00

### Updated: [[Page 1]]
- Changes: Update 1
- Reason: Reason 1

---

## 2024-05-11 15:00

### Updated: [[Page 2]]
- Changes: Update 2
- Reason: Reason 2

---

## 2024-05-11 14:00

### Updated: [[Page 3]]
- Changes: Update 3
- Reason: Reason 3

---
`;

      mockReadWikiFile.mockResolvedValue(logWithManyEntries);

      const entries = await getRecentEntries(2);

      expect(entries).toHaveLength(2);
      expect(entries[0].pageTitle).toBe('Page 1');
      expect(entries[1].pageTitle).toBe('Page 2');
    });

    it('should parse timestamps correctly', async () => {
      const logWithEntry = `# Activity Log

---

## 2024-05-11 16:30

### Created: [[Test Page]]
- Type: entity

---
`;

      mockReadWikiFile.mockResolvedValue(logWithEntry);

      const entries = await getRecentEntries(1);

      expect(entries).toHaveLength(1);
      expect(entries[0].timestamp).toEqual(new Date(2024, 4, 11, 16, 30));
    });
  });

  describe('entry ordering', () => {
    it('should maintain reverse chronological order', async () => {
      const baseLog = `# Activity Log

---

## 2024-05-10 12:00

### Initialized: LLM Wiki Second Brain

---
`;

      mockReadWikiFile.mockResolvedValue(baseLog);

      // Record multiple entries
      await recordCreation(
        'entities/first.md',
        'First',
        'entity',
        undefined,
        undefined,
        new Date('2024-05-11T10:00:00')
      );

      const firstWrite = mockWriteWikiFile.mock.calls[0][1];
      mockReadWikiFile.mockResolvedValue(firstWrite);

      await recordCreation(
        'entities/second.md',
        'Second',
        'entity',
        undefined,
        undefined,
        new Date('2024-05-11T11:00:00')
      );

      const secondWrite = mockWriteWikiFile.mock.calls[1][1];
      
      // Second entry should appear before first entry
      const secondIndex = secondWrite.indexOf('## 2024-05-11 11:00');
      const firstIndex = secondWrite.indexOf('## 2024-05-11 10:00');
      const initIndex = secondWrite.indexOf('## 2024-05-10 12:00');
      
      expect(secondIndex).toBeLessThan(firstIndex);
      expect(firstIndex).toBeLessThan(initIndex);
    });
  });
});
