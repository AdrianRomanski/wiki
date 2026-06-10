export interface ADRIngestionOptions {
  sessionPath: string;
  sessionId: string;
  generateEntityPages?: boolean;
  addCrossReferences?: boolean;
  config?: {
    rootDir?: string;
    wikiDir?: string;
    rawDir?: string;
  };
}

export interface ADRIngestionResult {
  rawADRPath: string;
  sourceSummary: {
    path: string;
    frontmatter: any;
  };
  entityPages: Array<{
    path: string;
    frontmatter: any;
  }>;
  writtenPaths: string[];
  sessionReference: {
    sessionId: string;
    sessionPath: string;
    researchLinks?: {
      comparisonReport?: string;
      finalReport?: string;
      prototypes?: string[];
    };
  };
}

export async function runADRIngestionWorkflow(
  options: ADRIngestionOptions
): Promise<ADRIngestionResult> {
  throw new Error(
    'runADRIngestionWorkflow is not yet implemented in the refactored library structure. ' +
    'This function needs to be migrated from scripts/wiki/adr-workflow.ts'
  );
}
