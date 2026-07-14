import { FileSystemPort, FrontmatterPort } from '@wiki/application-ports';
import { TagDistributionResult, TagViolation } from './tag-distribution-result';

const SUBDIRECTORIES = ['entities', 'concepts', 'sources'] as const;

const MAX_TAG_FREQUENCY = 0.6; // 60%

/**
 * Validates that no single tag appears in more than 60% of tagged wiki pages.
 *
 * Mirrors the pre-migration scripts/validate-tag-distribution.mjs behavior:
 * - Scans entities/, concepts/, sources/ for .md files.
 * - Reads tags via FrontmatterPort.parseFrontmatter (replacing the `yaml` package).
 * - Pages with no/empty tags are excluded from the denominator (totalPages).
 * - `passed` is true iff no tag's frequency exceeds 60%.
 */
export class ValidateTagDistributionUseCase {
  constructor(
    private readonly fs: FileSystemPort,
    private readonly frontmatter: FrontmatterPort
  ) {}

  async execute(): Promise<TagDistributionResult> {
    const tagCounts = new Map<string, number>();
    const pagesByTag = new Map<string, string[]>();
    let totalPages = 0;

    for (const subdir of SUBDIRECTORIES) {
      const files = await this.fs.listWikiFiles(`${subdir}/*.md`);

      for (const file of files) {
        const raw = await this.fs.readWikiFile(file);
        const { frontmatter } = this.frontmatter.parseFrontmatter(raw);
        const tags = frontmatter?.tags;

        if (!Array.isArray(tags) || tags.length === 0) {
          continue;
        }

        totalPages++;

        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
          const pages = pagesByTag.get(tag) ?? [];
          pages.push(file);
          pagesByTag.set(tag, pages);
        }
      }
    }

    const violations: TagViolation[] = [];
    for (const [tag, count] of tagCounts.entries()) {
      const frequency = totalPages === 0 ? 0 : count / totalPages;
      if (frequency > MAX_TAG_FREQUENCY) {
        violations.push({ tag, count, frequency, pages: pagesByTag.get(tag) ?? [] });
      }
    }

    return {
      totalPages,
      tagCounts,
      violations,
      passed: violations.length === 0,
    };
  }
}
