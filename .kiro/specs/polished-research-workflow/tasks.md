# Implementation Plan: Polished Research Workflow

## Overview

This implementation plan transforms the existing research-buddy skill into a structured 4-phase workflow system for library research and comparison. The workflow guides users through Setup → Analysis → Prototyping → Decision phases, ensuring libraries are installed before analysis, generating comprehensive visualizations, and producing decision artifacts.

**Key Implementation Areas**:
- Core infrastructure (session management, state machine, file system)
- Library installation and verification
- Big Picture Analyzer (NEW component)
- Phase implementations (4 phases)
- User interaction and prompts
- Artifact generation and coordination
- Integration with existing research-buddy
- Property-based testing (12 properties) and unit testing

## Tasks

- [x] 1. Set up core infrastructure and type definitions
  - Create directory structure for workflow implementation
  - Define TypeScript interfaces for all core types (Session, Phase, WorkflowOrchestrator, etc.)
  - Set up testing framework (Jest/Vitest) and fast-check for property-based testing
  - Create base error classes for workflow-specific errors
  - _Requirements: 5.3, 8.3_

- [x] 2. Implement Session Manager
  - [x] 2.1 Create SessionManager class with lifecycle methods
    - Implement createSession, loadSession, saveSession, finalizeSession
    - Implement session queries (getActiveSession, listSessions, getSessionById)
    - Create session.json file format with proper schema
    - _Requirements: 1.8, 8.1, 8.2, 8.3_

  - [x] 2.2 Write property test for Session Metadata Completeness
    - **Property 2: Session Metadata Completeness**
    - **Validates: Requirements 1.8, 6.6, 8.3**

  - [x] 2.3 Write property test for Session Persistence Round-Trip
    - **Property 5: Session Persistence Round-Trip**
    - **Validates: Requirements 5.3, 5.4, 8.1, 8.2**

  - [x] 2.4 Write property test for History Accumulation
    - **Property 8: History Accumulation**
    - **Validates: Requirements 8.6**

  - [x] 2.5 Write unit tests for SessionManager
    - Test session creation with valid metadata
    - Test loading existing session from file
    - Test saving session state to file
    - Test handling corrupted session files
    - Test listing all sessions
    - Test finalizing session and marking read-only
    - _Requirements: 8.7_

- [x] 3. Implement Library Installation Manager
  - [x] 3.1 Create LibraryInstallationManager class
    - Implement installLibrary with npm integration
    - Implement verifyInstallation checking node_modules
    - Implement getInstalledVersion from package.json
    - Implement batch operations (installLibraries, verifyLibraries)
    - Handle installation errors with proper error messages
    - _Requirements: 1.6, 1.7, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Write unit tests for LibraryInstallationManager
    - Test successful single library installation
    - Test installation failure handling
    - Test verification of library in node_modules
    - Test getting installed version
    - Test batch installation of multiple libraries
    - Test partial batch installation failure
    - Test reinstall prompt when library exists
    - _Requirements: 6.2, 6.7_

- [x] 4. Implement Phase State Machine and Workflow Orchestrator
  - [x] 4.1 Create Phase enum and PhaseTransition interface
    - Define Phase enum (IDLE, SETUP, ANALYSIS, PROTOTYPING, DECISION, FINALIZED)
    - Define transition rules and conditions
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Create WorkflowOrchestrator class
    - Implement workflow lifecycle (startWorkflow, pauseWorkflow, resumeWorkflow)
    - Implement phase management (getCurrentPhase, transitionToPhase, canTransitionTo)
    - Implement phase execution methods (executeSetupPhase, executeAnalysisPhase, etc.)
    - Enforce phase transition rules and prerequisites
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 4.3 Write property test for Sequential Phase Progression
    - **Property 3: Sequential Phase Progression**
    - **Validates: Requirements 1.9, 2.12, 3.6**

  - [ ]* 4.4 Write property test for Phase Transition Prerequisites
    - **Property 6: Phase Transition Prerequisites**
    - **Validates: Requirements 5.6**

  - [ ]* 4.5 Write property test for Session Finalization Immutability
    - **Property 7: Session Finalization Immutability**
    - **Validates: Requirements 4.8, 8.7**

  - [x] 4.6 Write unit tests for WorkflowOrchestrator
    - Test starting workflow and initializing session
    - Test transitioning between phases correctly
    - Test enforcing phase transition rules
    - Test pausing and resuming workflow
    - Test handling invalid phase transitions
    - Test executing each phase successfully
    - Test skipping phases when requested
    - _Requirements: 5.5_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement User Prompt Handler
  - [x] 6.1 Create UserPromptHandler class with all prompt methods
    - Implement promptForGoal
    - Implement promptForResearchMode
    - Implement promptForLibraries with validation
    - Implement promptForDocumentationLinks
    - Implement promptForBigPictureAnalysis
    - Implement promptForPrototypeRequest
    - Implement promptForDecision
    - Implement promptForWikiIntegration
    - Implement confirmation prompts (confirmReinstall, confirmSkipPhase, confirmFinalization)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 3.1, 4.1, 4.2, 4.6_

  - [ ]* 6.2 Write property test for Input Validation by Research Mode
    - **Property 1: Input Validation by Research Mode**
    - **Validates: Requirements 1.3, 1.4, 7.6**

  - [x] 6.3 Write unit tests for UserPromptHandler
    - Test collecting goal from user
    - Test collecting research mode selection
    - Test collecting library names with validation
    - Test collecting optional documentation links
    - Test prompting for big picture analysis
    - Test prompting for prototype requests
    - Test prompting for decision
    - Test prompting for wiki integration
    - _Requirements: 7.7_

- [-] 7. Implement Big Picture Analyzer (NEW component)
  - [x] 7.1 Create BigPictureAnalyzer class with structure analysis
    - Implement analyzeLibrary method
    - Implement analyzeStructure to traverse node_modules directory
    - Implement identifyEntryPoints from package.json
    - Implement extractPublicAPI from entry point files
    - _Requirements: 2.5, 2.8_

  - [x] 7.2 Implement capability categorization
    - Implement categorizeCapabilities with heuristics
    - Cate                                            gorize by type (component, directive, service, function, class, interface)
    - Group by logical categories based on directory structure and naming
    - _Requirements: 2.6_

  - [ ]* 7.3 Write property test for Categorization Completeness
    - **Property 12: Categorization Completeness**
    - **Validates: Requirements 2.6**

  - [x] 7.4 Implement visualization generation
    - Implement generateVisualization to create markdown output
    - Include structure overview, capabilities by category, entry points, dependencies
    - Document what can be built with the library
    - _Requirements: 2.7_

  - [x] 7.5 Implement comparison view generation
    - Implement generateComparisonView for side-by-side analysis
    - Highlight differences in structure, capabilities, and API design
    - _Requirements: 2.9, 2.10_

  - [x] 7.6 Write unit tests for BigPictureAnalyzer
    - Test analyzing library structure from node_modules
    - Test categorizing capabilities correctly
    - Test identifying entry points and exports
    - Test generating visualization markdown
    - Test generating comparison view for multiple libraries
    - Test handling missing or malformed library structure
    - _Requirements: 2.4_

- [x] 8. Implement Phase 1: Setup
  - [x] 8.1 Implement executeSetupPhase in WorkflowOrchestrator
    - Prompt for goal using UserPromptHandler
    - Prompt for research mode
    - Prompt for libraries with validation
    - Prompt for optional documentation links
    - Install libraries using LibraryInstallationManager
    - Handle installation failures with retry logic
    - Verify all installations
    - Create session using SessionManager
    - Transition to ANALYSIS phase
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 8.2 Write integration tests for Phase 1
    - Test complete setup flow with single library
    - Test complete setup flow with comparison mode (2-3 libraries)
    - Test handling installation failure and retry
    - Test validation rejection for invalid library counts
    - _Requirements: 7.6, 7.7_

- [x] 9. Implement Phase 2: Analysis
  - [x] 9.1 Implement executeAnalysisPhase in WorkflowOrchestrator
    - Prompt for big picture analysis preference
    - Skip to Phase 3 if user declines
    - Generate big picture for each library using BigPictureAnalyzer
    - Save big picture visualizations as artifacts
    - Generate comparison view for comparison mode
    - Save comparison view as artifact
    - Transition to PROTOTYPING phase
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

  - [ ]* 9.2 Write property test for Artifact Generation Completeness
    - **Property 4: Artifact Generation Completeness**
    - **Validates: Requirements 2.3, 2.4, 7.1**

  - [x] 9.3 Write integration tests for Phase 2
    - Test big picture generation for single library
    - Test big picture generation for multiple libraries
    - Test comparison view generation
    - Test skipping analysis phase
    - _Requirements: 2.2_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Artifact Coordinator
  - [x] 11.1 Create ArtifactCoordinator class
    - Implement generatePhaseReport
    - Implement generateFinalReport
    - Implement generateADR with decision data
    - Implement generateResearchDecisionRecord
    - Implement saveArtifact with proper file paths
    - Implement listArtifacts
    - Implement generateArtifactIndex
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 11.2 Write property test for Artifact Index Completeness
    - **Property 9: Artifact Index Completeness**
    - **Validates: Requirements 9.4, 9.8**

  - [ ]* 11.3 Write property test for Artifact Organization Compliance
    - **Property 10: Artifact Organization Compliance**
    - **Validates: Requirements 9.6, 9.7, 10.6, 10.7**

  - [ ]* 11.4 Write property test for ADR Template Compliance
    - **Property 11: ADR Template Compliance**
    - **Validates: Requirements 4.5, 9.5**

  - [x] 11.5 Write unit tests for ArtifactCoordinator
    - Test generating phase reports
    - Test generating final report with all findings
    - Test generating ADR with decision data
    - Test saving artifacts to correct locations
    - Test generating artifact index
    - Test handling file system errors
    - Test following naming conventions
    - _Requirements: 10.7_

- [-] 12. Implement Phase 3: Prototyping
  - [x] 12.1 Implement executePrototypingPhase in WorkflowOrchestrator
    - Implement prototype request loop
    - Prompt for prototype/example requests
    - Generate minimal examples (reuse existing research-buddy capabilities)
    - Save examples to prototypes directory using ArtifactCoordinator
    - Track examples in session metadata
    - Allow multiple examples before proceeding
    - Transition to DECISION phase when user indicates completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 12.2 Write integration tests for Phase 3
    - Test creating single prototype
    - Test creating multiple prototypes
    - Test prototype saved to correct directory
    - Test tracking prototypes in session metadata
    - _Requirements: 3.4_

- [ ] 13. Implement Phase 4: Decision
  - [x] 13.1 Implement executeDecisionPhase in WorkflowOrchestrator
    - Prompt for library decision (comparison mode) or confirmation (single mode)
    - Collect decision rationale
    - Gather comparison data from session
    - Generate final report using ArtifactCoordinator
    - Generate ADR using ArtifactCoordinator
    - Copy ADR to archive directory
    - Prompt for wiki integration
    - Generate Research Decision Record if accepted
    - Generate artifact index
    - Finalize session using SessionManager
    - Display artifact summary
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 13.2 Write integration tests for Phase 4
    - Test decision flow in comparison mode
    - Test decision flow in single library mode
    - Test final report generation
    - Test ADR generation with all required sections
    - Test wiki integration
    - Test artifact index generation
    - Test session finalization
    - _Requirements: 4.4, 4.5_

- [ ] 14. Implement integration with existing research-buddy
  - [x] 14.1 Create integration layer
    - Add workflow mode selection (structured vs ad-hoc)
    - Integrate WorkflowOrchestrator with research-buddy skill
    - Reuse existing comparison matrices generation
    - Reuse existing visualization capabilities
    - Reuse existing ADR generation templates
    - Reuse existing minimal example generation
    - Maintain compatibility with existing session directory structure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 14.2 Write integration tests for research-buddy compatibility
    - Test invoking structured workflow from research-buddy
    - Test invoking ad-hoc mode from research-buddy
    - Test reusing comparison matrices
    - Test reusing visualization capabilities
    - Test reusing ADR generation
    - Test maintaining session structure compatibility
    - _Requirements: 10.6_

- [ ] 15. Implement pause and resume functionality
  - [x] 15.1 Implement pauseWorkflow in WorkflowOrchestrator
    - Save current session state
    - Update session status to PAUSED
    - Display resume instructions
    - _Requirements: 5.4, 8.1_

  - [x] 15.2 Implement resumeWorkflow in WorkflowOrchestrator
    - Load session by ID
    - Verify session is not finalized
    - Verify libraries still exist in node_modules
    - Offer to reinstall missing libraries
    - Restore session status to ACTIVE
    - Display current phase and completed phases
    - Continue from current phase
    - _Requirements: 5.7, 8.2, 8.4, 8.5_

  - [ ]* 15.3 Write integration tests for pause and resume
    - Test pausing workflow at each phase
    - Test resuming workflow from each phase
    - Test session state preservation
    - Test handling missing libraries on resume
    - _Requirements: 8.4_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement error handling and recovery
  - [x] 17.1 Add error handling for installation failures
    - Display clear error messages
    - Offer retry with corrected library name
    - Offer to skip library and continue
    - Prevent phase transition if all libraries fail
    - _Requirements: 1.7_

  - [x] 17.2 Add error handling for session state errors
    - Handle corrupted session files
    - Attempt to load backup session file
    - Offer to start new session if recovery fails
    - Handle missing libraries on resume
    - _Requirements: 8.4, 8.5_

  - [x] 17.3 Add error handling for phase transition errors
    - Validate phase transitions
    - Display valid next phases
    - Explain why transition is invalid
    - Suggest required actions
    - _Requirements: 5.6_

  - [x] 17.4 Add error handling for artifact generation errors
    - Handle file system write failures
    - Check disk space and permissions
    - Retry write operations
    - Store artifacts in memory if persistence fails
    - Handle template rendering failures
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 17.5 Write unit tests for error handling
    - Test installation failure recovery
    - Test corrupted session file handling
    - Test invalid phase transition handling
    - Test file system error handling
    - Test missing library on resume handling

- [ ] 18. Implement file system organization
  - [x] 18.1 Create directory structure utilities
    - Implement createSessionDirectory
    - Create subdirectories (libraries, prototypes, phase-reports)
    - Implement artifact naming conventions
    - Implement path validation and sanitization
    - _Requirements: 9.7_

  - [ ]* 18.2 Write unit tests for file system utilities
    - Test session directory creation
    - Test subdirectory creation
    - Test artifact naming conventions
    - Test path validation
    - Test path sanitization

- [ ] 19. Add comparison mode support
  - [x] 19.1 Implement comparison-specific logic
    - Maintain separate analysis artifacts for each library
    - Generate comparison matrices (complexity, modularity, bundle size, token usage)
    - Create side-by-side visualizations
    - Allow creating examples for any or all libraries
    - Generate comprehensive comparison report
    - Enforce 3-library maximum
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 19.2 Write integration tests for comparison mode
    - Test comparison with 2 libraries
    - Test comparison with 3 libraries
    - Test rejection of 4+ libraries
    - Test comparison matrices generation
    - Test side-by-side visualizations
    - Test comparison report generation
    - _Requirements: 7.6, 7.7_

- [ ] 20. Final integration and end-to-end testing
  - [ ]* 20.1 Write end-to-end workflow tests
    - Test complete single-library workflow from start to finalization
    - Test complete comparison workflow with 2 libraries
    - Test complete comparison workflow with 3 libraries
    - Test pause workflow mid-phase and resume successfully
    - Test skip analysis phase and continue to prototyping
    - Test handle library installation failure and recovery
    - Test generate all artifact types correctly

  - [ ]* 20.2 Write session persistence tests
    - Test save session state at each phase
    - Test resume session from each phase
    - Test verify session integrity after resume
    - Test recover from corrupted session files

  - [ ]* 20.3 Write artifact generation tests
    - Test generate all artifact types
    - Test verify artifact content correctness
    - Test verify artifact file structure matches specification
    - Test verify artifact cross-references are valid
    - Test verify artifact index completeness

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (12 total)
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
- The implementation uses TypeScript throughout
- Reuses existing research-buddy capabilities where possible
- Maintains compatibility with existing session directory structure
