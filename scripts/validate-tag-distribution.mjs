#!/usr/bin/env node
/**
 * Tag Distribution Validation Script
 *
 * Validates that no single tag appears in more than 60% of generated wiki pages.
 * Scans all markdown files in wiki/entities, wiki/concepts, and wiki/sources,
 * extracts tags from YAML frontmatter, and reports frequency statistics.
 *
 * Exit codes:
 * - 0: All tags pass validation (no tag exceeds 60% threshold)
 * - 1: Validation failed (one or more tags exceed 60% threshold)
 *
 * Run with: npm run validate:tags
 * or: node scripts/validate-tag-distribution.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '..');
const wikiDir = join(workspaceRoot, 'wiki');

const MAX_TAG_FREQUENCY = 0.60; // 60%

/**
 * Extracts tags from a markdown file's YAML frontmatter
 * @param {string} filePath - Path to the markdown file
 * @returns {string[]} Array of tags, or empty array if no tags found
 */
function extractTagsFromFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.warn(`⚠ No frontmatter found in ${filePath}`);
      return [];
    }

    const frontmatter = yaml.parse(frontmatterMatch[1]);
    
    if (!frontmatter.tags || !Array.isArray(frontmatter.tags)) {
      console.warn(`⚠ No tags array found in ${filePath}`);
      return [];
    }

    return frontmatter.tags;
  } catch (error) {
    console.error(`✗ Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Scans a directory for markdown files and collects their tags
 * @param {string} dirPath - Path to directory to scan
 * @returns {Object} { files: string[], tagsByFile: Map<string, string[]> }
 */
function scanDirectoryForTags(dirPath) {
  const files = [];
  const tagsByFile = new Map();

  if (!existsSync(dirPath)) {
    return { files, tagsByFile };
  }

  const entries = readdirSync(dirPath);
  
  for (const entry of entries) {
    if (entry.endsWith('.md')) {
      const filePath = join(dirPath, entry);
      const tags = extractTagsFromFile(filePath);
      files.push(entry);
      tagsByFile.set(entry, tags);
    }
  }

  return { files, tagsByFile };
}

/**
 * Calculates tag frequency statistics
 * @param {Map<string, string[]>} tagsByFile - Map of filename to tags array
 * @returns {Object} { tagCounts: Map<string, number>, totalPages: number, tagsByPage: Map<string, Set<string>> }
 */
function calculateTagFrequency(tagsByFile) {
  const tagCounts = new Map();
  const tagsByPage = new Map();
  let totalPages = 0;

  for (const [filename, tags] of tagsByFile.entries()) {
    if (tags.length === 0) {
      continue;
    }

    totalPages++;
    
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      
      if (!tagsByPage.has(tag)) {
        tagsByPage.set(tag, new Set());
      }
      tagsByPage.get(tag).add(filename);
    }
  }

  return { tagCounts, totalPages, tagsByPage };
}

/**
 * Formats frequency as percentage string
 * @param {number} count - Number of occurrences
 * @param {number} total - Total number of pages
 * @returns {string} Formatted percentage (e.g., "38.7%")
 */
function formatFrequency(count, total) {
  if (total === 0) return '0.0%';
  return `${((count / total) * 100).toFixed(1)}%`;
}

/**
 * Main validation function
 */
async function main() {
  console.log('Tag Distribution Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Scan all wiki directories
  const entitiesResult = scanDirectoryForTags(join(wikiDir, 'entities'));
  const conceptsResult = scanDirectoryForTags(join(wikiDir, 'concepts'));
  const sourcesResult = scanDirectoryForTags(join(wikiDir, 'sources'));

  console.log(`📁 Scanned directories:`);
  console.log(`   - entities: ${entitiesResult.files.length} files`);
  console.log(`   - concepts: ${conceptsResult.files.length} files`);
  console.log(`   - sources:  ${sourcesResult.files.length} files`);
  console.log('');

  // Combine all tags
  const allTagsByFile = new Map([
    ...entitiesResult.tagsByFile,
    ...conceptsResult.tagsByFile,
    ...sourcesResult.tagsByFile
  ]);

  if (allTagsByFile.size === 0) {
    console.log('⚠ No wiki pages found - nothing to validate');
    process.exit(0);
  }

  // Calculate frequency statistics
  const { tagCounts, totalPages, tagsByPage } = calculateTagFrequency(allTagsByFile);

  if (totalPages === 0) {
    console.log('⚠ No pages with tags found - nothing to validate');
    process.exit(0);
  }

  console.log(`📊 Tag Statistics:`);
  console.log(`   Total pages:    ${totalPages}`);
  console.log(`   Unique tags:    ${tagCounts.size}`);
  console.log(`   Max threshold:  ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}%`);
  console.log('');

  // Sort tags by frequency (descending)
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  // Find violations
  const violations = sortedTags.filter(([tag, count]) => {
    const frequency = count / totalPages;
    return frequency > MAX_TAG_FREQUENCY;
  });

  // Report top 20 most frequent tags
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

  // Report validation result
  if (violations.length === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log('');
    console.log(`All ${tagCounts.size} tags are within the ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}% frequency threshold.`);
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log('');
    console.log(`${violations.length} tag(s) exceed the ${(MAX_TAG_FREQUENCY * 100).toFixed(0)}% frequency threshold:`);
    console.log('');
    
    for (const [tag, count] of violations) {
      const frequency = count / totalPages;
      const freqStr = formatFrequency(count, totalPages);
      console.log(`  - "${tag}": ${freqStr} (${count}/${totalPages} pages)`);
      
      const pages = Array.from(tagsByPage.get(tag) || []);
      console.log(`    Pages: ${pages.slice(0, 5).join(', ')}${pages.length > 5 ? ` ... and ${pages.length - 5} more` : ''}`);
      console.log('');
    }

    console.log('💡 Recommendations:');
    console.log('   - Distribute tags more evenly across pages');
    console.log('   - Use more specific tags instead of broad categories');
    console.log('   - Consider splitting high-frequency tags into sub-categories');
    console.log('');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
