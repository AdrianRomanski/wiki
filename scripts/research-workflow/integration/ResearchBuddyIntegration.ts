/**
 * ResearchBuddyIntegration - Integration layer between structured workflow and research-buddy skill
 * Feature: polished-research-workflow
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { WorkflowOrchestrator } from '../orchestrator/WorkflowOrchestrator';
import { SessionManager } from '../session/SessionManager';
import { UserPromptHandler } from '../prompts/UserPromptHandler';
import { LibraryInstallationManager } from '../installation/LibraryInstallationManager';
import { BigPictureAnalyzer } from '../analyzer/BigPictureAnalyzer';
import { ArtifactCoordinator } from '../artifacts/ArtifactCoordinator';

/**
 * Research buddy workflow mode selection
 * Requirement 10.2: Offer both structured workflow and ad-hoc research modes
 */
export enum ResearchBuddyMode {
  STRUCTURED = 'STRUCTURED',
  AD_HOC = 'AD_HOC'
}

/**
 * Result returned when ad-hoc mode is selected
 */
export interface AdHocModeResult {
  mode: ResearchBuddyMode.AD_HOC;
  message: string;
}

/**
 * Result returned when structured mode is selected
 */
export interface StructuredModeResult {
  mode: ResearchBuddyMode.STRUCTURED;
  orchestrator: WorkflowOrchestrator;
}

export type RunResult = AdHocModeResult | StructuredModeResult;

/**
 * Optional dependencies for ResearchBuddyIntegration, enabling testability
 */
export interface ResearchBuddyDependencies {
  sessionManager?: SessionManager;
  promptHandler?: UserPromptHandler;
  installationManager?: LibraryInstallationManager;
  bigPictureAnalyzer?: BigPictureAnalyzer;
  artifactCoordinator?: ArtifactCoordinator;
}

/**
 * Mode selector interface for testability
 */
export interface ModeSelector {
  selectMode(): Promise<ResearchBuddyMode>;
}

/**
 * Default mode selector that uses console output (placeholder for CLI integration)
 */
export class DefaultModeSelector implements ModeSelector {
  async selectMode(): Promise<ResearchBuddyMode> {
    console.log('\n=== Research Buddy ===');
    console.log('Select research mode:');
    console.log('1. STRUCTURED - Guided 4-phase workflow (Setup → Analysis → Prototyping → Decision)');
    console.log('2. AD_HOC - Freeform research with existing capabilities');
    throw new Error('selectMode: User input collection not yet implemented - requires CLI integration');
  }
}

/**
 * ResearchBuddyIntegration serves as the integration layer between the structured
 * workflow system and the existing research-buddy skill.
 *
 * It provides:
 * - Mode selection (structured vs ad-hoc)
 * - Orchestrator creation and lifecycle management
 * - Reuse of existing capabilities (comparison matrices, visualization, ADR generation)
 * - Compatibility with existing session directory structure (.kiro/research/sessions/)
 *
 * Requirement 10.1: Invokable through existing research-buddy skill interface
 * Requirement 10.5: Reuse existing comparison matrices, visualization, and ADR generation
 * Requirement 10.6: Maintain compatibility with existing session directory structure
 * Requirement 10.7: Follow existing naming conventions and formats
 */
export class ResearchBuddyIntegration {
  private readonly sessionManager: SessionManager;
  private readonly promptHandler: UserPromptHandler;
  private readonly installationManager: LibraryInstallationManager;
  private readonly bigPictureAnalyzer: BigPictureAnalyzer;
  private readonly artifactCoordinator: ArtifactCoordinator;
  private readonly modeSelector: ModeSelector;
  private orchestrator: WorkflowOrchestrator | null = null;

  /**
   * Creates a new ResearchBuddyIntegration instance.
   * Accepts optional dependencies for testability and reuse.
   *
   * Requirement 10.6: Uses .kiro/research/sessions/ as default base directory
   */
  constructor(deps?: ResearchBuddyDependencies, modeSelector?: ModeSelector) {
    const baseDir = '.kiro/research/sessions';

    this.sessionManager = deps?.sessionManager ?? new SessionManager(baseDir);
    this.promptHandler = deps?.promptHandler ?? new UserPromptHandler();
    this.installationManager = deps?.installationManager ?? new LibraryInstallationManager();
    this.bigPictureAnalyzer = deps?.bigPictureAnalyzer ?? new BigPictureAnalyzer();
    this.artifactCoordinator = deps?.artifactCoordinator ?? new ArtifactCoordinator(baseDir);
    this.modeSelector = modeSelector ?? new DefaultModeSelector();
  }

  /**
   * Selects the workflow mode (structured or ad-hoc).
   * Requirement 10.2: Offer both structured workflow and ad-hoc research modes
   */
  async selectMode(): Promise<ResearchBuddyMode> {
    return this.modeSelector.selectMode();
  }

  /**
   * Starts the structured workflow by creating a WorkflowOrchestrator
   * and executing the setup phase.
   *
   * Requirement 10.3: When structured selected, begin Phase 1
   * Requirement 10.5: Reuse existing capabilities via orchestrator
   */
  async startStructuredWorkflow(): Promise<WorkflowOrchestrator> {
    this.orchestrator = new WorkflowOrchestrator(
      this.sessionManager,
      this.promptHandler,
      this.installationManager,
      this.bigPictureAnalyzer,
      this.artifactCoordinator
    );

    await this.orchestrator.executeSetupPhase();

    return this.orchestrator;
  }

  /**
   * Starts ad-hoc mode, indicating that the existing research-buddy
   * capabilities are active without the structured workflow.
   *
   * Requirement 10.4: When ad-hoc selected, operate with existing capabilities
   * Requirement 10.8: Support all existing research-buddy commands
   */
  async startAdHocMode(): Promise<AdHocModeResult> {
    return {
      mode: ResearchBuddyMode.AD_HOC,
      message: 'Ad-hoc research mode active. All existing research-buddy commands are available.'
    };
  }

  /**
   * Main entry point that orchestrates mode selection and execution.
   *
   * Requirement 10.1: Invokable through existing research-buddy skill interface
   * Requirement 10.2: Offer both structured workflow and ad-hoc research modes
   * Requirement 10.3: When structured selected, begin Phase 1
   * Requirement 10.4: When ad-hoc selected, operate with existing capabilities
   */
  async run(): Promise<RunResult> {
    const mode = await this.selectMode();

    if (mode === ResearchBuddyMode.STRUCTURED) {
      const orchestrator = await this.startStructuredWorkflow();
      return { mode: ResearchBuddyMode.STRUCTURED, orchestrator };
    }

    return this.startAdHocMode();
  }

  /**
   * Returns the underlying orchestrator instance, if a structured workflow
   * has been started. This exposes visualization, comparison, and ADR
   * capabilities for reuse.
   *
   * Requirement 10.5: Reuse existing comparison matrices, visualization, and ADR generation
   */
  getOrchestrator(): WorkflowOrchestrator | null {
    return this.orchestrator;
  }

  /**
   * Returns the session manager for session directory operations.
   * Requirement 10.6: Maintain compatibility with existing session directory structure
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Returns the artifact coordinator for reuse of ADR generation templates
   * and artifact management.
   * Requirement 10.5: Reuse existing ADR generation templates
   */
  getArtifactCoordinator(): ArtifactCoordinator {
    return this.artifactCoordinator;
  }

  /**
   * Returns the big picture analyzer for reuse of visualization capabilities.
   * Requirement 10.5: Reuse existing visualization capabilities
   */
  getBigPictureAnalyzer(): BigPictureAnalyzer {
    return this.bigPictureAnalyzer;
  }
}
