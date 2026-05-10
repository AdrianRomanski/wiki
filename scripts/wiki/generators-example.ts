/**
 * Example usage of wiki page generators.
 * 
 * This file demonstrates how to use the generator functions to create
 * entity pages, concept pages, and source summaries.
 */

import {
  generateEntityPage,
  generateConceptPage,
  generateSourceSummaryPage,
} from './generators.js';

// Example 1: Generate an entity page for Angular CDK
console.log('=== Entity Page Example ===\n');

const entityPage = generateEntityPage({
  name: 'Angular CDK',
  definition: 'The Angular Component Dev Kit (CDK) is a set of behavior primitives for building UI components.',
  properties: [
    'Provides accessibility utilities (a11y module)',
    'Includes layout helpers (layout module)',
    'Offers drag-and-drop functionality',
    'Supports overlay positioning',
  ],
  relationships: [
    { target: 'Angular Material', description: 'Used in' },
    { target: 'Accessibility', description: 'Implements' },
    { target: 'ARIA', description: 'Related to' },
  ],
  examples: [
    '```typescript\nimport { A11yModule } from "@angular/cdk/a11y";\n\n@Component({\n  imports: [A11yModule],\n  // ...\n})\nexport class MyComponent {}\n```',
  ],
  tags: ['angular', 'accessibility', 'component-library', 'cdk'],
  sources: ['angular-cdk-docs-2024-05-10'],
});

console.log('Filename:', entityPage.filename);
console.log('\nContent:\n');
console.log(entityPage.content);
console.log('\n');

// Example 2: Generate a concept page for Progressive Enhancement
console.log('=== Concept Page Example ===\n');

const conceptPage = generateConceptPage({
  name: 'Progressive Enhancement',
  explanation: 'Progressive enhancement is a design philosophy that provides a baseline experience to all users while enhancing the experience for users with more capable browsers. It starts with semantic HTML, adds CSS for presentation, and finally adds JavaScript for interactivity.',
  applications: [
    'Building accessible web applications',
    'Ensuring functionality without JavaScript',
    'Supporting older browsers and devices',
    'Improving performance on slow connections',
  ],
  relatedConcepts: [
    'Graceful Degradation',
    'Accessibility',
    'Semantic HTML',
    'Mobile First Design',
  ],
  examples: [
    'Start with a semantic HTML form that works without JavaScript:',
    '```html\n<form action="/submit" method="POST">\n  <input type="text" name="email" required>\n  <button type="submit">Submit</button>\n</form>\n```',
    'Then enhance with JavaScript for better UX:',
    '```typescript\nform.addEventListener("submit", async (e) => {\n  e.preventDefault();\n  // AJAX submission with loading state\n});\n```',
  ],
  tags: ['web-development', 'accessibility', 'design-pattern', 'best-practice'],
  sources: ['progressive-enhancement-guide-2024-03-15'],
});

console.log('Filename:', conceptPage.filename);
console.log('\nContent:\n');
console.log(conceptPage.content);
console.log('\n');

// Example 3: Generate a source summary page
console.log('=== Source Summary Page Example ===\n');

const sourcePage = generateSourceSummaryPage({
  title: 'Angular ARIA Guide',
  author: 'Angular Team',
  date: '2024-05-10',
  url: 'https://angular.dev/guide/accessibility',
  sourceType: 'article',
  rawSourcePath: 'raw/articles/angular-aria-guide.md',
  keyPoints: [
    'Angular provides built-in accessibility features through the CDK',
    'Use semantic HTML elements as the foundation',
    'Test with screen readers (NVDA, JAWS, VoiceOver)',
    'Implement keyboard navigation for all interactive elements',
    'Use ARIA attributes only when semantic HTML is insufficient',
  ],
  insights: 'The guide emphasizes that accessibility should be built in from the start, not added as an afterthought. Semantic HTML provides the foundation, and ARIA should only be used to fill gaps where semantic HTML falls short. The Angular CDK provides utilities that make implementing accessible patterns easier.',
  relevantEntities: [
    'Angular CDK',
    'ARIA',
    'Screen Reader',
  ],
  relevantConcepts: [
    'Accessibility',
    'Semantic HTML',
    'Keyboard Navigation',
    'Progressive Enhancement',
  ],
  quotes: [
    'Accessibility is not optional - it\'s a fundamental requirement for modern web applications.',
    'Start with semantic HTML, enhance with ARIA only when necessary.',
    'Test early and test often with real assistive technologies.',
  ],
  tags: ['angular', 'accessibility', 'guide', 'aria', 'best-practice'],
});

console.log('Filename:', sourcePage.filename);
console.log('\nContent:\n');
console.log(sourcePage.content);
console.log('\n');

// Example 4: Minimal pages
console.log('=== Minimal Page Examples ===\n');

const minimalEntity = generateEntityPage({
  name: 'Focus Trap',
  definition: 'A focus trap is a technique that keeps keyboard focus within a specific element, commonly used in modals and dialogs.',
});

console.log('Minimal Entity Filename:', minimalEntity.filename);
console.log('Has Definition section:', minimalEntity.content.includes('## Definition'));
console.log('Has optional sections:', minimalEntity.content.includes('## Properties'));
console.log('\n');

const minimalConcept = generateConceptPage({
  name: 'Keyboard Navigation',
  explanation: 'Keyboard navigation allows users to interact with a website using only keyboard inputs, essential for accessibility.',
});

console.log('Minimal Concept Filename:', minimalConcept.filename);
console.log('Has Explanation section:', minimalConcept.content.includes('## Explanation'));
console.log('Has optional sections:', minimalConcept.content.includes('## Applications'));
console.log('\n');

const minimalSource = generateSourceSummaryPage({
  title: 'Quick Research Note',
  keyPoints: [
    'Point 1: Important finding',
    'Point 2: Another insight',
  ],
});

console.log('Minimal Source Filename:', minimalSource.filename);
console.log('Has Key Points section:', minimalSource.content.includes('## Key Points'));
console.log('Has optional sections:', minimalSource.content.includes('## Insights'));
