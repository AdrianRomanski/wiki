/**
 * Thin Driver_Adapter composition root for tag distribution validation.
 *
 * Wires the Infrastructure `FileSystemAdapter` and `FrontmatterAdapter`
 * into the Application `ValidateTagDistributionUseCase`, invokes it, and
 * prints the frequency table + violations. No business logic lives here —
 * scanning wiki/entities/, wiki/concepts/, wiki/sources/, extracting tags
 * from frontmatter, and computing the 60% frequency threshold is handled
 * entirely by the use case in @wiki/application-tag-validation.
 *
 * Returns the process exit code the caller should use:
 * - 0: All tags pass validation (no tag exceeds 60% threshold)
 * - 1: Validation failed (one or more tags exceed 60% threshold)
 */

import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { ValidateTagDistributionUseCase } from '@wiki/application-tag-validation';

const MAX_TAG_FREQUENCY = 0.6; // 60%

function formatFrequency(count: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((count / total) * 100).toFixed(1)}%`;
}

export async function runValidateTags(workspaceRoot: string): Promise<number> {
  console.log('Tag Distribution Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const fsAdapter = new FileSystemAdapter({
    rootDir: workspaceRoot,
    rawDir: 'raw',
    wikiDir: 'wiki',
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const useCase = new ValidateTagDistributionUseCase(fsAdapter, frontmatterAdapter);

  const result = await useCase.execute();
  const { totalPages, tagCounts, violations, passed } = result;

  if (totalPages === 0) {
    console.log('⚠ No pages with tags found - nothing to validate');
    return 0;
  }

  console.log(`📊 Tag Statistics:`);
  console.log(`   Total pages:    ${totalPages}`);
  console.log(`   Unique tags:    ${tagCounts.size}`);
  console.log(`   Max threshold:  ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}%`);
  console.log('');

  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  console.log('🏷️  Top 20 Most Frequent Tags:');
  console.log('');
  console.log('Tag                            Count  Frequency  Status');
  console.log('─────────────────────────────  ─────  ─────────  ──────');

  const topTags = sortedTags.slice(0, 20);
  for (const [tag, count] of topTags) {
    const frequency = count / totalPages;
    const freqStr = formatFrequency(count, totalPages);
    const status = frequency > MAX_TAG_FREQUENCY ? '❌ FAIL' : '✅ PASS';
    const paddedTag = tag.padEnd(30);
    const paddedCount = count.toString().padStart(5);
    const paddedFreq = freqStr.padStart(9);
    console.log(`${paddedTag} ${paddedCount}  ${paddedFreq}  ${status}`);
  }

  console.log('');

  if (passed) {
    console.log('✅ VALIDATION PASSED');
    console.log('');
    console.log(`All ${tagCounts.size} tags are within the ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}% frequency threshold.`);
    console.log('');
    return 0;
  }

  console.log('❌ VALIDATION FAILED');
  console.log('');
  console.log(`${violations.length} tag(s) exceed the ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}% frequency threshold:`);
  console.log('');

  for (const violation of violations) {
    const freqStr = formatFrequency(violation.count, totalPages);
    console.log(`  - "${violation.tag}": ${freqStr} (${violation.count}/${totalPages} pages)`);

    const pages = violation.pages;
    console.log(`    Pages: ${pages.slice(0, 5).join(', ')}${pages.length > 5 ? ` ... and ${pages.length - 5} more` : ''}`);
    console.log('');
  }

  console.log('💡 Recommendations:');
  console.log('   - Distribute tags more evenly across pages');
  console.log('   - Use more specific tags instead of broad categories');
  console.log('   - Consider splitting high-frequency tags into sub-categories');
  console.log('');
  return 1;
}
