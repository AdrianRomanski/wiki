import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { WikiGraphPageComponent } from './wiki-graph-smart.component';
import { GraphStateService } from '../../../services/graph-state.service';
import { AssessmentService } from '../../../services/assessment.service';
import { ProgressStateService } from '../../../services/progress-state.service';
import type { GraphData, GraphNode } from '../../../models/graph.models';
import type { AssessmentSession, AssessmentResult } from '../../../models/assessment.models';
import type { ProgressState } from '../../../models/progress.models';

function makeNode(id: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    id,
    title: id.charAt(0).toUpperCase() + id.slice(1),
    type: 'entity',
    tags: [],
    filePath: `entities/${id}.md`,
    isGhost: false,
    inDegree: 0,
    outDegree: 0,
    ...overrides,
  };
}

function makeGraphData(nodes: GraphNode[]): GraphData {
  return { nodes: new Map(nodes.map((n) => [n.id, n])), edges: [], allTags: [] };
}

function makeSession(overrides: Partial<AssessmentSession> = {}): AssessmentSession {
  return {
    sessionId: 'session-1',
    conceptId: 'angular',
    conceptTitle: 'Angular',
    questions: [{ id: 'q1', text: 'What is Angular?', type: 'open-ended' }],
    responses: [],
    status: 'active',
    ...overrides,
  };
}

describe('WikiGraphPageComponent', () => {
  let fixture: ComponentFixture<WikiGraphPageComponent>;
  let component: WikiGraphPageComponent;

  let assessmentRequestedConceptId: ReturnType<typeof signal<string | null>>;
  let graphDataSig: ReturnType<typeof signal<GraphData | null>>;
  let graphStateFake: {
    loadGraph: ReturnType<typeof vi.fn>;
    selectNode: ReturnType<typeof vi.fn>;
    setTypeFilter: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setTagFilter: ReturnType<typeof vi.fn>;
    requestAssessment: ReturnType<typeof vi.fn>;
    clearAssessmentRequest: ReturnType<typeof vi.fn>;
    filterByProgress: ReturnType<typeof vi.fn>;
    [key: string]: unknown;
  };

  let assessmentServiceFake: {
    currentSession: ReturnType<typeof signal<AssessmentSession | null>>;
    lastError: ReturnType<typeof signal<string | null>>;
    initiateAssessment: ReturnType<typeof vi.fn>;
    submitResponse: ReturnType<typeof vi.fn>;
    retryEvaluation: ReturnType<typeof vi.fn>;
    cancelAssessment: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
  };

  let progressStateServiceFake: {
    setProgress: ReturnType<typeof vi.fn>;
    getLastSyncTime: ReturnType<typeof vi.fn>;
    getLastError: ReturnType<typeof vi.fn>;
    getLastFailedWrite: ReturnType<typeof vi.fn>;
    refreshFromDisk: ReturnType<typeof vi.fn>;
    retryLastWrite: ReturnType<typeof vi.fn>;
    rebuildIndex: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    assessmentRequestedConceptId = signal<string | null>(null);
    graphDataSig = signal<GraphData | null>(makeGraphData([makeNode('angular')]));

    graphStateFake = {
      graphData: graphDataSig,
      selectedNode: signal<GraphNode | null>(null),
      activeTypeFilters: signal(new Set(['entity', 'concept', 'source'])),
      searchQuery: signal(''),
      activeTagFilter: signal<string | null>(null),
      isLoading: signal(false),
      error: signal<string | null>(null),
      visualizationMode: signal('wiki'),
      progressStates: signal(new Map<string, ProgressState>()),
      activeProgressFiltersList: signal<ProgressState[]>([]),
      progressStats: signal({
        total: 0,
        notStarted: 0,
        inProgress: 0,
        understood: 0,
        mastered: 0,
        percentComplete: 0,
      }),
      selectedNodeProgress: signal(null),
      visibleNodes: signal<GraphNode[]>([]),
      orphanNodes: signal<GraphNode[]>([]),
      hubNodes: signal<GraphNode[]>([]),
      assessmentRequestedConceptId,
      loadGraph: vi.fn(),
      selectNode: vi.fn(),
      setTypeFilter: vi.fn(),
      setSearchQuery: vi.fn(),
      setTagFilter: vi.fn(),
      requestAssessment: vi.fn((id: string) => assessmentRequestedConceptId.set(id)),
      clearAssessmentRequest: vi.fn(() => assessmentRequestedConceptId.set(null)),
      filterByProgress: vi.fn(),
    };

    assessmentServiceFake = {
      currentSession: signal<AssessmentSession | null>(null),
      lastError: signal<string | null>(null),
      initiateAssessment: vi.fn().mockReturnValue(of(makeSession())),
      submitResponse: vi.fn().mockReturnValue(of(null)),
      retryEvaluation: vi.fn().mockReturnValue(of(null)),
      cancelAssessment: vi.fn(),
      clearError: vi.fn(() => assessmentServiceFake.lastError.set(null)),
    };

    progressStateServiceFake = {
      setProgress: vi.fn().mockResolvedValue(undefined),
      getLastSyncTime: vi.fn().mockReturnValue(signal<Date | null>(null)),
      getLastError: vi.fn().mockReturnValue(signal<string | null>(null)),
      getLastFailedWrite: vi.fn().mockReturnValue(signal(null)),
      refreshFromDisk: vi.fn().mockResolvedValue(undefined),
      retryLastWrite: vi.fn().mockResolvedValue(undefined),
      rebuildIndex: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [WikiGraphPageComponent],
      providers: [
        { provide: GraphStateService, useValue: graphStateFake },
        { provide: AssessmentService, useValue: assessmentServiceFake },
        { provide: ProgressStateService, useValue: progressStateServiceFake },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WikiGraphPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads the graph on init', () => {
    fixture.detectChanges();
    expect(graphStateFake.loadGraph).toHaveBeenCalled();
  });

  describe('assessment initiation (Requirement 5.1)', () => {
    it('calls AssessmentService.initiateAssessment with the concept id and title when requested', () => {
      fixture.detectChanges();

      assessmentRequestedConceptId.set('angular');
      fixture.detectChanges();

      expect(assessmentServiceFake.initiateAssessment).toHaveBeenCalledWith('angular', 'Angular');
    });

    it('falls back to the concept id as title when the node cannot be found', () => {
      fixture.detectChanges();

      assessmentRequestedConceptId.set('unknown-concept');
      fixture.detectChanges();

      expect(assessmentServiceFake.initiateAssessment).toHaveBeenCalledWith(
        'unknown-concept',
        'unknown-concept'
      );
    });

    it('does not call initiateAssessment when no assessment is requested', () => {
      fixture.detectChanges();
      expect(assessmentServiceFake.initiateAssessment).not.toHaveBeenCalled();
    });
  });

  describe('handleResponseSubmitted (Requirements 5.2, 5.3, 5.4)', () => {
    it('forwards the response text to AssessmentService.submitResponse for the current session', () => {
      assessmentServiceFake.currentSession.set(makeSession());
      fixture.detectChanges();

      component['handleResponseSubmitted']('My answer');

      expect(assessmentServiceFake.submitResponse).toHaveBeenCalledWith('session-1', 'My answer');
    });

    it('does nothing when there is no current session', () => {
      fixture.detectChanges();
      component['handleResponseSubmitted']('My answer');
      expect(assessmentServiceFake.submitResponse).not.toHaveBeenCalled();
    });

    it('does not update progress or clear the request while more questions remain (null result)', () => {
      assessmentServiceFake.currentSession.set(makeSession());
      assessmentServiceFake.submitResponse.mockReturnValue(of(null));
      fixture.detectChanges();

      component['handleResponseSubmitted']('Partial answer');

      expect(progressStateServiceFake.setProgress).not.toHaveBeenCalled();
      expect(graphStateFake.clearAssessmentRequest).not.toHaveBeenCalled();
    });

    it('calls ProgressStateService.setProgress with the evaluated state on completion and clears the request', async () => {
      const result: AssessmentResult = {
        sessionId: 'session-1',
        evaluatedState: 'Understood',
        confidence: 0.8,
        feedback: 'Nice work',
      };
      assessmentServiceFake.currentSession.set(makeSession());
      assessmentServiceFake.submitResponse.mockReturnValue(of(result));
      fixture.detectChanges();

      component['handleResponseSubmitted']('Detailed answer');

      await Promise.resolve();
      await Promise.resolve();

      expect(progressStateServiceFake.setProgress).toHaveBeenCalledWith(
        'angular',
        'Angular',
        'Understood'
      );
      expect(graphStateFake.clearAssessmentRequest).toHaveBeenCalled();
    });

    it('does not update progress and leaves the request open when the service call errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      assessmentServiceFake.currentSession.set(makeSession());
      assessmentServiceFake.submitResponse.mockReturnValue(
        throwError(() => new Error('Assessment service temporarily unavailable. Please try again.'))
      );
      fixture.detectChanges();

      component['handleResponseSubmitted']('Detailed answer');
      await Promise.resolve();

      expect(progressStateServiceFake.setProgress).not.toHaveBeenCalled();
      expect(graphStateFake.clearAssessmentRequest).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Assessment response submission failed:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('assessmentError (Requirements 5.3, 5.4)', () => {
    it('reflects AssessmentService.lastError()', () => {
      fixture.detectChanges();
      expect(component['assessmentError']()).toBeNull();

      assessmentServiceFake.lastError.set('Assessment service temporarily unavailable. Please try again.');
      fixture.detectChanges();

      expect(component['assessmentError']()).toBe(
        'Assessment service temporarily unavailable. Please try again.'
      );
    });
  });

  describe('handleAssessmentRetried (Requirement 5.3)', () => {
    it('retries evaluation when the session already has all responses collected', () => {
      const completeSession = makeSession({
        responses: [{ questionId: 'q1', text: 'answer', timestamp: new Date().toISOString() }],
      });
      assessmentServiceFake.currentSession.set(completeSession);
      assessmentServiceFake.retryEvaluation.mockReturnValue(of(null));
      fixture.detectChanges();

      component['handleAssessmentRetried']();

      expect(assessmentServiceFake.retryEvaluation).toHaveBeenCalledWith('session-1');
    });

    it('persists progress when retryEvaluation succeeds', async () => {
      const completeSession = makeSession({
        responses: [{ questionId: 'q1', text: 'answer', timestamp: new Date().toISOString() }],
      });
      const result: AssessmentResult = {
        sessionId: 'session-1',
        evaluatedState: 'Mastered',
        confidence: 0.9,
        feedback: 'Great',
      };
      assessmentServiceFake.currentSession.set(completeSession);
      assessmentServiceFake.retryEvaluation.mockReturnValue(of(result));
      fixture.detectChanges();

      component['handleAssessmentRetried']();
      await Promise.resolve();
      await Promise.resolve();

      expect(progressStateServiceFake.setProgress).toHaveBeenCalledWith('angular', 'Angular', 'Mastered');
      expect(graphStateFake.clearAssessmentRequest).toHaveBeenCalled();
    });

    it('re-initiates the assessment when no session with complete responses exists', () => {
      fixture.detectChanges();

      assessmentRequestedConceptId.set('angular');
      fixture.detectChanges();
      assessmentServiceFake.initiateAssessment.mockClear();

      component['handleAssessmentRetried']();

      expect(assessmentServiceFake.initiateAssessment).toHaveBeenCalledWith('angular', 'Angular');
    });
  });

  describe('handleCancelled (Requirement 5.1)', () => {
    it('cancels the active session and clears the pending assessment request', () => {
      assessmentServiceFake.currentSession.set(makeSession());
      fixture.detectChanges();

      component['handleCancelled']();

      expect(assessmentServiceFake.cancelAssessment).toHaveBeenCalledWith('session-1');
      expect(graphStateFake.clearAssessmentRequest).toHaveBeenCalled();
    });

    it('clears the pending request even when there is no active session', () => {
      fixture.detectChanges();

      component['handleCancelled']();

      expect(assessmentServiceFake.cancelAssessment).not.toHaveBeenCalled();
      expect(graphStateFake.clearAssessmentRequest).toHaveBeenCalled();
    });

    it('clears the assessment error and does not update progress after a service failure (Requirements 5.3, 5.4)', () => {
      assessmentServiceFake.currentSession.set(makeSession());
      assessmentServiceFake.lastError.set('Assessment service temporarily unavailable. Please try again.');
      fixture.detectChanges();

      component['handleCancelled']();

      expect(assessmentServiceFake.clearError).toHaveBeenCalled();
      expect(progressStateServiceFake.setProgress).not.toHaveBeenCalled();
      expect(graphStateFake.clearAssessmentRequest).toHaveBeenCalled();
    });
  });

  describe('handleFilterChanged (Requirements 7.2, 7.3, 7.4)', () => {
    it('forwards the selected progress states to GraphStateService.filterByProgress', () => {
      fixture.detectChanges();

      component['handleFilterChanged'](['Understood', 'Mastered']);

      expect(graphStateFake.filterByProgress).toHaveBeenCalledWith(['Understood', 'Mastered']);
    });

    it('forwards an empty array to clear all filters', () => {
      fixture.detectChanges();

      component['handleFilterChanged']([]);

      expect(graphStateFake.filterByProgress).toHaveBeenCalledWith([]);
    });
  });

  describe('handleRefreshRequested (Requirement 7.1)', () => {
    it('calls ProgressStateService.refreshFromDisk', () => {
      fixture.detectChanges();

      component['handleRefreshRequested']();

      expect(progressStateServiceFake.refreshFromDisk).toHaveBeenCalled();
    });

    it('logs an error when refreshFromDisk rejects', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      progressStateServiceFake.refreshFromDisk.mockRejectedValue(new Error('disk failure'));
      fixture.detectChanges();

      component['handleRefreshRequested']();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh progress data from disk:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleRetryRequested (Requirement 2.3)', () => {
    it('calls ProgressStateService.retryLastWrite', () => {
      fixture.detectChanges();

      component['handleRetryRequested']();

      expect(progressStateServiceFake.retryLastWrite).toHaveBeenCalled();
    });

    it('logs an error when retryLastWrite rejects', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      progressStateServiceFake.retryLastWrite.mockRejectedValue(new Error('still failing'));
      fixture.detectChanges();

      component['handleRetryRequested']();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to retry saving progress:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleRebuildIndexRequested (Requirement 2.1)', () => {
    it('calls ProgressStateService.rebuildIndex', () => {
      fixture.detectChanges();

      component['handleRebuildIndexRequested']();

      expect(progressStateServiceFake.rebuildIndex).toHaveBeenCalled();
    });

    it('logs an error when rebuildIndex rejects', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      progressStateServiceFake.rebuildIndex.mockRejectedValue(new Error('disk failure'));
      fixture.detectChanges();

      component['handleRebuildIndexRequested']();
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to rebuild index:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('visibleSession', () => {
    it('is null when there is no current session', () => {
      fixture.detectChanges();
      expect(component['visibleSession']()).toBeNull();
    });

    it('exposes the session while it is active', () => {
      assessmentServiceFake.currentSession.set(makeSession({ status: 'active' }));
      fixture.detectChanges();
      expect(component['visibleSession']()?.sessionId).toBe('session-1');
    });

    it('hides the session once it is completed', () => {
      assessmentServiceFake.currentSession.set(makeSession({ status: 'completed' }));
      fixture.detectChanges();
      expect(component['visibleSession']()).toBeNull();
    });

    it('hides the session once it is cancelled', () => {
      assessmentServiceFake.currentSession.set(makeSession({ status: 'cancelled' }));
      fixture.detectChanges();
      expect(component['visibleSession']()).toBeNull();
    });
  });
});
