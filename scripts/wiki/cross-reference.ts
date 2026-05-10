/**
 * Cross-reference detection and linking for the LLM Wiki Second Brain system.
 * 
 * This module provides functions to:
 * - Detect entity and concept mentions in content
 * - Generate [[WikiLink]] syntax for cross-references
 * - Validate that link targets exist
 * - Support bidirectional linking
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { extractWikiLinks, generateWikiLink } from './markdown.js';
import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { parseFrontmatter } from './frontmatter.js';

/**
 * Represents a potential cross-reference found in content.
 */
export interface CrossReference {
  /** The text that was matched */
  matchedText: string;
  
  /** The target page title */
  targetTitle: string;
  
  /** The target page filename (if it exists) */
  targetFilename?: string;
  
  /** Whether the target page exists */
  exists: boolean;
  
  /** The position in the content where the match was found */
  position: number;
}

/**
 * Options for detecting cross-references.
 */
export interface DetectCrossReferencesOptions {
  /** The content to search for cross-references */
  content: string;
  
  /** List of existing wiki page titles to match against */
  existingPages: string[];
  
  /** Whether to perform case-insensitive matching (default: true) */
  caseInsensitive?: boolean;
  
  /** Minimum word length to consider for matching (default: 3) */
  minWordLength?: number;
}

/**
 * Result of validating wiki links.
 */
export interface LinkValidationResult {
  /** Links that point to existing pages */
  validLinks: string[];
  
  /** Links that point to non-existent pages */
  brokenLinks: string[];
  
  /** Total number of links checked */
  totalLinks: number;
}

/**
 * Detects potential cross-references in content by matching against existing page titles.
 * 
 * This function searches for mentions of existing wiki page titles in the content
 * and returns potential cross-reference opportunities.
 * 
 * @param options - Detection configuration
 * @returns Array of detected cross-references
 * 
 * @example
 * ```typescript
 * const content = "The Angular CDK provides accessibility utilities...";
 * const existingPages = ["Angular CDK", "Accessibility"];
 * 
 * const refs = detectCrossReferences({ content, existingPages });
 * // Returns: [
 * //   { matchedText: "Angular CDK", targetTitle: "Angular CDK", exists: true, ... },
 * //   { matchedText: "accessibility", targetTitle: "Accessibility", exists: true, ... }
 * // ]
 * ```
 */
export function detectCrossReferences(options: DetectCrossReferencesOptions): CrossReference[] {
  const {
    content,
    existingPages,
    caseInsensitive = true,
    minWordLength = 3,
  } = options;
  
  const references: CrossReference[] = [];
  const coveredRanges: Array<{ start: number; end: number }> = [];
  
  // Filter out short page titles
  const validPages = existingPages.filter(page => page.length >= minWordLength);
  
  // Sort by length (longest first) to match longer phrases before shorter ones
  const sortedPages = [...validPages].sort((a, b) => b.length - a.length);
  
  for (const pageTitle of sortedPages) {
    // Create regex pattern for the page title
    // Escape special regex characters
    const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create pattern with word boundaries
    // Use lookahead/lookbehind to handle special characters at boundaries
    const pattern = new RegExp(`(?<=^|\\s|[^\\w])${escapedTitle}(?=$|\\s|[^\\w])`, caseInsensitive ? 'gi' : 'g');
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const matchedText = match[0];
      const position = match.index;
      const endPosition = position + matchedText.length;
      
      // Skip if this position is already inside a [[WikiLink]]
      if (isInsideWikiLink(content, position)) {
        continue;
      }
      
      // Skip if this range overlaps with an already matched range
      const overlaps = coveredRanges.some(range => 
        (position >= range.start && position < range.end) ||
        (endPosition > range.start && endPosition <= range.end) ||
        (position <= range.start && endPosition >= range.end)
      );
      
      if (overlaps) {
        continue;
      }
      
      // Add this range to covered ranges
      coveredRanges.push({ start: position, end: endPosition });
      
      references.push({
        matchedText,
        targetTitle: pageTitle,
        exists: true,
        position,
      });
    }
  }
  
  // Sort by position
  return references.sort((a, b) => a.position - b.position);
}

/**
 * Checks if a position in content is inside an existing [[WikiLink]].
 * 
 * @param content - The content to check
 * @param position - The position to check
 * @returns True if the position is inside a wiki link
 */
function isInsideWikiLink(content: string, position: number): boolean {
  // Find the nearest [[ before this position
  let openBracket = content.lastIndexOf('[[', position);
  if (openBracket === -1) {
    return false;
  }
  
  // Find the nearest ]] after the opening bracket
  let closeBracket = content.indexOf(']]', openBracket);
  if (closeBracket === -1) {
    return false;
  }
  
  // Check if position is between the brackets
  return position >= openBracket && position <= closeBracket + 2;
}

/**
 * Inserts [[WikiLink]] syntax for detected cross-references in content.
 * 
 * This function takes content and a list of cross-references, and inserts
 * wiki link syntax around the matched text. It processes references in
 * reverse order to maintain correct positions.
 * 
 * @param content - The original content
 * @param references - The cross-references to link
 * @returns Content with wiki links inserted
 * 
 * @example
 * ```typescript
 * const content = "The Angular CDK provides utilities.";
 * const refs = [
 *   { matchedText: "Angular CDK", targetTitle: "Angular CDK", exists: true, position: 4 }
 * ];
 * 
 * const linked = insertCrossReferenceLinks(content, refs);
 * // Returns: "The [[Angular CDK]] provides utilities."
 * ```
 */
export function insertCrossReferenceLinks(
  content: string,
  references: CrossReference[]
): string {
  // Sort references by position in reverse order
  // This ensures we don't mess up positions when inserting links
  const sortedRefs = [...references].sort((a, b) => b.position - a.position);
  
  let result = content;
  
  for (const ref of sortedRefs) {
    const before = result.substring(0, ref.position);
    const after = result.substring(ref.position + ref.matchedText.length);
    const link = generateWikiLink(ref.targetTitle);
    
    result = before + link + after;
  }
  
  return result;
}

/**
 * Validates that all [[WikiLink]] references in content point to existing pages.
 * 
 * @param content - The content containing wiki links
 * @param existingPages - List of existing wiki page titles
 * @returns Validation result with valid and broken links
 * 
 * @example
 * ```typescript
 * const content = "See [[Angular CDK]] and [[NonExistent]] for details.";
 * const existingPages = ["Angular CDK"];
 * 
 * const result = validateWikiLinks(content, existingPages);
 * // Returns: {
 * //   validLinks: ["Angular CDK"],
 * //   brokenLinks: ["NonExistent"],
 * //   totalLinks: 2
 * // }
 * ```
 */
export function validateWikiLinks(
  content: string,
  existingPages: string[]
): LinkValidationResult {
  const links = extractWikiLinks(content);
  const existingSet = new Set(existingPages.map(p => p.toLowerCase()));
  
  const validLinks: string[] = [];
  const brokenLinks: string[] = [];
  
  for (const link of links) {
    if (existingSet.has(link.toLowerCase())) {
      validLinks.push(link);
    } else {
      brokenLinks.push(link);
    }
  }
  
  return {
    validLinks,
    brokenLinks,
    totalLinks: links.length,
  };
}

/**
 * Loads all existing wiki page titles from the wiki directory.
 * 
 * This function scans the wiki directory and extracts page titles from
 * frontmatter to build a list of existing pages for cross-reference detection.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of page titles
 * 
 * @example
 * ```typescript
 * const titles = await loadExistingPageTitles('wiki');
 * // Returns: ["Angular CDK", "Progressive Enhancement", ...]
 * ```
 */
export async function loadExistingPageTitles(wikiDir: string): Promise<string[]> {
  const titles: string[] = [];
  
  // Scan subdirectories (entities, concepts, sources)
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const { frontmatter } = parseFrontmatter(content);
          titles.push(frontmatter.title);
        } catch (error) {
          // Skip files that can't be parsed
          console.warn(`Warning: Could not parse ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
      console.warn(`Warning: Could not read directory ${subdirPath}:`, error);
    }
  }
  
  return titles;
}

/**
 * Finds backlinks for a given page by searching all wiki pages for references to it.
 * 
 * @param pageTitle - The title of the page to find backlinks for
 * @param wikiDir - Path to the wiki directory
 * @returns Array of page titles that link to the target page
 * 
 * @example
 * ```typescript
 * const backlinks = await findBacklinks("Angular CDK", "wiki");
 * // Returns: ["Angular Material", "Accessibility Utilities", ...]
 * ```
 */
export async function findBacklinks(pageTitle: string, wikiDir: string): Promise<string[]> {
  const backlinks: string[] = [];
  const subdirs = ['entities', 'concepts', 'sources'];
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const { frontmatter } = parseFrontmatter(content);
          
          // Skip the page itself
          if (frontmatter.title === pageTitle) {
            continue;
          }
          
          // Check if this page links to the target page
          const links = extractWikiLinks(content);
          if (links.some(link => link.toLowerCase() === pageTitle.toLowerCase())) {
            backlinks.push(frontmatter.title);
          }
        } catch (error) {
          // Skip files that can't be parsed
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
    }
  }
  
  return backlinks;
}

/**
 * Suggests bidirectional links by finding pages that should link back to each other.
 * 
 * This function analyzes cross-references and suggests adding backlinks where
 * page A links to page B but page B doesn't link back to page A.
 * 
 * @param wikiDir - Path to the wiki directory
 * @returns Array of suggested bidirectional links
 * 
 * @example
 * ```typescript
 * const suggestions = await suggestBidirectionalLinks("wiki");
 * // Returns: [
 * //   { from: "Angular Material", to: "Angular CDK", reason: "Angular CDK links to Angular Material" }
 * // ]
 * ```
 */
export async function suggestBidirectionalLinks(wikiDir: string): Promise<{
  from: string;
  to: string;
  reason: string;
}[]> {
  const suggestions: { from: string; to: string; reason: string }[] = [];
  const subdirs = ['entities', 'concepts', 'sources'];
  
  // Build a map of page titles to their outgoing links
  const pageLinks = new Map<string, string[]>();
  
  for (const subdir of subdirs) {
    const subdirPath = join(wikiDir, subdir);
    
    try {
      const files = await readdir(subdirPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) {
          continue;
        }
        
        const filePath = join(subdirPath, file);
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const { frontmatter } = parseFrontmatter(content);
          const links = extractWikiLinks(content);
          
          pageLinks.set(frontmatter.title, links);
        } catch (error) {
          // Skip files that can't be parsed
        }
      }
    } catch (error) {
      // Skip subdirectories that don't exist
    }
  }
  
  // Find missing bidirectional links
  for (const [pageTitle, outgoingLinks] of pageLinks.entries()) {
    for (const targetTitle of outgoingLinks) {
      const targetLinks = pageLinks.get(targetTitle);
      
      if (targetLinks && !targetLinks.some(link => link.toLowerCase() === pageTitle.toLowerCase())) {
        suggestions.push({
          from: targetTitle,
          to: pageTitle,
          reason: `${pageTitle} links to ${targetTitle}`,
        });
      }
    }
  }
  
  return suggestions;
}
