/**
 * Unit tests for the frontmatter parser.
 */

import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  describe('valid frontmatter', () => {
    it('should parse a valid entity page', () => {
      const content = `---
title: Angular CDK
type: entity
tags:
  - angular
  - accessibility
created: "2024-01-15"
updated: "2024-02-20"
---
# Angular CDK

Content here.`;

      const result = parseFrontmatter('entities/angular-cdk.md', content);

      expect(result.success).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta!.title).toBe('Angular CDK');
      expect(result.meta!.type).toBe('entity');
      expect(result.meta!.tags).toEqual(['angular', 'accessibility']);
      expect(result.meta!.created).toBe('2024-01-15');
      expect(result.meta!.updated).toBe('2024-02-20');
      expect(result.meta!.filePath).toBe('entities/angular-cdk.md');
      expect(result.meta!.outgoingLinks).toEqual([]);
    });

    it('should parse a valid source page with optional fields', () => {
      const content = `---
title: Research Paper on ARIA
type: source
tags:
  - research
  - aria
author: Jane Doe
date: "2024-03-01"
url: https://example.com/paper
sources:
  - raw/papers/aria-paper.pdf
created: "2024-03-01"
updated: "2024-03-05"
---
Summary of the paper.`;

      const result = parseFrontmatter('sources/research-paper-on-aria.md', content);

      expect(result.success).toBe(true);
      expect(result.meta!.author).toBe('Jane Doe');
      expect(result.meta!.date).toBe('2024-03-01');
      expect(result.meta!.url).toBe('https://example.com/paper');
      expect(result.meta!.sources).toEqual(['raw/papers/aria-paper.pdf']);
    });

    it('should parse a concept page with empty tags', () => {
      const content = `---
title: Accessibility Patterns
type: concept
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('concepts/accessibility-patterns.md', content);

      expect(result.success).toBe(true);
      expect(result.meta!.tags).toEqual([]);
    });

    it('should handle Date objects from gray-matter parsing', () => {
      const content = `---
title: Date Test
type: entity
tags: []
created: 2024-06-15
updated: 2024-06-20
---
Content.`;

      const result = parseFrontmatter('entities/date-test.md', content);

      expect(result.success).toBe(true);
      expect(result.meta!.created).toBe('2024-06-15');
      expect(result.meta!.updated).toBe('2024-06-20');
    });

    it('should set outgoingLinks to empty array', () => {
      const content = `---
title: Test
type: entity
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content with [[WikiLink]].`;

      const result = parseFrontmatter('entities/test.md', content);

      expect(result.success).toBe(true);
      expect(result.meta!.outgoingLinks).toEqual([]);
    });
  });

  describe('missing required fields', () => {
    it('should fail when title is missing', () => {
      const content = `---
type: entity
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });

    it('should fail when title is empty string', () => {
      const content = `---
title: ""
type: entity
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });

    it('should fail when type is missing', () => {
      const content = `---
title: Test
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should fail when tags is missing', () => {
      const content = `---
title: Test
type: entity
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tags');
    });

    it('should fail when created is missing', () => {
      const content = `---
title: Test
type: entity
tags: []
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('created');
    });

    it('should fail when updated is missing', () => {
      const content = `---
title: Test
type: entity
tags: []
created: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('updated');
    });
  });

  describe('invalid field values', () => {
    it('should fail when type is not a valid page type', () => {
      const content = `---
title: Test
type: invalid
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
      expect(result.error).toContain('entity, concept, source');
    });

    it('should fail when tags is not an array', () => {
      const content = `---
title: Test
type: entity
tags: not-an-array
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tags');
      expect(result.error).toContain('array');
    });

    it('should fail when tags contains non-string values', () => {
      const content = `---
title: Test
type: entity
tags:
  - valid
  - 123
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tags');
      expect(result.error).toContain('strings');
    });
  });

  describe('malformed input', () => {
    it('should fail for content with no frontmatter', () => {
      const content = '# Just a heading\n\nNo frontmatter here.';

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for empty content', () => {
      const content = '';

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for content with empty frontmatter block', () => {
      const content = `---
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing or empty');
    });

    it('should not throw on invalid YAML', () => {
      const content = `---
title: [unclosed bracket
type: entity
---
Content.`;

      const result = parseFrontmatter('test.md', content);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('filePath handling', () => {
    it('should use the provided filePath in the result', () => {
      const content = `---
title: Test
type: entity
tags: []
created: "2024-01-01"
updated: "2024-01-01"
---
Content.`;

      const result = parseFrontmatter('entities/my-page.md', content);

      expect(result.success).toBe(true);
      expect(result.meta!.filePath).toBe('entities/my-page.md');
    });
  });
});
