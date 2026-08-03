import { describe, it, expect, vi } from 'vitest';
import * as d3 from 'd3';
import { attachSvgInteractions, createZoom, nodeAriaLabel, renderNodes } from './graph-svg';
import type { RootSelection, SvgSelection } from './renderer.types';
import type { SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';

function makeNode(id: string, overrides: Partial<SimulationNode> = {}): SimulationNode {
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

describe('graph-svg zoom behavior', () => {
  describe('createZoom()', () => {
    it('constrains zoom scale between 0.1x and 3x', () => {
      const svg = d3.select(document.createElement('svg'));
      const root = svg.append('g') as unknown as RootSelection;

      const zoom = createZoom(root);

      expect(zoom.scaleExtent()).toEqual([0.1, 3]);
    });

    it('applies the zoom transform to the root group on zoom events', () => {
      const svg = d3.select(document.createElement('svg'));
      const root = svg.append('g') as unknown as RootSelection;

      const zoom = createZoom(root);
      const transform = d3.zoomIdentity.translate(10, 20).scale(2);
      zoom.on('zoom')?.call(root.node() as never, { transform } as never, undefined as never);

      expect((root.node() as SVGGElement).getAttribute('transform')).toBe(transform.toString());
    });
  });

  describe('attachSvgInteractions()', () => {
    it('attaches the zoom behavior to the svg element, enabling default pan-via-drag and zoom-via-scroll', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const svg = d3.select(svgElement) as unknown as SvgSelection;
      const root = svg.append('g') as unknown as RootSelection;
      const zoom = createZoom(root);
      const callSpy = vi.spyOn(svg, 'call');

      attachSvgInteractions(svg, svgElement, zoom, () => undefined);

      // d3.zoom() attached via selection.call(zoom) provides pan-via-background-drag
      // and zoom-via-mouse-scroll by default; here we verify the behavior is attached.
      expect(callSpy).toHaveBeenCalledWith(zoom);
    });

    it('invokes onNodeClick(null) when the svg background itself is clicked', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const svg = d3.select(svgElement) as unknown as SvgSelection;
      const root = svg.append('g') as unknown as RootSelection;
      const zoom = createZoom(root);
      const onNodeClick = vi.fn();

      attachSvgInteractions(svg, svgElement, zoom, onNodeClick);
      svg.dispatch('click', { detail: { target: svgElement } } as never);

      // jsdom dispatch doesn't set event.target reliably for custom dispatch,
      // so we invoke the handler directly to verify the null-click contract.
      const handler = svg.on('click') as ((event: MouseEvent) => void) | undefined;
      handler?.call(svgElement, { target: svgElement } as unknown as MouseEvent);

      expect(onNodeClick).toHaveBeenCalledWith(null);
    });

    it('disables the default dblclick-to-zoom-in behavior', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const svg = d3.select(svgElement) as unknown as SvgSelection;
      const root = svg.append('g') as unknown as RootSelection;
      const zoom = createZoom(root);

      attachSvgInteractions(svg, svgElement, zoom, () => undefined);

      expect(svg.on('dblclick.zoom')).toBeUndefined();
    });

    it('starts a 500ms transition resetting to zoomIdentity when the background is double-clicked', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const root = d3.select(document.createElement('div')).append('g') as unknown as RootSelection;
      const zoom = createZoom(root);

      const transitionCall = vi.fn();
      const duration = vi.fn().mockReturnValue({ call: transitionCall });
      const transition = vi.fn().mockReturnValue({ duration });
      let dblclickHandler: ((event: unknown) => void) | undefined;
      const svgStub = {
        call: vi.fn().mockReturnThis(),
        on: vi.fn((event: string, handler?: (e: unknown) => void) => {
          if (event === 'dblclick' && handler) {
            dblclickHandler = handler;
          }
          return svgStub;
        }),
        transition,
      } as unknown as SvgSelection;

      attachSvgInteractions(svgStub, svgElement, zoom, () => undefined);
      dblclickHandler?.({ target: svgElement });

      expect(transition).toHaveBeenCalledTimes(1);
      expect(duration).toHaveBeenCalledWith(500);
      expect(transitionCall).toHaveBeenCalledWith(zoom.transform, d3.zoomIdentity);
    });

    it('does not start a reset transition when double-clicking a node (non-background target)', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const root = d3.select(document.createElement('div')).append('g') as unknown as RootSelection;
      const zoom = createZoom(root);

      const transition = vi.fn();
      let dblclickHandler: ((event: unknown) => void) | undefined;
      const svgStub = {
        call: vi.fn().mockReturnThis(),
        on: vi.fn((event: string, handler?: (e: unknown) => void) => {
          if (event === 'dblclick' && handler) {
            dblclickHandler = handler;
          }
          return svgStub;
        }),
        transition,
      } as unknown as SvgSelection;

      attachSvgInteractions(svgStub, svgElement, zoom, () => undefined);
      const nodeElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      dblclickHandler?.({ target: nodeElement });

      expect(transition).not.toHaveBeenCalled();
    });
  });
});

describe('nodeAriaLabel()', () => {
  it('returns title and type without progress state in wiki mode', () => {
    const node = makeNode('a', { title: 'RxJS', type: 'entity' });
    expect(nodeAriaLabel(node, 'wiki', new Map())).toBe('RxJS (entity)');
  });

  it('includes the human-readable progress state in progress mode', () => {
    const node = makeNode('a', { title: 'RxJS', type: 'entity' });
    const progressStates = new Map<string, ProgressState>([['a', 'In_Progress']]);
    expect(nodeAriaLabel(node, 'progress', progressStates)).toBe('RxJS (entity), progress: In Progress');
  });

  it('defaults to Not Started when no progress entry is recorded in progress mode', () => {
    const node = makeNode('a', { title: 'RxJS', type: 'entity' });
    expect(nodeAriaLabel(node, 'progress', new Map())).toBe('RxJS (entity), progress: Not Started');
  });
});

describe('renderNodes() rendering', () => {
  it('sets the aria-label including progress state when mode is "progress"', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const progressStates = new Map<string, ProgressState>([['a', 'Mastered']]);

    renderNodes(root, [makeNode('a', { title: 'Signals' })], () => undefined, () => undefined, 'progress', progressStates);

    const nodeEl = root.select<SVGGElement>('g.node').node();
    expect(nodeEl?.getAttribute('aria-label')).toBe('Signals (entity), progress: Mastered');
  });

  it('gives only the first rendered node a tabindex of 0 (roving tabindex)', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;

    renderNodes(root, [makeNode('a'), makeNode('b'), makeNode('c')], () => undefined, () => undefined);

    const tabIndexes = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
      .map((el) => el.getAttribute('tabindex'));
    expect(tabIndexes).toEqual(['0', '-1', '-1']);
  });
});

describe('renderNodes() interaction handlers', () => {
  it('invokes onNodeClick with the node id on click', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const onNodeClick = vi.fn();
    const onAssessmentRequest = vi.fn();
    const nodes = renderNodes(root, [makeNode('a')], onNodeClick, onAssessmentRequest);

    const stopPropagation = vi.fn();
    const clickHandler = nodes.on('click') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    clickHandler?.call(nodes.node() as never, { stopPropagation }, makeNode('a'));

    expect(onNodeClick).toHaveBeenCalledWith('a');
    expect(onAssessmentRequest).not.toHaveBeenCalled();
  });

  it('moves the roving tabindex to the clicked node', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const nodes = renderNodes(root, [makeNode('a'), makeNode('b')], () => undefined, () => undefined);

    const stopPropagation = vi.fn();
    const clickHandler = nodes.on('click') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    const nodeBEl = root.selectAll<SVGGElement, SimulationNode>('g.node')
      .filter(node => node.id === 'b').node();
    clickHandler?.call(nodeBEl as never, { stopPropagation }, makeNode('b'));

    const tabIndexes = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
      .map((el) => el.getAttribute('tabindex'));
    expect(tabIndexes).toEqual(['-1', '0']);
  });

  it('invokes onAssessmentRequest (not onNodeClick) when Enter is pressed on a node', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const onNodeClick = vi.fn();
    const onAssessmentRequest = vi.fn();
    const nodes = renderNodes(root, [makeNode('a')], onNodeClick, onAssessmentRequest);

    const preventDefault = vi.fn();
    const keydownHandler = nodes.on('keydown') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    keydownHandler?.call(nodes.node() as never, { key: 'Enter', preventDefault }, makeNode('a'));

    expect(onAssessmentRequest).toHaveBeenCalledWith('a');
    expect(onNodeClick).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it('invokes onNodeClick (not onAssessmentRequest) when Space is pressed on a node', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const onNodeClick = vi.fn();
    const onAssessmentRequest = vi.fn();
    const nodes = renderNodes(root, [makeNode('a')], onNodeClick, onAssessmentRequest);

    const preventDefault = vi.fn();
    const keydownHandler = nodes.on('keydown') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    keydownHandler?.call(nodes.node() as never, { key: ' ', preventDefault }, makeNode('a'));

    expect(onNodeClick).toHaveBeenCalledWith('a');
    expect(onAssessmentRequest).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it('moves DOM focus to a connected node when an arrow key is pressed', () => {
    // Elements must be attached to the document for jsdom to update document.activeElement on focus().
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgElement);
    const svg = d3.select(svgElement);
    const root = svg.append('g') as unknown as RootSelection;
    const nodeA = makeNode('a', { x: 0, y: 0 });
    const nodeB = makeNode('b', { x: 0, y: 100 });
    const nodes = renderNodes(root, [nodeA, nodeB], () => undefined, () => undefined);
    root.append('g').attr('class', 'edges')
      .selectAll('line')
      .data([{ source: nodeA, target: nodeB }])
      .join('line')
      .attr('class', 'edge');

    const preventDefault = vi.fn();
    const keydownHandler = nodes.on('keydown') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    keydownHandler?.call(nodes.node() as never, { key: 'ArrowDown', preventDefault }, nodeA);

    const nodeBEl = root.selectAll<SVGGElement, SimulationNode>('g.node')
      .filter(node => node.id === 'b')
      .node();
    expect(document.activeElement).toBe(nodeBEl);
    expect(preventDefault).toHaveBeenCalled();

    document.body.removeChild(svgElement);
  });

  it('moves the roving tabindex to the newly focused node on arrow key navigation', () => {
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgElement);
    const svg = d3.select(svgElement);
    const root = svg.append('g') as unknown as RootSelection;
    const nodeA = makeNode('a', { x: 0, y: 0 });
    const nodeB = makeNode('b', { x: 0, y: 100 });
    const nodes = renderNodes(root, [nodeA, nodeB], () => undefined, () => undefined);
    root.append('g').attr('class', 'edges')
      .selectAll('line')
      .data([{ source: nodeA, target: nodeB }])
      .join('line')
      .attr('class', 'edge');

    const preventDefault = vi.fn();
    const keydownHandler = nodes.on('keydown') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    keydownHandler?.call(nodes.node() as never, { key: 'ArrowDown', preventDefault }, nodeA);

    const tabIndexes = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
      .map((el) => el.getAttribute('tabindex'));
    expect(tabIndexes).toEqual(['-1', '0']);

    document.body.removeChild(svgElement);
  });

  it('does not throw and takes no action when an arrow key is pressed with no connected nodes', () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const nodes = renderNodes(root, [makeNode('a')], () => undefined, () => undefined);

    const preventDefault = vi.fn();
    const keydownHandler = nodes.on('keydown') as
      | ((event: unknown, node: SimulationNode) => void)
      | undefined;
    expect(() =>
      keydownHandler?.call(nodes.node() as never, { key: 'ArrowRight', preventDefault }, makeNode('a')),
    ).not.toThrow();
    expect(preventDefault).toHaveBeenCalled();
  });
});
