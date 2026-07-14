/**
 * Unit tests for article parser
 * Feature: article-research-session
 * Requirements: 3.1, 3.2, 3.6
 */

import { describe, it, expect } from 'vitest';
import {
  parseArticle,
  extractCodeBlocks,
  extractLinks,
  extractH1Title,
  ArticleParseError,
  TitleRequiredError,
} from './parse-article';

describe('parseArticle', () => {
  describe('title extraction', () => {
    it('extracts title from frontmatter title field', () => {
      const content = `---
title: My Article Title
---

Some body text here.`;
      const result = parseArticle(content);
      expect(result.title).toBe('My Article Title');
    });

    it('extracts title from H1 heading when no frontmatter title', () => {
      const content = `# My H1 Title

Some body text here.`;
      const result = parseArticle(content);
      expect(result.title).toBe('My H1 Title');
    });

    it('prefers frontmatter title over H1 heading', () => {
      const content = `---
title: Frontmatter Title
---

# H1 Title

Some body text here.`;
      const result = parseArticle(content);
      expect(result.title).toBe('Frontmatter Title');
    });

    it('throws TitleRequiredError when no H1 and no frontmatter title', () => {
      const content = `Some body text without any title.

## This is H2, not H1

More text here.`;
      expect(() => parseArticle(content)).toThrow(TitleRequiredError);
    });

    it('TitleRequiredError includes partial content', () => {
      const content = `Some body text without any title.`;
      try {
        parseArticle(content);
        expect.fail('Should have thrown TitleRequiredError');
      } catch (error) {
        expect(error).toBeInstanceOf(TitleRequiredError);
        const titleError = error as TitleRequiredError;
        expect(titleError.partialContent.body).toBe(
          'Some body text without any title.'
        );
        expect(titleError.partialContent.codeBlocks).toEqual([]);
        expect(titleError.partialContent.links).toEqual([]);
        expect(titleError.partialContent.candidateEntities).toEqual([]);
        expect(titleError.partialContent.candidateConcepts).toEqual([]);
      }
    });

    it('trims whitespace from frontmatter title', () => {
      const content = `---
title: "  Spaced Title  "
---

Body text.`;
      const result = parseArticle(content);
      expect(result.title).toBe('Spaced Title');
    });
  });

  describe('author extraction', () => {
    it('extracts author from frontmatter', () => {
      const content = `---
title: Test Article
author: John Doe
---

Body text.`;
      const result = parseArticle(content);
      expect(result.author).toBe('John Doe');
    });

    it('returns undefined when no author in frontmatter', () => {
      const content = `---
title: Test Article
---

Body text.`;
      const result = parseArticle(content);
      expect(result.author).toBeUndefined();
    });

    it('returns undefined when no frontmatter at all', () => {
      const content = `# Test Article

Body text.`;
      const result = parseArticle(content);
      expect(result.author).toBeUndefined();
    });
  });

  describe('date extraction', () => {
    it('extracts date from frontmatter as string', () => {
      const content = `---
title: Test Article
date: 2024-03-15
---

Body text.`;
      const result = parseArticle(content);
      expect(result.date).toBe('2024-03-15');
    });

    it('normalizes Date object from frontmatter to ISO date', () => {
      // gray-matter auto-parses YAML dates to Date objects
      const content = `---
title: Test Article
date: 2024-03-15
---

Body text.`;
      const result = parseArticle(content);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns undefined when no date in frontmatter', () => {
      const content = `---
title: Test Article
---

Body text.`;
      const result = parseArticle(content);
      expect(result.date).toBeUndefined();
    });
  });

  describe('body text extraction', () => {
    it('extracts body text after frontmatter', () => {
      const content = `---
title: Test Article
---

This is the body text.

It has multiple paragraphs.`;
      const result = parseArticle(content);
      expect(result.body).toContain('This is the body text.');
      expect(result.body).toContain('It has multiple paragraphs.');
    });

    it('extracts full content as body when no frontmatter', () => {
      const content = `# My Article

This is the body text.`;
      const result = parseArticle(content);
      expect(result.body).toContain('# My Article');
      expect(result.body).toContain('This is the body text.');
    });
  });

  describe('code block extraction', () => {
    it('extracts fenced code blocks with language', () => {
      const content = `# Test

\`\`\`typescript
const x = 1;
\`\`\``;
      const result = parseArticle(content);
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('typescript');
      expect(result.codeBlocks[0].content).toBe('const x = 1;');
    });

    it('extracts fenced code blocks without language', () => {
      const content = `# Test

\`\`\`
plain code
\`\`\``;
      const result = parseArticle(content);
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBeUndefined();
      expect(result.codeBlocks[0].content).toBe('plain code');
    });

    it('extracts multiple code blocks', () => {
      const content = `# Test

\`\`\`javascript
const a = 1;
\`\`\`

Some text between.

\`\`\`python
x = 2
\`\`\``;
      const result = parseArticle(content);
      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks[0].language).toBe('javascript');
      expect(result.codeBlocks[1].language).toBe('python');
    });

    it('preserves multiline code block content', () => {
      const content = `# Test

\`\`\`typescript
function hello() {
  console.log('world');
}
\`\`\``;
      const result = parseArticle(content);
      expect(result.codeBlocks[0].content).toBe(
        "function hello() {\n  console.log('world');\n}"
      );
    });
  });

  describe('link extraction', () => {
    it('extracts markdown hyperlinks', () => {
      const content = `# Test

Check out [this link](https://example.com) for more info.`;
      const result = parseArticle(content);
      expect(result.links).toContain('https://example.com');
    });

    it('does NOT extract image src URLs', () => {
      const content = `# Test

![alt text](https://example.com/image.png)

[real link](https://example.com/page)`;
      const result = parseArticle(content);
      expect(result.links).not.toContain('https://example.com/image.png');
      expect(result.links).toContain('https://example.com/page');
    });

    it('extracts multiple links', () => {
      const content = `# Test

[Link 1](https://one.com) and [Link 2](https://two.com)`;
      const result = parseArticle(content);
      expect(result.links).toHaveLength(2);
      expect(result.links).toContain('https://one.com');
      expect(result.links).toContain('https://two.com');
    });

    it('deduplicates identical links', () => {
      const content = `# Test

[First](https://example.com) and [Second](https://example.com)`;
      const result = parseArticle(content);
      expect(result.links).toHaveLength(1);
      expect(result.links).toContain('https://example.com');
    });

    it('handles links with complex text content', () => {
      const content = `# Test

[Click **here** for more](https://example.com/path)`;
      const result = parseArticle(content);
      expect(result.links).toContain('https://example.com/path');
    });
  });

  describe('empty/unparseable content (Requirement 3.6)', () => {
    it('throws ArticleParseError for empty string', () => {
      expect(() => parseArticle('')).toThrow(ArticleParseError);
    });

    it('throws ArticleParseError for whitespace-only string', () => {
      expect(() => parseArticle('   \n\t  ')).toThrow(ArticleParseError);
    });

    it('throws ArticleParseError for null-like content', () => {
      expect(() => parseArticle(null as unknown as string)).toThrow(
        ArticleParseError
      );
    });

    it('throws ArticleParseError for undefined content', () => {
      expect(() => parseArticle(undefined as unknown as string)).toThrow(
        ArticleParseError
      );
    });

    it('ArticleParseError has descriptive message', () => {
      try {
        parseArticle('');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ArticleParseError);
        expect((error as ArticleParseError).message).toContain('empty');
      }
    });
  });

  describe('candidateEntities and candidateConcepts', () => {
    it('returns empty arrays for candidateEntities and candidateConcepts', () => {
      const content = `# Test Article

Body text mentioning Angular and React.`;
      const result = parseArticle(content);
      expect(result.candidateEntities).toEqual([]);
      expect(result.candidateConcepts).toEqual([]);
    });
  });

  describe('complete article parsing', () => {
    it('parses a full article with all fields', () => {
      const content = `---
title: Understanding Signals in Angular
author: Jane Smith
date: 2024-06-01
---

# Understanding Signals in Angular

Angular Signals provide a reactive primitive for managing state.

\`\`\`typescript
import { signal } from '@angular/core';

const count = signal(0);
\`\`\`

Learn more at [Angular docs](https://angular.dev) and [Signals API](https://angular.dev/guide/signals).

![diagram](https://example.com/diagram.png)`;

      const result = parseArticle(content);
      expect(result.title).toBe('Understanding Signals in Angular');
      expect(result.author).toBe('Jane Smith');
      expect(result.date).toBe('2024-06-01');
      expect(result.body).toContain('Angular Signals provide');
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('typescript');
      expect(result.links).toContain('https://angular.dev');
      expect(result.links).toContain('https://angular.dev/guide/signals');
      expect(result.links).not.toContain('https://example.com/diagram.png');
      expect(result.candidateEntities).toEqual([]);
      expect(result.candidateConcepts).toEqual([]);
    });

    it('parses article with only H1 title (no frontmatter)', () => {
      const content = `# Simple Article

Just some text with a [link](https://example.com).

\`\`\`bash
echo "hello"
\`\`\``;

      const result = parseArticle(content);
      expect(result.title).toBe('Simple Article');
      expect(result.author).toBeUndefined();
      expect(result.date).toBeUndefined();
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.links).toHaveLength(1);
    });
  });
});

describe('extractCodeBlocks', () => {
  it('returns empty array for content without code blocks', () => {
    expect(extractCodeBlocks('Just plain text')).toEqual([]);
  });

  it('handles code blocks with empty content', () => {
    const content = `\`\`\`typescript
\`\`\``;
    const result = extractCodeBlocks(content);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('');
  });
});

describe('extractLinks', () => {
  it('returns empty array for content without links', () => {
    expect(extractLinks('Just plain text')).toEqual([]);
  });

  it('handles inline code containing link-like syntax', () => {
    const content = '`[not a link](not-a-url)` but [real](https://real.com)';
    // The regex will still match inside backticks since we don't parse inline code
    // This is acceptable behavior - the link extraction is best-effort
    const result = extractLinks(content);
    expect(result).toContain('https://real.com');
  });
});

describe('extractH1Title', () => {
  it('returns undefined for content without H1', () => {
    expect(extractH1Title('## H2 heading\n\nSome text')).toBeUndefined();
  });

  it('extracts first H1 only', () => {
    const content = `# First Title

# Second Title`;
    expect(extractH1Title(content)).toBe('First Title');
  });

  it('handles H1 with inline formatting', () => {
    expect(extractH1Title('# **Bold** Title')).toBe('**Bold** Title');
  });
});
