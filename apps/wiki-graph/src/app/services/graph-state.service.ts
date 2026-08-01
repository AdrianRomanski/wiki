import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import type { GraphData, GraphNode, NodeType } from '../models/graph.models';
import { WikiParserService } from './wiki-parser.service';

@Injectable({ providedIn: 'root' })
export class GraphStateService {
  private readonly wikiParser = inject(WikiParserService);

  private readonly _graphData = signal<GraphData | null>(null);
  private readonly _selectedNode = signal<GraphNode | null>(null);
  private readonly _activeTypeFilters = signal<Set<NodeType>>(
    new Set<NodeType>(['entity', 'concept', 'source'])
  );
  private readonly _searchQuery = signal<string>('');
  private readonly _activeTagFilter = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly graphData: Signal<GraphData | null> = this._graphData.asReadonly();
  readonly selectedNode: Signal<GraphNode | null> = this._selectedNode.asReadonly();
  readonly activeTypeFilters: Signal<Set<NodeType>> = this._activeTypeFilters.asReadonly();
  readonly searchQuery: Signal<string> = this._searchQuery.asReadonly();
  readonly activeTagFilter: Signal<string | null> = this._activeTagFilter.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  readonly visibleNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    const filters = this._activeTypeFilters();
    const query = this._searchQuery().toLowerCase().trim();
    const tagFilter = this._activeTagFilter();

    const visibleRealIds = new Set<string>();
    for (const node of data.nodes.values()) {
      if (node.isGhost) continue;
      if (!filters.has(node.type)) continue;
      if (query && !node.title.toLowerCase().includes(query)) continue;
      if (tagFilter && !node.tags.includes(tagFilter)) continue;
      visibleRealIds.add(node.id);
    }

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

  readonly hubNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    return Array.from(data.nodes.values())
      .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree))
      .slice(0, 5);
  });

  readonly orphanNodes: Signal<GraphNode[]> = computed(() => {
    const data = this._graphData();
    if (!data) return [];

    return Array.from(data.nodes.values()).filter(
      (node) => node.inDegree === 0 && node.outDegree === 0
    );
  });

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

  loadGraph(): void {
    this.loadTrigger$.next();
  }

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

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setTagFilter(tag: string | null): void {
    this._activeTagFilter.set(tag);
  }
}
