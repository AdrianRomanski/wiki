export interface ADRMetadata {
  title: string;
  date: string;
  status: 'Accepted' | 'Rejected' | 'Superseded';
  sessionId: string;
  context: string;
  decisionDrivers: string[];
  consideredOptions: string[];
  chosenOption: string;
  rationale: string;
  positiveConsequences: string[];
  negativeConsequences: string[];
  comparisonMatrices?: {
    complexity?: ComparisonMatrix;
    modularity?: ComparisonMatrix;
    bundleSize?: ComparisonMatrix;
    tokenUsage?: ComparisonMatrix;
  };
  libraries: string[];
  researchLinks?: {
    comparisonReport?: string;
    finalReport?: string;
    prototypes?: string[];
  };
  deciders?: string[];
  tags?: string[];
  supersedes?: string;
  supersededBy?: string;
}

export interface ComparisonMatrix {
  title: string;
  headers: string[];
  rows: Map<string, string[]>;
  winner?: Map<string, string>;
}

export interface ADRSourceSummaryOptions {
  metadata: ADRMetadata;
  rawSourcePath: string;
  sessionPath: string;
  includeMatrices?: boolean;
}

export interface ADREntityPageOptions {
  libraryName: string;
  adrMetadata: ADRMetadata;
  sourceSummaryPath: string;
}

export interface SessionReference {
  sessionId: string;
  sessionPath?: string;
  rawADRPath?: string;
  links?: {
    comparisonReport?: string;
    finalReport?: string;
    prototypes?: string[];
  };
}

export interface LinkValidationResult {
  valid: boolean;
  errors: string[];
}
