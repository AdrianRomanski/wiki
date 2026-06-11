#!/usr/bin/env node
/**
 * Testing Libraries Initialization Script
 *
 * Generates 3 testing library entities demonstrating test runners and frameworks:
 * - Vitest: Blazing fast unit test framework powered by Vite
 * - Jest: Delightful JavaScript testing framework
 * - Playwright: End-to-end testing framework for modern web apps
 *
 * Run with: npm run init:testing-libs
 * or: node libs/wiki/examples/src/scripts/init-testing-libraries.mjs
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
function generateEntityPage(options, pageIndex) {
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
  
  // Get target word count range for this page (offset by previous scripts: 6 pages)
  const { min, max } = getTargetWordCount(pageIndex + 6, 35);
  
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

const TESTING_LIBRARIES = [
  {
    name: 'Vitest',
    definition: 'A blazing fast unit test framework powered by Vite with a Jest-compatible API and native ESM support',
    properties: [
      'Vite-native test runner with instant HMR for test files',
      'Jest-compatible API for easy migration from existing test suites',
      'ESM-first architecture with native TypeScript support',
      'Watch mode with smart re-run based on changed files',
      'Built-in code coverage via c8 without additional configuration'
    ],
    relationships: [
      { target: 'Unit Testing', description: 'Enables' },
      { target: 'Test-Driven Development', description: 'Supports' },
      { target: 'Vite', description: 'Built on' },
      { target: 'Code Coverage', description: 'Provides' }
    ],
    examples: [
      'describe() and test() functions organize test suites with the same API as Jest for zero-friction adoption',
      'expect() assertions with matchers like toEqual(), toBeTruthy(), and toHaveBeenCalled() validate test conditions declaratively'
    ],
    tags: ['testing', 'unit-testing', 'javascript', 'vite', 'test-runner']
  },
  {
    name: 'Jest',
    definition: 'A delightful JavaScript testing framework with a focus on simplicity, providing a complete testing solution out of the box',
    properties: [
      'Zero-configuration setup for most JavaScript projects',
      'Built-in assertion library with rich matcher API',
      'Snapshot testing for tracking component output over time',
      'Powerful mocking capabilities for isolating code under test',
      'Parallel test execution for fast feedback loops'
    ],
    relationships: [
      { target: 'Unit Testing', description: 'Enables' },
      { target: 'Test-Driven Development', description: 'Supports' },
      { target: 'Snapshot Testing', description: 'Pioneered' },
      { target: 'Mocking', description: 'Provides' }
    ],
    examples: [
      'jest.fn() creates mock functions that record calls and arguments for verification in tests',
      'toMatchSnapshot() assertion captures component output and detects unintended changes across test runs'
    ],
    tags: ['testing', 'unit-testing', 'javascript', 'test-runner']
  },
  {
    name: 'Playwright',
    definition: 'A modern end-to-end testing framework for web applications that enables reliable testing across all major browsers with a single API',
    properties: [
      'Cross-browser testing support for Chromium, Firefox, and WebKit',
      'Auto-wait for elements to be actionable before performing actions',
      'Network interception and mocking for controlling backend responses',
      'Parallel test execution across multiple browser contexts',
      'Built-in test generator that records user interactions'
    ],
    relationships: [
      { target: 'End-to-End Testing', description: 'Enables' },
      { target: 'Browser Automation', description: 'Provides' },
      { target: 'Test Automation', description: 'Implements' },
      { target: 'Cross-Browser Testing', description: 'Supports' }
    ],
    examples: [
      'page.click() and page.fill() methods automatically wait for elements to be visible and enabled before interaction',
      'page.route() intercepts network requests to mock API responses for deterministic test behavior'
    ],
    tags: ['testing', 'e2e-testing', 'browser-automation', 'javascript']
  }
];

async function main() {
  console.log('Testing Libraries Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure entities directory exists
  if (!existsSync(entitiesDir)) {
    mkdirSync(entitiesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < TESTING_LIBRARIES.length; i++) {
    const libraryOptions = TESTING_LIBRARIES[i];
    try {
      const result = generateEntityPage(libraryOptions, i);
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
    console.log('\n✓ Successfully created all testing library entities');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
