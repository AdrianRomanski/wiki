import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import type { GraphData, GraphNode, NodeType } from '../models/graph.models';
import { WikiParserService } from './wiki-parser.service';

/**
 * Holds all reactive state for the Wiki Connections Visualizer.
 * Components read signals; user actions call methods.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 5.1, 5.2, 6.1, 6.2
 */
@Injectable({ providedIn: 'root' })
export class GraphStateService {
  private readonly wikiParser = inject(WikiParserService);

  // ---------------------------------------------------------------------------
  // Private writable signals
  // ---------------------------------------------------------------------------

  private readonly _graphData = signal<GraphData | null>(null);
  private readonly _selectedNode = signal<GraphNode | null>(null);
  private readonly _activeTypeFilters = signal<Set<NodeType>>(
    new Set<NodeType>(['entity', 'concept', 'source'])
  );
  private readonly _searchQuery = signal<string>('');
  private readonly _activeTagFilter = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ---------------------------------------------------------------------------
  // Public read-only signals
  // ---------------------------------------------------------------------------

  /** The full parsed graph data, or null before the first load. */
  readonly graphData: Signal<GraphData | null> = this._graphData.asReadonly();

  /** The currently selected node, or null when nothing is selected. */
  readonly selectedNode: Signal<GraphNode | null> = this._selectedNode.asReadonly();

  /** The set of node types currently visible. All three types are active by default. */
  readonly activeTypeFilters: Signal<Set<NodeType>> = this._activeTypeFilters.asReadonly();

  /** The current search query string (empty string means no filter). */
  readonly searchQuery: Signal<string> = this._searchQuery.asReadonly();

  /** The currently active tag filter, or null when no tag is selected. */
  readonly activeTagFilter: Signal<string | null> = this._activeTagFilter.asReadonly();

  /** True while a graph load is in progress. */
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();

  /** The last error message, or null when there is no error. */
  readonly error: Signal<string | null> = this._error.asReadonly();

  // ---------------------------------------------------------------------------
  // Derived signals
  // ---------------------------------------------------------------------------

  /**
   * Nodes visible after applying type filters, search query, and tag filter.
   * Requirement 4.1, 4.2, 4.3, 4.4, 4.6, 4.7
   */
  readonly visibleNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    const filters = this._activeTypeFilters();
    const query = this._searchQuery().toLowerCase().trim();
    const tagFilter = this._activeTagFilter();

    // First pass: collect ids of all visible real (non-ghost) nodes
    const visibleRealIds = new Set<string>();
    for (const node of data.nodes.values()) {
      if (node.isGhost) continue;
      if (!filters.has(node.type)) continue;
      if (query && !node.title.toLowerCase().includes(query)) continue;
      if (tagFilter && !node.tags.includes(tagFilter)) continue;
      visibleRealIds.add(node.id);
    }

    // Build a set of ghost ids that have at least one edge to/from a visible real node
    const visibleGhostIds = new Set<string>();
    for (const edge of data.edges) {
      if (visibleRealIds.has(edge.sourceId)) {
        const target = data.nodes.get(edge.targetId);
        if (target?.isGhost) visibleGhostIds.add(edge.targetId);
      }
      if (visibleRealIds.has(edge.targetId)) {
        const source = data.nodes.get(edge.sourceId);
        if (source?.isGhost) visibleGhostIds.add(edge.sourceId);
      }
    }

    // Second pass: collect real nodes + only connected ghost nodes
    const result: GraphNode[] = [];
    for (const node of data.nodes.values()) {
      if (node.isGhost) {
        if (visibleGhostIds.has(node.id)) result.push(node);
      } else {
        if (visibleRealIds.has(node.id)) result.push(node);
      }
    }
    return result;
  });

  /**
   * Top 5 nodes sorted by total connection count (inDegree + outDegree) descending.
   * Requirement 5.2
   */
  readonly hubNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    return Array.from(data.nodes.values())
      .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree))
      .slice(0, 5);
  });

  /**
   * Nodes with zero incoming and zero outgoing edges.
   * Requirement 5.1
   */
  readonly orphanNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    return Array.from(data.nodes.values()).filter(
      (node) => node.inDegree === 0 && node.outDegree === 0
    );
  });

  // ---------------------------------------------------------------------------
  // RxJS load trigger — uses switchMap so a refresh cancels in-flight requests
  // Requirement 6.2
  // ---------------------------------------------------------------------------

  private readonly loadTrigger$ = new Subject<void>();

  constructor() {
    this.loadTrigger$
      .pipe(
        switchMap(() => {
          this._isLoading.set(true);
          this._error.set(null);
          return this.wikiParser.loadGraph();
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (data) => {
          this._graphData.set(data);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'An unknown error occurred while loading the graph.';
          this._error.set(message);
          this._isLoading.set(false);
        },
      });
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Triggers a (re)load of the graph data from WikiParserService.
   * Any in-flight request is cancelled via switchMap.
   * Requirement 6.1, 6.2
   */
  loadGraph(): void {
    this.loadTrigger$.next();
  }

  /**
   * Selects a node by id, or clears the selection when nodeId is null.
   * Requirement 3.1, 3.4
   */
  selectNode(nodeId: string | null): void {
    if (nodeId === null) {
      this._selectedNode.set(null);
      return;
    }
    const data = this._graphData();
    if (!data) {
      this._selectedNode.set(null);
      return;
    }
    const node = data.nodes.get(nodeId) ?? null;
    this._selectedNode.set(node);
  }

  /**
   * Adds or removes a node type from the active type filters.
   * Requirement 4.1, 4.2
   */
  setTypeFilter(type: NodeType, enabled: boolean): void {
    const current = this._activeTypeFilters();
    const next = new Set(current);
    if (enabled) {
      next.add(type);
    } else {
      next.delete(type);
    }
    this._activeTypeFilters.set(next);
  }

  /**
   * Updates the search query used to filter visible nodes by title.
   * Requirement 4.3, 4.4
   */
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  /**
   * Sets the active tag filter, or clears it when tag is null.
   * Requirement 4.6, 4.7
   */
  setTagFilter(tag: string | null): void {
    this._activeTagFilter.set(tag);
  }
}
