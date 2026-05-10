/**
 * Unit tests for wiki page generators.
 * 
 * Tests cover:
 * - Entity page generation
 * - Concept page generation
 * - Source summary page generation
 * - Frontmatter generation
 * - Content structure validation
 * - Naming convention compliance
 */

import { describe, it, expect } from 'vitest';
import {
  generateEntityPage,
  generateConceptPage,
  generateSourceSummaryPage,
  EntityPageOptions,
  ConceptPageOptions,
  SourceSummaryOptions,
} from './generators.js';
import { parseFrontmatter } from './frontmatter.js';
import { validateEntityName, validateConceptName, validateSourceName } from './naming.js';

describe('generateEntityPage', () => {
  it('should generate entity page with all sections', () => {
    const options: EntityPageOptions = {
      name: 'Angular CDK',
      definition: 'The Angular Component Dev Kit provides behavior primitives for building UI components.',
      properties: [
        'Provides accessibility utilities',
        'Includes layout helpers',
        'Offers drag-and-drop functionality',
      ],
      relationships: [
        { target: 'Angular Material', description: 'Used in' },
        { target: 'Accessibility', description: 'Implements' },
      ],
      examples: ['```typescript\nimport { A11yModule } from "@angular/cdk/a11y";\n```'],
      tags: ['angular', 'accessibility', 'component-library'],
      sources: ['angular-cdk-docs-2024-05-10'],
    };
    
    const page = generateEntityPage(options);
    
    // Check filename follows naming convention
    expect(page.filename).toBe('angular-cdk.md');
    expect(validateEntityName(page.filename).valid).toBe(true);
    
    // Check frontmatter
    expect(page.frontmatter.title).toBe('Angular CDK');
    expect(page.frontmatter.type).toBe('entity');
    expect(page.frontmatter.tags).toEqual(['angular', 'accessibility', 'component-library']);
    expect(page.frontmatter.sources).toEqual(['angular-cdk-docs-2024-05-10']);
    
    // Check content structure
    expect(page.content).toContain('# Angular CDK');
    expect(page.content).toContain('## Definition');
    expect(page.content).toContain('behavior primitives');
    expect(page.content).toContain('## Properties');
    expect(page.content).toContain('- Provides accessibility utilities');
    expect(page.content).toContain('## Relationships');
    expect(page.content).toContain('Used in [[Angular Material]]');
    expect(page.content).toContain('Implements [[Accessibility]]');
    expect(page.content).toContain('## Examples');
    expect(page.content).toContain('```typescript');
    expect(page.content).toContain('## References');
    expect(page.content).toContain('[[angular-cdk-docs-2024-05-10]]');
  });
  
  it('should generate minimal entity page with only required fields', () => {
    const options: EntityPageOptions = {
      name: 'ARIA Live Region',
      definition: 'An ARIA live region is a section of a page that announces updates to screen readers.',
    };
    
    const page = generateEntityPage(options);
    
    expect(page.filename).toBe('aria-live-region.md');
    expect(page.frontmatter.title).toBe('ARIA Live Region');
    expect(page.frontmatter.type).toBe('entity');
    expect(page.content).toContain('# ARIA Live Region');
    expect(page.content).toContain('## Definition');
    expect(page.content).toContain('announces updates to screen readers');
    
    // Should not contain optional sections
    expect(page.content).not.toContain('## Properties');
    expect(page.content).not.toContain('## Relationships');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });
  
  it('should generate parseable frontmatter', () => {
    const options: EntityPageOptions = {
      name: 'Test Entity',
      definition: 'Test definition',
      tags: ['test'],
    };
    
    const page = generateEntityPage(options);
    
    // Should be able to parse the generated content
    const parsed = parseFrontmatter(page.content);
    expect(parsed.frontmatter.title).toBe('Test Entity');
    expect(parsed.frontmatter.type).toBe('entity');
    expect(parsed.content).toContain('# Test Entity');
  });
  
  it('should handle special characters in entity name', () => {
    const options: EntityPageOptions = {
      name: 'Angular @Component Decorator',
      definition: 'The @Component decorator marks a class as an Angular component.',
    };
    
    const page = generateEntityPage(options);
    
    // Filename should be kebab-case
    expect(page.filename).toBe('angular-component-decorator.md');
    
    // Title should preserve original name
    expect(page.frontmatter.title).toBe('Angular @Component Decorator');
    expect(page.content).toContain('# Angular @Component Decorator');
  });
  
  it('should handle empty arrays gracefully', () => {
    const options: EntityPageOptions = {
      name: 'Empty Entity',
      definition: 'Test',
      properties: [],
      relationships: [],
      examples: [],
      tags: [],
      sources: [],
    };
    
    const page = generateEntityPage(options);
    
    // Should not include empty sections
    expect(page.content).not.toContain('## Properties');
    expect(page.content).not.toContain('## Relationships');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });
});

describe('generateConceptPage', () => {
  it('should generate concept page with all sections', () => {
    const options: ConceptPageOptions = {
      name: 'Progressive Enhancement',
      explanation: 'Progressive enhancement is a design philosophy that provides a baseline experience to all users while enhancing the experience for users with more capable browsers.',
      applications: [
        'Building accessible web applications',
        'Ensuring functionality without JavaScript',
        'Supporting older browsers',
      ],
      relatedConcepts: ['Graceful Degradation', 'Accessibility', 'Semantic HTML'],
      examples: ['Start with semantic HTML, then add CSS, then add JavaScript.'],
      tags: ['web-development', 'accessibility', 'design-pattern'],
      sources: ['progressive-enhancement-guide-2024-03-15'],
    };
    
    const page = generateConceptPage(options);
    
    // Check filename follows naming convention
    expect(page.filename).toBe('progressive-enhancement.md');
    expect(validateConceptName(page.filename).valid).toBe(true);
    
    // Check frontmatter
    expect(page.frontmatter.title).toBe('Progressive Enhancement');
    expect(page.frontmatter.type).toBe('concept');
    expect(page.frontmatter.tags).toEqual(['web-development', 'accessibility', 'design-pattern']);
    
    // Check content structure
    expect(page.content).toContain('# Progressive Enhancement');
    expect(page.content).toContain('## Explanation');
    expect(page.content).toContain('design philosophy');
    expect(page.content).toContain('## Applications');
    expect(page.content).toContain('- Building accessible web applications');
    expect(page.content).toContain('## Related Concepts');
    expect(page.content).toContain('[[Graceful Degradation]]');
    expect(page.content).toContain('[[Accessibility]]');
    expect(page.content).toContain('## Examples');
    expect(page.content).toContain('semantic HTML');
    expect(page.content).toContain('## References');
  });
  
  it('should generate minimal concept page with only required fields', () => {
    const options: ConceptPageOptions = {
      name: 'Keyboard Navigation',
      explanation: 'Keyboard navigation allows users to interact with a website using only keyboard inputs.',
    };
    
    const page = generateConceptPage(options);
    
    expect(page.filename).toBe('keyboard-navigation.md');
    expect(page.frontmatter.title).toBe('Keyboard Navigation');
    expect(page.frontmatter.type).toBe('concept');
    expect(page.content).toContain('# Keyboard Navigation');
    expect(page.content).toContain('## Explanation');
    
    // Should not contain optional sections
    expect(page.content).not.toContain('## Applications');
    expect(page.content).not.toContain('## Related Concepts');
    expect(page.content).not.toContain('## Examples');
    expect(page.content).not.toContain('## References');
  });
  
  it('should generate parseable frontmatter', () => {
    const options: ConceptPageOptions = {
      name: 'Test Concept',
      explanation: 'Test explanation',
    };
    
    const page = generateConceptPage(options);
    
    const parsed = parseFrontmatter(page.content);
    expect(parsed.frontmatter.title).toBe('Test Concept');
    expect(parsed.frontmatter.type).toBe('concept');
  });
});

describe('generateSourceSummaryPage', () => {
  it('should generate source summary page with all sections', () => {
    const options: SourceSummaryOptions = {
      title: 'Angular ARIA Guide',
      author: 'Angular Team',
      date: '2024-05-10',
      url: 'https://angular.dev/guide/accessibility',
      sourceType: 'article',
      rawSourcePath: 'raw/articles/angular-aria-guide.md',
      keyPoints: [
        'Angular provides built-in accessibility features',
        'Use semantic HTML elements',
        'Test with screen readers',
      ],
      insights: 'The guide emphasizes the importance of semantic HTML as the foundation for accessibility.',
      relevantEntities: ['Angular CDK', 'ARIA'],
      relevantConcepts: ['Accessibility', 'Semantic HTML'],
      quotes: [
        'Accessibility is not optional.',
        'Start with semantic HTML.',
      ],
      tags: ['angular', 'accessibility', 'guide'],
    };
    
    const page = generateSourceSummaryPage(options);
    
    // Check filename follows naming convention (includes date)
    expect(page.filename).toBe('angular-aria-guide-2024-05-10.md');
    expect(validateSourceName(page.filename).valid).toBe(true);
    
    // Check frontmatter
    expect(page.frontmatter.title).toBe('Angular ARIA Guide');
    expect(page.frontmatter.type).toBe('source');
    expect(page.frontmatter.author).toBe('Angular Team');
    expect(page.frontmatter.date).toBe('2024-05-10');
    expect(page.frontmatter.url).toBe('https://angular.dev/guide/accessibility');
    expect(page.frontmatter.tags).toEqual(['angular', 'accessibility', 'guide']);
    
    // Check content structure
    expect(page.content).toContain('# Angular ARIA Guide');
    expect(page.content).toContain('## Metadata');
    expect(page.content).toContain('**Author**: Angular Team');
    expect(page.content).toContain('**Date**: 2024-05-10');
    expect(page.content).toContain('**URL**: [link](https://angular.dev/guide/accessibility)');
    expect(page.content).toContain('**Type**: article');
    expect(page.content).toContain('**Raw Source**: `raw/articles/angular-aria-guide.md`');
    expect(page.content).toContain('## Key Points');
    expect(page.content).toContain('- Angular provides built-in accessibility features');
    expect(page.content).toContain('## Insights');
    expect(page.content).toContain('semantic HTML as the foundation');
    expect(page.content).toContain('## Relevant Entities');
    expect(page.content).toContain('[[Angular CDK]]');
    expect(page.content).toContain('[[ARIA]]');
    expect(page.content).toContain('## Relevant Concepts');
    expect(page.content).toContain('[[Accessibility]]');
    expect(page.content).toContain('## Quotes');
    expect(page.content).toContain('> Accessibility is not optional.');
    expect(page.content).toContain('> Start with semantic HTML.');
  });
  
  it('should generate minimal source summary with only required fields', () => {
    const options: SourceSummaryOptions = {
      title: 'Quick Note',
      keyPoints: ['Point 1', 'Point 2'],
    };
    
    const page = generateSourceSummaryPage(options);
    
    // Filename should include current date
    expect(page.filename).toMatch(/^quick-note-\d{4}-\d{2}-\d{2}\.md$/);
    expect(page.frontmatter.title).toBe('Quick Note');
    expect(page.frontmatter.type).toBe('source');
    expect(page.content).toContain('# Quick Note');
    expect(page.content).toContain('## Key Points');
    
    // Should not contain optional sections
    expect(page.content).not.toContain('## Insights');
    expect(page.content).not.toContain('## Relevant Entities');
    expect(page.content).not.toContain('## Relevant Concepts');
    expect(page.content).not.toContain('## Quotes');
  });
  
  it('should use provided date in filename', () => {
    const options: SourceSummaryOptions = {
      title: 'Test Source',
      date: '2023-12-25',
      keyPoints: ['Test'],
    };
    
    const page = generateSourceSummaryPage(options);
    
    expect(page.filename).toBe('test-source-2023-12-25.md');
    expect(page.frontmatter.date).toBe('2023-12-25');
  });
  
  it('should generate parseable frontmatter', () => {
    const options: SourceSummaryOptions = {
      title: 'Test Source',
      keyPoints: ['Test'],
    };
    
    const page = generateSourceSummaryPage(options);
    
    const parsed = parseFrontmatter(page.content);
    expect(parsed.frontmatter.title).toBe('Test Source');
    expect(parsed.frontmatter.type).toBe('source');
  });
  
  it('should handle all source types', () => {
    const types: Array<'article' | 'paper' | 'code' | 'note'> = ['article', 'paper', 'code', 'note'];
    
    for (const sourceType of types) {
      const options: SourceSummaryOptions = {
        title: `Test ${sourceType}`,
        sourceType,
        keyPoints: ['Test'],
      };
      
      const page = generateSourceSummaryPage(options);
      expect(page.content).toContain(`**Type**: ${sourceType}`);
    }
  });
});

describe('Cross-page consistency', () => {
  it('should generate consistent frontmatter structure across page types', () => {
    const entity = generateEntityPage({
      name: 'Test Entity',
      definition: 'Test',
    });
    
    const concept = generateConceptPage({
      name: 'Test Concept',
      explanation: 'Test',
    });
    
    const source = generateSourceSummaryPage({
      title: 'Test Source',
      keyPoints: ['Test'],
    });
    
    // All should have required frontmatter fields
    expect(entity.frontmatter.title).toBeDefined();
    expect(entity.frontmatter.type).toBe('entity');
    expect(entity.frontmatter.created).toBeDefined();
    expect(entity.frontmatter.updated).toBeDefined();
    
    expect(concept.frontmatter.title).toBeDefined();
    expect(concept.frontmatter.type).toBe('concept');
    expect(concept.frontmatter.created).toBeDefined();
    expect(concept.frontmatter.updated).toBeDefined();
    
    expect(source.frontmatter.title).toBeDefined();
    expect(source.frontmatter.type).toBe('source');
    expect(source.frontmatter.created).toBeDefined();
    expect(source.frontmatter.updated).toBeDefined();
  });
  
  it('should generate valid markdown for all page types', () => {
    const entity = generateEntityPage({
      name: 'Test Entity',
      definition: 'Test',
    });
    
    const concept = generateConceptPage({
      name: 'Test Concept',
      explanation: 'Test',
    });
    
    const source = generateSourceSummaryPage({
      title: 'Test Source',
      keyPoints: ['Test'],
    });
    
    // All should start with frontmatter
    expect(entity.content).toMatch(/^---\n/);
    expect(concept.content).toMatch(/^---\n/);
    expect(source.content).toMatch(/^---\n/);
    
    // All should have title heading
    expect(entity.content).toContain('# Test Entity');
    expect(concept.content).toContain('# Test Concept');
    expect(source.content).toContain('# Test Source');
  });
});
