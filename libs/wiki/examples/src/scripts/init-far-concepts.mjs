#!/usr/bin/env node
/**
 * Far Concepts Initialization Script
 *
 * Generates 4 concept pages from different domains demonstrating cross-domain relationships:
 * - Dependency Injection (Architecture domain)
 * - Test-Driven Development (Testing domain)
 * - Reactive Programming (Programming Paradigm domain)
 * - Performance Optimization (Performance domain)
 *
 * Each concept references concepts from different domains, demonstrating unexpected
 * connections and cross-disciplinary relationships.
 *
 * Run with: npm run init:far-concepts
 * or: node libs/wiki/examples/src/scripts/init-far-concepts.mjs
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
const conceptsDir = join(wikiDir, 'concepts');

/**
 * Converts a title to a kebab-case filename
 */
function generateFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.md';
}

/**
 * Generates markdown content for a concept page
 */
function generateConceptPage(options) {
  const {
    name,
    explanation,
    principles = [],
    applications = [],
    relatedConcepts = [],
    examples = [],
    tags = [],
    sources = [],
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  const frontmatter = {
    title: name,
    type: 'concept',
    tags,
    ...(sources.length > 0 ? { sources } : {}),
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${name}\n\n`;
  content += `## Explanation\n\n${explanation}\n\n`;

  if (principles.length > 0) {
    content += `## Key Principles\n\n`;
    principles.forEach(principle => {
      content += `- ${principle}\n`;
    });
    content += '\n';
  }

  if (applications.length > 0) {
    content += `## Applications\n\n`;
    applications.forEach(app => {
      content += `- ${app}\n`;
    });
    content += '\n';
  }

  if (relatedConcepts.length > 0) {
    content += `## Related Concepts\n\n`;
    relatedConcepts.forEach(concept => {
      content += `- [[${concept}]]\n`;
    });
    content += '\n';
  }

  if (examples.length > 0) {
    content += `## Examples\n\n`;
    examples.forEach(example => {
      content += `${example}\n\n`;
    });
  }

  if (sources.length > 0) {
    content += `## References\n\n`;
    sources.forEach(source => {
      content += `- [[${source}]]\n`;
    });
    content += '\n';
  }

  return {
    content: content.trim() + '\n',
    filename: generateFilename(name),
  };
}

const FAR_CONCEPTS = [
  {
    name: 'Dependency Injection',
    explanation: 'Dependency Injection is a design pattern where objects receive their dependencies from external sources rather than creating them internally. This pattern promotes loose coupling between components by inverting the control of dependency creation and management. It enables better testability because dependencies can be easily mocked or stubbed during testing, making it a fundamental technique that bridges architecture and testing practices.',
    principles: [
      'Inversion of Control transfers dependency management to external containers',
      'Loose coupling between components through interface-based dependencies',
      'Constructor injection makes dependencies explicit and immutable'
    ],
    applications: [
      'Framework design where containers manage object lifecycles and wiring',
      'Unit testing by injecting mock implementations of dependencies',
      'Configuration management through environment-specific dependency injection',
      'Plugin architectures where implementations are swapped at runtime'
    ],
    relatedConcepts: [
      'Test-Driven Development',
      'Modular Architecture',
      'Interface Segregation'
    ],
    examples: [
      'A UserService class receives a DatabaseConnection through its constructor instead of creating it internally, allowing tests to inject a mock database',
      'Angular services use @Injectable() decorator and constructor parameters to declare dependencies resolved by the framework\'s injector'
    ],
    tags: ['architecture', 'design-pattern', 'dependency-management']
  },
  {
    name: 'Test-Driven Development',
    explanation: 'Test-Driven Development (TDD) is a software development methodology where tests are written before the implementation code. The cycle follows "Red-Green-Refactor": write a failing test, write minimal code to make it pass, then refactor. This approach ensures code is testable by design and naturally integrates with architectural patterns like dependency injection that facilitate testing.',
    principles: [
      'Write tests first to clarify requirements before implementation',
      'Minimal implementation to pass tests prevents over-engineering',
      'Refactor with confidence knowing tests protect against regressions'
    ],
    applications: [
      'API development where tests define expected contract before implementation',
      'Legacy code refactoring with tests as safety nets',
      'Exploratory programming to understand problem domain through test cases',
      'Continuous integration pipelines that rely on comprehensive test suites'
    ],
    relatedConcepts: [
      'Dependency Injection',
      'Unit Testing',
      'Continuous Integration'
    ],
    examples: [
      'Writing a test for a calculateDiscount() function that expects 10% off for orders over $100, then implementing the function to satisfy the test',
      'Red-Green-Refactor cycle: failing test for user authentication → minimal implementation → refactor to extract password hashing logic'
    ],
    tags: ['testing', 'methodology', 'software-development']
  },
  {
    name: 'Reactive Programming',
    explanation: 'Reactive Programming is a declarative programming paradigm focused on data streams and the propagation of change. Systems react to events and data updates automatically through observable streams and operators. This paradigm connects to performance optimization through efficient change detection and to UI frameworks through automatic view updates.',
    principles: [
      'Asynchronous data streams as first-class citizens',
      'Declarative composition of data transformations through operators',
      'Automatic propagation of changes through observer pattern',
      'Backpressure handling to prevent overwhelming consumers'
    ],
    applications: [
      'Real-time user interfaces that react to user input and data changes',
      'Event-driven architectures processing streams of domain events',
      'Data synchronization between client and server',
      'Complex asynchronous workflows composed from simple operators'
    ],
    relatedConcepts: [
      'Performance Optimization',
      'Event-Driven Architecture',
      'Functional Programming'
    ],
    examples: [
      'RxJS observable stream: fromEvent(button, "click").pipe(debounceTime(300)).subscribe(saveData) debounces rapid clicks',
      'Angular signals automatically re-render components when reactive state changes, eliminating manual change detection'
    ],
    tags: ['programming-paradigm', 'async', 'data-streams']
  },
  {
    name: 'Performance Optimization',
    explanation: 'Performance Optimization encompasses techniques and strategies to improve software speed, efficiency, and resource utilization. It involves identifying bottlenecks through profiling, applying targeted optimizations, and measuring improvements. Performance work intersects with reactive programming through efficient change detection and with architecture through system-level optimizations.',
    principles: [
      'Measure before optimizing to identify actual bottlenecks',
      'Optimize the critical path first for maximum impact',
      'Balance performance gains against code complexity',
      'Consider trade-offs between time, space, and maintainability'
    ],
    applications: [
      'Web application optimization through bundle size reduction and lazy loading',
      'Database query optimization with indexing and query planning',
      'Algorithm selection based on time and space complexity analysis',
      'Caching strategies to reduce redundant computation and network requests'
    ],
    relatedConcepts: [
      'Reactive Programming',
      'Lazy Loading',
      'Memoization'
    ],
    examples: [
      'Virtual scrolling renders only visible DOM elements instead of the entire list, reducing memory and rendering time for large datasets',
      'React.memo() prevents unnecessary re-renders by memoizing component output when props haven\'t changed'
    ],
    tags: ['performance', 'optimization', 'efficiency']
  }
];

async function main() {
  console.log('Far Concepts Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure concepts directory exists
  if (!existsSync(conceptsDir)) {
    mkdirSync(conceptsDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const conceptOptions of FAR_CONCEPTS) {
    try {
      const result = generateConceptPage(conceptOptions);
      const outputPath = join(conceptsDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log(`✓ Created: wiki/concepts/${result.filename}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${conceptOptions.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created:  ${successCount} concepts`);
  if (errorCount > 0) {
    console.log(`Failed:   ${errorCount} concepts`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all far concept pages');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
