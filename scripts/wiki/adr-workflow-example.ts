/**
 * ADR Workflow Example
 * 
 * This file demonstrates the complete ADR ingestion workflow from research
 * session to wiki pages. It shows how to use the `runADRIngestionWorkflow`
 * function with real research session structures.
 * 
 * Run this example with:
 *   npx tsx scripts/wiki/adr-workflow-example.ts
 */

import { runADRIngestionWorkflow } from './adr-workflow.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Example 1: Simple ADR Ingestion
 * 
 * This example demonstrates ingesting a minimal ADR with only required fields.
 * The ADR contains a simple decision without comparison matrices.
 */
async function example1_SimpleADRIngestion() {
  console.log('\n=== Example 1: Simple ADR Ingestion ===\n');
  
  try {
    // Run the ADR ingestion workflow
    const result = await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-2024-01-15-simple-decision',
      sessionId: 'session-2024-01-15-simple-decision',
      generateEntityPages: true,
      addCrossReferences: true,
    });
    
    // Display results
    console.log('\n✅ ADR ingestion completed successfully!\n');
    console.log('Generated files:');
    console.log(`  - Raw ADR: ${result.rawADRPath}`);
    console.log(`  - Source Summary: ${result.sourceSummary.path}`);
    console.log(`  - Entity Pages: ${result.entityPages.length}`);
    
    result.entityPages.forEach(page => {
      console.log(`    • ${page.path}`);
    });
    
    console.log(`\nTotal wiki pages created: ${result.writtenPaths.length}`);
    console.log('\nSession reference:');
    console.log(`  - Session ID: ${result.sessionReference.sessionId}`);
    console.log(`  - Session Path: ${result.sessionReference.sessionPath}`);
    
  } catch (error) {
    console.error('❌ ADR ingestion failed:', error);
  }
}

/**
 * Example 2: ADR with Comparison Matrices
 * 
 * This example demonstrates ingesting an ADR that includes comparison matrices
 * for evaluating multiple library options. The matrices are parsed and included
 * in the generated wiki pages.
 */
async function example2_ADRWithComparisonMatrices() {
  console.log('\n=== Example 2: ADR with Comparison Matrices ===\n');
  
  try {
    // Run the ADR ingestion workflow
    const result = await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-2024-01-20-state-management',
      sessionId: 'session-2024-01-20-state-management',
      generateEntityPages: true,
      addCrossReferences: true,
    });
    
    // Display results
    console.log('\n✅ ADR ingestion completed successfully!\n');
    console.log('Generated files:');
    console.log(`  - Raw ADR: ${result.rawADRPath}`);
    console.log(`  - Source Summary: ${result.sourceSummary.path}`);
    
    console.log(`\n📊 Comparison matrices included in Source Summary`);
    console.log(`\n📚 Entity Pages generated for libraries:`);
    
    result.entityPages.forEach(page => {
      console.log(`  • ${page.frontmatter.title} (${page.path})`);
    });
    
    console.log(`\nTotal wiki pages created: ${result.writtenPaths.length}`);
    
    // Show session reference details
    console.log('\n🔗 Session reference:');
    console.log(`  - Session ID: ${result.sessionReference.sessionId}`);
    console.log(`  - Session Path: ${result.sessionReference.sessionPath}`);
    
    if (result.sessionReference.researchLinks) {
      console.log('  - Research artifacts:');
      if (result.sessionReference.researchLinks.comparisonReport) {
        console.log(`    • Comparison Report: ${result.sessionReference.researchLinks.comparisonReport}`);
      }
      if (result.sessionReference.researchLinks.finalReport) {
        console.log(`    • Final Report: ${result.sessionReference.researchLinks.finalReport}`);
      }
      if (result.sessionReference.researchLinks.prototypes?.length) {
        console.log(`    • Prototypes: ${result.sessionReference.researchLinks.prototypes.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ADR ingestion failed:', error);
  }
}

/**
 * Example 3: ADR with Multiple Libraries
 * 
 * This example demonstrates ingesting an ADR that compares 5+ libraries.
 * Each library gets its own Entity_Page in the wiki.
 */
async function example3_ADRWithMultipleLibraries() {
  console.log('\n=== Example 3: ADR with Multiple Libraries ===\n');
  
  try {
    // Run the ADR ingestion workflow
    const result = await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-2024-02-01-http-client',
      sessionId: 'session-2024-02-01-http-client',
      generateEntityPages: true,
      addCrossReferences: true,
    });
    
    // Display results
    console.log('\n✅ ADR ingestion completed successfully!\n');
    console.log(`📚 Generated Entity Pages for ${result.entityPages.length} libraries:\n`);
    
    result.entityPages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.frontmatter.title}`);
      console.log(`   Path: ${page.path}`);
      console.log(`   Tags: ${page.frontmatter.tags.join(', ')}`);
      console.log('');
    });
    
    console.log(`Source Summary: ${result.sourceSummary.path}`);
    console.log(`\nTotal wiki pages created: ${result.writtenPaths.length}`);
    
  } catch (error) {
    console.error('❌ ADR ingestion failed:', error);
  }
}

/**
 * Example 4: ADR with Research Artifacts
 * 
 * This example demonstrates ingesting an ADR that references research artifacts
 * like comparison reports, final reports, and prototypes. The session reference
 * section includes links to all these artifacts.
 */
async function example4_ADRWithResearchArtifacts() {
  console.log('\n=== Example 4: ADR with Research Artifacts ===\n');
  
  try {
    // Run the ADR ingestion workflow
    const result = await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-2024-02-10-form-validation',
      sessionId: 'session-2024-02-10-form-validation',
      generateEntityPages: true,
      addCrossReferences: true,
    });
    
    // Display results
    console.log('\n✅ ADR ingestion completed successfully!\n');
    
    console.log('🔗 Session Reference Details:');
    console.log(`  Session ID: ${result.sessionReference.sessionId}`);
    console.log(`  Session Path: ${result.sessionReference.sessionPath}`);
    
    if (result.sessionReference.researchLinks) {
      const links = result.sessionReference.researchLinks;
      
      console.log('\n📄 Research Artifacts:');
      
      if (links.comparisonReport) {
        console.log(`  ✓ Comparison Report: ${links.comparisonReport}`);
      }
      
      if (links.finalReport) {
        console.log(`  ✓ Final Report: ${links.finalReport}`);
      }
      
      if (links.prototypes && links.prototypes.length > 0) {
        console.log(`  ✓ Prototypes (${links.prototypes.length}):`);
        links.prototypes.forEach(proto => {
          console.log(`    • ${proto}`);
        });
      }
    }
    
    console.log(`\n📝 Generated wiki pages: ${result.writtenPaths.length}`);
    result.writtenPaths.forEach(p => console.log(`  - ${p}`));
    
  } catch (error) {
    console.error('❌ ADR ingestion failed:', error);
  }
}

/**
 * Example 5: Error Handling
 * 
 * This example demonstrates how the workflow handles various error conditions:
 * - Missing ADR file
 * - Invalid session directory
 * - Malformed ADR content
 */
async function example5_ErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===\n');
  
  // Test 1: Missing session directory
  console.log('Test 1: Missing session directory');
  try {
    await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/non-existent-session',
      sessionId: 'non-existent-session',
    });
  } catch (error: any) {
    console.log(`  ✓ Caught expected error: ${error.message}\n`);
  }
  
  // Test 2: Missing ADR file
  console.log('Test 2: Missing ADR file');
  try {
    await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-without-adr',
      sessionId: 'session-without-adr',
    });
  } catch (error: any) {
    console.log(`  ✓ Caught expected error: ${error.message}\n`);
  }
  
  // Test 3: Malformed ADR (missing required fields)
  console.log('Test 3: Malformed ADR');
  try {
    await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-malformed-adr',
      sessionId: 'session-malformed-adr',
    });
  } catch (error: any) {
    console.log(`  ✓ Caught expected error: ${error.message}\n`);
  }
  
  console.log('✅ Error handling tests completed\n');
}

/**
 * Example 6: Custom Configuration
 * 
 * This example demonstrates using custom file system configuration
 * for non-standard directory structures.
 */
async function example6_CustomConfiguration() {
  console.log('\n=== Example 6: Custom Configuration ===\n');
  
  try {
    // Run with custom configuration
    const result = await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/session-2024-03-01-custom',
      sessionId: 'session-2024-03-01-custom',
      generateEntityPages: true,
      addCrossReferences: true,
      config: {
        rootDir: process.cwd(),
        wikiDir: 'wiki',
        rawDir: 'raw',
      },
    });
    
    console.log('\n✅ ADR ingestion with custom config completed!\n');
    console.log(`Generated ${result.writtenPaths.length} wiki pages`);
    
  } catch (error) {
    console.error('❌ ADR ingestion failed:', error);
  }
}

/**
 * Example 7: Batch Processing
 * 
 * This example demonstrates processing multiple research sessions in batch.
 * Useful for migrating existing research sessions into the wiki.
 */
async function example7_BatchProcessing() {
  console.log('\n=== Example 7: Batch Processing ===\n');
  
  const sessions = [
    'session-2024-01-15-simple-decision',
    'session-2024-01-20-state-management',
    'session-2024-02-01-http-client',
    'session-2024-02-10-form-validation',
  ];
  
  const results = [];
  const errors = [];
  
  for (const sessionId of sessions) {
    console.log(`Processing: ${sessionId}...`);
    
    try {
      const result = await runADRIngestionWorkflow({
        sessionPath: `.kiro/research/${sessionId}`,
        sessionId,
        generateEntityPages: true,
        addCrossReferences: true,
      });
      
      results.push({
        sessionId,
        pagesCreated: result.writtenPaths.length,
        sourceSummary: result.sourceSummary.path,
      });
      
      console.log(`  ✓ Success: ${result.writtenPaths.length} pages created\n`);
      
    } catch (error: any) {
      errors.push({
        sessionId,
        error: error.message,
      });
      
      console.log(`  ✗ Failed: ${error.message}\n`);
    }
  }
  
  // Summary
  console.log('\n📊 Batch Processing Summary:');
  console.log(`  Total sessions: ${sessions.length}`);
  console.log(`  Successful: ${results.length}`);
  console.log(`  Failed: ${errors.length}`);
  
  if (results.length > 0) {
    console.log('\n✅ Successful ingestions:');
    results.forEach(r => {
      console.log(`  - ${r.sessionId}: ${r.pagesCreated} pages`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Failed ingestions:');
    errors.forEach(e => {
      console.log(`  - ${e.sessionId}: ${e.error}`);
    });
  }
}

/**
 * Main function - runs all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ADR Workflow Examples                              ║');
  console.log('║  Demonstrating Research-to-Wiki Integration                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Uncomment the examples you want to run:
  
  // await example1_SimpleADRIngestion();
  // await example2_ADRWithComparisonMatrices();
  // await example3_ADRWithMultipleLibraries();
  // await example4_ADRWithResearchArtifacts();
  // await example5_ErrorHandling();
  // await example6_CustomConfiguration();
  // await example7_BatchProcessing();
  
  console.log('\n💡 Tip: Uncomment the examples you want to run in the main() function');
  console.log('💡 Tip: Ensure research sessions exist before running examples');
  console.log('💡 Tip: Check the generated wiki pages in wiki/sources/ and wiki/entities/\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export examples for use in other scripts
export {
  example1_SimpleADRIngestion,
  example2_ADRWithComparisonMatrices,
  example3_ADRWithMultipleLibraries,
  example4_ADRWithResearchArtifacts,
  example5_ErrorHandling,
  example6_CustomConfiguration,
  example7_BatchProcessing,
};
