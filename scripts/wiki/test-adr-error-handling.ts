/**
 * Error Handling Tests for ADR Ingestion Workflow
 * 
 * This script validates error handling and graceful degradation
 * for various failure scenarios.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { runADRIngestionWorkflow } from './adr-workflow.js';
import { extractADRMetadata } from './adr-metadata-extractor.js';
import { parseComparisonMatrix } from './adr-metadata-extractor.js';

async function testErrorHandling() {
  console.log('='.repeat(80));
  console.log('ADR INGESTION WORKFLOW - ERROR HANDLING TESTS');
  console.log('='.repeat(80));
  console.log();
  
  let passedTests = 0;
  let failedTests = 0;
  
  // ========== TEST 1: Missing ADR file ==========
  console.log('TEST 1: Missing ADR file');
  console.log('-'.repeat(80));
  
  try {
    await runADRIngestionWorkflow({
      sessionPath: '.kiro/research/nonexistent-session',
      sessionId: 'nonexistent-session',
    });
    
    console.log('   ✗ FAILED: Should have thrown an error for missing session');
    failedTests++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Session directory does not exist')) {
      console.log('   ✓ PASSED: Correctly detected missing session directory');
      console.log(`   Error message: ${error.message}`);
      passedTests++;
    } else {
      console.log('   ✗ FAILED: Wrong error type or message');
      console.log(`   Error: ${error}`);
      failedTests++;
    }
  }
  
  // ========== TEST 2: Session without ADR file ==========
  console.log('\nTEST 2: Session without ADR file');
  console.log('-'.repeat(80));
  
  const emptySessionPath = '.kiro/research/test-empty-session';
  
  try {
    // Create empty session directory
    await fs.mkdir(emptySessionPath, { recursive: true });
    
    await runADRIngestionWorkflow({
      sessionPath: emptySessionPath,
      sessionId: 'test-empty-session',
    });
    
    console.log('   ✗ FAILED: Should have thrown an error for missing ADR file');
    failedTests++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('decision.adr.md')) {
      console.log('   ✓ PASSED: Correctly detected missing ADR file');
      console.log(`   Error message: ${error.message}`);
      passedTests++;
    } else {
      console.log('   ✗ FAILED: Wrong error type or message');
      console.log(`   Error: ${error}`);
      failedTests++;
    }
  } finally {
    // Cleanup
    try {
      await fs.rmdir(emptySessionPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  // ========== TEST 3: Invalid frontmatter ==========
  console.log('\nTEST 3: Invalid frontmatter (missing required fields)');
  console.log('-'.repeat(80));
  
  const invalidFrontmatterADR = `---
title: "Test ADR"
date: 2024-05-10
---

# Test ADR

Some content
`;
  
  try {
    await extractADRMetadata(invalidFrontmatterADR);
    
    console.log('   ✗ FAILED: Should have thrown an error for missing required fields');
    failedTests++;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('status') || error.message.includes('context'))) {
      console.log('   ✓ PASSED: Correctly detected missing required fields');
      console.log(`   Error message: ${error.message}`);
      passedTests++;
    } else {
      console.log('   ✗ FAILED: Wrong error type or message');
      console.log(`   Error: ${error}`);
      failedTests++;
    }
  }
  
  // ========== TEST 4: Malformed comparison matrix ==========
  console.log('\nTEST 4: Malformed comparison matrix');
  console.log('-'.repeat(80));
  
  const malformedTable = `
| Header1 |
|---------|
| Value1  |
`;
  
  try {
    parseComparisonMatrix(malformedTable, 'Test Matrix');
    
    console.log('   ✗ FAILED: Should have thrown an error for malformed table');
    failedTests++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Malformed')) {
      console.log('   ✓ PASSED: Correctly detected malformed comparison matrix');
      console.log(`   Error message: ${error.message}`);
      passedTests++;
    } else {
      console.log('   ✗ FAILED: Wrong error type or message');
      console.log(`   Error: ${error}`);
      failedTests++;
    }
  }
  
  // ========== TEST 5: Minimal ADR (required fields only) ==========
  console.log('\nTEST 5: Minimal ADR (required fields only)');
  console.log('-'.repeat(80));
  
  const minimalSessionPath = '.kiro/research/test-minimal-session';
  const minimalADR = `---
title: "Minimal ADR"
date: 2024-05-10
status: Accepted
context: "Research Session test-minimal-session"
---

# Minimal ADR

## Context and Problem Statement

This is a minimal ADR with only required fields.

## Decision Drivers

- Simplicity

## Considered Options

1. Option A

## Decision Outcome

**Chosen option**: Option A

### Rationale

It's simple.
`;
  
  try {
    // Create minimal session
    await fs.mkdir(minimalSessionPath, { recursive: true });
    await fs.writeFile(
      path.join(minimalSessionPath, 'decision.adr.md'),
      minimalADR,
      'utf-8'
    );
    
    const result = await runADRIngestionWorkflow({
      sessionPath: minimalSessionPath,
      sessionId: 'test-minimal-session',
      generateEntityPages: false, // Skip entity pages for minimal test
      addCrossReferences: false,
    });
    
    console.log('   ✓ PASSED: Successfully processed minimal ADR');
    console.log(`   Generated ${result.writtenPaths.length} wiki page(s)`);
    passedTests++;
    
    // Cleanup generated files
    for (const filePath of result.writtenPaths) {
      try {
        await fs.unlink(path.join('wiki', filePath));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Cleanup raw ADR
    try {
      await fs.unlink(result.rawADRPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.log('   ✗ FAILED: Could not process minimal ADR');
    console.log(`   Error: ${error}`);
    failedTests++;
  } finally {
    // Cleanup
    try {
      await fs.unlink(path.join(minimalSessionPath, 'decision.adr.md'));
      await fs.rmdir(minimalSessionPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  // ========== TEST 6: Broken session reference (graceful degradation) ==========
  console.log('\nTEST 6: Broken session reference (graceful degradation)');
  console.log('-'.repeat(80));
  
  const brokenRefSessionPath = '.kiro/research/test-broken-ref-session';
  const brokenRefADR = `---
title: "ADR with Broken References"
date: 2024-05-10
status: Accepted
context: "Research Session test-broken-ref-session"
---

# ADR with Broken References

## Context and Problem Statement

This ADR references non-existent research artifacts.

## Decision Drivers

- Testing error handling

## Considered Options

1. Option A

## Decision Outcome

**Chosen option**: Option A

### Rationale

For testing purposes.

## Research Links

- [Comparison Report](./nonexistent-comparison.md)
- [Final Report](./nonexistent-final.md)
- [Prototype: Test](./prototypes/nonexistent/)
`;
  
  try {
    // Create session with broken references
    await fs.mkdir(brokenRefSessionPath, { recursive: true });
    await fs.writeFile(
      path.join(brokenRefSessionPath, 'decision.adr.md'),
      brokenRefADR,
      'utf-8'
    );
    
    const result = await runADRIngestionWorkflow({
      sessionPath: brokenRefSessionPath,
      sessionId: 'test-broken-ref-session',
      generateEntityPages: false,
      addCrossReferences: false,
    });
    
    console.log('   ✓ PASSED: Gracefully handled broken session references');
    console.log('   Workflow completed despite missing research artifacts');
    console.log(`   Generated ${result.writtenPaths.length} wiki page(s)`);
    passedTests++;
    
    // Cleanup generated files
    for (const filePath of result.writtenPaths) {
      try {
        await fs.unlink(path.join('wiki', filePath));
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Cleanup raw ADR
    try {
      await fs.unlink(result.rawADRPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.log('   ✗ FAILED: Should have gracefully handled broken references');
    console.log(`   Error: ${error}`);
    failedTests++;
  } finally {
    // Cleanup
    try {
      await fs.unlink(path.join(brokenRefSessionPath, 'decision.adr.md'));
      await fs.rmdir(brokenRefSessionPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(80));
  console.log('ERROR HANDLING TEST SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log();
  
  if (failedTests === 0) {
    console.log('🎉 ALL ERROR HANDLING TESTS PASSED!');
    console.log();
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log();
    process.exit(1);
  }
}

// Run the tests
testErrorHandling().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
