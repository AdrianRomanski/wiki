import type { SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import { PROGRESS_COLORS, VisualizationMode, WIKI_NODE_COLORS } from '../models/progress.constants';
import { DIM_OPACITY, EDGE_COLOR, TYPE_COLORS } from './graph-style';
import type { RootSelection, SimEdge } from './renderer.types';

export function nodeFillColor(
  node: SimulationNode,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): string {
  if (node.isGhost) return 'none';
  return nodeTypeColor(node, mode, progressStates);
}

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

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

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

export function updateRovingTabIndex(root: RootSelection, activeId: string): void {
  root.selectAll<SVGGElement, SimulationNode>('g.node')
    .attr('tabindex', node => node.id === activeId ? '0' : '-1');
}

export function matchesProgressFilter(
  node: SimulationNode,
  activeFilters: ReadonlySet<ProgressState>,
  progressStates: ReadonlyMap<string, ProgressState>,
): boolean {
  if (activeFilters.size === 0) return true;
  const state = progressStates.get(node.id) ?? 'Not_Started';
  return activeFilters.has(state);
}

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
