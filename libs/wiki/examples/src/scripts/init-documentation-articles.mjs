#!/usr/bin/env node
/**
 * Documentation Articles Initialization Script
 *
 * Generates 3 documentation article sources demonstrating technical documentation:
 * - Angular CDK Accessibility Guide
 * - React Hooks API Reference
 * - Vue Composition API Documentation
 *
 * Run with: npm run init:articles-docs
 * or: node libs/wiki/examples/src/scripts/init-documentation-articles.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { getTargetWordCount, expandItemsArray, countWords } from './content-length-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../../../..');
const wikiDir = join(workspaceRoot, 'wiki');
const sourcesDir = join(wikiDir, 'sources');

/**
 * Converts a title to a kebab-case filename with date suffix
 */
function generateFilename(title, date) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-article-${date}.md`;
}

/**
 * Generates markdown content for a source page
 */
function generateSourcePage(options) {
  const {
    title,
    url,
    keyPoints = [],
    insights,
    relevantEntities = [],
    relevantConcepts = [],
    tags = [],
    date,
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  const frontmatter = {
    title,
    type: 'source',
    url,
    tags,
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${title}\n\n`;
  
  content += `## Metadata\n\n`;
  content += `This documentation article provides comprehensive technical guidance from the official ${title.split(' ')[0]} documentation. `;
  content += `Published at [${url}](${url}), it serves as an authoritative reference for developers implementing `;
  content += `${relevantConcepts[0] || 'core features'} in production applications.\n\n`;

  if (keyPoints.length > 0) {
    content += `## Key Points\n\n`;
    keyPoints.forEach(point => {
      content += `- ${point}\n`;
    });
    content += '\n';
  }

  if (insights) {
    content += `## Insights\n\n${insights}\n\n`;
  }

  if (relevantEntities.length > 0 || relevantConcepts.length > 0) {
    content += `## Related Topics\n\n`;
    
    if (relevantEntities.length > 0) {
      content += `**Entities:** `;
      content += relevantEntities.map(entity => `[[${entity}]]`).join(', ');
      content += '\n\n';
    }
    
    if (relevantConcepts.length > 0) {
      content += `**Concepts:** `;
      content += relevantConcepts.map(concept => `[[${concept}]]`).join(', ');
      content += '\n\n';
    }
  }

  return {
    content: content.trim() + '\n',
    filename: generateFilename(title, date),
  };
}

const DOCUMENTATION_ARTICLES = [
  {
    title: 'Angular CDK Accessibility Guide',
    url: 'https://material.angular.io/cdk/a11y/overview',
    date: '2024-01-15',
    keyPoints: [
      'FocusTrap directive manages keyboard focus within modal dialogs and dropdown menus',
      'LiveAnnouncer service provides screen reader notifications for dynamic content changes',
      'A11yModule offers focus management, keyboard navigation, and high contrast mode detection',
      'ListKeyManager enables accessible keyboard navigation for list-based components'
    ],
    insights: `The Angular CDK accessibility module provides a comprehensive set of tools for building WCAG-compliant user interfaces. By abstracting complex accessibility patterns into reusable utilities, it enables developers to implement keyboard navigation, focus management, and screen reader support without deep accessibility expertise. The module's focus on composability allows teams to integrate accessibility features incrementally while maintaining consistent behavior across components.`,
    relevantEntities: ['Angular CDK', 'Angular'],
    relevantConcepts: ['Web Accessibility', 'Focus Management'],
    tags: ['angular', 'accessibility', 'documentation', 'cdk']
  },
  {
    title: 'React Hooks API Reference',
    url: 'https://react.dev/reference/react/hooks',
    date: '2024-02-20',
    keyPoints: [
      'useState hook manages component state without class components',
      'useEffect hook handles side effects with cleanup functions for subscriptions',
      'useContext hook accesses React context values without prop drilling',
      'Custom hooks enable reusable stateful logic across components',
      'Hook rules require hooks to be called at the top level and only in function components'
    ],
    insights: `React Hooks revolutionized component architecture by enabling stateful logic in function components. The hooks API provides a more composable alternative to class lifecycle methods, allowing developers to extract and share stateful behavior through custom hooks. This pattern reduces boilerplate, improves code reuse, and makes component logic more testable. Understanding hook dependencies and cleanup patterns is essential for preventing memory leaks and unnecessary re-renders in complex applications.`,
    relevantEntities: ['React', 'JavaScript'],
    relevantConcepts: ['Component Architecture', 'State Management'],
    tags: ['react', 'hooks', 'documentation', 'javascript']
  },
  {
    title: 'Vue Composition API Documentation',
    url: 'https://vuejs.org/guide/extras/composition-api-faq.html',
    date: '2024-03-10',
    keyPoints: [
      'Composition API provides better code organization for large components',
      'ref() and reactive() create reactive state with automatic dependency tracking',
      'Composables enable reusable stateful logic similar to React hooks',
      'setup() function serves as the entry point for Composition API usage',
      'TypeScript support is significantly improved compared to Options API'
    ],
    insights: `The Vue Composition API addresses scalability challenges in large Vue applications by providing a more flexible way to organize component logic. Unlike the Options API, which groups code by option type, the Composition API allows grouping by logical concern, making it easier to extract and reuse functionality. The API's explicit reactivity system and improved TypeScript integration make it particularly well-suited for complex enterprise applications. While the Options API remains fully supported, the Composition API offers better code reuse and type inference for teams building sophisticated user interfaces.`,
    relevantEntities: ['Vue', 'TypeScript'],
    relevantConcepts: ['Reactive Programming', 'Component Architecture'],
    tags: ['vue', 'composition-api', 'documentation', 'typescript']
  }
];

async function main() {
  console.log('Documentation Articles Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure sources directory exists
  if (!existsSync(sourcesDir)) {
    mkdirSync(sourcesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const articleOptions of DOCUMENTATION_ARTICLES) {
    try {
      const result = generateSourcePage(articleOptions);
      const outputPath = join(sourcesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/sources/${result.filename}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${articleOptions.title}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created:  ${successCount} source articles`);
  if (errorCount > 0) {
    console.log(`Failed:   ${errorCount} source articles`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all documentation article sources');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
