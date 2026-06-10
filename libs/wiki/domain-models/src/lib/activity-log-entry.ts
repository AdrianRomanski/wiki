export interface ActivityLogEntry {
  timestamp: Date;
  type: 'creation' | 'update' | 'ingestion';
  pagePath?: string;
  pageTitle?: string;
  pageType?: 'entity' | 'concept' | 'source';
  changes?: string;
  reason?: string;
  sourcePath?: string;
  generatedPages?: string[];
  tags?: string[];
}
