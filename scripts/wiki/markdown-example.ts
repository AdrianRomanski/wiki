/**
 * Example usage of markdown utilities.
 * 
 * This file demonstrates how to use the markdown utilities
 * for parsing, extracting links, and generating markdown content.
 */

import {
  parseMarkdownSections,
  extractWikiLinks,
  generateWikiLink,
  generateHeading,
  generateList,
  generateCodeBlock,
  sectionsToMarkdown
} from './markdown';

// Example 1: Parse markdown into sections
const exampleMarkdown = `# Angular Aria

Angular Aria is a library for building accessible Angular applications.

## Key Features

- Keyboard navigation
- Screen reader support
- ARIA attributes

## Getting Started

Install the package:

\`\`\`bash
npm install @angular/aria
\`\`\`

See [[Installation Guide]] for details.

### Basic Usage

Import the module in your component.
`;

console.log('=== Example 1: Parsing Markdown ===');
const sections = parseMarkdownSections(exampleMarkdown);
console.log(`Found ${sections.length} top-level sections`);
console.log(`First section: "${sections[0].heading}" with ${sections[0].subsections.length} subsections`);

// Example 2: Extract wiki links
console.log('\n=== Example 2: Extracting Wiki Links ===');
const links = extractWikiLinks(exampleMarkdown);
console.log(`Found ${links.length} wiki links:`, links);

// Example 3: Generate a wiki page
console.log('\n=== Example 3: Generating Wiki Page ===');

const wikiPage = [
  generateHeading('Entity: Angular CDK', 1),
  '',
  '## Definition',
  '',
  'The Angular Component Dev Kit (CDK) provides tools for building accessible components.',
  '',
  '## Related Concepts',
  '',
  generateList([
    generateWikiLink('Accessibility'),
    generateWikiLink('ARIA Attributes'),
    generateWikiLink('Keyboard Navigation')
  ]),
  '',
  '## Example',
  '',
  generateCodeBlock(
    `import { A11yModule } from '@angular/cdk/a11y';

@Component({
  standalone: true,
  imports: [A11yModule]
})
export class MyComponent {}`,
    'typescript'
  )
].join('\n');

console.log(wikiPage);

// Example 4: Round-trip conversion
console.log('\n=== Example 4: Round-trip Conversion ===');
const parsedSections = parseMarkdownSections(wikiPage);
const regenerated = sectionsToMarkdown(parsedSections);
console.log('Successfully converted markdown → sections → markdown');
console.log(`Original length: ${wikiPage.length}, Regenerated length: ${regenerated.length}`);
