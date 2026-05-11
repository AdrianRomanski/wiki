/**
 * ComparisonManager - Consolidates comparison-specific logic for multi-library research
 * Feature: polished-research-workflow
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import {
  Session,
  LibraryInfo,
  ArtifactType,
  ResearchMode
} from '../types/core.js';
import { ComparisonData, BundleSize, TokenEstimate } from '../types/artifacts.js';
import { WorkflowError } from '../errors/WorkflowError.js';

/**
 * Summary of per-library data within a session
 */
export interface LibraryComparisonSummary {
  libraryName: string;
  artifactCount: number;
  prototypeCount: number;
}

/**
 * ComparisonManager consolidates comparison-specific logic into a single class.
 * It provides validation, comparison matrix generation, and comprehensive
 * comparison report generation for multi-library research sessions.
 */
export class ComparisonManager {
  /** Minimum number of libraries for comparison mode */
  private static readonly MIN_LIBRARIES = 2;
  /** Maximum number of libraries for comparison mode (Requirement 7.6) */
  private static readonly MAX_LIBRARIES = 3;

  /**
   * Validates that the library count is within the allowed range for comparison mode.
   * Requirement 7.6: Enforce a maximum of 3 libraries in comparison mode
   * Requirement 7.7: Reject requests with more than 3 libraries
   *
   * @param libraries - Array of library names to validate
   * @returns true if the count is valid (2-3 libraries), false otherwise
   */
  validateLibraryCount(libraries: string[]): boolean {
    return (
      libraries.length >= ComparisonManager.MIN_LIBRARIES &&
      libraries.length <= ComparisonManager.MAX_LIBRARIES
    );
  }

  /**
   * Generates comparison matrices with placeholder scores for the given libraries.
   * Requirement 7.2: Generate comparison matrices for complexity, modularity, bundle size, and token usage
   *
   * Placeholder scores are used because actual metrics come from analysis phases.
   * This provides the data structure that downstream consumers (ADR, reports) expect.
   *
   * @param libraries - Array of LibraryInfo objects to compare
   * @returns ComparisonData with placeholder values for all dimensions
   * @throws WorkflowError if library count is invalid
   */
  generateComparisonMatrices(libraries: LibraryInfo[]): ComparisonData {
    const names = libraries.map(l => l.name);

    if (!this.validateLibraryCount(names)) {
      throw new WorkflowError(
        `Comparison mode requires ${ComparisonManager.MIN_LIBRARIES}-${ComparisonManager.MAX_LIBRARIES} libraries, got ${libraries.length}`,
        'INVALID_LIBRARY_COUNT',
        { count: libraries.length, min: ComparisonManager.MIN_LIBRARIES, max: ComparisonManager.MAX_LIBRARIES }
      );
    }

    const complexityScores = new Map<string, number>();
    const modularityScores = new Map<string, number>();
    const bundleSizes = new Map<string, BundleSize>();
    const tokenEstimates = new Map<string, TokenEstimate>();

    for (const lib of libraries) {
      // Placeholder scores - actual values come from analysis
      complexityScores.set(lib.name, 0);
      modularityScores.set(lib.name, 0);
      bundleSizes.set(lib.name, { minified: 0, gzipped: 0, raw: 0 });
      tokenEstimates.set(lib.name, {
        setup: 0,
        implementation: 0,
        debugging: 0,
        total: 0,
        model: 'pending'
      });
    }

    return {
      complexityScores,
      modularityScores,
      bundleSizes,
      tokenEstimates
    };
  }

  /**
   * Generates a comprehensive markdown comparison report combining all comparison data.
   * Requirement 7.5: Generate a comprehensive comparison report in Phase 4
   *
   * @param session - The current research session
   * @returns Markdown string with the full comparison report
   */
  generateComparisonReport(session: Session): string {
    const libraries = session.metadata.libraries;
    const libraryNames = libraries.map(l => l.name);
    const sections: string[] = [];

    // Header
    sections.push('# Comprehensive Comparison Report\n');
    sections.push(`**Goal**: ${session.metadata.goal}`);
    sections.push(`**Mode**: ${session.metadata.mode}`);
    sections.push(`**Libraries**: ${libraryNames.join(', ')}`);
    sections.push(`**Generated**: ${new Date().toISOString()}\n`);

    // Library Overview Table
    sections.push('## Library Overview\n');
    sections.push('| Library | Version | Install Path |');
    sections.push('|---------|---------|--------------|');
    for (const lib of libraries) {
      sections.push(`| ${lib.name} | ${lib.version} | ${lib.installPath} |`);
    }
    sections.push('');

    // Comparison Matrices
    sections.push('## Comparison Matrices\n');
    sections.push('| Dimension | ' + libraryNames.join(' | ') + ' |');
    sections.push('| --- | ' + libraryNames.map(() => '---').join(' | ') + ' |');
    sections.push('| Complexity | ' + libraryNames.map(() => 'N/A').join(' | ') + ' |');
    sections.push('| Modularity | ' + libraryNames.map(() => 'N/A').join(' | ') + ' |');
    sections.push('| Bundle Size (gzip) | ' + libraryNames.map(() => 'N/A').join(' | ') + ' |');
    sections.push('| Token Usage | ' + libraryNames.map(() => 'N/A').join(' | ') + ' |');
    sections.push('');

    // Per-Library Artifact Summary
    sections.push('## Per-Library Analysis\n');
    const summaries = this.getLibraryComparisonSummary(session);
    for (const summary of summaries) {
      sections.push(`### ${summary.libraryName}\n`);
      sections.push(`- **Artifacts**: ${summary.artifactCount}`);
      sections.push(`- **Prototypes**: ${summary.prototypeCount}`);
      sections.push('');
    }

    // Artifacts Generated
    const bigPictures = session.artifacts.filter(a => a.type === ArtifactType.BIG_PICTURE);
    const comparisonViews = session.artifacts.filter(a => a.type === ArtifactType.COMPARISON_VIEW);
    const prototypes = session.artifacts.filter(a => a.type === ArtifactType.PROTOTYPE);

    if (bigPictures.length > 0 || comparisonViews.length > 0) {
      sections.push('## Analysis Artifacts\n');
      for (const bp of bigPictures) {
        sections.push(`- [${bp.name}](${bp.path})`);
      }
      for (const cv of comparisonViews) {
        sections.push(`- [${cv.name}](${cv.path})`);
      }
      sections.push('');
    }

    if (prototypes.length > 0) {
      sections.push('## Prototypes\n');
      for (const proto of prototypes) {
        sections.push(`- [${proto.name}](${proto.path})`);
      }
      sections.push('');
    }

    // Documentation References
    if (session.metadata.documentationLinks.length > 0) {
      sections.push('## Documentation References\n');
      for (const link of session.metadata.documentationLinks) {
        sections.push(`- ${link}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Summarizes per-library data from the session, counting artifacts and prototypes
   * associated with each library.
   * Requirement 7.1: Maintain separate analysis artifacts for each library
   *
   * @param session - The current research session
   * @returns Array of per-library summaries with artifact and prototype counts
   */
  getLibraryComparisonSummary(session: Session): LibraryComparisonSummary[] {
    return session.metadata.libraries.map(lib => {
      // Count artifacts related to this library
      const artifactCount = session.artifacts.filter(a =>
        a.name.toLowerCase().includes(this.sanitizeName(lib.name).toLowerCase()) ||
        a.path.toLowerCase().includes(this.sanitizeName(lib.name).toLowerCase())
      ).length;

      // Count prototypes related to this library
      const prototypeCount = session.artifacts.filter(a =>
        a.type === ArtifactType.PROTOTYPE && (
          a.name.toLowerCase().includes(this.sanitizeName(lib.name).toLowerCase()) ||
          a.path.toLowerCase().includes(this.sanitizeName(lib.name).toLowerCase())
        )
      ).length;

      return {
        libraryName: lib.name,
        artifactCount,
        prototypeCount
      };
    });
  }

  /**
   * Sanitizes a library name for use in file path matching
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/^@/, '')
      .replace(/\//g, '-')
      .replace(/[^\w-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
