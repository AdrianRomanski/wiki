/**
 * Unit tests for frontmatter utilities.
 * 
 * Tests cover:
 * - Parsing valid frontmatter
 * - Generating valid frontmatter
 * - Validating required fields
 * - Handling invalid frontmatter
 * - Obsidian compatibility
 */

import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  generateFrontmatter,
  createFrontmatter,
  updateTimestamp,
  validateFrontmatter,
  FrontmatterValidationError,
  WikiPageFrontmatter,
} from './frontmatter.js';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter from markdown', () => {
    const markdown = `---
title: Angular CDK
type: entity
tags:
  - angular
  - accessibility
created: 2024-01-01
updated: 2024-01-02
---
# Angular CDK

Content here`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.title).toBe('Angular CDK');
    expect(result.frontmatter.type).toBe('entity');
    expect(result.frontmatter.tags).toEqual(['angular', 'accessibility']);
    expect(result.frontmatter.created).toBe('2024-01-01');
    expect(result.frontmatter.updated).toBe('2024-01-02');
    expect(result.content).toBe('# Angular CDK\n\nContent here');
  });

  it('should parse frontmatter with optional fields', () => {
    const markdown = `---
title: Research Paper
type: source
tags: [research]
author: John Doe
date: 2024-01-01
url: https://example.com
sources:
  - raw/papers/paper.pdf
created: 2024-01-01
updated: 2024-01-01
---
Summary here`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.author).toBe('John Doe');
    expect(result.frontmatter.date).toBe('2024-01-01');
    expect(result.frontmatter.url).toBe('https://example.com');
    expect(result.frontmatter.sources).toEqual(['raw/papers/paper.pdf']);
  });

  it('should throw error when frontmatter is missing', () => {
    const markdown = '# Just content, no frontmatter';

    expect(() => parseFrontmatter(markdown)).toThrow(FrontmatterValidationError);
    expect(() => parseFrontmatter(markdown)).toThrow('Frontmatter is missing or empty');
  });

  it('should throw error when required field is missing', () => {
    const markdown = `---
title: Test
type: entity
---
Content`;

    expect(() => parseFrontmatter(markdown)).toThrow(FrontmatterValidationError);
    expect(() => parseFrontmatter(markdown)).toThrow("Required field 'tags' is missing");
  });

  it('should throw error when type is invalid', () => {
    const markdown = `---
title: Test
type: invalid
tags: []
created: 2024-01-01
updated: 2024-01-01
---
Content`;

    expect(() => parseFrontmatter(markdown)).toThrow(FrontmatterValidationError);
    expect(() => parseFrontmatter(markdown)).toThrow('Field "type" must be one of: entity, concept, source');
  });

  it('should throw error when tags is not an array', () => {
    const markdown = `---
title: Test
type: entity
tags: not-an-array
created: 2024-01-01
updated: 2024-01-01
---
Content`;

    expect(() => parseFrontmatter(markdown)).toThrow(FrontmatterValidationError);
    expect(() => parseFrontmatter(markdown)).toThrow('Field "tags" must be an array');
  });

  it('should throw error when date format is invalid', () => {
    const markdown = `---
title: Test
type: entity
tags: []
created: invalid-date
updated: 2024-01-01
---
Content`;

    expect(() => parseFrontmatter(markdown)).toThrow(FrontmatterValidationError);
    expect(() => parseFrontmatter(markdown)).toThrow('Field "created" must be a valid ISO date string');
  });

  it('should handle empty content body', () => {
    const markdown = `---
title: Test
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---`;

    const result = parseFrontmatter(markdown);
    expect(result.content).toBe('');
  });
});

describe('generateFrontmatter', () => {
  it('should generate valid YAML frontmatter', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Angular CDK',
      type: 'entity',
      tags: ['angular', 'accessibility'],
      created: '2024-01-01',
      updated: '2024-01-02',
    };

    const content = '# Angular CDK\n\nContent here';
    const markdown = generateFrontmatter(frontmatter, content);

    // Should contain frontmatter delimiters
    expect(markdown).toContain('---');
    
    // Should contain all fields
    expect(markdown).toContain('title: Angular CDK');
    expect(markdown).toContain('type: entity');
    expect(markdown).toContain('tags:');
    expect(markdown).toContain('- angular');
    expect(markdown).toContain('- accessibility');
    expect(markdown).toMatch(/created: ['"]?2024-01-01['"]?/);
    expect(markdown).toMatch(/updated: ['"]?2024-01-02['"]?/);
    
    // Should contain content
    expect(markdown).toContain('# Angular CDK');
    expect(markdown).toContain('Content here');
  });

  it('should generate frontmatter with optional fields', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Research Paper',
      type: 'source',
      tags: ['research'],
      author: 'John Doe',
      date: '2024-01-01',
      url: 'https://example.com',
      sources: ['raw/papers/paper.pdf'],
      created: '2024-01-01',
      updated: '2024-01-01',
    };

    const markdown = generateFrontmatter(frontmatter, 'Summary here');

    expect(markdown).toContain('author: John Doe');
    expect(markdown).toMatch(/date: ['"]?2024-01-01['"]?/);
    expect(markdown).toMatch(/url: ['"]?https:\/\/example\.com['"]?/);
    expect(markdown).toContain('sources:');
    expect(markdown).toContain('- raw/papers/paper.pdf');
  });

  it('should generate frontmatter without content', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Test',
      type: 'entity',
      tags: [],
      created: '2024-01-01',
      updated: '2024-01-01',
    };

    const markdown = generateFrontmatter(frontmatter);

    expect(markdown).toContain('---');
    expect(markdown).toContain('title: Test');
  });

  it('should throw error when generating invalid frontmatter', () => {
    const invalidFrontmatter = {
      title: '',
      type: 'entity',
      tags: [],
      created: '2024-01-01',
      updated: '2024-01-01',
    } as WikiPageFrontmatter;

    expect(() => generateFrontmatter(invalidFrontmatter)).toThrow(FrontmatterValidationError);
  });

  it('should be parseable after generation (round-trip)', () => {
    const originalFrontmatter: WikiPageFrontmatter = {
      title: 'Test Page',
      type: 'concept',
      tags: ['tag1', 'tag2'],
      created: '2024-01-01',
      updated: '2024-01-02',
    };

    const content = '# Test\n\nContent';
    const markdown = generateFrontmatter(originalFrontmatter, content);
    const parsed = parseFrontmatter(markdown);

    expect(parsed.frontmatter).toEqual(originalFrontmatter);
    expect(parsed.content).toBe(content);
  });
});

describe('createFrontmatter', () => {
  it('should create frontmatter with defaults', () => {
    const frontmatter = createFrontmatter({
      title: 'Test Page',
      type: 'entity',
    });

    expect(frontmatter.title).toBe('Test Page');
    expect(frontmatter.type).toBe('entity');
    expect(frontmatter.tags).toEqual([]);
    expect(frontmatter.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(frontmatter.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(frontmatter.created).toBe(frontmatter.updated);
  });

  it('should create frontmatter with custom values', () => {
    const frontmatter = createFrontmatter({
      title: 'Custom Page',
      type: 'source',
      tags: ['custom', 'tags'],
      author: 'Jane Doe',
      created: '2023-01-01',
      updated: '2023-06-01',
    });

    expect(frontmatter.title).toBe('Custom Page');
    expect(frontmatter.type).toBe('source');
    expect(frontmatter.tags).toEqual(['custom', 'tags']);
    expect(frontmatter.author).toBe('Jane Doe');
    expect(frontmatter.created).toBe('2023-01-01');
    expect(frontmatter.updated).toBe('2023-06-01');
  });

  it('should create frontmatter for each page type', () => {
    const entity = createFrontmatter({ title: 'Entity', type: 'entity' });
    const concept = createFrontmatter({ title: 'Concept', type: 'concept' });
    const source = createFrontmatter({ title: 'Source', type: 'source' });

    expect(entity.type).toBe('entity');
    expect(concept.type).toBe('concept');
    expect(source.type).toBe('source');
  });
});

describe('updateTimestamp', () => {
  it('should update the updated field to current date', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Test',
      type: 'entity',
      tags: [],
      created: '2023-01-01',
      updated: '2023-01-01',
    };

    const updated = updateTimestamp(frontmatter);

    expect(updated.created).toBe('2023-01-01'); // Should not change
    expect(updated.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(updated.updated).not.toBe('2023-01-01'); // Should be different (current date)
  });

  it('should preserve all other fields', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Test',
      type: 'source',
      tags: ['tag1'],
      author: 'John Doe',
      url: 'https://example.com',
      created: '2023-01-01',
      updated: '2023-01-01',
    };

    const updated = updateTimestamp(frontmatter);

    expect(updated.title).toBe(frontmatter.title);
    expect(updated.type).toBe(frontmatter.type);
    expect(updated.tags).toEqual(frontmatter.tags);
    expect(updated.author).toBe(frontmatter.author);
    expect(updated.url).toBe(frontmatter.url);
    expect(updated.created).toBe(frontmatter.created);
  });
});

describe('validateFrontmatter', () => {
  it('should return valid for correct frontmatter', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Test',
      type: 'entity',
      tags: [],
      created: '2024-01-01',
      updated: '2024-01-01',
    };

    const result = validateFrontmatter(frontmatter);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid with error message for missing field', () => {
    const frontmatter = {
      title: 'Test',
      type: 'entity',
      // missing tags
      created: '2024-01-01',
      updated: '2024-01-01',
    } as Partial<WikiPageFrontmatter>;

    const result = validateFrontmatter(frontmatter);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('tags');
    expect(result.field).toBe('tags');
  });

  it('should return invalid for incorrect type', () => {
    const frontmatter = {
      title: 'Test',
      type: 'invalid',
      tags: [],
      created: '2024-01-01',
      updated: '2024-01-01',
    } as Partial<WikiPageFrontmatter>;

    const result = validateFrontmatter(frontmatter);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('type');
    expect(result.field).toBe('type');
  });

  it('should return invalid for empty title', () => {
    const frontmatter = {
      title: '',
      type: 'entity',
      tags: [],
      created: '2024-01-01',
      updated: '2024-01-01',
    } as Partial<WikiPageFrontmatter>;

    const result = validateFrontmatter(frontmatter);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('title');
    expect(result.field).toBe('title');
  });
});

describe('Obsidian compatibility', () => {
  it('should generate Obsidian-compatible YAML format', () => {
    const frontmatter: WikiPageFrontmatter = {
      title: 'Obsidian Test',
      type: 'concept',
      tags: ['obsidian', 'test'],
      created: '2024-01-01',
      updated: '2024-01-01',
    };

    const markdown = generateFrontmatter(frontmatter, '# Content');

    // Obsidian expects standard YAML with --- delimiters
    expect(markdown).toMatch(/^---\n/);
    expect(markdown).toContain('\n---\n');
    
    // Tags should be in array format
    expect(markdown).toContain('tags:');
    expect(markdown).toContain('- obsidian');
    expect(markdown).toContain('- test');
  });

  it('should parse Obsidian-generated frontmatter', () => {
    // Typical Obsidian frontmatter format
    const markdown = `---
title: Obsidian Page
type: entity
tags:
  - obsidian
  - wiki
created: 2024-01-01
updated: 2024-01-01
---
# Obsidian Page

This is content with [[WikiLinks]].`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.title).toBe('Obsidian Page');
    expect(result.frontmatter.tags).toEqual(['obsidian', 'wiki']);
    expect(result.content).toContain('[[WikiLinks]]');
  });
});
