import { describe, it, expect, beforeEach } from 'vitest';
import { QueryActivityLogUseCase } from './query-activity-log-use-case';
import { FileSystemPort } from '@wiki/application-ports';

class MockFileSystemPort implements FileSystemPort {
  private storage = new Map<string, string>();

  async readRawFile(): Promise<string> { return ''; }
  async readWikiFile(filePath: string): Promise<string> {
    return this.storage.get(filePath) || '';
  }
  async writeWikiFile(filePath: string, content: string): Promise<void> {
    this.storage.set(filePath, content);
  }
  async listRawFiles(): Promise<string[]> { return []; }
  async listWikiFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats() { 
    return Promise.resolve({ size: 0, created: new Date(), modified: new Date() }); 
  }
  async getWikiFileStats() { 
    return Promise.resolve({ size: 0, created: new Date(), modified: new Date() }); 
  }
  async ensureWikiDir(): Promise<void> {
    return Promise.resolve();
  }
  async deleteWikiFile(): Promise<void> {
    return Promise.resolve();
  }

  setFileContent(filePath: string, content: string) {
    this.storage.set(filePath, content);
  }
}

describe('QueryActivityLogUseCase', () => {
  let useCase: QueryActivityLogUseCase;
  let fileSystemPort: MockFileSystemPort;

  beforeEach(() => {
    fileSystemPort = new MockFileSystemPort();
    useCase = new QueryActivityLogUseCase(fileSystemPort);
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

      fileSystemPort.setFileContent('activity-log.md', logWithEntries);

      const entries = await useCase.getRecentEntries(3);

      expect(entries).toHaveLength(3);

      expect(entries[0].type).toBe('update');
      expect(entries[0].pageTitle).toBe('Angular CDK');
      expect(entries[0].changes).toBe('Added new examples');
      expect(entries[0].reason).toBe('Code review feedback');

      expect(entries[1].type).toBe('creation');
      expect(entries[1].pageTitle).toBe('Test Concept');
      expect(entries[1].pageType).toBe('concept');
      expect(entries[1].tags).toEqual(['test', 'example']);

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

      fileSystemPort.setFileContent('activity-log.md', logWithManyEntries);

      const entries = await useCase.getRecentEntries(2);

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

      fileSystemPort.setFileContent('activity-log.md', logWithEntry);

      const entries = await useCase.getRecentEntries(1);

      expect(entries).toHaveLength(1);
      expect(entries[0].timestamp).toEqual(new Date(2024, 4, 11, 16, 30));
    });
  });
});
