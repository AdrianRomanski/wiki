#!/usr/bin/env node
/**
 * Backend Libraries Initialization Script
 *
 * Generates 3 backend library entities demonstrating Node.js frameworks:
 * - NestJS: Progressive Node.js framework with TypeScript-first approach
 * - Express: Minimalist web framework for Node.js
 * - Fastify: Fast and low overhead web framework for Node.js
 *
 * Run with: npm run init:backend-libs
 * or: node libs/wiki/examples/src/scripts/init-backend-libraries.mjs
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
const entitiesDir = join(wikiDir, 'entities');

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
 * Generates markdown content for an entity page with target word count
 */
function generateEntityPage(options, pageIndex, totalPages) {
  const {
    name,
    definition,
    properties = [],
    relationships = [],
    examples = [],
    tags = [],
    sources = [],
  } = options;

  const today = new Date().toISOString().split('T')[0];
  
  // Get target word count range for this page (offset by frontend pages)
  const { min, max } = getTargetWordCount(pageIndex + 3, 35);
  
  // Expand properties and examples to meet word count target
  const expandedProperties = expandItemsArray(properties, min * 0.4, max * 0.4, 'properties');
  const expandedExamples = expandItemsArray(examples, min * 0.3, max * 0.3, 'examples');
  
  const frontmatter = {
    title: name,
    type: 'entity',
    tags,
    ...(sources.length > 0 ? { sources } : {}),
    created: today,
    updated: today,
  };

  let content = '---\n';
  content += yaml.stringify(frontmatter);
  content += '---\n\n';
  content += `# ${name}\n\n`;
  content += `## Definition\n\n${definition}\n\n`;

  if (expandedProperties.length > 0) {
    content += `## Properties\n\n`;
    expandedProperties.forEach(prop => {
      content += `- ${prop}\n`;
    });
    content += '\n';
  }

  if (relationships.length > 0) {
    content += `## Relationships\n\n`;
    relationships.forEach(rel => {
      content += `- ${rel.description} [[${rel.target}]]\n`;
    });
    content += '\n';
  }

  if (expandedExamples.length > 0) {
    content += `## Examples\n\n`;
    expandedExamples.forEach(example => {
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

const BACKEND_LIBRARIES = [
  {
    name: 'NestJS',
    definition: 'A progressive Node.js framework for building efficient, reliable and scalable server-side applications with TypeScript-first approach',
    properties: [
      'TypeScript-first development with full type safety',
      'Modular architecture with dependency injection',
      'Built-in support for GraphQL and REST APIs',
      'Integration with Express or Fastify as underlying HTTP server',
      'Decorator-based programming model inspired by Angular'
    ],
    relationships: [
      { target: 'Dependency Injection', description: 'Implements' },
      { target: 'Modular Architecture', description: 'Follows' },
      { target: 'TypeScript', description: 'Built with' },
      { target: 'Node.js', description: 'Runs on' }
    ],
    examples: [
      '@Injectable() decorator marks classes as providers that can be injected into controllers and other services',
      '@Module() decorator defines the application structure with imports, controllers, and providers organized into cohesive units'
    ],
    tags: ['backend', 'nodejs', 'framework', 'typescript']
  },
  {
    name: 'Express',
    definition: 'A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications',
    properties: [
      'Minimalist and unopinionated framework design',
      'Robust routing with middleware support',
      'HTTP utility methods for building RESTful APIs',
      'Runs on Node.js runtime environment',
      'Extensive ecosystem with thousands of middleware packages'
    ],
    relationships: [
      { target: 'Middleware Pattern', description: 'Uses' },
      { target: 'REST API', description: 'Enables' },
      { target: 'Node.js', description: 'Runs on' },
      { target: 'HTTP Protocol', description: 'Implements' }
    ],
    examples: [
      'app.use() method chains middleware functions that have access to request and response objects',
      'app.get("/users/:id", handler) defines route parameters for dynamic URL segments in RESTful endpoints'
    ],
    tags: ['backend', 'nodejs', 'framework', 'javascript']
  },
  {
    name: 'Fastify',
    definition: 'A fast and low overhead web framework for Node.js focused on providing the best developer experience with performance as a priority',
    properties: [
      'High performance with low overhead compared to alternatives',
      'Schema-based request and response validation with JSON Schema',
      'Plugin architecture for extensibility',
      'Runs on Node.js with async/await support',
      'Built-in logging with Pino for production-grade diagnostics'
    ],
    relationships: [
      { target: 'Performance Optimization', description: 'Focuses on' },
      { target: 'Plugin Architecture', description: 'Uses' },
      { target: 'Node.js', description: 'Runs on' },
      { target: 'JSON Schema', description: 'Validates with' }
    ],
    examples: [
      'fastify.register() loads plugins with encapsulation ensuring plugin-scoped decorators and hooks',
      'Schema validation with preValidation hook ensures type-safe request handling before route handlers execute'
    ],
    tags: ['backend', 'nodejs', 'framework', 'javascript', 'performance']
  }
];

async function main() {
  console.log('Backend Libraries Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure entities directory exists
  if (!existsSync(entitiesDir)) {
    mkdirSync(entitiesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < BACKEND_LIBRARIES.length; i++) {
    const libraryOptions = BACKEND_LIBRARIES[i];
    try {
      const result = generateEntityPage(libraryOptions, i, BACKEND_LIBRARIES.length);
      const outputPath = join(entitiesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      
      // Count words in body content (excluding frontmatter)
      const bodyContent = result.content.split('---\n')[2] || '';
      const wordCount = countWords(bodyContent);
      
      console.log(`✓ Created: wiki/entities/${result.filename} (${wordCount} words)`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to create ${libraryOptions.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Created:  ${successCount} entities`);
  if (errorCount > 0) {
    console.log(`Failed:   ${errorCount} entities`);
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all backend library entities');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
