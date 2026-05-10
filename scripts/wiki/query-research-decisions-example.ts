/**
 * Example usage of research decision query functionality.
 * 
 * This script demonstrates:
 * - Finding all research decisions (ADR-generated Source_Summary pages)
 * - Searching by research tags ("research", "adr", "decision")
 * - Finding decisions related to specific libraries
 * - Finding decisions from specific research sessions
 * - Date-based sorting (most recent first)
 * - Accessing Session_Reference links
 */

import { createQueryEngine } from './query.js';

async function main() {
  const engine = createQueryEngine();

  console.log('=== Research Decision Query Examples ===\n');

  // Example 1: Find all research decisions
  console.log('1. Find all research decisions:');
  const allDecisions = await engine.findResearchDecisions();

  for (const decision of allDecisions.slice(0, 5)) {
    console.log(`\n  - ${decision.frontmatter.title}`);
    console.log(`    Date: ${decision.frontmatter.date || decision.frontmatter.created}`);
    console.log(`    Tags: ${decision.frontmatter.tags.join(', ')}`);
    
    // Check for ADR-specific frontmatter
    const frontmatter = decision.frontmatter as any;
    if (frontmatter.status) {
      console.log(`    Status: ${frontmatter.status}`);
    }
    if (frontmatter.sessionId) {
      console.log(`    Session: ${frontmatter.sessionId}`);
    }
  }

  // Example 2: Search by "adr" tag
  console.log('\n\n2. Find decisions with "adr" tag:');
  const adrDecisions = await engine.findResearchDecisions({ tag: 'adr' });

  for (const decision of adrDecisions.slice(0, 3)) {
    console.log(`  - ${decision.frontmatter.title}`);
  }

  // Example 3: Search by "research" tag
  console.log('\n\n3. Find decisions with "research" tag:');
  const researchDecisions = await engine.findResearchDecisions({ tag: 'research' });

  for (const decision of researchDecisions.slice(0, 3)) {
    console.log(`  - ${decision.frontmatter.title}`);
  }

  // Example 4: Find decisions related to a specific library
  console.log('\n\n4. Find decisions related to "angular":');
  const angularDecisions = await engine.findResearchDecisions({ libraryName: 'angular' });

  for (const decision of angularDecisions) {
    console.log(`\n  - ${decision.frontmatter.title}`);
    console.log(`    Date: ${decision.frontmatter.date || decision.frontmatter.created}`);
    
    // Show snippet of content mentioning the library
    const content = decision.content.toLowerCase();
    const angularIndex = content.indexOf('angular');
    if (angularIndex !== -1) {
      const snippetStart = Math.max(0, angularIndex - 50);
      const snippetEnd = Math.min(content.length, angularIndex + 100);
      const snippet = decision.content.substring(snippetStart, snippetEnd);
      console.log(`    Context: ...${snippet}...`);
    }
  }

  // Example 5: Find decisions from a specific research session
  console.log('\n\n5. Find decisions from session "session-001":');
  const sessionDecisions = await engine.findResearchDecisions({ sessionId: 'session-001' });

  for (const decision of sessionDecisions) {
    console.log(`  - ${decision.frontmatter.title}`);
    const frontmatter = decision.frontmatter as any;
    if (frontmatter.sessionId) {
      console.log(`    Session ID: ${frontmatter.sessionId}`);
    }
  }

  // Example 6: Combine library search with tag filter
  console.log('\n\n6. Find "adr" decisions related to "react":');
  const reactADRs = await engine.findResearchDecisions({ 
    tag: 'adr',
    libraryName: 'react'
  });

  for (const decision of reactADRs) {
    console.log(`  - ${decision.frontmatter.title}`);
  }

  // Example 7: Use findSources with library filter
  console.log('\n\n7. Find source pages mentioning "typescript":');
  const typescriptSources = await engine.findSources({ libraryName: 'typescript' });

  for (const source of typescriptSources.slice(0, 3)) {
    console.log(`  - ${source.frontmatter.title}`);
    console.log(`    Type: ${source.frontmatter.type}`);
    console.log(`    Tags: ${source.frontmatter.tags.join(', ')}`);
  }

  // Example 8: Use findSources with session ID filter
  console.log('\n\n8. Find source pages from session "session-002":');
  const sessionSources = await engine.findSources({ sessionId: 'session-002' });

  for (const source of sessionSources) {
    console.log(`  - ${source.frontmatter.title}`);
  }

  // Example 9: Full-text search with date sorting
  console.log('\n\n9. Search "library comparison" sorted by date:');
  const dateResults = await engine.search('library comparison', {
    maxResults: 5,
    sortByDate: true,
  });

  for (const result of dateResults) {
    console.log(`\n  - ${result.page.frontmatter.title}`);
    console.log(`    Date: ${result.page.frontmatter.date || result.page.frontmatter.created}`);
    console.log(`    Relevance: ${result.relevance.toFixed(2)}`);
  }

  // Example 10: Extract Session_Reference links from decision content
  console.log('\n\n10. Extract Session_Reference links from decisions:');
  const decisionsWithLinks = await engine.findResearchDecisions({ maxResults: 3 });

  for (const decision of decisionsWithLinks) {
    console.log(`\n  - ${decision.frontmatter.title}`);
    
    // Look for session reference section in content
    const sessionRefMatch = decision.content.match(/## Session Reference\s+([\s\S]*?)(?=\n##|\n$)/);
    if (sessionRefMatch) {
      const sessionRefSection = sessionRefMatch[1].trim();
      console.log(`    Session Reference found:`);
      
      // Extract links from the section
      const linkMatches = sessionRefSection.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const match of linkMatches) {
        console.log(`      - ${match[1]}: ${match[2]}`);
      }
    } else {
      console.log(`    No Session Reference section found`);
    }
  }

  console.log('\n\n=== Research Decision Query Examples Complete ===');
}

// Run the examples
main().catch(console.error);
