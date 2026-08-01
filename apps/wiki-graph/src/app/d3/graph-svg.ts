import * as d3 from 'd3';
import type { SimulationNode } from '../models/graph.models';
import { EDGE_COLOR, TYPE_COLORS } from './graph-style';
import { nodeRadius } from './force-simulation';
import type { EdgeSelection, NodeSelection, RootSelection, SimEdge, SvgSelection } from './renderer.types';

export function createZoom(root: RootSelection): d3.ZoomBehavior<SVGSVGElement, unknown> {
  return d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 8])
    .on('zoom', event => {
      root.attr('transform', event.transform.toString());
    });
}

export function attachSvgInteractions(
  svg: SvgSelection,
  svgElement: SVGSVGElement,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  onNodeClick: (id: string | null) => void,
): void {
  svg
    .call(zoom)
    .on('click', event => {
      if (event.target === svgElement || (event.target as Element).tagName === 'svg') {
        onNodeClick(null);
      }
    });
}

export function renderEdges(root: RootSelection, edges: SimEdge[]): EdgeSelection {
  return root.append('g')
    .attr('class', 'edges')
    .selectAll<SVGLineElement, SimEdge>('line')
    .data(edges)
    .join('line')
    .attr('class', 'edge')
    .attr('stroke', EDGE_COLOR)
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.6)
    .attr('marker-end', 'url(#arrow)');
}

export function renderArrowMarker(svg: SvgSelection): void {
  svg.select('defs').remove();
  svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 18)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', EDGE_COLOR);
}

export function renderNodes(
  root: RootSelection,
  nodes: SimulationNode[],
  onNodeClick: (id: string | null) => void,
): NodeSelection {
  const nodeSelection = root.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, SimulationNode>('g.node')
    .data(nodes, node => node.id)
    .join('g')
    .attr('class', 'node')
    .attr('role', 'button')
    .attr('tabindex', '0')
    .attr('aria-label', node => `${node.title} (${node.type})`)
    .style('cursor', 'pointer');

  nodeSelection.append('circle')
    .attr('r', node => nodeRadius(node))
    .attr('fill', node => node.isGhost ? 'none' : (TYPE_COLORS[node.type] ?? '#888'))
    .attr('stroke', node => node.isGhost ? (TYPE_COLORS[node.type] ?? '#888') : 'none')
    .attr('stroke-width', node => node.isGhost ? 2 : 0)
    .attr('stroke-dasharray', node => node.isGhost ? '4 2' : 'none')
    .attr('opacity', node => node.isGhost ? 0.4 : 1);

  nodeSelection.append('text')
    .attr('dy', node => nodeRadius(node) + 12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#a6adc8')
    .attr('pointer-events', 'none')
    .text(node => node.title.length > 20 ? node.title.slice(0, 18) + '…' : node.title);

  nodeSelection
    .on('click', (event: MouseEvent, node: SimulationNode) => {
      event.stopPropagation();
      onNodeClick(node.id);
    })
    .on('keydown', (event: KeyboardEvent, node: SimulationNode) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onNodeClick(node.id);
      }
    });

  return nodeSelection;
}
