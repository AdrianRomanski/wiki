import * as d3 from 'd3';
import type { GraphNode, SimulationNode } from '../models/graph.models';
import { BASE_RADIUS, MAX_RADIUS } from './graph-style';
import type { EdgeSelection, ForceSimulation, NodeSelection, SimEdge } from './renderer.types';

export function nodeRadius(node: GraphNode): number {
  const connections = node.inDegree + node.outDegree;
  return Math.min(MAX_RADIUS, BASE_RADIUS + Math.sqrt(connections) * 2);
}

export function attachNodeDrag(
  nodes: NodeSelection,
  getSimulation: () => ForceSimulation | null,
): void {
  const drag = d3.drag<SVGGElement, SimulationNode>()
    .on('start', (event, node) => {
      if (!event.active) getSimulation()?.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on('drag', (event, node) => {
      node.fx = event.x;
      node.fy = event.y;
    })
    .on('end', (event, node) => {
      if (!event.active) getSimulation()?.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    });

  nodes.call(drag);
}

export function createSimulation(
  nodes: SimulationNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  onTick: () => void,
): ForceSimulation {
  return d3.forceSimulation<SimulationNode, SimEdge>(nodes)
    .force('link', d3.forceLink<SimulationNode, SimEdge>(edges)
      .id(node => node.id)
      .distance(80))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<SimulationNode>().radius(node => nodeRadius(node) + 4))
    .on('tick', onTick);
}

export function updateSimulationPositions(
  edges: EdgeSelection,
  nodes: NodeSelection,
): void {
  edges
    .attr('x1', edge => edge.source.x ?? 0)
    .attr('y1', edge => edge.source.y ?? 0)
    .attr('x2', edge => edge.target.x ?? 0)
    .attr('y2', edge => edge.target.y ?? 0);

  nodes.attr('transform', node => `translate(${node.x ?? 0},${node.y ?? 0})`);
}
