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

  protected readonly visibleSession = computed(() => {
    const session = this.assessmentService.currentSession();
    return session?.status === 'active' ? session : null;
  });

  protected readonly assessmentError = computed(() => this.assessmentService.lastError());

  private readonly pendingAssessmentRequest = signal<
    { conceptId: string; conceptTitle: string } | null
  >(null);

  constructor() {

    effect(() => {
      const conceptId = this.graphState.assessmentRequestedConceptId();
      if (!conceptId) return;

      const conceptTitle =
        untracked(() => this.graphState.graphData()?.nodes.get(conceptId)?.title) ?? conceptId;

      this.startAssessment(conceptId, conceptTitle);
    });
  }

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

  protected handleResponseSubmitted(responseText: string): void {
    const session = this.assessmentService.currentSession();
    if (!session) return;

    this.assessmentService
      .submitResponse(session.sessionId, responseText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyAssessmentResult(session, result),
        error: (error: unknown) => {

          console.error('Assessment response submission failed:', error);
        },
      });
  }

  private applyAssessmentResult(
    session: { conceptId: string; conceptTitle: string },
    result: AssessmentResult | null
  ): void {
    if (!result) return; 

    this.progressStateService
      .setProgress(session.conceptId, session.conceptTitle, result.evaluatedState)
      .catch((error) => {
        console.error(`Failed to save progress for ${session.conceptTitle}:`, error);
      })
      .finally(() => {
        this.graphState.clearAssessmentRequest();
      });
  }

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

  protected handleCancelled(): void {
    const session = this.assessmentService.currentSession();
    if (session) {
      this.assessmentService.cancelAssessment(session.sessionId);
    }

    this.assessmentService.clearError();
    this.pendingAssessmentRequest.set(null);
    this.graphState.clearAssessmentRequest();
  }

  protected handleFilterChanged(states: ProgressState[]): void {
    this.graphState.filterByProgress(states);
  }

  protected handleRefreshRequested(): void {
    this.progressStateService.refreshFromDisk().catch((error) => {
      console.error('Failed to refresh progress data from disk:', error);
    });
  }

  protected handleRetryRequested(): void {
    this.progressStateService.retryLastWrite().catch((error) => {
      console.error('Failed to retry saving progress:', error);
    });
  }

  protected handleRebuildIndexRequested(): void {
    this.progressStateService.rebuildIndex().catch((error) => {
      console.error('Failed to rebuild index:', error);
    });
  }
}
