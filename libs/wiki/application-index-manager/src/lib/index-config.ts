export interface IndexConfig {
  maxRecentSources?: number;
  includeStatistics?: boolean;
  includeQuickReference?: boolean;
}

export const DEFAULT_INDEX_CONFIG: IndexConfig = {
  maxRecentSources: 10,
  includeStatistics: true,
  includeQuickReference: true,
};
