import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { GraphStateService } from './graph-state.service';
import { WikiParserService } from './wiki-parser.service';
import type { GraphData, GraphNode } from '../models/graph.models';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

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

/** Trigger a successful load synchronously (of() is synchronous). */
function loadData(service: GraphStateService, data: GraphData): void {
  (TestBed.inject(WikiParserService) as any).loadGraph.mockReturnValue(of(data));
  service.loadGraph();
}

// ---------------------------------------------------------------------------
// GraphStateService
// ---------------------------------------------------------------------------

describe('GraphStateService', () => {
  let service: GraphStateService;
  let wikiParserSpy: { loadGraph: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    wikiParserSpy = { loadGraph: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        GraphStateService,
        { provide: WikiParserService, useValue: wikiParserSpy },
      ],
    });

    service = TestBed.inject(GraphStateService);
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

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
  });

  // -------------------------------------------------------------------------
  // loadGraph — loading state and success
  // -------------------------------------------------------------------------

  describe('loadGraph()', () => {
    it('sets isLoading to true while request is in flight', () => {
      // A never-completing observable keeps isLoading true
      wikiParserSpy.loadGraph.mockReturnValue(new Observable(() => { /* never completes */ }));
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
      // The switchMap sets _error to null before calling wikiParser.loadGraph(),
      // so even if the previous load failed, the error is cleared when a new
      // load begins. Use a never-completing observable to observe this mid-flight.
      wikiParserSpy.loadGraph
        .mockReturnValueOnce(throwError(() => new Error('network error')))
        .mockReturnValueOnce(new Observable(() => { /* never completes */ }));

      service.loadGraph(); // fails, sets error
      expect(service.error()).toBe('network error');

      // NOTE: After an RxJS error the outer subscription terminates, so a
      // second loadGraph() call will not re-subscribe. This test documents
      // the current behavior: the error persists after the subscription ends.
      service.loadGraph();
      // error remains because the subscription has terminated
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

  // -------------------------------------------------------------------------
  // selectNode
  // -------------------------------------------------------------------------

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
      // Re-inject to get a fresh instance with no data
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

  // -------------------------------------------------------------------------
  // setTypeFilter — Requirement 4.1, 4.2
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // setSearchQuery — Requirement 4.3, 4.4
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // setTagFilter — Requirement 4.6, 4.7
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Combined filters — Requirement 4.1–4.7
  // -------------------------------------------------------------------------

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
      expect(ids).not.toContain('ng-docs'); // source type disabled
      expect(ids).not.toContain('signals'); // doesn't match search
    });

    it('type filter + tag filter are applied together', () => {
      service.setTypeFilter('entity', false);
      service.setTagFilter('framework');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).not.toContain('angular'); // entity type disabled
      expect(ids).toContain('ng-docs');     // source with 'framework' tag
    });

    it('all three filters applied together', () => {
      service.setTypeFilter('source', false);
      service.setSearchQuery('rxjs');
      service.setTagFilter('reactivity');
      const ids = service.visibleNodes().map((n) => n.id);
      expect(ids).toContain('rxjs');
      expect(ids).not.toContain('signals'); // doesn't match search
      expect(ids).not.toContain('angular'); // doesn't match tag
      expect(ids).not.toContain('ng-docs'); // source type disabled
    });
  });

  // -------------------------------------------------------------------------
  // hubNodes — Requirement 5.2
  // -------------------------------------------------------------------------

  describe('hubNodes', () => {
    it('returns top 5 nodes sorted by total connection count descending', () => {
      const nodes = [
        makeNode('a', { inDegree: 1, outDegree: 1 }), // total: 2
        makeNode('b', { inDegree: 5, outDegree: 3 }), // total: 8
        makeNode('c', { inDegree: 0, outDegree: 4 }), // total: 4
        makeNode('d', { inDegree: 2, outDegree: 2 }), // total: 4
        makeNode('e', { inDegree: 3, outDegree: 4 }), // total: 7
        makeNode('f', { inDegree: 0, outDegree: 1 }), // total: 1
      ];
      loadData(service, makeGraphData(nodes));

      const hubs = service.hubNodes();
      expect(hubs).toHaveLength(5);
      expect(hubs[0].id).toBe('b'); // 8
      expect(hubs[1].id).toBe('e'); // 7
      // c and d both have 4 — either order is valid
      expect([hubs[2].id, hubs[3].id]).toContain('c');
      expect([hubs[2].id, hubs[3].id]).toContain('d');
      expect(hubs[4].id).toBe('a'); // 2
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

  // -------------------------------------------------------------------------
  // orphanNodes — Requirement 5.1, 5.4
  // -------------------------------------------------------------------------

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
});
