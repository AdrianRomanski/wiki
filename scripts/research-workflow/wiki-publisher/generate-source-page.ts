/**
 * Normalized source page generation utility
 * Feature: article-research-session
 * Requirements: 7.1, 7.2, 7.3
 *
 * Generates the full markdown content for a normalized source page
 * with YAML frontmatter and body sections following the WIKI_SCHEMA.md
 * source summary template.
 */

/**
 * Parameters for generating a normalized source page.
 */
export interface SourcePageParams {
  /** Article title (used as page title) */
  title: string;
  /** Article author (omitted from frontmatter when not available) */
  author?: string;
  /** Publication date in YYYY-MM-DD format (omitted from frontmatter when not available) */
  date?: string;
  /** Source URL beginning with http:// or https:// (omitted from frontmatter when not available) */
  url?: string;
  /** Tags array (must contain at least one element) */
  tags: string[];
  /** ISO 8601 date string for page creation (YYYY-MM-DD) */
  created: string;
  /** ISO 8601 date string for last update (YYYY-MM-DD) */
  updated: string;
  /** Key points extracted from the article (at least one required) */
  keyPoints: string[];
  /** Synthesized insights/takeaways (at least one required) */
  insights: string[];
  /** Entity names for WikiLink cross-references */
  entities: string[];
  /** Concept names for WikiLink cross-references */
  concepts: string[];
  /** Session directory path relative to workspace root */
  sessionDir: string;
  /** Author WikiLink target (author's full name for [[Author Name]] link) */
  authorWikiLink?: string;
  /** Publication source WikiLink target (domain for [[domain.name]] link) */
  publicationSourceWikiLink?: string;
}

/**
 * Generates a normalized source page with YAML frontmatter and body sections.
 *
 * @param params - The source page parameters
 * @returns The full markdown content string for the source page
 * @throws Error if tags array is empty
 * @throws Error if keyPoints array is empty
 * @throws Error if insights array is empty
 * @throws Error if title is empty or whitespace-only
 * @throws Error if created is not a valid YYYY-MM-DD date string
 * @throws Error if updated is not a valid YYYY-MM-DD date string
 */
export function generateSourcePage(params: SourcePageParams): string {
  validateParams(params);

  const frontmatter = buildFrontmatter(params);
  const body = buildBody(params);

  return `${frontmatter}\n\n${body}`;
}

function validateParams(params: SourcePageParams): void {
  if (!params.title || !params.title.trim()) {
    throw new Error('title must be a non-empty string');
  }

  if (!params.tags || params.tags.length === 0) {
    throw new Error('tags must contain at least one element');
  }

  if (!params.keyPoints || params.keyPoints.length === 0) {
    throw new Error('keyPoints must contain at least one element');
  }

  if (!params.insights || params.insights.length === 0) {
    throw new Error('insights must contain at least one element');
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!params.created || !datePattern.test(params.created)) {
    throw new Error('created must be a valid date in YYYY-MM-DD format');
  }

  if (!params.updated || !datePattern.test(params.updated)) {
    throw new Error('updated must be a valid date in YYYY-MM-DD format');
  }
}

function buildFrontmatter(params: SourcePageParams): string {
  const lines: string[] = ['---'];

  lines.push(`title: "${escapeYamlString(params.title)}"`);
  lines.push('type: source');

  if (params.author) {
    lines.push(`author: "${escapeYamlString(params.author)}"`);
  }

  if (params.date) {
    lines.push(`date: "${params.date}"`);
  }

  if (params.url) {
    lines.push(`url: ${params.url}`);
  }

  const tags = [...params.tags];

  if (params.authorWikiLink) {
    const authorTag = toKebabCase(params.authorWikiLink);
    if (authorTag && !tags.includes(authorTag)) {
      tags.push(authorTag);
    }
  }

  if (params.publicationSourceWikiLink) {
    const domainTag = domainToTag(params.publicationSourceWikiLink);
    if (domainTag && !tags.includes(domainTag)) {
      tags.push(domainTag);
    }
  }

  lines.push(`tags: [${tags.map(tag => tag).join(', ')}]`);
  lines.push(`created: "${params.created}"`);
  lines.push(`updated: "${params.updated}"`);

  lines.push('---');

  return lines.join('\n');
}

function buildBody(params: SourcePageParams): string {
  const sections: string[] = [];

  // Title heading
  sections.push(`# ${params.title}`);

  // Metadata section
  sections.push(buildMetadataSection(params));

  // Key Points section
  sections.push(buildKeyPointsSection(params.keyPoints));

  // Insights section
  sections.push(buildInsightsSection(params.insights));

  // Relevant Entities section
  sections.push(buildEntitiesSection(params.entities));

  // Relevant Concepts section
  sections.push(buildConceptsSection(params.concepts));

  // Session Artifacts section
  sections.push(buildSessionArtifactsSection(params.sessionDir));

  return sections.join('\n\n') + '\n';
}

function buildMetadataSection(params: SourcePageParams): string {
  const lines: string[] = ['## Metadata'];

  if (params.authorWikiLink) {
    lines.push(`- **Author:** [[${params.authorWikiLink}]]`);
  } else if (params.author) {
    lines.push(`- **Author:** ${params.author}`);
  } else {
    lines.push('- **Author:** Unknown');
  }

  if (params.date) {
    lines.push(`- **Date:** ${params.date}`);
  }

  if (params.url) {
    lines.push(`- **URL:** [${params.url}](${params.url})`);
  }

  if (params.publicationSourceWikiLink) {
    lines.push(`- **Publication Source:** [[${params.publicationSourceWikiLink}]]`);
  }

  lines.push('- **Type:** article');
  lines.push(`- **Session artifacts:** \`${params.sessionDir}\``);

  return lines.join('\n');
}

function buildKeyPointsSection(keyPoints: string[]): string {
  const lines: string[] = ['## Key Points'];

  for (const point of keyPoints) {
    lines.push(`- ${point}`);
  }

  return lines.join('\n');
}

function buildInsightsSection(insights: string[]): string {
  const lines: string[] = ['## Insights'];

  for (const insight of insights) {
    lines.push(insight);
  }

  return lines.join('\n\n');
}

function buildEntitiesSection(entities: string[]): string {
  const lines: string[] = ['## Relevant Entities'];

  if (entities.length === 0) {
    lines.push('*No entities identified.*');
  } else {
    for (const entity of entities) {
      lines.push(`- [[${entity}]]`);
    }
  }

  return lines.join('\n');
}

function buildConceptsSection(concepts: string[]): string {
  const lines: string[] = ['## Relevant Concepts'];

  if (concepts.length === 0) {
    lines.push('*No concepts identified.*');
  } else {
    for (const concept of concepts) {
      lines.push(`- [[${concept}]]`);
    }
  }

  return lines.join('\n');
}

function buildSessionArtifactsSection(sessionDir: string): string {
  const lines: string[] = ['## Session Artifacts'];

  lines.push(`- Analysis: \`${sessionDir}/article-analysis.md\``);
  lines.push(`- Content: \`${sessionDir}/article-content.json\``);
  lines.push(`- Raw article: \`${sessionDir}/raw-article.md\``);
  lines.push(`- Session metadata: \`${sessionDir}/session.json\``);

  return lines.join('\n');
}

/**
 * Converts a name to kebab-case for use as a tag.
 * Lowercases, replaces spaces and consecutive non-alphanumeric characters
 * with a single hyphen, and removes leading/trailing hyphens.
 */
function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a domain name to a tag by replacing dots with hyphens.
 * e.g., "nx.dev" → "nx-dev", "push-based.io" → "push-based-io"
 */
function domainToTag(domain: string): string {
  return domain.replace(/\./g, '-');
}

/**
 * Escapes special characters in a string for safe YAML inclusion.
 */
function escapeYamlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
