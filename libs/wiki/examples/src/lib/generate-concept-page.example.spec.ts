import { describe, it, expect } from 'vitest';
import {
  generateConceptPageExample,
  generateConceptPageWithMinimalOptions,
  generateConceptPageForArchitecturalPrinciple,
  generateConceptPageForDataStructure
} from './generate-concept-page.example';

describe('Generate Concept Page Examples', () => {
  describe('generateConceptPageExample', () => {
    it('should generate concept page with all sections', () => {
      const result = generateConceptPageExample();

      expect(result.filename).toBe('dependency-injection.md');
      expect(result.frontmatter.title).toBe('Dependency Injection');
      expect(result.frontmatter.type).toBe('concept');
      expect(result.frontmatter.tags).toContain('design-pattern');
    });

    it('should include frontmatter in content', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: Dependency Injection');
      expect(result.content).toContain('type: concept');
    });

    it('should generate Explanation section', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('## Explanation');
      expect(result.content).toContain('objects receive their dependencies');
    });

    it('should generate Applications section with list', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('## Applications');
      expect(result.content).toContain('- Testing:');
      expect(result.content).toContain('- Configuration:');
    });

    it('should generate Related Concepts section with WikiLinks', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('## Related Concepts');
      expect(result.content).toContain('[[Inversion of Control]]');
      expect(result.content).toContain('[[Service Locator Pattern]]');
    });

    it('should generate Examples section', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('## Examples');
      expect(result.content).toContain('Angular');
    });

    it('should generate References section', () => {
      const result = generateConceptPageExample();

      expect(result.content).toContain('## References');
      expect(result.content).toContain('[[martin-fowler-dependency-injection-2004]]');
    });
  });

  describe('generateConceptPageWithMinimalOptions', () => {
    it('should generate minimal concept page', () => {
      const result = generateConceptPageWithMinimalOptions();

      expect(result.filename).toBe('single-responsibility-principle.md');
      expect(result.frontmatter.title).toBe('Single Responsibility Principle');
      expect(result.frontmatter.type).toBe('concept');
    });

    it('should not include optional sections when not provided', () => {
      const result = generateConceptPageWithMinimalOptions();

      expect(result.content).not.toContain('## Applications');
      expect(result.content).not.toContain('## Related Concepts');
      expect(result.content).not.toContain('## Examples');
      expect(result.content).not.toContain('## References');
    });

    it('should include Explanation section', () => {
      const result = generateConceptPageWithMinimalOptions();

      expect(result.content).toContain('## Explanation');
      expect(result.content).toContain('only one reason to change');
    });
  });

  describe('generateConceptPageForArchitecturalPrinciple', () => {
    it('should generate architectural principle concept page', () => {
      const result = generateConceptPageForArchitecturalPrinciple();

      expect(result.filename).toBe('progressive-enhancement.md');
      expect(result.frontmatter.title).toBe('Progressive Enhancement');
      expect(result.frontmatter.type).toBe('concept');
      expect(result.frontmatter.tags).toContain('web-design');
    });

    it('should include comprehensive explanation', () => {
      const result = generateConceptPageForArchitecturalPrinciple();

      expect(result.content).toContain('core content and functionality first');
      expect(result.content).toContain('progressively adds enhanced features');
    });

    it('should include related concepts', () => {
      const result = generateConceptPageForArchitecturalPrinciple();

      expect(result.content).toContain('[[Graceful Degradation]]');
      expect(result.content).toContain('[[Web Accessibility]]');
    });
  });

  describe('generateConceptPageForDataStructure', () => {
    it('should generate data structure concept page', () => {
      const result = generateConceptPageForDataStructure();

      expect(result.filename).toBe('reactive-streams.md');
      expect(result.frontmatter.title).toBe('Reactive Streams');
      expect(result.frontmatter.type).toBe('concept');
    });

    it('should include multiple sources', () => {
      const result = generateConceptPageForDataStructure();

      expect(result.frontmatter.sources).toContain('rxjs-documentation-2024-01-10');
      expect(result.frontmatter.sources).toContain('reactive-manifesto-2014');
    });

    it('should include applications and examples', () => {
      const result = generateConceptPageForDataStructure();

      expect(result.content).toContain('## Applications');
      expect(result.content).toContain('Event handling');
      expect(result.content).toContain('## Examples');
      expect(result.content).toContain('RxJS');
    });
  });
});
