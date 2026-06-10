import { FrontmatterPort } from '@wiki/application-ports';
import { ADRMetadata, ComparisonMatrix } from './interfaces';

export class ADRParseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ADRParseError';
  }
}

export class ExtractADRMetadataUseCase {
  constructor(private frontmatterPort: FrontmatterPort) {}

  async execute(adrContent: string): Promise<ADRMetadata> {
    try {
      const parsed = this.frontmatterPort.parseFrontmatter(adrContent);
      const frontmatter = parsed.frontmatter;
      const content = parsed.content;

      if (!frontmatter.title || typeof frontmatter.title !== 'string') {
        throw new ADRParseError('Required field "title" is missing or invalid');
      }

      if (!frontmatter.date) {
        throw new ADRParseError('Required field "date" is missing');
      }

      let dateString: string;
      if (frontmatter.date && typeof frontmatter.date === 'object' && 'toISOString' in frontmatter.date) {
        dateString = (frontmatter.date as Date).toISOString().split('T')[0];
      } else {
        dateString = String(frontmatter.date);
      }

      const status = (frontmatter as unknown as Record<string, unknown>)['status'];
      if (!status || !['Accepted', 'Rejected', 'Superseded'].includes(status as string)) {
        throw new ADRParseError(
          'Required field "status" is missing or invalid (must be Accepted, Rejected, or Superseded)'
        );
      }

      const context = (frontmatter as unknown as Record<string, unknown>)['context'];
      if (!context || typeof context !== 'string') {
        throw new ADRParseError('Required field "context" is missing or invalid');
      }

      const sessionIdMatch = context.match(/Research Session\s+(.+)/i);
      const sessionId = sessionIdMatch ? sessionIdMatch[1].trim() : context;

      const contextSection = this.extractSection(content, 'Context and Problem Statement');
      const decisionDriversSection = this.extractSection(content, 'Decision Drivers');
      const consideredOptionsSection = this.extractSection(content, 'Considered Options');
      const decisionOutcomeSection = this.extractSection(content, 'Decision Outcome');
      const rationaleSection = this.extractSection(decisionOutcomeSection, 'Rationale');
      const positiveConsequencesSection = this.extractSection(
        decisionOutcomeSection,
        'Positive Consequences'
      );
      const negativeConsequencesSection = this.extractSection(
        decisionOutcomeSection,
        'Negative Consequences'
      );

      const decisionDrivers = this.extractListItems(decisionDriversSection);
      const consideredOptions = this.extractListItems(consideredOptionsSection);

      const chosenOptionMatch = decisionOutcomeSection.match(
        /\*\*Chosen option\*\*:\s*(.+?)(?=\n|$)/i
      );
      const chosenOption = chosenOptionMatch ? chosenOptionMatch[1].trim() : '';

      const positiveConsequences = this.extractListItems(positiveConsequencesSection);
      const negativeConsequences = this.extractListItems(negativeConsequencesSection);

      const libraries = this.detectLibraries(content);

      const comparisonMatrices = this.findComparisonMatrices(content);

      const researchLinks: {
        comparisonReport?: string;
        finalReport?: string;
        prototypes?: string[];
      } = {};

      const comparisonReportMatch = content.match(/\[comparison[- ]report\]\(([^)]+)\)/i);
      if (comparisonReportMatch) {
        researchLinks.comparisonReport = comparisonReportMatch[1];
      }

      const finalReportMatch = content.match(/\[final[- ]report\]\(([^)]+)\)/i);
      if (finalReportMatch) {
        researchLinks.finalReport = finalReportMatch[1];
      }

      const prototypeMatches = content.matchAll(/\[prototype[^\]]*\]\(([^)]+)\)/gi);
      const prototypes: string[] = [];
      for (const match of prototypeMatches) {
        prototypes.push(match[1]);
      }
      if (prototypes.length > 0) {
        researchLinks.prototypes = prototypes;
      }

      const metadata: ADRMetadata = {
        title: frontmatter.title,
        date: dateString,
        status: status as 'Accepted' | 'Rejected' | 'Superseded',
        sessionId,
        context: contextSection || context,
        decisionDrivers,
        consideredOptions,
        chosenOption,
        rationale: rationaleSection,
        positiveConsequences,
        negativeConsequences,
        comparisonMatrices:
          Object.keys(comparisonMatrices).length > 0 ? comparisonMatrices : undefined,
        libraries,
        researchLinks: Object.keys(researchLinks).length > 0 ? researchLinks : undefined,
      };

      const deciders = (frontmatter as unknown as Record<string, unknown>)['deciders'];
      if (deciders && Array.isArray(deciders)) {
        metadata.deciders = deciders;
      }

      if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
        metadata.tags = frontmatter.tags;
      }

      const supersedes = (frontmatter as unknown as Record<string, unknown>)['supersedes'];
      if (supersedes && typeof supersedes === 'string') {
        metadata.supersedes = supersedes;
      }

      const supersededBy = (frontmatter as unknown as Record<string, unknown>)['supersededBy'];
      if (supersededBy && typeof supersededBy === 'string') {
        metadata.supersededBy = supersededBy;
      }

      return metadata;
    } catch (error) {
      if (error instanceof ADRParseError) {
        throw error;
      }
      throw new ADRParseError(
        `Failed to parse ADR metadata: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  private detectLibraries(content: string): string[] {
    const libraries: string[] = [];

    const consideredOptionsMatch = content.match(
      /##\s+Considered Options\s*\n([\s\S]*?)(?=\n##|\n#|$)/i
    );

    if (!consideredOptionsMatch) {
      return libraries;
    }

    const optionsSection = consideredOptionsMatch[1];

    const numberedListRegex = /^\s*\d+[.)]\s+(.+)$/gm;
    let match;

    while ((match = numberedListRegex.exec(optionsSection)) !== null) {
      const libraryName = match[1].trim();
      if (libraryName) {
        libraries.push(libraryName);
      }
    }

    if (libraries.length === 0) {
      const bulletedListRegex = /^\s*[-*]\s+(.+)$/gm;

      while ((match = bulletedListRegex.exec(optionsSection)) !== null) {
        const libraryName = match[1].trim();
        if (libraryName) {
          libraries.push(libraryName);
        }
      }
    }

    return libraries;
  }

  parseComparisonMatrix(tableMarkdown: string, title = 'Comparison Matrix'): ComparisonMatrix {
    const lines = tableMarkdown
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.startsWith('|'));

    if (lines.length < 2) {
      throw new ADRParseError(
        `Malformed comparison matrix: expected at least 2 lines (header + separator), got ${lines.length}`
      );
    }

    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (headers.length < 2) {
      throw new ADRParseError(
        `Malformed comparison matrix: header must have at least 2 columns, got ${headers.length}`
      );
    }

    const hasWinnerColumn = headers[headers.length - 1].toLowerCase() === 'winner';

    const rows = new Map<string, string[]>();
    const winner = hasWinnerColumn ? new Map<string, string>() : undefined;

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      if (cells.length < 2) {
        continue;
      }

      const rowLabel = cells[0];

      const valueCount = hasWinnerColumn ? cells.length - 2 : cells.length - 1;
      const values = cells.slice(1, 1 + valueCount);

      rows.set(rowLabel, values);

      if (hasWinnerColumn && cells.length > valueCount + 1) {
        const winnerValue = cells[cells.length - 1];
        winner?.set(rowLabel, winnerValue);
      }
    }

    if (rows.size === 0) {
      throw new ADRParseError('Malformed comparison matrix: no data rows found');
    }

    return {
      title,
      headers,
      rows,
      winner,
    };
  }

  private extractSection(content: string, heading: string): string {
    const regex = new RegExp(`##?#?\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n#|$)`, 'i');

    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractListItems(section: string): string[] {
    const items: string[] = [];

    const numberedRegex = /^\s*\d+[.)]\s+(.+)$/gm;
    let match;

    while ((match = numberedRegex.exec(section)) !== null) {
      items.push(match[1].trim());
    }

    if (items.length === 0) {
      const bulletedRegex = /^\s*[-*]\s+(.+)$/gm;

      while ((match = bulletedRegex.exec(section)) !== null) {
        items.push(match[1].trim());
      }
    }

    return items;
  }

  private findComparisonMatrices(content: string): {
    complexity?: ComparisonMatrix;
    modularity?: ComparisonMatrix;
    bundleSize?: ComparisonMatrix;
    tokenUsage?: ComparisonMatrix;
  } {
    const matrices: {
      complexity?: ComparisonMatrix;
      modularity?: ComparisonMatrix;
      bundleSize?: ComparisonMatrix;
      tokenUsage?: ComparisonMatrix;
    } = {};

    const matrixPatterns = [
      { key: 'complexity' as const, patterns: ['complexity', 'cognitive load'] },
      { key: 'modularity' as const, patterns: ['modularity', 'code organization'] },
      { key: 'bundleSize' as const, patterns: ['bundle', 'size', 'bundle impact'] },
      { key: 'tokenUsage' as const, patterns: ['token', 'ai assistance'] },
    ];

    for (const { key, patterns } of matrixPatterns) {
      for (const pattern of patterns) {
        const sectionRegex = new RegExp(
          `##\\s+.*${pattern}.*\\n([\\s\\S]*?)(?=\\n##|\\n#|$)`,
          'i'
        );

        const match = content.match(sectionRegex);
        if (match) {
          const sectionContent = match[1];

          const tableMatch = sectionContent.match(/(\|.+\|[\s\S]*?)(?=\n\n|$)/);
          if (tableMatch) {
            try {
              const title = match[0].split('\n')[0].replace(/^##\s+/, '').trim();
              matrices[key] = this.parseComparisonMatrix(tableMatch[1], title);
              break;
            } catch {
              continue;
            }
          }
        }
      }
    }

    return matrices;
  }
}
