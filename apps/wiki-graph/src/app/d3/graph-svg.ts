import * as d3 from 'd3';
import type { SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import { PROGRESS_STATE_LABELS, type VisualizationMode } from '../models/progress.constants';
import { EDGE_COLOR } from './graph-style';
import { handleKeyboardNavigation, nodeFillColor, nodeTypeColor, updateRovingTabIndex, type ArrowKey } from './graph-state';
import { nodeRadius } from './force-simulation';
import type { EdgeSelection, NodeSelection, RootSelection, SimEdge, SvgSelection } from './renderer.types';

const ARROW_KEYS: ReadonlySet<string> = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * Build the ARIA label for a node, including its concept name, type, and
 * (in progress mode) its current progress state so screen reader users know
 * both what the node represents and its learning status (Requirement 3.4).
 * @param node - The node being rendered
 * @param mode - Active visualization mode
 * @param progressStates - Lookup of concept ID to current progress state
 */
export function nodeAriaLabel(
  node: SimulationNode,
  mode: VisualizationMode,
  progressStates: ReadonlyMap<string, ProgressState>,
): string {
  if (mode !== 'progress') {
    return `${node.title} (${node.type})`;
  }
  const state = progressStates.get(node.id) ?? 'Not_Started';
  return `${node.title} (${node.type}), progress: ${PROGRESS_STATE_LABELS[state]}`;
}

export function createZoom(root: RootSelection): d3.ZoomBehavior<SVGSVGElement, unknown> {
  return d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', event => {
      root.attr('transform', event.transform.toString());
    });
}

/** Duration (ms) for the double-click-to-reset zoom transition (Requirement 6.4). */
const ZOOM_RESET_DURATION_MS = 500;

function isBackgroundTarget(event: { target: EventTarget | null }, svgElement: SVGSVGElement): boolean {
  return event.target === svgElement || (event.target as Element).tagName === 'svg';
}

export function attachSvgInteractions(
  svg: SvgSelection,
  svgElement: SVGSVGElement,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  onNodeClick: (id: string | null) => void,
): void {
  svg
    .call(zoom)
    // Disable D3's default dblclick-to-zoom-in behavior so double-click can be
    // repurposed to reset zoom instead (Requirement 6.4).
    .on('dblclick.zoom', null)
    .on('click', event => {
      if (isBackgroundTarget(event, svgElement)) {
        onNodeClick(null);
      }
    })
    .on('dblclick', event => {
      // Only reset when double-clicking the background, not a node.
      if (isBackgroundTarget(event, svgElement)) {
        svg
          .transition()
          .duration(ZOOM_RESET_DURATION_MS)
          .call(zoom.transform, d3.zoomIdentity);
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
  onAssessmentRequest: (id: string) => void = () => undefined,
  mode: VisualizationMode = 'wiki',
  progressStates: ReadonlyMap<string, ProgressState> = new Map(),
): NodeSelection {
  const nodeSelection = root.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, SimulationNode>('g.node')
    .data(nodes, node => node.id)
    .join('g')
    .attr('class', 'node')
    .attr('role', 'button')
    // Roving tabindex (Requirement 3.4): only the first node is a Tab stop
    // so Tab moves past the whole graph in one step, while arrow keys move
    // focus between nodes within the graph.
    .attr('tabindex', (_node, index) => index === 0 ? '0' : '-1')
    .attr('aria-label', node => nodeAriaLabel(node, mode, progressStates))
    .style('cursor', 'pointer');

  nodeSelection.append('circle')
    .attr('r', node => nodeRadius(node))
    .attr('fill', node => nodeFillColor(node, mode, progressStates))
    .attr('stroke', node => node.isGhost ? nodeTypeColor(node, mode, progressStates) : 'none')
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
    .on('click', function (event: MouseEvent, node: SimulationNode) {
      event.stopPropagation();
      // Move the roving Tab stop to the clicked node so a subsequent Tab
      // press continues from here rather than from wherever the graph was
      // first rendered (Requirement 3.4).
      updateRovingTabIndex(root, node.id);
      onNodeClick(node.id);
    })
    .on('keydown', function (event: KeyboardEvent, node: SimulationNode) {
      // Enter initiates a knowledge assessment for the focused node (Requirement 5.6).
      // Space selects/highlights the node, mirroring click behavior.
      // Arrow keys move DOM focus to a directly connected node (Requirements 3.4, 3.5).
      if (event.key === 'Enter') {
        event.preventDefault();
        onAssessmentRequest(node.id);
      } else if (event.key === ' ') {
        event.preventDefault();
        onNodeClick(node.id);
      } else if (ARROW_KEYS.has(event.key)) {
        event.preventDefault();
        const targetId = handleKeyboardNavigation(root, node.id, event.key as ArrowKey);
        if (targetId === null) return;
        updateRovingTabIndex(root, targetId);
        nodeSelection.filter(target => target.id === targetId).each(function () {
          (this as SVGGElement).focus();
        });
      }
    });

  return nodeSelection;
}
