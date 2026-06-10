import { ADRMetadata, SessionReference } from './interfaces';

export class LinkADRToSessionUseCase {
  execute(metadata: ADRMetadata): SessionReference {
    return {
      sessionId: metadata.sessionId,
      links: metadata.researchLinks,
    };
  }

  generateSessionReferenceMarkdown(sessionReference: SessionReference): string {
    const lines: string[] = [];

    lines.push('## Research Session');
    lines.push(`**Session ID**: ${sessionReference.sessionId}`);
    lines.push('');

    if (sessionReference.sessionPath) {
      lines.push(`**Session Directory**: \`${sessionReference.sessionPath}\``);
      lines.push('');
    }

    if (sessionReference.rawADRPath) {
      lines.push(`**ADR Source**: \`${sessionReference.rawADRPath}\``);
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
        for (let i = 0; i < prototypes.length; i++) {
          lines.push(`- [Prototype ${i + 1}](${prototypes[i]})`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}
