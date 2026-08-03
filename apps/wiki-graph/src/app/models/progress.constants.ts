/**
 * Color and styling constants for progress visualization.
 * These constants map progress states and node types to colors for the graph renderer.
 */

import { ProgressState } from './progress.models';
import { NodeType } from './graph.models';

/**
 * Color mapping for progress states.
 * Used in progress-focused visualization mode.
 */
export const PROGRESS_COLORS: Record<ProgressState, string> = {
  Not_Started: '#9ca3af',  // grey - concept not yet started
  In_Progress: '#fbbf24',  // yellow - concept currently being learned
  Understood: '#3b82f6',   // blue - concept understood but not mastered
  Mastered: '#10b981'      // green - concept fully mastered
} as const;

/**
 * Human-readable labels for progress states.
 * Used for ARIA labels and screen reader announcements in the graph renderer.
 */
export const PROGRESS_STATE_LABELS: Record<ProgressState, string> = {
  Not_Started: 'Not Started',
  In_Progress: 'In Progress',
  Understood: 'Understood',
  Mastered: 'Mastered'
} as const;

/**
 * Color mapping for wiki node types.
 * Used in wiki structure visualization mode (not progress-focused).
 */
export const WIKI_NODE_COLORS: Record<NodeType, string> = {
  entity: '#8b5cf6',    // purple - entities (libraries, tools, frameworks)
  concept: '#06b6d4',   // cyan - concepts (patterns, principles, techniques)
  source: '#f59e0b'     // amber - sources (articles, documentation, books)
} as const;

/**
 * Visualization mode for the graph renderer
 */
export type VisualizationMode = 'wiki' | 'progress';

/**
 * Default node size in pixels
 */
export const DEFAULT_NODE_SIZE = 8;

/**
 * Default edge/link color
 */
export const DEFAULT_EDGE_COLOR = '#cbd5e1'; // slate-300

/**
 * Highlighted edge color (when node is selected)
 */
export const HIGHLIGHTED_EDGE_COLOR = '#475569'; // slate-600

/**
 * Default animation duration in milliseconds
 */
export const DEFAULT_ANIMATION_DURATION = 500;
