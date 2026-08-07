
export type ProgressState =
  | 'Not_Started'
  | 'In_Progress'
  | 'Understood'
  | 'Mastered';

export interface ProgressEntry {

  conceptId: string;

  conceptTitle: string;

  state: ProgressState;

  lastAssessed: string;

  assessmentCount: number;

  version: string;
}

export interface ProgressIndex {

  version: string;

  lastUpdated: string;

  totalConcepts: number;

  conceptIds: string[];
}

export interface ProgressStats {

  total: number;

  notStarted: number;

  inProgress: number;

  understood: number;

  mastered: number;

  percentComplete: number;
}
