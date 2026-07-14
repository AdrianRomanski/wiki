/**
 * Thin Driver_Adapter composition root for manifest generation.
 *
 * Wires the Infrastructure `FileSystemAdapter` into the Application
 * `GenerateManifestUseCase`, invokes it, and prints the resulting summary.
 * No business logic lives here — scanning wiki/entities/, wiki/concepts/,
 * and wiki/sources/ and writing wiki/manifest.json is handled entirely by
 * the use case in @wiki/application-index-manager.
 */

import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { GenerateManifestUseCase } from '@wiki/application-index-manager';

export async function runGenerateManifest(workspaceRoot: string): Promise<void> {
  const fsAdapter = new FileSystemAdapter({
    rootDir: workspaceRoot,
    rawDir: 'raw',
    wikiDir: 'wiki',
  });

  const useCase = new GenerateManifestUseCase(fsAdapter);
  const { manifest } = await useCase.execute();

  console.log(`wiki/manifest.json written with ${manifest.files.length} file(s):`);
  manifest.files.forEach((f) => console.log(`  ${f}`));
}
