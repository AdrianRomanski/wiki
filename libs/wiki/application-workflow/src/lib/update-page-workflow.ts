import { WikiPage } from '@wiki/domain-models';
import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';
import { LogActivityUseCase } from '@wiki/application-activity-log';
import { UpdatePageOptions, UpdatePageResult, WorkflowError } from './interfaces';

export class UpdatePageWorkflow {
  private logActivity: LogActivityUseCase;

  constructor(
    private fileSystemPort: FileSystemPort,
    private frontmatterPort: FrontmatterPort,
    private markdownPort: MarkdownPort
  ) {
    this.logActivity = new LogActivityUseCase(fileSystemPort, markdownPort);
  }

  async execute(options: UpdatePageOptions): Promise<UpdatePageResult> {
    const { pagePath, changes, reason } = options;

    try {
      const exists = await this.fileSystemPort.wikiFileExists(pagePath);
      if (!exists) {
        throw new WorkflowError(`Page not found: ${pagePath}`);
      }

      const content = await this.fileSystemPort.readWikiFile(pagePath);
      const { frontmatter, content: bodyContent } =
        this.frontmatterPort.parseFrontmatter(content);

      const updatedFrontmatter = this.frontmatterPort.updateTimestamp(frontmatter);

      const updatedContent = this.frontmatterPort.generateFrontmatter(
        updatedFrontmatter,
        bodyContent
      );

      await this.fileSystemPort.writeWikiFile(pagePath, updatedContent);

      const pathParts = pagePath.split('/');
      const filename = pathParts[pathParts.length - 1] || '';

      const page: WikiPage = {
        path: pagePath,
        filename,
        frontmatter: updatedFrontmatter,
        content: updatedContent,
        sections: this.markdownPort.parseMarkdownSections(bodyContent),
        outgoingLinks: this.markdownPort.extractWikiLinks(bodyContent),
        incomingLinks: [],
      };

      await this.logActivity.recordUpdate(
        pagePath,
        updatedFrontmatter.title,
        changes,
        reason
      );

      return {
        page,
        writtenPath: pagePath,
      };
    } catch (error) {
      if (error instanceof WorkflowError) {
        throw error;
      }
      throw new WorkflowError(
        `Failed to update page: ${pagePath}`,
        error as Error
      );
    }
  }
}
