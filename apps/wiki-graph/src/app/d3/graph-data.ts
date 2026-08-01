import type { GraphData, SimulationNode } from '../models/graph.models';
import type { SimEdge } from './renderer.types';

export function createVisibleGraph(
  data: GraphData,
  visibleNodeIds: Set<string>,
): { nodes: SimulationNode[]; edges: SimEdge[] } {
  const allNodes = Array.from(data.nodes.values()) as SimulationNode[];
  const nodes = allNodes.filter(
    node => visibleNodeIds.size === 0 || visibleNodeIds.has(node.id),
  );
  const visibleIds = new Set(nodes.map(node => node.id));
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const edges = data.edges
    .filter(edge => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId))
    .reduce<SimEdge[]>((result, edge) => {
      const source = nodeById.get(edge.sourceId);
      const target = nodeById.get(edge.targetId);

      if (source && target) {
        result.push({ source, target });
      }

      return result;
    }, []);

  return { nodes, edges };
}
