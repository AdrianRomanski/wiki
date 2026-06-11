#!/usr/bin/env node
/**
 * Blog Articles Initialization Script
 *
 * Generates 3 blog article source pages demonstrating technical writing:
 * - Building Accessible Components with Angular CDK
 * - Reactive State Management Patterns in Modern Web Applications
 * - Performance Optimization Strategies for Single Page Applications
 *
 * Run with: npm run init:articles-blog
 * or: node libs/wiki/examples/src/scripts/init-blog-articles.mjs
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
 * Converts a title and date to a kebab-case filename with date suffix
 */
function generateFilename(title, date) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-article-${date}.md`;
}

/**
 * Generates markdown content for a source page with target word count
 */
function generateSourcePage(options, pageIndex) {
  const {
    title,
    author,
    date,
    keyPoints = [],
    insights = '',
    relevantEntities = [],
    relevantConcepts = [],
    tags = [],
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  // Get target word count range for this page (offset by previous scripts: 9 pages)
  const { min, max } = getTargetWordCount(pageIndex + 9, 35);
  
  // Expand key points to meet word count target
  const expandedKeyPoints = expandItemsArray(keyPoints, min * 0.5, max * 0.5, 'keypoints');
  
  const frontmatter = {
    title,
    type: 'source',
    author,
    date,
    tags,
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${title}\n\n`;
  
  content += `## Metadata\n\n`;
  content += `This blog article by ${author}, published on ${date}, explores practical techniques and patterns for modern web development. `;
  content += `The article provides hands-on examples and real-world insights that demonstrate effective approaches to building robust applications.\n\n`;

  if (expandedKeyPoints.length > 0) {
    content += `## Key Points\n\n`;
    expandedKeyPoints.forEach(point => {
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
      content += `**Technologies and Libraries:**\n`;
      relevantEntities.forEach(entity => {
        content += `- [[${entity}]]\n`;
      });
      content += '\n';
    }
    
    if (relevantConcepts.length > 0) {
      content += `**Concepts and Patterns:**\n`;
      relevantConcepts.forEach(concept => {
        content += `- [[${concept}]]\n`;
      });
      content += '\n';
    }
  }

  return {
    content: content.trim() + '\n',
    filename: generateFilename(title, date),
  };
}

const BLOG_ARTICLES = [
  {
    title: 'Building Accessible Components with Angular CDK',
    author: 'Sarah Chen',
    date: '2024-03-15',
    keyPoints: [
      'FocusTrap manages keyboard focus within modal dialogs and overlays to prevent focus from escaping',
      'LiveAnnouncer provides screen reader notifications for dynamic content changes without disrupting user flow',
      'A11yModule offers comprehensive accessibility utilities including focus monitors and high contrast mode detection',
      'CDK accessibility primitives integrate seamlessly with Material Design components while remaining framework-agnostic',
      'Keyboard navigation patterns can be implemented using FocusKeyManager for managing focus within lists and menus'
    ],
    insights: `Angular CDK's accessibility primitives provide a solid foundation for building inclusive user interfaces. The library abstracts complex accessibility patterns into reusable utilities that handle edge cases developers often miss. FocusTrap and LiveAnnouncer work together to create experiences that are both keyboard-friendly and screen reader compatible. By leveraging these primitives early in the development cycle, teams can avoid costly accessibility retrofits and ensure compliance with WCAG standards from the start. The key insight is that accessibility should be built into components at the architecture level, not added as an afterthought.`,
    relevantEntities: ['Angular CDK', 'Angular'],
    relevantConcepts: ['Web Accessibility', 'Focus Management'],
    tags: ['angular', 'accessibility', 'web-components', 'cdk']
  },
  {
    title: 'Reactive State Management Patterns in Modern Web Applications',
    author: 'Marcus Rodriguez',
    date: '2024-07-22',
    keyPoints: [
      'RxJS operators like switchMap and debounceTime enable declarative handling of asynchronous state transitions',
      'Unidirectional data flow prevents state mutation bugs by enforcing a single source of truth',
      'Component state should be derived from application state rather than duplicated across multiple locations',
      'Effect patterns separate side effects from pure state transformations for better testability',
      'State selectors with memoization optimize re-render performance by caching computed values'
    ],
    insights: `Reactive state management transforms how we reason about application data flow. Instead of imperatively updating variables, we model state as streams of events that flow through transformation pipelines. This approach naturally handles complex scenarios like cancellation, retry logic, and concurrent requests without explicit coordination code. The pattern shines when dealing with real-time data, user interactions, and API calls that need to be debounced or throttled. Teams adopting reactive patterns report fewer race conditions and more predictable state behavior across their applications.`,
    relevantEntities: ['RxJS', 'React', 'Vue'],
    relevantConcepts: ['Reactive Programming', 'State Management'],
    tags: ['state-management', 'rxjs', 'reactive', 'patterns']
  },
  {
    title: 'Performance Optimization Strategies for Single Page Applications',
    author: 'Elena Kowalski',
    date: '2024-11-08',
    keyPoints: [
      'Code splitting with dynamic imports reduces initial bundle size by loading features on demand',
      'Tree shaking eliminates unused code at build time when combined with ES modules and proper side effect annotations',
      'Virtual scrolling renders only visible items in long lists to minimize DOM nodes and improve paint performance',
      'Lazy loading images and components improves perceived performance by prioritizing above-the-fold content',
      'Service worker caching strategies enable offline functionality and instant subsequent page loads',
      'Performance budgets enforce size constraints during CI/CD to prevent regression'
    ],
    insights: `Performance optimization is a continuous process that requires measurement and monitoring at every stage. The most effective optimizations start with understanding the critical rendering path and identifying bottlenecks through real user metrics. Code splitting should be applied strategically at route boundaries and for heavy dependencies, not indiscriminately across every component. Virtual scrolling is essential for data-heavy applications but adds complexity that should be justified by actual performance needs. The key insight is that premature optimization wastes time, but architectural decisions made early significantly impact optimization potential later. Teams should establish performance budgets early and treat them as hard requirements during code review.`,
    relevantEntities: ['React', 'Vue', 'Svelte'],
    relevantConcepts: ['Performance Optimization', 'Code Splitting', 'Lazy Loading'],
    tags: ['performance', 'optimization', 'spa', 'javascript', 'web-development']
  }
];

async function main() {
  console.log('Blog Articles Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure sources directory exists
  if (!existsSync(sourcesDir)) {
    mkdirSync(sourcesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < BLOG_ARTICLES.length; i++) {
    const articleOptions = BLOG_ARTICLES[i];
    try {
      const result = generateSourcePage(articleOptions, i);
      const outputPath = join(sourcesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      
      // Count words in body content (excluding frontmatter)
      const bodyContent = result.content.split('---\n')[2] || '';
      const wordCount = countWords(bodyContent);
      
      console.log(`✓ Created: wiki/sources/${result.filename} (${wordCount} words)`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${articleOptions.title}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created:  ${successCount} articles`);
  if (errorCount > 0) {
    console.log(`Failed:   ${errorCount} articles`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all blog article sources');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
