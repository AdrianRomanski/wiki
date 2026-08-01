import type { SimulationNode } from '../models/graph.models';
import { DIM_OPACITY, EDGE_COLOR, TYPE_COLORS } from './graph-style';
import type { RootSelection, SimEdge } from './renderer.types';

export function resetSelection(root: RootSelection): void {
  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .style('opacity', null);
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .style('opacity', null)
    .attr('stroke', EDGE_COLOR);
  root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
    .attr('stroke', node => node.isGhost ? (TYPE_COLORS[node.type] ?? '#888') : 'none')
    .attr('stroke-width', node => node.isGhost ? 2 : 0);
}

export function updateSelectedGraph(root: RootSelection, selectedId: string): void {
  const connectedIds = new Set<string>([selectedId]);
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .each(edge => {
      if (edge.source.id === selectedId) connectedIds.add(edge.target.id);
      if (edge.target.id === selectedId) connectedIds.add(edge.source.id);
    });

  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .style('opacity', node => connectedIds.has(node.id) ? null : String(DIM_OPACITY));
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .style('opacity', edge =>
      edge.source.id === selectedId || edge.target.id === selectedId
        ? null
        : String(DIM_OPACITY),
    );
  root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
    .attr('stroke', node => node.id === selectedId
      ? '#f5c2e7'
      : (node.isGhost ? (TYPE_COLORS[node.type] ?? '#888') : 'none'))
    .attr('stroke-width', node => node.id === selectedId ? 3 : (node.isGhost ? 2 : 0));
}

export function updateSelection(root: RootSelection, selectedId: string | null): void {
  if (selectedId) {
    updateSelectedGraph(root, selectedId);
    return;
  }

  resetSelection(root);
}

export function updateVisibility(root: RootSelection, visibleNodeIds: Set<string>): void {
  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .style('display', node => visibleNodeIds.has(node.id) ? null : 'none');
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .style('display', edge =>
      visibleNodeIds.has(edge.source.id) && visibleNodeIds.has(edge.target.id)
        ? null
        : 'none',
    );
}
