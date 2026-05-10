#!/usr/bin/env ts-node
/**
 * Initialization script for LLM Wiki Second Brain
 * 
 * This script sets up the directory structure for the wiki system
 * while preserving the existing Angular project structure.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');

interface DirectoryConfig {
  path: string;
  description: string;
}

const DIRECTORIES: DirectoryConfig[] = [
  { path: 'raw', description: 'Immutable source documents' },
  { path: 'raw/articles', description: 'Web articles and blog posts' },
  { path: 'raw/papers', description: 'Research papers and PDFs' },
  { path: 'raw/code-snippets', description: 'Code examples and gists' },
  { path: 'raw/notes', description: 'Personal research notes' },
  { path: 'raw/angular-aria', description: 'Angular Aria specific sources' },
  { path: 'wiki', description: 'AI-generated wiki pages' },
  { path: 'wiki/entities', description: 'Pages about specific things' },
  { path: 'wiki/concepts', description: 'Pages about ideas and patterns' },
  { path: 'wiki/sources', description: 'Summaries of raw sources' },
];

const ANGULAR_DIRECTORIES = ['apps', 'libs', '.kiro'];

function checkAngularProject(): boolean {
  console.log('Checking for existing Angular project...');
  
  for (const dir of ANGULAR_DIRECTORIES) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✓ Found ${dir}/ directory`);
    } else {
      console.warn(`⚠ Warning: ${dir}/ directory not found`);
    }
  }
  
  const angularJson = path.join(ROOT_DIR, 'angular.json');
  if (fs.existsSync(angularJson)) {
    console.log('✓ Found angular.json');
    return true;
  } else {
    console.warn('⚠ Warning: angular.json not found');
    return false;
  }
}

function createDirectory(dirPath: string, description: string): void {
  const fullPath = path.join(ROOT_DIR, dirPath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Directory already exists: ${dirPath}`);
  } else {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath} (${description})`);
  }
}

function initializeWiki(): void {
  console.log('\n=== LLM Wiki Second Brain Initialization ===\n');
  
  // Check for Angular project
  const hasAngularProject = checkAngularProject();
  
  if (hasAngularProject) {
    console.log('\n✓ Angular project detected - will preserve existing structure\n');
  } else {
    console.log('\n⚠ No Angular project detected - continuing anyway\n');
  }
  
  // Create directories
  console.log('Creating wiki directory structure...\n');
  
  for (const { path: dirPath, description } of DIRECTORIES) {
    createDirectory(dirPath, description);
  }
  
  console.log('\n✓ Wiki directory structure initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Run the schema configuration setup');
  console.log('2. Create initial wiki pages');
  console.log('3. Add README files to raw/ and wiki/ directories');
}

// Run initialization
try {
  initializeWiki();
} catch (error) {
  console.error('Error during initialization:', error);
  process.exit(1);
}
