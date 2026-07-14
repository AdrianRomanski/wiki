/**
 * Property-based test for tag distribution validation
 * Feature: scripts-migration-hexagonal
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ValidateTagDistributionUseCase } from './validate-tag-distribution.use-case';
import type { FileSystemPort, FileStats } from '@wiki/application-ports';
import type { FrontmatterPort, ParsedFrontmatter } from '@wiki/application-ports';
import type { WikiPageFrontmatter } from '@wiki/domain-models';

const SUBDIRS = ['entities', 'concepts', 'sources'] as const;

/**
 * In-memory FileSystemPort test double. Files are keyed by their
 * wiki-relative path (e.g. "entities/page-0.md"). Only the members used by
 * ValidateTagDistributionUseCase (listWikiFiles/readWikiFile) do real work;
 * everything else is a no-op stub to satisfy the interface.
 */
class FakeFileSystemPort implements FileSystemPort {
  private readonly files = new Map<string, string>();

  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  async listWikiFiles(pattern: string): Promise<string[]> {
    const subdir = pattern.split('/')[0];
    return [...this.files.keys()].filter((path) => path.startsWith(`${subdir}/`));
  }

  async readWikiFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      throw new Error(`FakeFileSystemPort: no such file ${filePath}`);
    }
    return content;
  }

  async readRawFile(): Promise<string> {
    return '';
  }
  async writeWikiFile(): Promise<void> {
    return;
  }
  async listRawFiles(): Promise<string[]> {
    return [];
  }
  async rawFileExists(): Promise<boolean> {
    return false;
  }
  async wikiFileExists(): Promise<boolean> {
    return false;
  }
  async getRawFileStats(): Promise<FileStats> {
    return { size: 0, created: new Date(), modified: new Date() };
  }
  async getWikiFileStats(): Promise<FileStats> {
    return { size: 0, created: new Date(), modified: new Date() };
  }
  async ensureWikiDir(): Promise<void> {
    return;
  }
  async deleteWikiFile(): Promise<void> {
    return;
  }
  async ensureDir(): Promise<void> {
    return;
  }
  async readFile(): Promise<string> {
    return '';
  }
  async writeFile(): Promise<void> {
    return;
  }
  async deleteDir(): Promise<void> {
    return;
  }
}

/**
 * Fake FrontmatterPort. Rather than parsing real YAML, the fake file
 * content encodes the tags array as JSON, and parseFrontmatter simply
 * JSON.parses it back out into a WikiPageFrontmatter-shaped object. This
 * avoids needing real YAML parsing in the test while still exercising the
 * use case's `parseFrontmatter(content).frontmatter.tags` contract.
 */
class FakeFrontmatterPort implements FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter {
    const tags = JSON.parse(markdownContent) as string[];
    const frontmatter: WikiPageFrontmatter = {
      title: 'fake',
      type: 'entity',
      tags,
      created: '',
      updated: '',
    };
    return { frontmatter, content: '' };
  }

  generateFrontmatter(): string {
    return '';
  }
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    return {
      title: '',
      type: 'entity',
      tags: [],
      created: '',
      updated: '',
      ...partial,
    };
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    return frontmatter;
  }
}

describe('Feature: scripts-migration-hexagonal, Property 3: Tag distribution threshold', () => {
  it('passed is true iff no tag exceeds 60% frequency, and violations is exactly the set of tags that do', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.array(fc.constantFrom('tag-a', 'tag-b', 'tag-c', 'tag-d', 'tag-e'), {
            minLength: 0,
            maxLength: 4,
          }),
          { minLength: 0, maxLength: 30 }
        ),
        async (pagesTags) => {
          const fs = new FakeFileSystemPort();
          const frontmatter = new FakeFrontmatterPort();

          // Distribute pages across entities/concepts/sources round-robin so
          // the use case's full scan (all three subdirs) is exercised.
          pagesTags.forEach((tags, index) => {
            const subdir = SUBDIRS[index % SUBDIRS.length];
            fs.setFile(`${subdir}/page-${index}.md`, JSON.stringify(tags));
          });

          // Compute the expected result independently of the use case.
          let expectedTotalPages = 0;
          const expectedCounts = new Map<string, number>();
          for (const tags of pagesTags) {
            const nonEmptyTags = Array.isArray(tags) && tags.length > 0;
            if (!nonEmptyTags) continue;
            expectedTotalPages++;
            for (const tag of tags) {
              expectedCounts.set(tag, (expectedCounts.get(tag) ?? 0) + 1);
            }
          }
          const expectedViolationTags = new Set<string>();
          for (const [tag, count] of expectedCounts.entries()) {
            const frequency = expectedTotalPages === 0 ? 0 : count / expectedTotalPages;
            if (frequency > 0.6) {
              expectedViolationTags.add(tag);
            }
          }

          const result = await new ValidateTagDistributionUseCase(fs, frontmatter).execute();

          expect(result.totalPages).toBe(expectedTotalPages);
          expect(result.passed).toBe(expectedViolationTags.size === 0);

          const actualViolationTags = new Set(result.violations.map((v) => v.tag));
          expect(actualViolationTags).toEqual(expectedViolationTags);
        }
      ),
      { numRuns: 100 }
    );
  });
});
