import type * as d3 from 'd3';
import type { ProgressState } from './progress.models';

export type NodeType = 'entity' | 'concept' | 'source';

export interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  tags: string[];
  filePath: string;
  isGhost: boolean;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
}

export interface GraphData {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  allTags: string[];
}

export interface SimulationNode extends GraphNode, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface WikiManifest {
  files: string[];
  generatedAt: string;
}

/**
 * Extends GraphNode with progress tracking data, used when rendering
 * the graph in progress visualization mode.
 */
export interface GraphNodeWithProgress extends GraphNode {
  progressState: ProgressState;
  lastAssessed: string | null;
  assessmentCount: number;
}

/**
 * Extends GraphData with a lookup of progress states per concept ID,
 * produced by GraphStateService.applyProgressData().
 */
export interface GraphDataWithProgress extends GraphData {
  progressStates: Map<string, ProgressState>;
}
