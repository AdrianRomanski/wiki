import { describe, it, expect } from 'vitest';
import * as d3 from 'd3';
import type { SimulationNode } from '../models/graph.models';
import type { ProgressState } from '../models/progress.models';
import { PROGRESS_COLORS, WIKI_NODE_COLORS } from '../models/progress.constants';
import {
  applyFilters,
  handleKeyboardNavigation,
  matchesProgressFilter,
  nodeFillColor,
  nodeTypeColor,
  updateNodeStyles,
  updateRovingTabIndex,
} from './graph-state';
import type { RootSelection, SimEdge } from './renderer.types';

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

function buildRootWithNodes(nodes: SimulationNode[]): RootSelection {
  const svg = d3.select(document.createElement('svg'));
  const root = svg.append('g') as unknown as RootSelection;

  const nodeSelection = root.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, SimulationNode>('g.node')
    .data(nodes, (node) => node.id)
    .join('g')
    .attr('class', 'node');

  nodeSelection.append('circle');

  return root;
}

function buildRootWithGraph(nodes: SimulationNode[], edges: SimEdge[]): RootSelection {
  const root = buildRootWithNodes(nodes);

  root.append('g')
    .attr('class', 'edges')
    .selectAll<SVGLineElement, SimEdge>('line')
    .data(edges)
    .join('line')
    .attr('class', 'edge');

  return root;
}

describe('graph-state color helpers', () => {
  describe('nodeTypeColor()', () => {
    it('returns the wiki color for the node type in wiki mode', () => {
      const node = makeNode('a', { type: 'concept' });
      expect(nodeTypeColor(node, 'wiki', new Map())).toBe(WIKI_NODE_COLORS.concept);
    });

    it('returns the progress color for the current state in progress mode', () => {
      const node = makeNode('a');
      const progressStates = new Map<string, ProgressState>([['a', 'Mastered']]);
      expect(nodeTypeColor(node, 'progress', progressStates)).toBe(PROGRESS_COLORS.Mastered);
    });

    it('defaults to Not_Started color in progress mode when no state is recorded', () => {
      const node = makeNode('a');
      expect(nodeTypeColor(node, 'progress', new Map())).toBe(PROGRESS_COLORS.Not_Started);
    });
  });

  describe('nodeFillColor()', () => {
    it('returns "none" for ghost nodes regardless of mode', () => {
      const node = makeNode('a', { isGhost: true });
      expect(nodeFillColor(node, 'wiki', new Map())).toBe('none');
      expect(nodeFillColor(node, 'progress', new Map())).toBe('none');
    });

    it('returns the type color for non-ghost nodes in wiki mode', () => {
      const node = makeNode('a', { type: 'source' });
      expect(nodeFillColor(node, 'wiki', new Map())).toBe(WIKI_NODE_COLORS.source);
    });

    it('returns the progress color for non-ghost nodes in progress mode', () => {
      const node = makeNode('a');
      const progressStates = new Map<string, ProgressState>([['a', 'Understood']]);
      expect(nodeFillColor(node, 'progress', progressStates)).toBe(PROGRESS_COLORS.Understood);
    });
  });

  describe('updateNodeStyles()', () => {
    it('recolors node circles by type in wiki mode', () => {
      const nodes = [makeNode('a', { type: 'entity' }), makeNode('b', { type: 'concept' })];
      const root = buildRootWithNodes(nodes);

      updateNodeStyles(root, 'wiki', new Map());

      const fills = root.selectAll<SVGCircleElement, SimulationNode>('g.node circle').nodes()
        .map((el) => el.getAttribute('fill'));
      expect(fills).toEqual([WIKI_NODE_COLORS.entity, WIKI_NODE_COLORS.concept]);
    });

    it('recolors node circles by progress state in progress mode', () => {
      const nodes = [makeNode('a'), makeNode('b')];
      const root = buildRootWithNodes(nodes);
      const progressStates = new Map<string, ProgressState>([
        ['a', 'In_Progress'],
        ['b', 'Mastered'],
      ]);

      updateNodeStyles(root, 'progress', progressStates);

      const fills = root.selectAll<SVGCircleElement, SimulationNode>('g.node circle').nodes()
        .map((el) => el.getAttribute('fill'));
      expect(fills).toEqual([PROGRESS_COLORS.In_Progress, PROGRESS_COLORS.Mastered]);
    });

    it('keeps ghost nodes unfilled and outlines them with the type color', () => {
      const nodes = [makeNode('a', { isGhost: true, type: 'source' })];
      const root = buildRootWithNodes(nodes);

      updateNodeStyles(root, 'wiki', new Map());

      const circle = root.select<SVGCircleElement>('g.node circle').node();
      expect(circle?.getAttribute('fill')).toBe('none');
      expect(circle?.getAttribute('stroke')).toBe(WIKI_NODE_COLORS.source);
      expect(circle?.getAttribute('stroke-width')).toBe('2');
    });
  });

  describe('matchesProgressFilter()', () => {
    it('matches every node when no filters are active', () => {
      const node = makeNode('a');
      expect(matchesProgressFilter(node, new Set(), new Map())).toBe(true);
    });

    it('matches a node whose progress state is in the active filter set', () => {
      const node = makeNode('a');
      const progressStates = new Map<string, ProgressState>([['a', 'Mastered']]);
      expect(matchesProgressFilter(node, new Set(['Mastered']), progressStates)).toBe(true);
    });

    it('does not match a node whose progress state is not in the active filter set', () => {
      const node = makeNode('a');
      const progressStates = new Map<string, ProgressState>([['a', 'In_Progress']]);
      expect(matchesProgressFilter(node, new Set(['Mastered']), progressStates)).toBe(false);
    });

    it('defaults to Not_Started when no progress entry is recorded', () => {
      const node = makeNode('a');
      expect(matchesProgressFilter(node, new Set(['Not_Started']), new Map())).toBe(true);
      expect(matchesProgressFilter(node, new Set(['Mastered']), new Map())).toBe(false);
    });

    it('matches with OR logic across multiple active filters', () => {
      const node = makeNode('a');
      const progressStates = new Map<string, ProgressState>([['a', 'Understood']]);
      expect(matchesProgressFilter(node, new Set(['Understood', 'Mastered']), progressStates)).toBe(true);
    });
  });

  describe('handleKeyboardNavigation()', () => {
    it('returns null when the current node has no connected nodes', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const root = buildRootWithGraph([nodeA], []);

      expect(handleKeyboardNavigation(root, 'a', 'ArrowDown')).toBeNull();
    });

    it('returns null when the current node id is not found', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const root = buildRootWithGraph([nodeA], []);

      expect(handleKeyboardNavigation(root, 'missing', 'ArrowDown')).toBeNull();
    });

    it('moves focus to the connected node positioned below on ArrowDown', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const nodeB = makeNode('b', { x: 0, y: 100 });
      const nodeC = makeNode('c', { x: 0, y: -100 });
      const root = buildRootWithGraph(
        [nodeA, nodeB, nodeC],
        [{ source: nodeA, target: nodeB }, { source: nodeC, target: nodeA }],
      );

      expect(handleKeyboardNavigation(root, 'a', 'ArrowDown')).toBe('b');
    });

    it('moves focus to the connected node positioned above on ArrowUp', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const nodeB = makeNode('b', { x: 0, y: 100 });
      const nodeC = makeNode('c', { x: 0, y: -100 });
      const root = buildRootWithGraph(
        [nodeA, nodeB, nodeC],
        [{ source: nodeA, target: nodeB }, { source: nodeC, target: nodeA }],
      );

      expect(handleKeyboardNavigation(root, 'a', 'ArrowUp')).toBe('c');
    });

    it('picks the nearest connected node in the given direction', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const nodeNear = makeNode('near', { x: 0, y: 50 });
      const nodeFar = makeNode('far', { x: 0, y: 200 });
      const root = buildRootWithGraph(
        [nodeA, nodeNear, nodeFar],
        [{ source: nodeA, target: nodeNear }, { source: nodeA, target: nodeFar }],
      );

      expect(handleKeyboardNavigation(root, 'a', 'ArrowDown')).toBe('near');
    });

    it('falls back to the nearest connected node overall when none lie in the pressed direction', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const nodeB = makeNode('b', { x: 0, y: 100 });
      const root = buildRootWithGraph([nodeA, nodeB], [{ source: nodeA, target: nodeB }]);

      expect(handleKeyboardNavigation(root, 'a', 'ArrowUp')).toBe('b');
    });

    it('considers edges in either direction (source or target of the current node)', () => {
      const nodeA = makeNode('a', { x: 0, y: 0 });
      const nodeB = makeNode('b', { x: 100, y: 0 });
      const root = buildRootWithGraph([nodeA, nodeB], [{ source: nodeB, target: nodeA }]);

      expect(handleKeyboardNavigation(root, 'a', 'ArrowRight')).toBe('b');
    });
  });

  describe('updateRovingTabIndex()', () => {
    it('sets tabindex 0 on the active node and -1 on all others', () => {
      const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
      const root = buildRootWithNodes(nodes);

      updateRovingTabIndex(root, 'b');

      const tabIndexes = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
        .map((el) => el.getAttribute('tabindex'));
      expect(tabIndexes).toEqual(['-1', '0', '-1']);
    });

    it('moving the active id updates which node is the sole tab stop', () => {
      const nodes = [makeNode('a'), makeNode('b')];
      const root = buildRootWithNodes(nodes);

      updateRovingTabIndex(root, 'a');
      updateRovingTabIndex(root, 'b');

      const tabIndexes = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
        .map((el) => el.getAttribute('tabindex'));
      expect(tabIndexes).toEqual(['-1', '0']);
    });
  });

  describe('applyFilters()', () => {
    it('shows all nodes and edges when no filters are active', () => {
      const nodeA = makeNode('a');
      const nodeB = makeNode('b');
      const root = buildRootWithGraph([nodeA, nodeB], [{ source: nodeA, target: nodeB }]);

      applyFilters(root, [], new Map());

      const nodeDisplay = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
        .map((el) => el.style.display);
      expect(nodeDisplay).toEqual(['', '']);
      const edgeDisplay = root.select<SVGLineElement>('line.edge').node()?.style.display;
      expect(edgeDisplay).toBe('');
    });

    it('hides nodes not matching any active progress filter', () => {
      const nodeA = makeNode('a');
      const nodeB = makeNode('b');
      const root = buildRootWithGraph([nodeA, nodeB], []);
      const progressStates = new Map<string, ProgressState>([
        ['a', 'Mastered'],
        ['b', 'Not_Started'],
      ]);

      applyFilters(root, ['Mastered'], progressStates);

      const displays = root.selectAll<SVGGElement, SimulationNode>('g.node').nodes()
        .map((el) => el.style.display);
      expect(displays).toEqual(['', 'none']);
    });

    it('hides an edge when either endpoint node is filtered out', () => {
      const nodeA = makeNode('a');
      const nodeB = makeNode('b');
      const root = buildRootWithGraph([nodeA, nodeB], [{ source: nodeA, target: nodeB }]);
      const progressStates = new Map<string, ProgressState>([
        ['a', 'Mastered'],
        ['b', 'Not_Started'],
      ]);

      applyFilters(root, ['Mastered'], progressStates);

      const edgeDisplay = root.select<SVGLineElement>('line.edge').node()?.style.display;
      expect(edgeDisplay).toBe('none');
    });

    it('shows an edge only when both endpoints match the active filters', () => {
      const nodeA = makeNode('a');
      const nodeB = makeNode('b');
      const root = buildRootWithGraph([nodeA, nodeB], [{ source: nodeA, target: nodeB }]);
      const progressStates = new Map<string, ProgressState>([
        ['a', 'Mastered'],
        ['b', 'Mastered'],
      ]);

      applyFilters(root, ['Mastered'], progressStates);

      const edgeDisplay = root.select<SVGLineElement>('line.edge').node()?.style.display;
      expect(edgeDisplay).toBe('');
    });
  });
});
