import type * as d3 from 'd3';
import type { SimulationNode } from '../models/graph.models';

export interface SimEdge extends d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
}

export interface NodePosition {
  x: number;
  y: number;
}

export type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
export type RootSelection = d3.Selection<SVGGElement, unknown, null, undefined>;
export type EdgeSelection = d3.Selection<SVGLineElement, SimEdge, SVGGElement, unknown>;
export type NodeSelection = d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>;
export type ForceSimulation = d3.Simulation<SimulationNode, SimEdge>;
