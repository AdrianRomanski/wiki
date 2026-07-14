import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GenerateIndexUseCase } from './generate-index.use-case';
import type {
  FileSystemPort,
  FileStats,
  FrontmatterPort,
  ParsedFrontmatter,
  MarkdownPort,
  ValidationResult,
} from '@wiki/application-ports';
import type { WikiPageFrontmatter } from '@wiki/domain-models';
import type { Section } from '@wiki/domain-models';

class MockFileSystemPort implements FileSystemPort {
  writeWikiFile = vi.fn();
  listWikiFiles = vi.fn(async (_pattern: string): Promise<string[]> => []);
  readWikiFile = vi.fn(async (_filePath: string): Promise<string> => '');
  async readRawFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async ensureWikiDir(): Promise<void> { return; }
  async deleteWikiFile(): Promise<void> { return; }
  async ensureDir(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

function extractFrontmatterBlock(raw: string): { fm: Partial<WikiPageFrontmatter>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {}, content: raw };
  const fm: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) fm[key.trim()] = rest.join(':').trim();
  }
  return { fm, content: match[2] };
}

class FakeFrontmatterPort implements FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter {
    const { fm, content } = extractFrontmatterBlock(markdownContent);
    return { frontmatter: fm as WikiPageFrontmatter, content };
  }
  generateFrontmatter(): string { return ''; }
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    return partial as WikiPageFrontmatter;
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter { return frontmatter; }
}

class FakeMarkdownPort implements MarkdownPort {
  generateWikiLink(target: string): string { return `[[${target}]]`; }
  parseMarkdownSections(): Section[] { return []; }
  extractWikiLinks(): string[] { return []; }
  generateHeading(text: string, level: number): string { return `${'#'.repeat(level)} ${text}`; }
  generateList(items: string[]): string { return items.map((i) => `- ${i}`).join('\n'); }
  generateCodeBlock(code: string): string { return '```\n' + code + '\n```'; }
  generateBlockquote(text: string): string { return `> ${text}`; }
  generateTable(): string { return ''; }
  validateMarkdownSyntax(): ValidationResult { return { valid: true }; }
  sectionsToMarkdown(): string { return ''; }
  escapeMarkdown(text: string): string { return text; }
}

describe('GenerateIndexUseCase', () => {
  let fs: MockFileSystemPort;
  let frontmatter: FakeFrontmatterPort;
  let markdown: FakeMarkdownPort;
  let useCase: GenerateIndexUseCase;

  beforeEach(() => {
    fs = new MockFileSystemPort();
    frontmatter = new FakeFrontmatterPort();
    markdown = new FakeMarkdownPort();
    useCase = new GenerateIndexUseCase(fs, frontmatter, markdown);
  });

  it('scans entities/concepts/sources, sorts, and writes rendered index.md', async () => {
    fs.listWikiFiles.mockImplementation(async (pattern: string) => {
      if (pattern === 'entities/*.md') return ['entities/b.md', 'entities/a.md'];
      if (pattern === 'concepts/*.md') return ['concepts/z.md'];
      if (pattern === 'sources/*.md') return ['sources/old.md', 'sources/new.md'];
      return [];
    });

    fs.readWikiFile.mockImplementation(async (file: string) => {
      const pages: Record<string, string> = {
        'entities/b.md': '---\ntitle: Beta\n---\n# Beta\n\nBeta description with [[Alpha]] link.\n',
        'entities/a.md': '---\ntitle: Alpha\n---\n# Alpha\n\nAlpha description.\n',
        'concepts/z.md': '---\ntitle: Zeta\n---\n# Zeta\n\nZeta concept description.\n',
        'sources/old.md': '---\ntitle: Old Source\ndate: 2024-01-01\n---\n# Old Source\n\nOld source description.\n',
        'sources/new.md': '---\ntitle: New Source\ndate: 2024-06-01\n---\n# New Source\n\nNew source description.\n',
      };
      return pages[file];
    });

    const result = await useCase.execute();

    expect(result).toEqual({ entities: 2, concepts: 1, sources: 2 });
    expect(fs.writeWikiFile).toHaveBeenCalledTimes(1);
    const [path, content] = fs.writeWikiFile.mock.calls[0];
    expect(path).toBe('index.md');

    // Entities sorted alphabetically: Alpha before Beta
    const alphaIdx = content.indexOf('[[Alpha]]');
    const betaIdx = content.indexOf('[[Beta]]');
    expect(alphaIdx).toBeGreaterThan(-1);
    expect(betaIdx).toBeGreaterThan(alphaIdx);

    // Wikilinks stripped from description
    expect(content).toContain('Beta description with Alpha link.');

    // Sources sorted by date desc: New before Old
    const newIdx = content.indexOf('[[New Source]]');
    const oldIdx = content.indexOf('[[Old Source]]');
    expect(newIdx).toBeGreaterThan(-1);
    expect(oldIdx).toBeGreaterThan(newIdx);

    // Fixed layout sections present
    for (const heading of [
      '## Overview',
      '## Getting Started',
      '## Entities',
      '## Concepts',
      '## Recent Sources',
      '## Navigation',
      '## Statistics',
      '## Quick Reference',
    ]) {
      expect(content).toContain(heading);
    }
  });

  it('truncates long descriptions to 117 chars + "..."', async () => {
    const longText = 'x'.repeat(150);
    fs.listWikiFiles.mockImplementation(async (pattern: string) =>
      pattern === 'entities/*.md' ? ['entities/long.md'] : []
    );
    fs.readWikiFile.mockResolvedValue(`---\ntitle: Long\n---\n# Long\n\n${longText}\n`);

    await useCase.execute();

    const content = fs.writeWikiFile.mock.calls[0][1] as string;
    expect(content).toContain('x'.repeat(117) + '...');
  });

  it('renders empty-state placeholders when no pages exist', async () => {
    fs.listWikiFiles.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({ entities: 0, concepts: 0, sources: 0 });
    const content = fs.writeWikiFile.mock.calls[0][1] as string;
    expect(content).toContain('*No entities yet*');
    expect(content).toContain('*No concepts yet*');
    expect(content).toContain('*No recent sources yet*');
  });
});

// ============================================================================
// Property-Based Test
// Feature: scripts-migration-hexagonal, Property 2: Index completeness and ordering
// ============================================================================

/**
 * In-memory FakeFileSystemPort test double for the property test. Files are
 * keyed by their wiki-relative path (e.g. "entities/foo.md") and store the
 * raw markdown (including frontmatter) that GenerateIndexUseCase reads back
 * via readWikiFile.
 */
class FakeFileSystemPort implements FileSystemPort {
  private readonly files = new Map<string, string>();
  writtenFiles = new Map<string, string>();

  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  async listWikiFiles(pattern: string): Promise<string[]> {
    const subdir = pattern.split('/')[0];
    return [...this.files.keys()].filter((path) => path.startsWith(`${subdir}/`));
  }

  async readWikiFile(filePath: string): Promise<string> {
    return this.files.get(filePath) ?? '';
  }

  async writeWikiFile(filePath: string, content: string): Promise<void> {
    this.writtenFiles.set(filePath, content);
  }

  async readRawFile(): Promise<string> { return ''; }
  async listRawFiles(): Promise<string[]> { return []; }
  async rawFileExists(): Promise<boolean> { return false; }
  async wikiFileExists(): Promise<boolean> { return false; }
  async getRawFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async getWikiFileStats(): Promise<FileStats> { return { modified: new Date(), size: 0, created: new Date() }; }
  async ensureWikiDir(): Promise<void> { return; }
  async deleteWikiFile(): Promise<void> { return; }
  async ensureDir(): Promise<void> { return; }
  async readFile(): Promise<string> { return ''; }
  async writeFile(): Promise<void> { return; }
  async deleteDir(): Promise<void> { return; }
}

/** Extracts the body text of a `## Heading` section up to the next `## ` heading. */
function extractSection(content: string, heading: string): string {
  const start = content.indexOf(`## ${heading}`);
  if (start === -1) return '';
  const rest = content.slice(start + `## ${heading}`.length);
  const next = rest.indexOf('\n## ');
  return next === -1 ? rest : rest.slice(0, next);
}

/** Generates a short, filename/title-safe token. */
const tokenArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9]{0,9}$/);

/**
 * Unique entity/concept titles, prefixed so they never collide across
 * categories. Uniqueness is keyed by the slugified (lowercased) title,
 * since the fake filesystem stores pages by `slugify(title)` — two titles
 * that differ only in case would otherwise collide on the same file path.
 */
function titleSetArbitrary(prefix: string, maxLength: number) {
  return fc
    .uniqueArray(tokenArbitrary, {
      minLength: 0,
      maxLength,
      selector: (t) => t.toLowerCase(),
    })
    .map((tokens) => tokens.map((t) => `${prefix}${t}`));
}

/**
 * Unique (title, date) pairs for sources, with dates spread over ~3 years.
 * Uniqueness is keyed by the slugified title for the same reason as above.
 */
const sourceSetArbitrary = fc
  .uniqueArray(fc.tuple(tokenArbitrary, fc.integer({ min: 0, max: 1000 })), {
    minLength: 0,
    maxLength: 15,
    selector: ([token]) => token.toLowerCase(),
  })
  .map((pairs) =>
    pairs.map(([token, dayOffset]) => {
      const date = new Date(2020, 0, 1 + dayOffset).toISOString().split('T')[0];
      return { title: `Source${token}`, date };
    })
  );

function slugify(title: string): string {
  return title.toLowerCase();
}

describe('Feature: scripts-migration-hexagonal, Property 2: Index completeness and ordering', () => {
  /**
   * Property 2: Index completeness and ordering
   *
   * For any set of wiki pages, index.md contains a WikiLink entry for every
   * entity and concept (ordered by title asc), and Recent Sources contains
   * sources ordered by date desc truncated to <=10, matching pre-migration
   * output.
   *
   * **Validates: Requirements 2.2, 3.4**
   */
  it('includes every entity/concept as an ordered WikiLink and caps Recent Sources at 10 ordered by date desc', async () => {
    await fc.assert(
      fc.asyncProperty(
        titleSetArbitrary('Entity', 8),
        titleSetArbitrary('Concept', 8),
        sourceSetArbitrary,
        async (entityTitles, conceptTitles, sourcePages) => {
          const fs = new FakeFileSystemPort();
          const frontmatter = new FakeFrontmatterPort();
          const markdown = new FakeMarkdownPort();

          entityTitles.forEach((title) => {
            fs.setFile(
              `entities/${slugify(title)}.md`,
              `---\ntitle: ${title}\n---\n# ${title}\n\nDescription of ${title}.\n`
            );
          });
          conceptTitles.forEach((title) => {
            fs.setFile(
              `concepts/${slugify(title)}.md`,
              `---\ntitle: ${title}\n---\n# ${title}\n\nDescription of ${title}.\n`
            );
          });
          sourcePages.forEach(({ title, date }) => {
            fs.setFile(
              `sources/${slugify(title)}.md`,
              `---\ntitle: ${title}\ndate: ${date}\n---\n# ${title}\n\nDescription of ${title}.\n`
            );
          });

          const useCase = new GenerateIndexUseCase(fs, frontmatter, markdown);
          await useCase.execute();

          const content = fs.writtenFiles.get('index.md') as string;
          expect(content).toBeDefined();

          const entitiesSection = extractSection(content, 'Entities');
          const conceptsSection = extractSection(content, 'Concepts');
          const sourcesSection = extractSection(content, 'Recent Sources');

          // Every entity/concept appears as a [[Title]] WikiLink.
          const sortedEntityTitles = [...entityTitles].sort((a, b) => a.localeCompare(b));
          const sortedConceptTitles = [...conceptTitles].sort((a, b) => a.localeCompare(b));

          for (const title of entityTitles) {
            expect(entitiesSection).toContain(`[[${title}]]`);
          }
          for (const title of conceptTitles) {
            expect(conceptsSection).toContain(`[[${title}]]`);
          }

          // Entities/concepts are ordered by title ascending relative to each other.
          const entityIndices = sortedEntityTitles.map((t) => entitiesSection.indexOf(`[[${t}]]`));
          for (let i = 1; i < entityIndices.length; i++) {
            expect(entityIndices[i]).toBeGreaterThan(entityIndices[i - 1]);
          }
          const conceptIndices = sortedConceptTitles.map((t) => conceptsSection.indexOf(`[[${t}]]`));
          for (let i = 1; i < conceptIndices.length; i++) {
            expect(conceptIndices[i]).toBeGreaterThan(conceptIndices[i - 1]);
          }

          // Recent Sources: at most 10, ordered by date desc.
          const expectedSources = [...sourcePages]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10);

          expect(expectedSources.length).toBeLessThanOrEqual(10);

          for (const { title } of expectedSources) {
            expect(sourcesSection).toContain(`[[${title}]]`);
          }

          const truncatedOutTitles = sourcePages
            .filter((p) => !expectedSources.includes(p))
            .map((p) => p.title);
          for (const title of truncatedOutTitles) {
            expect(sourcesSection).not.toContain(`[[${title}]]`);
          }

          const sourceIndices = expectedSources.map((s) => sourcesSection.indexOf(`[[${s.title}]]`));
          for (let i = 1; i < sourceIndices.length; i++) {
            expect(sourceIndices[i]).toBeGreaterThan(sourceIndices[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
