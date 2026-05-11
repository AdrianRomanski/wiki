/**
 * ArtifactCoordinator - Manages artifact generation, organization, and persistence
 * Feature: polished-research-workflow
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Session,
  Phase,
  ArtifactType,
  ArtifactReference,
  ResearchMode
} from '../types/core';
import { Artifact, ArtifactMetadata, Decision, ComparisonData } from '../types/artifacts';
import { ArtifactGenerationError } from '../errors/WorkflowError';

/**
 * ArtifactCoordinator handles artifact generation, naming, organization,
 * and persistence throughout the research workflow lifecycle.
 */
export class ArtifactCoordinator {
  private readonly baseDir: string;

  constructor(baseDir: string = '.kiro/research/sessions') {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Generates a phase report summarizing the work done in a specific phase
   * Requirement 9.1: Save big picture visualizations as markdown
   * Requirement 9.2: Save prototypes and examples with descriptive filenames
   */
  async generatePhaseReport(phase: Phase, session: Session): Promise<Artifact> {
    try {
      const phaseHistory = session.history.find(
        h => h.phase === phase && h.completedAt !== null
      );

      const actions = phaseHistory?.actions ?? [];
      const startedAt = phaseHistory?.startedAt ?? 'unknown';
      const completedAt = phaseHistory?.completedAt ?? 'unknown';

      const relatedArtifacts = session.artifacts.filter(
        a => a.createdAt >= startedAt && (completedAt === 'unknown' || a.createdAt <= completedAt)
      );

      const content = this.renderPhaseReport(phase, session, actions, relatedArtifacts, startedAt, completedAt);

      return {
        type: ArtifactType.PHASE_REPORT,
        name: `${phase.toLowerCase()}-report.md`,
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          phase,
          relatedLibraries: session.metadata.libraries.map(l => l.name),
          tags: ['phase-report', phase.toLowerCase()]
        }
      };
    } catch (error) {
      if (error instanceof ArtifactGenerationError) throw error;
      throw new ArtifactGenerationError(
        ArtifactType.PHASE_REPORT,
        `Failed to generate phase report for ${phase}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generates a final report summarizing all findings across all phases
   * Requirement 9.3: Generate final report including all phases' findings
   * Requirement 9.4: Include links to all artifacts created during session
   */
  async generateFinalReport(session: Session): Promise<Artifact> {
    try {
      const content = this.renderFinalReport(session);

      return {
        type: ArtifactType.FINAL_REPORT,
        name: 'final-report.md',
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.DECISION,
          relatedLibraries: session.metadata.libraries.map(l => l.name),
          tags: ['final-report', 'summary']
        }
      };
    } catch (error) {
      if (error instanceof ArtifactGenerationError) throw error;
      throw new ArtifactGenerationError(
        ArtifactType.FINAL_REPORT,
        `Failed to generate final report: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generates an Architecture Decision Record documenting the library decision
   * Requirement 9.5: Follow standard ADR template with required sections
   */
  async generateADR(session: Session, decision: Decision): Promise<Artifact> {
    try {
      const content = this.renderADR(session, decision);

      return {
        type: ArtifactType.ADR,
        name: 'decision.adr.md',
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.DECISION,
          relatedLibraries: session.metadata.libraries.map(l => l.name),
          tags: ['adr', 'decision']
        }
      };
    } catch (error) {
      if (error instanceof ArtifactGenerationError) throw error;
      throw new ArtifactGenerationError(
        ArtifactType.ADR,
        `Failed to generate ADR: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generates a Research Decision Record for wiki integration
   * Requirement 9.6: Include code examples from Phase 3
   */
  async generateResearchDecisionRecord(session: Session): Promise<Artifact> {
    try {
      const content = this.renderResearchDecisionRecord(session);

      return {
        type: ArtifactType.RESEARCH_DECISION_RECORD,
        name: 'research-decision-record.md',
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.DECISION,
          relatedLibraries: session.metadata.libraries.map(l => l.name),
          tags: ['research-decision-record', 'wiki']
        }
      };
    } catch (error) {
      if (error instanceof ArtifactGenerationError) throw error;
      throw new ArtifactGenerationError(
        ArtifactType.RESEARCH_DECISION_RECORD,
        `Failed to generate Research Decision Record: ${(error as Error).message}`
      );
    }
  }

  /**
   * Saves an artifact to the session directory with proper file paths.
   * Includes retry logic and in-memory fallback on persistent failure.
   * Requirement 9.7: Organize artifacts in structured session directory
   * Requirement 9.1, 9.2, 9.3: Handle file system write failures
   */
  async saveArtifact(artifact: Artifact, session: Session): Promise<string> {
    const artifactPath = this.resolveArtifactPath(artifact, session);
    const fullPath = path.join(this.baseDir, session.id, artifactPath);
    const MAX_WRITE_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_WRITE_RETRIES; attempt++) {
      try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Write artifact content
        await fs.writeFile(fullPath, artifact.content, 'utf-8');

        return artifactPath;
      } catch (error) {
        if (attempt < MAX_WRITE_RETRIES) {
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // All retries exhausted - store in memory fallback
        this.storeInMemory(artifact, session);

        throw new ArtifactGenerationError(
          artifact.type,
          `Failed to save artifact after ${MAX_WRITE_RETRIES + 1} attempts: ${(error as Error).message}. Artifact stored in memory.`
        );
      }
    }

    // Should not reach here, but TypeScript needs a return
    return artifactPath;
  }

  /**
   * In-memory artifact storage as fallback when file system persistence fails
   */
  private inMemoryArtifacts: Map<string, Artifact[]> = new Map();

  /**
   * Stores an artifact in memory when file system persistence fails
   */
  private storeInMemory(artifact: Artifact, session: Session): void {
    const existing = this.inMemoryArtifacts.get(session.id) ?? [];
    existing.push(artifact);
    this.inMemoryArtifacts.set(session.id, existing);
  }

  /**
   * Retrieves in-memory artifacts for a session (used for recovery)
   */
  getInMemoryArtifacts(sessionId: string): Artifact[] {
    return this.inMemoryArtifacts.get(sessionId) ?? [];
  }

  /**
   * Lists all artifacts for a given session
   */
  async listArtifacts(session: Session): Promise<ArtifactReference[]> {
    return session.artifacts;
  }

  /**
   * Generates an artifact index listing all artifacts with descriptions
   * Requirement 9.8: Generate index file listing all artifacts
   */
  async generateArtifactIndex(session: Session): Promise<void> {
    const content = this.renderArtifactIndex(session);
    const indexPath = path.join(this.baseDir, session.id, 'artifacts-index.md');

    try {
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      await fs.writeFile(indexPath, content, 'utf-8');
    } catch (error) {
      throw new ArtifactGenerationError(
        'ARTIFACT_INDEX',
        `Failed to generate artifact index: ${(error as Error).message}`
      );
    }
  }

  // ─── Private Rendering Methods ───────────────────────────────────────────────

  /**
   * Renders a phase report as markdown
   */
  private renderPhaseReport(
    phase: Phase,
    session: Session,
    actions: string[],
    relatedArtifacts: ArtifactReference[],
    startedAt: string,
    completedAt: string
  ): string {
    const lines: string[] = [
      `# Phase Report: ${phase}`,
      '',
      `**Session**: ${session.id}`,
      `**Goal**: ${session.metadata.goal}`,
      `**Mode**: ${session.metadata.mode}`,
      `**Started**: ${startedAt}`,
      `**Completed**: ${completedAt}`,
      '',
      '## Libraries',
      '',
    ];

    for (const lib of session.metadata.libraries) {
      lines.push(`- ${lib.name}@${lib.version}`);
    }

    lines.push('', '## Actions Performed', '');

    if (actions.length === 0) {
      lines.push('_No actions recorded._');
    } else {
      for (const action of actions) {
        lines.push(`- ${action}`);
      }
    }

    lines.push('', '## Artifacts Generated', '');

    if (relatedArtifacts.length === 0) {
      lines.push('_No artifacts generated in this phase._');
    } else {
      for (const artifact of relatedArtifacts) {
        lines.push(`- [${artifact.name}](${artifact.path}) (${artifact.type})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Renders the final report as markdown
   */
  private renderFinalReport(session: Session): string {
    const lines: string[] = [
      '# Final Research Report',
      '',
      `**Session**: ${session.id}`,
      `**Goal**: ${session.metadata.goal}`,
      `**Mode**: ${session.metadata.mode}`,
      `**Created**: ${session.createdAt}`,
      `**Finalized**: ${new Date().toISOString()}`,
      '',
      '## Research Overview',
      '',
      `This report summarizes the research conducted for: "${session.metadata.goal}"`,
      '',
      '### Libraries Researched',
      '',
    ];

    for (const lib of session.metadata.libraries) {
      lines.push(`- **${lib.name}** (v${lib.version}) - installed at ${lib.installPath}`);
    }

    if (session.metadata.documentationLinks.length > 0) {
      lines.push('', '### Documentation References', '');
      for (const link of session.metadata.documentationLinks) {
        lines.push(`- ${link}`);
      }
    }

    // Phase summaries
    lines.push('', '## Phase Summaries', '');

    for (const history of session.history) {
      lines.push(`### ${history.phase}`);
      lines.push('');
      lines.push(`- **Started**: ${history.startedAt}`);
      lines.push(`- **Completed**: ${history.completedAt ?? 'In progress'}`);

      if (history.actions.length > 0) {
        lines.push('- **Actions**:');
        for (const action of history.actions) {
          lines.push(`  - ${action}`);
        }
      }
      lines.push('');
    }

    // All artifacts
    lines.push('## All Artifacts', '');

    if (session.artifacts.length === 0) {
      lines.push('_No artifacts generated._');
    } else {
      for (const artifact of session.artifacts) {
        lines.push(`- [${artifact.name}](${artifact.path}) — ${artifact.type} (${artifact.createdAt})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Renders an ADR following the standard template
   * Required sections: Context and Problem Statement, Decision Drivers,
   * Considered Options, Decision Outcome, Consequences, Comparison Summary
   */
  private renderADR(session: Session, decision: Decision): string {
    const date = new Date().toISOString().split('T')[0];
    const libraries = session.metadata.libraries;

    const lines: string[] = [
      `# ADR: ${session.metadata.goal}`,
      '',
      `**Date**: ${date}`,
      `**Status**: Accepted`,
      `**Decision**: ${decision.selectedLibrary ?? 'No library selected'}`,
      '',
      '## Context and Problem Statement',
      '',
      session.metadata.goal,
      '',
      '## Decision Drivers',
      '',
      '- Complexity (lower is better)',
      '- Modularity (higher is better)',
      '- Bundle size impact',
      '- Token usage for AI-assisted development',
      '- Developer experience',
      '',
      '## Considered Options',
      '',
    ];

    for (const lib of libraries) {
      lines.push(`- **${lib.name}** (v${lib.version})`);
    }

    lines.push('', '## Decision Outcome', '');

    if (decision.selectedLibrary) {
      lines.push(`Chosen option: **${decision.selectedLibrary}**`);
    } else {
      lines.push('No library was selected.');
    }

    lines.push('', '### Rationale', '');
    lines.push(decision.rationale || '_No rationale provided._');

    lines.push('', '## Consequences', '');
    lines.push('### Positive', '');
    lines.push('- Structured research process ensures informed decision');
    lines.push('- All options evaluated against consistent criteria');
    lines.push('');
    lines.push('### Negative', '');
    lines.push('- Research time investment required');
    lines.push('- Decision may need revisiting as libraries evolve');

    lines.push('', '## Comparison Summary', '');

    if (session.metadata.mode === ResearchMode.COMPARISON) {
      lines.push(this.renderComparisonTable(decision.comparisonData, libraries.map(l => l.name)));
    } else {
      lines.push('_Single library mode — no comparison data._');
    }

    return lines.join('\n');
  }

  /**
   * Renders comparison data as a markdown table
   */
  private renderComparisonTable(data: ComparisonData, libraryNames: string[]): string {
    const lines: string[] = [
      '| Dimension | ' + libraryNames.join(' | ') + ' |',
      '| --- | ' + libraryNames.map(() => '---').join(' | ') + ' |',
    ];

    // Complexity scores
    const complexityRow = libraryNames.map(name => {
      const score = data.complexityScores.get(name);
      return score !== undefined ? String(score) : 'N/A';
    });
    lines.push(`| Complexity | ${complexityRow.join(' | ')} |`);

    // Modularity scores
    const modularityRow = libraryNames.map(name => {
      const score = data.modularityScores.get(name);
      return score !== undefined ? String(score) : 'N/A';
    });
    lines.push(`| Modularity | ${modularityRow.join(' | ')} |`);

    // Bundle sizes
    const bundleRow = libraryNames.map(name => {
      const size = data.bundleSizes.get(name);
      return size ? `${size.gzipped}B gz` : 'N/A';
    });
    lines.push(`| Bundle (gzip) | ${bundleRow.join(' | ')} |`);

    // Token estimates
    const tokenRow = libraryNames.map(name => {
      const estimate = data.tokenEstimates.get(name);
      return estimate ? String(estimate.total) : 'N/A';
    });
    lines.push(`| Token Usage | ${tokenRow.join(' | ')} |`);

    return lines.join('\n');
  }

  /**
   * Renders a Research Decision Record for wiki integration
   */
  private renderResearchDecisionRecord(session: Session): string {
    const lines: string[] = [
      `# Research Decision Record: ${session.metadata.goal}`,
      '',
      `**Session ID**: ${session.id}`,
      `**Date**: ${new Date().toISOString().split('T')[0]}`,
      `**Mode**: ${session.metadata.mode}`,
      '',
      '## Summary',
      '',
      `Research conducted to: ${session.metadata.goal}`,
      '',
      '## Libraries Evaluated',
      '',
    ];

    for (const lib of session.metadata.libraries) {
      lines.push(`### ${lib.name} (v${lib.version})`);
      lines.push('');
      lines.push(`- Installed from: \`${lib.installPath}\``);
      lines.push(`- Installed at: ${lib.installedAt}`);
      lines.push('');
    }

    // Include prototype references from session artifacts
    const prototypes = session.artifacts.filter(a => a.type === ArtifactType.PROTOTYPE);
    if (prototypes.length > 0) {
      lines.push('## Code Examples', '');
      for (const proto of prototypes) {
        lines.push(`- [${proto.name}](${proto.path})`);
      }
      lines.push('');
    }

    // Include big picture references
    const bigPictures = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
    if (bigPictures.length > 0) {
      lines.push('## Analysis Artifacts', '');
      for (const bp of bigPictures) {
        lines.push(`- [${bp.name}](${bp.path})`);
      }
      lines.push('');
    }

    // Documentation links
    if (session.metadata.documentationLinks.length > 0) {
      lines.push('## References', '');
      for (const link of session.metadata.documentationLinks) {
        lines.push(`- ${link}`);
      }
      lines.push('');
    }

    // Phase history summary
    lines.push('## Research Timeline', '');
    for (const history of session.history) {
      const status = history.completedAt ? '✅' : '⏳';
      lines.push(`- ${status} **${history.phase}**: ${history.startedAt} → ${history.completedAt ?? 'ongoing'}`);
    }

    return lines.join('\n');
  }

  /**
   * Renders the artifact index as markdown
   */
  private renderArtifactIndex(session: Session): string {
    const lines: string[] = [
      `# Artifact Index: ${session.id}`,
      '',
      `**Goal**: ${session.metadata.goal}`,
      `**Total Artifacts**: ${session.artifacts.length}`,
      `**Generated**: ${new Date().toISOString()}`,
      '',
      '## Artifacts by Type',
      '',
    ];

    // Group artifacts by type
    const grouped = new Map<ArtifactType, ArtifactReference[]>();
    for (const artifact of session.artifacts) {
      const existing = grouped.get(artifact.type) ?? [];
      existing.push(artifact);
      grouped.set(artifact.type, existing);
    }

    for (const [type, artifacts] of grouped) {
      lines.push(`### ${this.formatArtifactType(type)}`, '');
      for (const artifact of artifacts) {
        lines.push(`- [${artifact.name}](${artifact.path}) — created ${artifact.createdAt}`);
      }
      lines.push('');
    }

    if (session.artifacts.length === 0) {
      lines.push('_No artifacts have been generated for this session._');
    }

    return lines.join('\n');
  }

  // ─── Private Utility Methods ─────────────────────────────────────────────────

  /**
   * Resolves the file path for an artifact based on its type
   * Requirement 9.7: Structured session directory with clear naming
   */
  private resolveArtifactPath(artifact: Artifact, session: Session): string {
    switch (artifact.type) {
      case ArtifactType.BIG_PICTURE: {
        const libName = artifact.metadata.relatedLibraries[0] ?? 'unknown';
        return `libraries/${this.sanitizeName(libName)}/big-picture.md`;
      }
      case ArtifactType.COMPARISON_VIEW:
        return 'comparison-view.md';
      case ArtifactType.PROTOTYPE:
        return `prototypes/${artifact.name}`;
      case ArtifactType.PHASE_REPORT:
        return `phase-reports/${artifact.name}`;
      case ArtifactType.FINAL_REPORT:
        return 'final-report.md';
      case ArtifactType.ADR:
        return 'decision.adr.md';
      case ArtifactType.RESEARCH_DECISION_RECORD:
        return 'research-decision-record.md';
      default:
        return artifact.name;
    }
  }

  /**
   * Sanitizes a name for use in file paths
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/^@/, '')
      .replace(/\//g, '-')
      .replace(/[^\w-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Formats an artifact type enum value for display
   */
  private formatArtifactType(type: ArtifactType): string {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
