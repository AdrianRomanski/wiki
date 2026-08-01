import * as d3 from 'd3';
import type { GraphData } from '../models/graph.models';
import { createVisibleGraph } from './graph-data';
import { attachNodeDrag, createSimulation, updateSimulationPositions } from './force-simulation';
import {
  attachSvgInteractions,
  createZoom,
  renderArrowMarker,
  renderEdges,
  renderNodes,
} from './graph-svg';
import { updateSelection, updateVisibility } from './graph-state';
import type { ForceSimulation, RootSelection, SvgSelection } from './renderer.types';

export class D3ForceRenderer {
  private readonly svg: SvgSelection;
  private readonly root: RootSelection;
  private readonly zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private simulation: ForceSimulation | null = null;

  constructor(
    private readonly svgElement: SVGSVGElement,
    private readonly onNodeClick: (id: string | null) => void,
  ) {
    this.svg = d3.select(svgElement);
    this.root = this.svg.append('g').attr('class', 'graph-root');
    this.zoom = createZoom(this.root);
    attachSvgInteractions(this.svg, svgElement, this.zoom, onNodeClick);
  }

  render(data: GraphData, visibleNodeIds: Set<string>): void {
    this.simulation?.stop();
    this.root.selectAll('*').remove();

    const width = this.svgElement.clientWidth || 800;
    const height = this.svgElement.clientHeight || 600;
    const graph = createVisibleGraph(data, visibleNodeIds);
    const edges = renderEdges(this.root, graph.edges);
    renderArrowMarker(this.svg);
    const nodes = renderNodes(this.root, graph.nodes, this.onNodeClick);

    attachNodeDrag(nodes, () => this.simulation);
    this.simulation = createSimulation(
      graph.nodes,
      graph.edges,
      width,
      height,
      () => updateSimulationPositions(edges, nodes),
    );
  }

  updateSelection(selectedId: string | null): void {
    updateSelection(this.root, selectedId);
  }

  updateVisibility(visibleNodeIds: Set<string>): void {
    updateVisibility(this.root, visibleNodeIds);
  }

  destroy(): void {
    this.simulation?.stop();
    this.simulation = null;
    this.svg.on('.zoom', null);
    this.svg.on('click', null);
    this.root.selectAll('*').remove();
  }
}
