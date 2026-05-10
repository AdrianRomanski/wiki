/**
 * Research Session Linker Module
 * 
 * Creates bidirectional links between wiki pages and research sessions.
 * Generates session reference sections with links to research artifacts.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { ADRMetadata } from './adr-metadata-extractor.js';
import { DEFAULT_CONFIG, FileSystemConfig } from './filesystem.js';

/**
 * Session reference information.
 */
export interface SessionReference {
  /** Research session ID */
  sessionId: string;
  
  /** Path to the session directory */
  sessionPath: string;
  
  /** Path to the comparison report (if exists) */
  comparisonReportPath?: string;
  
  /** Path to the final report (if exists) */
  finalReportPath?: string;
  
  /** Paths to prototypes (if exist) */
  prototypePaths?: string[];
}

/**
 * Validation result for a session reference.
 */
export interface SessionReferenceValidation {
  /** Whether the session reference is valid */
  valid: boolean;
  
  /** Validation errors (if any) */
  errors: string[];
}

/**
 * Extracts session reference from an ADR.
 * 
 * This function:
 * - Extracts session ID from ADR metadata
 * - Constructs session path from session ID
 * - Extracts research links from ADR metadata
 * - Returns SessionReference structure
 * 
 * @param adrMetadata - ADR metadata
 * @returns Session reference
 * 
 * @example
 * ```typescript
 * const metadata = await extractADRMetadata(adrContent);
 * const sessionRef = extractSessionReference(metadata);
 * console.log(sessionRef.sessionPath);
 * // '.kiro/research/sessions/focus-trap-2024-01-15/'
 * ```
 */
export function extractSessionReference(
  adrMetadata: ADRMetadata
): SessionReference {
  const sessionId = adrMetadata.sessionId;
  
  // Construct session path: .kiro/research/sessions/[session-id]/
  const sessionPath = `.kiro/research/sessions/${sessionId}`;
  
  // Build session reference
  const sessionReference: SessionReference = {
    sessionId,
    sessionPath,
  };
  
  // Extract research links if available
  if (adrMetadata.researchLinks) {
    const { comparisonReport, finalReport, prototypes } = adrMetadata.researchLinks;
    
    // Add comparison report path if exists
    if (comparisonReport) {
      sessionReference.comparisonReportPath = comparisonReport;
    }
    
    // Add final report path if exists
    if (finalReport) {
      sessionReference.finalReportPath = finalReport;
    }
    
    // Add prototype paths if exist
    if (prototypes && prototypes.length > 0) {
      sessionReference.prototypePaths = prototypes;
    }
  }
  
  // If no explicit links in metadata, use default paths
  if (!sessionReference.comparisonReportPath) {
    sessionReference.comparisonReportPath = `${sessionPath}/comparison-report.md`;
  }
  
  if (!sessionReference.finalReportPath) {
    sessionReference.finalReportPath = `${sessionPath}/final-report.md`;
  }
  
  return sessionReference;
}

/**
 * Validates that a session reference points to an existing session.
 * 
 * This function:
 * - Checks if session directory exists
 * - Checks if referenced files exist (comparison report, final report)
 * - Returns validation result with errors
 * 
 * @param reference - Session reference to validate
 * @param config - File system configuration (optional)
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const validation = await validateSessionReference(sessionRef);
 * if (!validation.valid) {
 *   console.warn('Session reference issues:', validation.errors);
 * }
 * ```
 */
export async function validateSessionReference(
  reference: SessionReference,
  config: FileSystemConfig = DEFAULT_CONFIG
): Promise<SessionReferenceValidation> {
  const errors: string[] = [];
  
  // Construct absolute session path
  const absoluteSessionPath = path.join(config.rootDir, reference.sessionPath);
  
  // Check if session directory exists
  try {
    const stats = await fs.stat(absoluteSessionPath);
    if (!stats.isDirectory()) {
      errors.push(`Session path exists but is not a directory: ${reference.sessionPath}`);
    }
  } catch (error) {
    errors.push(`Session directory does not exist: ${reference.sessionPath}`);
  }
  
  // Check if comparison report exists (if specified)
  if (reference.comparisonReportPath) {
    const absoluteComparisonPath = path.join(config.rootDir, reference.comparisonReportPath);
    try {
      await fs.access(absoluteComparisonPath);
    } catch (error) {
      errors.push(`Comparison report not found: ${reference.comparisonReportPath}`);
    }
  }
  
  // Check if final report exists (if specified)
  if (reference.finalReportPath) {
    const absoluteFinalPath = path.join(config.rootDir, reference.finalReportPath);
    try {
      await fs.access(absoluteFinalPath);
    } catch (error) {
      errors.push(`Final report not found: ${reference.finalReportPath}`);
    }
  }
  
  // Check if prototypes exist (if specified)
  if (reference.prototypePaths && reference.prototypePaths.length > 0) {
    for (const prototypePath of reference.prototypePaths) {
      const absolutePrototypePath = path.join(config.rootDir, prototypePath);
      try {
        await fs.access(absolutePrototypePath);
      } catch (error) {
        errors.push(`Prototype not found: ${prototypePath}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a session reference section for a wiki page.
 * 
 * This function creates a markdown section that links back to:
 * - The research session directory
 * - The comparison report
 * - The final report
 * - Prototypes (if any)
 * 
 * Uses relative paths from wiki/ to .kiro/research/
 * Formats consistently with wiki conventions
 * 
 * @param reference - Session reference information
 * @returns Markdown section
 * 
 * @example
 * ```typescript
 * const sessionRef = extractSessionReference(metadata);
 * const markdown = generateSessionReferenceSection(sessionRef);
 * // Returns formatted markdown with links to research artifacts
 * ```
 */
export function generateSessionReferenceSection(
  reference: SessionReference
): string {
  const lines: string[] = [];
  
  // Add section heading
  lines.push('## Research Context');
  lines.push('');
  
  // Add session directory link
  // Use relative path from wiki/ to .kiro/research/
  const relativeSessionPath = `../${reference.sessionPath}`;
  lines.push(`**Research Session**: [\`${reference.sessionPath}\`](${relativeSessionPath})`);
  lines.push('');
  
  // Add research artifacts section if any exist
  const hasArtifacts = 
    reference.comparisonReportPath || 
    reference.finalReportPath || 
    (reference.prototypePaths && reference.prototypePaths.length > 0);
  
  if (hasArtifacts) {
    lines.push('**Research Artifacts**:');
    
    // Add comparison report link
    if (reference.comparisonReportPath) {
      const relativeComparisonPath = `../${reference.comparisonReportPath}`;
      lines.push(`- [Comparison Report](${relativeComparisonPath})`);
    }
    
    // Add final report link
    if (reference.finalReportPath) {
      const relativeFinalPath = `../${reference.finalReportPath}`;
      lines.push(`- [Final Report](${relativeFinalPath})`);
    }
    
    // Add prototype links
    if (reference.prototypePaths && reference.prototypePaths.length > 0) {
      if (reference.prototypePaths.length === 1) {
        const relativePrototypePath = `../${reference.prototypePaths[0]}`;
        lines.push(`- [Prototype](${relativePrototypePath})`);
      } else {
        lines.push('- Prototypes:');
        for (let i = 0; i < reference.prototypePaths.length; i++) {
          const prototypePath = reference.prototypePaths[i];
          const relativePrototypePath = `../${prototypePath}`;
          const prototypeName = path.basename(prototypePath);
          lines.push(`  - [${prototypeName}](${relativePrototypePath})`);
        }
      }
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}
