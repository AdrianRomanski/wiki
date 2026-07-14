/**
 * Unit tests for SYNTHESIZE step logic
 * Feature: article-research-session
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 *
 * Migrated from scripts/research-workflow/session-manager/synthesize-step.test.ts.
 * Uses FakeFileSystemPort in place of real temp directories for the integration
 * tests; the pure parsing/building tests are unchanged aside from import paths.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateFindingsSummary,
  updateFindingsSummary,
  completeSynthesizeStep,
  parseAnalysisMarkdown,
  buildFindingsSummaryMarkdown,
  generateRecommendedWikiPages,
} from './synthesize-step';
import { FakeFileSystemPort } from './test-utils/fake-file-system-port';
import type { SessionJson } from '@wiki/domain-research-session';

// ── Test Fixtures ───────────────────────────────────────────────────────────

const SAMPLE_ANALYSIS = `# Article Analysis: Understanding Angular Signals

## Metadata
- **Title:** Understanding Angular Signals
- **Author:** John Doe
- **Date:** 2024-03-15
- **Source URL:** https://blog.example.com/angular-signals

## Summary

Angular Signals represent a new reactive primitive in Angular that enables fine-grained reactivity. They provide a way to express reactive state that notifies interested consumers when it changes.

This article explores how signals work under the hood and how they compare to RxJS observables for state management.

## Identified Entities

- **Angular Signals** — A reactive primitive in Angular for fine-grained state management.
- **RxJS** — A library for reactive programming using observables.

## Identified Concepts

- **Fine-grained reactivity** — A pattern where only the specific parts of the UI that depend on changed state are updated.
- **Reactive programming** — A programming paradigm oriented around data flows and the propagation of change.

## Code Blocks

\`\`\`typescript
const count = signal(0);
const doubled = computed(() => count() * 2);
\`\`\`

\`\`\`typescript
effect(() => {
  console.log('Count changed:', count());
});
\`\`\`

## Notes

No additional notes.
`;

function createSampleSession(overrides: Partial<SessionJson> = {}): SessionJson {
  return {
    id: 'understanding-angular-signals',
    topic: 'Understanding Angular Signals',
    state: 'SYNTHESIZE',
    scope: 'article',
    createdAt: '2024-03-15',
    articleInputType: 'url',
    articleUrl: 'https://blog.example.com/angular-signals',
    articleTitle: 'Understanding Angular Signals',
    articleAuthor: 'John Doe',
    articleDate: '2024-03-15',
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('parseAnalysisMarkdown', () => {
  it('extracts title from metadata section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.title).toBe('Understanding Angular Signals');
  });

  it('extracts author from metadata section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.author).toBe('John Doe');
  });

  it('extracts date from metadata section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.date).toBe('2024-03-15');
  });

  it('extracts source URL from metadata section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.sourceUrl).toBe('https://blog.example.com/angular-signals');
  });

  it('extracts summary content', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.summary).toContain('Angular Signals represent');
    expect(parsed.summary).toContain('fine-grained reactivity');
  });

  it('extracts entities with names and descriptions', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.entities).toHaveLength(2);
    expect(parsed.entities[0].name).toBe('Angular Signals');
    expect(parsed.entities[0].description).toContain('reactive primitive');
    expect(parsed.entities[1].name).toBe('RxJS');
  });

  it('extracts concepts with names and descriptions', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.concepts).toHaveLength(2);
    expect(parsed.concepts[0].name).toBe('Fine-grained reactivity');
    expect(parsed.concepts[1].name).toBe('Reactive programming');
  });

  it('extracts code blocks with language annotations', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    expect(parsed.codeBlocks).toHaveLength(2);
    expect(parsed.codeBlocks[0].language).toBe('typescript');
    expect(parsed.codeBlocks[0].content).toContain('signal(0)');
    expect(parsed.codeBlocks[1].content).toContain('effect');
  });

  it('handles analysis with no entities', () => {
    const noEntities = SAMPLE_ANALYSIS.replace(
      /## Identified Entities[\s\S]*?(?=## Identified Concepts)/,
      '## Identified Entities\n\nNo entities were identified in this article.\n\n'
    );
    const parsed = parseAnalysisMarkdown(noEntities);
    expect(parsed.entities).toHaveLength(0);
  });

  it('handles analysis with no concepts', () => {
    const noConcepts = SAMPLE_ANALYSIS.replace(
      /## Identified Concepts[\s\S]*?(?=## Code Blocks)/,
      '## Identified Concepts\n\nNo concepts were identified in this article.\n\n'
    );
    const parsed = parseAnalysisMarkdown(noConcepts);
    expect(parsed.concepts).toHaveLength(0);
  });

  it('defaults to "Untitled" when title is missing', () => {
    const noTitle = '## Metadata\n- **Author:** Someone\n\n## Summary\nContent.';
    const parsed = parseAnalysisMarkdown(noTitle);
    expect(parsed.title).toBe('Untitled');
  });

  it('defaults to "Unknown" when author is missing', () => {
    const noAuthor = '## Metadata\n- **Title:** Test\n\n## Summary\nContent.';
    const parsed = parseAnalysisMarkdown(noAuthor);
    expect(parsed.author).toBe('Unknown');
  });
});

describe('buildFindingsSummaryMarkdown', () => {
  it('starts with the correct header', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);
    expect(markdown).toMatch(/^# Findings Summary: Understanding Angular Signals/);
  });

  it('includes Document Metadata section with all required fields', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Document Metadata');
    expect(markdown).toContain('- **Article Title:** Understanding Angular Signals');
    expect(markdown).toContain('- **Author:** John Doe');
    expect(markdown).toContain('- **Date:** 2024-03-15');
    expect(markdown).toContain('- **Source URL:** https://blog.example.com/angular-signals');
    expect(markdown).toContain('- **Session Scope:** article');
    expect(markdown).toMatch(/- \*\*Research Date:\*\* \d{4}-\d{2}-\d{2}/);
  });

  it('includes Key Insights section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Key Insights');
    expect(markdown).toContain('Angular Signals represent');
  });

  it('includes Identified Entities section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Identified Entities');
    expect(markdown).toContain('- **Angular Signals**');
    expect(markdown).toContain('- **RxJS**');
  });

  it('includes Identified Concepts section', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Identified Concepts');
    expect(markdown).toContain('- **Fine-grained reactivity**');
    expect(markdown).toContain('- **Reactive programming**');
  });

  it('includes Recommended Wiki Pages table with path, type, and rationale', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Recommended Wiki Pages');
    expect(markdown).toContain('| Path | Type | Rationale |');
    expect(markdown).toContain('|------|------|-----------|');
    // Source page
    expect(markdown).toContain('| wiki/sources/understanding-angular-signals.md | source |');
    // Entity pages
    expect(markdown).toContain('| wiki/entities/angular-signals.md | entity |');
    expect(markdown).toContain('| wiki/entities/rxjs.md | entity |');
    // Concept pages
    expect(markdown).toContain('| wiki/concepts/fine-grained-reactivity.md | concept |');
    expect(markdown).toContain('| wiki/concepts/reactive-programming.md | concept |');
  });

  it('includes Session Artifacts section with all required files', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    expect(markdown).toContain('## Session Artifacts');
    expect(markdown).toContain('- `article-analysis.md`');
    expect(markdown).toContain('- `article-content.json`');
    expect(markdown).toContain('- `raw-article.md`');
    expect(markdown).toContain('- `session.json`');
  });

  it('sections appear in the correct order', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const markdown = buildFindingsSummaryMarkdown(parsed, session);

    const metadataIdx = markdown.indexOf('## Document Metadata');
    const insightsIdx = markdown.indexOf('## Key Insights');
    const entitiesIdx = markdown.indexOf('## Identified Entities');
    const conceptsIdx = markdown.indexOf('## Identified Concepts');
    const wikiPagesIdx = markdown.indexOf('## Recommended Wiki Pages');
    const artifactsIdx = markdown.indexOf('## Session Artifacts');

    expect(metadataIdx).toBeLessThan(insightsIdx);
    expect(insightsIdx).toBeLessThan(entitiesIdx);
    expect(entitiesIdx).toBeLessThan(conceptsIdx);
    expect(conceptsIdx).toBeLessThan(wikiPagesIdx);
    expect(wikiPagesIdx).toBeLessThan(artifactsIdx);
  });
});

describe('generateRecommendedWikiPages', () => {
  it('generates a source page recommendation', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const pages = generateRecommendedWikiPages(parsed, session);

    const sourcePage = pages.find((p) => p.type === 'source');
    expect(sourcePage).toBeDefined();
    expect(sourcePage!.path).toBe('wiki/sources/understanding-angular-signals.md');
    expect(sourcePage!.rationale).toContain('citable source');
  });

  it('generates entity page recommendations for each entity', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const pages = generateRecommendedWikiPages(parsed, session);

    const entityPages = pages.filter((p) => p.type === 'entity');
    expect(entityPages).toHaveLength(2);
    expect(entityPages[0].path).toBe('wiki/entities/angular-signals.md');
    expect(entityPages[1].path).toBe('wiki/entities/rxjs.md');
  });

  it('generates concept page recommendations for each concept', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const pages = generateRecommendedWikiPages(parsed, session);

    const conceptPages = pages.filter((p) => p.type === 'concept');
    expect(conceptPages).toHaveLength(2);
    expect(conceptPages[0].path).toBe('wiki/concepts/fine-grained-reactivity.md');
    expect(conceptPages[1].path).toBe('wiki/concepts/reactive-programming.md');
  });

  it('includes rationale for each recommendation', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    const session = createSampleSession();
    const pages = generateRecommendedWikiPages(parsed, session);

    for (const page of pages) {
      expect(page.rationale.length).toBeGreaterThan(0);
    }
  });

  it('returns only source page when no entities or concepts', () => {
    const parsed = parseAnalysisMarkdown(SAMPLE_ANALYSIS);
    parsed.entities = [];
    parsed.concepts = [];
    const session = createSampleSession();
    const pages = generateRecommendedWikiPages(parsed, session);

    expect(pages).toHaveLength(1);
    expect(pages[0].type).toBe('source');
  });
});

describe('generateFindingsSummary (integration)', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('reads article-analysis.md and session.json, writes findings-summary.md', async () => {
    // Set up session directory with required files
    await fs.writeFile(`${sessionDir}/article-analysis.md`, SAMPLE_ANALYSIS);
    await fs.writeFile(
      `${sessionDir}/session.json`,
      JSON.stringify(createSampleSession())
    );

    const content = await generateFindingsSummary(fs, sessionDir);

    // Verify the file was written
    const written = await fs.readFile(`${sessionDir}/findings-summary.md`);
    expect(written).toBe(content);

    // Verify content structure
    expect(content).toContain('# Findings Summary:');
    expect(content).toContain('## Document Metadata');
    expect(content).toContain('## Key Insights');
    expect(content).toContain('## Identified Entities');
    expect(content).toContain('## Identified Concepts');
    expect(content).toContain('## Recommended Wiki Pages');
    expect(content).toContain('## Session Artifacts');
  });

  it('returns the full markdown content for inline display', async () => {
    await fs.writeFile(`${sessionDir}/article-analysis.md`, SAMPLE_ANALYSIS);
    await fs.writeFile(
      `${sessionDir}/session.json`,
      JSON.stringify(createSampleSession())
    );

    const content = await generateFindingsSummary(fs, sessionDir);
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('Understanding Angular Signals');
  });
});

describe('updateFindingsSummary', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('writes updated content to findings-summary.md', async () => {
    // Create initial file
    await fs.writeFile(`${sessionDir}/findings-summary.md`, 'initial content');

    const updatedContent = '# Updated Findings Summary\n\nNew content here.\n';
    await updateFindingsSummary(fs, sessionDir, updatedContent);

    const written = await fs.readFile(`${sessionDir}/findings-summary.md`);
    expect(written).toBe(updatedContent);
  });

  it('overwrites existing content completely', async () => {
    await fs.writeFile(
      `${sessionDir}/findings-summary.md`,
      'old content that should be replaced'
    );

    const newContent = 'completely new content';
    await updateFindingsSummary(fs, sessionDir, newContent);

    const written = await fs.readFile(`${sessionDir}/findings-summary.md`);
    expect(written).toBe(newContent);
    expect(written).not.toContain('old content');
  });
});

describe('completeSynthesizeStep', () => {
  let fs: FakeFileSystemPort;
  const sessionDir = '.kiro/research/sessions/test-session';

  beforeEach(() => {
    fs = new FakeFileSystemPort();
  });

  it('transitions session state from SYNTHESIZE to FINALIZE', async () => {
    const session = createSampleSession({ state: 'SYNTHESIZE' });
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(session));

    await completeSynthesizeStep(fs, sessionDir);

    const updated = JSON.parse(await fs.readFile(`${sessionDir}/session.json`));
    expect(updated.state).toBe('FINALIZE');
  });

  it('preserves all other session.json fields', async () => {
    const session = createSampleSession({ state: 'SYNTHESIZE' });
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(session));

    await completeSynthesizeStep(fs, sessionDir);

    const updated = JSON.parse(await fs.readFile(`${sessionDir}/session.json`));
    expect(updated.id).toBe('understanding-angular-signals');
    expect(updated.topic).toBe('Understanding Angular Signals');
    expect(updated.scope).toBe('article');
    expect(updated.articleTitle).toBe('Understanding Angular Signals');
  });

  it('throws when session is not in SYNTHESIZE state', async () => {
    const session = createSampleSession({ state: 'EXPLORE' });
    await fs.writeFile(`${sessionDir}/session.json`, JSON.stringify(session));

    await expect(completeSynthesizeStep(fs, sessionDir)).rejects.toThrow();
  });
});
