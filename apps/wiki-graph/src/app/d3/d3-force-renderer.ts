import * as d3 from 'd3';
import type { GraphData, SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import type { VisualizationMode } from '../models/progress.constants';
import { LAYOUT_TRANSITION_DURATION_MS } from './graph-style';
import { createVisibleGraph } from './graph-data';
import {
  animateToSettledPositions,
  attachNodeDrag,
  computeSettledPositions,
  createSimulation,
  updateSimulationPositions,
} from './force-simulation';
import {
  attachSvgInteractions,
  createZoom,
  renderArrowMarker,
  renderEdges,
  renderNodes,
} from './graph-svg';
import { applyFilters, updateNodeStyles, updateSelection, updateVisibility } from './graph-state';
import type {
  ForceSimulation,
  NodePosition,
  RootSelection,
  SimEdge,
  SvgSelection,
} from './renderer.types';

type VisibleGraph = { nodes: SimulationNode[]; edges: SimEdge[] };

export class D3ForceRenderer {
  private readonly svg: SvgSelection;
  private readonly root: RootSelection;
  private readonly zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private simulation: ForceSimulation | null = null;
  /**
   * Incremented on every `render()`/`destroy()` call and captured by the
   * in-flight layout transition, so a stale transition from a superseded
   * or destroyed render can't start a live simulation after the fact.
   */
  private renderGeneration = 0;

  /** Currently selected node, re-applied after node styles are refreshed. */
  private selectedId: string | null = null;
  /** Active visualization mode, used to color nodes on (re)render and style updates. */
  private mode: VisualizationMode = 'wiki';
  /** Progress state lookup, used to color nodes when `mode` is 'progress'. */
  private progressStates: ReadonlyMap<string, ProgressState> = new Map();
  /** Progress states currently active as filters, re-applied after (re)render. */
  private activeFilters: ProgressState[] = [];
  /**
   * Nodes from the most recently completed render, kept around solely to
   * snapshot their on-screen `x`/`y` positions as the starting point for the
   * next layout transition (Requirement 4.4). Empty before the first render.
   */
  private lastNodes: SimulationNode[] = [];

  constructor(
    private readonly svgElement: SVGSVGElement,
    private readonly onNodeClick: (id: string | null) => void,
    private readonly onAssessmentRequest: (id: string) => void = () => undefined,
  ) {
    this.svg = d3.select(svgElement);
    this.root = this.svg.append('g').attr('class', 'graph-root');
    this.zoom = createZoom(this.root);
    attachSvgInteractions(this.svg, svgElement, this.zoom, onNodeClick);
  }

  render(data: GraphData, visibleNodeIds: Set<string>): void {
    // Captured so a stale, superseded (or post-destroy) animation can't
    // start a live simulation after the fact - see `renderGeneration` doc.
    const generation = ++this.renderGeneration;

    this.simulation?.stop();
    this.root.selectAll('*').remove();

    const width = this.svgElement.clientWidth || 800;
    const height = this.svgElement.clientHeight || 600;
    const graph: VisibleGraph = createVisibleGraph(data, visibleNodeIds);

    // Carry forward on-screen positions from the previous render so
    // continuing nodes animate from where they currently are rather than
    // jumping to a default starting position (Requirement 4.4).
    const previousPositions = this.snapshotPositions(this.lastNodes);
    for (const node of graph.nodes) {
      const previous = previousPositions.get(node.id);
      if (previous) {
        node.x = previous.x;
        node.y = previous.y;
      }
    }

    const edges = renderEdges(this.root, graph.edges);
    renderArrowMarker(this.svg);
    const nodes = renderNodes(
      this.root,
      graph.nodes,
      this.onNodeClick,
      this.onAssessmentRequest,
      this.mode,
      this.progressStates,
    );

    attachNodeDrag(nodes, () => this.simulation);

    // Draw nodes/edges at their starting (previous or default) positions...
    updateSimulationPositions(edges, nodes);
    // ...then compute the target layout positions (mutates node.x/y only,
    // no DOM writes) and animate from the starting position to it over
    // LAYOUT_TRANSITION_DURATION_MS (Requirement 4.4). The viewport's
    // zoom/pan transform lives on `this.root` itself, which is never reset
    // here, so it is naturally preserved across the transition.
    computeSettledPositions(graph.nodes, graph.edges, width, height);

    animateToSettledPositions(edges, nodes, LAYOUT_TRANSITION_DURATION_MS).then(() => {
      // A newer render (or destroy()) superseded this transition; don't
      // start a simulation for a layout that's no longer current.
      if (generation !== this.renderGeneration) return;

      this.simulation = createSimulation(
        graph.nodes,
        graph.edges,
        width,
        height,
        () => updateSimulationPositions(edges, nodes),
      );
    });

    this.lastNodes = graph.nodes;

    // Re-apply the current selection ring and progress filters on the freshly rendered nodes.
    updateSelection(this.root, this.selectedId, this.mode, this.progressStates);
    applyFilters(this.root, this.activeFilters, this.progressStates);
  }

  /** Build an id -> {x, y} lookup from a node list, skipping nodes with no known position yet. */
  private snapshotPositions(nodes: SimulationNode[]): Map<string, NodePosition> {
    const positions = new Map<string, NodePosition>();
    for (const node of nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        positions.set(node.id, { x: node.x, y: node.y });
      }
    }
    return positions;
  }

  updateSelection(selectedId: string | null): void {
    this.selectedId = selectedId;
    updateSelection(this.root, selectedId, this.mode, this.progressStates);
  }

  /**
   * Recolor all rendered nodes for the given visualization mode and progress
   * state lookup, then reapply the current selection highlighting on top.
   * @param mode - 'wiki' colors nodes by type, 'progress' colors by learning state
   * @param progressStates - Lookup of concept ID to current progress state
   */
  updateNodeStyles(mode: VisualizationMode, progressStates: ReadonlyMap<string, ProgressState>): void {
    this.mode = mode;
    this.progressStates = progressStates;
    updateNodeStyles(this.root, mode, progressStates);
    updateSelection(this.root, this.selectedId, this.mode, this.progressStates);
    applyFilters(this.root, this.activeFilters, this.progressStates);
  }

  updateVisibility(visibleNodeIds: Set<string>): void {
    updateVisibility(this.root, visibleNodeIds);
  }

  /**
   * Show/hide rendered nodes and edges based on active progress-state filters.
   * Edges are hidden whenever either endpoint is filtered out. Passing an
   * empty array shows all nodes.
   * @param activeFilters - Progress states currently enabled as filters
   * @param progressStates - Lookup of concept ID to current progress state
   */
  applyFilters(
    activeFilters: ProgressState[],
    progressStates: ReadonlyMap<string, ProgressState> = this.progressStates,
  ): void {
    this.activeFilters = activeFilters;
    this.progressStates = progressStates;
    applyFilters(this.root, this.activeFilters, this.progressStates);
  }

  destroy(): void {
    // Invalidate any in-flight layout transition so it can't start a
    // simulation after this renderer has been torn down.
    this.renderGeneration++;
    this.simulation?.stop();
    this.simulation = null;
    this.svg.on('.zoom', null);
    this.svg.on('click', null);
    this.root.selectAll('*').remove();
  }
}
