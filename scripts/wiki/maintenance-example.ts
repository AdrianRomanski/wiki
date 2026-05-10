/**
 * Example script demonstrating the maintenance workflow.
 * 
 * This script shows how to:
 * - Validate all wiki links
 * - Detect duplicate content
 * - Detect contradictions
 * - Suggest consolidation opportunities
 * - Find orphaned pages
 * - Generate a comprehensive maintenance report
 * 
 * Usage:
 *   npx tsx scripts/wiki/maintenance-example.ts
 */

import { join } from 'path';
import {
  validateAllLinks,
  detectDuplicates,
  detectContradictions,
  suggestConsolidation,
  findOrphans,
  generateMaintenanceReport
} from './maintenance.js';

const WIKI_DIR = join(process.cwd(), 'wiki');

async function main() {
  console.log('🔍 Running Wiki Maintenance Workflow\n');
  console.log('=' .repeat(60));
  
  // 1. Validate all links
  console.log('\n📎 Validating Wiki Links...');
  const linkValidation = await validateAllLinks(WIKI_DIR);
  
  const pagesWithBrokenLinks = linkValidation.filter(v => v.brokenLinks.length > 0);
  
  if (pagesWithBrokenLinks.length === 0) {
    console.log('✅ All links are valid!');
  } else {
    console.log(`⚠️  Found ${pagesWithBrokenLinks.length} pages with broken links:`);
    for (const page of pagesWithBrokenLinks) {
      console.log(`\n  📄 ${page.title} (${page.page})`);
      console.log(`     Broken links: ${page.brokenLinks.join(', ')}`);
    }
  }
  
  // 2. Detect duplicates
  console.log('\n\n🔄 Detecting Duplicate Content...');
  const duplicates = await detectDuplicates(WIKI_DIR, 0.7);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate content detected!');
  } else {
    console.log(`⚠️  Found ${duplicates.length} potential duplicates:`);
    for (const dup of duplicates) {
      console.log(`\n  📄 ${dup.page1} ↔️ ${dup.page2}`);
      console.log(`     Similarity: ${Math.round(dup.similarity * 100)}%`);
      console.log(`     ${dup.recommendation}`);
    }
  }
  
  // 3. Detect contradictions
  console.log('\n\n⚡ Detecting Contradictions...');
  const contradictions = await detectContradictions(WIKI_DIR);
  
  if (contradictions.length === 0) {
    console.log('✅ No contradictions detected!');
  } else {
    console.log(`⚠️  Found ${contradictions.length} potential contradictions:`);
    for (const contradiction of contradictions) {
      console.log(`\n  📄 Pages: ${contradiction.pages.join(', ')}`);
      console.log(`     Severity: ${contradiction.severity}`);
      console.log(`     ${contradiction.contradiction}`);
    }
  }
  
  // 4. Suggest consolidation
  console.log('\n\n🔗 Suggesting Consolidation Opportunities...');
  const consolidationOpportunities = await suggestConsolidation(WIKI_DIR);
  
  if (consolidationOpportunities.length === 0) {
    console.log('✅ No consolidation opportunities found!');
  } else {
    console.log(`💡 Found ${consolidationOpportunities.length} consolidation opportunities:`);
    for (const opp of consolidationOpportunities) {
      console.log(`\n  📄 Pages: ${opp.pages.join(', ')}`);
      console.log(`     Reason: ${opp.reason}`);
      console.log(`     Action: ${opp.suggestedAction}`);
    }
  }
  
  // 5. Find orphans
  console.log('\n\n🏝️  Finding Orphaned Pages...');
  const orphans = await findOrphans(WIKI_DIR);
  
  if (orphans.length === 0) {
    console.log('✅ No orphaned pages found!');
  } else {
    console.log(`⚠️  Found ${orphans.length} orphaned pages:`);
    for (const orphan of orphans) {
      console.log(`\n  📄 ${orphan.page}`);
      console.log(`     ${orphan.reason}`);
    }
  }
  
  // 6. Generate comprehensive report
  console.log('\n\n📊 Generating Comprehensive Maintenance Report...');
  const report = await generateMaintenanceReport(WIKI_DIR);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 MAINTENANCE REPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n📅 Generated: ${report.timestamp.toISOString()}`);
  console.log(`\n📈 Statistics:`);
  console.log(`   Total Pages: ${report.summary.totalPages}`);
  console.log(`   Total Links: ${report.summary.totalLinks}`);
  console.log(`   Health Score: ${report.summary.healthScore}/100`);
  
  console.log(`\n🔍 Issues Found:`);
  console.log(`   Broken Links: ${report.brokenLinks.length}`);
  console.log(`   Duplicates: ${report.duplicates.length}`);
  console.log(`   Contradictions: ${report.contradictions.length}`);
  console.log(`   Orphaned Pages: ${report.orphans.length}`);
  console.log(`   Consolidation Opportunities: ${report.consolidationOpportunities.length}`);
  
  // Health score interpretation
  console.log(`\n💊 Health Assessment:`);
  if (report.summary.healthScore >= 90) {
    console.log('   ✅ Excellent - Wiki is in great shape!');
  } else if (report.summary.healthScore >= 70) {
    console.log('   ⚠️  Good - Minor issues to address');
  } else if (report.summary.healthScore >= 50) {
    console.log('   ⚠️  Fair - Several issues need attention');
  } else {
    console.log('   ❌ Poor - Significant maintenance required');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Maintenance workflow complete!\n');
}

// Run the example
main().catch(error => {
  console.error('❌ Error running maintenance workflow:', error);
  process.exit(1);
});
