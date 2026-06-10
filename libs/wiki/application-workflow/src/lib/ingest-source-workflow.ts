import { RawSource, WikiPage } from '@wiki/domain-models';
import { FileSystemPort, MarkdownPort, FrontmatterPort } from '@wiki/application-ports';
import {
  GenerateEntityPageUseCase,
  GenerateConceptPageUseCase,
  GenerateSourceSummaryUseCase,
} from '@wiki/application-generators';
import {
  DetectCrossReferencesUseCase,
  InsertCrossReferenceLinksUseCase,
} from '@wiki/application-cross-reference';
import {
  AddEntityToIndexUseCase,
  AddConceptToIndexUseCase,
  AddSourceToIndexUseCase,
  AddEntryToIndexUseCase,
  ParseIndexEntriesUseCase,
  RegenerateIndexUseCase,
  ScanWikiPagesUseCase,
  GenerateIndexContentUseCase,
} from '@wiki/application-index-manager';
import { LogActivityUseCase } from '@wiki/application-activity-log';
import {
  IngestionWorkflowOptions,
  IngestionWorkflowResult,
  GenerateWikiPagesOptions,
  GenerateWikiPagesResult,
  IngestionError,
} from './interfaces';

export class IngestSourceWorkflow {
  private generateEntityPage: GenerateEntityPageUseCase;
  private generateConceptPage: GenerateConceptPageUseCase;
  private generateSourceSummaryPage: GenerateSourceSummaryUseCase;
  private detectCrossReferences: DetectCrossReferencesUseCase;
  private insertCrossReferenceLinks: InsertCrossReferenceLinksUseCase;
  private addEntityToIndex: AddEntityToIndexUseCase;
  private addConceptToIndex: AddConceptToIndexUseCase;
  private addSourceToIndex: AddSourceToIndexUseCase;
  private logActivity: LogActivityUseCase;

  constructor(
    private fileSystemPort: FileSystemPort,
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {
    this.generateEntityPage = new GenerateEntityPageUseCase(
      markdownPort,
      frontmatterPort
    );
    this.generateConceptPage = new GenerateConceptPageUseCase(
      markdownPort,
      frontmatterPort
    );
    this.generateSourceSummaryPage = new GenerateSourceSummaryUseCase(
      markdownPort,
      frontmatterPort
    );
    this.detectCrossReferences = new DetectCrossReferencesUseCase(
      markdownPort
    );
    this.insertCrossReferenceLinks = new InsertCrossReferenceLinksUseCase(
      markdownPort
    );
    
    const parseEntries = new ParseIndexEntriesUseCase();
    const scanPages = new ScanWikiPagesUseCase(fileSystemPort, frontmatterPort);
    const generateContent = new GenerateIndexContentUseCase(markdownPort);
    const regenerateIndex = new RegenerateIndexUseCase(
      fileSystemPort,
      scanPages,
      generateContent
    );
    const addEntry = new AddEntryToIndexUseCase(
      fileSystemPort,
      parseEntries,
      regenerateIndex
    );
    
    this.addEntityToIndex = new AddEntityToIndexUseCase(addEntry);
    this.addConceptToIndex = new AddConceptToIndexUseCase(addEntry);
    this.addSourceToIndex = new AddSourceToIndexUseCase(addEntry);
    this.logActivity = new LogActivityUseCase(fileSystemPort, markdownPort);
  }

  async execute(options: IngestionWorkflowOptions): Promise<IngestionWorkflowResult> {
    const { sourcePath, ...generateOptions } = options;

    const source = await this.ingestRawSource(sourcePath);

    const result = await this.generateWikiPagesFromSource({
      source,
      ...generateOptions,
    });

    return {
      source,
      pages: result.pages,
      writtenPaths: result.writtenPaths,
    };
  }

  async executeBatch(
    workflowOptions: IngestionWorkflowOptions[]
  ): Promise<IngestionWorkflowResult[]> {
    const results: IngestionWorkflowResult[] = [];
    const errors: { sourcePath: string; error: Error }[] = [];

    for (const options of workflowOptions) {
      try {
        const result = await this.execute(options);
        results.push(result);
      } catch (error) {
        errors.push({
          sourcePath: options.sourcePath,
          error: error as Error,
        });
      }
    }

    if (errors.length > 0) {
      console.warn(`\nFailed to process ${errors.length} source(s):`);
      errors.forEach(({ sourcePath, error }) => {
        console.warn(`  - ${sourcePath}: ${error.message}`);
      });
    }

    return results;
  }

  private async ingestRawSource(filePath: string): Promise<RawSource> {
    try {
      const content = await this.fileSystemPort.readRawFile(filePath);
      const stats = await this.fileSystemPort.getRawFileStats(filePath);

      const pathParts = filePath.split('/');
      const filename = pathParts[pathParts.length - 1] || '';
      const format = this.determineFormat(filename);
      const category = this.extractCategory(filePath);

      return {
        path: filePath,
        filename,
        format,
        category,
        addedDate: stats.created,
        fileSize: stats.size,
        content,
        ingested: false,
        generatedPages: [],
      };
    } catch (error) {
      throw new IngestionError(
        `Failed to ingest raw source: ${filePath}`,
        filePath,
        error as Error
      );
    }
  }

  private async generateWikiPagesFromSource(
    options: GenerateWikiPagesOptions
  ): Promise<GenerateWikiPagesResult> {
    const {
      source,
      entityOptions,
      conceptOptions,
      sourceSummaryOptions,
      addCrossReferences = true,
    } = options;

    const pages: WikiPage[] = [];
    const writtenPaths: string[] = [];

    try {
      const existingTitles = addCrossReferences
        ? await this.loadExistingPageTitles()
        : [];

      if (entityOptions) {
        const result = await this.generateEntityPage.execute({
          ...entityOptions,
          sources: [source.path],
        });

        let content = result.content;
        if (addCrossReferences && existingTitles.length > 0) {
          const refs = await this.detectCrossReferences.execute({
            content,
            existingPages: existingTitles,
          });
          content = this.insertCrossReferenceLinks.execute(content, refs);
        }

        const filePath = `entities/${result.filename}`;
        await this.fileSystemPort.writeWikiFile(filePath, content);
        writtenPaths.push(filePath);

        const wikiPage: WikiPage = {
          path: filePath,
          filename: result.filename,
          frontmatter: result.frontmatter,
          content,
          sections: this.markdownPort.parseMarkdownSections(content),
          outgoingLinks: this.markdownPort.extractWikiLinks(content),
          incomingLinks: [],
        };
        pages.push(wikiPage);

        const description = entityOptions.definition.substring(0, 100);
        await this.addEntityToIndex.execute(wikiPage, description);

        await this.logActivity.recordCreation(
          filePath,
          result.frontmatter.title,
          'entity',
          source.path,
          result.frontmatter.tags
        );
      }

      if (conceptOptions) {
        const result = await this.generateConceptPage.execute({
          ...conceptOptions,
          sources: [source.path],
        });

        let content = result.content;
        if (addCrossReferences && existingTitles.length > 0) {
          const refs = await this.detectCrossReferences.execute({
            content,
            existingPages: existingTitles,
          });
          content = this.insertCrossReferenceLinks.execute(content, refs);
        }

        const filePath = `concepts/${result.filename}`;
        await this.fileSystemPort.writeWikiFile(filePath, content);
        writtenPaths.push(filePath);

        const wikiPage: WikiPage = {
          path: filePath,
          filename: result.filename,
          frontmatter: result.frontmatter,
          content,
          sections: this.markdownPort.parseMarkdownSections(content),
          outgoingLinks: this.markdownPort.extractWikiLinks(content),
          incomingLinks: [],
        };
        pages.push(wikiPage);

        const description = conceptOptions.explanation.substring(0, 100);
        await this.addConceptToIndex.execute(wikiPage, description);

        await this.logActivity.recordCreation(
          filePath,
          result.frontmatter.title,
          'concept',
          source.path,
          result.frontmatter.tags
        );
      }

      if (sourceSummaryOptions) {
        const result = await this.generateSourceSummaryPage.execute({
          ...sourceSummaryOptions,
        });

        let content = result.content;
        if (addCrossReferences && existingTitles.length > 0) {
          const refs = await this.detectCrossReferences.execute({
            content,
            existingPages: existingTitles,
          });
          content = this.insertCrossReferenceLinks.execute(content, refs);
        }

        const filePath = `sources/${result.filename}`;
        await this.fileSystemPort.writeWikiFile(filePath, content);
        writtenPaths.push(filePath);

        const wikiPage: WikiPage = {
          path: filePath,
          filename: result.filename,
          frontmatter: result.frontmatter,
          content,
          sections: this.markdownPort.parseMarkdownSections(content),
          outgoingLinks: this.markdownPort.extractWikiLinks(content),
          incomingLinks: [],
        };
        pages.push(wikiPage);

        const description = sourceSummaryOptions.keyPoints[0] || 'No description';
        await this.addSourceToIndex.execute(wikiPage, description);

        await this.logActivity.recordCreation(
          filePath,
          result.frontmatter.title,
          'source',
          source.path,
          result.frontmatter.tags
        );
      }

      if (pages.length > 0) {
        await this.logActivity.recordIngestion(source.path, writtenPaths);
      }

      return {
        pages,
        writtenPaths,
      };
    } catch (error) {
      throw new IngestionError(
        `Failed to generate wiki pages from source: ${source.path}`,
        source.path,
        error as Error
      );
    }
  }

  private async loadExistingPageTitles(): Promise<string[]> {
    const titles: string[] = [];

    const wikiFiles = await this.fileSystemPort.listWikiFiles('**/*.md');

    for (const filePath of wikiFiles) {
      try {
        const content = await this.fileSystemPort.readWikiFile(filePath);
        const { frontmatter } = this.frontmatterPort.parseFrontmatter(content);
        if (frontmatter.title) {
          titles.push(frontmatter.title);
        }
      } catch {
        continue;
      }
    }

    return titles;
  }

  private determineFormat(filename: string): 'md' | 'pdf' | 'txt' | 'code' {
    const parts = filename.split('.');
    const ext = parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';

    switch (ext) {
      case '.md':
      case '.markdown':
        return 'md';
      case '.pdf':
        return 'pdf';
      case '.txt':
        return 'txt';
      case '.ts':
      case '.js':
      case '.tsx':
      case '.jsx':
      case '.py':
      case '.java':
      case '.c':
      case '.cpp':
      case '.h':
      case '.cs':
      case '.go':
      case '.rs':
      case '.rb':
      case '.php':
      case '.swift':
      case '.kt':
      case '.scala':
      case '.sh':
      case '.bash':
      case '.json':
      case '.xml':
      case '.yaml':
      case '.yml':
      case '.html':
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return 'code';
      default:
        return 'txt';
    }
  }

  private extractCategory(filePath: string): string {
    const parts = filePath.split('/');
    if (parts.length > 1) {
      return parts[0];
    }
    return 'uncategorized';
  }
}
