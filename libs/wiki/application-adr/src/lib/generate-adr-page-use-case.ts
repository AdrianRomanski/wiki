import { MarkdownPort, FrontmatterPort } from '@wiki/application-ports';
import { generateFilename } from '@wiki/domain-naming';
import { GeneratedPage } from '@wiki/application-generators';
import { ADRSourceSummaryOptions, ComparisonMatrix, ADRMetadata, SessionReference } from './interfaces';

export class GenerateADRPageUseCase {
  constructor(
    private markdownPort: MarkdownPort,
    private frontmatterPort: FrontmatterPort
  ) {}

  execute(options: ADRSourceSummaryOptions): GeneratedPage {
    const { metadata, rawSourcePath, includeMatrices = true } = options;

    const frontmatter = this.frontmatterPort.createFrontmatter({
      title: metadata.title,
      type: 'source',
      tags: ['research', 'adr', 'decision', ...(metadata.tags || [])],
      date: metadata.date,
      created: metadata.date,
    });

    const extendedFrontmatter = {
      ...frontmatter,
      status: metadata.status,
      sessionId: metadata.sessionId,
      ...(metadata.supersededBy && { supersededBy: metadata.supersededBy }),
    };

    const filename = generateFilename(metadata.title, 'source', new Date(metadata.date));

    const sections: string[] = [];

    sections.push(this.markdownPort.generateHeading(metadata.title, 1));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Metadata', 2));
    const metadataLines: string[] = [];
    metadataLines.push(`**Date**: ${metadata.date}`);
    metadataLines.push(`**Status**: ${metadata.status}`);
    metadataLines.push(`**Raw Source**: \`${rawSourcePath}\``);
    if (metadata.deciders && metadata.deciders.length > 0) {
      metadataLines.push(`**Deciders**: ${metadata.deciders.join(', ')}`);
    }
    sections.push(metadataLines.join('\n'));
    sections.push('');

    sections.push(this.markdownPort.generateHeading('Context', 2));
    sections.push(metadata.context);
    sections.push('');

    if (metadata.decisionDrivers.length > 0) {
      sections.push(this.markdownPort.generateHeading('Key Points', 2));
      sections.push(this.markdownPort.generateList(metadata.decisionDrivers));
      sections.push('');
    }

    if (metadata.consideredOptions.length > 0) {
      sections.push(this.markdownPort.generateHeading('Considered Options', 2));
      sections.push(this.markdownPort.generateList(metadata.consideredOptions));
      sections.push('');
    }

    sections.push(this.markdownPort.generateHeading('Insights', 2));
    sections.push(`**Chosen option**: ${metadata.chosenOption}`);
    sections.push('');
    if (metadata.rationale) {
      sections.push(metadata.rationale);
      sections.push('');
    }

    if (metadata.positiveConsequences.length > 0) {
      sections.push(this.markdownPort.generateHeading('Positive Consequences', 3));
      sections.push(this.markdownPort.generateList(metadata.positiveConsequences));
      sections.push('');
    }

    if (metadata.negativeConsequences.length > 0) {
      sections.push(this.markdownPort.generateHeading('Negative Consequences', 3));
      sections.push(this.markdownPort.generateList(metadata.negativeConsequences));
      sections.push('');
    }

    if (includeMatrices && metadata.comparisonMatrices) {
      sections.push(this.markdownPort.generateHeading('Comparison Matrices', 2));
      sections.push('');

      const { complexity, modularity, bundleSize, tokenUsage } = metadata.comparisonMatrices;

      if (complexity) {
        sections.push(this.formatComparisonMatrix(complexity));
      }

      if (modularity) {
        sections.push(this.formatComparisonMatrix(modularity));
      }

      if (bundleSize) {
        sections.push(this.formatComparisonMatrix(bundleSize));
      }

      if (tokenUsage) {
        sections.push(this.formatComparisonMatrix(tokenUsage));
      }
    }

    const sessionReference = this.extractSessionReference(metadata);
    sections.push(this.generateSessionReferenceSection(sessionReference));

    if (metadata.libraries.length > 0) {
      sections.push(this.markdownPort.generateHeading('Relevant Entities', 2));
      const libraryLinks = metadata.libraries.map((lib) => this.markdownPort.generateWikiLink(lib));
      sections.push(this.markdownPort.generateList(libraryLinks));
      sections.push('');
    }

    const bodyContent = sections.join('\n').trim();

    const content = this.frontmatterPort.generateFrontmatter(extendedFrontmatter, bodyContent);

    return {
      content,
      filename,
      frontmatter: extendedFrontmatter,
    };
  }

  private formatComparisonMatrix(matrix: ComparisonMatrix, title?: string): string {
    const lines: string[] = [];

    const matrixTitle = title || matrix.title;
    lines.push(`### ${matrixTitle}`);
    lines.push('');

    const hasWinner = matrix.winner !== undefined;
    const headerRow = ['Criterion', ...matrix.headers.slice(1)];
    if (hasWinner) {
      headerRow.push('Winner');
    }

    const separatorRow = headerRow.map(() => '---');

    const dataRows: string[][] = [];
    for (const [criterion, values] of matrix.rows.entries()) {
      const row = [criterion, ...values];
      if (hasWinner && matrix.winner) {
        const winnerValue = matrix.winner.get(criterion) || '';
        row.push(winnerValue);
      }
      dataRows.push(row);
    }

    const formatRow = (cells: string[]) => `| ${cells.join(' | ')} |`;

    lines.push(formatRow(headerRow));
    lines.push(formatRow(separatorRow));
    for (const row of dataRows) {
      lines.push(formatRow(row));
    }
    lines.push('');

    return lines.join('\n');
  }

  private extractSessionReference(metadata: ADRMetadata): SessionReference {
    return {
      sessionId: metadata.sessionId,
      sessionPath: (metadata as unknown as Record<string, unknown>)['sessionPath'] as string | undefined,
      rawADRPath: (metadata as unknown as Record<string, unknown>)['rawADRPath'] as string | undefined,
      links: metadata.researchLinks,
    };
  }

  private generateSessionReferenceSection(sessionReference: SessionReference): string {
    const lines: string[] = [];

    lines.push(this.markdownPort.generateHeading('Research Session', 2));
    lines.push(`**Session ID**: ${sessionReference.sessionId}`);
    lines.push('');

    if (sessionReference.sessionPath) {
      lines.push(`**Session Directory**: \`${sessionReference.sessionPath}\``);
      lines.push('');
    }

    if (sessionReference.links) {
      const { comparisonReport, finalReport, prototypes } = sessionReference.links;

      if (comparisonReport) {
        lines.push(`**Comparison Report**: [View Report](${comparisonReport})`);
      }

      if (finalReport) {
        lines.push(`**Final Report**: [View Report](${finalReport})`);
      }

      if (prototypes && prototypes.length > 0) {
        lines.push('**Prototypes**:');
        const prototypeItems = prototypes.map(
          (link: string, idx: number) => `[Prototype ${idx + 1}](${link})`
        );
        lines.push(this.markdownPort.generateList(prototypeItems));
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}
