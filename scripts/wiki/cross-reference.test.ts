/**
 * Unit tests for cross-reference detection and linking.
 * 
 * Tests cover:
 * - Cross-reference detection
 * - Link insertion
 * - Link validation
 * - Bidirectional linking
 * - Backlink discovery
 */

import { describe, it, expect } from 'vitest';
import {
  detectCrossReferences,
  insertCrossReferenceLinks,
  validateWikiLinks,
  CrossReference,
} from './cross-reference.js';

describe('detectCrossReferences', () => {
  it('should detect entity mentions in content', () => {
    const content = 'The Angular CDK provides accessibility utilities for building components.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Accessibility')).toBe(true);
  });
  
  it('should perform case-insensitive matching by default', () => {
    const content = 'The angular cdk provides ACCESSIBILITY utilities.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.length).toBe(2);
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Accessibility')).toBe(true);
  });
  
  it('should match longer phrases before shorter ones', () => {
    const content = 'The Angular CDK and Angular Material are related.';
    const existingPages = ['Angular', 'Angular CDK', 'Angular Material'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Should match "Angular CDK" and "Angular Material", not just "Angular"
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'Angular Material')).toBe(true);
    
    // Should not match "Angular" separately since it's part of longer phrases
    const angularMatches = refs.filter(r => r.targetTitle === 'Angular');
    expect(angularMatches.length).toBe(0);
  });
  
  it('should not match inside existing wiki links', () => {
    const content = 'See [[Angular CDK]] for details about Angular CDK.';
    const existingPages = ['Angular CDK'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Should only match the second occurrence (not inside [[]])
    expect(refs.length).toBe(1);
    expect(refs[0].position).toBeGreaterThan(content.indexOf(']]'));
  });
  
  it('should respect minimum word length', () => {
    const content = 'The UI is built with Angular.';
    const existingPages = ['UI', 'Angular'];
    
    const refs = detectCrossReferences({
      content,
      existingPages,
      minWordLength: 3,
    });
    
    // Should match "Angular" but not "UI" (too short)
    expect(refs.some(r => r.targetTitle === 'Angular')).toBe(true);
    expect(refs.some(r => r.targetTitle === 'UI')).toBe(false);
  });
  
  it('should handle special characters in page titles', () => {
    const content = 'Use the @Component decorator in Angular.';
    const existingPages = ['@Component'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.some(r => r.targetTitle === '@Component')).toBe(true);
  });
  
  it('should return references sorted by position', () => {
    const content = 'Angular CDK and Accessibility are important. Angular CDK is useful.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Check that positions are in ascending order
    for (let i = 1; i < refs.length; i++) {
      expect(refs[i].position).toBeGreaterThanOrEqual(refs[i - 1].position);
    }
  });
  
  it('should handle empty existing pages list', () => {
    const content = 'Some content here.';
    const existingPages: string[] = [];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.length).toBe(0);
  });
  
  it('should handle empty content', () => {
    const content = '';
    const existingPages = ['Angular CDK'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.length).toBe(0);
  });
  
  it('should match at word boundaries only', () => {
    const content = 'The accessibility-tree and accessibility are different.';
    const existingPages = ['accessibility'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Hyphens are treated as word boundaries, so both occurrences match
    // This is correct behavior for cross-reference detection
    expect(refs.length).toBe(2);
    expect(refs.every(r => r.targetTitle === 'accessibility')).toBe(true);
  });
});

describe('insertCrossReferenceLinks', () => {
  it('should insert wiki links for detected references', () => {
    const content = 'The Angular CDK provides utilities.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 4,
      },
    ];
    
    const result = insertCrossReferenceLinks(content, refs);
    
    expect(result).toBe('The [[Angular CDK]] provides utilities.');
  });
  
  it('should handle multiple references', () => {
    const content = 'Angular CDK and Accessibility are important.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 0,
      },
      {
        matchedText: 'Accessibility',
        targetTitle: 'Accessibility',
        exists: true,
        position: 16,
      },
    ];
    
    const result = insertCrossReferenceLinks(content, refs);
    
    expect(result).toBe('[[Angular CDK]] and [[Accessibility]] are important.');
  });
  
  it('should handle references in reverse order', () => {
    const content = 'First and Second are here.';
    const refs: CrossReference[] = [
      {
        matchedText: 'Second',
        targetTitle: 'Second',
        exists: true,
        position: 10,
      },
      {
        matchedText: 'First',
        targetTitle: 'First',
        exists: true,
        position: 0,
      },
    ];
    
    const result = insertCrossReferenceLinks(content, refs);
    
    expect(result).toBe('[[First]] and [[Second]] are here.');
  });
  
  it('should handle empty references array', () => {
    const content = 'No references here.';
    const refs: CrossReference[] = [];
    
    const result = insertCrossReferenceLinks(content, refs);
    
    expect(result).toBe(content);
  });
  
  it('should preserve existing content structure', () => {
    const content = 'Line 1\nAngular CDK\nLine 3';
    const refs: CrossReference[] = [
      {
        matchedText: 'Angular CDK',
        targetTitle: 'Angular CDK',
        exists: true,
        position: 7,
      },
    ];
    
    const result = insertCrossReferenceLinks(content, refs);
    
    expect(result).toBe('Line 1\n[[Angular CDK]]\nLine 3');
  });
});

describe('validateWikiLinks', () => {
  it('should identify valid links', () => {
    const content = 'See [[Angular CDK]] and [[Accessibility]] for details.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual(['Angular CDK', 'Accessibility']);
    expect(result.brokenLinks).toEqual([]);
    expect(result.totalLinks).toBe(2);
  });
  
  it('should identify broken links', () => {
    const content = 'See [[Angular CDK]] and [[NonExistent]] for details.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.brokenLinks).toEqual(['NonExistent']);
    expect(result.totalLinks).toBe(2);
  });
  
  it('should perform case-insensitive validation', () => {
    const content = 'See [[angular cdk]] for details.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual(['angular cdk']);
    expect(result.brokenLinks).toEqual([]);
  });
  
  it('should handle content with no links', () => {
    const content = 'No links here.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual([]);
    expect(result.brokenLinks).toEqual([]);
    expect(result.totalLinks).toBe(0);
  });
  
  it('should handle links with display text', () => {
    const content = 'See [[Angular CDK|the CDK]] for details.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.totalLinks).toBe(1);
  });
  
  it('should handle links with section anchors', () => {
    const content = 'See [[Angular CDK#Properties]] for details.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    expect(result.validLinks).toEqual(['Angular CDK']);
    expect(result.totalLinks).toBe(1);
  });
  
  it('should handle duplicate links', () => {
    const content = 'See [[Angular CDK]] and [[Angular CDK]] again.';
    const existingPages = ['Angular CDK'];
    
    const result = validateWikiLinks(content, existingPages);
    
    // extractWikiLinks returns unique links, so totalLinks should be 1
    expect(result.totalLinks).toBe(1);
    expect(result.validLinks).toEqual(['Angular CDK']);
  });
});

describe('Integration: detect and insert', () => {
  it('should detect and insert links in one workflow', () => {
    const content = 'The Angular CDK provides accessibility utilities.';
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    // Detect references
    const refs = detectCrossReferences({ content, existingPages });
    
    // Insert links
    const linked = insertCrossReferenceLinks(content, refs);
    
    expect(linked).toContain('[[Angular CDK]]');
    // The matched text preserves the target title case, not the original case
    expect(linked).toContain('[[Accessibility]]');
    
    // Validate the result
    const validation = validateWikiLinks(linked, existingPages);
    expect(validation.brokenLinks.length).toBe(0);
  });
  
  it('should not double-link already linked content', () => {
    const content = 'See [[Angular CDK]] for Angular CDK details.';
    const existingPages = ['Angular CDK'];
    
    const refs = detectCrossReferences({ content, existingPages });
    const linked = insertCrossReferenceLinks(content, refs);
    
    // Should only add one more link (the second occurrence)
    const linkCount = (linked.match(/\[\[Angular CDK\]\]/g) || []).length;
    expect(linkCount).toBe(2);
  });
});

describe('Edge cases', () => {
  it('should handle overlapping page titles', () => {
    const content = 'Angular and Angular CDK are different.';
    const existingPages = ['Angular', 'Angular CDK'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Should prefer longer match "Angular CDK" over "Angular"
    expect(refs.some(r => r.targetTitle === 'Angular CDK')).toBe(true);
  });
  
  it('should handle page titles with punctuation', () => {
    const content = 'Use the @Component decorator.';
    const existingPages = ['@Component'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.some(r => r.targetTitle === '@Component')).toBe(true);
  });
  
  it('should handle multiline content', () => {
    const content = `First line with Angular CDK.
Second line with Accessibility.
Third line.`;
    const existingPages = ['Angular CDK', 'Accessibility'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    expect(refs.length).toBe(2);
  });
  
  it('should handle content with code blocks', () => {
    const content = '```typescript\nimport { Angular } from "angular";\n```\nUse Angular here.';
    const existingPages = ['Angular'];
    
    const refs = detectCrossReferences({ content, existingPages });
    
    // Should match all occurrences (in import, in string, and in text)
    // This is expected behavior - cross-reference detection doesn't parse code semantics
    expect(refs.length).toBe(3);
  });
});
