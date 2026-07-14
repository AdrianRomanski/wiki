/**
 * SYNTHESIZE step logic for article research sessions
 * Feature: article-research-session
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 *
 * Handles:
 * - Generating findings-summary.md from article-analysis.md and session.json
 * - Structuring with required sections: metadata, key insights, entities,
 *   concepts, recommended wiki pages, session artifacts
 * - Including path, type, and rationale for each recommended wiki page
 * - Updating findings-summary.md with user-requested changes
 * - Transitioning to FINALIZE on user approval
 *
 * All file I/O is routed through FileSystemPort (Requirement 1.2, 5.6).
 */

import type { FileSystemPort } from '@wiki/application-ports';
import type { SessionJson } from '@wiki/domain-research-session';
import { generateSessionId } from '@wiki/domain-research-session';
import { transitionState } from './state-transitions';

/**
 * Parsed representation of article-analysis.md content.
 */
interface ParsedAnalysis {
  title: string;
  author: string;
  date: string;
  sourceUrl: string;
  summary: string;
  entities: Array<{ name: string; description: string }>;
  concepts: Array<{ name: string; description: string }>;
  codeBlocks: Array<{ language: string; content: string }>;
}

/**
 * A recommended wiki page entry for the findings summary.
 */
interface RecommendedWikiPage {
  path: string;
  type: 'source' | 'entity' | 'concept';
  rationale: string;
}

/**
 * Generates findings-summary.md by transforming article-analysis.md and session.json.
 *
 * Requirement 5.1: Transform and restructure content from article-analysis.md
 * Requirement 5.2: Structure with sections in order: metadata, key insights,
 *   entities, concepts, recommended wiki pages, session artifacts
 * Requirement 5.3: List each recommended wiki page with path, type, and rationale
 * Requirement 5.4: Display full contents inline for user review
 *
 * @param fs - FileSystemPort used to read article-analysis.md/session.json and write findings-summary.md
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @returns The full markdown content of findings-summary.md
 */
export async function generateFindingsSummary(
  fs: FileSystemPort,
  sessionDir: string
): Promise<string> {
  // Read article-analysis.md
  const analysisContent = await fs.readFile(`${sessionDir}/article-analysis.md`);

  // Read session.json for metadata
  const sessionContent = await fs.readFile(`${sessionDir}/session.json`);
  const session: SessionJson = JSON.parse(sessionContent);

  // Parse the analysis content
  const parsed = parseAnalysisMarkdown(analysisContent);

  // Generate the findings summary markdown
  const markdown = buildFindingsSummaryMarkdown(parsed, session);

  // Write findings-summary.md to the session directory
  await fs.writeFile(`${sessionDir}/findings-summary.md`, markdown);

  return markdown;
}

/**
 * Updates findings-summary.md with new content (user-requested changes).
 *
 * Requirement 5.5: Apply user-requested changes and re-display
 *
 * @param fs - FileSystemPort used to write findings-summary.md
 * @param sessionDir - Path to the session directory, relative to the workspace root
 * @param updatedContent - The updated markdown content to write
 */
export async function updateFindingsSummary(
  fs: FileSystemPort,
  sessionDir: string,
  updatedContent: string
): Promise<void> {
  await fs.writeFile(`${sessionDir}/findings-summary.md`, updatedContent);
}

/**
 * Completes the SYNTHESIZE step by transitioning state to FINALIZE.
 *
 * Requirement 5.6: Block advancement until explicit user approval
 * Requirement 5.7: Transition to FINALIZE on approval
 *
 * @param fs - FileSystemPort used to read/write session.json
 * @param sessionDir - Path to the session directory, relative to the workspace root
 */
export async function completeSynthesizeStep(
  fs: FileSystemPort,
  sessionDir: string
): Promise<void> {
  const sessionJsonPath = `${sessionDir}/session.json`;
  const content = await fs.readFile(sessionJsonPath);
  const session: SessionJson = JSON.parse(content);

  // Transition state from SYNTHESIZE to FINALIZE
  const updatedSession = transitionState(session, 'FINALIZE');

  await fs.writeFile(sessionJsonPath, JSON.stringify(updatedSession, null, 2));
}

/**
 * Parses article-analysis.md into a structured representation.
 *
 * Extracts metadata, summary, entities, concepts, and code blocks
 * from the markdown content.
 *
 * @param markdown - The raw markdown content of article-analysis.md
 * @returns Parsed analysis data
 */
export function parseAnalysisMarkdown(markdown: string): ParsedAnalysis {
  const title = extractMetadataField(markdown, 'Title') || 'Untitled';
  const author = extractMetadataField(markdown, 'Author') || 'Unknown';
  const date = extractMetadataField(markdown, 'Date') || 'Unknown';
  const sourceUrl =
    extractMetadataField(markdown, 'Source URL') || 'Pasted text';

  const summary = extractSection(markdown, 'Summary');
  const entities = extractEntitiesOrConcepts(markdown, 'Identified Entities');
  const concepts = extractEntitiesOrConcepts(markdown, 'Identified Concepts');
  const codeBlocks = extractCodeBlocks(markdown);

  return {
    title,
    author,
    date,
    sourceUrl,
    summary,
    entities,
    concepts,
    codeBlocks,
  };
}

/**
 * Builds the full findings-summary.md markdown content.
 *
 * @param parsed - Parsed analysis data
 * @param session - The session.json data
 * @returns Complete markdown string for findings-summary.md
 */
export function buildFindingsSummaryMarkdown(
  parsed: ParsedAnalysis,
  session: SessionJson
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# Findings Summary: ${parsed.title}`);

  // Document Metadata section
  sections.push(buildDocumentMetadataSection(parsed, session));

  // Key Insights section
  sections.push(buildKeyInsightsSection(parsed));

  // Identified Entities section
  sections.push(buildEntitiesSection(parsed.entities));

  // Identified Concepts section
  sections.push(buildConceptsSection(parsed.concepts));

  // Recommended Wiki Pages section
  sections.push(
    buildRecommendedWikiPagesSection(parsed, session)
  );

  // Session Artifacts section
  sections.push(buildSessionArtifactsSection());

  return sections.join('\n\n') + '\n';
}

/**
 * Builds the Document Metadata section.
 */
function buildDocumentMetadataSection(
  parsed: ParsedAnalysis,
  session: SessionJson
): string {
  const researchDate = formatDate(new Date());
  const lines = ['## Document Metadata'];
  lines.push(`- **Article Title:** ${parsed.title}`);
  lines.push(`- **Author:** ${parsed.author}`);
  lines.push(`- **Date:** ${parsed.date}`);
  lines.push(`- **Source URL:** ${parsed.sourceUrl}`);
  lines.push(`- **Session Scope:** article`);
  lines.push(`- **Research Date:** ${researchDate}`);
  return lines.join('\n');
}

/**
 * Builds the Key Insights section from the analysis summary.
 */
function buildKeyInsightsSection(parsed: ParsedAnalysis): string {
  const lines = ['## Key Insights'];

  if (!parsed.summary || parsed.summary.trim() === 'No summary available.') {
    lines.push('- No key insights could be extracted from the article.');
    return lines.join('\n');
  }

  // Convert summary paragraphs into insight bullet points
  const paragraphs = parsed.summary
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    lines.push('- No key insights could be extracted from the article.');
  } else {
    for (const paragraph of paragraphs) {
      // Collapse multi-line paragraphs into single-line bullets
      const singleLine = paragraph.replace(/\n/g, ' ').trim();
      lines.push(`- ${singleLine}`);
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Identified Entities section.
 */
function buildEntitiesSection(
  entities: Array<{ name: string; description: string }>
): string {
  const lines = ['## Identified Entities'];

  if (entities.length === 0) {
    lines.push('');
    lines.push('No entities were identified in this article.');
  } else {
    lines.push('');
    for (const entity of entities) {
      lines.push(`- **${entity.name}** — ${entity.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Identified Concepts section.
 */
function buildConceptsSection(
  concepts: Array<{ name: string; description: string }>
): string {
  const lines = ['## Identified Concepts'];

  if (concepts.length === 0) {
    lines.push('');
    lines.push('No concepts were identified in this article.');
  } else {
    lines.push('');
    for (const concept of concepts) {
      lines.push(`- **${concept.name}** — ${concept.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Builds the Recommended Wiki Pages section with a table.
 *
 * Generates recommended wiki pages based on entities and concepts found,
 * plus a source page for the article itself.
 */
function buildRecommendedWikiPagesSection(
  parsed: ParsedAnalysis,
  session: SessionJson
): string {
  const lines = ['## Recommended Wiki Pages'];
  lines.push('');
  lines.push('| Path | Type | Rationale |');
  lines.push('|------|------|-----------|');

  const recommendations = generateRecommendedWikiPages(parsed, session);

  for (const rec of recommendations) {
    lines.push(`| ${rec.path} | ${rec.type} | ${rec.rationale} |`);
  }

  return lines.join('\n');
}

/**
 * Generates the list of recommended wiki pages based on analysis content.
 *
 * @param parsed - Parsed analysis data
 * @param session - Session metadata
 * @returns Array of recommended wiki page entries
 */
export function generateRecommendedWikiPages(
  parsed: ParsedAnalysis,
  session: SessionJson
): RecommendedWikiPage[] {
  const recommendations: RecommendedWikiPage[] = [];

  // Source page for the article itself
  const articleSlug = generateSlug(parsed.title);
  recommendations.push({
    path: `wiki/sources/${articleSlug}.md`,
    type: 'source',
    rationale: `Preserves the article "${parsed.title}" as a citable source in the wiki.`,
  });

  // Entity pages
  for (const entity of parsed.entities) {
    const slug = generateSlug(entity.name);
    recommendations.push({
      path: `wiki/entities/${slug}.md`,
      type: 'entity',
      rationale: `Documents ${entity.name} as a reusable knowledge base entry.`,
    });
  }

  // Concept pages
  for (const concept of parsed.concepts) {
    const slug = generateSlug(concept.name);
    recommendations.push({
      path: `wiki/concepts/${slug}.md`,
      type: 'concept',
      rationale: `Captures the concept of ${concept.name} for cross-referencing.`,
    });
  }

  return recommendations;
}

/**
 * Builds the Session Artifacts section.
 */
function buildSessionArtifactsSection(): string {
  const lines = ['## Session Artifacts'];
  lines.push('');
  lines.push('- `article-analysis.md`');
  lines.push('- `article-content.json`');
  lines.push('- `raw-article.md`');
  lines.push('- `session.json`');
  return lines.join('\n');
}

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Extracts a metadata field value from the analysis markdown.
 * Looks for patterns like `- **Title:** value`
 */
function extractMetadataField(
  markdown: string,
  fieldName: string
): string | undefined {
  const pattern = new RegExp(
    `^- \\*\\*${escapeRegex(fieldName)}:\\*\\*\\s*(.+)$`,
    'm'
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Extracts the content of a named section from markdown.
 * Returns the text between the section heading and the next heading of same or higher level.
 */
function extractSection(markdown: string, sectionName: string): string {
  // Find the section heading
  const headingPattern = new RegExp(
    `^## ${escapeRegex(sectionName)}\\s*$`,
    'm'
  );
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) return '';

  // Get content after the heading
  const startIdx = headingMatch.index + headingMatch[0].length;
  const rest = markdown.slice(startIdx);

  // Find the next heading (## or #)
  const nextHeadingMatch = rest.match(/\n(?=## |# )/);
  const content = nextHeadingMatch
    ? rest.slice(0, nextHeadingMatch.index)
    : rest;

  return content.trim();
}

/**
 * Extracts entities or concepts from a section with the format:
 * - **Name** — Description
 */
function extractEntitiesOrConcepts(
  markdown: string,
  sectionName: string
): Array<{ name: string; description: string }> {
  const sectionContent = extractSection(markdown, sectionName);
  if (!sectionContent) return [];

  const items: Array<{ name: string; description: string }> = [];
  const linePattern = /^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = linePattern.exec(sectionContent)) !== null) {
    items.push({
      name: match[1].trim(),
      description: match[2].trim(),
    });
  }

  return items;
}

/**
 * Extracts fenced code blocks from markdown.
 */
function extractCodeBlocks(
  markdown: string
): Array<{ language: string; content: string }> {
  const blocks: Array<{ language: string; content: string }> = [];
  const pattern = /^```(\w*)\n([\s\S]*?)^```$/gm;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || '',
      content: match[2].trimEnd(),
    });
  }

  return blocks;
}

/**
 * Generates a kebab-case slug from a name string.
 * Uses the same logic as generateSessionId but without the length constraint
 * being critical for wiki page paths.
 */
function generateSlug(name: string): string {
  try {
    return generateSessionId(name);
  } catch {
    // Fallback for edge cases where generateSessionId might throw
    return 'untitled';
  }
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formats a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
