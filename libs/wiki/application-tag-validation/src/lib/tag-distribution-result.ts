export interface TagViolation {
  tag: string;
  count: number;
  frequency: number;
  pages: string[];
}

export interface TagDistributionResult {
  totalPages: number;
  tagCounts: Map<string, number>;
  violations: TagViolation[];
  /** true iff no tag exceeds the 60% frequency threshold */
  passed: boolean;
}
