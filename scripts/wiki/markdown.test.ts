/**
 * Unit tests for markdown utilities.
 * 
 * Tests cover:
 * - Parsing markdown into sections
 * - Extracting wiki links
 * - Generating markdown elements
 * - Validating markdown syntax
 * - Converting sections back to markdown
 */

import { describe, it, expect } from 'vitest';
import {
  parseMarkdownSections,
  extractWikiLinks,
  generateWikiLink,
  generateHeading,
  generateList,
  generateCodeBlock,
  generateBlockquote,
  generateTable,
  validateMarkdownSyntax,
  escapeMarkdown,
  sectionsToMarkdown
} from './markdown';

describe('parseMarkdownSections', () => {
  it('should parse simple flat sections', () => {
    const content = `# Section 1
Content 1

# Section 2
Content 2`;

    const sections = parseMarkdownSections(content);
    
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Section 1');
    expect(sections[0].level).toBe(1);
    expect(sections[0].content).toBe('Content 1');
    expect(sections[0].subsections).toHaveLength(0);
    
    expect(sections[1].heading).toBe('Section 2');
    expect(sections[1].level).toBe(1);
    expect(sections[1].content).toBe('Content 2');
  });

  it('should parse nested sections', () => {
    const content = `# Main Section
Main content

## Subsection 1
Sub content 1

## Subsection 2
Sub content 2

# Another Main
More content`;

    const sections = parseMarkdownSections(content);
    
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Main Section');
    expect(sections[0].subsections).toHaveLength(2);
    expect(sections[0].subsections[0].heading).toBe('Subsection 1');
    expect(sections[0].subsections[1].heading).toBe('Subsection 2');
    
    expect(sections[1].heading).toBe('Another Main');
    expect(sections[1].subsections).toHaveLength(0);
  });

  it('should handle deeply nested sections', () => {
    const content = `# Level 1
Content 1

## Level 2
Content 2

### Level 3
Content 3

#### Level 4
Content 4`;

    const sections = parseMarkdownSections(content);
    
    expect(sections).toHaveLength(1);
    expect(sections[0].level).toBe(1);
    expect(sections[0].subsections).toHaveLength(1);
    expect(sections[0].subsections[0].level).toBe(2);
    expect(sections[0].subsections[0].subsections).toHaveLength(1);
    expect(sections[0].subsections[0].subsections[0].level).toBe(3);
  });

  it('should handle empty content', () => {
    const sections = parseMarkdownSections('');
    expect(sections).toHaveLength(0);
  });

  it('should handle content without headings', () => {
    const content = 'Just some text\nwithout headings';
    const sections = parseMarkdownSections(content);
    expect(sections).toHaveLength(0);
  });

  it('should trim whitespace from content', () => {
    const content = `# Section

  Content with spaces  

`;
    const sections = parseMarkdownSections(content);
    expect(sections[0].content).toBe('Content with spaces');
  });
});

describe('extractWikiLinks', () => {
  it('should extract simple wiki links', () => {
    const content = 'See [[Entity Name]] and [[Concept Page]] for details.';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(2);
    expect(links).toContain('Entity Name');
    expect(links).toContain('Concept Page');
  });

  it('should extract links with display text', () => {
    const content = 'Check [[Entity Name|this entity]] for more.';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(1);
    expect(links[0]).toBe('Entity Name');
  });

  it('should extract links with section anchors', () => {
    const content = 'See [[Page Title#Section Name]] for details.';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(1);
    expect(links[0]).toBe('Page Title');
  });

  it('should handle multiple links on same line', () => {
    const content = '[[Link1]] and [[Link2]] and [[Link3]]';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(3);
  });

  it('should deduplicate repeated links', () => {
    const content = '[[Same Link]] appears twice: [[Same Link]]';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(1);
    expect(links[0]).toBe('Same Link');
  });

  it('should return empty array when no links found', () => {
    const content = 'No wiki links here';
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(0);
  });

  it('should handle links across multiple lines', () => {
    const content = `First [[Link One]]
Second line with [[Link Two]]
Third [[Link Three]]`;
    const links = extractWikiLinks(content);
    
    expect(links).toHaveLength(3);
  });

  it('should trim whitespace from link targets', () => {
    const content = '[[ Spaced Link ]]';
    const links = extractWikiLinks(content);
    
    expect(links[0]).toBe('Spaced Link');
  });
});

describe('generateWikiLink', () => {
  it('should generate simple wiki link', () => {
    const link = generateWikiLink('Entity Name');
    expect(link).toBe('[[Entity Name]]');
  });

  it('should generate link with display text', () => {
    const link = generateWikiLink('Entity Name', 'custom text');
    expect(link).toBe('[[Entity Name|custom text]]');
  });

  it('should generate link with section anchor', () => {
    const link = generateWikiLink('Entity Name', undefined, 'Properties');
    expect(link).toBe('[[Entity Name#Properties]]');
  });

  it('should generate link with both display text and section', () => {
    const link = generateWikiLink('Entity Name', 'see properties', 'Properties');
    expect(link).toBe('[[Entity Name#Properties|see properties]]');
  });
});

describe('generateHeading', () => {
  it('should generate headings at all levels', () => {
    expect(generateHeading('Title', 1)).toBe('# Title');
    expect(generateHeading('Title', 2)).toBe('## Title');
    expect(generateHeading('Title', 3)).toBe('### Title');
    expect(generateHeading('Title', 4)).toBe('#### Title');
    expect(generateHeading('Title', 5)).toBe('##### Title');
    expect(generateHeading('Title', 6)).toBe('###### Title');
  });

  it('should clamp level to valid range', () => {
    expect(generateHeading('Title', 0)).toBe('# Title');
    expect(generateHeading('Title', 7)).toBe('###### Title');
    expect(generateHeading('Title', 100)).toBe('###### Title');
  });
});

describe('generateList', () => {
  it('should generate bulleted list', () => {
    const list = generateList(['Item 1', 'Item 2', 'Item 3']);
    expect(list).toBe('- Item 1\n- Item 2\n- Item 3');
  });

  it('should generate numbered list', () => {
    const list = generateList(['First', 'Second', 'Third'], true);
    expect(list).toBe('1. First\n2. Second\n3. Third');
  });

  it('should handle indented lists', () => {
    const list = generateList(['Nested 1', 'Nested 2'], false, 1);
    expect(list).toBe('  - Nested 1\n  - Nested 2');
  });

  it('should handle empty array', () => {
    const list = generateList([]);
    expect(list).toBe('');
  });
});

describe('generateCodeBlock', () => {
  it('should generate code block with language', () => {
    const code = generateCodeBlock('const x = 42;', 'typescript');
    expect(code).toBe('```typescript\nconst x = 42;\n```');
  });

  it('should generate code block without language', () => {
    const code = generateCodeBlock('plain text');
    expect(code).toBe('```\nplain text\n```');
  });

  it('should handle multi-line code', () => {
    const code = generateCodeBlock('line 1\nline 2\nline 3', 'javascript');
    expect(code).toBe('```javascript\nline 1\nline 2\nline 3\n```');
  });
});

describe('generateBlockquote', () => {
  it('should generate single-line blockquote', () => {
    const quote = generateBlockquote('This is a quote.');
    expect(quote).toBe('> This is a quote.');
  });

  it('should generate multi-line blockquote', () => {
    const quote = generateBlockquote('Line 1\nLine 2\nLine 3');
    expect(quote).toBe('> Line 1\n> Line 2\n> Line 3');
  });
});

describe('generateTable', () => {
  it('should generate simple table', () => {
    const table = generateTable(
      ['Name', 'Age'],
      [['Alice', '30'], ['Bob', '25']]
    );
    
    expect(table).toBe(
      '| Name | Age |\n' +
      '|------|------|\n' +
      '| Alice | 30 |\n' +
      '| Bob | 25 |'
    );
  });

  it('should handle single row', () => {
    const table = generateTable(['Col1', 'Col2'], [['Val1', 'Val2']]);
    
    expect(table).toContain('| Col1 | Col2 |');
    expect(table).toContain('| Val1 | Val2 |');
  });

  it('should handle empty rows', () => {
    const table = generateTable(['Header'], []);
    
    expect(table).toBe('| Header |\n|------|\n');
  });
});

describe('validateMarkdownSyntax', () => {
  it('should validate correct markdown', () => {
    const content = `# Valid Heading

Some content with [[Wiki Link]].

- List item
- Another item

\`\`\`typescript
code here
\`\`\``;

    const result = validateMarkdownSyntax(content);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect invalid heading levels', () => {
    const content = '####### Too many hashes';
    const result = validateMarkdownSyntax(content);
    
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain('Invalid heading level: 7');
  });

  it('should detect unclosed wiki links', () => {
    const content = 'This has an [[unclosed link';
    const result = validateMarkdownSyntax(content);
    
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.includes('Unclosed wiki link'))).toBe(true);
  });

  it('should detect unclosed code blocks', () => {
    const content = '```typescript\ncode without closing';
    const result = validateMarkdownSyntax(content);
    
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.includes('Unclosed code block'))).toBe(true);
  });

  it('should detect multiple code block markers on same line', () => {
    const content = '``` ``` invalid';
    const result = validateMarkdownSyntax(content);
    
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.includes('Multiple code block markers'))).toBe(true);
  });

  it('should validate empty content', () => {
    const result = validateMarkdownSyntax('');
    expect(result.valid).toBe(true);
  });
});

describe('escapeMarkdown', () => {
  it('should escape special characters', () => {
    expect(escapeMarkdown('*bold*')).toBe('\\*bold\\*');
    expect(escapeMarkdown('_italic_')).toBe('\\_italic\\_');
    expect(escapeMarkdown('[link]')).toBe('\\[link\\]');
    expect(escapeMarkdown('# heading')).toBe('\\# heading');
  });

  it('should escape multiple special characters', () => {
    const text = 'Use * for emphasis and # for headings';
    const escaped = escapeMarkdown(text);
    expect(escaped).toBe('Use \\* for emphasis and \\# for headings');
  });

  it('should handle text without special characters', () => {
    const text = 'Plain text';
    expect(escapeMarkdown(text)).toBe('Plain text');
  });
});

describe('sectionsToMarkdown', () => {
  it('should convert simple sections to markdown', () => {
    const sections = [
      { heading: 'Title', level: 1, content: 'Content here', subsections: [] }
    ];
    
    const markdown = sectionsToMarkdown(sections);
    expect(markdown).toBe('# Title\n\nContent here');
  });

  it('should convert nested sections to markdown', () => {
    const sections = [
      {
        heading: 'Main',
        level: 1,
        content: 'Main content',
        subsections: [
          { heading: 'Sub', level: 2, content: 'Sub content', subsections: [] }
        ]
      }
    ];
    
    const markdown = sectionsToMarkdown(sections);
    expect(markdown).toContain('# Main');
    expect(markdown).toContain('## Sub');
    expect(markdown).toContain('Main content');
    expect(markdown).toContain('Sub content');
  });

  it('should handle sections without content', () => {
    const sections = [
      { heading: 'Empty', level: 1, content: '', subsections: [] }
    ];
    
    const markdown = sectionsToMarkdown(sections);
    expect(markdown).toBe('# Empty');
  });

  it('should handle empty sections array', () => {
    const markdown = sectionsToMarkdown([]);
    expect(markdown).toBe('');
  });

  it('should round-trip parse and generate', () => {
    const original = `# Section 1
Content 1

## Subsection
Sub content

# Section 2
Content 2`;

    const sections = parseMarkdownSections(original);
    const regenerated = sectionsToMarkdown(sections);
    
    // Parse both to compare structure (whitespace may differ)
    const originalSections = parseMarkdownSections(original);
    const regeneratedSections = parseMarkdownSections(regenerated);
    
    expect(regeneratedSections).toEqual(originalSections);
  });
});
