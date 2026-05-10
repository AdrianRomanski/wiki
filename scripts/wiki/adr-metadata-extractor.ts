/**
 * ADR Metadata Extractor Module
 * 
 * Extracts research-specific metadata from Architecture Decision Records (ADRs).
 * Parses frontmatter, markdown sections, comparison matrices, and library mentions.
 */

import matter from 'gray-matter';

/**
 * Metadata extracted from an ADR.
 */
export interface ADRMetadata {
  /** ADR title */
  title: string;
  
  /** Decision date (YYYY-MM-DD) */
  date: string;
  
  /** Decision status (Accepted, Rejected, Superseded) */
  status: 'Accepted' | 'Rejected' | 'Superseded';
  
  /** Research session ID */
  sessionId: string;
  
  /** Context and problem statement */
  context: string;
  
  /** Decision drivers (priorities) */
  decisionDrivers: string[];
  
  /** Options that were considered */
  consideredOptions: string[];
  
  /** Chosen option */
  chosenOption: string;
  
  /** Rationale for the decision */
  rationale: string;
  
  /** Positive consequences */
  positiveConsequences: string[];
  
  /** Negative consequences */
  negativeConsequences: string[];
  
  /** Comparison matrices */
  comparisonMatrices?: {
    complexity?: ComparisonMatrix;
    modularity?: ComparisonMatrix;
    bundleSize?: ComparisonMatrix;
    tokenUsage?: ComparisonMatrix;
  };
  
  /** Libraries mentioned in the ADR */
  libraries: string[];
  
  /** Links to research artifacts */
  researchLinks?: {
    comparisonReport?: string;
    finalReport?: string;
    prototypes?: string[];
  };
  
  /** Optional fields from frontmatter */
  deciders?: string[];
  tags?: string[];
  supersedes?: string;
  supersededBy?: string;
}

/**
 * Represents a comparison matrix from an ADR.
 */
export interface ComparisonMatrix {
  /** Matrix title */
  title: string;
  
  /** Matrix headers */
  headers: string[];
  
  /** Matrix rows (library name -> values) */
  rows: Map<string, string[]>;
  
  /** Winner column (if present) */
  winner?: Map<string, string>;
}

/**
 * Error thrown when ADR parsing fails.
 */
export class ADRParseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ADRParseError';
  }
}

/**
 * Detects library names mentioned in ADR content.
 * 
 * Parses the "Considered Options" section and extracts library names
 * from numbered or bulleted lists.
 * 
 * @param content - ADR content
 * @returns Array of library names
 * 
 * @example
 * ```typescript
 * const content = `
 * ## Considered Options
 * 1. @angular/cdk/a11y
 * 2. focus-trap
 * 3. Custom solution
 * `;
 * const libraries = detectLibraries(content);
 * // Returns: ['@angular/cdk/a11y', 'focus-trap', 'Custom solution']
 * ```
 */
export function detectLibraries(content: string): string[] {
  const libraries: string[] = [];
  
  // Find the "Considered Options" section
  const consideredOptionsMatch = content.match(
    /##\s+Considered Options\s*\n([\s\S]*?)(?=\n##|\n#|$)/i
  );
  
  if (!consideredOptionsMatch) {
    return libraries;
  }
  
  const optionsSection = consideredOptionsMatch[1];
  
  // Match numbered lists: "1. Library Name" or "1) Library Name"
  const numberedListRegex = /^\s*\d+[\.)]\s+(.+)$/gm;
  let match;
  
  while ((match = numberedListRegex.exec(optionsSection)) !== null) {
    const libraryName = match[1].trim();
    if (libraryName) {
      libraries.push(libraryName);
    }
  }
  
  // If no numbered lists found, try bulleted lists: "- Library Name" or "* Library Name"
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

/**
 * Parses a comparison matrix table from markdown.
 * 
 * Extracts headers, rows, and optional winner column from markdown tables.
 * Handles various table formats and alignment.
 * 
 * @param tableMarkdown - Markdown table content
 * @param title - Matrix title (e.g., "Complexity Comparison")
 * @returns Parsed matrix
 * @throws {ADRParseError} If the table is malformed
 * 
 * @example
 * ```typescript
 * const table = `
 * | Criterion    | CDK  | focus-trap | Custom | Winner |
 * |--------------|------|------------|--------|--------|
 * | Complexity   | 3/10 | 6/10       | 8/10   | CDK    |
 * | Modularity   | 9/10 | 7/10       | 5/10   | CDK    |
 * `;
 * const matrix = parseComparisonMatrix(table, 'Comparison Summary');
 * ```
 */
export function parseComparisonMatrix(
  tableMarkdown: string,
  title: string = 'Comparison Matrix'
): ComparisonMatrix {
  // Split into lines and filter out empty lines
  const lines = tableMarkdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.startsWith('|'));
  
  if (lines.length < 2) {
    throw new ADRParseError(
      `Malformed comparison matrix: expected at least 2 lines (header + separator), got ${lines.length}`
    );
  }
  
  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
  
  if (headers.length < 2) {
    throw new ADRParseError(
      `Malformed comparison matrix: header must have at least 2 columns, got ${headers.length}`
    );
  }
  
  // Check if last column is "Winner"
  const hasWinnerColumn = headers[headers.length - 1].toLowerCase() === 'winner';
  
  // Skip separator line (line 1)
  // Parse data rows (lines 2+)
  const rows = new Map<string, string[]>();
  const winner = hasWinnerColumn ? new Map<string, string>() : undefined;
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    if (cells.length < 2) {
      // Skip malformed rows
      continue;
    }
    
    // First cell is the row label (e.g., library name or criterion)
    const rowLabel = cells[0];
    
    // Remaining cells are values (excluding winner column if present)
    const valueCount = hasWinnerColumn ? cells.length - 2 : cells.length - 1;
    const values = cells.slice(1, 1 + valueCount);
    
    rows.set(rowLabel, values);
    
    // Extract winner if present
    if (hasWinnerColumn && cells.length > valueCount + 1) {
      const winnerValue = cells[cells.length - 1];
      winner?.set(rowLabel, winnerValue);
    }
  }
  
  if (rows.size === 0) {
    throw new ADRParseError(
      'Malformed comparison matrix: no data rows found'
    );
  }
  
  return {
    title,
    headers,
    rows,
    winner,
  };
}

/**
 * Extracts a markdown section by heading.
 * 
 * @param content - Markdown content
 * @param heading - Section heading (without #)
 * @returns Section content, or empty string if not found
 */
function extractSection(content: string, heading: string): string {
  // Match heading at level 2 or 3
  const regex = new RegExp(
    `##?#?\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n#|$)`,
    'i'
  );
  
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extracts list items from a markdown section.
 * 
 * @param section - Section content
 * @returns Array of list items
 */
function extractListItems(section: string): string[] {
  const items: string[] = [];
  
  // Match numbered lists: "1. Item" or "1) Item"
  const numberedRegex = /^\s*\d+[\.)]\s+(.+)$/gm;
  let match;
  
  while ((match = numberedRegex.exec(section)) !== null) {
    items.push(match[1].trim());
  }
  
  // If no numbered lists, try bulleted lists: "- Item" or "* Item"
  if (items.length === 0) {
    const bulletedRegex = /^\s*[-*]\s+(.+)$/gm;
    
    while ((match = bulletedRegex.exec(section)) !== null) {
      items.push(match[1].trim());
    }
  }
  
  return items;
}

/**
 * Finds and parses all comparison matrices in the ADR.
 * 
 * @param content - ADR content
 * @returns Object with parsed matrices by type
 */
function findComparisonMatrices(content: string): {
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
  
  // Look for common comparison matrix patterns
  const matrixPatterns = [
    { key: 'complexity' as const, patterns: ['complexity', 'cognitive load'] },
    { key: 'modularity' as const, patterns: ['modularity', 'code organization'] },
    { key: 'bundleSize' as const, patterns: ['bundle', 'size', 'bundle impact'] },
    { key: 'tokenUsage' as const, patterns: ['token', 'ai assistance'] },
  ];
  
  for (const { key, patterns } of matrixPatterns) {
    for (const pattern of patterns) {
      // Find section with this pattern
      const sectionRegex = new RegExp(
        `##\\s+.*${pattern}.*\\n([\\s\\S]*?)(?=\\n##|\\n#|$)`,
        'i'
      );
      
      const match = content.match(sectionRegex);
      if (match) {
        const sectionContent = match[1];
        
        // Extract table from section
        const tableMatch = sectionContent.match(/(\|.+\|[\s\S]*?)(?=\n\n|$)/);
        if (tableMatch) {
          try {
            const title = match[0].split('\n')[0].replace(/^##\s+/, '').trim();
            matrices[key] = parseComparisonMatrix(tableMatch[1], title);
            break; // Found matrix for this key, move to next
          } catch (error) {
            // Skip malformed tables
            continue;
          }
        }
      }
    }
  }
  
  return matrices;
}

/**
 * Extracts metadata from an ADR document.
 * 
 * This function parses:
 * - YAML frontmatter
 * - Markdown sections (Context, Decision Drivers, etc.)
 * - Comparison matrices (tables)
 * - Library mentions
 * 
 * @param adrContent - The ADR markdown content
 * @returns Extracted metadata
 * @throws {ADRParseError} If the ADR format is invalid
 * 
 * @example
 * ```typescript
 * const adrContent = await fs.readFile('decision.adr.md', 'utf-8');
 * const metadata = await extractADRMetadata(adrContent);
 * console.log(metadata.title); // "Choose Focus Trap Library"
 * console.log(metadata.libraries); // ['@angular/cdk/a11y', 'focus-trap']
 * ```
 */
export async function extractADRMetadata(
  adrContent: string
): Promise<ADRMetadata> {
  try {
    // Parse frontmatter using gray-matter
    const parsed = matter(adrContent);
    const frontmatter = parsed.data;
    const content = parsed.content;
    
    // Validate required frontmatter fields
    if (!frontmatter.title || typeof frontmatter.title !== 'string') {
      throw new ADRParseError('Required field "title" is missing or invalid');
    }
    
    if (!frontmatter.date) {
      throw new ADRParseError('Required field "date" is missing');
    }
    
    // Convert date to string if it's a Date object
    let dateString: string;
    if (frontmatter.date instanceof Date) {
      dateString = frontmatter.date.toISOString().split('T')[0];
    } else {
      dateString = String(frontmatter.date);
    }
    
    if (!frontmatter.status || !['Accepted', 'Rejected', 'Superseded'].includes(frontmatter.status)) {
      throw new ADRParseError(
        'Required field "status" is missing or invalid (must be Accepted, Rejected, or Superseded)'
      );
    }
    
    if (!frontmatter.context || typeof frontmatter.context !== 'string') {
      throw new ADRParseError('Required field "context" is missing or invalid');
    }
    
    // Extract session ID from context (format: "Research Session [session-id]")
    const sessionIdMatch = frontmatter.context.match(/Research Session\s+(.+)/i);
    const sessionId = sessionIdMatch ? sessionIdMatch[1].trim() : frontmatter.context;
    
    // Extract markdown sections
    const contextSection = extractSection(content, 'Context and Problem Statement');
    const decisionDriversSection = extractSection(content, 'Decision Drivers');
    const consideredOptionsSection = extractSection(content, 'Considered Options');
    const decisionOutcomeSection = extractSection(content, 'Decision Outcome');
    const rationaleSection = extractSection(decisionOutcomeSection, 'Rationale');
    const positiveConsequencesSection = extractSection(decisionOutcomeSection, 'Positive Consequences');
    const negativeConsequencesSection = extractSection(decisionOutcomeSection, 'Negative Consequences');
    
    // Extract decision drivers as list
    const decisionDrivers = extractListItems(decisionDriversSection);
    
    // Extract considered options as list
    const consideredOptions = extractListItems(consideredOptionsSection);
    
    // Extract chosen option (look for "Chosen option:" or "**Chosen option**:")
    const chosenOptionMatch = decisionOutcomeSection.match(
      /\*\*Chosen option\*\*:\s*(.+?)(?=\n|$)/i
    );
    const chosenOption = chosenOptionMatch ? chosenOptionMatch[1].trim() : '';
    
    // Extract positive and negative consequences
    const positiveConsequences = extractListItems(positiveConsequencesSection);
    const negativeConsequences = extractListItems(negativeConsequencesSection);
    
    // Detect libraries from content
    const libraries = detectLibraries(content);
    
    // Find comparison matrices
    const comparisonMatrices = findComparisonMatrices(content);
    
    // Extract research links (if mentioned in content)
    const researchLinks: {
      comparisonReport?: string;
      finalReport?: string;
      prototypes?: string[];
    } = {};
    
    // Look for links to research artifacts
    const comparisonReportMatch = content.match(/\[comparison[- ]report\]\(([^)]+)\)/i);
    if (comparisonReportMatch) {
      researchLinks.comparisonReport = comparisonReportMatch[1];
    }
    
    const finalReportMatch = content.match(/\[final[- ]report\]\(([^)]+)\)/i);
    if (finalReportMatch) {
      researchLinks.finalReport = finalReportMatch[1];
    }
    
    // Look for prototype links
    const prototypeMatches = content.matchAll(/\[prototype[^\]]*\]\(([^)]+)\)/gi);
    const prototypes: string[] = [];
    for (const match of prototypeMatches) {
      prototypes.push(match[1]);
    }
    if (prototypes.length > 0) {
      researchLinks.prototypes = prototypes;
    }
    
    // Build metadata object
    const metadata: ADRMetadata = {
      title: frontmatter.title,
      date: dateString,
      status: frontmatter.status as 'Accepted' | 'Rejected' | 'Superseded',
      sessionId,
      context: contextSection || frontmatter.context,
      decisionDrivers,
      consideredOptions,
      chosenOption,
      rationale: rationaleSection,
      positiveConsequences,
      negativeConsequences,
      comparisonMatrices: Object.keys(comparisonMatrices).length > 0 ? comparisonMatrices : undefined,
      libraries,
      researchLinks: Object.keys(researchLinks).length > 0 ? researchLinks : undefined,
    };
    
    // Add optional frontmatter fields
    if (frontmatter.deciders && Array.isArray(frontmatter.deciders)) {
      metadata.deciders = frontmatter.deciders;
    }
    
    if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
      metadata.tags = frontmatter.tags;
    }
    
    if (frontmatter.supersedes && typeof frontmatter.supersedes === 'string') {
      metadata.supersedes = frontmatter.supersedes;
    }
    
    if (frontmatter.supersededBy && typeof frontmatter.supersededBy === 'string') {
      metadata.supersededBy = frontmatter.supersededBy;
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
