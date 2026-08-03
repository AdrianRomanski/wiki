import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError, catchError, map } from 'rxjs';
import type {
  AssessmentSession,
  AssessmentResult,
  Question,
  Response,
} from '../models/assessment.models';
import type { ProgressState } from '../models/progress.models';

/**
 * Valid Progress_State values an AssessmentResult.evaluatedState is allowed
 * to carry. Used to detect malformed AI responses (Requirement 5.3/5.4).
 */
const VALID_PROGRESS_STATES: readonly ProgressState[] = [
  'Not_Started',
  'In_Progress',
  'Understood',
  'Mastered',
];

/**
 * User-facing message shown when the AI assessment service is unavailable
 * or a request fails for a transient reason (network error, timeout, etc.).
 */
const SERVICE_UNAVAILABLE_MESSAGE =
  'Assessment service temporarily unavailable. Please try again.';

/**
 * User-facing message shown when the AI agent returns a response that does
 * not match the expected AssessmentResult shape.
 */
const MALFORMED_RESPONSE_MESSAGE =
  'Assessment could not be completed due to a service error.';

/**
 * Mock AssessmentService for AI-driven knowledge validation.
 * 
 * This service provides a mock implementation of the assessment system,
 * generating hardcoded questions and evaluating responses with simple logic.
 * In production, this would integrate with a real AI assessment agent.
 * 
 * Requirements: 5.1, 5.2
 */
@Injectable({ providedIn: 'root' })
export class AssessmentService {
  /**
   * Signal holding the current active assessment session, or null if none
   */
  private readonly _currentSession = signal<AssessmentSession | null>(null);

  /**
   * Read-only signal for the current assessment session
   */
  readonly currentSession = this._currentSession.asReadonly();

  /**
   * Signal holding a user-friendly message describing the most recent
   * assessment service failure (unavailable service or malformed AI
   * response), or null if the last operation succeeded/no operation has
   * run yet. Consumed by AssessmentDialogUiComponent to display a
   * notification with a retry option.
   *
   * Requirements: 5.3, 5.4
   */
  private readonly _lastError = signal<string | null>(null);

  /**
   * Read-only signal for the most recent assessment service error message.
   */
  readonly lastError = this._lastError.asReadonly();

  /**
   * Clears the current error state, e.g. before retrying a failed
   * operation.
   */
  clearError(): void {
    this._lastError.set(null);
  }

  /**
   * Initiates a new assessment session for the given concept.
   * Generates 2-3 mock questions based on the concept.
   * 
   * @param conceptId - Kebab-case identifier for the concept
   * @param conceptTitle - Human-readable concept title
   * @returns Observable that emits the newly created session
   * 
   * Requirement: 5.1 - Create mock assessment session with 2-3 questions
   */
  initiateAssessment(
    conceptId: string,
    conceptTitle: string
  ): Observable<AssessmentSession> {
    // Clear any error from a previous failed attempt before retrying.
    this._lastError.set(null);

    // Generate unique session ID using timestamp
    const sessionId = `assessment-${Date.now()}`;

    return this.callAIAgent(conceptId, conceptTitle).pipe(
      delay(500), // Simulate async AI processing time
      map((questions) => {
        // Create new session
        const session: AssessmentSession = {
          sessionId,
          conceptId,
          conceptTitle,
          questions,
          responses: [],
          status: 'active',
        };

        // Update current session signal
        this._currentSession.set(session);
        return session;
      }),
      catchError((error: unknown) =>
        this.handleServiceError(error, 'initiateAssessment')
      )
    );
  }

  /**
   * Submits a response to the current question in the active session.
   * 
   * @param sessionId - ID of the session
   * @param responseText - User's response text
   * @returns Observable that emits the assessment result if all questions answered,
   *          or null if more questions remain
   * 
   * Note: In this mock implementation, this method is not yet fully implemented.
   * It will be completed in task 5.2 along with evaluateResponses().
   */
  submitResponse(
    sessionId: string,
    responseText: string
  ): Observable<AssessmentResult | null> {
    // Clear any error from a previous failed attempt before retrying.
    this._lastError.set(null);

    const session = this._currentSession();

    if (!session || session.sessionId !== sessionId) {
      return throwError(() => new Error('Invalid session ID'));
    }

    // Find next unanswered question
    const currentQuestionIndex = session.responses.length;
    if (currentQuestionIndex >= session.questions.length) {
      return throwError(() => new Error('All questions already answered'));
    }

    if (session.status !== 'active') {
      return throwError(() => new Error('Session is not active'));
    }

    const currentQuestion = session.questions[currentQuestionIndex];

    // Create response with current timestamp
    const response: Response = {
      questionId: currentQuestion.id,
      text: responseText,
      timestamp: new Date().toISOString(),
    };

    // Add response to session
    const updatedSession: AssessmentSession = {
      ...session,
      responses: [...session.responses, response],
    };

    // Check if all questions are answered
    const allQuestionsAnswered =
      updatedSession.responses.length === updatedSession.questions.length;

    if (allQuestionsAnswered) {
      // Mark session as completed
      updatedSession.status = 'completed';
      this._currentSession.set(updatedSession);

      // Evaluate responses and return result (mock implementation in task 5.2)
      return this.evaluateAndValidate(updatedSession, 'submitResponse');
    } else {
      // More questions remain
      this._currentSession.set(updatedSession);
      return of(null);
    }
  }

  /**
   * Retries evaluation for a session whose responses are already fully
   * collected but whose previous evaluation attempt failed (transient
   * service error or malformed AI response). Unlike `submitResponse()`,
   * this does not append a new response - it only re-attempts the
   * AI evaluation step, so the learner does not lose their answers when
   * retrying after a failure.
   *
   * @param sessionId - ID of the session to retry evaluation for
   *
   * Requirements: 5.3, 5.4
   */
  retryEvaluation(sessionId: string): Observable<AssessmentResult> {
    this._lastError.set(null);

    const session = this._currentSession();

    if (!session || session.sessionId !== sessionId) {
      return throwError(() => new Error('Invalid session ID'));
    }

    if (session.responses.length !== session.questions.length) {
      return throwError(
        () => new Error('Assessment is not ready for evaluation')
      );
    }

    const completedSession: AssessmentSession = {
      ...session,
      status: 'completed',
    };
    this._currentSession.set(completedSession);

    return this.evaluateAndValidate(completedSession, 'retryEvaluation');
  }

  /**
   * Shared evaluation + validation pipeline used by both `submitResponse()`
   * (first attempt) and `retryEvaluation()` (retry after failure). Reverts
   * the session back to 'active' and routes through `handleServiceError()`
   * if evaluation throws or the AI response is malformed, ensuring the
   * caller never receives a result that should be persisted to
   * ProgressStateService.
   */
  private evaluateAndValidate(
    session: AssessmentSession,
    operation: string
  ): Observable<AssessmentResult> {
    return of(null).pipe(
      delay(300), // Simulate AI processing time
      map(() => this.evaluateResponses(session)),
      map((result) => this.validateAssessmentResult(result)),
      catchError((error: unknown) => {
        // A malformed/invalid AI response must not update progress state
        // and must revert the session back to 'active' so the learner can
        // retry without losing their place (Requirements 5.3, 5.4).
        this._currentSession.set({ ...session, status: 'active' });
        return this.handleServiceError(error, operation, true);
      })
    );
  }

  /**
   * Cancels the active assessment session.
   * 
   * @param sessionId - ID of the session to cancel
   * 
   * Requirement: 5.1 - Implement cancelAssessment() to terminate active session
   */
  cancelAssessment(sessionId: string): void {
    const session = this._currentSession();

    if (!session || session.sessionId !== sessionId) {
      return; // Session not found or already cleared
    }

    // Mark session as cancelled
    const cancelledSession: AssessmentSession = {
      ...session,
      status: 'cancelled',
    };

    this._currentSession.set(cancelledSession);

    // Clear session after a brief delay to allow UI to react
    setTimeout(() => {
      if (this._currentSession()?.sessionId === sessionId) {
        this._currentSession.set(null);
      }
    }, 100);
  }

  /**
   * Calls the AI agent to generate assessment questions for a concept.
   *
   * This is currently a mock implementation that returns hardcoded
   * questions, but it is the seam where a real AI Agent API call would be
   * made. Centralizing the "network" call here means real service errors
   * (timeouts, unreachable API, rate limiting) can be handled uniformly by
   * `handleServiceError()` regardless of whether this method is backed by
   * a mock or a real HTTP call in the future.
   *
   * Requirements: 5.2, 5.3
   */
  private callAIAgent(
    conceptId: string,
    conceptTitle: string
  ): Observable<Question[]> {
    return of(this.generateMockQuestions(conceptId, conceptTitle));
  }

  /**
   * Validates that an AssessmentResult returned by the (mock) AI agent has
   * the expected shape. Guards against malformed AI responses so that
   * ProgressStateService.setProgress() is never called with invalid data.
   *
   * Requirements: 5.3, 5.4
   *
   * @throws Error if the result is missing fields, has an invalid
   *         evaluatedState, or an out-of-range confidence score.
   */
  private validateAssessmentResult(result: AssessmentResult): AssessmentResult {
    const isValid =
      !!result &&
      typeof result.sessionId === 'string' &&
      result.sessionId.length > 0 &&
      VALID_PROGRESS_STATES.includes(result.evaluatedState) &&
      typeof result.confidence === 'number' &&
      result.confidence >= 0 &&
      result.confidence <= 1 &&
      typeof result.feedback === 'string';

    if (!isValid) {
      // Requirement 5.4: log the full payload for debugging.
      console.error(
        '[AssessmentService] Malformed AI response received:',
        result
      );
      throw new Error('MALFORMED_AI_RESPONSE');
    }

    return result;
  }

  /**
   * Central error handler for assessment service/AI agent failures.
   *
   * - Logs the error for monitoring/debugging (Requirement 5.4).
   * - Sets a user-friendly message on `lastError` so the assessment dialog
   *   can display a notification with a retry option (Requirement 5.3).
   * - Re-throws an Error so callers/subscribers can react (e.g. to avoid
   *   updating progress state) without this service ever calling
   *   ProgressStateService itself.
   *
   * @param error - The underlying error
   * @param operation - Name of the operation that failed, for logging context
   * @param malformed - Whether this failure is due to a malformed AI
   *        response (vs. a transient/unavailable service failure)
   */
  private handleServiceError(
    error: unknown,
    operation: string,
    malformed = false
  ): Observable<never> {
    const isMalformed =
      malformed || (error instanceof Error && error.message === 'MALFORMED_AI_RESPONSE');

    const message = isMalformed
      ? MALFORMED_RESPONSE_MESSAGE
      : SERVICE_UNAVAILABLE_MESSAGE;

    console.error(`[AssessmentService] ${operation} failed:`, error);
    this._lastError.set(message);

    return throwError(() => (error instanceof Error ? error : new Error(String(error))));
  }

  /**
   * Generates 2-3 mock questions for the given concept.
   * Questions vary by type: open-ended, scenario, and application.
   * 
   * @param conceptId - Concept identifier
   * @param conceptTitle - Concept title for question context
   * @returns Array of 2-3 questions
   * 
   * Requirement: 5.1 - Create mock assessment session with 2-3 questions
   */
  private generateMockQuestions(
    conceptId: string,
    conceptTitle: string
  ): Question[] {
    const questions: Question[] = [
      {
        id: `${conceptId}-q1`,
        text: `What is ${conceptTitle} and why is it important?`,
        type: 'open-ended',
      },
      {
        id: `${conceptId}-q2`,
        text: `Describe a scenario where you would use ${conceptTitle}.`,
        type: 'scenario',
      },
    ];

    // Randomly add a third question (50% chance)
    if (Math.random() > 0.5) {
      questions.push({
        id: `${conceptId}-q3`,
        text: `How would you apply ${conceptTitle} in a real-world project?`,
        type: 'application',
      });
    }

    return questions;
  }

  /**
   * Evaluates user responses and determines the appropriate progress state.
   * 
   * Mock evaluation logic:
   * - Short answers (< 50 chars) → In_Progress
   * - Detailed answers (50-150 chars) → Understood
   * - Exceptional answers (> 150 chars average) → Mastered
   * 
   * @param session - Completed assessment session
   * @returns Assessment result with evaluated state and feedback
   * 
   * Note: This is a placeholder implementation. Full logic will be
   * implemented in task 5.2.
   */
  private evaluateResponses(session: AssessmentSession): AssessmentResult {
    // Calculate average response length
    const totalLength = session.responses.reduce(
      (sum, r) => sum + r.text.length,
      0
    );
    const avgLength = totalLength / session.responses.length;

    // Determine state based on response length (mock logic)
    let evaluatedState: ProgressState;
    let confidence: number;
    let feedback: string;

    if (avgLength < 50) {
      evaluatedState = 'In_Progress';
      confidence = 0.6;
      feedback = `Your responses show some understanding of ${session.conceptTitle}, but more detail would demonstrate deeper knowledge. Keep learning!`;
    } else if (avgLength < 150) {
      evaluatedState = 'Understood';
      confidence = 0.8;
      feedback = `Good work! You've demonstrated a solid understanding of ${session.conceptTitle}. Continue practicing to reach mastery.`;
    } else {
      evaluatedState = 'Mastered';
      confidence = 0.9;
      feedback = `Excellent! Your detailed responses show mastery of ${session.conceptTitle}. You've demonstrated deep understanding and practical knowledge.`;
    }

    return {
      sessionId: session.sessionId,
      evaluatedState,
      confidence,
      feedback,
    };
  }
}
