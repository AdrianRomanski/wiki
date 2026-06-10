import { describe, it, expect } from 'vitest';
import {
  generateEntityPageExample,
  generateEntityPageWithMinimalOptions,
  generateEntityPageForFramework
} from './generate-entity-page.example';

describe('Generate Entity Page Examples', () => {
  describe('generateEntityPageExample', () => {
    it('should generate entity page with all sections', () => {
      const result = generateEntityPageExample();

      expect(result.filename).toBe('angular-cdk.md');
      expect(result.frontmatter.title).toBe('Angular CDK');
      expect(result.frontmatter.type).toBe('entity');
      expect(result.frontmatter.tags).toContain('angular');
      expect(result.frontmatter.sources).toContain('angular-cdk-documentation-2024-01-15');
    });

    it('should include frontmatter in content', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('---');
      expect(result.content).toContain('title: Angular CDK');
      expect(result.content).toContain('type: entity');
    });

    it('should generate Definition section', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('## Definition');
      expect(result.content).toContain('A set of behavior primitives');
    });

    it('should generate Properties section with list', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('## Properties');
      expect(result.content).toContain('- Provides reusable component behaviors');
    });

    it('should generate Relationships section with WikiLinks', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('## Relationships');
      expect(result.content).toContain('[[Angular]]');
      expect(result.content).toContain('Built on top of');
    });

    it('should generate Examples section', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('## Examples');
      expect(result.content).toContain('Overlay');
    });

    it('should generate References section with source links', () => {
      const result = generateEntityPageExample();

      expect(result.content).toContain('## References');
      expect(result.content).toContain('[[angular-cdk-documentation-2024-01-15]]');
    });
  });

  describe('generateEntityPageWithMinimalOptions', () => {
    it('should generate minimal entity page', () => {
      const result = generateEntityPageWithMinimalOptions();

      expect(result.filename).toBe('typescript.md');
      expect(result.frontmatter.title).toBe('TypeScript');
      expect(result.frontmatter.type).toBe('entity');
    });

    it('should not include optional sections when not provided', () => {
      const result = generateEntityPageWithMinimalOptions();

      expect(result.content).not.toContain('## Properties');
      expect(result.content).not.toContain('## Relationships');
      expect(result.content).not.toContain('## Examples');
      expect(result.content).not.toContain('## References');
    });

    it('should include Definition section', () => {
      const result = generateEntityPageWithMinimalOptions();

      expect(result.content).toContain('## Definition');
      expect(result.content).toContain('strongly typed programming language');
    });
  });

  describe('generateEntityPageForFramework', () => {
    it('should generate framework entity page', () => {
      const result = generateEntityPageForFramework();

      expect(result.filename).toBe('nestjs.md');
      expect(result.frontmatter.title).toBe('NestJS');
      expect(result.frontmatter.type).toBe('entity');
      expect(result.frontmatter.tags).toContain('framework');
    });

    it('should include multiple relationships', () => {
      const result = generateEntityPageForFramework();

      expect(result.content).toContain('[[Node.js]]');
      expect(result.content).toContain('[[Express]]');
      expect(result.content).toContain('[[TypeScript]]');
      expect(result.content).toContain('[[Dependency Injection]]');
    });

    it('should include properties list', () => {
      const result = generateEntityPageForFramework();

      expect(result.content).toContain('TypeScript-first development');
      expect(result.content).toContain('Modular architecture');
    });
  });
});
