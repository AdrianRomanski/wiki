#!/usr/bin/env ts-node

import {
  detectDuplicateContentExample,
  detectBrokenLinksExample,
  detectOrphanPagesExample,
  detectContradictionsExample,
  generateMaintenanceReportExample,
  comprehensiveMaintenanceWorkflowExample
} from '../lib/maintenance.example';

async function main() {
  console.log('=== Wiki Maintenance Examples ===\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--full') || args.length === 0) {
    console.log('Running comprehensive maintenance workflow...\n');
    await comprehensiveMaintenanceWorkflowExample();
  } else {
    if (args.includes('--duplicates')) {
      console.log('Detecting duplicate content...\n');
      await detectDuplicateContentExample();
      console.log('\n---\n');
    }
    
    if (args.includes('--broken-links')) {
      console.log('Detecting broken links...\n');
      await detectBrokenLinksExample();
      console.log('\n---\n');
    }
    
    if (args.includes('--orphans')) {
      console.log('Detecting orphan pages...\n');
      await detectOrphanPagesExample();
      console.log('\n---\n');
    }
    
    if (args.includes('--contradictions')) {
      console.log('Detecting contradictions...\n');
      await detectContradictionsExample();
      console.log('\n---\n');
    }
    
    if (args.includes('--report')) {
      console.log('Generating maintenance report...\n');
      await generateMaintenanceReportExample();
      console.log('\n---\n');
    }
  }

  console.log('Maintenance examples completed!');
}

main().catch((error) => {
  console.error('Error running maintenance examples:', error);
  process.exit(1);
});
