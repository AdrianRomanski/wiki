export interface MaintenanceReport {
  timestamp: Date;
  duplicates: {
    page1: string;
    page2: string;
    similarity: number;
    recommendation: string;
  }[];
  contradictions: {
    pages: string[];
    contradiction: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  brokenLinks: {
    page: string;
    brokenLinks: string[];
  }[];
  consolidationOpportunities: {
    pages: string[];
    reason: string;
    suggestedAction: string;
  }[];
  orphans: {
    page: string;
    reason: string;
  }[];
  summary: {
    totalPages: number;
    totalLinks: number;
    healthScore: number;
  };
  adrFindings?: {
    brokenSessionReferences: {
      page: string;
      sessionId: string;
      errors: string[];
      suggestedActions: string[];
    }[];
    duplicateLibraries: {
      libraryName: string;
      entityPages: string[];
      referencedByADRs: string[];
      suggestedAction: string;
    }[];
    supersededDecisions: {
      page: string;
      title: string;
      status: string;
      supersededBy?: string;
      recommendation: string;
    }[];
    adrCrossReferenceIssues: {
      page: string;
      brokenLinks: string[];
      suggestedActions: string[];
    }[];
  };
}
