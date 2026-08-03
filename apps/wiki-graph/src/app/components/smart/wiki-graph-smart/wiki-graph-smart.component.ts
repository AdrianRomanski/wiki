import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GraphViewportContainerComponent } from '../../containers/graph-viewport-container/graph-viewport-container.component';
import { AssessmentDialogUiComponent } from '../../ui/assessment-dialog-ui/assessment-dialog-ui.component';
import { ProgressDashboardUiComponent } from '../../ui/progress-dashboard-ui/progress-dashboard-ui.component';
import { GraphStateService } from '../../../services/graph-state.service';
import { AssessmentService } from '../../../services/assessment.service';
import { ProgressStateService } from '../../../services/progress-state.service';
import type { NodeType } from '../../../models/graph.models';
import type { ProgressState } from '../../../models/progress.models';
import type { AssessmentResult } from '../../../models/assessment.models';

@Component({
  selector: 'app-wiki-graph-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GraphViewportContainerComponent,
    AssessmentDialogUiComponent,
    ProgressDashboardUiComponent,
  ],
  templateUrl: './wiki-graph-smart.component.html',
  styleUrl: './wiki-graph-smart.component.scss',
})
export class WikiGraphPageComponent implements OnInit {
  protected readonly graphState = inject(GraphStateService);
  protected readonly assessmentService = inject(AssessmentService);
  protected readonly progressStateService = inject(ProgressStateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly nodeTypes: NodeType[] = ['entity', 'concept', 'source'];
  protected readonly toolbarVisible = signal(true);

  /**
   * The assessment session to display in the dialog. Only exposes the
   * session while it is still 'active' so the dialog closes immediately
   * once a session completes or is cancelled, rather than lingering on the
   * final question until AssessmentService clears currentSession().
   */
  protected readonly visibleSession = computed(() => {
    const session = this.assessmentService.currentSession();
    return session?.status === 'active' ? session : null;
  });

  /**
   * User-friendly message describing the most recent assessment service
   * failure, surfaced to AssessmentDialogUiComponent so it can display a
   * notification with a retry option.
   *
   * Requirements: 5.3, 5.4
   */
  protected readonly assessmentError = computed(() => this.assessmentService.lastError());

  /**
   * Remembers the concept ID/title of the most recently requested
   * assessment so a failed `initiateAssessment()` call can be retried
   * without needing the learner to re-select the node.
   */
  private readonly pendingAssessmentRequest = signal<
    { conceptId: string; conceptTitle: string } | null
  >(null);

  constructor() {
    // React to a Knowledge_Assessment being requested from the graph (Requirement 5.1):
    // initiate the assessment session as soon as a concept ID is set. The concept
    // title is read untracked so this effect only re-runs when the requested
    // concept ID itself changes, not on every unrelated graph data update.
    effect(() => {
      const conceptId = this.graphState.assessmentRequestedConceptId();
      if (!conceptId) return;

      const conceptTitle =
        untracked(() => this.graphState.graphData()?.nodes.get(conceptId)?.title) ?? conceptId;

      this.startAssessment(conceptId, conceptTitle);
    });
  }

  /**
   * Initiates (or re-initiates, on retry) an assessment session for the
   * given concept via AssessmentService, remembering the request so it can
   * be retried again if it fails.
   *
   * Requirements: 5.1, 5.3
   */
  private startAssessment(conceptId: string, conceptTitle: string): void {
    this.pendingAssessmentRequest.set({ conceptId, conceptTitle });

    this.assessmentService
      .initiateAssessment(conceptId, conceptTitle)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          console.error('Failed to initiate assessment:', error);
        },
      });
  }

  protected readonly visibleNodeIds = computed(() =>
    new Set(this.graphState.visibleNodes().map(n => n.id))
  );

  protected readonly visibleEdgeCount = computed(() => {
    const ids = this.visibleNodeIds();
    return (this.graphState.graphData()?.edges ?? [])
      .filter(e => ids.has(e.sourceId) && ids.has(e.targetId)).length;
  });

  protected readonly allTags = () => this.graphState.graphData()?.allTags ?? [];

  ngOnInit(): void {
    this.graphState.loadGraph();
  }

  protected toggleType(type: NodeType): void {
    const active = this.graphState.activeTypeFilters().has(type);
    this.graphState.setTypeFilter(type, !active);
  }

  protected highlightOrphans(): void {
    const orphans = this.graphState.orphanNodes();
    if (orphans.length > 0) this.graphState.selectNode(orphans[0].id);
  }

  /**
   * Handle a response submitted from AssessmentDialogUiComponent. Forwards it
   * to AssessmentService.submitResponse(); once the session completes (a
   * non-null AssessmentResult is emitted), persists the evaluated state via
   * ProgressStateService.setProgress() and closes the dialog.
   *
   * Requirements: 5.2, 5.3, 5.4
   */
  protected handleResponseSubmitted(responseText: string): void {
    const session = this.assessmentService.currentSession();
    if (!session) return;

    this.assessmentService
      .submitResponse(session.sessionId, responseText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyAssessmentResult(session, result),
        error: (error: unknown) => {
          // AssessmentService already logged the error and set lastError()
          // for display; the dialog stays open (with an error banner and
          // retry button) instead of closing, and progress state is left
          // untouched (Requirements 5.3, 5.4).
          console.error('Assessment response submission failed:', error);
        },
      });
  }

  /**
   * Handles the outcome of a completed evaluation (from either
   * `submitResponse()` or `retryEvaluation()`): persists the evaluated
   * state via ProgressStateService.setProgress() and closes the dialog.
   * Does nothing if more questions remain in the session (`result` is
   * null).
   *
   * Requirements: 5.2, 5.3, 5.4
   */
  private applyAssessmentResult(
    session: { conceptId: string; conceptTitle: string },
    result: AssessmentResult | null
  ): void {
    if (!result) return; // More questions remain in the session.

    this.progressStateService
      .setProgress(session.conceptId, session.conceptTitle, result.evaluatedState)
      .catch((error) => {
        console.error(`Failed to save progress for ${session.conceptTitle}:`, error);
      })
      .finally(() => {
        this.graphState.clearAssessmentRequest();
      });
  }

  /**
   * Handle a retry request from AssessmentDialogUiComponent after a
   * service failure (Requirement 5.3). Re-attempts whichever operation
   * failed:
   * - If a session exists and its responses are complete, retries
   *   evaluation of those responses without discarding them.
   * - Otherwise (e.g. `initiateAssessment()` itself failed), re-initiates
   *   the assessment for the concept that was originally requested.
   */
  protected handleAssessmentRetried(): void {
    const session = this.assessmentService.currentSession();

    if (session && session.responses.length === session.questions.length) {
      this.assessmentService
        .retryEvaluation(session.sessionId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => this.applyAssessmentResult(session, result),
          error: (error: unknown) => {
            console.error('Retrying assessment evaluation failed:', error);
          },
        });
      return;
    }

    const pending = this.pendingAssessmentRequest();
    if (pending) {
      this.startAssessment(pending.conceptId, pending.conceptTitle);
    }
  }

  /**
   * Handle assessment cancellation from AssessmentDialogUiComponent: tells
   * AssessmentService to cancel the active session and clears the pending
   * assessment request so the dialog closes.
   *
   * Requirements: 5.1
   */
  protected handleCancelled(): void {
    const session = this.assessmentService.currentSession();
    if (session) {
      this.assessmentService.cancelAssessment(session.sessionId);
    }
    // Allow cancellation without penalty even after a service failure: no
    // progress state is written, and the error is cleared so the banner
    // doesn't reappear the next time the dialog opens.
    this.assessmentService.clearError();
    this.pendingAssessmentRequest.set(null);
    this.graphState.clearAssessmentRequest();
  }

  /**
   * Handle a progress state filter change from ProgressDashboardUiComponent.
   * Forwards the selected states to GraphStateService so the graph renderer
   * hides nodes that don't match any active filter.
   *
   * Requirements: 7.2, 7.3, 7.4
   */
  protected handleFilterChanged(states: ProgressState[]): void {
    this.graphState.filterByProgress(states);
  }

  /**
   * Handle a refresh request from ProgressDashboardUiComponent. Reloads
   * progress data from disk via ProgressStateService. Also used by the
   * error banner's "Reload from Disk" action to manually sync progress
   * after external changes.
   *
   * Requirements: 7.1, 2.1, 2.3
   */
  protected handleRefreshRequested(): void {
    this.progressStateService.refreshFromDisk().catch((error) => {
      console.error('Failed to refresh progress data from disk:', error);
    });
  }

  /**
   * Handle a retry request from the dashboard's error banner. Re-attempts
   * the most recent failed progress write via
   * ProgressStateService.retryLastWrite().
   *
   * Requirements: 2.3
   */
  protected handleRetryRequested(): void {
    this.progressStateService.retryLastWrite().catch((error) => {
      console.error('Failed to retry saving progress:', error);
    });
  }

  /**
   * Handle a "Rebuild Index" request from the dashboard's error banner.
   * Manually reconstructs index.json from the concept files currently
   * loaded in memory via ProgressStateService.rebuildIndex().
   *
   * Requirements: 2.1
   */
  protected handleRebuildIndexRequested(): void {
    this.progressStateService.rebuildIndex().catch((error) => {
      console.error('Failed to rebuild index:', error);
    });
  }
}
