import { describe, it, expect } from 'vitest';
import { MarkdownAdapter } from './markdown-adapter';

describe('MarkdownAdapter', () => {
  let adapter: MarkdownAdapter;

  beforeEach(() => {
    adapter = new MarkdownAdapter();
  });

  describe('parseMarkdownSections', () => {
    it('should parse simple flat sections', () => {
      const content = `# Section 1
Content 1

# Section 2
Content 2`;

      const sections = adapter.parseMarkdownSections(content);
      
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

      const sections = adapter.parseMarkdownSections(content);
      
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

      const sections = adapter.parseMarkdownSections(content);
      
      expect(sections).toHaveLength(1);
      expect(sections[0].level).toBe(1);
      expect(sections[0].subsections).toHaveLength(1);
      expect(sections[0].subsections[0].level).toBe(2);
      expect(sections[0].subsections[0].subsections).toHaveLength(1);
      expect(sections[0].subsections[0].subsections[0].level).toBe(3);
    });

    it('should handle empty content', () => {
      const sections = adapter.parseMarkdownSections('');
      expect(sections).toHaveLength(0);
    });

    it('should handle content without headings', () => {
      const content = 'Just some text\nwithout headings';
      const sections = adapter.parseMarkdownSections(content);
      expect(sections).toHaveLength(0);
    });

    it('should trim whitespace from content', () => {
      const content = `# Section

  Content with spaces  

`;
      const sections = adapter.parseMarkdownSections(content);
      expect(sections[0].content).toBe('Content with spaces');
    });
  });

  describe('extractWikiLinks', () => {
    it('should extract simple wiki links', () => {
      const content = 'See [[Entity Name]] and [[Concept Page]] for details.';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(2);
      expect(links).toContain('Entity Name');
      expect(links).toContain('Concept Page');
    });

    it('should extract links with display text', () => {
      const content = 'Check [[Entity Name|this entity]] for more.';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(1);
      expect(links[0]).toBe('Entity Name');
    });

    it('should extract links with section anchors', () => {
      const content = 'See [[Page Title#Section Name]] for details.';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(1);
      expect(links[0]).toBe('Page Title');
    });

    it('should handle multiple links on same line', () => {
      const content = '[[Link1]] and [[Link2]] and [[Link3]]';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(3);
    });

    it('should deduplicate repeated links', () => {
      const content = '[[Same Link]] appears twice: [[Same Link]]';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(1);
      expect(links[0]).toBe('Same Link');
    });

    it('should return empty array when no links found', () => {
      const content = 'No wiki links here';
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(0);
    });

    it('should handle links across multiple lines', () => {
      const content = `First [[Link One]]
Second line with [[Link Two]]
Third [[Link Three]]`;
      const links = adapter.extractWikiLinks(content);
      
      expect(links).toHaveLength(3);
    });

    it('should trim whitespace from link targets', () => {
      const content = '[[ Spaced Link ]]';
      const links = adapter.extractWikiLinks(content);
      
      expect(links[0]).toBe('Spaced Link');
    });
  });

  describe('generateWikiLink', () => {
    it('should generate simple wiki link', () => {
      const link = adapter.generateWikiLink('Entity Name');
      expect(link).toBe('[[Entity Name]]');
    });

    it('should generate link with display text', () => {
      const link = adapter.generateWikiLink('Entity Name', 'custom text');
      expect(link).toBe('[[Entity Name|custom text]]');
    });

    it('should generate link with section anchor', () => {
      const link = adapter.generateWikiLink('Entity Name', undefined, 'Properties');
      expect(link).toBe('[[Entity Name#Properties]]');
    });

    it('should generate link with both display text and section', () => {
      const link = adapter.generateWikiLink('Entity Name', 'see properties', 'Properties');
      expect(link).toBe('[[Entity Name#Properties|see properties]]');
    });
  });

  describe('generateHeading', () => {
    it('should generate headings at all levels', () => {
      expect(adapter.generateHeading('Title', 1)).toBe('# Title');
      expect(adapter.generateHeading('Title', 2)).toBe('## Title');
      expect(adapter.generateHeading('Title', 3)).toBe('### Title');
      expect(adapter.generateHeading('Title', 4)).toBe('#### Title');
      expect(adapter.generateHeading('Title', 5)).toBe('##### Title');
      expect(adapter.generateHeading('Title', 6)).toBe('###### Title');
    });

    it('should clamp level to valid range', () => {
      expect(adapter.generateHeading('Title', 0)).toBe('# Title');
      expect(adapter.generateHeading('Title', 7)).toBe('###### Title');
      expect(adapter.generateHeading('Title', 100)).toBe('###### Title');
    });
  });

  describe('generateList', () => {
    it('should generate bulleted list', () => {
      const list = adapter.generateList(['Item 1', 'Item 2', 'Item 3']);
      expect(list).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should generate numbered list', () => {
      const list = adapter.generateList(['First', 'Second', 'Third'], true);
      expect(list).toBe('1. First\n2. Second\n3. Third');
    });

    it('should handle indented lists', () => {
      const list = adapter.generateList(['Nested 1', 'Nested 2'], false, 1);
      expect(list).toBe('  - Nested 1\n  - Nested 2');
    });

    it('should handle empty array', () => {
      const list = adapter.generateList([]);
      expect(list).toBe('');
    });
  });

  describe('generateCodeBlock', () => {
    it('should generate code block with language', () => {
      const code = adapter.generateCodeBlock('const x = 42;', 'typescript');
      expect(code).toBe('```typescript\nconst x = 42;\n```');
    });

    it('should generate code block without language', () => {
      const code = adapter.generateCodeBlock('plain text');
      expect(code).toBe('```\nplain text\n```');
    });

    it('should handle multi-line code', () => {
      const code = adapter.generateCodeBlock('line 1\nline 2\nline 3', 'javascript');
      expect(code).toBe('```javascript\nline 1\nline 2\nline 3\n```');
    });
  });

  describe('generateBlockquote', () => {
    it('should generate single-line blockquote', () => {
      const quote = adapter.generateBlockquote('This is a quote.');
      expect(quote).toBe('> This is a quote.');
    });

    it('should generate multi-line blockquote', () => {
      const quote = adapter.generateBlockquote('Line 1\nLine 2\nLine 3');
      expect(quote).toBe('> Line 1\n> Line 2\n> Line 3');
    });
  });

  describe('generateTable', () => {
    it('should generate simple table', () => {
      const table = adapter.generateTable(
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
      const table = adapter.generateTable(['Col1', 'Col2'], [['Val1', 'Val2']]);
      
      expect(table).toContain('| Col1 | Col2 |');
      expect(table).toContain('| Val1 | Val2 |');
    });

    it('should handle empty rows', () => {
      const table = adapter.generateTable(['Header'], []);
      
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

      const result = adapter.validateMarkdownSyntax(content);
      expect(result.valid).toBe(true);
    });

    it('should detect invalid heading levels', () => {
      const content = '####### Too many hashes';
      const result = adapter.validateMarkdownSyntax(content);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid heading level: 7');
    });

    it('should detect unclosed wiki links', () => {
      const content = 'This has an [[unclosed link';
      const result = adapter.validateMarkdownSyntax(content);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unclosed wiki link');
    });

    it('should detect unclosed code blocks', () => {
      const content = '```typescript\ncode without closing';
      const result = adapter.validateMarkdownSyntax(content);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unclosed code block');
    });

    it('should detect multiple code block markers on same line', () => {
      const content = '``` ``` invalid';
      const result = adapter.validateMarkdownSyntax(content);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Multiple code block markers');
    });

    it('should validate empty content', () => {
      const result = adapter.validateMarkdownSyntax('');
      expect(result.valid).toBe(true);
    });
  });

  describe('escapeMarkdown', () => {
    it('should escape special characters', () => {
      expect(adapter.escapeMarkdown('*bold*')).toBe('\\*bold\\*');
      expect(adapter.escapeMarkdown('_italic_')).toBe('\\_italic\\_');
      expect(adapter.escapeMarkdown('[link]')).toBe('\\[link\\]');
      expect(adapter.escapeMarkdown('# heading')).toBe('\\# heading');
    });

    it('should escape multiple special characters', () => {
      const text = 'Use * for emphasis and # for headings';
      const escaped = adapter.escapeMarkdown(text);
      expect(escaped).toBe('Use \\* for emphasis and \\# for headings');
    });

    it('should handle text without special characters', () => {
      const text = 'Plain text';
      expect(adapter.escapeMarkdown(text)).toBe('Plain text');
    });
  });

  describe('sectionsToMarkdown', () => {
    it('should convert simple sections to markdown', () => {
      const sections = [
        { heading: 'Title', level: 1, content: 'Content here', subsections: [] }
      ];
      
      const markdown = adapter.sectionsToMarkdown(sections);
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
      
      const markdown = adapter.sectionsToMarkdown(sections);
      expect(markdown).toContain('# Main');
      expect(markdown).toContain('## Sub');
      expect(markdown).toContain('Main content');
      expect(markdown).toContain('Sub content');
    });

    it('should handle sections without content', () => {
      const sections = [
        { heading: 'Empty', level: 1, content: '', subsections: [] }
      ];
      
      const markdown = adapter.sectionsToMarkdown(sections);
      expect(markdown).toBe('# Empty');
    });

    it('should handle empty sections array', () => {
      const markdown = adapter.sectionsToMarkdown([]);
      expect(markdown).toBe('');
    });

    it('should round-trip parse and generate', () => {
      const original = `# Section 1
Content 1

## Subsection
Sub content

# Section 2
Content 2`;

      const sections = adapter.parseMarkdownSections(original);
      const regenerated = adapter.sectionsToMarkdown(sections);
      
      const originalSections = adapter.parseMarkdownSections(original);
      const regeneratedSections = adapter.parseMarkdownSections(regenerated);
      
      expect(regeneratedSections).toEqual(originalSections);
    });
  });
});
