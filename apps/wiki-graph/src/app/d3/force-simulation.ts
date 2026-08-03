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

/** Fraction of the viewport height reserved as top/bottom margin for the prerequisite layout. */
const LAYOUT_VERTICAL_MARGIN_RATIO = 0.1;
/** Strength of the prerequisite forceY pull, kept low so charge/link/collision still dominate local spacing. */
const PREREQUISITE_FORCE_STRENGTH = 0.3;

/**
 * Computes the target Y coordinate for a node based on its inDegree, so that
 * concepts with fewer inbound edges (fewer prerequisites) are pulled toward
 * the top of the viewport and concepts with more inbound edges are pulled
 * further down. Falls back to vertical center when no node has any inbound
 * edges (maxInDegree is 0), avoiding a division by zero.
 */
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

/**
 * Configure the shared set of forces (link, charge, center, collision,
 * prerequisite) on a simulation instance. Extracted so both the live,
 * continuously-ticking simulation and the one-off settle computation used
 * for animated layout transitions stay in sync.
 */
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

/** Default number of manual ticks used to settle a layout ahead of an animated transition. */
const SETTLE_ITERATIONS = 300;

/**
 * Synchronously advance a disposable simulation until the layout is
 * effectively settled, mutating `x`/`y` directly on the given node objects.
 * No `tick` listener is attached and the automatic timer-driven loop is
 * stopped immediately, so this has no visible/DOM side effects - it is used
 * to precompute the target positions for an animated D3 transition between
 * layout states (Requirement 4.4).
 */
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

/** Matches the `translate(x,y)` transform written by `updateSimulationPositions()`/`renderNodes()`. */
const TRANSLATE_PATTERN = /translate\(\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\)/;

/**
 * Linearly interpolate a node's `transform="translate(x,y)"` attribute from
 * whatever position it is currently drawn at to its target `x`/`y`.
 *
 * Built as a manual `attrTween` (rather than `.attr('transform', ...)`,
 * which delegates to d3-interpolate's SVG transform matrix decomposition)
 * because that decomposition reads `SVGTransform.baseVal`, which jsdom does
 * not implement - relying on it would crash under Vitest/jsdom. Since every
 * node transform here is always a plain translate, a direct x/y lerp is
 * both simpler and avoids that dependency entirely.
 */
function translateTween(this: SVGGElement, node: SimulationNode): (t: number) => string {
  const current = this.getAttribute('transform') ?? '';
  const match = TRANSLATE_PATTERN.exec(current);
  const startX = match ? Number(match[1]) : 0;
  const startY = match ? Number(match[2]) : 0;
  const endX = node.x ?? 0;
  const endY = node.y ?? 0;
  return (t: number) => `translate(${startX + (endX - startX) * t},${startY + (endY - startY) * t})`;
}

/**
 * Animate already-rendered node/edge elements from whatever position they
 * are currently drawn at to the (already-computed) `x`/`y` coordinates on
 * their bound data, using a D3 transition instead of an instant attribute
 * jump (Requirement 4.4). Callers are expected to have set the starting
 * position first (e.g. via `updateSimulationPositions()`), then mutated
 * `x`/`y` to the target layout (e.g. via `computeSettledPositions()`)
 * before calling this.
 *
 * Returns a promise that resolves once both the node and edge transitions
 * have finished, so callers can defer follow-up work (e.g. starting the
 * live, interactive simulation) until the animation completes. If a
 * transition is interrupted (e.g. a subsequent layout change starts before
 * this one finishes), its rejection is swallowed rather than propagated.
 */
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
