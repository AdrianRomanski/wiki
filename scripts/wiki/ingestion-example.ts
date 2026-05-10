/**
 * Example demonstrating the complete ingestion workflow.
 * 
 * This example shows how to:
 * 1. Ingest a raw source file
 * 2. Generate wiki pages from the source
 * 3. Update the index
 * 4. Record activity log entries
 * 
 * Run with: npx tsx scripts/wiki/ingestion-example.ts
 */

import {
  ingestRawSource,
  generateWikiPagesFromSource,
} from './ingestion.js';

async function main() {
  console.log('=== Ingestion Workflow Example ===\n');
  
  try {
    // Step 1: Ingest a raw source file
    console.log('Step 1: Ingesting raw source...');
    const source = await ingestRawSource('articles/example-article.md');
    console.log(`  ✓ Ingested: ${source.filename}`);
    console.log(`  - Format: ${source.format}`);
    console.log(`  - Category: ${source.category}`);
    console.log(`  - Size: ${source.fileSize} bytes`);
    console.log(`  - Added: ${source.addedDate.toISOString()}`);
    console.log();
    
    // Step 2: Generate wiki pages from the source
    console.log('Step 2: Generating wiki pages...');
    const result = await generateWikiPagesFromSource({
      source,
      sourceSummaryOptions: {
        title: 'Example Article Summary',
        author: 'Example Author',
        date: '2024-05-10',
        keyPoints: [
          'First key point from the article',
          'Second key point from the article',
          'Third key point from the article',
        ],
        insights: 'This article provides valuable insights into the topic.',
        relevantEntities: ['Angular CDK'],
        relevantConcepts: ['Progressive Enhancement'],
        tags: ['example', 'demo', 'article'],
      },
      addCrossReferences: true,
    });
    
    console.log(`  ✓ Generated ${result.pages.length} wiki page(s):`);
    for (const page of result.pages) {
      console.log(`    - ${page.frontmatter.title} (${page.frontmatter.type})`);
      console.log(`      Path: ${page.path}`);
    }
    console.log();
    
    // Step 3: Index and activity log are automatically updated
    console.log('Step 3: Index and activity log updated automatically');
    console.log('  ✓ Index page updated with new entries');
    console.log('  ✓ Activity log recorded ingestion event');
    console.log();
    
    console.log('=== Ingestion Complete ===');
    console.log(`\nGenerated files:`);
    for (const path of result.writtenPaths) {
      console.log(`  - wiki/${path}`);
    }
    
  } catch (error) {
    console.error('Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
