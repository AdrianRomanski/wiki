import { FileSystemPort, FrontmatterPort, MarkdownPort } from '@wiki/application-ports';
import {
  GenerateMaintenanceReportUseCase,
  DetectDuplicatesUseCase,
  DetectContradictionsUseCase,
  DetectBrokenLinksUseCase,
  DetectOrphansUseCase,
} from '@wiki/application-maintenance';
import { MaintenanceReport } from '@wiki/domain-models';
import { MaintenanceResult, WorkflowError } from './interfaces';

export class MaintenanceWorkflow {
  private generateMaintenanceReport: GenerateMaintenanceReportUseCase;

  constructor(
    private fileSystemPort: FileSystemPort,
    private frontmatterPort: FrontmatterPort,
    private markdownPort: MarkdownPort
  ) {
    const detectDuplicates = new DetectDuplicatesUseCase(
      fileSystemPort,
      frontmatterPort
    );
    const detectContradictions = new DetectContradictionsUseCase(
      fileSystemPort,
      markdownPort,
      frontmatterPort
    );
    const detectBrokenLinks = new DetectBrokenLinksUseCase(
      fileSystemPort,
      markdownPort,
      frontmatterPort
    );
    const detectOrphans = new DetectOrphansUseCase(
      fileSystemPort,
      markdownPort,
      frontmatterPort
    );
    this.generateMaintenanceReport = new GenerateMaintenanceReportUseCase(
      detectDuplicates,
      detectContradictions,
      detectBrokenLinks,
      detectOrphans
    );
  }

  async execute(): Promise<MaintenanceResult> {
    try {
      const report = await this.generateMaintenanceReport.execute();

      const timestamp = new Date();
      const reportPath = `maintenance-report-${this.formatDate(timestamp)}.md`;

      const reportContent = this.generateReportMarkdown(report, timestamp);
      await this.fileSystemPort.writeWikiFile(reportPath, reportContent);

      return {
        reportPath,
        timestamp,
      };
    } catch (error) {
      throw new WorkflowError(
        'Failed to execute maintenance workflow',
        error as Error
      );
    }
  }

  private generateReportMarkdown(report: MaintenanceReport, timestamp: Date): string {
    const lines: string[] = [];

    lines.push('# Maintenance Report');
    lines.push('');
    lines.push(`Generated: ${timestamp.toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (report.duplicates && report.duplicates.length > 0) {
      lines.push('## Duplicates');
      lines.push('');
      for (const dup of report.duplicates) {
        lines.push(`- ${dup.page1} and ${dup.page2}: ${dup.similarity}% similar`);
      }
      lines.push('');
    }

    if (report.contradictions && report.contradictions.length > 0) {
      lines.push('## Contradictions');
      lines.push('');
      for (const contra of report.contradictions) {
        lines.push(`- ${contra.pages.join(', ')}: ${contra.contradiction}`);
      }
      lines.push('');
    }

    if (report.brokenLinks && report.brokenLinks.length > 0) {
      lines.push('## Broken Links');
      lines.push('');
      for (const link of report.brokenLinks) {
        lines.push(`- ${link.page}: ${link.brokenLinks.join(', ')}`);
      }
      lines.push('');
    }

    if (report.orphans && report.orphans.length > 0) {
      lines.push('## Orphaned Pages');
      lines.push('');
      for (const orphan of report.orphans) {
        lines.push(`- ${orphan.page}: no incoming links`);
      }
      lines.push('');
    }

    if (report.consolidationOpportunities && report.consolidationOpportunities.length > 0) {
      lines.push('## Consolidation Opportunities');
      lines.push('');
      for (const opp of report.consolidationOpportunities) {
        lines.push(`- ${opp.pages.join(', ')}: ${opp.reason}`);
      }
      lines.push('');
    }

    if (report.summary) {
      lines.push('## Summary');
      lines.push('');
      lines.push(`- Total Pages: ${report.summary.totalPages || 0}`);
      lines.push(`- Health Score: ${report.summary.healthScore || 0}%`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
