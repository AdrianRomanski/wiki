/**
 * Core type definitions for the Polished Research Workflow
 * Feature: polished-research-workflow
 */

/**
 * Phase enumeration representing the workflow state machine
 */
export enum Phase {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  ANALYSIS = 'ANALYSIS',
  PROTOTYPING = 'PROTOTYPING',
  DECISION = 'DECISION',
  FINALIZED = 'FINALIZED'
}

/**
 * Research mode selection
 */
export enum ResearchMode {
  SINGLE = 'SINGLE',
  COMPARISON = 'COMPARISON'
}

/**
 * Session status tracking
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  FINALIZED = 'FINALIZED'
}

/**
 * Artifact type enumeration
 */
export enum ArtifactType {
  BIG_PICTURE = 'BIG_PICTURE',
  COMPARISON_VIEW = 'COMPARISON_VIEW',
  PROTOTYPE = 'PROTOTYPE',
  PHASE_REPORT = 'PHASE_REPORT',
  FINAL_REPORT = 'FINAL_REPORT',
  ADR = 'ADR',
  RESEARCH_DECISION_RECORD = 'RESEARCH_DECISION_RECORD'
}

/**
 * Library information tracked in session
 */
export interface LibraryInfo {
  name: string;
  version: string;
  installedAt: string;
  installPath: string;
}

/**
 * Session metadata containing user inputs and configuration
 */
export interface SessionMetadata {
  goal: string;
  mode: ResearchMode;
  libraries: LibraryInfo[];
  documentationLinks: string[];
  userInputs: Record<string, any>;
}

/**
 * Phase history entry tracking phase execution
 */
export interface PhaseHistory {
  phase: Phase;
  startedAt: string;
  completedAt: string | null;
  actions: string[];
}

/**
 * Artifact reference for tracking generated artifacts
 */
export interface ArtifactReference {
  type: ArtifactType;
  name: string;
  path: string;
  createdAt: string;
}

/**
 * Research session state
 */
export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  currentPhase: Phase;
  completedPhases: Phase[];
  metadata: SessionMetadata;
  artifacts: ArtifactReference[];
  history: PhaseHistory[];
}

/**
 * Session summary for listing sessions
 */
export interface SessionSummary {
  id: string;
  goal: string;
  mode: ResearchMode;
  status: SessionStatus;
  currentPhase: Phase;
  createdAt: string;
  updatedAt: string;
  libraryCount: number;
}

/**
 * Phase transition definition
 */
export interface PhaseTransition {
  from: Phase;
  to: Phase;
  condition: () => boolean;
  action: () => Promise<void>;
}
