/**
 * Type definitions for the Article Research Session feature
 * Feature: article-research-session
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

// ── Union Types ─────────────────────────────────────────────────────────────

/**
 * Session state machine states for article research sessions.
 * Follows the EXPLORE → SYNTHESIZE → FINALIZE → FINALIZED flow.
 * PAUSED is a cross-cutting state applicable at any active step.
 */
export type SessionState =
  | 'EXPLORE'
  | 'SYNTHESIZE'
  | 'FINALIZE'
  | 'FINALIZED'
  | 'PAUSED';

/**
 * The type of article input provided by the user.
 * - "url": article content will be fetched from a URL
 * - "pasted-text": article content is provided directly as text
 */
export type ArticleInputType = 'url' | 'pasted-text';

// ── Core Interfaces ─────────────────────────────────────────────────────────

/**
 * The session.json schema for article research sessions.
 * Requirement 9.1: scope is always "article"
 * Requirement 9.2: articleInputType is "url" or "pasted-text"
 * Requirement 9.3: articleUrl present only when articleInputType is "url"
 * Requirement 9.4: articleTitle written when user confirms metadata
 * Requirement 9.5: articleTitle must be confirmed before leaving EXPLORE
 * Requirement 9.6: articleAuthor omitted if not extractable
 * Requirement 9.7: articleDate omitted if not extractable
 * Requirement 9.8: excludes library-specific fields
 */
export interface SessionJson {
  // ── Required at creation ──────────────────────────────────────────────────
  /** Kebab-case session identifier, max 80 characters */
  id: string;
  /** Human-readable research topic */
  topic: string;
  /** Current workflow state */
  state: SessionState;
  /** Always "article" for article research sessions */
  scope: 'article';
  /** ISO date the session was created (YYYY-MM-DD) */
  createdAt: string;

  // ── Article-specific fields ───────────────────────────────────────────────
  /** How the article was provided */
  articleInputType: ArticleInputType;
  /** Source URL (present only when articleInputType is "url") */
  articleUrl?: string;
  /** Confirmed article title (required before leaving EXPLORE) */
  articleTitle?: string;
  /** Article author (omitted if not extractable) */
  articleAuthor?: string;
  /** Article publication date in YYYY-MM-DD format (omitted if not extractable) */
  articleDate?: string;
  /** Publication domain extracted from articleUrl (e.g., "nx.dev"). Omitted for pasted-text sessions. */
  publicationSource?: string;

  // ── Pause fields (present only when PAUSED) ───────────────────────────────
  /** ISO date the session was paused (YYYY-MM-DD) */
  pausedAt?: string;
  /** The step to return to on resume */
  resumeFrom?: 'EXPLORE' | 'SYNTHESIZE' | 'FINALIZE';

  // ── Finalization fields (present only when FINALIZED) ─────────────────────
  /** ISO date the session was finalized (YYYY-MM-DD) */
  finalizedAt?: string;
  /** Paths of all created wiki pages, relative to workspace root */
  wikiPages?: string[];
}

/**
 * Structured representation of parsed article content.
 * Produced by the Content_Extractor from raw-article.md.
 */
export interface ArticleContent {
  /** Article title extracted from H1 or frontmatter */
  title: string;
  /** Author name (if extractable from content) */
  author?: string;
  /** Publication date in ISO format (if extractable from content) */
  date?: string;
  /** Full article body text */
  body: string;
  /** All fenced code blocks from the article */
  codeBlocks: CodeBlock[];
  /** Outbound hyperlinks (anchor href values only, not image src) */
  links: string[];
  /** Named libraries, tools, APIs, or components identified in the body */
  candidateEntities: string[];
  /** Named patterns, principles, or techniques identified in the body */
  candidateConcepts: string[];
}

/**
 * A fenced code block extracted from the article.
 */
export interface CodeBlock {
  /** Programming language annotation (if specified) */
  language?: string;
  /** The code content */
  content: string;
}

/**
 * Result of an HTTP fetch operation for article retrieval.
 */
export interface FetchResult {
  /** Whether the fetch was successful */
  success: boolean;
  /** The fetched content (present on success) */
  content?: string;
  /** HTTP status code (present when a response was received) */
  statusCode?: number;
  /** Human-readable error reason (present on failure) */
  errorReason?: string;
}

/**
 * Metadata about an article, used during analysis generation.
 */
export interface ArticleMetadata {
  /** Confirmed article title */
  title: string;
  /** Article author (if available) */
  author?: string;
  /** Publication date in ISO format (if available) */
  date?: string;
  /** Source URL (if article was fetched from a URL) */
  sourceUrl?: string;
  /** How the article was provided */
  inputType: ArticleInputType;
}

/**
 * Result of running wiki manifest/index generation scripts.
 */
export interface ScriptResult {
  /** Whether the script executed successfully */
  success: boolean;
  /** Name of the script that failed (present on failure) */
  failedScript?: string;
  /** Error message from the failed script (present on failure) */
  errorMessage?: string;
}

/**
 * A reference that failed to be added to a target wiki page.
 */
export interface FailedReference {
  /** Path of the target page that failed to receive the reference */
  targetPage: string;
  /** The source page that was being referenced */
  sourcePage: string;
  /** Reason the reference insertion failed */
  reason: string;
}

/**
 * A candidate entity identified from article content for wiki publication.
 */
export interface EntityCandidate {
  /** Name of the entity (library, tool, API, or component) */
  name: string;
  /** Brief description of the entity (1-3 sentences) */
  description: string;
  /** Proposed wiki page path */
  proposedPath: string;
}

/**
 * A candidate concept identified from article content for wiki publication.
 */
export interface ConceptCandidate {
  /** Name of the concept (pattern, principle, or technique) */
  name: string;
  /** Brief description of the concept (1-3 sentences) */
  description: string;
  /** Proposed wiki page path */
  proposedPath: string;
}
