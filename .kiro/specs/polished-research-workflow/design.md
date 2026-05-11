# Design Document: Polished Research Workflow

**Feature**: polished-research-workflow  
**Date**: 2024-01-15  
**Status**: Draft

## Overview

The Polished Research Workflow feature transforms the existing research-buddy skill from an ad-hoc research assistant into a structured, guided 4-phase workflow system. This enhancement provides developers with a systematic approach to library research and comparison, ensuring libraries are installed before analysis, generating comprehensive visualizations, supporting both single-library and multi-library comparison modes, and producing decision artifacts for documentation.

### Key Capabilities

1. **Structured 4-Phase Workflow**: Setup → Analysis → Prototyping → Decision
2. **Library Installation Management**: Ensures libraries are in node_modules before research begins
3. **Big Picture Visualization**: Comprehensive structure and capability analysis
4. **Comparison Mode**: Side-by-side analysis of 2-3 libraries
5. **Session State Management**: Pause, resume, and track research progress
6. **Artifact Generation**: Reports, ADRs, and Research Decision Records

### Design Goals

- Provide clear guidance through the research process
- Ensure research is based on actual installed code (node_modules as source of truth)
- Support both exploratory (single library) and decision-making (comparison) workflows
- Generate comprehensive documentation artifacts
- Integrate seamlessly with existing research-buddy capabilities
- Maintain session state for long-running research activities

## Architecture

### High-Level Architecture

The polished research workflow is implemented as an enhancement to the existing research-buddy skill, adding a state machine-based workflow orchestrator that guides users through four distinct phases while leveraging existing research capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    Research Buddy Skill                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Workflow Orchestrator (NEW)                   │  │
│  │  - Phase State Machine                                │  │
│  │  - Session Manager                                    │  │
│  │  - User Prompt Handler                                │  │
│  │  - Artifact Coordinator                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┴──────────────────────────────┐  │
│  │                                                        │  │
│  ▼                        ▼                        ▼      │  │
│ ┌──────────┐      ┌──────────────┐      ┌──────────────┐ │  │
│ │  Phase 1 │      │   Phase 2    │      │   Phase 3    │ │  │
│ │  Setup   │─────▶│   Analysis   │─────▶│  Prototyping │ │  │
│ └──────────┘      └──────────────┘      └──────────────┘ │  │
│      │                    │                      │        │  │
│      └────────────────────┴──────────────────────┘        │  │
│                           │                                │  │
│                           ▼                                │  │
│                  ┌──────────────┐                          │  │
│                  │   Phase 4    │                          │  │
│                  │   Decision   │                          │  │
│                  └──────────────┘                          │  │
│                                                            │  │
│  ┌───────────────────────────────────────────────────────┐│  │
│  │      Existing Research Buddy Capabilities (REUSE)     ││  │
│  │  - Library Visualization                              ││  │
│  │  - Complexity Analysis                                ││  │
│  │  - Modularity Analysis                                ││  │
│  │  - Comparison Matrices                                ││  │
│  │  - Minimal Example Generation                         ││  │
│  │  - ADR Generation                                     ││  │
│  │  - Report Generation                                  ││  │
│  └───────────────────────────────────────────────────────┘│  │
│                                                            │  │
│  ┌───────────────────────────────────────────────────────┐│  │
│  │           Infrastructure Services                     ││  │
│  │  - npm Installation Manager                           ││  │
│  │  - node_modules Verifier                              ││  │
│  │  - File System Manager                                ││  │
│  │  - Session Persistence                                ││  │
│  └───────────────────────────────────────────────────────┘│  │
└─────────────────────────────────────────────────────────────┘
```

### Phase State Machine

The workflow is modeled as a finite state machine with four primary states and transition rules:

```
                    ┌──────────┐
                    │  IDLE    │
                    └────┬─────┘
                         │ start_workflow()
                         ▼
                    ┌──────────┐
              ┌────▶│  SETUP   │◀────┐
              │     └────┬─────┘     │
              │          │            │
              │          │ complete_setup()
              │          ▼            │
              │     ┌──────────┐     │
              │     │ ANALYSIS │     │ pause()
              │     └────┬─────┘     │
              │          │            │
              │          │ complete_analysis() / skip_analysis()
              │          ▼            │
              │     ┌──────────┐     │
              │     │PROTOTYPING│────┘
              │     └────┬─────┘
              │          │
              │          │ complete_prototyping()
              │          ▼
              │     ┌──────────┐
              │     │ DECISION │
              │     └────┬─────┘
              │          │
              │          │ finalize()
              │          ▼
              │     ┌──────────┐
              └─────│FINALIZED │
                    └──────────┘
                    
State Transitions:
- IDLE → SETUP: User starts workflow
- SETUP → ANALYSIS: Libraries installed, metadata collected
- ANALYSIS → PROTOTYPING: Big picture complete or skipped
- PROTOTYPING → DECISION: Examples created
- DECISION → FINALIZED: Decision made, artifacts generated
- Any → IDLE: User pauses (state saved)
- IDLE → Previous State: User resumes (state restored)
```

### Component Responsibilities

#### Workflow Orchestrator
- Manages current phase state
- Enforces phase transition rules
- Coordinates user prompts and input collection
- Delegates to existing research-buddy capabilities
- Triggers artifact generation at phase boundaries

#### Session Manager
- Persists session state to `session.json`
- Tracks phase completion status
- Stores user inputs and library metadata
- Manages session lifecycle (create, pause, resume, finalize)
- Validates session integrity on resume

#### Library Installation Manager
- Checks for existing installations in node_modules
- Executes npm install commands
- Verifies successful installation
- Records installed versions
- Handles installation errors and retries

#### Big Picture Analyzer (NEW)
- Analyzes library structure from node_modules
- Categorizes capabilities into logical groups
- Identifies entry points and exports
- Generates comprehensive visualizations
- Creates comparison views for multiple libraries

#### Artifact Coordinator
- Manages artifact naming and organization
- Generates reports at phase boundaries
- Creates ADRs with decision context
- Integrates with wiki for Research Decision Records
- Maintains artifact index

## Components and Interfaces

### Workflow Orchestrator

```typescript
interface WorkflowOrchestrator {
  // Workflow lifecycle
  startWorkflow(): Promise<void>;
  pauseWorkflow(): Promise<void>;
  resumeWorkflow(sessionId: string): Promise<void>;
  
  // Phase management
  getCurrentPhase(): Phase;
  transitionToPhase(phase: Phase): Promise<void>;
  canTransitionTo(phase: Phase): boolean;
  
  // Phase execution
  executeSetupPhase(): Promise<void>;
  executeAnalysisPhase(): Promise<void>;
  executePrototypingPhase(): Promise<void>;
  executeDecisionPhase(): Promise<void>;
}

enum Phase {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  ANALYSIS = 'ANALYSIS',
  PROTOTYPING = 'PROTOTYPING',
  DECISION = 'DECISION',
  FINALIZED = 'FINALIZED'
}

interface PhaseTransition {
  from: Phase;
  to: Phase;
  condition: () => boolean;
  action: () => Promise<void>;
}
```

### Session Manager

```typescript
interface SessionManager {
  // Session lifecycle
  createSession(metadata: SessionMetadata): Promise<Session>;
  loadSession(sessionId: string): Promise<Session>;
  saveSession(session: Session): Promise<void>;
  finalizeSession(session: Session): Promise<void>;
  
  // Session queries
  getActiveSession(): Session | null;
  listSessions(): Promise<SessionSummary[]>;
  getSessionById(sessionId: string): Promise<Session | null>;
}

interface Session {
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

interface SessionMetadata {
  goal: string;
  mode: ResearchMode;
  libraries: LibraryInfo[];
  documentationLinks: string[];
  userInputs: Record<string, any>;
}

enum ResearchMode {
  SINGLE = 'SINGLE',
  COMPARISON = 'COMPARISON'
}

interface LibraryInfo {
  name: string;
  version: string;
  installedAt: string;
  installPath: string;
}

enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  FINALIZED = 'FINALIZED'
}

interface PhaseHistory {
  phase: Phase;
  startedAt: string;
  completedAt: string | null;
  actions: string[];
}
```

### Library Installation Manager

```typescript
interface LibraryInstallationManager {
  // Installation operations
  installLibrary(libraryName: string): Promise<InstallationResult>;
  verifyInstallation(libraryName: string): Promise<boolean>;
  getInstalledVersion(libraryName: string): Promise<string | null>;
  reinstallLibrary(libraryName: string): Promise<InstallationResult>;
  
  // Batch operations
  installLibraries(libraryNames: string[]): Promise<InstallationResult[]>;
  verifyLibraries(libraryNames: string[]): Promise<VerificationResult>;
}

interface InstallationResult {
  libraryName: string;
  success: boolean;
  version: string | null;
  error: string | null;
  installPath: string | null;
}

interface VerificationResult {
  allVerified: boolean;
  results: Map<string, boolean>;
  missingLibraries: string[];
}
```

### Big Picture Analyzer

```typescript
interface BigPictureAnalyzer {
  // Analysis operations
  analyzeLibrary(libraryName: string): Promise<LibraryAnalysis>;
  generateVisualization(analysis: LibraryAnalysis): string;
  generateComparisonView(analyses: LibraryAnalysis[]): string;
  
  // Structure analysis
  analyzeStructure(libraryPath: string): Promise<StructureAnalysis>;
  categorizeCapabilities(structure: StructureAnalysis): CapabilityCategories;
  identifyEntryPoints(libraryPath: string): Promise<EntryPoint[]>;
}

interface LibraryAnalysis {
  libraryName: string;
  version: string;
  structure: StructureAnalysis;
  capabilities: CapabilityCategories;
  entryPoints: EntryPoint[];
  publicAPI: APIExport[];
  dependencies: DependencyInfo[];
}

interface StructureAnalysis {
  rootPath: string;
  directories: DirectoryNode[];
  files: FileNode[];
  totalFiles: number;
  totalDirectories: number;
}

interface CapabilityCategories {
  categories: Map<string, Capability[]>;
  uncategorized: Capability[];
}

interface Capability {
  name: string;
  type: 'component' | 'directive' | 'service' | 'function' | 'class' | 'interface';
  description: string;
  exportPath: string;
}

interface EntryPoint {
  path: string;
  type: 'main' | 'secondary' | 'submodule';
  exports: string[];
}

interface APIExport {
  name: string;
  type: string;
  signature: string;
  documentation: string | null;
}

interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependency' | 'peerDependency' | 'devDependency';
}
```

### Artifact Coordinator

```typescript
interface ArtifactCoordinator {
  // Artifact generation
  generatePhaseReport(phase: Phase, session: Session): Promise<Artifact>;
  generateFinalReport(session: Session): Promise<Artifact>;
  generateADR(session: Session, decision: Decision): Promise<Artifact>;
  generateResearchDecisionRecord(session: Session): Promise<Artifact>;
  
  // Artifact management
  saveArtifact(artifact: Artifact, session: Session): Promise<string>;
  listArtifacts(session: Session): Promise<ArtifactReference[]>;
  generateArtifactIndex(session: Session): Promise<void>;
}

interface Artifact {
  type: ArtifactType;
  name: string;
  content: string;
  metadata: ArtifactMetadata;
}

enum ArtifactType {
  BIG_PICTURE = 'BIG_PICTURE',
  COMPARISON_VIEW = 'COMPARISON_VIEW',
  PROTOTYPE = 'PROTOTYPE',
  PHASE_REPORT = 'PHASE_REPORT',
  FINAL_REPORT = 'FINAL_REPORT',
  ADR = 'ADR',
  RESEARCH_DECISION_RECORD = 'RESEARCH_DECISION_RECORD'
}

interface ArtifactMetadata {
  createdAt: string;
  phase: Phase;
  relatedLibraries: string[];
  tags: string[];
}

interface ArtifactReference {
  type: ArtifactType;
  name: string;
  path: string;
  createdAt: string;
}

interface Decision {
  selectedLibrary: string | null;
  rationale: string;
  comparisonData: ComparisonData;
}

interface ComparisonData {
  complexityScores: Map<string, number>;
  modularityScores: Map<string, number>;
  bundleSizes: Map<string, BundleSize>;
  tokenEstimates: Map<string, TokenEstimate>;
}
```

### User Prompt Handler

```typescript
interface UserPromptHandler {
  // Prompt operations
  promptForGoal(): Promise<string>;
  promptForResearchMode(): Promise<ResearchMode>;
  promptForLibraries(mode: ResearchMode): Promise<string[]>;
  promptForDocumentationLinks(): Promise<string[]>;
  promptForBigPictureAnalysis(): Promise<boolean>;
  promptForPrototypeRequest(): Promise<string | null>;
  promptForDecision(libraries: string[]): Promise<string>;
  promptForWikiIntegration(): Promise<boolean>;
  promptForPhaseSkip(phase: Phase): Promise<boolean>;
  
  // Confirmation prompts
  confirmReinstall(libraryName: string): Promise<boolean>;
  confirmSkipPhase(phase: Phase): Promise<boolean>;
  confirmFinalization(): Promise<boolean>;
}
```

## Data Models

### Session Storage Format (session.json)

```json
{
  "id": "focus-trap-research-2024-01-15",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z",
  "status": "ACTIVE",
  "currentPhase": "PROTOTYPING",
  "completedPhases": ["SETUP", "ANALYSIS"],
  "metadata": {
    "goal": "Compare focus trap libraries for modal dialog implementation",
    "mode": "COMPARISON",
    "libraries": [
      {
        "name": "@angular/cdk/a11y",
        "version": "17.0.0",
        "installedAt": "2024-01-15T10:35:00Z",
        "installPath": "node_modules/@angular/cdk/a11y"
      },
      {
        "name": "focus-trap",
        "version": "7.5.4",
        "installedAt": "2024-01-15T10:36:00Z",
        "installPath": "node_modules/focus-trap"
      }
    ],
    "documentationLinks": [
      "https://material.angular.io/cdk/a11y/overview",
      "https://github.com/focus-trap/focus-trap"
    ],
    "userInputs": {
      "bigPictureRequested": true,
      "prototypeRequests": [
        "Basic focus trap for modal",
        "Focus trap with initial focus"
      ]
    }
  },
  "artifacts": [
    {
      "type": "BIG_PICTURE",
      "name": "angular-cdk-a11y-big-picture.md",
      "path": "libraries/@angular-cdk-a11y/big-picture.md",
      "createdAt": "2024-01-15T11:00:00Z"
    },
    {
      "type": "BIG_PICTURE",
      "name": "focus-trap-big-picture.md",
      "path": "libraries/focus-trap/big-picture.md",
      "createdAt": "2024-01-15T11:15:00Z"
    },
    {
      "type": "COMPARISON_VIEW",
      "name": "comparison-view.md",
      "path": "comparison-view.md",
      "createdAt": "2024-01-15T11:30:00Z"
    }
  ],
  "history": [
    {
      "phase": "SETUP",
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:40:00Z",
      "actions": [
        "Collected goal",
        "Selected COMPARISON mode",
        "Installed @angular/cdk/a11y",
        "Installed focus-trap",
        "Collected documentation links"
      ]
    },
    {
      "phase": "ANALYSIS",
      "startedAt": "2024-01-15T10:40:00Z",
      "completedAt": "2024-01-15T11:35:00Z",
      "actions": [
        "Generated big picture for @angular/cdk/a11y",
        "Generated big picture for focus-trap",
        "Generated comparison view"
      ]
    },
    {
      "phase": "PROTOTYPING",
      "startedAt": "2024-01-15T11:35:00Z",
      "completedAt": null,
      "actions": [
        "Created prototype: basic-focus-trap-modal.ts"
      ]
    }
  ]
}
```

### Directory Structure

```
.kiro/research/
├── sessions/
│   └── [session-id]/
│       ├── session.json                    # Session state and metadata
│       ├── libraries/
│       │   ├── [library-1]/
│       │   │   ├── big-picture.md          # Structure visualization
│       │   │   ├── analysis.md             # Complexity/modularity analysis
│       │   │   ├── examples/               # Library-specific examples
│       │   │   └── metrics.json            # Quantitative metrics
│       │   └── [library-2]/
│       │       └── ...
│       ├── prototypes/
│       │   ├── basic-example.ts
│       │   ├── advanced-example.ts
│       │   └── README.md                   # Prototype index
│       ├── comparison-view.md              # Side-by-side comparison
│       ├── phase-reports/
│       │   ├── setup-report.md
│       │   ├── analysis-report.md
│       │   └── prototyping-report.md
│       ├── final-report.md                 # Complete research summary
│       ├── decision.adr.md                 # Architecture Decision Record
│       └── artifacts-index.md              # All artifacts with descriptions
└── adrs/
    └── [YYYY-MM-DD]-[decision].md          # Archived ADRs
```

## Error Handling

### Installation Errors

**Error**: Library installation fails
- **Detection**: npm install returns non-zero exit code
- **Recovery**: 
  1. Display error message to user
  2. Offer to retry with corrected library name
  3. Offer to skip library and continue with others
  4. Prevent phase transition if all libraries fail

**Error**: Library not found in node_modules after installation
- **Detection**: Verification check fails after successful npm install
- **Recovery**:
  1. Report verification failure
  2. Attempt reinstallation
  3. If still fails, mark library as unavailable
  4. Continue with remaining libraries if in comparison mode

### Session State Errors

**Error**: Session file corrupted or invalid
- **Detection**: JSON parse error or schema validation failure
- **Recovery**:
  1. Attempt to load backup session file
  2. If no backup, offer to start new session
  3. Log corruption details for debugging

**Error**: Referenced library missing on session resume
- **Detection**: Library verification fails during resume
- **Recovery**:
  1. Notify user of missing library
  2. Offer to reinstall library
  3. If user declines, mark library as unavailable
  4. Continue with available libraries

### Phase Transition Errors

**Error**: Attempting invalid phase transition
- **Detection**: Phase transition validation fails
- **Recovery**:
  1. Display current phase and valid next phases
  2. Explain why transition is invalid
  3. Suggest required actions to enable transition

**Error**: Required artifacts missing for phase transition
- **Detection**: Artifact validation fails before transition
- **Recovery**:
  1. List missing required artifacts
  2. Offer to generate missing artifacts
  3. Prevent transition until artifacts exist

### Artifact Generation Errors

**Error**: File system write failure
- **Detection**: File write operation throws error
- **Recovery**:
  1. Check disk space and permissions
  2. Retry write operation
  3. If fails, store artifact in memory
  4. Notify user of persistence failure

**Error**: Template rendering failure
- **Detection**: Template engine throws error
- **Recovery**:
  1. Log template error details
  2. Generate simplified artifact without template
  3. Notify user of degraded output

## Testing Strategy

### Unit Testing

**Session Manager Tests**:
- Create session with valid metadata
- Load existing session from file
- Save session state to file
- Handle corrupted session files
- List all sessions
- Finalize session and mark read-only

**Library Installation Manager Tests**:
- Install single library successfully
- Handle installation failure
- Verify library exists in node_modules
- Get installed version
- Install multiple libraries in batch
- Handle partial batch installation failure

**Big Picture Analyzer Tests**:
- Analyze library structure from node_modules
- Categorize capabilities correctly
- Identify entry points
- Generate visualization markdown
- Generate comparison view for multiple libraries
- Handle missing or malformed library structure

**Workflow Orchestrator Tests**:
- Start workflow and initialize session
- Transition between phases correctly
- Enforce phase transition rules
- Pause and resume workflow
- Handle invalid phase transitions
- Execute each phase successfully

**Artifact Coordinator Tests**:
- Generate phase reports
- Generate final report
- Generate ADR with decision data
- Save artifacts to correct locations
- Generate artifact index
- Handle file system errors

### Integration Testing

**End-to-End Workflow Tests**:
- Complete single-library workflow from start to finalization
- Complete comparison workflow with 2 libraries
- Complete comparison workflow with 3 libraries
- Pause workflow mid-phase and resume
- Skip analysis phase and continue
- Handle library installation failure and recovery

**Session Persistence Tests**:
- Save session state at each phase
- Resume session from each phase
- Verify session integrity after resume
- Handle concurrent session access

**Artifact Generation Tests**:
- Generate all artifact types
- Verify artifact content correctness
- Verify artifact file structure
- Verify artifact cross-references

### Manual Testing Scenarios

**Scenario 1: First-time user with single library**
1. Start workflow
2. Provide goal: "Learn focus-trap library"
3. Select single library mode
4. Enter library: "focus-trap"
5. Request big picture analysis
6. Create 2 minimal examples
7. Finalize and generate ADR

**Scenario 2: Comparison of 3 libraries**
1. Start workflow
2. Provide goal: "Choose focus trap solution"
3. Select comparison mode
4. Enter libraries: "@angular/cdk/a11y", "focus-trap", "aria-modal"
5. Request big picture analysis
6. Review comparison view
7. Create prototype for top 2 candidates
8. Select winner and finalize

**Scenario 3: Resume paused session**
1. Start workflow and complete setup
2. Pause during analysis phase
3. Resume session by ID
4. Verify state restored correctly
5. Continue to completion

**Scenario 4: Handle installation failure**
1. Start workflow
2. Enter invalid library name
3. Observe installation failure
4. Correct library name
5. Retry installation
6. Continue workflow


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Input Validation by Research Mode

*For any* research mode selection and library name list, the validation SHALL accept the input if and only if: (1) in SINGLE mode with exactly 1 library, or (2) in COMPARISON mode with 2-3 libraries, and SHALL reject all other combinations.

**Validates: Requirements 1.3, 1.4, 7.6**

### Property 2: Session Metadata Completeness

*For any* session creation with user inputs (goal, mode, libraries, documentation links), the persisted session metadata SHALL contain all provided inputs with no data loss.

**Validates: Requirements 1.8, 6.6, 8.3**

### Property 3: Sequential Phase Progression

*For any* valid phase completion, the workflow SHALL transition to the next sequential phase in the order: SETUP → ANALYSIS → PROTOTYPING → DECISION → FINALIZED, with no phase skipped unless explicitly requested by the user.

**Validates: Requirements 1.9, 2.12, 3.6**

### Property 4: Artifact Generation Completeness

*For any* research session in SINGLE mode with 1 library, exactly 1 big picture visualization SHALL be generated; *for any* session in COMPARISON mode with N libraries (where 2 ≤ N ≤ 3), exactly N big picture visualizations SHALL be generated.

**Validates: Requirements 2.3, 2.4, 7.1**

### Property 5: Session Persistence Round-Trip

*For any* session state at any phase, pausing (serializing) then resuming (deserializing) the session SHALL preserve all session data including current phase, completed phases, metadata, artifacts, and history with no data loss.

**Validates: Requirements 5.3, 5.4, 8.1, 8.2**

### Property 6: Phase Transition Prerequisites

*For any* phase transition request, if required artifacts from prerequisite phases are missing, the transition SHALL be blocked and the session SHALL remain in the current phase.

**Validates: Requirements 5.6**

### Property 7: Session Finalization Immutability

*For any* session that has been finalized, all subsequent modification attempts (adding artifacts, changing phase, updating metadata) SHALL be rejected and the session state SHALL remain unchanged.

**Validates: Requirements 4.8, 8.7**

### Property 8: History Accumulation

*For any* sequence of phase completions, the session history SHALL contain entries for all completed phases in chronological order with no duplicates or omissions.

**Validates: Requirements 8.6**

### Property 9: Artifact Index Completeness

*For any* finalized session with N artifacts, the generated artifact index SHALL contain exactly N artifact references with paths and descriptions, with no missing or duplicate entries.

**Validates: Requirements 9.4, 9.8**

### Property 10: Artifact Organization Compliance

*For any* generated artifact, the file path SHALL conform to the defined directory structure (`.kiro/research/sessions/[session-id]/[artifact-type]/[filename]`) and the filename SHALL follow the established naming conventions.

**Validates: Requirements 9.6, 9.7, 10.6, 10.7**

### Property 11: ADR Template Compliance

*For any* generated ADR, the document SHALL contain all required template sections: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, and Comparison Summary.

**Validates: Requirements 4.5, 9.5**

### Property 12: Categorization Completeness

*For any* set of library capabilities analyzed during big picture generation, all capabilities SHALL be assigned to exactly one category with no capabilities left uncategorized and no capability appearing in multiple categories.

**Validates: Requirements 2.6**

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to achieve comprehensive coverage:

- **Unit tests**: Verify specific scenarios, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all valid inputs for core logic components

### Property-Based Testing

**Library Selection**: fast-check (TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Organization**: Each property test SHALL include a comment tag referencing the design property:
```typescript
// Feature: polished-research-workflow, Property 1: Input Validation by Research Mode
```

**Testable Components**:

1. **Input Validation Logic** (Properties 1, 6)
   - Generate random research modes and library lists
   - Verify validation rules are enforced correctly
   - Test prerequisite checking for phase transitions

2. **Session Serialization** (Properties 2, 5, 8)
   - Generate random session states
   - Test round-trip serialization/deserialization
   - Verify metadata completeness
   - Verify history accumulation

3. **State Machine Logic** (Properties 3, 7)
   - Generate random phase transition sequences
   - Verify sequential progression
   - Test finalization immutability

4. **Artifact Management** (Properties 4, 9, 10, 11, 12)
   - Generate random artifact sets
   - Verify artifact counts match expectations
   - Test path and naming compliance
   - Verify template compliance
   - Test categorization completeness

### Unit Testing

**Session Manager**:
- Create session with valid metadata
- Load existing session from file
- Save session state to file
- Handle corrupted session files
- List all sessions
- Finalize session and mark read-only
- Verify session status transitions

**Library Installation Manager**:
- Install single library successfully
- Handle installation failure gracefully
- Verify library exists in node_modules
- Get installed version information
- Install multiple libraries in batch
- Handle partial batch installation failure
- Prompt for reinstall when library exists

**Big Picture Analyzer**:
- Analyze library structure from node_modules
- Categorize capabilities correctly
- Identify entry points and exports
- Generate visualization markdown
- Generate comparison view for multiple libraries
- Handle missing or malformed library structure

**Workflow Orchestrator**:
- Start workflow and initialize session
- Transition between phases correctly
- Enforce phase transition rules
- Pause and resume workflow
- Handle invalid phase transitions
- Execute each phase successfully
- Skip phases when requested

**Artifact Coordinator**:
- Generate phase reports
- Generate final report with all findings
- Generate ADR with decision data
- Save artifacts to correct locations
- Generate artifact index
- Handle file system errors
- Follow naming conventions

**User Prompt Handler**:
- Collect goal from user
- Collect research mode selection
- Collect library names with validation
- Collect optional documentation links
- Prompt for big picture analysis
- Prompt for prototype requests
- Prompt for decision
- Prompt for wiki integration

### Integration Testing

**End-to-End Workflow Tests**:
- Complete single-library workflow from start to finalization
- Complete comparison workflow with 2 libraries
- Complete comparison workflow with 3 libraries
- Pause workflow mid-phase and resume successfully
- Skip analysis phase and continue to prototyping
- Handle library installation failure and recovery
- Generate all artifact types correctly

**Session Persistence Tests**:
- Save session state at each phase
- Resume session from each phase
- Verify session integrity after resume
- Handle concurrent session access
- Recover from corrupted session files

**Artifact Generation Tests**:
- Generate all artifact types (big picture, comparison, prototypes, reports, ADR, RDR)
- Verify artifact content correctness
- Verify artifact file structure matches specification
- Verify artifact cross-references are valid
- Verify artifact index completeness

**Library Installation Tests**:
- Install libraries via npm
- Verify installation in node_modules
- Handle installation failures
- Detect existing installations
- Record installed versions
- Reinstall when requested

**Integration with Research Buddy**:
- Invoke structured workflow from research-buddy
- Invoke ad-hoc mode from research-buddy
- Reuse existing comparison matrices
- Reuse existing visualization capabilities
- Reuse existing ADR generation
- Maintain compatibility with existing session structure

### Manual Testing Scenarios

**Scenario 1: First-time user with single library**
1. Start workflow
2. Provide goal: "Learn focus-trap library"
3. Select single library mode
4. Enter library: "focus-trap"
5. Provide documentation URL
6. Verify library installation
7. Request big picture analysis
8. Review big picture visualization
9. Create 2 minimal examples
10. Finalize and generate ADR
11. Verify all artifacts generated

**Scenario 2: Comparison of 3 libraries**
1. Start workflow
2. Provide goal: "Choose focus trap solution"
3. Select comparison mode
4. Enter libraries: "@angular/cdk/a11y", "focus-trap", "aria-modal"
5. Verify all libraries installed
6. Request big picture analysis
7. Review individual big pictures
8. Review comparison view
9. Create prototype for top 2 candidates
10. Select winner
11. Finalize and generate ADR
12. Accept wiki integration
13. Verify Research Decision Record created

**Scenario 3: Resume paused session**
1. Start workflow and complete setup phase
2. Begin analysis phase
3. Generate 1 big picture visualization
4. Pause workflow
5. Resume session by ID
6. Verify current phase is ANALYSIS
7. Verify completed big picture is available
8. Continue to completion
9. Verify all state preserved correctly

**Scenario 4: Handle installation failure**
1. Start workflow
2. Enter invalid library name "not-a-real-library-xyz"
3. Observe installation failure message
4. Correct library name to "focus-trap"
5. Retry installation
6. Verify successful installation
7. Continue workflow normally

**Scenario 5: Skip analysis phase**
1. Start workflow with single library
2. Complete setup phase
3. Decline big picture analysis
4. Verify transition directly to prototyping phase
5. Create examples
6. Complete workflow
7. Verify final report notes skipped analysis

**Scenario 6: Enforce 3-library limit**
1. Start workflow
2. Select comparison mode
3. Attempt to enter 4 libraries
4. Observe rejection message
5. Reduce to 3 libraries
6. Verify acceptance
7. Continue workflow

**Scenario 7: Finalization immutability**
1. Complete full workflow
2. Finalize session
3. Attempt to add new artifact
4. Verify rejection
5. Attempt to change phase
6. Verify rejection
7. Verify session remains in FINALIZED state

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage for all components
- **Property Test Coverage**: All 12 correctness properties implemented as property tests
- **Integration Test Coverage**: All phase transitions and artifact generation paths
- **Manual Test Coverage**: All user interaction flows and error scenarios

### Testing Tools

- **Unit Testing**: Jest or Vitest
- **Property-Based Testing**: fast-check
- **Integration Testing**: Jest with file system mocks or test directories
- **Manual Testing**: Test scripts and documented procedures


## Implementation Guidance

### Phase 1: Setup Implementation

**Key Responsibilities**:
- Collect user inputs (goal, mode, libraries, documentation links)
- Validate library count based on research mode
- Install libraries to node_modules
- Create session directory and metadata file
- Initialize session state

**Implementation Steps**:

1. **Prompt for Goal**
   ```typescript
   const goal = await promptHandler.promptForGoal();
   // Example: "Compare focus trap libraries for modal dialogs"
   ```

2. **Prompt for Research Mode**
   ```typescript
   const mode = await promptHandler.promptForResearchMode();
   // Returns: ResearchMode.SINGLE or ResearchMode.COMPARISON
   ```

3. **Prompt for Libraries with Validation**
   ```typescript
   const libraries = await promptHandler.promptForLibraries(mode);
   // Validates: 1 library for SINGLE, 2-3 for COMPARISON
   // Returns: ["@angular/cdk/a11y", "focus-trap"]
   ```

4. **Prompt for Documentation Links (Optional)**
   ```typescript
   const docLinks = await promptHandler.promptForDocumentationLinks();
   // Returns: ["https://material.angular.io/cdk/a11y/overview"]
   ```

5. **Install Libraries**
   ```typescript
   const installResults = await installManager.installLibraries(libraries);
   
   // Handle failures
   for (const result of installResults) {
     if (!result.success) {
       const retry = await promptHandler.confirmRetry(result.libraryName);
       if (retry) {
         const correctedName = await promptHandler.promptForCorrectedName();
         await installManager.installLibrary(correctedName);
       }
     }
   }
   ```

6. **Verify Installations**
   ```typescript
   const verification = await installManager.verifyLibraries(libraries);
   if (!verification.allVerified) {
     throw new Error(`Libraries not verified: ${verification.missingLibraries}`);
   }
   ```

7. **Create Session**
   ```typescript
   const session = await sessionManager.createSession({
     goal,
     mode,
     libraries: installResults.map(r => ({
       name: r.libraryName,
       version: r.version!,
       installedAt: new Date().toISOString(),
       installPath: r.installPath!
     })),
     documentationLinks: docLinks,
     userInputs: {}
   });
   ```

8. **Transition to Analysis Phase**
   ```typescript
   await orchestrator.transitionToPhase(Phase.ANALYSIS);
   ```

**Error Handling**:
- Installation failure: Offer retry with corrected name or skip
- Validation failure: Re-prompt with error message
- All libraries failed: Abort workflow
- File system error: Report and abort

### Phase 2: Analysis Implementation

**Key Responsibilities**:
- Prompt user for big picture analysis preference
- Generate big picture visualizations for each library
- Generate comparison view (if in comparison mode)
- Save all visualizations to session directory
- Transition to prototyping phase

**Implementation Steps**:

1. **Prompt for Big Picture Analysis**
   ```typescript
   const wantsBigPicture = await promptHandler.promptForBigPictureAnalysis();
   if (!wantsBigPicture) {
     await orchestrator.transitionToPhase(Phase.PROTOTYPING);
     return;
   }
   ```

2. **Generate Big Picture for Each Library**
   ```typescript
   const analyses: LibraryAnalysis[] = [];
   
   for (const library of session.metadata.libraries) {
     const analysis = await bigPictureAnalyzer.analyzeLibrary(library.name);
     analyses.push(analysis);
     
     const visualization = bigPictureAnalyzer.generateVisualization(analysis);
     
     await artifactCoordinator.saveArtifact({
       type: ArtifactType.BIG_PICTURE,
       name: `${library.name}-big-picture.md`,
       content: visualization,
       metadata: {
         createdAt: new Date().toISOString(),
         phase: Phase.ANALYSIS,
         relatedLibraries: [library.name],
         tags: ['big-picture', 'structure']
       }
     }, session);
   }
   ```

3. **Generate Comparison View (Comparison Mode Only)**
   ```typescript
   if (session.metadata.mode === ResearchMode.COMPARISON) {
     const comparisonView = bigPictureAnalyzer.generateComparisonView(analyses);
     
     await artifactCoordinator.saveArtifact({
       type: ArtifactType.COMPARISON_VIEW,
       name: 'comparison-view.md',
       content: comparisonView,
       metadata: {
         createdAt: new Date().toISOString(),
         phase: Phase.ANALYSIS,
         relatedLibraries: session.metadata.libraries.map(l => l.name),
         tags: ['comparison', 'side-by-side']
       }
     }, session);
   }
   ```

4. **Transition to Prototyping Phase**
   ```typescript
   await orchestrator.transitionToPhase(Phase.PROTOTYPING);
   ```

**Big Picture Analysis Algorithm**:

```typescript
async function analyzeLibrary(libraryName: string): Promise<LibraryAnalysis> {
  const libraryPath = path.join('node_modules', libraryName);
  
  // 1. Analyze directory structure
  const structure = await analyzeStructure(libraryPath);
  
  // 2. Identify entry points
  const entryPoints = await identifyEntryPoints(libraryPath);
  
  // 3. Extract public API from entry points
  const publicAPI = await extractPublicAPI(entryPoints);
  
  // 4. Categorize capabilities
  const capabilities = categorizeCapabilities(structure, publicAPI);
  
  // 5. Extract dependencies
  const dependencies = await extractDependencies(libraryPath);
  
  return {
    libraryName,
    version: await getVersion(libraryPath),
    structure,
    capabilities,
    entryPoints,
    publicAPI,
    dependencies
  };
}

function categorizeCapabilities(
  structure: StructureAnalysis,
  publicAPI: APIExport[]
): CapabilityCategories {
  const categories = new Map<string, Capability[]>();
  
  // Categorization heuristics:
  // - Components: exports ending in 'Component' or in 'components' directory
  // - Directives: exports ending in 'Directive' or in 'directives' directory
  // - Services: exports ending in 'Service' or in 'services' directory
  // - Utilities: exports in 'utils' or 'helpers' directories
  // - Types: TypeScript interfaces and types
  
  for (const apiExport of publicAPI) {
    const category = determineCategory(apiExport, structure);
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push({
      name: apiExport.name,
      type: apiExport.type as any,
      description: apiExport.documentation || '',
      exportPath: apiExport.signature
    });
  }
  
  return {
    categories,
    uncategorized: []
  };
}
```

**Visualization Format**:

```markdown
# Big Picture: [Library Name]

**Version**: X.Y.Z  
**Entry Points**: N  
**Public Exports**: M  
**Dependencies**: K

## Structure Overview

```
[library-name]/
├── [directory-1]/
│   ├── [file-1]
│   └── [file-2]
├── [directory-2]/
└── index.ts (main entry point)
```

## Capabilities by Category

### Components
- **ComponentName**: Description
- **AnotherComponent**: Description

### Directives
- **DirectiveName**: Description

### Services
- **ServiceName**: Description

### Utilities
- **utilityFunction**: Description

## Entry Points

1. **Main Entry**: `index.ts`
   - Exports: ComponentName, DirectiveName, ServiceName

2. **Secondary Entry**: `submodule/index.ts`
   - Exports: UtilityFunction

## Dependencies

- **@angular/core**: ^17.0.0 (peer)
- **rxjs**: ^7.8.0 (dependency)

## What You Can Build

- [Use case 1]
- [Use case 2]
- [Use case 3]
```

### Phase 3: Prototyping Implementation

**Key Responsibilities**:
- Prompt user for prototype/example requests
- Generate minimal, runnable code examples
- Save examples to prototypes directory
- Track examples in session metadata
- Allow multiple examples before proceeding
- Transition to decision phase when user indicates completion

**Implementation Steps**:

1. **Prototype Request Loop**
   ```typescript
   let continuePrototyping = true;
   
   while (continuePrototyping) {
     const request = await promptHandler.promptForPrototypeRequest();
     
     if (request === null) {
       // User indicated completion
       continuePrototyping = false;
       break;
     }
     
     // Generate example using existing research-buddy capabilities
     const example = await generateMinimalExample(request, session);
     
     // Save to prototypes directory
     await artifactCoordinator.saveArtifact({
       type: ArtifactType.PROTOTYPE,
       name: generatePrototypeName(request),
       content: example,
       metadata: {
         createdAt: new Date().toISOString(),
         phase: Phase.PROTOTYPING,
         relatedLibraries: determineRelatedLibraries(request, session),
         tags: ['prototype', 'example']
       }
     }, session);
     
     // Track in session metadata
     session.metadata.userInputs.prototypeRequests = 
       session.metadata.userInputs.prototypeRequests || [];
     session.metadata.userInputs.prototypeRequests.push(request);
     await sessionManager.saveSession(session);
   }
   ```

2. **Transition to Decision Phase**
   ```typescript
   await orchestrator.transitionToPhase(Phase.DECISION);
   ```

**Example Generation**:
- Reuse existing research-buddy minimal example generation
- Follow minimal example principles (no extra features, inline templates, clear comments)
- Generate runnable code
- Include necessary imports
- Add explanatory comments

### Phase 4: Decision Implementation

**Key Responsibilities**:
- Prompt for library decision (comparison mode) or confirmation (single mode)
- Generate final research report
- Generate ADR with decision rationale
- Offer wiki integration for Research Decision Record
- Mark session as finalized
- Display artifact summary

**Implementation Steps**:

1. **Prompt for Decision**
   ```typescript
   let decision: Decision;
   
   if (session.metadata.mode === ResearchMode.COMPARISON) {
     const selectedLibrary = await promptHandler.promptForDecision(
       session.metadata.libraries.map(l => l.name)
     );
     
     decision = {
       selectedLibrary,
       rationale: await promptHandler.promptForRationale(),
       comparisonData: await gatherComparisonData(session)
     };
   } else {
     const confirmed = await promptHandler.confirmFinalization();
     if (!confirmed) {
       // User wants to continue research
       return;
     }
     
     decision = {
       selectedLibrary: session.metadata.libraries[0].name,
       rationale: 'Single library research completed',
       comparisonData: await gatherComparisonData(session)
     };
   }
   ```

2. **Generate Final Report**
   ```typescript
   const finalReport = await artifactCoordinator.generateFinalReport(session);
   await artifactCoordinator.saveArtifact(finalReport, session);
   ```

3. **Generate ADR**
   ```typescript
   const adr = await artifactCoordinator.generateADR(session, decision);
   await artifactCoordinator.saveArtifact(adr, session);
   
   // Copy to ADRs archive
   const adrArchivePath = `.kiro/research/adrs/${formatDate()}-${slugify(decision.selectedLibrary)}.md`;
   await fs.copyFile(
     path.join(session.directory, adr.name),
     adrArchivePath
   );
   ```

4. **Offer Wiki Integration**
   ```typescript
   const wantsWikiIntegration = await promptHandler.promptForWikiIntegration();
   
   if (wantsWikiIntegration) {
     const rdr = await artifactCoordinator.generateResearchDecisionRecord(session);
     await artifactCoordinator.saveArtifact(rdr, session);
     
     // Integrate with wiki system
     await integrateWithWiki(rdr, session);
   }
   ```

5. **Generate Artifact Index**
   ```typescript
   await artifactCoordinator.generateArtifactIndex(session);
   ```

6. **Finalize Session**
   ```typescript
   await sessionManager.finalizeSession(session);
   ```

7. **Display Summary**
   ```typescript
   displayArtifactSummary(session);
   ```

**Final Report Structure**:

```markdown
# Final Research Report: [Goal]

**Date**: [YYYY-MM-DD]  
**Session ID**: [session-id]  
**Research Mode**: [SINGLE | COMPARISON]  
**Decision**: [Selected Library]

## Executive Summary

[2-3 sentence overview of research and decision]

## Research Journey

### Phase 1: Setup
- **Goal**: [User's stated goal]
- **Libraries**: [List of libraries researched]
- **Duration**: [Time spent]

### Phase 2: Analysis
- **Big Picture Generated**: [Yes/No]
- **Key Findings**: [Bullet points]

### Phase 3: Prototyping
- **Examples Created**: [Count]
- **Prototypes**: [List with descriptions]

### Phase 4: Decision
- **Selected Library**: [Name]
- **Rationale**: [Decision reasoning]

## Libraries Analyzed

[For each library:]

### [Library Name]

**Version**: X.Y.Z  
**Complexity Score**: N/10  
**Modularity Score**: N/10  
**Bundle Size**: XKB (gzipped)  
**Token Estimate**: ~XK tokens

**Key Strengths**:
- [Strength 1]
- [Strength 2]

**Key Weaknesses**:
- [Weakness 1]
- [Weakness 2]

## Comparison Summary

[Include comparison matrices from Phase 2]

## Decision Rationale

[Detailed explanation of why the selected library was chosen]

## Implementation Plan

[Next steps for implementing the chosen library]

## Artifacts Generated

- [Link to big picture visualizations]
- [Link to comparison view]
- [Link to prototypes]
- [Link to ADR]
- [Link to Research Decision Record (if created)]

## Lessons Learned

[Key insights from the research process]

## References

- [Documentation links]
- [Article links]
- [Related resources]
```

### Session State Management

**Pause Implementation**:
```typescript
async function pauseWorkflow(): Promise<void> {
  const session = sessionManager.getActiveSession();
  if (!session) {
    throw new Error('No active session to pause');
  }
  
  // Save current state
  session.status = SessionStatus.PAUSED;
  session.updatedAt = new Date().toISOString();
  await sessionManager.saveSession(session);
  
  console.log(`Session paused: ${session.id}`);
  console.log(`Resume with: continue research: ${session.id}`);
}
```

**Resume Implementation**:
```typescript
async function resumeWorkflow(sessionId: string): Promise<void> {
  // Load session
  const session = await sessionManager.loadSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  if (session.status === SessionStatus.FINALIZED) {
    throw new Error('Cannot resume finalized session');
  }
  
  // Verify libraries still exist
  const verification = await installManager.verifyLibraries(
    session.metadata.libraries.map(l => l.name)
  );
  
  if (!verification.allVerified) {
    console.log('Some libraries are missing:');
    for (const missing of verification.missingLibraries) {
      const shouldReinstall = await promptHandler.confirmReinstall(missing);
      if (shouldReinstall) {
        await installManager.installLibrary(missing);
      }
    }
  }
  
  // Restore state
  session.status = SessionStatus.ACTIVE;
  await sessionManager.saveSession(session);
  
  // Display current state
  console.log(`Resumed session: ${session.id}`);
  console.log(`Current phase: ${session.currentPhase}`);
  console.log(`Completed phases: ${session.completedPhases.join(', ')}`);
  
  // Continue from current phase
  await orchestrator.executePhase(session.currentPhase);
}
```

### Integration with Existing Research Buddy

**Reuse Strategy**:

1. **Comparison Matrices**: Use existing comparison matrix generation from research-buddy
2. **Visualization**: Leverage existing library visualization capabilities
3. **ADR Generation**: Reuse existing ADR template and generation logic
4. **Minimal Examples**: Use existing minimal example generation
5. **Session Directory**: Maintain compatibility with existing structure

**Integration Points**:

```typescript
// Workflow orchestrator delegates to existing capabilities
class WorkflowOrchestrator {
  constructor(
    private researchBuddy: ResearchBuddy,
    private sessionManager: SessionManager,
    private installManager: LibraryInstallationManager
  ) {}
  
  async executeAnalysisPhase(): Promise<void> {
    const session = this.sessionManager.getActiveSession();
    
    // Use existing research-buddy visualization
    for (const library of session.metadata.libraries) {
      const visualization = await this.researchBuddy.visualizeLibrary(library.name);
      // Save visualization...
    }
    
    // Use existing comparison matrix generation
    if (session.metadata.mode === ResearchMode.COMPARISON) {
      const comparison = await this.researchBuddy.compareLibraries(
        session.metadata.libraries.map(l => l.name)
      );
      // Save comparison...
    }
  }
  
  async executePrototypingPhase(): Promise<void> {
    // Use existing minimal example generation
    const example = await this.researchBuddy.generateMinimalExample(request);
    // Save example...
  }
  
  async executeDecisionPhase(): Promise<void> {
    // Use existing ADR generation
    const adr = await this.researchBuddy.generateADR(decision);
    // Save ADR...
  }
}
```

### File System Organization

**Directory Creation**:
```typescript
async function createSessionDirectory(sessionId: string): Promise<string> {
  const sessionDir = path.join('.kiro', 'research', 'sessions', sessionId);
  
  await fs.mkdir(sessionDir, { recursive: true });
  await fs.mkdir(path.join(sessionDir, 'libraries'), { recursive: true });
  await fs.mkdir(path.join(sessionDir, 'prototypes'), { recursive: true });
  await fs.mkdir(path.join(sessionDir, 'phase-reports'), { recursive: true });
  
  return sessionDir;
}
```

**Artifact Naming Conventions**:
- Big Picture: `{library-name}-big-picture.md`
- Comparison View: `comparison-view.md`
- Prototype: `{sanitized-request-description}.ts`
- Phase Report: `{phase-name}-report.md`
- Final Report: `final-report.md`
- ADR: `decision.adr.md`
- Research Decision Record: `research-decision-record.md`
- Artifact Index: `artifacts-index.md`

### Performance Considerations

**Library Installation**:
- Install libraries in parallel when possible
- Cache installation results to avoid redundant installs
- Use npm ci for faster, deterministic installs when package-lock.json exists

**File System Operations**:
- Batch file writes when possible
- Use streaming for large files
- Implement retry logic for transient failures

**Session State**:
- Lazy load session artifacts (don't load all files into memory)
- Use incremental saves (only write changed data)
- Implement session state caching for active sessions

### Security Considerations

**Library Installation**:
- Validate library names to prevent command injection
- Use npm audit to check for known vulnerabilities
- Warn user about installing untrusted packages

**File System Access**:
- Restrict file operations to `.kiro/research/` directory
- Validate all file paths to prevent directory traversal
- Use safe file naming (sanitize user input)

**Session Data**:
- Don't store sensitive information in session metadata
- Validate session JSON schema before loading
- Implement session file permissions (read/write for owner only)

## Summary

The Polished Research Workflow feature enhances the research-buddy skill with a structured 4-phase workflow that guides developers through library research and comparison. The design emphasizes:

1. **Clear Phase Progression**: Setup → Analysis → Prototyping → Decision
2. **Library Installation First**: Ensures node_modules is source of truth
3. **Comprehensive Visualization**: Big picture analysis and comparison views
4. **Session State Management**: Pause, resume, and track research progress
5. **Artifact Generation**: Reports, ADRs, and Research Decision Records
6. **Integration**: Seamless integration with existing research-buddy capabilities

The implementation leverages existing research-buddy capabilities while adding workflow orchestration, session management, and enhanced visualization features. Property-based testing ensures correctness of core logic components, while integration tests verify end-to-end workflows.

