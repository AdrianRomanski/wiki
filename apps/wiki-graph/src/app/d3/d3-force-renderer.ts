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

  private renderGeneration = 0;

  private selectedId: string | null = null;

  private mode: VisualizationMode = 'wiki';

  private progressStates: ReadonlyMap<string, ProgressState> = new Map();

  private activeFilters: ProgressState[] = [];

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

    const generation = ++this.renderGeneration;

    this.simulation?.stop();
    this.root.selectAll('*').remove();

    const width = this.svgElement.clientWidth || 800;
    const height = this.svgElement.clientHeight || 600;
    const graph: VisibleGraph = createVisibleGraph(data, visibleNodeIds);

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

    updateSimulationPositions(edges, nodes);

    computeSettledPositions(graph.nodes, graph.edges, width, height);

    animateToSettledPositions(edges, nodes, LAYOUT_TRANSITION_DURATION_MS).then(() => {

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

    updateSelection(this.root, this.selectedId, this.mode, this.progressStates);
    applyFilters(this.root, this.activeFilters, this.progressStates);
  }

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

  applyFilters(
    activeFilters: ProgressState[],
    progressStates: ReadonlyMap<string, ProgressState> = this.progressStates,
  ): void {
    this.activeFilters = activeFilters;
    this.progressStates = progressStates;
    applyFilters(this.root, this.activeFilters, this.progressStates);
  }

  destroy(): void {

    this.renderGeneration++;
    this.simulation?.stop();
    this.simulation = null;
    this.svg.on('.zoom', null);
    this.svg.on('click', null);
    this.root.selectAll('*').remove();
  }
}
