/**
 * Wiki page generators for the LLM Wiki Second Brain system.
 * 
 * This module provides functions to generate structured wiki pages:
 * - Entity pages: Describe specific things (libraries, tools, components, APIs)
 * - Concept pages: Explain ideas, patterns, and principles
 * - Source summaries: Distill key information from raw sources
 * 
 * All generators produce pages with:
 * - Valid YAML frontmatter
 * - Structured content sections appropriate to page type
 * - Cross-references using [[WikiLink]] syntax
 * - Proper naming conventions
 * 
 * Requirements: 4.5, 4.6, 4.7
 */

import { generateFrontmatter, createFrontmatter, WikiPageFrontmatter } from './frontmatter.js';
import { generateHeading, generateList, generateWikiLink } from './markdown.js';
import { generateFilename } from './naming.js';

/**
 * Options for generating an entity page.
 */
export interface EntityPageOptions {
  /** Entity name (will be used as title) */
  name: string;
  
  /** Definition of the entity */
  definition: string;
  
  /** Key properties and characteristics */
  properties?: string[];
  
  /** Related entities and concepts */
  relationships?: {
    /** Target page title */
    target: string;
    /** Relationship description (e.g., "Related to", "Used in", "Implements") */
    description: string;
  }[];
  
  /** Code examples or demonstrations */
  examples?: string[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** References to source summaries */
  sources?: string[];
  
  /** Creation date (defaults to today) */
  created?: string;
}

/**
 * Options for generating a concept page.
 */
export interface ConceptPageOptions {
  /** Concept name (will be used as title) */
  name: string;
  
  /** Explanation of the concept */
  explanation: string;
  
  /** Where and how the concept is applied */
  applications?: string[];
  
  /** Related concepts */
  relatedConcepts?: string[];
  
  /** Examples and demonstrations */
  examples?: string[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** References to source summaries */
  sources?: string[];
  
  /** Creation date (defaults to today) */
  created?: string;
}

/**
 * Options for generating a source summary page.
 */
export interface SourceSummaryOptions {
  /** Source title (will be used as title) */
  title: string;
  
  /** Author name */
  author?: string;
  
  /** Publication date (YYYY-MM-DD) */
  date?: string;
  
  /** Source URL */
  url?: string;
  
  /** Source type */
  sourceType?: 'article' | 'paper' | 'code' | 'note';
  
  /** Path to raw source file */
  rawSourcePath?: string;
  
  /** Key points from the source */
  keyPoints: string[];
  
  /** Important insights and takeaways */
  insights?: string;
  
  /** Relevant entities mentioned */
  relevantEntities?: string[];
  
  /** Relevant concepts discussed */
  relevantConcepts?: string[];
  
  /** Notable quotes from the source */
  quotes?: string[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Creation date (defaults to today) */
  created?: string;
}

/**
 * Result of generating a wiki page.
 */
export interface GeneratedPage {
  /** The complete markdown content with frontmatter */
  content: string;
  
  /** The suggested filename following naming conventions */
  filename: string;
  
  /** The frontmatter metadata */
  frontmatter: WikiPageFrontmatter;
}

/**
 * Generates an entity page with definition, properties, relationships, and examples.
 * 
 * Entity pages describe specific things: people, libraries, tools, components, APIs, or concrete objects.
 * 
 * @param options - Entity page configuration
 * @returns Generated page with content, filename, and frontmatter
 * 
 * @example
 * ```typescript
 * const page = generateEntityPage({
 *   name: 'Angular CDK',
 *   definition: 'The Angular Component Dev Kit (CDK) is a set of behavior primitives for building UI components.',
 *   properties: ['Provides accessibility utilities', 'Includes layout helpers'],
 *   relationships: [
 *     { target: 'Angular Material', description: 'Used in' },
 *     { target: 'Accessibility', description: 'Implements' }
 *   ],
 *   tags: ['angular', 'accessibility', 'component-library']
 * });
 * 
 * // page.filename: 'angular-cdk.md'
 * // page.content: Full markdown with frontmatter
 * ```
 */
export function generateEntityPage(options: EntityPageOptions): GeneratedPage {
  const {
    name,
    definition,
    properties = [],
    relationships = [],
    examples = [],
    tags = [],
    sources = [],
    created,
  } = options;
  
  // Create frontmatter
  const frontmatter = createFrontmatter({
    title: name,
    type: 'entity',
    tags,
    sources: sources.length > 0 ? sources : undefined,
    created,
  });
  
  // Generate filename
  const filename = generateFilename(name, 'entity');
  
  // Build content sections
  const sections: string[] = [];
  
  // Title
  sections.push(generateHeading(name, 1));
  sections.push('');
  
  // Definition section
  sections.push(generateHeading('Definition', 2));
  sections.push(definition);
  sections.push('');
  
  // Properties section
  if (properties.length > 0) {
    sections.push(generateHeading('Properties', 2));
    sections.push(generateList(properties));
    sections.push('');
  }
  
  // Relationships section
  if (relationships.length > 0) {
    sections.push(generateHeading('Relationships', 2));
    const relationshipItems = relationships.map(rel => 
      `${rel.description} ${generateWikiLink(rel.target)}`
    );
    sections.push(generateList(relationshipItems));
    sections.push('');
  }
  
  // Examples section
  if (examples.length > 0) {
    sections.push(generateHeading('Examples', 2));
    for (const example of examples) {
      sections.push(example);
      sections.push('');
    }
  }
  
  // References section (if sources provided)
  if (sources.length > 0) {
    sections.push(generateHeading('References', 2));
    const sourceLinks = sources.map(source => generateWikiLink(source));
    sections.push(generateList(sourceLinks));
    sections.push('');
  }
  
  const bodyContent = sections.join('\n').trim();
  
  // Generate complete markdown with frontmatter
  const content = generateFrontmatter(frontmatter, bodyContent);
  
  return {
    content,
    filename,
    frontmatter,
  };
}

/**
 * Generates a concept page with explanation, applications, related concepts, and examples.
 * 
 * Concept pages explain ideas, patterns, principles, or abstract notions.
 * 
 * @param options - Concept page configuration
 * @returns Generated page with content, filename, and frontmatter
 * 
 * @example
 * ```typescript
 * const page = generateConceptPage({
 *   name: 'Progressive Enhancement',
 *   explanation: 'Progressive enhancement is a design philosophy that provides a baseline experience to all users...',
 *   applications: [
 *     'Building accessible web applications',
 *     'Ensuring functionality without JavaScript'
 *   ],
 *   relatedConcepts: ['Graceful Degradation', 'Accessibility'],
 *   tags: ['web-development', 'accessibility', 'design-pattern']
 * });
 * 
 * // page.filename: 'progressive-enhancement.md'
 * ```
 */
export function generateConceptPage(options: ConceptPageOptions): GeneratedPage {
  const {
    name,
    explanation,
    applications = [],
    relatedConcepts = [],
    examples = [],
    tags = [],
    sources = [],
    created,
  } = options;
  
  // Create frontmatter
  const frontmatter = createFrontmatter({
    title: name,
    type: 'concept',
    tags,
    sources: sources.length > 0 ? sources : undefined,
    created,
  });
  
  // Generate filename
  const filename = generateFilename(name, 'concept');
  
  // Build content sections
  const sections: string[] = [];
  
  // Title
  sections.push(generateHeading(name, 1));
  sections.push('');
  
  // Explanation section
  sections.push(generateHeading('Explanation', 2));
  sections.push(explanation);
  sections.push('');
  
  // Applications section
  if (applications.length > 0) {
    sections.push(generateHeading('Applications', 2));
    sections.push(generateList(applications));
    sections.push('');
  }
  
  // Related Concepts section
  if (relatedConcepts.length > 0) {
    sections.push(generateHeading('Related Concepts', 2));
    const conceptLinks = relatedConcepts.map(concept => generateWikiLink(concept));
    sections.push(generateList(conceptLinks));
    sections.push('');
  }
  
  // Examples section
  if (examples.length > 0) {
    sections.push(generateHeading('Examples', 2));
    for (const example of examples) {
      sections.push(example);
      sections.push('');
    }
  }
  
  // References section (if sources provided)
  if (sources.length > 0) {
    sections.push(generateHeading('References', 2));
    const sourceLinks = sources.map(source => generateWikiLink(source));
    sections.push(generateList(sourceLinks));
    sections.push('');
  }
  
  const bodyContent = sections.join('\n').trim();
  
  // Generate complete markdown with frontmatter
  const content = generateFrontmatter(frontmatter, bodyContent);
  
  return {
    content,
    filename,
    frontmatter,
  };
}

/**
 * Generates a source summary page with key points, insights, and metadata.
 * 
 * Source summaries distill key information from raw source documents.
 * 
 * @param options - Source summary configuration
 * @returns Generated page with content, filename, and frontmatter
 * 
 * @example
 * ```typescript
 * const page = generateSourceSummaryPage({
 *   title: 'Angular ARIA Guide',
 *   author: 'Angular Team',
 *   date: '2024-05-10',
 *   url: 'https://angular.dev/guide/accessibility',
 *   sourceType: 'article',
 *   keyPoints: [
 *     'Angular provides built-in accessibility features',
 *     'Use semantic HTML elements',
 *     'Test with screen readers'
 *   ],
 *   insights: 'The guide emphasizes the importance of semantic HTML...',
 *   relevantEntities: ['Angular CDK', 'ARIA'],
 *   tags: ['angular', 'accessibility', 'guide']
 * });
 * 
 * // page.filename: 'angular-aria-guide-2024-05-10.md'
 * ```
 */
export function generateSourceSummaryPage(options: SourceSummaryOptions): GeneratedPage {
  const {
    title,
    author,
    date,
    url,
    sourceType,
    rawSourcePath,
    keyPoints,
    insights,
    relevantEntities = [],
    relevantConcepts = [],
    quotes = [],
    tags = [],
    created,
  } = options;
  
  // Create frontmatter with source-specific fields
  const frontmatter = createFrontmatter({
    title,
    type: 'source',
    tags,
    author,
    date,
    url,
    created,
  });
  
  // Generate filename (includes date)
  const filename = generateFilename(title, 'source', date ? new Date(date) : undefined);
  
  // Build content sections
  const sections: string[] = [];
  
  // Title
  sections.push(generateHeading(title, 1));
  sections.push('');
  
  // Metadata section
  sections.push(generateHeading('Metadata', 2));
  const metadata: string[] = [];
  if (author) metadata.push(`**Author**: ${author}`);
  if (date) metadata.push(`**Date**: ${date}`);
  if (url) metadata.push(`**URL**: [link](${url})`);
  if (sourceType) metadata.push(`**Type**: ${sourceType}`);
  if (rawSourcePath) metadata.push(`**Raw Source**: \`${rawSourcePath}\``);
  sections.push(metadata.join('\n'));
  sections.push('');
  
  // Key Points section
  sections.push(generateHeading('Key Points', 2));
  sections.push(generateList(keyPoints));
  sections.push('');
  
  // Insights section
  if (insights) {
    sections.push(generateHeading('Insights', 2));
    sections.push(insights);
    sections.push('');
  }
  
  // Relevant Entities section
  if (relevantEntities.length > 0) {
    sections.push(generateHeading('Relevant Entities', 2));
    const entityLinks = relevantEntities.map(entity => generateWikiLink(entity));
    sections.push(generateList(entityLinks));
    sections.push('');
  }
  
  // Relevant Concepts section
  if (relevantConcepts.length > 0) {
    sections.push(generateHeading('Relevant Concepts', 2));
    const conceptLinks = relevantConcepts.map(concept => generateWikiLink(concept));
    sections.push(generateList(conceptLinks));
    sections.push('');
  }
  
  // Quotes section
  if (quotes.length > 0) {
    sections.push(generateHeading('Quotes', 2));
    for (const quote of quotes) {
      sections.push(`> ${quote}`);
      sections.push('');
    }
  }
  
  const bodyContent = sections.join('\n').trim();
  
  // Generate complete markdown with frontmatter
  const content = generateFrontmatter(frontmatter, bodyContent);
  
  return {
    content,
    filename,
    frontmatter,
  };
}
