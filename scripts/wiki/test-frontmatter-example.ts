/**
 * Example script to test frontmatter utilities with real wiki content.
 * This demonstrates parsing and generating frontmatter for wiki pages.
 */

import { readFileSync } from 'fs';
import { parseFrontmatter, generateFrontmatter, createFrontmatter } from './frontmatter.js';

// Test 1: Parse existing wiki page
console.log('=== Test 1: Parse existing wiki page ===');
try {
  const content = readFileSync('wiki/concepts/progressive-enhancement.md', 'utf-8');
  const { frontmatter, content: body } = parseFrontmatter(content);
  
  console.log('✓ Successfully parsed frontmatter:');
  console.log('  Title:', frontmatter.title);
  console.log('  Type:', frontmatter.type);
  console.log('  Tags:', frontmatter.tags.join(', '));
  console.log('  Created:', frontmatter.created);
  console.log('  Updated:', frontmatter.updated);
  console.log('  Content length:', body.length, 'characters');
} catch (error) {
  console.error('✗ Failed to parse:', error);
}

// Test 2: Generate new wiki page
console.log('\n=== Test 2: Generate new wiki page ===');
try {
  const newFrontmatter = createFrontmatter({
    title: 'Test Entity',
    type: 'entity',
    tags: ['test', 'example'],
  });
  
  const markdown = generateFrontmatter(
    newFrontmatter,
    '# Test Entity\n\n## Definition\n\nThis is a test entity.'
  );
  
  console.log('✓ Successfully generated markdown:');
  console.log(markdown);
} catch (error) {
  console.error('✗ Failed to generate:', error);
}

// Test 3: Round-trip (generate then parse)
console.log('\n=== Test 3: Round-trip test ===');
try {
  const original = createFrontmatter({
    title: 'Round Trip Test',
    type: 'concept',
    tags: ['test'],
  });
  
  const markdown = generateFrontmatter(original, '# Content');
  const { frontmatter: parsed } = parseFrontmatter(markdown);
  
  const matches = 
    original.title === parsed.title &&
    original.type === parsed.type &&
    original.tags.length === parsed.tags.length &&
    original.created === parsed.created &&
    original.updated === parsed.updated;
  
  if (matches) {
    console.log('✓ Round-trip successful: generated and parsed frontmatter match');
  } else {
    console.error('✗ Round-trip failed: frontmatter mismatch');
    console.log('Original:', original);
    console.log('Parsed:', parsed);
  }
} catch (error) {
  console.error('✗ Round-trip failed:', error);
}

console.log('\n=== All tests completed ===');
