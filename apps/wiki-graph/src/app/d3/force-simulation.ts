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

const LAYOUT_VERTICAL_MARGIN_RATIO = 0.1;

const PREREQUISITE_FORCE_STRENGTH = 0.3;

export function prerequisiteTargetY(inDegree: number, maxInDegree: number, height: number): number {
  const margin = height * LAYOUT_VERTICAL_MARGIN_RATIO;
  const usableHeight = height - margin * 2;

  if (maxInDegree <= 0) return margin + usableHeight / 2;

  const clampedInDegree = Math.min(Math.max(inDegree, 0), maxInDegree);
  const ratio = clampedInDegree / maxInDegree;
  return margin + ratio * usableHeight;
}

function maxNodeInDegree(nodes: SimulationNode[]): number {
  return nodes.reduce((max, node) => Math.max(max, node.inDegree), 0);
}

function configureForces(
  simulation: ForceSimulation,
  nodes: SimulationNode[],
  edges: SimEdge[],
  width: number,
  height: number,
): ForceSimulation {
  const maxInDegree = maxNodeInDegree(nodes);

  return simulation
    .force('link', d3.forceLink<SimulationNode, SimEdge>(edges)
      .id(node => node.id)
      .distance(80))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<SimulationNode>().radius(node => nodeRadius(node) + 4))
    .force('prerequisite', d3.forceY<SimulationNode>(
      node => prerequisiteTargetY(node.inDegree, maxInDegree, height),
    ).strength(PREREQUISITE_FORCE_STRENGTH));
}

export function createSimulation(
  nodes: SimulationNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  onTick: () => void,
): ForceSimulation {
  const simulation = configureForces(d3.forceSimulation<SimulationNode, SimEdge>(nodes), nodes, edges, width, height);
  return simulation.on('tick', onTick);
}

const SETTLE_ITERATIONS = 300;

export function computeSettledPositions(
  nodes: SimulationNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  iterations: number = SETTLE_ITERATIONS,
): void {
  const simulation = configureForces(d3.forceSimulation<SimulationNode, SimEdge>(nodes), nodes, edges, width, height)
    .stop();

  for (let i = 0; i < iterations; i++) simulation.tick();
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

const TRANSLATE_PATTERN = /translate\(\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\)/;

function translateTween(this: SVGGElement, node: SimulationNode): (t: number) => string {
  const current = this.getAttribute('transform') ?? '';
  const match = TRANSLATE_PATTERN.exec(current);
  const startX = match ? Number(match[1]) : 0;
  const startY = match ? Number(match[2]) : 0;
  const endX = node.x ?? 0;
  const endY = node.y ?? 0;
  return (t: number) => `translate(${startX + (endX - startX) * t},${startY + (endY - startY) * t})`;
}

export function animateToSettledPositions(
  edges: EdgeSelection,
  nodes: NodeSelection,
  durationMs: number,
): Promise<void> {
  const edgeTransition = edges
    .transition()
    .duration(durationMs)
    .attr('x1', edge => edge.source.x ?? 0)
    .attr('y1', edge => edge.source.y ?? 0)
    .attr('x2', edge => edge.target.x ?? 0)
    .attr('y2', edge => edge.target.y ?? 0);

  const nodeTransition = nodes
    .transition()
    .duration(durationMs)
    .attrTween('transform', translateTween);

  return Promise.all([
    edgeTransition.end().catch(() => undefined),
    nodeTransition.end().catch(() => undefined),
  ]).then(() => undefined);
}
