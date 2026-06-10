import { describe, it, expect } from 'vitest';
import {
  detectCrossReferencesExample,
  insertCrossReferenceLinksExample,
  validateWikiLinksExample,
  findBacklinksForTargetPageExample,
  suggestBidirectionalLinksExample,
  completeWorkflowExample
} from './cross-reference.example';

describe('Cross-Reference Examples', () => {
  describe('detectCrossReferencesExample', () => {
    it('should detect cross-references in content', () => {
      const references = detectCrossReferencesExample();

      expect(references).toBeDefined();
      expect(references.length).toBeGreaterThan(0);
    });

    it('should detect Angular reference', () => {
      const references = detectCrossReferencesExample();

      const angularRef = references.find(ref => ref.targetTitle === 'Angular');
      expect(angularRef).toBeDefined();
      expect(angularRef?.matchedText).toBe('Angular');
      expect(angularRef?.exists).toBe(true);
    });

    it('should detect TypeScript reference', () => {
      const references = detectCrossReferencesExample();

      const typescriptRef = references.find(ref => ref.targetTitle === 'TypeScript');
      expect(typescriptRef).toBeDefined();
      expect(typescriptRef?.exists).toBe(true);
    });

    it('should detect RxJS reference', () => {
      const references = detectCrossReferencesExample();

      const rxjsRef = references.find(ref => ref.targetTitle === 'RxJS');
      expect(rxjsRef).toBeDefined();
      expect(rxjsRef?.exists).toBe(true);
    });

    it('should detect multi-word references', () => {
      const references = detectCrossReferencesExample();

      const multiWordRef = references.find(
        ref => ref.targetTitle === 'Dependency Injection' || ref.targetTitle === 'Angular CDK'
      );
      expect(multiWordRef).toBeDefined();
    });

    it('should sort references by position', () => {
      const references = detectCrossReferencesExample();

      for (let i = 1; i < references.length; i++) {
        expect(references[i].position).toBeGreaterThanOrEqual(references[i - 1].position);
      }
    });
  });

  describe('insertCrossReferenceLinksExample', () => {
    it('should insert WikiLinks into content', () => {
      const result = insertCrossReferenceLinksExample();

      expect(result.updatedContent).toContain('[[');
      expect(result.updatedContent).toContain(']]');
    });

    it('should preserve original text outside of links', () => {
      const result = insertCrossReferenceLinksExample();

      expect(result.updatedContent).toContain('Modern frontend frameworks');
      expect(result.updatedContent).toContain('essential tools');
    });

    it('should insert links for detected frameworks', () => {
      const result = insertCrossReferenceLinksExample();

      expect(result.updatedContent).toContain('[[React]]');
      expect(result.updatedContent).toContain('[[Vue]]');
      expect(result.updatedContent).toContain('[[Angular]]');
    });

    it('should insert links for languages', () => {
      const result = insertCrossReferenceLinksExample();

      expect(result.updatedContent).toContain('[[JavaScript]]');
      expect(result.updatedContent).toContain('[[TypeScript]]');
    });

    it('should detect all expected references', () => {
      const result = insertCrossReferenceLinksExample();

      expect(result.references.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateWikiLinksExample', () => {
    it('should validate WikiLinks against existing pages', () => {
      const result = validateWikiLinksExample();

      expect(result).toBeDefined();
      expect(result.totalLinks).toBeGreaterThan(0);
    });

    it('should identify valid links', () => {
      const result = validateWikiLinksExample();

      expect(result.validLinks).toContain('Angular');
      expect(result.validLinks).toContain('TypeScript');
      expect(result.validLinks).toContain('RxJS');
      expect(result.validLinks).toContain('Component');
    });

    it('should identify broken links', () => {
      const result = validateWikiLinksExample();

      expect(result.brokenLinks).toContain('AngularJS');
      expect(result.brokenLinks).toContain('Webpack');
    });

    it('should count total links correctly', () => {
      const result = validateWikiLinksExample();

      expect(result.totalLinks).toBe(result.validLinks.length + result.brokenLinks.length);
    });

    it('should have more valid links than broken links', () => {
      const result = validateWikiLinksExample();

      expect(result.validLinks.length).toBeGreaterThan(result.brokenLinks.length);
    });
  });

  describe('findBacklinksForTargetPageExample', () => {
    it('should return an array', async () => {
      const backlinks = await findBacklinksForTargetPageExample();

      expect(Array.isArray(backlinks)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const backlinks = await findBacklinksForTargetPageExample();

      expect(backlinks).toBeDefined();
    });
  });

  describe('suggestBidirectionalLinksExample', () => {
    it('should return an array', async () => {
      const suggestions = await suggestBidirectionalLinksExample();

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle missing wiki directory gracefully', async () => {
      const suggestions = await suggestBidirectionalLinksExample();

      expect(suggestions).toBeDefined();
    });
  });

  describe('completeWorkflowExample', () => {
    it('should execute complete workflow', () => {
      const result = completeWorkflowExample();

      expect(result).toBeDefined();
      expect(result.originalContent).toBeDefined();
      expect(result.references).toBeDefined();
      expect(result.contentWithLinks).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    it('should detect references in original content', () => {
      const result = completeWorkflowExample();

      expect(result.references.length).toBeGreaterThan(0);
    });

    it('should insert WikiLinks', () => {
      const result = completeWorkflowExample();

      expect(result.contentWithLinks).toContain('[[');
      expect(result.contentWithLinks).toContain(']]');
    });

    it('should validate inserted links', () => {
      const result = completeWorkflowExample();

      expect(result.validation.totalLinks).toBeGreaterThan(0);
    });

    it('should detect Angular link', () => {
      const result = completeWorkflowExample();

      const angularRef = result.references.find(ref => ref.targetTitle === 'Angular');
      expect(angularRef).toBeDefined();
    });

    it('should detect TypeScript link', () => {
      const result = completeWorkflowExample();

      const typescriptRef = result.references.find(ref => ref.targetTitle === 'TypeScript');
      expect(typescriptRef).toBeDefined();
    });

    it('should detect JavaScript link', () => {
      const result = completeWorkflowExample();

      const javascriptRef = result.references.find(ref => ref.targetTitle === 'JavaScript');
      expect(javascriptRef).toBeDefined();
    });

    it('should have all links valid', () => {
      const result = completeWorkflowExample();

      expect(result.validation.brokenLinks.length).toBe(0);
    });

    it('should preserve content structure', () => {
      const result = completeWorkflowExample();

      expect(result.contentWithLinks).toContain('# Modern Web Development');
      expect(result.contentWithLinks).toContain('framework');
      expect(result.contentWithLinks).toContain('static typing');
    });
  });
});
