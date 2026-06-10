#!/usr/bin/env ts-node

import { basicSetupExample, basicSetupWithHelperExample } from '../lib/basic-setup.example';

console.log('=== Wiki System Setup Example ===\n');
console.log('Demonstrating wiki system initialization and configuration.\n');

console.log('Method 1: Manual adapter instantiation\n');
const wikiSystem1 = basicSetupExample();
console.log('✓ WikiSystem created with manual adapter setup');
console.log('  - FileSystemAdapter configured');
console.log('  - MarkdownAdapter instantiated');
console.log('  - FrontmatterAdapter instantiated');
console.log();

console.log('Method 2: Using helper function\n');
const wikiSystem2 = basicSetupWithHelperExample();
console.log('✓ WikiSystem created with createAdapters helper');
console.log('  - All adapters created at once');
console.log('  - Simpler initialization code');
console.log();

console.log('Available services:');
console.log('  - wikiSystem.generators (entity, concept, source)');
console.log('  - wikiSystem.query (search, findEntities, findConcepts, findSources)');
console.log('  - wikiSystem.crossReference (detect, validate)');
console.log();

console.log('Setup complete! The WikiSystem is ready to use.');
