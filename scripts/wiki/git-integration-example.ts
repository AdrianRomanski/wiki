/**
 * Example usage of git integration module.
 * 
 * This file demonstrates how to use the git integration functions
 * to commit wiki changes, verify git storage, and view history.
 */

import {
  generateCommitMessage,
  isGitRepository,
  commitWikiChanges,
  batchWikiChange,
  flushCommitBatch,
  verifyWikiPagesInGit,
  verifyRawSourcesInGit,
  verifyFileInGit,
  getFileHistory,
  getFileDiff,
  getGitStatus,
  WikiChange,
} from './git-integration.js';

/**
 * Example 1: Commit a single wiki page creation
 */
async function example1_commitSinglePage() {
  console.log('\n=== Example 1: Commit Single Page ===\n');
  
  // Check if we're in a git repository
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  // Define the change
  const change: WikiChange = {
    type: 'create',
    filePath: 'wiki/entities/angular-cdk.md',
    pageTitle: 'Angular CDK',
    pageType: 'entity',
  };
  
  // Generate commit message
  const message = generateCommitMessage([change]);
  console.log('Generated commit message:', message);
  
  // Commit the change (uncomment to actually commit)
  // const hash = await commitWikiChanges([change]);
  // console.log('Created commit:', hash);
}

/**
 * Example 2: Batch multiple related changes
 */
async function example2_batchChanges() {
  console.log('\n=== Example 2: Batch Multiple Changes ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  // Add multiple changes to the batch
  await batchWikiChange({
    type: 'create',
    filePath: 'wiki/entities/angular-cdk.md',
    pageTitle: 'Angular CDK',
    pageType: 'entity',
  });
  
  await batchWikiChange({
    type: 'create',
    filePath: 'wiki/concepts/accessibility.md',
    pageTitle: 'Accessibility',
    pageType: 'concept',
  });
  
  await batchWikiChange({
    type: 'update',
    filePath: 'wiki/index.md',
    pageTitle: 'Index',
  });
  
  console.log('Added 3 changes to batch. They will be committed together after delay.');
  
  // Flush the batch immediately (uncomment to actually commit)
  // const hash = await flushCommitBatch();
  // console.log('Flushed batch, created commit:', hash);
}

/**
 * Example 3: Commit source ingestion
 */
async function example3_commitIngestion() {
  console.log('\n=== Example 3: Commit Source Ingestion ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  // Define ingestion change
  const change: WikiChange = {
    type: 'ingest',
    filePath: 'wiki/sources/angular-aria-guide-2024-05-10.md',
    sourcePath: 'raw/articles/angular-aria.md',
    generatedPages: [
      'wiki/entities/angular-cdk.md',
      'wiki/concepts/accessibility.md',
      'wiki/sources/angular-aria-guide-2024-05-10.md',
    ],
  };
  
  // Generate commit message
  const message = generateCommitMessage([change]);
  console.log('Generated commit message:', message);
  
  // Commit the change (uncomment to actually commit)
  // const hash = await commitWikiChanges([change]);
  // console.log('Created commit:', hash);
}

/**
 * Example 4: Verify git storage
 */
async function example4_verifyStorage() {
  console.log('\n=== Example 4: Verify Git Storage ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  // Verify wiki pages are in git
  const wikiResult = await verifyWikiPagesInGit();
  console.log(`Wiki pages tracked in git: ${wikiResult.trackedCount}`);
  if (wikiResult.untrackedFiles.length > 0) {
    console.log('Untracked wiki files:', wikiResult.untrackedFiles);
  }
  
  // Verify raw sources are in git
  const rawResult = await verifyRawSourcesInGit();
  console.log(`Raw sources tracked in git: ${rawResult.trackedCount}`);
  if (rawResult.untrackedFiles.length > 0) {
    console.log('Untracked raw files:', rawResult.untrackedFiles);
  }
  
  // Verify specific file
  const filePath = 'wiki/index.md';
  const isTracked = await verifyFileInGit(filePath);
  console.log(`File ${filePath} is ${isTracked ? 'tracked' : 'not tracked'} in git`);
}

/**
 * Example 5: View file history
 */
async function example5_viewHistory() {
  console.log('\n=== Example 5: View File History ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  const filePath = 'wiki/index.md';
  
  try {
    // Get file history
    const history = await getFileHistory(filePath, 5);
    
    console.log(`History for ${filePath}:`);
    history.all.forEach((commit, index) => {
      console.log(`\n${index + 1}. ${commit.hash.substring(0, 7)}`);
      console.log(`   Date: ${commit.date}`);
      console.log(`   Author: ${commit.author_name}`);
      console.log(`   Message: ${commit.message}`);
    });
  } catch (error) {
    console.log(`No history found for ${filePath} (file may not be committed yet)`);
  }
}

/**
 * Example 6: View file diff
 */
async function example6_viewDiff() {
  console.log('\n=== Example 6: View File Diff ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  const filePath = 'wiki/index.md';
  
  try {
    // Get diff between HEAD and working directory
    const diff = await getFileDiff(filePath);
    
    if (diff.trim().length > 0) {
      console.log(`Diff for ${filePath}:`);
      console.log(diff);
    } else {
      console.log(`No changes in ${filePath}`);
    }
  } catch (error) {
    console.log(`Could not get diff for ${filePath}`);
  }
}

/**
 * Example 7: Check git status
 */
async function example7_checkStatus() {
  console.log('\n=== Example 7: Check Git Status ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  const status = await getGitStatus();
  
  console.log('Git Status:');
  console.log(`  Modified files: ${status.modified.length}`);
  console.log(`  Staged files: ${status.staged.length}`);
  console.log(`  Untracked files: ${status.not_added.length}`);
  console.log(`  Deleted files: ${status.deleted.length}`);
  
  if (status.modified.length > 0) {
    console.log('\nModified files:');
    status.modified.forEach(file => console.log(`  - ${file}`));
  }
  
  if (status.not_added.length > 0) {
    console.log('\nUntracked files:');
    status.not_added.forEach(file => console.log(`  - ${file}`));
  }
}

/**
 * Example 8: Complete workflow - ingest source and commit
 */
async function example8_completeWorkflow() {
  console.log('\n=== Example 8: Complete Workflow ===\n');
  
  if (!(await isGitRepository())) {
    console.log('Not in a git repository. Skipping example.');
    return;
  }
  
  console.log('Simulating complete ingestion workflow:');
  console.log('1. Ingest raw source');
  console.log('2. Generate wiki pages');
  console.log('3. Update index');
  console.log('4. Record activity log');
  console.log('5. Commit all changes to git');
  
  // Define all changes that would happen during ingestion
  const changes: WikiChange[] = [
    {
      type: 'ingest',
      filePath: 'wiki/sources/angular-aria-guide-2024-05-10.md',
      sourcePath: 'raw/articles/angular-aria.md',
      generatedPages: [
        'wiki/entities/angular-cdk.md',
        'wiki/concepts/accessibility.md',
      ],
    },
  ];
  
  // Generate commit message
  const message = generateCommitMessage(changes);
  console.log('\nGenerated commit message:', message);
  console.log('\nThis would commit:');
  console.log('  - wiki/sources/angular-aria-guide-2024-05-10.md');
  console.log('  - wiki/entities/angular-cdk.md');
  console.log('  - wiki/concepts/accessibility.md');
  console.log('  - wiki/index.md (updated)');
  console.log('  - wiki/activity-log.md (updated)');
  
  // Commit (uncomment to actually commit)
  // const hash = await commitWikiChanges(changes);
  // console.log('\nCreated commit:', hash);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('Git Integration Examples');
  console.log('='.repeat(60));
  
  await example1_commitSinglePage();
  await example2_batchChanges();
  await example3_commitIngestion();
  await example4_verifyStorage();
  await example5_viewHistory();
  await example6_viewDiff();
  await example7_checkStatus();
  await example8_completeWorkflow();
  
  console.log('\n' + '='.repeat(60));
  console.log('Examples completed!');
  console.log('='.repeat(60));
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  example1_commitSinglePage,
  example2_batchChanges,
  example3_commitIngestion,
  example4_verifyStorage,
  example5_viewHistory,
  example6_viewDiff,
  example7_checkStatus,
  example8_completeWorkflow,
};
