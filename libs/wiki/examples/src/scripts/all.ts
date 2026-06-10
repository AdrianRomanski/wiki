#!/usr/bin/env ts-node

import { basicSetupExample } from '../lib/basic-setup.example';
import { 
  generateEntityPageExample
} from '../lib/generate-entity-page.example';
import { 
  generateConceptPageForArchitecturalPrinciple
} from '../lib/generate-concept-page.example';
import { 
  generateSourceSummaryArticleExample
} from '../lib/generate-source-summary.example';
import {
  fullTextSearchExample,
  queryByPageTypeExample
} from '../lib/query-and-search.example';
import {
  generateMaintenanceReportExample
} from '../lib/maintenance.example';

async function main() {
  console.log('=== Running All Wiki Examples ===\n');
  
  console.log('Step 1: Setup\n');
  console.log('Initializing wiki system...\n');
  const wikiSystem = basicSetupExample();
  console.log('✓ WikiSystem initialized\n');
  console.log('---\n');

  console.log('Step 2: Page Generation\n');
  console.log('Generating example pages...\n');
  
  const entityResult = generateEntityPageExample();
  console.log(`✓ Entity page: ${entityResult.filename}`);
  
  const conceptResult = generateConceptPageForArchitecturalPrinciple();
  console.log(`✓ Concept page: ${conceptResult.filename}`);
  
  const sourceResult = generateSourceSummaryArticleExample();
  console.log(`✓ Source summary: ${sourceResult.filename}`);
  
  console.log('\n---\n');

  console.log('Step 3: Query and Search\n');
  console.log('Searching wiki content...\n');
  
  await fullTextSearchExample();
  console.log();
  
  await queryByPageTypeExample();
  console.log('\n---\n');

  console.log('Step 4: Maintenance\n');
  console.log('Checking wiki health...\n');
  
  await generateMaintenanceReportExample();
  console.log('\n---\n');

  console.log('=== All Examples Completed Successfully ===\n');
  console.log('Summary:');
  console.log('  ✓ Wiki system setup and configuration');
  console.log('  ✓ Page generation (entity, concept, source)');
  console.log('  ✓ Query and search operations');
  console.log('  ✓ Maintenance and health checks');
  console.log();
  console.log('For more detailed examples, run individual scripts:');
  console.log('  npm run examples:setup');
  console.log('  npm run examples:generate');
  console.log('  npm run examples:query');
  console.log('  npm run examples:maintenance');
}

main().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
