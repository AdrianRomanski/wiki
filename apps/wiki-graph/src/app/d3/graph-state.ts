import type { SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import { PROGRESS_COLORS, VisualizationMode, WIKI_NODE_COLORS } from '../models/progress.constants';
import { DIM_OPACITY, EDGE_COLOR, TYPE_COLORS } from './graph-style';
import type { RootSelection, SimEdge } from './renderer.types';

/**
 * Resolve the fill color for a node's circle based on the active
 * visualization mode. Ghost nodes are never filled (outline only).
 * @param node - The node being rendered
 * @param mode - 'wiki' colors by node type, 'progress' colors by learning state
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function nodeFillColor(
  node: SimulationNode,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): string {
  if (node.isGhost) return 'none';
  return nodeTypeColor(node, mode, progressStates);
}

/**
 * Resolve the "identity" color for a node (used for fill in wiki/progress
 * mode, and for the ghost-node outline in both modes).
 * @param node - The node being rendered
 * @param mode - 'wiki' colors by node type, 'progress' colors by learning state
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function nodeTypeColor(
  node: SimulationNode,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): string {
  if (mode === 'progress') {
    const state = progressStates.get(node.id) ?? 'Not_Started';
    return PROGRESS_COLORS[state];
  }
  return WIKI_NODE_COLORS[node.type] ?? TYPE_COLORS[node.type] ?? '#888';
}

/**
 * Apply fill/stroke colors to every rendered node circle based on the
 * current visualization mode and progress state lookup, without touching
 * selection highlighting. Call `updateSelection()` afterwards (or let the
 * caller reapply it) to restore the selection ring/dimming on top.
 * @param root - The root SVG group selection
 * @param mode - Active visualization mode
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function updateNodeStyles(
  root: RootSelection,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): void {
  root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
    .attr('fill', node => nodeFillColor(node, mode, progressStates))
    .attr('stroke', node => node.isGhost ? nodeTypeColor(node, mode, progressStates) : 'none')
    .attr('stroke-width', node => node.isGhost ? 2 : 0);
}

export function resetSelection(
  root: RootSelection,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): void {
  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .style('opacity', null);
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .style('opacity', null)
    .attr('stroke', EDGE_COLOR);
  root.selectAll<SVGCircleElement, SimulationNode>('g.node circle')
    .attr('stroke', node => node.isGhost ? nodeTypeColor(node, mode, progressStates) : 'none')
    .attr('stroke-width', node => node.isGhost ? 2 : 0);
}

export function updateSelectedGraph(
  root: RootSelection,
  selectedId: string,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): void {
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
      : (node.isGhost ? nodeTypeColor(node, mode, progressStates) : 'none'))
    .attr('stroke-width', node => node.id === selectedId ? 3 : (node.isGhost ? 2 : 0));
}

export function updateSelection(
  root: RootSelection,
  selectedId: string | null,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): void {
  if (selectedId) {
    updateSelectedGraph(root, selectedId, mode, progressStates);
    return;
  }

  resetSelection(root, mode, progressStates);
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

/** Arrow keys recognized for keyboard navigation between connected nodes. */
export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * Determine the id of the node that keyboard focus should move to when an
 * arrow key is pressed while `currentId` has focus (Requirements 3.4, 3.5).
 *
 * Only nodes directly connected to the current node by an edge (in either
 * direction) are considered. Among those, nodes positioned in the pressed
 * arrow's direction relative to the current node's simulation coordinates
 * are preferred; the nearest such node (by Euclidean distance) is chosen.
 * If no connected node lies in that direction (e.g. all connected nodes are
 * below when ArrowUp is pressed), the nearest connected node overall is
 * chosen instead so arrow navigation never gets stuck.
 *
 * @param root - The root SVG group selection containing rendered nodes/edges
 * @param currentId - The id of the node that currently has DOM focus
 * @param key - The arrow key that was pressed
 * @returns The id of the node to focus next, or null if there are no connected nodes
 */
export function handleKeyboardNavigation(
  root: RootSelection,
  currentId: string,
  key: ArrowKey,
): string | null {
  const nodesById = new Map<string, SimulationNode>();
  root.selectAll<SVGGElement, SimulationNode>('g.node').each(node => {
    nodesById.set(node.id, node);
  });

  const current = nodesById.get(currentId);
  if (!current) return null;

  const connectedIds = new Set<string>();
  root.selectAll<SVGLineElement, SimEdge>('line.edge').each(edge => {
    if (edge.source.id === currentId) connectedIds.add(edge.target.id);
    if (edge.target.id === currentId) connectedIds.add(edge.source.id);
  });

  const candidates = Array.from(connectedIds)
    .map(id => nodesById.get(id))
    .filter((node): node is SimulationNode => node !== undefined);

  if (candidates.length === 0) return null;

  const cx = current.x ?? 0;
  const cy = current.y ?? 0;

  const matchesDirection = (node: SimulationNode): boolean => {
    const dx = (node.x ?? 0) - cx;
    const dy = (node.y ?? 0) - cy;
    switch (key) {
      case 'ArrowUp': return dy < 0;
      case 'ArrowDown': return dy > 0;
      case 'ArrowLeft': return dx < 0;
      case 'ArrowRight': return dx > 0;
    }
  };

  const distanceFromCurrent = (node: SimulationNode): number => {
    const dx = (node.x ?? 0) - cx;
    const dy = (node.y ?? 0) - cy;
    return Math.hypot(dx, dy);
  };

  const directional = candidates.filter(matchesDirection);
  const pool = directional.length > 0 ? directional : candidates;

  return pool.reduce((closest, node) =>
    distanceFromCurrent(node) < distanceFromCurrent(closest) ? node : closest,
  ).id;
}

/**
 * Update the roving tabindex so that exactly one node (`activeId`) is a Tab
 * stop (`tabindex="0"`) and every other rendered node is removed from the
 * default Tab order (`tabindex="-1"`).
 *
 * Without this, every node keeps `tabindex="0"` and pressing Tab steps
 * through each node one at a time before reaching the next control (e.g.
 * the progress dashboard), which makes Tab unusable for moving between the
 * graph and surrounding UI on graphs with more than a couple of nodes.
 * With a single roving Tab stop, Tab moves directly from the graph to the
 * next focusable control, while arrow keys remain the way to move focus
 * between nodes within the graph (Requirement 3.4).
 * @param root - The root SVG group selection containing rendered nodes
 * @param activeId - The id of the node that should be the sole Tab stop
 */
export function updateRovingTabIndex(root: RootSelection, activeId: string): void {
  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .attr('tabindex', node => node.id === activeId ? '0' : '-1');
}

/**
 * Determine whether a node matches the active progress-state filters.
 * When no filters are active, every node matches (all nodes shown).
 * Nodes without a recorded progress entry default to 'Not_Started'.
 * @param node - The node being tested
 * @param activeFilters - Set of progress states currently enabled as filters
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function matchesProgressFilter(
  node: SimulationNode,
  activeFilters: ReadonlySet<ProgressState>,
  progressStates: ReadonlyMap<string, ProgressState>,
): boolean {
  if (activeFilters.size === 0) return true;
  const state = progressStates.get(node.id) ?? 'Not_Started';
  return activeFilters.has(state);
}

/**
 * Show/hide rendered nodes based on the active progress-state filters
 * (OR logic across multiple enabled states; all nodes shown when no filter
 * is active). Edges are hidden whenever either endpoint is filtered out,
 * keeping edge visibility limited to connections between visible nodes.
 * @param root - The root SVG group selection
 * @param activeFilters - Progress states currently enabled as filters
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function applyFilters(
  root: RootSelection,
  activeFilters: ProgressState[],
  progressStates: ReadonlyMap<string, ProgressState>,
): void {
  const filterSet = new Set(activeFilters);

  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .style('display', node => matchesProgressFilter(node, filterSet, progressStates) ? null : 'none');
  root.selectAll<SVGLineElement, SimEdge>('line.edge')
    .style('display', edge =>
      matchesProgressFilter(edge.source, filterSet, progressStates) &&
      matchesProgressFilter(edge.target, filterSet, progressStates)
        ? null
        : 'none',
    );
}
