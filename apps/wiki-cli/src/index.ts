/**
 * Wiki CLI - Entry Point
 *
 * Single bundled Nx application exposing the Driver_Adapter composition
 * roots previously implemented as standalone `scripts/*.mjs`/`.ts` files.
 * Each subcommand wires built Infrastructure adapters into an Application
 * use case; no business logic lives in this file or the command modules.
 *
 * Usage:
 *   node index.js generate-manifest
 *   node index.js generate-index
 *   node index.js validate-tags
 *   node index.js init
 *
 * Invoked via Nx targets, e.g.:
 *   nx run wiki-cli:generate-manifest
 *   nx run wiki-cli:generate-index
 *   nx run wiki-cli:validate-tags
 *   nx run wiki-cli:init
 */

import * as path from 'path';
import { runGenerateManifest } from './commands/generate-manifest.command';
import { runGenerateIndex } from './commands/generate-index.command';
import { runValidateTags } from './commands/validate-tags.command';
import { runInit } from './commands/init.command';

/** The workspace root is always this app's build output's grandparent (dist/apps/wiki-cli -> workspace root). */
function resolveWorkspaceRoot(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

async function main(): Promise<void> {
  const [command] = process.argv.slice(2);
  const workspaceRoot = resolveWorkspaceRoot();

  switch (command) {
    case 'generate-manifest':
      await runGenerateManifest(workspaceRoot);
      return;
    case 'generate-index':
      await runGenerateIndex(workspaceRoot);
      return;
    case 'validate-tags': {
      const exitCode = await runValidateTags(workspaceRoot);
      process.exitCode = exitCode;
      return;
    }
    case 'init':
      await runInit(workspaceRoot);
      return;
    default:
      console.error(
        `Unknown command: "${command ?? ''}". Expected one of: generate-manifest, generate-index, validate-tags, init.`
      );
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
