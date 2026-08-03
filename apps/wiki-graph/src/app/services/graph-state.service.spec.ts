import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { GraphStateService } from './graph-state.service';
import { WikiParserService } from './wiki-parser.service';
import { ProgressStateService } from './progress-state.service';
import type { GraphData, GraphNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import { PROGRESS_COLORS, WIKI_NODE_COLORS, DEFAULT_NODE_SIZE } from '../models/progress.constants';

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    title: id.charAt(0).toUpperCase() + id.slice(1),
    type: 'entity',
    tags: [],
    filePath: `entities/${id}.md`,
    isGhost: false,
    inDegree: 0,
    outDegree: 0,
    ...overrides,
  };
}

function makeGraphData(
  nodes: GraphNode[],
  edges: { sourceId: string; targetId: string }[] = []
): GraphData {
  const nodesMap = new Map(nodes.map((n) => [n.id, n]));
  const allTags = [...new Set(nodes.flatMap((n) => n.tags))].sort();
  return { nodes: nodesMap, edges, allTags };
}

function loadData(service: GraphStateService, data: GraphData): void {
  (TestBed.inject(WikiParserService) as any).loadGraph.mockReturnValue(of(data));
  service.loadGraph();
}

describe('GraphStateService', () => {
  let service: GraphStateService;
  let wikiParserSpy: { loadGraph: ReturnType<typeof vi.fn> };
  let progressStateSpy: {
    getProgress: ReturnType<typeof vi.fn>;
    getAllProgress: ReturnType<typeof vi.fn>;
    getAssessmentCount: ReturnType<typeof vi.fn>;
    getAllAssessmentCounts: ReturnType<typeof vi.fn>;
    setKnownConceptIds: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    wikiParserSpy = { loadGraph: vi.fn() };
    progressStateSpy = {
      getProgress: vi.fn().mockReturnValue('Not_Started'),
      getAllProgress: vi.fn().mockReturnValue(new Map()),
      getAssessmentCount: vi.fn().mockReturnValue(0),
      getAllAssessmentCounts: vi.fn().mockReturnValue(new Map()),
      setKnownConceptIds: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GraphStateService,
        { provide: WikiParserService, useValue: wikiParserSpy },
        { provide: ProgressStateService, useValue: progressStateSpy },
      ],
    });

    service = TestBed.inject(GraphStateService);
  });

  describe('initial state', () => {
    it('graphData is null before any load', () => {
      expect(service.graphData()).toBeNull();
    });

    it('selectedNode is null initially', () => {
      expect(service.selectedNode()).toBeNull();
    });

    it('all three node types are active by default', () => {
      const filters = service.activeTypeFilters();
      expect(filters.has('entity')).toBe(true);
      expect(filters.has('concept')).toBe(true);
      expect(filters.has('source')).toBe(true);
    });

    it('searchQuery is empty string initially', () => {
      expect(service.searchQuery()).toBe('');
    });

    it('activeTagFilter is null initially', () => {
      expect(service.activeTagFilter()).toBeNull();
    });

    it('isLoading is false initially', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('error is null initially', () => {
      expect(service.error()).toBeNull();
    });

    it('visibleNodes is empty before any load', () => {
      expect(service.visibleNodes()).toEqual([]);
    });

    it('hubNodes is empty before any load', () => {
      expect(service.hubNodes()).toEqual([]);
    });

    it('orphanNodes is empty before any load', () => {
      expect(service.orphanNodes()).toEqual([]);
    });

    it('visualizationMode is "wiki" by default', () => {
      expect(service.visualizationMode()).toBe('wiki');
    });

    it('activeProgressFilters is empty set initially', () => {
      expect(service.activeProgressFilters().size).toBe(0);
    });
  });

  describe('loadGraph()', () => {
    it('sets isLoading to true while request is in flight', () => {
      wikiParserSpy.loadGraph.mockReturnValue(new Observable(() => {
        /* pending */
      }));
      service.loadGraph();
      expect(service.isLoading()).toBe(true);
    });

    it('sets graphData and clears isLoading on success', () => {
      const data = makeGraphData([makeNode('angular')]);
      wikiParserSpy.loadGraph.mockReturnValue(of(data));
      service.loadGraph();

      expect(service.graphData()).toBe(data);
      expect(service.isLoading()).toBe(false);
    });

    it('clears error signal at the start of a new load attempt', () => {
      wikiParserSpy.loadGraph
        .mockReturnValueOnce(throwError(() => new Error('network error')))
        .mockReturnValueOnce(new Observable(() => {
          /* pending */
        }));

      service.loadGraph();
      expect(service.error()).toBe('network error');

      service.loadGraph();
      expect(service.error()).toBe('network error');
    });

    it('sets error message and clears isLoading on failure', () => {
      wikiParserSpy.loadGraph.mockReturnValue(
        throwError(() => new Error('Wiki manifest not found'))
      );
      service.loadGraph();

      expect(service.error()).toBe('Wiki manifest not found');
      expect(service.isLoading()).toBe(false);
    });

    it('uses a generic message for non-Error rejections', () => {
      wikiParserSpy.loadGraph.mockReturnValue(throwError(() => 'string error'));
      service.loadGraph();

      expect(service.error()).toContain('unknown error');
    });
  });

  describe('selectNode()', () => {
    beforeEach(() => {
      loadData(service, makeGraphData([makeNode('angular'), makeNode('signals')]));
    });

    it('selects a node by id', () => {
      service.selectNode('angular');
      expect(service.selectedNode()?.id).toBe('angular');
    });

    it('clears selection when called with null', () => {
      service.selectNode('angular');
      service.selectNode(null);
      expect(service.selectedNode()).toBeNull();
    });

    it('sets selectedNode to null for an unknown id', () => {
      service.selectNode('nonexistent-id');
      expect(service.selectedNode()).toBeNull();
    });

    it('sets selectedNode to null when graphData is not loaded', () => {
      TestBed.resetTestingModule();
      const freshSpy = { loadGraph: vi.fn() };
      TestBed.configureTestingModule({
        providers: [
          GraphStateService,
          { provide: WikiParserService, useValue: freshSpy },
        ],
      });
      const freshService = TestBed.inject(GraphStateService);
      freshService.selectNode('angular');
      expect(freshService.selectedNode()).toBeNull();
    });
  });

  describe('setTypeFilter()', () => {
    beforeEach(() => {
      loadData(
        service,
        makeGraphData([
          makeNode('angular', { type: 'entity' }),
          makeNode('signals', { type: 'concept' }),
          makeNode('rxjs-docs', { type: 'source' }),
        ])
      );
    });

    it('disabling a type removes it from activeTypeFilters', () => {
      service.setTypeFilter('concept', false);
      expect(service.activeTypeFilters().has('concept')).toBe(false);
    });

    it('enabling a type adds it back to activeTypeFilters', () => {
      service.setTypeFilter('concept', false);
      service.setTypeFilter('concept', true);
      expect(service.activeTypeFilters().has('concept')).toBe(true);
    });

    it('visibleNodes excludes nodes of a disabled type', () => {
      service.setTypeFilter('concept', false);
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).not.toContain('signals');
      expect(ids).toContain('angular');
      expect(ids).toContain('rxjs-docs');
    });

    it('visibleNodes includes all nodes when all types are active', () => {
      expect(service.visibleNodes()).toHaveLength(3);
    });

    it('visibleNodes is empty when all types are disabled', () => {
      service.setTypeFilter('entity', false);
      service.setTypeFilter('concept', false);
      service.setTypeFilter('source', false);
      expect(service.visibleNodes()).toHaveLength(0);
    });
  });

  describe('setSearchQuery()', () => {
    beforeEach(() => {
      loadData(
        service,
        makeGraphData([
          makeNode('angular', { title: 'Angular' }),
          makeNode('angular-cdk', { title: 'Angular CDK' }),
          makeNode('signals', { title: 'Signals' }),
        ])
      );
    });

    it('updates searchQuery signal', () => {
      service.setSearchQuery('angular');
      expect(service.searchQuery()).toBe('angular');
    });

    it('visibleNodes filters by title substring (case-insensitive)', () => {
      service.setSearchQuery('angular');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('angular');
      expect(ids).toContain('angular-cdk');
      expect(ids).not.toContain('signals');
    });

    it('search is case-insensitive', () => {
      service.setSearchQuery('ANGULAR');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('angular');
      expect(ids).toContain('angular-cdk');
    });

    it('clearing search restores all nodes', () => {
      service.setSearchQuery('angular');
      service.setSearchQuery('');
      expect(service.visibleNodes()).toHaveLength(3);
    });

    it('returns empty list when no titles match', () => {
      service.setSearchQuery('zzznomatch');
      expect(service.visibleNodes()).toHaveLength(0);
    });
  });

  describe('setTagFilter()', () => {
    beforeEach(() => {
      loadData(
        service,
        makeGraphData([
          makeNode('angular', { tags: ['framework', 'frontend'] }),
          makeNode('signals', { tags: ['reactivity', 'frontend'] }),
          makeNode('rxjs', { tags: ['reactivity'] }),
        ])
      );
    });

    it('updates activeTagFilter signal', () => {
      service.setTagFilter('frontend');
      expect(service.activeTagFilter()).toBe('frontend');
    });

    it('visibleNodes includes only nodes with the selected tag', () => {
      service.setTagFilter('frontend');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('angular');
      expect(ids).toContain('signals');
      expect(ids).not.toContain('rxjs');
    });

    it('clearing tag filter restores all nodes', () => {
      service.setTagFilter('frontend');
      service.setTagFilter(null);
      expect(service.visibleNodes()).toHaveLength(3);
    });

    it('returns empty list when no nodes have the selected tag', () => {
      service.setTagFilter('nonexistent-tag');
      expect(service.visibleNodes()).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    beforeEach(() => {
      loadData(
        service,
        makeGraphData([
          makeNode('angular', { type: 'entity', title: 'Angular', tags: ['framework'] }),
          makeNode('signals', { type: 'concept', title: 'Signals', tags: ['reactivity'] }),
          makeNode('rxjs', { type: 'concept', title: 'RxJS', tags: ['reactivity'] }),
          makeNode('ng-docs', { type: 'source', title: 'Angular Docs', tags: ['framework'] }),
        ])
      );
    });

    it('type filter + search query are applied together', () => {
      service.setTypeFilter('source', false);
      service.setSearchQuery('angular');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('angular');
      expect(ids).not.toContain('ng-docs');
      expect(ids).not.toContain('signals');
    });

    it('type filter + tag filter are applied together', () => {
      service.setTypeFilter('entity', false);
      service.setTagFilter('framework');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).not.toContain('angular');
      expect(ids).toContain('ng-docs');
    });

    it('all three filters applied together', () => {
      service.setTypeFilter('source', false);
      service.setSearchQuery('rxjs');
      service.setTagFilter('reactivity');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('rxjs');
      expect(ids).not.toContain('signals');
      expect(ids).not.toContain('angular');
      expect(ids).not.toContain('ng-docs');
    });
  });

  describe('hubNodes', () => {
    it('returns top 5 nodes sorted by total connection count descending', () => {
      const nodes = [
        makeNode('a', { inDegree: 1, outDegree: 1 }),
        makeNode('b', { inDegree: 5, outDegree: 3 }),
        makeNode('c', { inDegree: 0, outDegree: 4 }),
        makeNode('d', { inDegree: 2, outDegree: 2 }),
        makeNode('e', { inDegree: 3, outDegree: 4 }),
        makeNode('f', { inDegree: 0, outDegree: 1 }),
      ];
      loadData(service, makeGraphData(nodes));

      const hubs = service.hubNodes();
      expect(hubs).toHaveLength(5);
      expect(hubs[0].id).toBe('b');
      expect(hubs[1].id).toBe('e');
      expect([hubs[2].id, hubs[3].id]).toContain('c');
      expect([hubs[2].id, hubs[3].id]).toContain('d');
      expect(hubs[4].id).toBe('a');
    });

    it('returns all nodes when there are fewer than 5', () => {
      loadData(
        service,
        makeGraphData([
          makeNode('a', { inDegree: 2, outDegree: 1 }),
          makeNode('b', { inDegree: 0, outDegree: 3 }),
        ])
      );
      expect(service.hubNodes()).toHaveLength(2);
    });

    it('first hub has the highest connection count', () => {
      loadData(
        service,
        makeGraphData([
          makeNode('low', { inDegree: 0, outDegree: 1 }),
          makeNode('high', { inDegree: 10, outDegree: 5 }),
          makeNode('mid', { inDegree: 2, outDegree: 2 }),
        ])
      );
      expect(service.hubNodes()[0].id).toBe('high');
    });
  });

  describe('orphanNodes', () => {
    it('identifies nodes with zero in and out degree', () => {
      loadData(
        service,
        makeGraphData([
          makeNode('orphan-a', { inDegree: 0, outDegree: 0 }),
          makeNode('orphan-b', { inDegree: 0, outDegree: 0 }),
          makeNode('connected', { inDegree: 1, outDegree: 0 }),
          makeNode('outgoing', { inDegree: 0, outDegree: 1 }),
        ])
      );

      const orphanIds = service.orphanNodes().map((n) => n.id);
      expect(orphanIds).toContain('orphan-a');
      expect(orphanIds).toContain('orphan-b');
      expect(orphanIds).not.toContain('connected');
      expect(orphanIds).not.toContain('outgoing');
    });

    it('returns empty array when no orphans exist', () => {
      loadData(
        service,
        makeGraphData([
          makeNode('a', { inDegree: 1, outDegree: 0 }),
          makeNode('b', { inDegree: 0, outDegree: 1 }),
        ])
      );
      expect(service.orphanNodes()).toHaveLength(0);
    });

    it('returns all nodes as orphans when graph has no edges', () => {
      loadData(service, makeGraphData([makeNode('a'), makeNode('b'), makeNode('c')]));
      expect(service.orphanNodes()).toHaveLength(3);
    });
  });

  describe('setVisualizationMode()', () => {
    it('updates visualizationMode signal to "progress"', () => {
      service.setVisualizationMode('progress');
      expect(service.visualizationMode()).toBe('progress');
    });

    it('updates visualizationMode signal back to "wiki"', () => {
      service.setVisualizationMode('progress');
      service.setVisualizationMode('wiki');
      expect(service.visualizationMode()).toBe('wiki');
    });

    it('maintains mode when set to same value', () => {
      service.setVisualizationMode('wiki');
      expect(service.visualizationMode()).toBe('wiki');
    });
  });

  describe('filterByProgress()', () => {
    it('sets activeProgressFilters with single state', () => {
      service.filterByProgress(['In_Progress']);
      const filters = service.activeProgressFilters();
      expect(filters.has('In_Progress')).toBe(true);
      expect(filters.size).toBe(1);
    });

    it('sets activeProgressFilters with multiple states', () => {
      service.filterByProgress(['Understood', 'Mastered']);
      const filters = service.activeProgressFilters();
      expect(filters.has('Understood')).toBe(true);
      expect(filters.has('Mastered')).toBe(true);
      expect(filters.size).toBe(2);
    });

    it('clears filters when called with empty array', () => {
      service.filterByProgress(['In_Progress']);
      service.filterByProgress([]);
      expect(service.activeProgressFilters().size).toBe(0);
    });

    it('replaces previous filters when called again', () => {
      service.filterByProgress(['In_Progress']);
      service.filterByProgress(['Mastered']);
      const filters = service.activeProgressFilters();
      expect(filters.has('In_Progress')).toBe(false);
      expect(filters.has('Mastered')).toBe(true);
      expect(filters.size).toBe(1);
    });

    it('handles all four progress states', () => {
      service.filterByProgress(['Not_Started', 'In_Progress', 'Understood', 'Mastered']);
      const filters = service.activeProgressFilters();
      expect(filters.has('Not_Started')).toBe(true);
      expect(filters.has('In_Progress')).toBe(true);
      expect(filters.has('Understood')).toBe(true);
      expect(filters.has('Mastered')).toBe(true);
      expect(filters.size).toBe(4);
    });
  });

  describe('applyProgressData()', () => {
    it('merges progress states into graph data for every node', () => {
      const data = makeGraphData([makeNode('angular'), makeNode('signals')]);
      progressStateSpy.getAllProgress.mockReturnValue(
        new Map([
          ['angular', 'Understood'],
          ['signals', 'Mastered'],
        ])
      );

      const result = service.applyProgressData(data);

      expect(result.progressStates.get('angular')).toBe('Understood');
      expect(result.progressStates.get('signals')).toBe('Mastered');
    });

    it('defaults to Not_Started for concepts without recorded progress', () => {
      const data = makeGraphData([makeNode('rxjs')]);
      progressStateSpy.getAllProgress.mockReturnValue(new Map());

      const result = service.applyProgressData(data);

      expect(result.progressStates.get('rxjs')).toBe('Not_Started');
    });

    it('preserves original nodes and edges in the returned data', () => {
      const data = makeGraphData(
        [makeNode('angular'), makeNode('signals')],
        [{ sourceId: 'angular', targetId: 'signals' }]
      );
      progressStateSpy.getAllProgress.mockReturnValue(new Map());

      const result = service.applyProgressData(data);

      expect(result.nodes).toBe(data.nodes);
      expect(result.edges).toEqual(data.edges);
    });

    it('graphDataWithProgress computed signal reflects applyProgressData for loaded graph', () => {
      const data = makeGraphData([makeNode('angular')]);
      progressStateSpy.getAllProgress.mockReturnValue(new Map([['angular', 'In_Progress']]));
      loadData(service, data);

      const result = service.graphDataWithProgress();
      expect(result?.progressStates.get('angular')).toBe('In_Progress');
    });

    it('graphDataWithProgress is null before any graph is loaded', () => {
      expect(service.graphDataWithProgress()).toBeNull();
    });
  });

  describe('getNodeColor()', () => {
    it('returns the wiki type color in wiki mode', () => {
      const node = makeNode('angular', { type: 'entity' });
      const color = service.getNodeColor(node, 'wiki');
      expect(color).toBe(WIKI_NODE_COLORS.entity);
    });

    it('returns different wiki colors for different node types', () => {
      expect(service.getNodeColor(makeNode('a', { type: 'concept' }), 'wiki')).toBe(
        WIKI_NODE_COLORS.concept
      );
      expect(service.getNodeColor(makeNode('b', { type: 'source' }), 'wiki')).toBe(
        WIKI_NODE_COLORS.source
      );
    });

    it('returns the progress state color in progress mode', () => {
      progressStateSpy.getProgress.mockReturnValue('Mastered');
      const node = makeNode('angular');
      const color = service.getNodeColor(node, 'progress');
      expect(color).toBe(PROGRESS_COLORS.Mastered);
      expect(progressStateSpy.getProgress).toHaveBeenCalledWith('angular');
    });

    it('defaults to Not_Started color in progress mode when no progress recorded', () => {
      progressStateSpy.getProgress.mockReturnValue('Not_Started');
      const color = service.getNodeColor(makeNode('rxjs'), 'progress');
      expect(color).toBe(PROGRESS_COLORS.Not_Started);
    });
  });

  describe('getNodeSize()', () => {
    it('returns the default size in wiki mode', () => {
      const size = service.getNodeSize(makeNode('angular'), 'wiki');
      expect(size).toBe(DEFAULT_NODE_SIZE);
    });

    it('returns the default size in progress mode when sizeByAssessment is false', () => {
      progressStateSpy.getAssessmentCount.mockReturnValue(10);
      const size = service.getNodeSize(makeNode('angular'), 'progress');
      expect(size).toBe(DEFAULT_NODE_SIZE);
    });

    it('scales size by assessment count in progress mode when enabled', () => {
      progressStateSpy.getAssessmentCount.mockReturnValue(2);
      const size = service.getNodeSize(makeNode('angular'), 'progress', true);
      expect(size).toBeGreaterThan(DEFAULT_NODE_SIZE);
      expect(progressStateSpy.getAssessmentCount).toHaveBeenCalledWith('angular');
    });

    it('caps size at the maximum for very high assessment counts', () => {
      progressStateSpy.getAssessmentCount.mockReturnValue(1000);
      const size = service.getNodeSize(makeNode('angular'), 'progress', true);
      expect(size).toBe(20);
    });

    it('does not scale by assessment count in wiki mode even if enabled', () => {
      progressStateSpy.getAssessmentCount.mockReturnValue(10);
      const size = service.getNodeSize(makeNode('angular'), 'wiki', true);
      expect(size).toBe(DEFAULT_NODE_SIZE);
    });
  });

  describe('requestAssessment() / clearAssessmentRequest()', () => {
    it('assessmentRequestedConceptId is null before any request', () => {
      expect(service.assessmentRequestedConceptId()).toBeNull();
    });

    it('sets assessmentRequestedConceptId to the requested concept id', () => {
      service.requestAssessment('angular');
      expect(service.assessmentRequestedConceptId()).toBe('angular');
    });

    it('overwrites a pending request with a new concept id', () => {
      service.requestAssessment('angular');
      service.requestAssessment('rxjs');
      expect(service.assessmentRequestedConceptId()).toBe('rxjs');
    });

    it('clears the pending request back to null', () => {
      service.requestAssessment('angular');
      service.clearAssessmentRequest();
      expect(service.assessmentRequestedConceptId()).toBeNull();
    });
  });

  describe('setKnownConceptIds correlation', () => {
    it('registers the known concept IDs from real (non-ghost) nodes with ProgressStateService on graph load', () => {
      loadData(
        service,
        makeGraphData([
          makeNode('typescript'),
          makeNode('rxjs'),
          makeNode('ghost-target', { isGhost: true }),
        ])
      );

      expect(progressStateSpy.setKnownConceptIds).toHaveBeenCalledTimes(1);
      const registeredIds = Array.from(progressStateSpy.setKnownConceptIds.mock.calls[0][0] as Iterable<string>);
      expect(registeredIds.sort()).toEqual(['rxjs', 'typescript']);
      expect(registeredIds).not.toContain('ghost-target');
    });

    it('re-registers known concept IDs on each subsequent graph load', () => {
      loadData(service, makeGraphData([makeNode('typescript')]));
      loadData(service, makeGraphData([makeNode('rxjs')]));

      expect(progressStateSpy.setKnownConceptIds).toHaveBeenCalledTimes(2);
      const secondCallIds = Array.from(progressStateSpy.setKnownConceptIds.mock.calls[1][0] as Iterable<string>);
      expect(secondCallIds).toEqual(['rxjs']);
    });
  });

  describe('progressStates', () => {
    it('reflects ProgressStateService.getAllProgress()', () => {
      const progress = new Map<string, ProgressState>([['angular', 'Understood']]);
      progressStateSpy.getAllProgress.mockReturnValue(progress);

      // Fresh service instance so the computed's first read picks up this mock value.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GraphStateService,
          { provide: WikiParserService, useValue: wikiParserSpy },
          { provide: ProgressStateService, useValue: progressStateSpy },
        ],
      });
      const freshService = TestBed.inject(GraphStateService);

      expect(freshService.progressStates()).toBe(progress);
    });
  });

  describe('activeProgressFiltersList', () => {
    it('returns an empty array when no filters are active', () => {
      expect(service.activeProgressFiltersList()).toEqual([]);
    });

    it('returns the active filters as an array', () => {
      service.filterByProgress(['Understood', 'Mastered']);
      expect(service.activeProgressFiltersList().sort()).toEqual(['Mastered', 'Understood']);
    });
  });

  describe('progressStats', () => {
    it('returns all-zero stats with 0% complete when there is no progress data', () => {
      progressStateSpy.getAllProgress.mockReturnValue(new Map());
      expect(service.progressStats()).toEqual({
        total: 0,
        notStarted: 0,
        inProgress: 0,
        understood: 0,
        mastered: 0,
        percentComplete: 0,
      });
    });

    it('tallies counts per progress state', () => {
      progressStateSpy.getAllProgress.mockReturnValue(
        new Map<string, ProgressState>([
          ['a', 'Not_Started'],
          ['b', 'Not_Started'],
          ['c', 'In_Progress'],
          ['d', 'Understood'],
          ['e', 'Mastered'],
        ])
      );

      // Fresh service instance so the computed's first read picks up this mock value.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GraphStateService,
          { provide: WikiParserService, useValue: wikiParserSpy },
          { provide: ProgressStateService, useValue: progressStateSpy },
        ],
      });
      const freshService = TestBed.inject(GraphStateService);

      expect(freshService.progressStats()).toEqual({
        total: 5,
        notStarted: 2,
        inProgress: 1,
        understood: 1,
        mastered: 1,
        percentComplete: 40, // (understood + mastered) / total = 2/5 = 40%
      });
    });

    it('rounds percentComplete to the nearest integer', () => {
      progressStateSpy.getAllProgress.mockReturnValue(
        new Map<string, ProgressState>([
          ['a', 'Understood'],
          ['b', 'Not_Started'],
          ['c', 'Not_Started'],
        ])
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GraphStateService,
          { provide: WikiParserService, useValue: wikiParserSpy },
          { provide: ProgressStateService, useValue: progressStateSpy },
        ],
      });
      const freshService = TestBed.inject(GraphStateService);

      // 1/3 = 33.33...% -> rounds to 33
      expect(freshService.progressStats().percentComplete).toBe(33);
    });
  });

  describe('selectedNodeProgress', () => {
    it('is null when no node is selected', () => {
      expect(service.selectedNodeProgress()).toBeNull();
    });

    it('returns the progress state and assessment count for the selected node', () => {
      loadData(service, makeGraphData([makeNode('angular')]));
      progressStateSpy.getProgress.mockReturnValue('Understood');
      progressStateSpy.getAssessmentCount.mockReturnValue(3);

      service.selectNode('angular');

      expect(service.selectedNodeProgress()).toEqual({ state: 'Understood', assessmentCount: 3 });
      expect(progressStateSpy.getProgress).toHaveBeenCalledWith('angular');
      expect(progressStateSpy.getAssessmentCount).toHaveBeenCalledWith('angular');
    });

    it('is null again after the selection is cleared', () => {
      loadData(service, makeGraphData([makeNode('angular')]));
      service.selectNode('angular');
      service.selectNode(null);
      expect(service.selectedNodeProgress()).toBeNull();
    });
  });
});
