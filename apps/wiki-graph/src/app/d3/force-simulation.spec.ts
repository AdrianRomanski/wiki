import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as d3 from 'd3';
import type { SimulationNode } from '../models/graph.models';
import type { EdgeSelection, NodeSelection, RootSelection, SimEdge } from './renderer.types';
import {
  animateToSettledPositions,
  createSimulation,
  nodeRadius,
  prerequisiteTargetY,
  updateSimulationPositions,
} from './force-simulation';

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

describe('prerequisiteTargetY()', () => {
  it('returns the vertical center when no node has any inbound edges', () => {
    expect(prerequisiteTargetY(0, 0, 600)).toBe(300);
  });

  it('positions a node with zero inDegree at the top margin', () => {
    expect(prerequisiteTargetY(0, 10, 600)).toBeCloseTo(60, 5);
  });

  it('positions the node with the maximum inDegree at the bottom margin', () => {
    expect(prerequisiteTargetY(10, 10, 600)).toBeCloseTo(540, 5);
  });

  it('clamps inDegree values above maxInDegree to the bottom margin', () => {
    expect(prerequisiteTargetY(999, 10, 600)).toBeCloseTo(540, 5);
  });

  it('property: a lower inDegree never yields a strictly greater target Y than a higher inDegree', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 100, max: 4000 }),
        (maxInDegree, a, b, height) => {
          const lower = Math.min(a, b);
          const higher = Math.max(a, b);
          const yLower = prerequisiteTargetY(lower, maxInDegree, height);
          const yHigher = prerequisiteTargetY(higher, maxInDegree, height);
          expect(yLower).toBeLessThanOrEqual(yHigher);
        },
      ),
    );
  });

  it('property: target Y always stays within the vertical margin bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 100, max: 4000 }),
        (inDegree, maxInDegree, height) => {
          const y = prerequisiteTargetY(inDegree, maxInDegree, height);
          expect(y).toBeGreaterThanOrEqual(height * 0.1 - 1e-9);
          expect(y).toBeLessThanOrEqual(height * 0.9 + 1e-9);
        },
      ),
    );
  });
});

describe('createSimulation()', () => {
  it('configures charge, link, collision, and prerequisite forces', () => {
    const nodes: SimulationNode[] = [makeNode('a', { inDegree: 0 }), makeNode('b', { inDegree: 2 })];
    const edges: SimEdge[] = [{ source: nodes[0], target: nodes[1] }];

    const simulation = createSimulation(nodes, edges, 800, 600, () => undefined);

    expect(simulation.force('charge')).toBeDefined();
    expect(simulation.force('link')).toBeDefined();
    expect(simulation.force('collision')).toBeDefined();
    expect(simulation.force('prerequisite')).toBeDefined();

    simulation.stop();
  });

  it('recalculates positions relative to inDegree when graph data changes', () => {
    const lowDegreeNode = makeNode('low', { inDegree: 0 });
    const highDegreeNode = makeNode('high', { inDegree: 5 });
    const nodes: SimulationNode[] = [lowDegreeNode, highDegreeNode];

    const simulation = createSimulation(nodes, [], 800, 600, () => undefined);

    for (let i = 0; i < 300; i++) simulation.tick();
    simulation.stop();

    expect(lowDegreeNode.y ?? 0).toBeLessThan(highDegreeNode.y ?? 0);
  });
});

describe('nodeRadius()', () => {
  it('grows with total connection count but stays within bounds', () => {
    const isolated = nodeRadius(makeNode('a', { inDegree: 0, outDegree: 0 }));
    const wellConnected = nodeRadius(makeNode('b', { inDegree: 20, outDegree: 20 }));

    expect(isolated).toBeGreaterThan(0);
    expect(wellConnected).toBeGreaterThanOrEqual(isolated);
    expect(wellConnected).toBeLessThanOrEqual(24);
  });
});

function buildRenderedGraph(
  nodes: SimulationNode[],
  edges: SimEdge[],
): { root: RootSelection; nodeSelection: NodeSelection; edgeSelection: EdgeSelection } {
  const svg = d3.select(document.createElement('svg'));
  const root = svg.append('g') as unknown as RootSelection;

  const edgeSelection = root.append('g')
    .attr('class', 'edges')
    .selectAll<SVGLineElement, SimEdge>('line')
    .data(edges)
    .join('line')
    .attr('class', 'edge');

  const nodeSelection = root.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, SimulationNode>('g.node')
    .data(nodes, node => node.id)
    .join('g')
    .attr('class', 'node');

  updateSimulationPositions(edgeSelection, nodeSelection);

  return { root, nodeSelection, edgeSelection };
}

describe('animateToSettledPositions()', () => {

  it('animates a node from its starting position toward the target over the given duration', async () => {
    const node = makeNode('a', { x: 0, y: 0 });
    const { nodeSelection, edgeSelection } = buildRenderedGraph([node], []);

    node.x = 100;
    node.y = 200;

    const donePromise = animateToSettledPositions(edgeSelection, nodeSelection, 500);

    await donePromise;

    const el = nodeSelection.node();
    expect(el?.getAttribute('transform')).toBe('translate(100,200)');
  });

  it('animates edge endpoint attributes to the target source/target coordinates', async () => {
    const source = makeNode('a', { x: 0, y: 0 });
    const target = makeNode('b', { x: 0, y: 0 });
    const edge: SimEdge = { source, target };
    const { nodeSelection, edgeSelection } = buildRenderedGraph([source, target], [edge]);

    source.x = 10;
    source.y = 20;
    target.x = 30;
    target.y = 40;

    await animateToSettledPositions(edgeSelection, nodeSelection, 500);

    const edgeEl = edgeSelection.node();
    expect(edgeEl?.getAttribute('x1')).toBe('10');
    expect(edgeEl?.getAttribute('y1')).toBe('20');
    expect(edgeEl?.getAttribute('x2')).toBe('30');
    expect(edgeEl?.getAttribute('y2')).toBe('40');
  });

  it('resolves without throwing even if the transform attribute was not yet set', async () => {
    const svg = d3.select(document.createElement('svg'));
    const root = svg.append('g') as unknown as RootSelection;
    const node = makeNode('a', { x: 5, y: 5 });
    const nodeSelection = root.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, SimulationNode>('g.node')
      .data([node], n => n.id)
      .join('g')
      .attr('class', 'node') as NodeSelection;
    const edgeSelection = root.append('g')
      .selectAll<SVGLineElement, SimEdge>('line')
      .data([] as SimEdge[])
      .join('line') as EdgeSelection;

    await expect(animateToSettledPositions(edgeSelection, nodeSelection, 500)).resolves.toBeUndefined();
    expect(nodeSelection.node()?.getAttribute('transform')).toBe('translate(5,5)');
  });
});
