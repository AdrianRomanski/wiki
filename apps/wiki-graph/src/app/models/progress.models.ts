/**
 * Progress tracking models for the Knowledge Progress Graph feature.
 * These models define the data structures for tracking learning progress across concepts.
 */

/**
 * Represents the learning status of a concept.
 * Progress flows from Not_Started → In_Progress → Understood → Mastered
 */
export type ProgressState =
  | 'Not_Started'
  | 'In_Progress'
  | 'Understood'
  | 'Mastered';

/**
 * Represents a single concept's progress data.
 * Stored as individual JSON files in wiki/progress/concepts/
 */
export interface ProgressEntry {
  /** Kebab-case identifier matching wiki entity/concept */
  conceptId: string;
  /** Human-readable concept title */
  conceptTitle: string;
  /** Current learning state */
  state: ProgressState;
  /** ISO 8601 timestamp of last assessment */
  lastAssessed: string;
  /** Number of times this concept has been assessed */
  assessmentCount: number;
  /** Schema version for migration support */
  version: string;
}

/**
 * Represents the progress index metadata.
 * Stored as wiki/progress/index.json for quick lookups
 */
export interface ProgressIndex {
  /** Schema version */
  version: string;
  /** ISO 8601 timestamp of last update */
  lastUpdated: string;
  /** Total number of concepts tracked */
  totalConcepts: number;
  /** List of all concept IDs with progress data */
  conceptIds: string[];
}

/**
 * Statistics derived from progress data for dashboard display
 */
export interface ProgressStats {
  /** Total number of concepts */
  total: number;
  /** Count of concepts in Not_Started state */
  notStarted: number;
  /** Count of concepts in In_Progress state */
  inProgress: number;
  /** Count of concepts in Understood state */
  understood: number;
  /** Count of concepts in Mastered state */
  mastered: number;
  /** Percentage of concepts at Understood or Mastered (0-100) */
  percentComplete: number;
}
