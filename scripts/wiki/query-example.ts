/**
 * Example usage of the query and search functionality.
 * 
 * This script demonstrates:
 * - Full-text search
 * - Tag-based search
 * - Entity and concept search
 * - Source filtering
 * - Backlink discovery
 */

import { createQueryEngine } from './query.js';

async function main() {
  const engine = createQueryEngine();

  console.log('=== LLM Wiki Second Brain - Query Examples ===\n');

  // Example 1: Full-text search
  console.log('1. Full-text search for "accessibility":');
  const searchResults = await engine.search('accessibility', {
    maxResults: 5,
    includeRelatedPages: true,
  });

  for (const result of searchResults) {
    console.log(`\n  - ${result.page.frontmatter.title} (relevance: ${result.relevance.toFixed(2)})`);
    console.log(`    Type: ${result.page.frontmatter.type}`);
    console.log(`    Tags: ${result.page.frontmatter.tags.join(', ')}`);
    
    if (result.matchedContent.length > 0) {
      console.log(`    Snippet: ${result.matchedContent[0]}`);
    }
    
    if (result.relatedPages.length > 0) {
      console.log(`    Related: ${result.relatedPages.map(p => p.frontmatter.title).join(', ')}`);
    }
  }

  // Example 2: Tag-based search
  console.log('\n\n2. Search by tag "angular":');
  const tagResults = await engine.searchByTag('angular');

  for (const page of tagResults) {
    console.log(`  - ${page.frontmatter.title}`);
  }

  // Example 3: Search by inline #tag
  console.log('\n\n3. Search by inline tag "#accessibility":');
  const inlineTagResults = await engine.searchByTag('#accessibility');

  for (const page of inlineTagResults) {
    console.log(`  - ${page.frontmatter.title}`);
  }

  // Example 4: Find all entities
  console.log('\n\n4. Find all entity pages:');
  const entities = await engine.findEntities();

  for (const entity of entities) {
    console.log(`  - ${entity.frontmatter.title}`);
  }

  // Example 5: Find entities matching pattern
  console.log('\n\n5. Find entities matching "Angular":');
  const angularEntities = await engine.findEntities('Angular');

  for (const entity of angularEntities) {
    console.log(`  - ${entity.frontmatter.title}`);
  }

  // Example 6: Find all concepts
  console.log('\n\n6. Find all concept pages:');
  const concepts = await engine.findConcepts();

  for (const concept of concepts) {
    console.log(`  - ${concept.frontmatter.title}`);
  }

  // Example 7: Find sources by author
  console.log('\n\n7. Find sources by author "W3C":');
  const w3cSources = await engine.findSources({ author: 'W3C' });

  for (const source of w3cSources) {
    console.log(`  - ${source.frontmatter.title}`);
    if (source.frontmatter.url) {
      console.log(`    URL: ${source.frontmatter.url}`);
    }
  }

  // Example 8: Find backlinks
  console.log('\n\n8. Find backlinks for "entities/angular-cdk.md":');
  const backlinks = await engine.findBacklinks('entities/angular-cdk.md');

  for (const page of backlinks) {
    console.log(`  - ${page.frontmatter.title} links to Angular CDK`);
  }

  // Example 9: Multi-word search
  console.log('\n\n9. Multi-word search "Angular accessibility":');
  const multiWordResults = await engine.search('Angular accessibility', {
    maxResults: 3,
  });

  for (const result of multiWordResults) {
    console.log(`  - ${result.page.frontmatter.title} (relevance: ${result.relevance.toFixed(2)})`);
  }

  // Example 10: Search with custom snippet length
  console.log('\n\n10. Search with short snippets (50 chars):');
  const shortSnippetResults = await engine.search('accessibility', {
    maxResults: 2,
    snippetLength: 50,
  });

  for (const result of shortSnippetResults) {
    console.log(`\n  - ${result.page.frontmatter.title}`);
    for (const snippet of result.matchedContent.slice(0, 2)) {
      console.log(`    "${snippet}"`);
    }
  }

  console.log('\n\n=== Query Examples Complete ===');
}

// Run the examples
main().catch(console.error);
