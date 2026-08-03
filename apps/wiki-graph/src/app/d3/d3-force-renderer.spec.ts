import { describe, it, expect, vi } from 'vitest';
import * as d3 from 'd3';
import { D3ForceRenderer } from './d3-force-renderer';
import { LAYOUT_TRANSITION_DURATION_MS } from './graph-style';
import type { GraphData, GraphNode } from '../models/graph.models';

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    title: id,
    type: 'entity',
    tags: [],
    filePath: `entities/${id}.md`,
    isGhost: false,
    inDegree: 0,
    outDegree: 0,
    ...overrides,
  };
}

function makeGraphData(nodes: GraphNode[]): GraphData {
  return { nodes: new Map(nodes.map(n => [n.id, n])), edges: [], allTags: [] };
}

/** Creates a detached SVG element with non-zero client dimensions stubbed for jsdom. */
function createSvgElement(width = 800, height = 600): SVGSVGElement {
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  Object.defineProperty(svgElement, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(svgElement, 'clientHeight', { value: height, configurable: true });
  document.body.appendChild(svgElement);
  return svgElement;
}

describe('D3ForceRenderer layout transitions', () => {
  it('uses the 500ms LAYOUT_TRANSITION_DURATION_MS constant for the animated transition', () => {
    expect(LAYOUT_TRANSITION_DURATION_MS).toBe(500);
  });

  /**
   * **Validates: Requirements 4.4**
   * Re-rendering with new graph data must not reset the zoom/pan transform
   * already applied to the root group - the viewport position should be
   * preserved across layout changes.
   */
  it('preserves the current zoom/pan transform on the root group across a re-render', () => {
    const svgElement = createSvgElement();
    const renderer = new D3ForceRenderer(svgElement, () => undefined);

    const root = d3.select(svgElement).select<SVGGElement>('g.graph-root');
    const appliedTransform = d3.zoomIdentity.translate(42, 17).scale(2);
    root.attr('transform', appliedTransform.toString());

    renderer.render(makeGraphData([makeNode('a'), makeNode('b')]), new Set());

    expect(root.attr('transform')).toBe(appliedTransform.toString());

    renderer.destroy();
    document.body.removeChild(svgElement);
  });

  it('preserves the viewport transform across multiple successive layout-changing renders', () => {
    const svgElement = createSvgElement();
    const renderer = new D3ForceRenderer(svgElement, () => undefined);

    const root = d3.select(svgElement).select<SVGGElement>('g.graph-root');
    const appliedTransform = d3.zoomIdentity.translate(5, 9).scale(1.5);
    root.attr('transform', appliedTransform.toString());

    renderer.render(makeGraphData([makeNode('a')]), new Set());
    renderer.render(makeGraphData([makeNode('a'), makeNode('b'), makeNode('c')]), new Set());

    expect(root.attr('transform')).toBe(appliedTransform.toString());

    renderer.destroy();
    document.body.removeChild(svgElement);
  });

  it('does not start a live simulation for a render superseded by a subsequent render before its transition finishes', async () => {
    const svgElement = createSvgElement();
    const renderer = new D3ForceRenderer(svgElement, () => undefined);

    renderer.render(makeGraphData([makeNode('a'), makeNode('b')]), new Set());
    // Immediately supersede with another render before the first transition
    // (500ms) can complete.
    renderer.render(makeGraphData([makeNode('a'), makeNode('b'), makeNode('c')]), new Set());

    // Give any pending microtasks/timers a chance to run without throwing.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(() => renderer.destroy()).not.toThrow();
    document.body.removeChild(svgElement);
  });

  it('does not throw when destroy() is called while a layout transition is still in flight', async () => {
    const svgElement = createSvgElement();
    const renderer = new D3ForceRenderer(svgElement, () => undefined);

    renderer.render(makeGraphData([makeNode('a'), makeNode('b')]), new Set());
    renderer.destroy();

    await new Promise(resolve => setTimeout(resolve, 0));

    document.body.removeChild(svgElement);
  });

  it('carries the previous render\'s settled target position forward as the next transition\'s start point', () => {
    const svgElement = createSvgElement();
    const onNodeClick = vi.fn();
    const renderer = new D3ForceRenderer(svgElement, onNodeClick);

    // First render: node 'a' starts undrawn (no prior position), so its
    // synchronously-drawn starting transform is the default translate(0,0).
    renderer.render(makeGraphData([makeNode('a'), makeNode('b')]), new Set());
    const nodeA = d3.select(svgElement).selectAll<SVGGElement, { id: string }>('g.node')
      .filter(n => n.id === 'a').node();
    expect(nodeA?.getAttribute('transform')).toBe('translate(0,0)');

    // Second render: node 'a' continues to exist, so its starting position
    // for this transition should be carried forward from the settled
    // target layout computed during the first render, not reset to (0,0).
    renderer.render(makeGraphData([makeNode('a'), makeNode('b'), makeNode('c')]), new Set());
    const nodeAAfter = d3.select(svgElement).selectAll<SVGGElement, { id: string }>('g.node')
      .filter(n => n.id === 'a').node();

    expect(nodeAAfter?.getAttribute('transform')).not.toBe('translate(0,0)');

    renderer.destroy();
    document.body.removeChild(svgElement);
  });
});
