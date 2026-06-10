#!/usr/bin/env ts-node

import { 
  generateEntityPageExample
} from '../lib/generate-entity-page.example';
import { 
  generateConceptPageForArchitecturalPrinciple
} from '../lib/generate-concept-page.example';
import { 
  generateSourceSummaryArticleExample
} from '../lib/generate-source-summary.example';

async function main() {
  console.log('=== Wiki Page Generation Examples ===\n');
  
  console.log('1. Generating Entity Page\n');
  console.log('   Example: Angular CDK library\n');
  const entityResult = generateEntityPageExample();
  console.log(`   ✓ Generated: ${entityResult.filename}`);
  console.log(`   ✓ Title: ${entityResult.frontmatter.title}`);
  console.log(`   ✓ Type: ${entityResult.frontmatter.type}`);
  console.log(`   ✓ Tags: ${entityResult.frontmatter.tags.join(', ')}`);
  console.log();

  console.log('2. Generating Concept Page\n');
  console.log('   Example: Progressive Enhancement concept\n');
  const conceptResult = generateConceptPageForArchitecturalPrinciple();
  console.log(`   ✓ Generated: ${conceptResult.filename}`);
  console.log(`   ✓ Title: ${conceptResult.frontmatter.title}`);
  console.log(`   ✓ Type: ${conceptResult.frontmatter.type}`);
  console.log(`   ✓ Tags: ${conceptResult.frontmatter.tags.join(', ')}`);
  console.log();

  console.log('3. Generating Source Summary\n');
  console.log('   Example: Angular ARIA Guide\n');
  const sourceResult = generateSourceSummaryArticleExample();
  console.log(`   ✓ Generated: ${sourceResult.filename}`);
  console.log(`   ✓ Title: ${sourceResult.frontmatter.title}`);
  console.log(`   ✓ Type: ${sourceResult.frontmatter.type}`);
  if (sourceResult.frontmatter.author) {
    console.log(`   ✓ Author: ${sourceResult.frontmatter.author}`);
  }
  if (sourceResult.frontmatter.date) {
    console.log(`   ✓ Date: ${sourceResult.frontmatter.date}`);
  }
  if (sourceResult.frontmatter.url) {
    console.log(`   ✓ URL: ${sourceResult.frontmatter.url}`);
  }
  console.log();

  console.log('Page generation examples completed successfully!');
  console.log('\nGenerated pages can be saved using FileSystemAdapter:');
  console.log('  await fileSystemAdapter.writeWikiFile(result.filename, result.content);');
}

main().catch((error) => {
  console.error('Error running generation examples:', error);
  process.exit(1);
});
