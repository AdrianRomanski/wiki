import * as d3 from 'd3';
import type { GraphData, GraphNode, SimulationNode } from '../models/graph.models';

/** Internal edge type used by the D3 simulation — uses source/target node references. */
interface SimEdge extends d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
}

/** Fill colors per node type — Requirement 2.3 */
const TYPE_COLORS: Record<string, string> = {
  entity: '#F5A623',  // warm amber
  concept: '#00BCD4', // vivid cyan
  source: '#50C878',  // medium green (unchanged)
};

const BASE_RADIUS = 6;
const MAX_RADIUS = 24;
const DIM_OPACITY = 0.15;

/**
 * Plain TypeScript class that owns all D3 logic.
 * Angular components never manipulate SVG nodes directly.
 * Requirements: 2.1–2.9, 3.1, 3.3
 */
export class D3ForceRenderer {
  private readonly svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private readonly root: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<SimulationNode, SimEdge> | null = null;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;

  constructor(
    private readonly svgElement: SVGSVGElement,
    private readonly onNodeClick: (id: string | null) => void
  ) {
    this.svg = d3.select(svgElement);

    // Root group — all graph elements live here so zoom/pan transforms apply
    this.root = this.svg.append('g').attr('class', 'graph-root');

    // Zoom & pan — Requirements 2.7, 2.8
    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        this.root.attr('transform', event.transform.toString());
      });

    this.svg
      .call(this.zoom)
      // Background click deselects — Requirement 3.4
      .on('click', (event: MouseEvent) => {
        if (event.target === svgElement || (event.target as Element).tagName === 'svg') {
          this.onNodeClick(null);
        }
      });
  }

  /**
   * (Re)renders the graph with the given data and visibility set.
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.9
   */
  render(data: GraphData, visibleNodeIds: Set<string>): void {
    // Stop any running simulation
    this.simulation?.stop();

    // Clear previous render
    this.root.selectAll('*').remove();

    const width = this.svgElement.clientWidth || 800;
    const height = this.svgElement.clientHeight || 600;

    const allNodes = Array.from(data.nodes.values()) as SimulationNode[];
    const visibleNodes = allNodes.filter(n => visibleNodeIds.size === 0 || visibleNodeIds.has(n.id));

    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = data.edges.filter(
      e => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId)
    );

    // Build edge objects D3 can use (source/target as node references)
    const nodeById = new Map(visibleNodes.map(n => [n.id, n]));
    const simEdges: SimEdge[] = visibleEdges
      .map(e => ({ source: nodeById.get(e.sourceId)!, target: nodeById.get(e.targetId)! }))
      .filter((e): e is SimEdge => !!e.source && !!e.target);

    // Edges layer
    const edgeGroup = this.root.append('g').attr('class', 'edges');
    const edgeSel = edgeGroup
      .selectAll<SVGLineElement, SimEdge>('line')
      .data(simEdges)
      .join('line')
      .attr('class', 'edge')
      .attr('stroke', '#585b70')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow)');

    // Arrow marker
    this.svg.select('defs').remove();
    this.svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#585b70');

    // Nodes layer
    const nodeGroup = this.root.append('g').attr('class', 'nodes');
    const nodeSel = nodeGroup
      .selectAll<SVGGElement, SimulationNode>('g.node')
      .data(visibleNodes, d => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('role', 'button')
      .attr('tabindex', '0')
      .attr('aria-label', d => `${d.title} (${d.type})`)
      .style('cursor', 'pointer');

    // Circle — Requirement 2.3, 2.4, 2.9
    nodeSel.append('circle')
      .attr('r', d => this.nodeRadius(d))
      .attr('fill', d => d.isGhost ? 'none' : (TYPE_COLORS[d.type] ?? '#888'))
      .attr('stroke', d => d.isGhost ? (TYPE_COLORS[d.type] ?? '#888') : 'none')
      .attr('stroke-width', d => d.isGhost ? 2 : 0)
      .attr('stroke-dasharray', d => d.isGhost ? '4 2' : 'none')
      .attr('opacity', d => d.isGhost ? 0.4 : 1);

    // Label — Requirement 2.5
    nodeSel.append('text')
      .attr('dy', d => this.nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#a6adc8')
      .attr('pointer-events', 'none')
      .text(d => d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title);

    // Click handler — Requirement 3.1
    nodeSel.on('click', (event: MouseEvent, d: SimulationNode) => {
      event.stopPropagation();
      this.onNodeClick(d.id);
    });

    // Keyboard activation
    nodeSel.on('keydown', (event: KeyboardEvent, d: SimulationNode) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onNodeClick(d.id);
      }
    });

    // Drag — Requirement 2.6
    const drag = d3.drag<SVGGElement, SimulationNode>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSel.call(drag);

    // Force simulation — Requirement 2.1
    this.simulation = d3.forceSimulation<SimulationNode, SimEdge>(visibleNodes)
      .force('link', d3.forceLink<SimulationNode, SimEdge>(simEdges)
        .id(d => d.id)
        .distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimulationNode>().radius(d => this.nodeRadius(d) + 4))
      .on('tick', () => {
        edgeSel
          .attr('x1', d => d.source.x ?? 0)
          .attr('y1', d => d.source.y ?? 0)
          .attr('x2', d => d.target.x ?? 0)
          .attr('y2', d => d.target.y ?? 0);

        nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });
  }

  /**
   * Highlights the selected node and dims unconnected nodes/edges.
   * Requirement 3.1, 3.3
   */
  updateSelection(selectedId: string | null): void {
    if (!selectedId) {
      // Restore default state
      this.root.selectAll<SVGGElement, SimulationNode>('g.node')
        .style('opacity', null);
      this.root.selectAll<SVGLineElement, SimEdge>('line.edge')
        .style('opacity', null)
        .attr('stroke', '#585b70');
      this.root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
        .attr('stroke', d => d.isGhost ? (TYPE_COLORS[d.type] ?? '#888') : 'none')
        .attr('stroke-width', d => d.isGhost ? 2 : 0);
      return;
    }

    // Collect connected node ids
    const connectedIds = new Set<string>([selectedId]);
    this.root.selectAll<SVGLineElement, SimEdge>('line.edge')
      .each(d => {
        if (d.source.id === selectedId) connectedIds.add(d.target.id);
        if (d.target.id === selectedId) connectedIds.add(d.source.id);
      });

    // Dim unconnected nodes
    this.root.selectAll<SVGGElement, SimulationNode>('g.node')
      .style('opacity', d => connectedIds.has(d.id) ? null : String(DIM_OPACITY));

    // Dim unconnected edges
    this.root.selectAll<SVGLineElement, SimEdge>('line.edge')
      .style('opacity', d =>
        d.source.id === selectedId || d.target.id === selectedId ? null : String(DIM_OPACITY)
      );

    // Selection ring on selected node
    this.root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
      .attr('stroke', d => d.id === selectedId ? '#f5c2e7' : (d.isGhost ? (TYPE_COLORS[d.type] ?? '#888') : 'none'))
      .attr('stroke-width', d => d.id === selectedId ? 3 : (d.isGhost ? 2 : 0));
  }

  /**
   * Shows/hides nodes and their connected edges based on the visibility set.
   * Requirement 4.2
   */
  updateVisibility(visibleNodeIds: Set<string>): void {
    this.root.selectAll<SVGGElement, SimulationNode>('g.node')
      .style('display', d => visibleNodeIds.has(d.id) ? null : 'none');

    this.root.selectAll<SVGLineElement, SimEdge>('line.edge')
      .style('display', d =>
        visibleNodeIds.has(d.source.id) && visibleNodeIds.has(d.target.id) ? null : 'none'
      );
  }

  /** Stops simulation and removes all event listeners. */
  destroy(): void {
    this.simulation?.stop();
    this.simulation = null;
    this.svg.on('.zoom', null);
    this.svg.on('click', null);
    this.root.selectAll('*').remove();
  }

  private nodeRadius(node: GraphNode): number {
    const connections = node.inDegree + node.outDegree;
    return Math.min(MAX_RADIUS, BASE_RADIUS + Math.sqrt(connections) * 2);
  }
}
