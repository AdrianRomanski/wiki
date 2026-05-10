/**
 * Markdown utilities for the LLM Wiki Second Brain system.
 * 
 * This module provides functions for:
 * - Parsing markdown content into hierarchical sections
 * - Extracting [[WikiLink]] references from content
 * - Generating properly formatted markdown
 * - Supporting Obsidian-compatible markdown syntax
 * 
 * Requirements: 6.1, 13.1
 */

import { Section } from './models';

/**
 * Parses markdown content into hierarchical sections.
 * 
 * Sections are identified by markdown headings (# through ######).
 * Subsections are nested based on heading level hierarchy.
 * 
 * @param content - The markdown content to parse
 * @returns Array of top-level sections with nested subsections
 * 
 * @example
 * ```typescript
 * const content = `
 * # Introduction
 * Some intro text
 * 
 * ## Background
 * Background info
 * 
 * # Main Content
 * Main text
 * `;
 * const sections = parseMarkdownSections(content);
 * // Returns 2 top-level sections, first has 1 subsection
 * ```
 */
export function parseMarkdownSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  const sectionStack: { section: Section; level: number }[] = [];
  
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save accumulated content to the current section
      if (sectionStack.length > 0) {
        sectionStack[sectionStack.length - 1].section.content = currentContent.join('\n').trim();
        currentContent = [];
      }
      
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      
      const newSection: Section = {
        heading,
        level,
        content: '',
        subsections: []
      };
      
      // Pop sections from stack that are at same or deeper level
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
        sectionStack.pop();
      }
      
      // Add as subsection to parent, or as top-level section
      if (sectionStack.length > 0) {
        sectionStack[sectionStack.length - 1].section.subsections.push(newSection);
      } else {
        sections.push(newSection);
      }
      
      // Push new section onto stack
      sectionStack.push({ section: newSection, level });
    } else {
      // Accumulate content lines
      currentContent.push(line);
    }
  }
  
  // Save final accumulated content
  if (sectionStack.length > 0) {
    sectionStack[sectionStack.length - 1].section.content = currentContent.join('\n').trim();
  }
  
  return sections;
}

/**
 * Extracts all [[WikiLink]] references from markdown content.
 * 
 * Supports both simple links [[Page Title]] and links with display text [[Page Title|Display]].
 * Also supports section links [[Page Title#Section]].
 * 
 * @param content - The markdown content to search
 * @returns Array of unique wiki link targets (without brackets)
 * 
 * @example
 * ```typescript
 * const content = "See [[Entity Name]] and [[Concept|concept page]] for details.";
 * const links = extractWikiLinks(content);
 * // Returns: ['Entity Name', 'Concept']
 * ```
 */
export function extractWikiLinks(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
  const links: Set<string> = new Set();
  
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const linkTarget = match[1].trim();
    links.add(linkTarget);
  }
  
  return Array.from(links);
}

/**
 * Generates a wiki link in [[WikiLink]] syntax.
 * 
 * @param target - The target page title
 * @param displayText - Optional custom display text
 * @param section - Optional section anchor
 * @returns Formatted wiki link
 * 
 * @example
 * ```typescript
 * generateWikiLink('Entity Name');
 * // Returns: '[[Entity Name]]'
 * 
 * generateWikiLink('Entity Name', 'custom text');
 * // Returns: '[[Entity Name|custom text]]'
 * 
 * generateWikiLink('Entity Name', undefined, 'Properties');
 * // Returns: '[[Entity Name#Properties]]'
 * ```
 */
export function generateWikiLink(
  target: string,
  displayText?: string,
  section?: string
): string {
  let link = `[[${target}`;
  
  if (section) {
    link += `#${section}`;
  }
  
  if (displayText) {
    link += `|${displayText}`;
  }
  
  link += ']]';
  
  return link;
}

/**
 * Generates a markdown heading at the specified level.
 * 
 * @param text - The heading text
 * @param level - The heading level (1-6)
 * @returns Formatted markdown heading
 * 
 * @example
 * ```typescript
 * generateHeading('Introduction', 1);
 * // Returns: '# Introduction'
 * 
 * generateHeading('Subsection', 3);
 * // Returns: '### Subsection'
 * ```
 */
export function generateHeading(text: string, level: number): string {
  const clampedLevel = Math.max(1, Math.min(6, level));
  return `${'#'.repeat(clampedLevel)} ${text}`;
}

/**
 * Generates a markdown list (bulleted or numbered).
 * 
 * @param items - Array of list items
 * @param ordered - Whether to create a numbered list (default: false for bullets)
 * @param indent - Indentation level for nested lists (default: 0)
 * @returns Formatted markdown list
 * 
 * @example
 * ```typescript
 * generateList(['Item 1', 'Item 2', 'Item 3']);
 * // Returns:
 * // - Item 1
 * // - Item 2
 * // - Item 3
 * 
 * generateList(['First', 'Second', 'Third'], true);
 * // Returns:
 * // 1. First
 * // 2. Second
 * // 3. Third
 * ```
 */
export function generateList(
  items: string[],
  ordered: boolean = false,
  indent: number = 0
): string {
  const indentation = '  '.repeat(indent);
  
  return items
    .map((item, index) => {
      const marker = ordered ? `${index + 1}.` : '-';
      return `${indentation}${marker} ${item}`;
    })
    .join('\n');
}

/**
 * Generates a markdown code block with optional language specification.
 * 
 * @param code - The code content
 * @param language - Optional language identifier for syntax highlighting
 * @returns Formatted markdown code block
 * 
 * @example
 * ```typescript
 * generateCodeBlock('const x = 42;', 'typescript');
 * // Returns:
 * // ```typescript
 * // const x = 42;
 * // ```
 * ```
 */
export function generateCodeBlock(code: string, language?: string): string {
  const lang = language || '';
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

/**
 * Generates a markdown blockquote.
 * 
 * @param text - The text to quote
 * @returns Formatted markdown blockquote
 * 
 * @example
 * ```typescript
 * generateBlockquote('This is a quote.');
 * // Returns: '> This is a quote.'
 * ```
 */
export function generateBlockquote(text: string): string {
  return text
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');
}

/**
 * Generates a markdown table from headers and rows.
 * 
 * @param headers - Array of column headers
 * @param rows - Array of row data (each row is an array of cell values)
 * @returns Formatted markdown table
 * 
 * @example
 * ```typescript
 * generateTable(
 *   ['Name', 'Age'],
 *   [['Alice', '30'], ['Bob', '25']]
 * );
 * // Returns:
 * // | Name | Age |
 * // |------|-----|
 * // | Alice | 30 |
 * // | Bob | 25 |
 * ```
 */
export function generateTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `|${headers.map(() => '------').join('|')}|`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

/**
 * Validates that markdown content uses standard syntax compatible with Obsidian.
 * 
 * Checks for:
 * - Valid heading syntax (# through ######)
 * - Valid wiki link syntax ([[...]])
 * - Valid list syntax (- or 1.)
 * - Valid code block syntax (```)
 * 
 * @param content - The markdown content to validate
 * @returns Object with validation result and any issues found
 * 
 * @example
 * ```typescript
 * const result = validateMarkdownSyntax('# Valid\n\n[[Link]]');
 * // Returns: { valid: true, issues: [] }
 * 
 * const result2 = validateMarkdownSyntax('####### Invalid heading');
 * // Returns: { valid: false, issues: ['Invalid heading level: 7'] }
 * ```
 */
export function validateMarkdownSyntax(content: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for invalid heading levels (more than 6 #)
    const headingMatch = line.match(/^(#{7,})\s/);
    if (headingMatch) {
      issues.push(`Line ${lineNum}: Invalid heading level: ${headingMatch[1].length}`);
    }
    
    // Check for malformed wiki links (unclosed brackets)
    const unclosedLink = line.match(/\[\[[^\]]*$/);
    if (unclosedLink) {
      issues.push(`Line ${lineNum}: Unclosed wiki link`);
    }
    
    // Check for mismatched code block markers
    const codeBlockMarkers = line.match(/```/g);
    if (codeBlockMarkers && codeBlockMarkers.length > 1) {
      issues.push(`Line ${lineNum}: Multiple code block markers on same line`);
    }
  }
  
  // Check for unclosed code blocks
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    issues.push('Unclosed code block detected');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Escapes special markdown characters in text.
 * 
 * Useful when you want to display literal characters that would otherwise
 * be interpreted as markdown syntax.
 * 
 * @param text - The text to escape
 * @returns Text with markdown special characters escaped
 * 
 * @example
 * ```typescript
 * escapeMarkdown('Use * for emphasis');
 * // Returns: 'Use \\* for emphasis'
 * ```
 */
export function escapeMarkdown(text: string): string {
  const specialChars = /([\\`*_{}[\]()#+\-.!|])/g;
  return text.replace(specialChars, '\\$1');
}

/**
 * Converts hierarchical sections back into markdown content.
 * 
 * @param sections - Array of sections to convert
 * @returns Formatted markdown content
 * 
 * @example
 * ```typescript
 * const sections: Section[] = [
 *   { heading: 'Title', level: 1, content: 'Content', subsections: [] }
 * ];
 * const markdown = sectionsToMarkdown(sections);
 * // Returns: '# Title\n\nContent'
 * ```
 */
export function sectionsToMarkdown(sections: Section[]): string {
  const parts: string[] = [];
  
  function processSections(secs: Section[]) {
    for (const section of secs) {
      parts.push(generateHeading(section.heading, section.level));
      
      if (section.content) {
        parts.push('');
        parts.push(section.content);
      }
      
      if (section.subsections.length > 0) {
        parts.push('');
        processSections(section.subsections);
      }
    }
  }
  
  processSections(sections);
  
  return parts.join('\n');
}
