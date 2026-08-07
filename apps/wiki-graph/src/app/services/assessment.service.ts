import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError, catchError, map } from 'rxjs';
import type {
  AssessmentSession,
  AssessmentResult,
  Question,
  Response,
} from '../models/assessment.models';
import type { ProgressState } from '../models/progress.models';

const VALID_PROGRESS_STATES: readonly ProgressState[] = [
  'Not_Started',
  'In_Progress',
  'Understood',
  'Mastered',
];

const SERVICE_UNAVAILABLE_MESSAGE =
  'Assessment service temporarily unavailable. Please try again.';

const MALFORMED_RESPONSE_MESSAGE =
  'Assessment could not be completed due to a service error.';

@Injectable({ providedIn: 'root' })
export class AssessmentService {

  private readonly _currentSession = signal<AssessmentSession | null>(null);

  readonly currentSession = this._currentSession.asReadonly();

  private readonly _lastError = signal<string | null>(null);

  readonly lastError = this._lastError.asReadonly();

  clearError(): void {
    this._lastError.set(null);
  }

  initiateAssessment(
    conceptId: string,
    conceptTitle: string
  ): Observable<AssessmentSession> {

    this._lastError.set(null);

    const sessionId = `assessment-${Date.now()}`;

    return this.callAIAgent(conceptId, conceptTitle).pipe(
      delay(500), 
      map((questions) => {

        const session: AssessmentSession = {
          sessionId,
          conceptId,
          conceptTitle,
          questions,
          responses: [],
          status: 'active',
        };

        this._currentSession.set(session);
        return session;
      }),
      catchError((error: unknown) =>
        this.handleServiceError(error, 'initiateAssessment')
      )
    );
  }

  submitResponse(
    sessionId: string,
    responseText: string
  ): Observable<AssessmentResult | null> {

    this._lastError.set(null);

    const session = this._currentSession();

    if (!session || session.sessionId !== sessionId) {
      return throwError(() => new Error('Invalid session ID'));
    }

    const currentQuestionIndex = session.responses.length;
    if (currentQuestionIndex >= session.questions.length) {
      return throwError(() => new Error('All questions already answered'));
    }

    if (session.status !== 'active') {
      return throwError(() => new Error('Session is not active'));
    }

    const currentQuestion = session.questions[currentQuestionIndex];

    const response: Response = {
      questionId: currentQuestion.id,
      text: responseText,
      timestamp: new Date().toISOString(),
    };

    const updatedSession: AssessmentSession = {
      ...session,
      responses: [...session.responses, response],
    };

    const allQuestionsAnswered =
      updatedSession.responses.length === updatedSession.questions.length;

    if (allQuestionsAnswered) {

      updatedSession.status = 'completed';
      this._currentSession.set(updatedSession);

      return this.evaluateAndValidate(updatedSession, 'submitResponse');
    } else {

      this._currentSession.set(updatedSession);
      return of(null);
    }
  }

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

  private evaluateAndValidate(
    session: AssessmentSession,
    operation: string
  ): Observable<AssessmentResult> {
    return of(null).pipe(
      delay(300), 
      map(() => this.evaluateResponses(session)),
      map((result) => this.validateAssessmentResult(result)),
      catchError((error: unknown) => {

        this._currentSession.set({ ...session, status: 'active' });
        return this.handleServiceError(error, operation, true);
      })
    );
  }

  cancelAssessment(sessionId: string): void {
    const session = this._currentSession();

    if (!session || session.sessionId !== sessionId) {
      return; 
    }

    const cancelledSession: AssessmentSession = {
      ...session,
      status: 'cancelled',
    };

    this._currentSession.set(cancelledSession);

    setTimeout(() => {
      if (this._currentSession()?.sessionId === sessionId) {
        this._currentSession.set(null);
      }
    }, 100);
  }

  private callAIAgent(
    conceptId: string,
    conceptTitle: string
  ): Observable<Question[]> {
    return of(this.generateMockQuestions(conceptId, conceptTitle));
  }

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

      console.error(
        '[AssessmentService] Malformed AI response received:',
        result
      );
      throw new Error('MALFORMED_AI_RESPONSE');
    }

    return result;
  }

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

    if (Math.random() > 0.5) {
      questions.push({
        id: `${conceptId}-q3`,
        text: `How would you apply ${conceptTitle} in a real-world project?`,
        type: 'application',
      });
    }

    return questions;
  }

  private evaluateResponses(session: AssessmentSession): AssessmentResult {

    const totalLength = session.responses.reduce(
      (sum, r) => sum + r.text.length,
      0
    );
    const avgLength = totalLength / session.responses.length;

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
