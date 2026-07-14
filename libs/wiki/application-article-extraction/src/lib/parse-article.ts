/**
 * Article parser for the Content_Extractor subsystem
 * Feature: article-research-session
 * Requirements: 3.1, 3.2, 3.6
 *
 * Parses raw markdown content (from raw-article.md) into a structured
 * ArticleContent representation containing: title, author, date, body,
 * code blocks, and outbound hyperlinks.
 *
 * Pure function — no file I/O in this module.
 */

import matter from 'gray-matter';
import type { ArticleContent, CodeBlock } from '@wiki/domain-research-session';

/**
 * Error thrown when the article content is empty or cannot be parsed.
 * Requirement 3.6: report failure and halt without writing article-content.json.
 */
export class ArticleParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArticleParseError';
  }
}

/**
 * Error thrown when no title can be determined from the content.
 * Requirement 3.2: prompt user for title when no H1 and no frontmatter title.
 * The orchestration layer should catch this and prompt the user.
 */
export class TitleRequiredError extends Error {
  /** The partially parsed content (without title) for reuse after user provides title */
  public readonly partialContent: Omit<ArticleContent, 'title'>;

  constructor(partialContent: Omit<ArticleContent, 'title'>) {
    super(
      'Article title cannot be determined: no H1 heading and no frontmatter title field found. Please provide a title.'
    );
    this.name = 'TitleRequiredError';
    this.partialContent = partialContent;
  }
}

/**
 * Extracts all fenced code blocks from markdown content.
 * Matches triple-backtick fenced blocks with optional language annotations.
 *
 * @param content - The markdown content to extract code blocks from
 * @returns Array of CodeBlock objects with language and content
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  // Match fenced code blocks: ```language\ncontent\n```
  const codeBlockRegex = /^```(\w*)\s*\n([\s\S]*?)^```\s*$/gm;

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || undefined;
    const blockContent = match[2];
    // Remove trailing newline from content if present
    codeBlocks.push({
      language,
      content: blockContent.endsWith('\n')
        ? blockContent.slice(0, -1)
        : blockContent,
    });
  }

  return codeBlocks;
}

/**
 * Extracts outbound hyperlinks from markdown content.
 * Matches [text](url) patterns but NOT ![alt](src) image patterns.
 * Requirement 3.1: anchor href values only, not image src URLs.
 *
 * @param content - The markdown content to extract links from
 * @returns Array of unique href URL strings
 */
export function extractLinks(content: string): string[] {
  const links: string[] = [];
  // Match [text](url) but not ![alt](url)
  // Negative lookbehind for ! to exclude images
  const linkRegex = /(?<!!)\[(?:[^\]]*)\]\(([^)]+)\)/g;

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1].trim();
    if (href && !links.includes(href)) {
      links.push(href);
    }
  }

  return links;
}

/**
 * Extracts the first H1 heading from markdown content.
 *
 * @param content - The markdown content (after frontmatter removal)
 * @returns The H1 title text, or undefined if no H1 found
 */
export function extractH1Title(content: string): string | undefined {
  // Match # Title at the start of a line
  const h1Regex = /^#\s+(.+)$/m;
  const match = h1Regex.exec(content);
  return match ? match[1].trim() : undefined;
}

/**
 * Parses raw article markdown content into a structured ArticleContent.
 *
 * The parser:
 * 1. Checks if content is empty → throws ArticleParseError
 * 2. Parses frontmatter (if present) using gray-matter
 * 3. Extracts title: first try frontmatter `title`, then look for first H1
 * 4. Extracts author from frontmatter `author` field
 * 5. Extracts date from frontmatter `date` field
 * 6. Extracts all fenced code blocks with language annotations
 * 7. Extracts outbound hyperlinks (not image src)
 * 8. Body is the content after frontmatter removal
 * 9. candidateEntities and candidateConcepts are empty arrays (populated by identifyCandidates)
 *
 * @param rawContent - The raw markdown content from raw-article.md
 * @returns Structured ArticleContent
 * @throws ArticleParseError if content is empty or unparseable
 * @throws TitleRequiredError if no title can be determined (no H1, no frontmatter title)
 */
export function parseArticle(rawContent: string): ArticleContent {
  // Requirement 3.6: empty content → report failure and halt
  if (!rawContent || rawContent.trim().length === 0) {
    throw new ArticleParseError(
      'Article content is empty. Cannot parse an empty document.'
    );
  }

  // Parse frontmatter using gray-matter
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(rawContent);
  } catch (error) {
    throw new ArticleParseError(
      `Failed to parse article content: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const { data: frontmatter, content: bodyContent } = parsed;

  // Extract body text (content after frontmatter)
  const body = bodyContent.trim();

  // Requirement 3.6: if body is empty after frontmatter removal and no meaningful content
  if (body.length === 0 && Object.keys(frontmatter).length === 0) {
    throw new ArticleParseError(
      'Article content is empty after parsing. No body text or frontmatter found.'
    );
  }

  // Extract code blocks from the body
  const codeBlocks = extractCodeBlocks(bodyContent);

  // Extract outbound hyperlinks (not images)
  const links = extractLinks(bodyContent);

  // Extract author from frontmatter
  const author = frontmatter['author']
    ? String(frontmatter['author'])
    : undefined;

  // Extract date from frontmatter
  const date = frontmatter['date']
    ? normalizeDate(frontmatter['date'])
    : undefined;

  // Extract title: frontmatter title takes priority, then H1
  const frontmatterTitle = frontmatter['title']
    ? String(frontmatter['title']).trim()
    : undefined;
  const h1Title = extractH1Title(bodyContent);
  const title = frontmatterTitle || h1Title;

  // Requirement 3.2: no title found → throw TitleRequiredError
  if (!title) {
    const partialContent: Omit<ArticleContent, 'title'> = {
      author,
      date,
      body,
      codeBlocks,
      links,
      candidateEntities: [],
      candidateConcepts: [],
    };
    throw new TitleRequiredError(partialContent);
  }

  return {
    title,
    author,
    date,
    body,
    codeBlocks,
    links,
    candidateEntities: [],
    candidateConcepts: [],
  };
}

/**
 * Normalizes a date value from frontmatter to ISO string format.
 * Handles Date objects, strings, and numbers.
 *
 * @param dateValue - The raw date value from frontmatter
 * @returns ISO date string (YYYY-MM-DD) or the string representation
 */
function normalizeDate(dateValue: unknown): string {
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  if (typeof dateValue === 'string') {
    // Try to parse as date to normalize format
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return dateValue;
  }
  if (typeof dateValue === 'number') {
    return new Date(dateValue).toISOString().split('T')[0];
  }
  return String(dateValue);
}
