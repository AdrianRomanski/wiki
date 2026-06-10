import { describe, it, expect, beforeEach } from 'vitest';
import { LogActivityUseCase } from './log-activity-use-case';
import { FileSystemPort, MarkdownPort } from '@wiki/application-ports';

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

  getFileContent(filePath: string): string | undefined {
    return this.storage.get(filePath);
  }
}

class MockMarkdownPort implements MarkdownPort {
  parseMarkdownSections() { return []; }
  extractWikiLinks() { return []; }
  generateWikiLink(target: string) { return `[[${target}]]`; }
  generateHeading() { return ''; }
  generateList() { return ''; }
  generateCodeBlock() { return ''; }
  generateBlockquote() { return ''; }
  generateTable() { return ''; }
  validateMarkdownSyntax() { return { valid: true }; }
  sectionsToMarkdown() { return ''; }
  escapeMarkdown(text: string) { return text; }
}

describe('LogActivityUseCase', () => {
  let useCase: LogActivityUseCase;
  let fileSystemPort: MockFileSystemPort;
  let markdownPort: MockMarkdownPort;

  beforeEach(() => {
    fileSystemPort = new MockFileSystemPort();
    markdownPort = new MockMarkdownPort();
    useCase = new LogActivityUseCase(fileSystemPort, markdownPort);
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

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordIngestion(
        'articles/angular-aria.md',
        ['entities/angular-cdk.md', 'concepts/accessibility.md'],
        new Date('2024-05-11T14:30:00')
      );

      const writtenContent = fileSystemPort.getFileContent('activity-log.md');
      expect(writtenContent).toContain('## 2024-05-11 14:30');
      expect(writtenContent).toContain('### Ingested: articles/angular-aria.md');
      expect(writtenContent).toContain('Generated:');
    });

    it('should insert new entries before existing entries', async () => {
      const baseLog = `# Activity Log

---

## 2024-05-10 12:00

### Initialized: LLM Wiki Second Brain

---
`;

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordIngestion(
        'articles/test.md',
        ['entities/test.md'],
        new Date('2024-05-11T14:30:00')
      );

      const writtenContent = fileSystemPort.getFileContent('activity-log.md') || '';
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

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordCreation(
        'entities/angular-cdk.md',
        'Angular CDK',
        'entity',
        'articles/angular-aria.md',
        ['angular', 'accessibility'],
        new Date('2024-05-11T15:00:00')
      );

      const writtenContent = fileSystemPort.getFileContent('activity-log.md');
      expect(writtenContent).toContain('## 2024-05-11 15:00');
      expect(writtenContent).toContain('### Created: [[Angular CDK]]');
      expect(writtenContent).toContain('- Type: entity');
      expect(writtenContent).toContain('- Source: articles/angular-aria.md');
      expect(writtenContent).toContain('- Tags: angular, accessibility');
    });

    it('should record creation without optional fields', async () => {
      const baseLog = `# Activity Log

---

`;

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordCreation(
        'concepts/test.md',
        'Test Concept',
        'concept',
        undefined,
        undefined,
        new Date('2024-05-11T15:00:00')
      );

      const writtenContent = fileSystemPort.getFileContent('activity-log.md') || '';
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

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordUpdate(
        'entities/angular-cdk.md',
        'Angular CDK',
        'Added new examples for focus management',
        'Incorporated feedback from code review',
        new Date('2024-05-11T16:00:00')
      );

      const writtenContent = fileSystemPort.getFileContent('activity-log.md');
      expect(writtenContent).toContain('## 2024-05-11 16:00');
      expect(writtenContent).toContain('### Updated: [[Angular CDK]]');
      expect(writtenContent).toContain('- Changes: Added new examples for focus management');
      expect(writtenContent).toContain('- Reason: Incorporated feedback from code review');
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

      fileSystemPort.setFileContent('activity-log.md', baseLog);

      await useCase.recordCreation(
        'entities/first.md',
        'First',
        'entity',
        undefined,
        undefined,
        new Date('2024-05-11T10:00:00')
      );

      await useCase.recordCreation(
        'entities/second.md',
        'Second',
        'entity',
        undefined,
        undefined,
        new Date('2024-05-11T11:00:00')
      );

      const finalContent = fileSystemPort.getFileContent('activity-log.md') || '';

      const secondIndex = finalContent.indexOf('## 2024-05-11 11:00');
      const firstIndex = finalContent.indexOf('## 2024-05-11 10:00');
      const initIndex = finalContent.indexOf('## 2024-05-10 12:00');

      expect(secondIndex).toBeLessThan(firstIndex);
      expect(firstIndex).toBeLessThan(initIndex);
    });
  });
});
