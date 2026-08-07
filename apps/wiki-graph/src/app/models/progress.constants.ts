
import { ProgressState } from './progress.models';
import { NodeType } from './graph.models';

export const PROGRESS_COLORS: Record<ProgressState, string> = {
  Not_Started: '#9ca3af',  
  In_Progress: '#fbbf24',  
  Understood: '#3b82f6',   
  Mastered: '#10b981'      
} as const;

export const PROGRESS_STATE_LABELS: Record<ProgressState, string> = {
  Not_Started: 'Not Started',
  In_Progress: 'In Progress',
  Understood: 'Understood',
  Mastered: 'Mastered'
} as const;

export const WIKI_NODE_COLORS: Record<NodeType, string> = {
  entity: '#8b5cf6',    
  concept: '#06b6d4',   
  source: '#f59e0b'     
} as const;

export type VisualizationMode = 'wiki' | 'progress';

export const DEFAULT_NODE_SIZE = 8;

export const DEFAULT_EDGE_COLOR = '#cbd5e1'; 

export const HIGHLIGHTED_EDGE_COLOR = '#475569'; 

export const DEFAULT_ANIMATION_DURATION = 500;
