/**
 * Example demonstrating git integration with the complete wiki workflow.
 * 
 * This example shows how git commits are automatically created during:
 * - Raw source ingestion
 * - Wiki page generation
 * - Index updates
 * - Activity log updates
 */

import {
  runIngestionWorkflow,
  IngestionWorkflowOptions,
} from './workflow.js';
import {
  commitWikiChanges,
  WikiChange,
  isGitRepository,
  verifyWikiPagesInGit,
  getFileHistory,
} from './git-integration.js';

/**
 * Example: Ingest a raw source and commit all changes to git
 */
async function exampleIngestionWithGitCommit() {
  console.log('\n=== Ingestion Workflow with Git Integration ===\n');
  
  // Check if we're in a git repository
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  // Define ingestion options
  const options: IngestionWorkflowOptions = {
    sourcePath: 'articles/angular-aria-example.md',
    sourceSummaryOptions: {
      title: 'Angular ARIA Best Practices',
      author: 'Angular Team',
      date: '2024-05-10',
      url: 'https://angular.dev/guide/accessibility',
      keyPoints: [
        'Use semantic HTML elements',
        'Provide ARIA labels for custom components',
        'Test with screen readers',
        'Ensure keyboard navigation works',
      ],
      insights: 'Angular provides excellent accessibility support through the CDK and Material libraries.',
      tags: ['angular', 'accessibility', 'aria', 'best-practices'],
    },
  };
  
  console.log('Step 1: Running ingestion workflow...');
  console.log(`  Source: ${options.sourcePath}`);
  
  try {
    // Run the ingestion workflow
    // This will:
    // 1. Read the raw source
    // 2. Generate wiki pages
    // 3. Update the index
    // 4. Record activity log entries
    const result = await runIngestionWorkflow(options);
    
    console.log('\nStep 2: Ingestion completed successfully!');
    console.log(`  Generated ${result.pages.length} page(s):`);
    result.writtenPaths.forEach(path => console.log(`    - ${path}`));
    
    // Step 3: Commit all changes to git
    console.log('\nStep 3: Committing changes to git...');
    
    // Create a WikiChange for the ingestion
    const change: WikiChange = {
      type: 'ingest',
      filePath: result.writtenPaths[0], // Primary generated page
      sourcePath: options.sourcePath,
      generatedPages: result.writtenPaths,
    };
    
    // Commit the changes
    const commitHash = await commitWikiChanges([change]);
    console.log(`  Created commit: ${commitHash}`);
    
    // Step 4: Verify the commit
    console.log('\nStep 4: Verifying git storage...');
    const verification = await verifyWikiPagesInGit();
    console.log(`  Wiki pages tracked in git: ${verification.trackedCount}`);
    
    // Step 5: View history for one of the generated pages
    if (result.writtenPaths.length > 0) {
      console.log('\nStep 5: Viewing commit history...');
      const history = await getFileHistory(result.writtenPaths[0], 1);
      if (history.all.length > 0) {
        const commit = history.all[0];
        console.log(`  Latest commit for ${result.writtenPaths[0]}:`);
        console.log(`    Hash: ${commit.hash.substring(0, 7)}`);
        console.log(`    Date: ${commit.date}`);
        console.log(`    Message: ${commit.message}`);
      }
    }
    
    console.log('\n✓ Complete workflow with git integration successful!');
    
  } catch (error) {
    console.error('\n✗ Workflow failed:', error);
  }
}

/**
 * Example: Manual git commit for wiki page updates
 */
async function exampleManualGitCommit() {
  console.log('\n=== Manual Git Commit for Wiki Updates ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  console.log('Scenario: You manually updated a wiki page and want to commit it.');
  
  // Define the change
  const change: WikiChange = {
    type: 'update',
    filePath: 'wiki/entities/angular-cdk.md',
    pageTitle: 'Angular CDK',
    changes: 'Added focus management examples and updated API references',
  };
  
  console.log(`\nChange details:`);
  console.log(`  Type: ${change.type}`);
  console.log(`  File: ${change.filePath}`);
  console.log(`  Changes: ${change.changes}`);
  
  try {
    // Commit the change
    console.log('\nCommitting to git...');
    const commitHash = await commitWikiChanges([change]);
    console.log(`✓ Created commit: ${commitHash}`);
    
    // View the commit history
    const history = await getFileHistory(change.filePath, 3);
    console.log(`\nRecent commits for ${change.filePath}:`);
    history.all.forEach((commit, index) => {
      console.log(`  ${index + 1}. ${commit.hash.substring(0, 7)} - ${commit.message}`);
    });
    
  } catch (error) {
    console.error('✗ Commit failed:', error);
  }
}

/**
 * Example: Batch multiple wiki operations into a single commit
 */
async function exampleBatchCommit() {
  console.log('\n=== Batch Multiple Operations into Single Commit ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  console.log('Scenario: Multiple wiki pages were created/updated in a single session.');
  
  // Define multiple changes
  const changes: WikiChange[] = [
    {
      type: 'create',
      filePath: 'wiki/entities/angular-material.md',
      pageTitle: 'Angular Material',
      pageType: 'entity',
    },
    {
      type: 'create',
      filePath: 'wiki/concepts/material-design.md',
      pageTitle: 'Material Design',
      pageType: 'concept',
    },
    {
      type: 'update',
      filePath: 'wiki/index.md',
      pageTitle: 'Index',
      changes: 'Added new entity and concept entries',
    },
  ];
  
  console.log(`\nBatching ${changes.length} changes:`);
  changes.forEach((change, index) => {
    console.log(`  ${index + 1}. ${change.type} - ${change.pageTitle || change.filePath}`);
  });
  
  try {
    // Commit all changes together
    console.log('\nCommitting batch to git...');
    const commitHash = await commitWikiChanges(changes);
    console.log(`✓ Created commit: ${commitHash}`);
    console.log('  All changes committed in a single commit for better history.');
    
  } catch (error) {
    console.error('✗ Batch commit failed:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('='.repeat(70));
  console.log('Git Workflow Integration Examples');
  console.log('='.repeat(70));
  
  await exampleIngestionWithGitCommit();
  await exampleManualGitCommit();
  await exampleBatchCommit();
  
  console.log('\n' + '='.repeat(70));
  console.log('All examples completed!');
  console.log('='.repeat(70));
  console.log('\nKey Takeaways:');
  console.log('1. Git commits are created automatically during ingestion');
  console.log('2. Commit messages are meaningful and describe the changes');
  console.log('3. Multiple related changes can be batched into single commits');
  console.log('4. Git history provides full audit trail of wiki evolution');
  console.log('5. All wiki pages and raw sources are tracked in git');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  exampleIngestionWithGitCommit,
  exampleManualGitCommit,
  exampleBatchCommit,
};
