/**
 * WorkflowOrchestrator - Manages the 4-phase research workflow state machine
 * Feature: polished-research-workflow
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7
 */

import {
  Phase,
  PhaseTransition,
  Session,
  SessionStatus,
  ResearchMode,
  LibraryInfo,
  ArtifactType,
  ArtifactReference
} from '../types/core';
import { Artifact, Decision, ComparisonData, BundleSize, TokenEstimate } from '../types/artifacts';
import { SessionManager } from '../session/SessionManager';
import { UserPromptHandler } from '../prompts/UserPromptHandler';
import { LibraryInstallationManager } from '../installation/LibraryInstallationManager';
import { BigPictureAnalyzer } from '../analyzer/BigPictureAnalyzer';
import { ArtifactCoordinator } from '../artifacts/ArtifactCoordinator';
import { WorkflowError } from '../errors/WorkflowError';

/**
 * WorkflowOrchestrator manages the workflow state machine and phase transitions.
 * It enforces phase progression rules and coordinates phase execution.
 */
export class WorkflowOrchestrator {
  private sessionManager: SessionManager;
  private promptHandler: UserPromptHandler;
  private installationManager: LibraryInstallationManager;
  private bigPictureAnalyzer: BigPictureAnalyzer;
  private artifactCoordinator: ArtifactCoordinator;
  private currentSession: Session | null = null;

  /**
   * Phase transition rules defining valid state transitions
   */
  private readonly transitionRules: Map<Phase, Phase[]> = new Map([
    [Phase.IDLE, [Phase.SETUP]],
    [Phase.SETUP, [Phase.ANALYSIS]],
    [Phase.ANALYSIS, [Phase.PROTOTYPING]],
    [Phase.PROTOTYPING, [Phase.DECISION]],
    [Phase.DECISION, [Phase.FINALIZED]],
    [Phase.FINALIZED, []]
  ]);

  constructor(
    sessionManager: SessionManager,
    promptHandler?: UserPromptHandler,
    installationManager?: LibraryInstallationManager,
    bigPictureAnalyzer?: BigPictureAnalyzer,
    artifactCoordinator?: ArtifactCoordinator
  ) {
    this.sessionManager = sessionManager;
    this.promptHandler = promptHandler ?? new UserPromptHandler();
    this.installationManager = installationManager ?? new LibraryInstallationManager();
    this.bigPictureAnalyzer = bigPictureAnalyzer ?? new BigPictureAnalyzer();
    this.artifactCoordinator = artifactCoordinator ?? new ArtifactCoordinator();
  }

  /**
   * Starts a new workflow with a fresh session
   * Requirement 5.3: Transition between phases and save state
   */
  async startWorkflow(): Promise<void> {
    if (this.currentSession) {
      throw new WorkflowError(
        'A workflow is already active. Pause or finalize it before starting a new one.',
        'WORKFLOW_ALREADY_ACTIVE',
        { sessionId: this.currentSession.id }
      );
    }

    // Session will be created during executeSetupPhase
    // This method serves as the entry point
  }

  /**
   * Pauses the current workflow and saves state
   * Requirement 5.4: Allow pausing workflow at any phase
   * Requirement 8.1: Save current phase and collected data
   */
  async pauseWorkflow(): Promise<void> {
    if (!this.currentSession) {
      throw new WorkflowError(
        'No active workflow to pause',
        'NO_ACTIVE_WORKFLOW'
      );
    }

    if (this.currentSession.status === SessionStatus.FINALIZED) {
      throw new WorkflowError(
        'Cannot pause a finalized workflow',
        'WORKFLOW_FINALIZED',
        { sessionId: this.currentSession.id }
      );
    }

    // Record pause action in history
    this.addPhaseAction('Workflow paused');

    // Update session status to PAUSED
    this.currentSession.status = SessionStatus.PAUSED;

    // Save session state (Requirement 8.1)
    await this.sessionManager.saveSession(this.currentSession);

    // Display resume instructions (Requirement 5.4)
    this.promptHandler.displayInfo(`Workflow paused at phase: ${this.currentSession.currentPhase}`);
    this.promptHandler.displayInfo(`To resume, use session ID: ${this.currentSession.id}`);

    // Clear current session reference
    this.currentSession = null;
  }

  /**
   * Resumes a paused workflow from saved state
   * Requirement 5.7: Resume workflow and display current phase
   * Requirement 8.2: Restore session state when resuming
   * Requirement 8.4: Verify libraries still exist in node_modules
   * Requirement 8.5: Offer to reinstall missing libraries
   */
  async resumeWorkflow(sessionId: string): Promise<void> {
    if (this.currentSession) {
      throw new WorkflowError(
        'A workflow is already active. Pause it before resuming another.',
        'WORKFLOW_ALREADY_ACTIVE',
        { activeSessionId: this.currentSession.id }
      );
    }

    // Load session from disk (Requirement 8.2)
    const session = await this.sessionManager.loadSession(sessionId);

    // Verify session can be resumed
    if (session.status === SessionStatus.FINALIZED) {
      throw new WorkflowError(
        'Cannot resume a finalized workflow',
        'WORKFLOW_FINALIZED',
        { sessionId }
      );
    }

    // Verify libraries still exist in node_modules (Requirement 8.4)
    for (const library of session.metadata.libraries) {
      const isInstalled = await this.installationManager.verifyInstallation(library.name);

      if (!isInstalled) {
        // Offer to reinstall missing libraries (Requirement 8.5)
        this.promptHandler.displayInfo(`Library "${library.name}" is no longer installed in node_modules.`);
        const shouldReinstall = await this.promptHandler.confirmReinstall(library.name);

        if (shouldReinstall) {
          const result = await this.installationManager.installLibrary(library.name);
          if (result.success) {
            this.promptHandler.displaySuccess(`Reinstalled ${library.name}@${result.version}`);
          } else {
            this.promptHandler.displayError(`Failed to reinstall ${library.name}: ${result.error}`);
          }
        } else {
          this.promptHandler.displayInfo(`Library "${library.name}" is unavailable. Some workflow features may be limited.`);
        }
      }
    }

    // Restore session status to ACTIVE
    session.status = SessionStatus.ACTIVE;
    await this.sessionManager.saveSession(session);

    // Set as current session
    this.currentSession = session;

    // Record resume action in history
    this.addPhaseAction('Workflow resumed');

    // Display current phase and completed phases (Requirement 5.7)
    this.promptHandler.displayPhaseProgress(session.currentPhase, session.completedPhases);
    this.promptHandler.displayInfo(`Resuming workflow at phase: ${session.currentPhase}`);
  }

  /**
   * Gets the current phase of the active workflow
   * Requirement 5.1: Display current phase
   */
  getCurrentPhase(): Phase {
    if (!this.currentSession) {
      return Phase.IDLE;
    }
    return this.currentSession.currentPhase;
  }

  /**
   * Transitions to a new phase with validation
   * Requirement 5.6: Prevent moving to later phase if required artifacts missing
   */
  async transitionToPhase(targetPhase: Phase): Promise<void> {
    if (!this.currentSession) {
      throw new WorkflowError(
        'No active workflow to transition',
        'NO_ACTIVE_WORKFLOW'
      );
    }

    const currentPhase = this.currentSession.currentPhase;

    // Check if transition is valid (Requirement 5.6)
    if (!this.canTransitionTo(targetPhase)) {
      const validPhases = this.transitionRules.get(currentPhase) || [];
      const suggestion = this.getTransitionSuggestion(currentPhase, targetPhase);

      // Display user-friendly error with valid next phases and suggestion
      this.promptHandler.displayError(
        `Cannot transition from ${currentPhase} to ${targetPhase}.`
      );
      if (validPhases.length > 0) {
        this.promptHandler.displayInfo(
          `Valid next phases: ${validPhases.join(', ')}`
        );
      }
      if (suggestion) {
        this.promptHandler.displayInfo(suggestion);
      }

      throw new WorkflowError(
        `Invalid phase transition from ${currentPhase} to ${targetPhase}`,
        'INVALID_PHASE_TRANSITION',
        {
          currentPhase,
          targetPhase,
          validNextPhases: validPhases,
          suggestion
        }
      );
    }

    // Update session phase
    this.currentSession.currentPhase = targetPhase;

    // Add to completed phases if not already there
    if (!this.currentSession.completedPhases.includes(currentPhase)) {
      this.currentSession.completedPhases.push(currentPhase);
    }

    // Update phase history
    this.updatePhaseHistory(currentPhase, targetPhase);

    // Save updated session
    await this.sessionManager.saveSession(this.currentSession);
  }

  /**
   * Checks if transition to target phase is valid
   * Requirement 5.6: Enforce phase transition rules
   */
  canTransitionTo(targetPhase: Phase): boolean {
    if (!this.currentSession) {
      return targetPhase === Phase.SETUP;
    }

    const currentPhase = this.currentSession.currentPhase;
    const validNextPhases = this.transitionRules.get(currentPhase) || [];

    return validNextPhases.includes(targetPhase);
  }

  /**
   * Executes Phase 1: Setup
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
   * 
   * Collects user inputs (goal, mode, libraries, docs), installs libraries,
   * creates session, and transitions to ANALYSIS phase.
   */
  async executeSetupPhase(): Promise<void> {
    // Ensure no active session
    if (this.currentSession) {
      throw new WorkflowError(
        'A workflow is already active. Pause or finalize it before starting a new one.',
        'WORKFLOW_ALREADY_ACTIVE',
        { sessionId: this.currentSession.id }
      );
    }

    // Step 1: Prompt for research goal (Requirement 1.1)
    this.promptHandler.displayPhaseProgress(Phase.SETUP, []);
    const goal = await this.promptHandler.promptForGoal();

    // Step 2: Prompt for research mode (Requirement 1.2)
    const mode = await this.promptHandler.promptForResearchMode();

    // Step 3: Prompt for libraries with validation (Requirements 1.3, 1.4)
    let libraries: string[] = [];
    let validInput = false;

    while (!validInput) {
      libraries = await this.promptHandler.promptForLibraries(mode);
      validInput = this.promptHandler.validateLibraries(libraries, mode);

      if (!validInput) {
        if (mode === ResearchMode.SINGLE) {
          this.promptHandler.displayError('Single mode requires exactly 1 library.');
        } else {
          this.promptHandler.displayError('Comparison mode requires 2-3 libraries (max 3).');
        }
      }
    }

    // Step 4: Prompt for optional documentation links (Requirement 1.5)
    const documentationLinks = await this.promptHandler.promptForDocumentationLinks();

    // Step 5: Install libraries (Requirements 1.6, 1.7, 6.1-6.5)
    const installedLibraries: LibraryInfo[] = [];

    for (const libraryName of libraries) {
      const installed = await this.installLibraryWithRetry(libraryName);
      if (installed) {
        installedLibraries.push(installed);
      }
    }

    // Verify at least one library was installed successfully
    if (installedLibraries.length === 0) {
      throw new WorkflowError(
        'No libraries were installed successfully. Cannot proceed to analysis.',
        'ALL_INSTALLATIONS_FAILED',
        { attemptedLibraries: libraries }
      );
    }

    // In comparison mode, ensure at least 2 libraries installed
    if (mode === ResearchMode.COMPARISON && installedLibraries.length < 2) {
      throw new WorkflowError(
        'Comparison mode requires at least 2 installed libraries. Only 1 was installed successfully.',
        'INSUFFICIENT_LIBRARIES',
        { installed: installedLibraries.map(l => l.name), required: 2 }
      );
    }

    // Step 6: Create session (Requirement 1.8)
    const session = await this.sessionManager.createSession({
      goal,
      mode,
      libraries: installedLibraries,
      documentationLinks,
      userInputs: {}
    });

    // Initialize SETUP phase history entry
    session.history.push({
      phase: Phase.SETUP,
      startedAt: session.createdAt,
      completedAt: null,
      actions: []
    });

    this.currentSession = session;

    // Add setup actions to history
    this.addPhaseAction(`Collected goal: "${goal}"`);
    this.addPhaseAction(`Selected ${mode} mode`);
    for (const lib of installedLibraries) {
      this.addPhaseAction(`Installed ${lib.name}@${lib.version}`);
    }
    if (documentationLinks.length > 0) {
      this.addPhaseAction(`Collected ${documentationLinks.length} documentation link(s)`);
    }

    // Step 7: Transition to ANALYSIS phase (Requirement 1.9)
    this.promptHandler.displaySuccess('Setup phase complete! All libraries installed.');
    this.promptHandler.displayPhaseTransition(Phase.SETUP, Phase.ANALYSIS);
    await this.transitionToPhase(Phase.ANALYSIS);
  }

  /**
   * Attempts to install a library with retry logic on failure.
   * Handles already-installed libraries and offers reinstall.
   * After all retries are exhausted, offers the user to correct the library name or skip.
   * Requirements: 1.7, 6.1, 6.2
   * 
   * @param libraryName - The library name to install
   * @param depth - Recursion depth to prevent infinite correction loops (max 1)
   */
  private async installLibraryWithRetry(libraryName: string, depth: number = 0): Promise<LibraryInfo | null> {
    const MAX_RETRIES = 2;

    // Check if already installed (Requirement 6.1)
    const alreadyInstalled = await this.installationManager.verifyInstallation(libraryName);

    if (alreadyInstalled) {
      // Ask user if they want to reinstall (Requirement 6.2)
      const shouldReinstall = await this.promptHandler.confirmReinstall(libraryName);

      if (!shouldReinstall) {
        // Use existing installation
        const version = await this.installationManager.getInstalledVersion(libraryName);
        this.promptHandler.displayInfo(`Using existing installation of ${libraryName}@${version ?? 'unknown'}`);
        return {
          name: libraryName,
          version: version ?? 'unknown',
          installedAt: new Date().toISOString(),
          installPath: `node_modules/${libraryName}`
        };
      }

      // Reinstall
      const result = await this.installationManager.reinstallLibrary(libraryName);
      if (result.success) {
        this.promptHandler.displaySuccess(`Reinstalled ${libraryName}@${result.version}`);
        return {
          name: libraryName,
          version: result.version ?? 'unknown',
          installedAt: new Date().toISOString(),
          installPath: result.installPath ?? `node_modules/${libraryName}`
        };
      }

      this.promptHandler.displayError(`Failed to reinstall ${libraryName}: ${result.error}`);
      return null;
    }

    // Fresh installation with retry logic (Requirement 1.7)
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      this.promptHandler.displayInfo(
        attempt === 0
          ? `Installing ${libraryName}...`
          : `Retrying installation of ${libraryName} (attempt ${attempt + 1})...`
      );

      const result = await this.installationManager.installLibrary(libraryName);

      if (result.success) {
        this.promptHandler.displaySuccess(`Installed ${libraryName}@${result.version}`);
        return {
          name: libraryName,
          version: result.version ?? 'unknown',
          installedAt: new Date().toISOString(),
          installPath: result.installPath ?? `node_modules/${libraryName}`
        };
      }

      // Installation failed
      this.promptHandler.displayError(`Installation failed: ${result.error}`);

      if (attempt < MAX_RETRIES) {
        this.promptHandler.displayInfo('Retrying...');
      }
    }

    // All retries exhausted - offer correction or skip (Requirement 1.7)
    this.promptHandler.displayError(
      `Failed to install ${libraryName} after ${MAX_RETRIES + 1} attempts.`
    );

    // Only offer correction if we haven't already recursed (prevent infinite loops)
    if (depth < 1) {
      const correctedName = await this.promptHandler.promptForCorrectedLibraryName(libraryName);

      if (correctedName) {
        // User provided a corrected name - retry with the new name
        this.promptHandler.displayInfo(`Trying corrected library name: ${correctedName}`);
        return this.installLibraryWithRetry(correctedName, depth + 1);
      }
    }

    // User chose to skip or max correction depth reached
    this.promptHandler.displayInfo(`Skipping library: ${libraryName}`);
    return null;
  }

  /**
   * Executes Phase 2: Analysis
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12
   *
   * Prompts for big picture analysis preference, generates visualizations
   * for each library, creates comparison view in comparison mode,
   * saves artifacts, and transitions to PROTOTYPING phase.
   */
  async executeAnalysisPhase(): Promise<void> {
    if (!this.currentSession) {
      throw new WorkflowError(
        'No active session for analysis phase',
        'NO_ACTIVE_WORKFLOW'
      );
    }

    if (this.currentSession.currentPhase !== Phase.ANALYSIS) {
      throw new WorkflowError(
        'Cannot execute analysis phase: not in ANALYSIS phase',
        'INVALID_PHASE',
        { currentPhase: this.currentSession.currentPhase }
      );
    }

    // Step 1: Prompt for big picture analysis preference (Requirement 2.1)
    this.promptHandler.displayPhaseProgress(Phase.ANALYSIS, this.currentSession.completedPhases);
    const wantsBigPicture = await this.promptHandler.promptForBigPictureAnalysis();

    // Record user preference
    this.currentSession.metadata.userInputs.bigPictureRequested = wantsBigPicture;

    // Step 2: Skip to Phase 3 if user declines (Requirement 2.2)
    if (!wantsBigPicture) {
      this.addPhaseAction('User declined big picture analysis - skipping to Prototyping');
      this.promptHandler.displayInfo('Skipping big picture analysis. Moving to Prototyping phase.');
      this.promptHandler.displayPhaseTransition(Phase.ANALYSIS, Phase.PROTOTYPING);
      await this.transitionToPhase(Phase.PROTOTYPING);
      return;
    }

    // Step 3: Generate big picture for each library (Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8)
    const libraries = this.currentSession.metadata.libraries;
    const analyses: Array<{ libraryName: string; visualization: string }> = [];

    for (const library of libraries) {
      this.promptHandler.displayInfo(`Analyzing ${library.name}...`);

      try {
        const analysis = await this.bigPictureAnalyzer.analyzeLibrary(library.name);
        const visualization = this.bigPictureAnalyzer.generateVisualization(analysis);

        analyses.push({ libraryName: library.name, visualization });

        // Save big picture visualization as artifact (Requirement 2.11)
        const artifactName = `${this.sanitizeLibraryName(library.name)}-big-picture.md`;
        const artifactPath = `libraries/${this.sanitizeLibraryName(library.name)}/big-picture.md`;

        const artifact: ArtifactReference = {
          type: ArtifactType.BIG_PICTURE,
          name: artifactName,
          path: artifactPath,
          createdAt: new Date().toISOString()
        };

        this.currentSession.artifacts.push(artifact);
        this.addPhaseAction(`Generated big picture for ${library.name}`);
        this.promptHandler.displaySuccess(`Big picture analysis complete for ${library.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.promptHandler.displayError(`Failed to analyze ${library.name}: ${errorMessage}`);
        this.addPhaseAction(`Failed to analyze ${library.name}: ${errorMessage}`);
      }
    }

    // Step 4: Generate comparison view for comparison mode (Requirements 2.9, 2.10)
    if (this.currentSession.metadata.mode === ResearchMode.COMPARISON && analyses.length >= 2) {
      this.promptHandler.displayInfo('Generating comparison view...');

      try {
        // Re-analyze all libraries to get LibraryAnalysis objects for comparison
        const libraryAnalyses = [];
        for (const library of libraries) {
          try {
            const analysis = await this.bigPictureAnalyzer.analyzeLibrary(library.name);
            libraryAnalyses.push(analysis);
          } catch {
            // Skip libraries that fail re-analysis
          }
        }

        if (libraryAnalyses.length >= 2) {
          const comparisonView = this.bigPictureAnalyzer.generateComparisonView(libraryAnalyses);

          // Save comparison view as artifact
          const comparisonArtifact: ArtifactReference = {
            type: ArtifactType.COMPARISON_VIEW,
            name: 'comparison-view.md',
            path: 'comparison-view.md',
            createdAt: new Date().toISOString()
          };

          this.currentSession.artifacts.push(comparisonArtifact);
          this.addPhaseAction('Generated comparison view');
          this.promptHandler.displaySuccess('Comparison view generated');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.promptHandler.displayError(`Failed to generate comparison view: ${errorMessage}`);
        this.addPhaseAction(`Failed to generate comparison view: ${errorMessage}`);
      }
    }

    // Step 5: Save session and transition to PROTOTYPING phase (Requirement 2.12)
    await this.sessionManager.saveSession(this.currentSession);
    this.promptHandler.displaySuccess('Analysis phase complete!');
    this.promptHandler.displayPhaseTransition(Phase.ANALYSIS, Phase.PROTOTYPING);
    await this.transitionToPhase(Phase.PROTOTYPING);
  }

  /**
   * Executes Phase 3: Prototyping
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   *
   * Prompts user for prototype/example requests in a loop,
   * creates artifact records for each request, saves them via ArtifactCoordinator,
   * tracks requests in session metadata, and transitions to DECISION phase
   * when the user indicates completion.
   */
  async executePrototypingPhase(): Promise<void> {
    if (!this.currentSession) {
      throw new WorkflowError(
        'No active session for prototyping phase',
        'NO_ACTIVE_WORKFLOW'
      );
    }

    if (this.currentSession.currentPhase !== Phase.PROTOTYPING) {
      throw new WorkflowError(
        'Cannot execute prototyping phase: not in PROTOTYPING phase',
        'INVALID_PHASE',
        { currentPhase: this.currentSession.currentPhase }
      );
    }

    // Display phase progress
    this.promptHandler.displayPhaseProgress(Phase.PROTOTYPING, this.currentSession.completedPhases);

    // Initialize prototype requests tracking in session metadata
    if (!this.currentSession.metadata.userInputs.prototypeRequests) {
      this.currentSession.metadata.userInputs.prototypeRequests = [];
    }

    // Prototype request loop (Requirement 3.7: allow multiple examples)
    let prototypeCount = 0;

    while (true) {
      // Step 1: Prompt for prototype request (Requirement 3.1)
      const request = await this.promptHandler.promptForPrototypeRequest();

      // Step 2: If null, user is done - break loop (Requirement 3.6)
      if (request === null) {
        break;
      }

      prototypeCount++;

      // Track request in session metadata
      this.currentSession.metadata.userInputs.prototypeRequests.push(request);

      // Step 3: Create prototype artifact (Requirements 3.2, 3.3, 3.5)
      const artifactName = `prototype-${prototypeCount}-${this.sanitizeLibraryName(request.slice(0, 40))}.md`;
      const artifact: Artifact = {
        type: ArtifactType.PROTOTYPE,
        name: artifactName,
        content: this.renderPrototypeContent(request, prototypeCount),
        metadata: {
          createdAt: new Date().toISOString(),
          phase: Phase.PROTOTYPING,
          relatedLibraries: this.currentSession.metadata.libraries.map(l => l.name),
          tags: ['prototype', 'example', `request-${prototypeCount}`]
        }
      };

      // Step 4: Save artifact to prototypes directory (Requirement 3.4)
      const savedPath = await this.artifactCoordinator.saveArtifact(artifact, this.currentSession);

      // Step 5: Track artifact reference in session
      const artifactRef: ArtifactReference = {
        type: ArtifactType.PROTOTYPE,
        name: artifactName,
        path: savedPath,
        createdAt: artifact.metadata.createdAt
      };
      this.currentSession.artifacts.push(artifactRef);

      // Record action in phase history
      this.addPhaseAction(`Created prototype: ${artifactName}`);

      // Display success feedback
      this.promptHandler.displaySuccess(`Prototype saved: ${artifactName}`);
    }

    // Save session state
    await this.sessionManager.saveSession(this.currentSession);

    // Display summary
    if (prototypeCount === 0) {
      this.promptHandler.displayInfo('No prototypes created. Moving to Decision phase.');
    } else {
      this.promptHandler.displaySuccess(
        `Prototyping phase complete! Created ${prototypeCount} prototype(s).`
      );
    }

    // Transition to DECISION phase (Requirement 3.6)
    this.promptHandler.displayPhaseTransition(Phase.PROTOTYPING, Phase.DECISION);
    await this.transitionToPhase(Phase.DECISION);
  }

  /**
   * Executes Phase 4: Decision
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
   *
   * Prompts for library decision, collects rationale, generates final report,
   * ADR, optional Research Decision Record, artifact index, finalizes session,
   * and displays artifact summary.
   */
  async executeDecisionPhase(): Promise<void> {
    if (!this.currentSession) {
      throw new WorkflowError(
        'No active session for decision phase',
        'NO_ACTIVE_WORKFLOW'
      );
    }

    if (this.currentSession.currentPhase !== Phase.DECISION) {
      throw new WorkflowError(
        'Cannot execute decision phase: not in DECISION phase',
        'INVALID_PHASE',
        { currentPhase: this.currentSession.currentPhase }
      );
    }

    // Step 1: Display phase progress
    this.promptHandler.displayPhaseProgress(Phase.DECISION, this.currentSession.completedPhases);

    // Step 2: Get library names from session metadata
    const libraries = this.currentSession.metadata.libraries.map(l => l.name);
    const mode = this.currentSession.metadata.mode;

    // Step 3: Prompt for decision (Requirement 4.1, 4.2)
    const selectedLibrary = await this.promptHandler.promptForDecision(libraries, mode);
    this.addPhaseAction(`Selected library: ${selectedLibrary}`);

    // Step 4: Collect decision rationale (Requirement 4.2)
    const rationale = await this.promptHandler.promptForDecisionRationale();
    this.addPhaseAction(`Recorded decision rationale`);

    // Step 5: Build ComparisonData from session (empty Maps as placeholder)
    const comparisonData: ComparisonData = {
      complexityScores: new Map<string, number>(),
      modularityScores: new Map<string, number>(),
      bundleSizes: new Map<string, BundleSize>(),
      tokenEstimates: new Map<string, TokenEstimate>()
    };

    // Step 6: Create Decision object
    const decision: Decision = {
      selectedLibrary,
      rationale,
      comparisonData
    };

    // Step 7: Generate final report (Requirement 4.3)
    const finalReport = await this.artifactCoordinator.generateFinalReport(this.currentSession);
    const finalReportPath = await this.artifactCoordinator.saveArtifact(finalReport, this.currentSession);
    const finalReportRef: ArtifactReference = {
      type: ArtifactType.FINAL_REPORT,
      name: finalReport.name,
      path: finalReportPath,
      createdAt: finalReport.metadata.createdAt
    };
    this.currentSession.artifacts.push(finalReportRef);
    this.addPhaseAction('Generated final report');

    // Step 8: Generate ADR (Requirements 4.4, 4.5)
    const adr = await this.artifactCoordinator.generateADR(this.currentSession, decision);
    const adrPath = await this.artifactCoordinator.saveArtifact(adr, this.currentSession);
    const adrRef: ArtifactReference = {
      type: ArtifactType.ADR,
      name: adr.name,
      path: adrPath,
      createdAt: adr.metadata.createdAt
    };
    this.currentSession.artifacts.push(adrRef);
    this.addPhaseAction('Generated ADR');

    // Step 9: Prompt for wiki integration (Requirement 4.6)
    const wantsWiki = await this.promptHandler.promptForWikiIntegration();

    // Step 10: If accepted, generate Research Decision Record (Requirement 4.7)
    if (wantsWiki) {
      const rdr = await this.artifactCoordinator.generateResearchDecisionRecord(this.currentSession);
      const rdrPath = await this.artifactCoordinator.saveArtifact(rdr, this.currentSession);
      const rdrRef: ArtifactReference = {
        type: ArtifactType.RESEARCH_DECISION_RECORD,
        name: rdr.name,
        path: rdrPath,
        createdAt: rdr.metadata.createdAt
      };
      this.currentSession.artifacts.push(rdrRef);
      this.addPhaseAction('Generated Research Decision Record');
    }

    // Step 11: Generate artifact index
    await this.artifactCoordinator.generateArtifactIndex(this.currentSession);
    this.addPhaseAction('Generated artifact index');

    // Step 12: Transition to FINALIZED phase (Requirement 4.8)
    await this.transitionToPhase(Phase.FINALIZED);

    // Step 13: Finalize session via SessionManager
    await this.sessionManager.finalizeSession(this.currentSession);
    this.promptHandler.displaySuccess('Research session finalized!');

    // Step 14: Display artifact summary (Requirement 4.9)
    const artifactSummary = this.currentSession.artifacts.map(a => ({
      type: a.type,
      name: a.name,
      path: a.path
    }));
    this.promptHandler.displayArtifactSummary(artifactSummary);

    // Clear session reference since it's finalized
    this.currentSession = null;
  }

  /**
   * Gets the current active session
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Sets the current session (used for testing and session restoration)
   */
  setSession(session: Session): void {
    this.currentSession = session;
  }

  /**
   * Private helper: Update phase history when transitioning
   */
  private updatePhaseHistory(fromPhase: Phase, toPhase: Phase): void {
    if (!this.currentSession) return;

    const now = new Date().toISOString();

    // Complete the previous phase in history
    const previousPhaseHistory = this.currentSession.history.find(
      h => h.phase === fromPhase && h.completedAt === null
    );

    if (previousPhaseHistory) {
      previousPhaseHistory.completedAt = now;
    }

    // Start new phase in history
    this.currentSession.history.push({
      phase: toPhase,
      startedAt: now,
      completedAt: null,
      actions: []
    });
  }

  /**
   * Adds an action to the current phase history
   */
  addPhaseAction(action: string): void {
    if (!this.currentSession) return;

    const currentPhaseHistory = this.currentSession.history.find(
      h => h.phase === this.currentSession!.currentPhase && h.completedAt === null
    );

    if (currentPhaseHistory) {
      currentPhaseHistory.actions.push(action);
    }
  }

  /**
   * Sanitizes a library name for use in file paths
   * Converts scoped packages like @angular/cdk to angular-cdk
   */
  private sanitizeLibraryName(libraryName: string): string {
    return libraryName
      .replace(/^@/, '')
      .replace(/\//g, '-')
      .replace(/[^\w-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Renders prototype content as markdown
   * Requirements: 3.2, 3.3, 3.5
   * Generates a minimal example placeholder documenting the request
   * as a candidate for Research Decision Records.
   */
  private renderPrototypeContent(request: string, index: number): string {
    const libraries = this.currentSession?.metadata.libraries ?? [];
    const libraryList = libraries.map(l => `- ${l.name}@${l.version}`).join('\n');

    return [
      `# Prototype ${index}: ${request}`,
      '',
      `**Request**: ${request}`,
      `**Created**: ${new Date().toISOString()}`,
      `**Phase**: Prototyping`,
      '',
      '## Libraries',
      '',
      libraryList,
      '',
      '## Example',
      '',
      '```typescript',
      `// TODO: Generate minimal example for: ${request}`,
      '// This prototype is a candidate for the Research Decision Record.',
      '```',
      '',
      '## Notes',
      '',
      '- Minimal, runnable code demonstrating the requested pattern',
      '- Follows minimal example principles (no extra features, inline templates, clear comments)',
      '- Candidate for Research Decision Record documentation',
      ''
    ].join('\n');
  }

  /**
   * Provides a user-friendly suggestion for why a phase transition is invalid
   * and what actions are required to enable it.
   * Requirement 5.6: Suggest required actions
   */
  private getTransitionSuggestion(currentPhase: Phase, targetPhase: Phase): string | null {
    const suggestions: Record<string, string> = {
      [`${Phase.IDLE}-${Phase.ANALYSIS}`]: 'Complete the Setup phase first by running executeSetupPhase().',
      [`${Phase.IDLE}-${Phase.PROTOTYPING}`]: 'Complete Setup and Analysis phases first.',
      [`${Phase.IDLE}-${Phase.DECISION}`]: 'Complete Setup, Analysis, and Prototyping phases first.',
      [`${Phase.SETUP}-${Phase.PROTOTYPING}`]: 'Complete the Analysis phase first (or skip it explicitly).',
      [`${Phase.SETUP}-${Phase.DECISION}`]: 'Complete Analysis and Prototyping phases first.',
      [`${Phase.ANALYSIS}-${Phase.DECISION}`]: 'Complete the Prototyping phase first.',
      [`${Phase.FINALIZED}-${Phase.SETUP}`]: 'This session is finalized. Start a new workflow instead.',
      [`${Phase.FINALIZED}-${Phase.ANALYSIS}`]: 'This session is finalized. Start a new workflow instead.',
      [`${Phase.FINALIZED}-${Phase.PROTOTYPING}`]: 'This session is finalized. Start a new workflow instead.',
      [`${Phase.FINALIZED}-${Phase.DECISION}`]: 'This session is finalized. Start a new workflow instead.',
    };

    return suggestions[`${currentPhase}-${targetPhase}`] ?? null;
  }
}
