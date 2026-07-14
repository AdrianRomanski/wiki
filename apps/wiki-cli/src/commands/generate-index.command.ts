/**
 * Thin Driver_Adapter composition root for wiki index generation.
 *
 * Wires the Infrastructure `FileSystemAdapter`, `FrontmatterAdapter`, and
 * `MarkdownAdapter` into the Application `GenerateIndexUseCase`, invokes
 * it, and prints the resulting summary. No business logic lives here —
 * scanning wiki/entities/, wiki/concepts/, and wiki/sources/, parsing
 * frontmatter, deriving descriptions, sorting, and rendering index.md is
 * handled entirely by the use case in @wiki/application-index-manager.
 */

import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { GenerateIndexUseCase } from '@wiki/application-index-manager';

export async function runGenerateIndex(workspaceRoot: string): Promise<void> {
  const fsAdapter = new FileSystemAdapter({
    rootDir: workspaceRoot,
    rawDir: 'raw',
    wikiDir: 'wiki',
  });
  const frontmatterAdapter = new FrontmatterAdapter();
  const markdownAdapter = new MarkdownAdapter();

  const useCase = new GenerateIndexUseCase(fsAdapter, frontmatterAdapter, markdownAdapter);
  const { entities, concepts, sources } = await useCase.execute();

  console.log(`wiki/index.md regenerated — ${entities} entities, ${concepts} concepts, ${sources} sources`);
}
