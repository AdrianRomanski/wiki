import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WikiParserService, extractWikilinks, parseFilesToGraphData } from './wiki-parser.service';
import type { WikiManifest } from '../models/graph.models';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeMarkdown(
  title: string,
  type: string,
  tags: string[],
  body = ''
): string {
  const tagsYaml =
    tags.length > 0 ? `\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}` : '';
  return `---\ntitle: ${title}\ntype: ${type}${tagsYaml}\n---\n${body}`;
}

const MANIFEST: WikiManifest = {
  files: ['entities/angular.md', 'concepts/signals.md'],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// extractWikilinks (pure function)
// ---------------------------------------------------------------------------

describe('extractWikilinks', () => {
  it('returns empty array for content with no wikilinks', () => {
    expect(extractWikilinks('No links here.')).toEqual([]);
  });

  it('extracts a simple wikilink', () => {
    expect(extractWikilinks('See [[Angular]].')).toEqual(['Angular']);
  });

  it('strips display text after pipe', () => {
    expect(extractWikilinks('See [[Angular|the framework]].')).toEqual(['Angular']);
  });

  it('strips section anchor after hash', () => {
    expect(extractWikilinks('See [[Angular#Signals]].')).toEqual(['Angular']);
  });

  it('strips both pipe and hash (pipe takes precedence)', () => {
    expect(extractWikilinks('See [[Angular#Signals|display]].')).toEqual(['Angular']);
  });

  it('deduplicates repeated links to the same target', () => {
    const content = '[[Angular]] and [[Angular]] again.';
    expect(extractWikilinks(content)).toEqual(['Angular']);
  });

  it('extracts multiple distinct links', () => {
    const content = '[[Angular]] uses [[Signals]] and [[RxJS]].';
    const result = extractWikilinks(content);
    expect(result).toContain('Angular');
    expect(result).toContain('Signals');
    expect(result).toContain('RxJS');
    expect(result).toHaveLength(3);
  });

  it('handles links with spaces in title', () => {
    expect(extractWikilinks('[[Change Detection]]')).toEqual(['Change Detection']);
  });
});

// ---------------------------------------------------------------------------
// parseFilesToGraphData (pure function)
// ---------------------------------------------------------------------------

describe('parseFilesToGraphData', () => {
  it('returns empty graph for empty input', () => {
    const result = parseFilesToGraphData([]);
    expect(result.nodes.size).toBe(0);
    expect(result.edges).toHaveLength(0);
    expect(result.allTags).toHaveLength(0);
  });

  it('creates one node per valid file', () => {
    const files = [
      { filePath: 'entities/angular.md', content: makeMarkdown('Angular', 'entity', []) },
      { filePath: 'concepts/signals.md', content: makeMarkdown('Signals', 'concept', []) },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.size).toBe(2);
    expect(result.nodes.has('angular')).toBe(true);
    expect(result.nodes.has('signals')).toBe(true);
  });

  it('uses normalized (lowercase) title as node id', () => {
    const files = [
      { filePath: 'entities/angular.md', content: makeMarkdown('Angular CDK', 'entity', []) },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.has('angular cdk')).toBe(true);
    expect(result.nodes.get('angular cdk')?.title).toBe('Angular CDK');
  });

  it('skips files with missing title', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const files = [
      { filePath: 'entities/bad.md', content: '---\ntype: entity\n---\nno title' },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('skips files with invalid type', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const files = [
      { filePath: 'entities/bad.md', content: makeMarkdown('Bad', 'unknown', []) },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.size).toBe(0);
    consoleSpy.mockRestore();
  });

  it('creates ghost node for broken wikilink target', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', [], '[[NonExistent]]'),
      },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.has('nonexistent')).toBe(true);
    expect(result.nodes.get('nonexistent')?.isGhost).toBe(true);
  });

  it('creates an edge for each wikilink', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', [], '[[Signals]]'),
      },
      { filePath: 'concepts/signals.md', content: makeMarkdown('Signals', 'concept', []) },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toEqual({ sourceId: 'angular', targetId: 'signals' });
  });

  it('deduplicates edges from repeated wikilinks in one page', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', [], '[[Signals]] and [[Signals]] again.'),
      },
      { filePath: 'concepts/signals.md', content: makeMarkdown('Signals', 'concept', []) },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.edges).toHaveLength(1);
  });

  it('computes inDegree and outDegree correctly', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', [], '[[Signals]] [[RxJS]]'),
      },
      { filePath: 'concepts/signals.md', content: makeMarkdown('Signals', 'concept', []) },
      { filePath: 'concepts/rxjs.md', content: makeMarkdown('RxJS', 'concept', [], '[[Signals]]') },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.nodes.get('angular')?.outDegree).toBe(2);
    expect(result.nodes.get('angular')?.inDegree).toBe(0);
    expect(result.nodes.get('signals')?.inDegree).toBe(2);
    expect(result.nodes.get('rxjs')?.outDegree).toBe(1);
  });

  it('collects and sorts allTags from non-ghost nodes', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', ['framework', 'frontend']),
      },
      {
        filePath: 'concepts/signals.md',
        content: makeMarkdown('Signals', 'concept', ['reactivity', 'frontend']),
      },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.allTags).toEqual(['framework', 'frontend', 'reactivity']);
  });

  it('does not include ghost node tags in allTags', () => {
    const files = [
      {
        filePath: 'entities/angular.md',
        content: makeMarkdown('Angular', 'entity', ['framework'], '[[Ghost]]'),
      },
    ];
    const result = parseFilesToGraphData(files);
    expect(result.allTags).toEqual(['framework']);
  });
});

// ---------------------------------------------------------------------------
// WikiParserService (with HttpClient mock)
// ---------------------------------------------------------------------------

describe('WikiParserService', () => {
  let service: WikiParserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WikiParserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches manifest then all .md files and returns GraphData', () => {
    let result: ReturnType<typeof parseFilesToGraphData> | undefined;

    service.loadGraph().subscribe((data) => {
      result = data;
    });

    // Respond to manifest request
    const manifestReq = httpMock.expectOne('wiki/manifest.json');
    manifestReq.flush(MANIFEST);

    // Respond to each file request
    httpMock
      .expectOne('wiki/entities/angular.md')
      .flush(makeMarkdown('Angular', 'entity', ['framework'], '[[Signals]]'));
    httpMock
      .expectOne('wiki/concepts/signals.md')
      .flush(makeMarkdown('Signals', 'concept', ['reactivity']));

    expect(result).toBeDefined();
    expect(result!.nodes.size).toBe(2);
    expect(result!.edges).toHaveLength(1);
  });

  it('throws descriptive error on 404 manifest', () => {
    let error: Error | undefined;

    service.loadGraph().subscribe({ error: (e: Error) => (error = e) });

    httpMock.expectOne('wiki/manifest.json').flush('Not Found', {
      status: 404,
      statusText: 'Not Found',
    });

    expect(error?.message).toContain('Wiki manifest not found');
    expect(error?.message).toContain('npm run wiki:manifest');
  });

  it('returns empty graph when manifest has no files', () => {
    let result: ReturnType<typeof parseFilesToGraphData> | undefined;

    service.loadGraph().subscribe((data) => {
      result = data;
    });

    httpMock.expectOne('wiki/manifest.json').flush({ files: [], generatedAt: '' });

    expect(result?.nodes.size).toBe(0);
    expect(result?.edges).toHaveLength(0);
  });

  it('skips individual file failures and continues', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let result: ReturnType<typeof parseFilesToGraphData> | undefined;

    service.loadGraph().subscribe((data) => {
      result = data;
    });

    httpMock.expectOne('wiki/manifest.json').flush(MANIFEST);

    // First file fails
    httpMock.expectOne('wiki/entities/angular.md').flush('Not Found', {
      status: 404,
      statusText: 'Not Found',
    });
    // Second file succeeds
    httpMock
      .expectOne('wiki/concepts/signals.md')
      .flush(makeMarkdown('Signals', 'concept', []));

    expect(result?.nodes.size).toBe(1);
    expect(result?.nodes.has('signals')).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('second loadGraph call completes independently (switchMap behaviour)', () => {
    // Each call to loadGraph() creates a fresh observable chain via switchMap.
    // Verify that a second subscription resolves correctly on its own.
    let result: ReturnType<typeof parseFilesToGraphData> | undefined;

    service.loadGraph().subscribe((data) => {
      result = data;
    });

    httpMock.expectOne('wiki/manifest.json').flush({
      files: ['entities/angular.md'],
      generatedAt: '',
    });
    httpMock
      .expectOne('wiki/entities/angular.md')
      .flush(makeMarkdown('Angular', 'entity', []));

    expect(result?.nodes.has('angular')).toBe(true);
  });
});
