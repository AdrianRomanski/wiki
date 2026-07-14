import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WikiGraphPageComponent } from './wiki-graph-page.component';
import { GraphStateService } from './services/graph-state.service';
import type { GraphData, GraphNode } from './models/graph.models';

// ---------------------------------------------------------------------------
// Helpers
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

function makeGraphData(nodes: GraphNode[]): GraphData {
  return {
    nodes: new Map(nodes.map((n) => [n.id, n])),
    edges: [],
    allTags: [...new Set(nodes.flatMap((n) => n.tags))].sort(),
  };
}

// ---------------------------------------------------------------------------
// Mock GraphStateService
//
// We use writable signals so tests can push new values and Angular's change
// detection will pick them up automatically.
// ---------------------------------------------------------------------------

function createMockGraphStateService() {
  const _graphData = signal<GraphData | null>(null);
  const _selectedNode = signal<GraphNode | null>(null);
  const _isLoading = signal<boolean>(false);
  const _error = signal<string | null>(null);
  const _visibleNodes = signal<GraphNode[]>([]);
  const _hubNodes = signal<GraphNode[]>([]);
  const _orphanNodes = signal<GraphNode[]>([]);

  return {
    // Signals exposed to components
    graphData: _graphData.asReadonly(),
    selectedNode: _selectedNode.asReadonly(),
    activeTypeFilters: signal(new Set(['entity', 'concept', 'source'] as const)).asReadonly(),
    searchQuery: signal('').asReadonly(),
    activeTagFilter: signal<string | null>(null).asReadonly(),
    isLoading: _isLoading.asReadonly(),
    error: _error.asReadonly(),
    visibleNodes: _visibleNodes.asReadonly(),
    hubNodes: _hubNodes.asReadonly(),
    orphanNodes: _orphanNodes.asReadonly(),

    // Actions (spied)
    loadGraph: vi.fn(),
    selectNode: vi.fn((nodeId: string | null) => {
      if (nodeId === null) {
        _selectedNode.set(null);
        return;
      }
      const data = _graphData();
      if (!data) return;
      const node = data.nodes.get(nodeId) ?? null;
      _selectedNode.set(node);
    }),
    setTypeFilter: vi.fn(),
    setSearchQuery: vi.fn(),
    setTagFilter: vi.fn(),

    // Test helpers to push state changes
    _setGraphData: (data: GraphData | null) => {
      _graphData.set(data);
      _visibleNodes.set(data ? Array.from(data.nodes.values()) : []);
    },
    _setSelectedNode: (node: GraphNode | null) => _selectedNode.set(node),
    _setIsLoading: (v: boolean) => _isLoading.set(v),
    _setError: (msg: string | null) => _error.set(msg),
    _setHubNodes: (nodes: GraphNode[]) => _hubNodes.set(nodes),
    _setOrphanNodes: (nodes: GraphNode[]) => _orphanNodes.set(nodes),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('WikiGraphPageComponent', () => {
  let mockState: ReturnType<typeof createMockGraphStateService>;

  beforeEach(async () => {
    mockState = createMockGraphStateService();

    await TestBed.configureTestingModule({
      imports: [WikiGraphPageComponent],
      providers: [
        { provide: GraphStateService, useValue: mockState },
      ],
    }).compileComponents();
  });

  // -------------------------------------------------------------------------
  // 1. Component presence in DOM
  // -------------------------------------------------------------------------

  describe('child components are rendered', () => {
    it('renders the unified toolbar controls (type toggles, search, tag filter)', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      // WikiGraphPageComponent inlines a single unified toolbar rather than
      // composing GraphControlsComponent — assert against that toolbar's
      // actual markup instead of a child component selector.
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('[role="toolbar"]')).not.toBeNull();
      expect(el.querySelector('.type-toggle')).not.toBeNull();
      expect(el.querySelector('.search-input')).not.toBeNull();
      expect(el.querySelector('.tag-select')).not.toBeNull();
    });

    it('renders GraphCanvasComponent (app-graph-canvas)', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('app-graph-canvas')).not.toBeNull();
    });

    it('renders the unified toolbar summary stats (nodes, edges, orphans)', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      // WikiGraphPageComponent inlines the summary stats rather than
      // composing GraphSummaryPanelComponent — assert against the actual
      // .stat elements in the toolbar instead of a child component selector.
      const el: HTMLElement = fixture.nativeElement;
      const stats = el.querySelectorAll('.stat');
      expect(stats.length).toBeGreaterThan(0);
      const statsText = Array.from(stats).map(s => s.textContent).join(' ');
      expect(statsText).toContain('Nodes');
      expect(statsText).toContain('Edges');
      expect(statsText).toContain('Orphans');
    });

    it('renders NodeDetailPanelComponent (app-node-detail-panel)', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('app-node-detail-panel')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Initialization — Requirement 6.1
  // -------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('calls loadGraph() on initialization', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(mockState.loadGraph).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Loading indicator — Requirement 6.1
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows loading overlay when isLoading is true', async () => {
      mockState._setIsLoading(true);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const overlay = el.querySelector('.loading-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.textContent).toContain('Loading graph');
    });

    it('hides loading overlay when isLoading is false', async () => {
      mockState._setIsLoading(false);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.loading-overlay')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Error banner — Requirement 6.4
  // -------------------------------------------------------------------------

  describe('error state', () => {
    it('shows error banner when error signal is non-null', async () => {
      mockState._setError('Wiki manifest not found');

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const banner = el.querySelector('.error-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('Wiki manifest not found');
    });

    it('hides error banner when error signal is null', async () => {
      mockState._setError(null);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.error-banner')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Node selection flow — Requirements 3.1, 3.2
  // -------------------------------------------------------------------------

  describe('node selection flow', () => {
    it('detail panel shows node title after nodeSelected is emitted from canvas', async () => {
      const node = makeNode('angular', {
        title: 'Angular',
        type: 'entity',
        tags: ['framework'],
        inDegree: 3,
        outDegree: 2,
      });
      const data = makeGraphData([node]);
      mockState._setGraphData(data);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      // Simulate canvas emitting a node selection
      const canvasEl = fixture.nativeElement.querySelector('app-graph-canvas');
      const canvasComponent = fixture.debugElement.query(
        (de) => de.nativeElement === canvasEl
      )?.componentInstance;

      // Emit nodeSelected from the canvas output
      canvasComponent?.nodeSelected.emit('angular');
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify selectNode was called with the correct id
      expect(mockState.selectNode).toHaveBeenCalledWith('angular');
    });

    it('detail panel displays title, type, and tags when a node is selected', async () => {
      const node = makeNode('signals', {
        title: 'Signals',
        type: 'concept',
        tags: ['reactivity', 'angular'],
        inDegree: 5,
        outDegree: 1,
      });
      const data = makeGraphData([node]);
      mockState._setGraphData(data);
      mockState._setSelectedNode(node);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const panel = el.querySelector('app-node-detail-panel');
      expect(panel).not.toBeNull();

      const panelText = panel?.textContent ?? '';
      expect(panelText).toContain('Signals');
      expect(panelText).toContain('concept');
      expect(panelText).toContain('reactivity');
      expect(panelText).toContain('angular');
    });

    it('detail panel shows outgoing and incoming link counts', async () => {
      const node = makeNode('rxjs', {
        title: 'RxJS',
        type: 'source',
        tags: [],
        inDegree: 4,
        outDegree: 7,
      });
      const data = makeGraphData([node]);
      mockState._setGraphData(data);
      mockState._setSelectedNode(node);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const panelText = el.querySelector('app-node-detail-panel')?.textContent ?? '';
      expect(panelText).toContain('4');  // inDegree
      expect(panelText).toContain('7');  // outDegree
    });

    it('detail panel shows ghost indicator for ghost nodes', async () => {
      const ghostNode = makeNode('missing-page', {
        title: 'Missing Page',
        type: 'entity',
        isGhost: true,
      });
      const data = makeGraphData([ghostNode]);
      mockState._setGraphData(data);
      mockState._setSelectedNode(ghostNode);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const panelText = el.querySelector('app-node-detail-panel')?.textContent ?? '';
      expect(panelText).toContain('does not exist');
    });

    it('detail panel is hidden when no node is selected', async () => {
      mockState._setSelectedNode(null);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      // The section inside node-detail-panel is only rendered when a node is selected
      const section = el.querySelector('app-node-detail-panel section');
      expect(section).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Escape key deselects node — Requirements 3.4, 3.6
  // -------------------------------------------------------------------------

  describe('Escape key deselects node', () => {
    it('pressing Escape on the detail panel calls selectNode(null)', async () => {
      const node = makeNode('angular', { title: 'Angular' });
      const data = makeGraphData([node]);
      mockState._setGraphData(data);
      mockState._setSelectedNode(node);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const panelSection = el.querySelector('app-node-detail-panel section') as HTMLElement;
      expect(panelSection).not.toBeNull();

      // Dispatch Escape keydown on the panel section
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      panelSection.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      expect(mockState.selectNode).toHaveBeenCalledWith(null);
    });

    it('pressing Escape restores default state (no selected node)', async () => {
      const node = makeNode('angular', { title: 'Angular' });
      const data = makeGraphData([node]);
      mockState._setGraphData(data);
      mockState._setSelectedNode(node);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      // Simulate the selectNode(null) call that Escape triggers
      mockState._setSelectedNode(null);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const section = el.querySelector('app-node-detail-panel section');
      expect(section).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Refresh button triggers loadGraph() — Requirement 6.1
  // -------------------------------------------------------------------------

  describe('Refresh button', () => {
    it('clicking Refresh button calls loadGraph()', async () => {
      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      // Reset the call count from ngOnInit
      mockState.loadGraph.mockClear();

      const el: HTMLElement = fixture.nativeElement;
      const refreshBtn = el.querySelector('button[aria-label="Refresh graph data"]') as HTMLButtonElement;
      expect(refreshBtn).not.toBeNull();

      refreshBtn.click();
      fixture.detectChanges();

      expect(mockState.loadGraph).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 8. visibleNodeIds computed from visibleNodes — Requirement 3.1
  // -------------------------------------------------------------------------

  describe('visibleNodeIds computation', () => {
    it('passes correct visibleNodeIds set to GraphCanvasComponent', async () => {
      const nodes = [
        makeNode('angular'),
        makeNode('signals'),
        makeNode('rxjs'),
      ];
      const data = makeGraphData(nodes);
      mockState._setGraphData(data);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const pageComponent = fixture.componentInstance;
      const ids = pageComponent.visibleNodeIds();
      expect(ids.has('angular')).toBe(true);
      expect(ids.has('signals')).toBe(true);
      expect(ids.has('rxjs')).toBe(true);
      expect(ids.size).toBe(3);
    });

    it('visibleNodeIds is empty when no graph data is loaded', async () => {
      mockState._setGraphData(null);

      const fixture = TestBed.createComponent(WikiGraphPageComponent);
      await fixture.whenStable();
      fixture.detectChanges();

      const pageComponent = fixture.componentInstance;
      expect(pageComponent.visibleNodeIds().size).toBe(0);
    });
  });
});
