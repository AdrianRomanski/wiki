import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import type { GraphData, GraphDataWithProgress, GraphNode, NodeType } from '../models/graph.models';
import type { ProgressState, ProgressStats } from '../models/progress.models';
import {
  DEFAULT_NODE_SIZE,
  PROGRESS_COLORS,
  VisualizationMode,
  WIKI_NODE_COLORS
} from '../models/progress.constants';
import { ProgressStateService } from './progress-state.service';
import { WikiParserService } from './wiki-parser.service';

/** Maximum node size (px) when scaling by assessment count in progress mode. */
const MAX_PROGRESS_NODE_SIZE = 20;
/** Additional size (px) added per assessment, capped at MAX_PROGRESS_NODE_SIZE. */
const SIZE_PER_ASSESSMENT = 2;

@Injectable({ providedIn: 'root' })
export class GraphStateService {
  private readonly wikiParser = inject(WikiParserService);
  private readonly progressStateService = inject(ProgressStateService);

  private readonly _graphData = signal<GraphData | null>(null);
  private readonly _selectedNode = signal<GraphNode | null>(null);
  private readonly _activeTypeFilters = signal<Set<NodeType>>(
    new Set<NodeType>(['entity', 'concept', 'source'])
  );
  private readonly _searchQuery = signal<string>('');
  private readonly _activeTagFilter = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Progress visualization state
  private readonly _visualizationMode = signal<VisualizationMode>('wiki');
  private readonly _activeProgressFilters = signal<Set<ProgressState>>(new Set<ProgressState>());
  /** Concept ID for which a Knowledge_Assessment was most recently requested, or null if none pending. */
  private readonly _assessmentRequestedConceptId = signal<string | null>(null);

  readonly graphData: Signal<GraphData | null> = this._graphData.asReadonly();
  readonly selectedNode: Signal<GraphNode | null> = this._selectedNode.asReadonly();
  readonly activeTypeFilters: Signal<Set<NodeType>> = this._activeTypeFilters.asReadonly();
  readonly searchQuery: Signal<string> = this._searchQuery.asReadonly();
  readonly activeTagFilter: Signal<string | null> = this._activeTagFilter.asReadonly();
  readonly isLoading: Signal<boolean> = this._isLoading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();
  
  // Progress visualization public signals
  readonly visualizationMode: Signal<VisualizationMode> = this._visualizationMode.asReadonly();
  readonly activeProgressFilters: Signal<Set<ProgressState>> = this._activeProgressFilters.asReadonly();
  /**
   * Concept ID for which a Knowledge_Assessment was most recently requested
   * (e.g. via Enter key on a focused node), or null if none pending. Consumed
   * by the component responsible for opening AssessmentDialogComponent.
   */
  readonly assessmentRequestedConceptId: Signal<string | null> =
    this._assessmentRequestedConceptId.asReadonly();

  /**
   * Reactive lookup of concept ID to current progress state, sourced from
   * ProgressStateService. Recomputes whenever progress changes (e.g. after
   * an assessment updates state via ProgressStateService.setProgress()), so
   * consumers such as GraphVisualizerComponent re-render automatically.
   */
  readonly progressStates: Signal<ReadonlyMap<string, ProgressState>> = computed(() =>
    this.progressStateService.getAllProgress()
  );

  /** Active progress filters as an array, for components expecting `ProgressState[]`. */
  readonly activeProgressFiltersList: Signal<ProgressState[]> = computed(() =>
    Array.from(this._activeProgressFilters())
  );

  /**
   * Aggregate progress statistics (counts per state and percent complete),
   * derived from ProgressStateService.getAllProgress(). Recomputes whenever
   * progress changes, for consumption by ProgressDashboardUiComponent.
   *
   * Requirements: 7.1
   */
  readonly progressStats: Signal<ProgressStats> = computed(() => {
    const allProgress = this.progressStateService.getAllProgress();

    let notStarted = 0;
    let inProgress = 0;
    let understood = 0;
    let mastered = 0;

    for (const state of allProgress.values()) {
      switch (state) {
        case 'Not_Started':
          notStarted++;
          break;
        case 'In_Progress':
          inProgress++;
          break;
        case 'Understood':
          understood++;
          break;
        case 'Mastered':
          mastered++;
          break;
      }
    }

    const total = allProgress.size;
    const percentComplete = total === 0 ? 0 : Math.round(((understood + mastered) / total) * 100);

    return { total, notStarted, inProgress, understood, mastered, percentComplete };
  });

  /**
   * Progress state and assessment count for the currently selected node, or
   * null when no node is selected. Reactively updates when progress changes.
   */
  readonly selectedNodeProgress: Signal<{ state: ProgressState; assessmentCount: number } | null> =
    computed(() => {
      const node = this._selectedNode();
      if (!node) return null;
      return {
        state: this.progressStateService.getProgress(node.id),
        assessmentCount: this.progressStateService.getAssessmentCount(node.id),
      };
    });

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

          // Correlate wiki concept IDs with progress data: registers the
          // set of real (non-ghost) concept IDs currently in the wiki graph
          // so ProgressStateService can exclude progress files for concepts
          // no longer present (orphaned) from the active progress map and
          // index rebuilds, without deleting them from disk.
          const realConceptIds = Array.from(data.nodes.values())
            .filter((node) => !node.isGhost)
            .map((node) => node.id);
          this.progressStateService.setKnownConceptIds(realConceptIds);
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

  /**
   * Record that the learner requested a Knowledge_Assessment for the given
   * concept (e.g. via Enter key on a focused node in the graph renderer).
   * The requested concept ID is exposed via `assessmentRequestedConceptId`
   * for the component that opens AssessmentDialogComponent to consume.
   * @param conceptId - The concept ID the assessment was requested for
   */
  requestAssessment(conceptId: string): void {
    this._assessmentRequestedConceptId.set(conceptId);
  }

  /**
   * Clear the pending assessment request, e.g. after the dialog has been
   * opened or the request has been handled/cancelled.
   */
  clearAssessmentRequest(): void {
    this._assessmentRequestedConceptId.set(null);
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

  /**
   * Switch between wiki structure and progress-focused visualization modes.
   * @param mode - The visualization mode ('wiki' | 'progress')
   */
  setVisualizationMode(mode: VisualizationMode): void {
    this._visualizationMode.set(mode);
  }

  /**
   * Filter nodes by progress state when in progress mode.
   * Multiple states can be active simultaneously (OR logic).
   * When all filters are disabled, all nodes are shown.
   * @param states - Array of progress states to filter by
   */
  filterByProgress(states: ProgressState[]): void {
    this._activeProgressFilters.set(new Set(states));
  }

  /**
   * Graph data merged with the current progress state for every node,
   * sourced from ProgressStateService. Nodes without recorded progress
   * default to 'Not_Started'.
   */
  readonly graphDataWithProgress: Signal<GraphDataWithProgress | null> = computed(() => {
    const data = this._graphData();
    if (!data) return null;
    return this.applyProgressData(data);
  });

  /**
   * Merge progress states into graph data, producing a GraphDataWithProgress
   * object that pairs each concept ID with its current ProgressState.
   * Concepts without a recorded progress entry default to 'Not_Started'.
   * @param graphData - The wiki graph data to enrich with progress
   * @returns Graph data augmented with a progressStates lookup map
   */
  applyProgressData(graphData: GraphData): GraphDataWithProgress {
    const progressStates = new Map<string, ProgressState>();
    const allProgress = this.progressStateService.getAllProgress();

    for (const node of graphData.nodes.values()) {
      progressStates.set(node.id, allProgress.get(node.id) ?? 'Not_Started');
    }

    return {
      ...graphData,
      progressStates
    };
  }

  /**
   * Determine the display color for a node based on the current visualization mode.
   * In 'wiki' mode, color reflects the node's type (entity/concept/source).
   * In 'progress' mode, color reflects the node's learning progress state.
   * @param node - The graph node to color
   * @param mode - The active visualization mode
   * @returns Hex color string for the node
   */
  getNodeColor(node: GraphNode, mode: VisualizationMode): string {
    if (mode === 'progress') {
      const state = this.progressStateService.getProgress(node.id);
      return PROGRESS_COLORS[state];
    }
    return WIKI_NODE_COLORS[node.type];
  }

  /**
   * Determine the display size (radius in pixels) for a node.
   * In 'wiki' mode, all nodes use the default size.
   * In 'progress' mode, nodes are optionally sized larger based on how many
   * times the concept has been assessed, capped at MAX_PROGRESS_NODE_SIZE.
   * @param node - The graph node to size
   * @param mode - The active visualization mode
   * @param sizeByAssessment - Whether to scale size by assessment count (progress mode only)
   * @returns Node radius in pixels
   */
  getNodeSize(node: GraphNode, mode: VisualizationMode, sizeByAssessment = false): number {
    if (mode === 'progress' && sizeByAssessment) {
      const assessmentCount = this.progressStateService.getAssessmentCount(node.id);
      return Math.min(
        DEFAULT_NODE_SIZE + assessmentCount * SIZE_PER_ASSESSMENT,
        MAX_PROGRESS_NODE_SIZE
      );
    }
    return DEFAULT_NODE_SIZE;
  }
}
