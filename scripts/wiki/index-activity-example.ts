/**
 * Example demonstrating index and activity log management.
 * 
 * This script shows how to:
 * - Add entries to the index page
 * - Record activity log events
 * - Regenerate the index
 * - Retrieve recent activity
 */

import {
  addEntityToIndex,
  addConceptToIndex,
  addSourceToIndex,
  regenerateIndex,
} from './index-manager.js';
import {
  recordIngestion,
  recordCreation,
  recordUpdate,
  getRecentEntries,
} from './activity-log.js';
import { WikiPage } from './models.js';

/**
 * Example: Adding a new entity page to the wiki
 */
async function exampleAddEntity() {
  console.log('Example: Adding entity to index and recording creation\n');
  
  // Create a wiki page object
  const entityPage: WikiPage = {
    path: 'entities/angular-cdk.md',
    filename: 'angular-cdk.md',
    frontmatter: {
      title: 'Angular CDK',
      type: 'entity',
      tags: ['angular', 'accessibility', 'cdk'],
      created: '2024-05-11',
      updated: '2024-05-11',
    },
    content: 'The Angular Component Dev Kit (CDK) is a set of behavior primitives...',
    sections: [],
    outgoingLinks: ['angular-material', 'aria-patterns'],
    incomingLinks: [],
  };
  
  // Add to index
  await addEntityToIndex(
    entityPage,
    'Angular Component Dev Kit for building accessible components'
  );
  console.log('✓ Added entity to index');
  
  // Record creation in activity log
  await recordCreation(
    entityPage.path,
    entityPage.frontmatter.title,
    entityPage.frontmatter.type,
    'articles/angular-aria.md',
    entityPage.frontmatter.tags
  );
  console.log('✓ Recorded creation in activity log\n');
}

/**
 * Example: Adding a new concept page to the wiki
 */
async function exampleAddConcept() {
  console.log('Example: Adding concept to index and recording creation\n');
  
  const conceptPage: WikiPage = {
    path: 'concepts/progressive-enhancement.md',
    filename: 'progressive-enhancement.md',
    frontmatter: {
      title: 'Progressive Enhancement',
      type: 'concept',
      tags: ['accessibility', 'web-development', 'design-pattern'],
      created: '2024-05-11',
      updated: '2024-05-11',
    },
    content: 'Progressive Enhancement is a web design strategy...',
    sections: [],
    outgoingLinks: ['semantic-html', 'aria-patterns'],
    incomingLinks: [],
  };
  
  // Add to index
  await addConceptToIndex(
    conceptPage,
    'Building accessible experiences that work for everyone'
  );
  console.log('✓ Added concept to index');
  
  // Record creation in activity log
  await recordCreation(
    conceptPage.path,
    conceptPage.frontmatter.title,
    conceptPage.frontmatter.type,
    undefined,
    conceptPage.frontmatter.tags
  );
  console.log('✓ Recorded creation in activity log\n');
}

/**
 * Example: Recording an ingestion event
 */
async function exampleRecordIngestion() {
  console.log('Example: Recording source ingestion\n');
  
  await recordIngestion(
    'articles/angular-aria-best-practices.md',
    [
      'entities/angular-cdk.md',
      'concepts/progressive-enhancement.md',
      'concepts/keyboard-navigation.md',
    ]
  );
  console.log('✓ Recorded ingestion event\n');
}

/**
 * Example: Recording a page update
 */
async function exampleRecordUpdate() {
  console.log('Example: Recording page update\n');
  
  await recordUpdate(
    'entities/angular-cdk.md',
    'Angular CDK',
    'Added new examples for focus management and live announcer',
    'Incorporated feedback from code review'
  );
  console.log('✓ Recorded update event\n');
}

/**
 * Example: Regenerating the index
 */
async function exampleRegenerateIndex() {
  console.log('Example: Regenerating index from all wiki pages\n');
  
  // Regenerate index by scanning all wiki pages
  await regenerateIndex();
  console.log('✓ Regenerated index\n');
}

/**
 * Example: Retrieving recent activity
 */
async function exampleGetRecentActivity() {
  console.log('Example: Retrieving recent activity\n');
  
  const recentEntries = await getRecentEntries(5);
  
  console.log(`Found ${recentEntries.length} recent entries:\n`);
  
  for (const entry of recentEntries) {
    const timestamp = entry.timestamp.toISOString().split('T')[0];
    
    switch (entry.type) {
      case 'creation':
        console.log(`  [${timestamp}] Created: ${entry.pageTitle} (${entry.pageType})`);
        break;
      case 'update':
        console.log(`  [${timestamp}] Updated: ${entry.pageTitle}`);
        console.log(`    Changes: ${entry.changes}`);
        break;
      case 'ingestion':
        console.log(`  [${timestamp}] Ingested: ${entry.sourcePath}`);
        console.log(`    Generated ${entry.generatedPages?.length || 0} pages`);
        break;
    }
  }
  console.log();
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('='.repeat(60));
  console.log('Index and Activity Log Management Examples');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Note: These examples would actually modify the wiki files
    // In a real scenario, you'd run them one at a time or in a test environment
    
    console.log('These examples demonstrate the API usage.');
    console.log('To actually run them, uncomment the function calls below.\n');
    
    // await exampleAddEntity();
    // await exampleAddConcept();
    // await exampleRecordIngestion();
    // await exampleRecordUpdate();
    // await exampleRegenerateIndex();
    // await exampleGetRecentActivity();
    
    console.log('Example API calls:');
    console.log('  - addEntityToIndex(page, description)');
    console.log('  - addConceptToIndex(page, description)');
    console.log('  - addSourceToIndex(page, description)');
    console.log('  - recordCreation(path, title, type, source, tags)');
    console.log('  - recordUpdate(path, title, changes, reason)');
    console.log('  - recordIngestion(sourcePath, generatedPages)');
    console.log('  - regenerateIndex()');
    console.log('  - getRecentEntries(count)');
    console.log();
    
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
