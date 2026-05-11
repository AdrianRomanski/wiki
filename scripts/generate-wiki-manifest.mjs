#!/usr/bin/env node
/**
 * Scans wiki/entities/, wiki/concepts/, and wiki/sources/ for .md files
 * and writes wiki/manifest.json with the WikiManifest shape.
 *
 * WikiManifest: { files: string[], generatedAt: string }
 *
 * Run with: node scripts/generate-wiki-manifest.mjs
 */

import { readdirSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths relative to the workspace root (one level up from scripts/)
const workspaceRoot = join(__dirname, '..');
const wikiDir = join(workspaceRoot, 'wiki');
const manifestPath = join(wikiDir, 'manifest.json');

const subdirectories = ['entities', 'concepts', 'sources'];

/**
 * Scans a directory for .md files and returns their paths relative to wiki/.
 * Returns an empty array if the directory does not exist.
 */
function scanDirectory(subdir) {
  const dirPath = join(wikiDir, subdir);
  if (!existsSync(dirPath)) {
    console.warn(`Warning: directory not found, skipping: ${dirPath}`);
    return [];
  }

  const entries = readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `${subdir}/${entry.name}`);
}

// Collect all .md file paths from each subdirectory
const files = subdirectories.flatMap(scanDirectory);

const manifest = {
  files,
  generatedAt: new Date().toISOString(),
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

console.log(`wiki/manifest.json written with ${files.length} file(s):`);
files.forEach((f) => console.log(`  ${f}`));
