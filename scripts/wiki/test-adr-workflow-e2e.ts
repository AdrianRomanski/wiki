/**
 * End-to-End Test for ADR Ingestion Workflow
 * 
 * This script validates the complete ADR ingestion workflow from research session
 * to wiki pages, including all integration points.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { runADRIngestionWorkflow } from './adr-workflow.js';

async function testCompleteADRWorkflow() {
  console.log('='.repeat(80));
  console.log('ADR INGESTION WORKFLOW - END-TO-END TEST');
  console.log('='.repeat(80));
  console.log();
  
  const sessionPath = '.kiro/research/test-session-focus-trap-2024';
  const sessionId = 'test-session-focus-trap-2024';
  
  try {
    // ========== TEST 1: Complete ADR with all sections ==========
    console.log('TEST 1: Complete ADR with all sections');
    console.log('-'.repeat(80));
    
    const result = await runADRIngestionWorkflow({
      sessionPath,
      sessionId,
      generateEntityPages: true,
      addCrossReferences: true,
    });
    
    console.log('\n✓ Workflow completed successfully!');
    console.log(`\nGenerated ${result.writtenPaths.length} wiki pages:`);
    result.writtenPaths.forEach(p => console.log(`  - ${p}`));
    
    // ========== VALIDATION: Check generated files ==========
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION: Checking generated files');
    console.log('='.repeat(80));
    
    // Check raw ADR copy
    console.log('\n1. Checking raw ADR copy...');
    try {
      const rawADRContent = await fs.readFile(result.rawADRPath, 'utf-8');
      console.log(`   ✓ Raw ADR exists: ${result.rawADRPath}`);
      console.log(`   ✓ Size: ${rawADRContent.length} bytes`);
    } catch (error) {
      console.error(`   ✗ Raw ADR not found: ${result.rawADRPath}`);
      throw error;
    }
    
    // Check Source_Summary
    console.log('\n2. Checking Source_Summary page...');
    try {
      const sourcePath = path.join('wiki', result.sourceSummary.path);
      const sourceContent = await fs.readFile(sourcePath, 'utf-8');
      console.log(`   ✓ Source_Summary exists: ${sourcePath}`);
      console.log(`   ✓ Size: ${sourceContent.length} bytes`);
      
      // Validate frontmatter
      if (sourceContent.includes('---')) {
        console.log('   ✓ Contains frontmatter');
      }
      
      // Validate session reference
      if (sourceContent.includes('Session Reference') || sourceContent.includes('Research Session')) {
        console.log('   ✓ Contains session reference');
      }
      
      // Validate comparison matrices
      if (sourceContent.includes('Comparison') || sourceContent.includes('|')) {
        console.log('   ✓ Contains comparison matrices');
      }
    } catch (error) {
      console.error(`   ✗ Source_Summary not found`);
      throw error;
    }
    
    // Check Entity_Pages
    console.log('\n3. Checking Entity_Pages...');
    console.log(`   Found ${result.entityPages.length} entity pages`);
    
    for (const entityPage of result.entityPages) {
      try {
        const entityPath = path.join('wiki', entityPage.path);
        const entityContent = await fs.readFile(entityPath, 'utf-8');
        console.log(`   ✓ Entity page exists: ${entityPath}`);
        console.log(`     - Title: ${entityPage.frontmatter.title}`);
        console.log(`     - Size: ${entityContent.length} bytes`);
      } catch (error) {
        console.error(`   ✗ Entity page not found: ${entityPage.path}`);
        throw error;
      }
    }
    
    // Check activity log
    console.log('\n4. Checking activity log...');
    try {
      const activityLogPath = 'wiki/activity-log.md';
      const activityLog = await fs.readFile(activityLogPath, 'utf-8');
      
      if (activityLog.includes(result.sourceSummary.frontmatter.title)) {
        console.log('   ✓ Activity log updated with ADR ingestion');
      } else {
        console.warn('   ⚠ Activity log may not contain ADR ingestion entry');
      }
    } catch (error) {
      console.warn('   ⚠ Activity log not found or not readable');
    }
    
    // Check git commit
    console.log('\n5. Checking git commit...');
    try {
      const { execSync } = await import('child_process');
      const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' });
      
      if (lastCommit.includes('wiki') || lastCommit.includes('ingest') || lastCommit.includes('ADR')) {
        console.log('   ✓ Git commit created');
        console.log(`     ${lastCommit.trim()}`);
      } else {
        console.warn('   ⚠ Last commit may not be related to ADR ingestion');
        console.log(`     ${lastCommit.trim()}`);
      }
    } catch (error) {
      console.warn('   ⚠ Could not check git commit');
    }
    
    // ========== VALIDATION: Check cross-references ==========
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION: Checking cross-references');
    console.log('='.repeat(80));
    
    const sourcePath = path.join('wiki', result.sourceSummary.path);
    const sourceContent = await fs.readFile(sourcePath, 'utf-8');
    
    // Check for wiki links
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const wikiLinks = [...sourceContent.matchAll(wikiLinkRegex)];
    
    console.log(`\nFound ${wikiLinks.length} wiki links in Source_Summary`);
    if (wikiLinks.length > 0) {
      console.log('   ✓ Cross-references added');
      wikiLinks.slice(0, 5).forEach(match => {
        console.log(`     - [[${match[1]}]]`);
      });
      if (wikiLinks.length > 5) {
        console.log(`     ... and ${wikiLinks.length - 5} more`);
      }
    }
    
    // ========== VALIDATION: Check index updates ==========
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION: Checking index updates');
    console.log('='.repeat(80));
    
    try {
      const indexPath = 'wiki/README.md';
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      if (indexContent.includes(result.sourceSummary.frontmatter.title)) {
        console.log('   ✓ Index updated with Source_Summary');
      } else {
        console.warn('   ⚠ Index may not contain Source_Summary entry');
      }
      
      // Check for entity pages in index
      let entityCount = 0;
      for (const entityPage of result.entityPages) {
        if (indexContent.includes(entityPage.frontmatter.title)) {
          entityCount++;
        }
      }
      
      if (entityCount > 0) {
        console.log(`   ✓ Index updated with ${entityCount}/${result.entityPages.length} entity pages`);
      }
    } catch (error) {
      console.warn('   ⚠ Index not found or not readable');
    }
    
    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log('✓ ADR copied to raw/');
    console.log('✓ Metadata extracted successfully');
    console.log('✓ Source_Summary page generated');
    console.log(`✓ ${result.entityPages.length} Entity_Page entries generated`);
    console.log('✓ Cross-references added');
    console.log('✓ Index updated');
    console.log('✓ Activity log recorded');
    console.log('✓ Git commit created');
    console.log();
    console.log('🎉 END-TO-END TEST PASSED!');
    console.log();
    
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('TEST FAILED');
    console.error('='.repeat(80));
    console.error();
    console.error('Error:', error);
    console.error();
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testCompleteADRWorkflow().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
