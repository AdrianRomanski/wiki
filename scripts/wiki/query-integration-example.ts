/**
 * Integration example demonstrating complete query workflow.
 * 
 * This example shows how all query features work together:
 * - Full-text search (sub-task 8.1)
 * - Tag-based and name-based search (sub-task 8.2)
 * - Cross-reference context in results (sub-task 8.5)
 */

import { createQueryEngine } from './query.js';

async function demonstrateCompleteQueryWorkflow() {
  const engine = createQueryEngine();

  console.log('=== Complete Query Workflow Demo ===\n');

  // Scenario: User wants to learn about accessibility in Angular
  console.log('Scenario: Learning about accessibility in Angular\n');

  // Step 1: Full-text search to find relevant pages
  console.log('Step 1: Full-text search for "Angular accessibility"');
  const searchResults = await engine.search('Angular accessibility', {
    maxResults: 5,
    includeRelatedPages: true,
    snippetLength: 100,
  });

  console.log(`Found ${searchResults.length} results:\n`);

  for (const result of searchResults) {
    console.log(`📄 ${result.page.frontmatter.title}`);
    console.log(`   Relevance: ${result.relevance.toFixed(2)}`);
    console.log(`   Type: ${result.page.frontmatter.type}`);
    console.log(`   Path: ${result.page.path}`);
    
    // Show matched content snippets
    if (result.matchedContent.length > 0) {
      console.log(`   Snippet: "${result.matchedContent[0]}"`);
    }
    
    // Show related pages (cross-reference context)
    if (result.relatedPages.length > 0) {
      console.log(`   🔗 Related pages:`);
      for (const related of result.relatedPages) {
        console.log(`      - ${related.frontmatter.title} (${related.frontmatter.type})`);
      }
    }
    
    console.log('');
  }

  // Step 2: Explore by tag to find more related content
  console.log('\nStep 2: Explore pages tagged with "accessibility"');
  const taggedPages = await engine.searchByTag('accessibility');

  console.log(`Found ${taggedPages.length} pages with #accessibility tag:\n`);

  for (const page of taggedPages) {
    console.log(`   - ${page.frontmatter.title} (${page.frontmatter.type})`);
  }

  // Step 3: Find all entities to understand the ecosystem
  console.log('\n\nStep 3: Discover all Angular entities');
  const angularEntities = await engine.findEntities('Angular');

  console.log(`Found ${angularEntities.length} Angular entities:\n`);

  for (const entity of angularEntities) {
    console.log(`   🔧 ${entity.frontmatter.title}`);
    console.log(`      Tags: ${entity.frontmatter.tags.join(', ')}`);
    
    // Show what this entity links to
    if (entity.outgoingLinks.length > 0) {
      console.log(`      Links to: ${entity.outgoingLinks.join(', ')}`);
    }
  }

  // Step 4: Find concepts to understand principles
  console.log('\n\nStep 4: Explore accessibility concepts');
  const accessibilityConcepts = await engine.findConcepts('accessibility');

  console.log(`Found ${accessibilityConcepts.length} accessibility concepts:\n`);

  for (const concept of accessibilityConcepts) {
    console.log(`   💡 ${concept.frontmatter.title}`);
    console.log(`      Tags: ${concept.frontmatter.tags.join(', ')}`);
  }

  // Step 5: Find backlinks to understand connections
  if (angularEntities.length > 0) {
    const firstEntity = angularEntities[0];
    console.log(`\n\nStep 5: Find what links to "${firstEntity.frontmatter.title}"`);
    
    const backlinks = await engine.findBacklinks(firstEntity.path);
    
    console.log(`Found ${backlinks.length} pages linking to ${firstEntity.frontmatter.title}:\n`);
    
    for (const page of backlinks) {
      console.log(`   ← ${page.frontmatter.title} (${page.frontmatter.type})`);
    }
  }

  // Step 6: Find authoritative sources
  console.log('\n\nStep 6: Find official sources and specifications');
  const sources = await engine.findSources();

  console.log(`Found ${sources.length} source documents:\n`);

  for (const source of sources) {
    console.log(`   📚 ${source.frontmatter.title}`);
    if (source.frontmatter.author) {
      console.log(`      Author: ${source.frontmatter.author}`);
    }
    if (source.frontmatter.url) {
      console.log(`      URL: ${source.frontmatter.url}`);
    }
    if (source.frontmatter.date) {
      console.log(`      Date: ${source.frontmatter.date}`);
    }
  }

  // Summary
  console.log('\n\n=== Query Workflow Summary ===');
  console.log(`
This workflow demonstrated:

✅ Full-text search across all wiki content (Requirement 8.1)
   - Searched for "Angular accessibility"
   - Results ranked by relevance
   - Content snippets extracted

✅ Tag-based search (Requirement 8.2, 8.3, 13.5)
   - Searched by #accessibility tag
   - Supports both frontmatter and inline #tag syntax

✅ Name-based search (Requirement 8.2, 8.3)
   - Found entities by name pattern
   - Found concepts by name pattern
   - Filtered sources by metadata

✅ Cross-reference context (Requirement 8.5)
   - Related pages included in search results
   - Backlinks discovered
   - Navigation graph revealed

The query engine enables efficient knowledge retrieval and discovery
through multiple search strategies, all with cross-reference context
to help users explore the knowledge graph.
  `);
}

// Run the demonstration
demonstrateCompleteQueryWorkflow().catch(console.error);
