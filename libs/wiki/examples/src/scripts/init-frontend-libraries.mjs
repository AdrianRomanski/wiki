#!/usr/bin/env node
/**
 * Frontend Libraries Initialization Script
 *
 * Generates 3 frontend library entities demonstrating UI frameworks and component libraries:
 * - React: Component-based JavaScript library for building user interfaces
 * - Vue: Progressive JavaScript framework for building UIs
 * - Svelte: Compiler-based UI framework
 *
 * Run with: npm run init:frontend-libs
 * or: node libs/wiki/examples/src/scripts/init-frontend-libraries.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

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
 * Generates markdown content for an entity page
 */
function generateEntityPage(options) {
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
  content += '# ' + name + '\n\n';
  content += '## Definition\n\n' + definition + '\n\n';

  if (properties.length > 0) {
    content += '## Properties\n\n';
    properties.forEach(prop => {
      content += '- ' + prop + '\n';
    });
    content += '\n';
  }

  if (relationships.length > 0) {
    content += '## Relationships\n\n';
    relationships.forEach(rel => {
      content += '- ' + rel.description + ' [[' + rel.target + ']]\n';
    });
    content += '\n';
  }

  if (examples.length > 0) {
    content += '## Examples\n\n';
    examples.forEach(example => {
      content += example + '\n\n';
    });
  }

  if (sources.length > 0) {
    content += '## References\n\n';
    sources.forEach(source => {
      content += '- [[' + source + ']]\n';
    });
    content += '\n';
  }

  return {
    content: content.trim() + '\n',
    filename: generateFilename(name),
  };
}

const FRONTEND_LIBRARIES = [
  {
    name: 'React',
    definition: 'A JavaScript library for building user interfaces with a component-based architecture and declarative rendering',
    properties: [
      'Component-based architecture with reusable UI elements',
      'Virtual DOM for efficient updates and rendering',
      'Declarative UI paradigm with JSX syntax',
      'Unidirectional data flow from parent to child components',
      'Rich ecosystem with hooks for state management and side effects'
    ],
    relationships: [
      { target: 'Component Architecture', description: 'Implements' },
      { target: 'Virtual DOM', description: 'Uses' },
      { target: 'JavaScript', description: 'Built with' },
      { target: 'Declarative Programming', description: 'Follows' }
    ],
    examples: [
      'useState() and useEffect() hooks manage component state and side effects without class components',
      'JSX syntax like <button onClick={handleClick}>Click me</button> combines markup with logic declaratively'
    ],
    tags: ['frontend', 'ui-library', 'javascript', 'react']
  },
  {
    name: 'Vue',
    definition: 'A progressive JavaScript framework for building user interfaces that can be incrementally adopted',
    properties: [
      'Progressive framework that scales from a library to a full framework',
      'Reactive data binding with automatic dependency tracking',
      'Single-file components with template, script, and style sections',
      'Intuitive template syntax with directives like v-if and v-for',
      'Composition API for flexible component logic organization'
    ],
    relationships: [
      { target: 'Component Architecture', description: 'Implements' },
      { target: 'Reactive Programming', description: 'Uses' },
      { target: 'JavaScript', description: 'Built with' },
      { target: 'Template Syntax', description: 'Provides' }
    ],
    examples: [
      'v-model directive creates two-way data binding between form inputs and component state',
      'The Composition API with ref() and reactive() provides a flexible alternative to the Options API for component logic'
    ],
    tags: ['frontend', 'framework', 'javascript', 'vue']
  },
  {
    name: 'Svelte',
    definition: 'A compiler-based UI framework that shifts work from the browser to the build step, producing highly optimized vanilla JavaScript',
    properties: [
      'Compile-time framework with no virtual DOM overhead',
      'Reactive declarations using assignment syntax',
      'Component scoped CSS by default',
      'Built-in animations and transitions',
      'Minimal runtime bundle size compared to other frameworks'
    ],
    relationships: [
      { target: 'Compiler', description: 'Uses' },
      { target: 'Reactive Programming', description: 'Implements' },
      { target: 'JavaScript', description: 'Compiles to' },
      { target: 'Performance Optimization', description: 'Focuses on' }
    ],
    examples: [
      'Reactive statements like $: doubled = count * 2 automatically recompute when dependencies change',
      'Component files combine template, script, and style in a single .svelte file with compile-time optimization'
    ],
    tags: ['frontend', 'framework', 'javascript', 'svelte', 'compiler']
  }
];

async function main() {
  console.log('Frontend Libraries Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Ensure entities directory exists
  if (!existsSync(entitiesDir)) {
    mkdirSync(entitiesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const libraryOptions of FRONTEND_LIBRARIES) {
    try {
      const result = generateEntityPage(libraryOptions);
      const outputPath = join(entitiesDir, result.filename);
      writeFileSync(outputPath, result.content, 'utf-8');
      console.log('✓ Created: wiki/entities/' + result.filename);
      successCount++;
    } catch (error) {
      console.error('✗ Failed to create ' + libraryOptions.name + ':', error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Created:  ' + successCount + ' entities');
  if (errorCount > 0) {
    console.log('Failed:   ' + errorCount + ' entities');
    console.error('\nCompleted with errors');
    process.exit(1);
  } else {
    console.log('\n✓ Successfully created all frontend library entities');
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
