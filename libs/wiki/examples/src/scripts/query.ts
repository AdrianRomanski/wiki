#!/usr/bin/env ts-node

import {
  fullTextSearchExample,
  tagBasedSearchExample,
  queryByPageTypeExample,
  combineMultipleCriteriaExample,
  comprehensiveQueryWorkflowExample
} from '../lib/query-and-search.example';

async function main() {
  console.log('=== Wiki Query and Search Examples ===\n');
  
  console.log('1. Full-Text Search\n');
  await fullTextSearchExample();
  console.log('\n---\n');

  console.log('2. Tag-Based Search\n');
  await tagBasedSearchExample();
  console.log('\n---\n');

  console.log('3. Query by Page Type\n');
  await queryByPageTypeExample();
  console.log('\n---\n');

  console.log('4. Combining Multiple Criteria\n');
  await combineMultipleCriteriaExample();
  console.log('\n---\n');

  console.log('5. Comprehensive Query Workflow\n');
  await comprehensiveQueryWorkflowExample();
  console.log('\n---\n');

  console.log('All query examples completed!');
}

main().catch((error) => {
  console.error('Error running query examples:', error);
  process.exit(1);
});
