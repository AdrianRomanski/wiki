import { DetectDuplicatesUseCase } from '@wiki/application-maintenance';
import { DetectContradictionsUseCase } from '@wiki/application-maintenance';
import { DetectBrokenLinksUseCase } from '@wiki/application-maintenance';
import { DetectOrphansUseCase } from '@wiki/application-maintenance';
import { GenerateMaintenanceReportUseCase } from '@wiki/application-maintenance';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

export async function detectDuplicateContentExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const frontmatterAdapter = new FrontmatterAdapter();

  const detectDuplicatesUseCase = new DetectDuplicatesUseCase(
    fileSystemAdapter,
    frontmatterAdapter
  );

  const similarityThreshold = 0.7;

  console.log(`Detecting duplicate content (threshold: ${similarityThreshold * 100}%)...\n`);

  try {
    const duplicates = await detectDuplicatesUseCase.execute(similarityThreshold);

    console.log(`Found ${duplicates.length} potential duplicate pairs:\n`);

    if (duplicates.length === 0) {
      console.log('No duplicate content found!');
    } else {
      for (const duplicate of duplicates) {
        console.log(`- ${duplicate.page1}`);
        console.log(`  ${duplicate.page2}`);
        console.log(`  Similarity: ${Math.round(duplicate.similarity * 100)}%`);
        console.log(`  Recommendation: ${duplicate.recommendation}`);
        console.log();
      }
    }

    return duplicates;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function detectBrokenLinksExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const detectBrokenLinksUseCase = new DetectBrokenLinksUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  console.log('Detecting broken WikiLinks...\n');

  try {
    const brokenLinks = await detectBrokenLinksUseCase.execute();

    console.log(`Found ${brokenLinks.length} pages with broken links:\n`);

    if (brokenLinks.length === 0) {
      console.log('No broken links found! All WikiLinks are valid.');
    } else {
      for (const result of brokenLinks) {
        console.log(`- ${result.page}`);
        console.log(`  Broken links (${result.brokenLinks.length}):`);
        for (const link of result.brokenLinks) {
          console.log(`    - [[${link}]]`);
        }
        console.log();
      }
    }

    return brokenLinks;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function detectOrphanPagesExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const detectOrphansUseCase = new DetectOrphansUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  console.log('Detecting orphan pages (pages with no incoming links)...\n');

  try {
    const orphans = await detectOrphansUseCase.execute();

    console.log(`Found ${orphans.length} orphan pages:\n`);

    if (orphans.length === 0) {
      console.log('No orphan pages found! All pages are linked from other pages.');
    } else {
      for (const orphan of orphans) {
        console.log(`- ${orphan.page}`);
        console.log(`  Reason: ${orphan.reason}`);
        console.log();
      }
    }

    return orphans;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function detectContradictionsExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const detectContradictionsUseCase = new DetectContradictionsUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  console.log('Detecting potential contradictions between pages...\n');

  try {
    const contradictions = await detectContradictionsUseCase.execute();

    console.log(`Found ${contradictions.length} potential contradictions:\n`);

    if (contradictions.length === 0) {
      console.log('No contradictions detected!');
    } else {
      for (const contradiction of contradictions) {
        console.log(`Severity: ${contradiction.severity.toUpperCase()}`);
        console.log(`Pages involved: ${contradiction.pages.length}`);
        for (const page of contradiction.pages) {
          console.log(`  - ${page}`);
        }
        console.log(`Description: ${contradiction.contradiction}`);
        console.log();
      }
    }

    return contradictions;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function generateMaintenanceReportExample() {
  const fileSystemAdapter = new FileSystemAdapter({
    rootDir: process.cwd(),
    rawDir: './raw',
    wikiDir: './wiki'
  });
  const markdownAdapter = new MarkdownAdapter();
  const frontmatterAdapter = new FrontmatterAdapter();

  const detectDuplicatesUseCase = new DetectDuplicatesUseCase(
    fileSystemAdapter,
    frontmatterAdapter
  );

  const detectContradictionsUseCase = new DetectContradictionsUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  const detectBrokenLinksUseCase = new DetectBrokenLinksUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  const detectOrphansUseCase = new DetectOrphansUseCase(
    fileSystemAdapter,
    markdownAdapter,
    frontmatterAdapter
  );

  const generateMaintenanceReportUseCase = new GenerateMaintenanceReportUseCase(
    detectDuplicatesUseCase,
    detectContradictionsUseCase,
    detectBrokenLinksUseCase,
    detectOrphansUseCase
  );

  console.log('=== Generating Comprehensive Maintenance Report ===\n');
  console.log('Analyzing wiki health...\n');

  try {
    const report = await generateMaintenanceReportUseCase.execute();

    console.log('=== Wiki Health Summary ===\n');
    console.log(`Report generated: ${report.timestamp.toISOString()}`);
    console.log(`Total pages: ${report.summary.totalPages}`);
    console.log(`Total links: ${report.summary.totalLinks}`);
    console.log(`Health score: ${report.summary.healthScore}/100`);
    console.log();

    console.log('=== Duplicates ===\n');
    console.log(`Found ${report.duplicates.length} duplicate pairs`);
    if (report.duplicates.length > 0) {
      for (const dup of report.duplicates.slice(0, 3)) {
        console.log(`- ${dup.page1} <-> ${dup.page2}`);
        console.log(`  Similarity: ${Math.round(dup.similarity * 100)}%`);
      }
      if (report.duplicates.length > 3) {
        console.log(`  ... and ${report.duplicates.length - 3} more`);
      }
    }
    console.log();

    console.log('=== Broken Links ===\n');
    const totalBrokenLinks = report.brokenLinks.reduce(
      (sum, b) => sum + b.brokenLinks.length,
      0
    );
    console.log(`Found ${totalBrokenLinks} broken links in ${report.brokenLinks.length} pages`);
    if (report.brokenLinks.length > 0) {
      for (const broken of report.brokenLinks.slice(0, 3)) {
        console.log(`- ${broken.page}: ${broken.brokenLinks.length} broken links`);
      }
      if (report.brokenLinks.length > 3) {
        console.log(`  ... and ${report.brokenLinks.length - 3} more pages`);
      }
    }
    console.log();

    console.log('=== Orphan Pages ===\n');
    console.log(`Found ${report.orphans.length} orphan pages`);
    if (report.orphans.length > 0) {
      for (const orphan of report.orphans.slice(0, 5)) {
        console.log(`- ${orphan.page}`);
      }
      if (report.orphans.length > 5) {
        console.log(`  ... and ${report.orphans.length - 5} more`);
      }
    }
    console.log();

    console.log('=== Contradictions ===\n');
    console.log(`Found ${report.contradictions.length} potential contradictions`);
    if (report.contradictions.length > 0) {
      for (const contradiction of report.contradictions.slice(0, 3)) {
        console.log(`- Severity: ${contradiction.severity}`);
        console.log(`  Pages: ${contradiction.pages.length}`);
      }
      if (report.contradictions.length > 3) {
        console.log(`  ... and ${report.contradictions.length - 3} more`);
      }
    }
    console.log();

    console.log('=== Consolidation Opportunities ===\n');
    console.log(`Found ${report.consolidationOpportunities.length} opportunities`);
    if (report.consolidationOpportunities.length > 0) {
      for (const opp of report.consolidationOpportunities.slice(0, 3)) {
        console.log(`- Action: ${opp.suggestedAction}`);
        console.log(`  Reason: ${opp.reason}`);
        console.log(`  Pages: ${opp.pages.length}`);
      }
      if (report.consolidationOpportunities.length > 3) {
        console.log(`  ... and ${report.consolidationOpportunities.length - 3} more`);
      }
    }
    console.log();

    console.log('=== Recommendations ===\n');
    if (report.summary.healthScore >= 90) {
      console.log('Wiki is in excellent health!');
    } else if (report.summary.healthScore >= 70) {
      console.log('Wiki is in good health with minor issues to address.');
    } else if (report.summary.healthScore >= 50) {
      console.log('Wiki needs attention. Consider addressing high-priority issues.');
    } else {
      console.log('Wiki requires immediate attention. Multiple critical issues detected.');
    }

    return report;
  } catch (error) {
    console.log('Note: This example requires an actual wiki directory structure.');
    console.log('Error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function comprehensiveMaintenanceWorkflowExample() {
  console.log('=== Comprehensive Maintenance Workflow ===\n');
  console.log('Running all maintenance checks in sequence...\n');

  console.log('Step 1: Detecting duplicate content\n');
  const duplicates = await detectDuplicateContentExample();
  console.log('\n---\n');

  console.log('Step 2: Detecting broken links\n');
  const brokenLinks = await detectBrokenLinksExample();
  console.log('\n---\n');

  console.log('Step 3: Detecting orphan pages\n');
  const orphans = await detectOrphanPagesExample();
  console.log('\n---\n');

  console.log('Step 4: Detecting contradictions\n');
  const contradictions = await detectContradictionsExample();
  console.log('\n---\n');

  console.log('Step 5: Generating comprehensive report\n');
  const report = await generateMaintenanceReportExample();
  console.log('\n---\n');

  console.log('=== Workflow Complete ===\n');
  console.log('All maintenance checks have been executed.');
  console.log('Review the results above for actionable insights.');

  return {
    duplicates,
    brokenLinks,
    orphans,
    contradictions,
    report
  };
}
