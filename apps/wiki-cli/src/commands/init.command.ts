/**
 * Thin Driver_Adapter composition root for wiki scaffolding.
 *
 * Wires the Infrastructure `FileSystemAdapter` into the Application
 * `ScaffoldWikiUseCase` and reports per-directory progress. Contains no
 * business logic — directory scaffolding lives in
 * @wiki/application-scaffolding's ScaffoldWikiUseCase.
 *
 * Angular-project detection below is presentation/informational stdout
 * only; it does not affect scaffolding behavior.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { ScaffoldWikiUseCase } from '@wiki/application-scaffolding';

const ANGULAR_DIRECTORIES = ['apps', 'libs', '.kiro'];

function checkAngularProject(workspaceRoot: string): boolean {
  console.log('Checking for existing Angular project...');

  for (const dir of ANGULAR_DIRECTORIES) {
    const dirPath = path.join(workspaceRoot, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✓ Found ${dir}/ directory`);
    } else {
      console.warn(`⚠ Warning: ${dir}/ directory not found`);
    }
  }

  const angularJson = path.join(workspaceRoot, 'angular.json');
  if (fs.existsSync(angularJson)) {
    console.log('✓ Found angular.json');
    return true;
  }

  console.warn('⚠ Warning: angular.json not found');
  return false;
}

export async function runInit(workspaceRoot: string): Promise<void> {
  console.log('\n=== LLM Wiki Second Brain Initialization ===\n');

  const hasAngularProject = checkAngularProject(workspaceRoot);

  if (hasAngularProject) {
    console.log('\n✓ Angular project detected - will preserve existing structure\n');
  } else {
    console.log('\n⚠ No Angular project detected - continuing anyway\n');
  }

  console.log('Creating wiki directory structure...\n');

  const fsAdapter = new FileSystemAdapter({
    rootDir: workspaceRoot,
    rawDir: 'raw',
    wikiDir: 'wiki',
  });
  const useCase = new ScaffoldWikiUseCase(fsAdapter);
  const { created, existing } = await useCase.execute();

  for (const dir of created) {
    console.log(`✓ Created directory: ${dir}`);
  }
  for (const dir of existing) {
    console.log(`✓ Directory already exists: ${dir}`);
  }

  console.log('\n✓ Wiki directory structure initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Run the schema configuration setup');
  console.log('2. Create initial wiki pages');
  console.log('3. Add README files to raw/ and wiki/ directories');
}
