import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentService } from './assessment.service';
import type { AssessmentSession, AssessmentResult } from '../models/assessment.models';
import { firstValueFrom, throwError } from 'rxjs';

describe('AssessmentService', () => {
  let service: AssessmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssessmentService],
    });
    service = TestBed.inject(AssessmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initiateAssessment', () => {
    it('should create a new assessment session with 2-3 questions', async () => {
      const conceptId = 'typescript';
      const conceptTitle = 'TypeScript';

      const session = await firstValueFrom(
        service.initiateAssessment(conceptId, conceptTitle)
      );

      expect(session).toBeDefined();
      expect(session.conceptId).toBe(conceptId);
      expect(session.conceptTitle).toBe(conceptTitle);
      expect(session.questions.length).toBeGreaterThanOrEqual(2);
      expect(session.questions.length).toBeLessThanOrEqual(3);
      expect(session.status).toBe('active');
      expect(session.responses).toEqual([]);
    });

    it('should generate unique session IDs', async () => {
      const session1 = await firstValueFrom(
        service.initiateAssessment('concept1', 'Concept 1')
      );
      const session2 = await firstValueFrom(
        service.initiateAssessment('concept2', 'Concept 2')
      );

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should update currentSession signal', async () => {
      expect(service.currentSession()).toBeNull();

      const session = await firstValueFrom(
        service.initiateAssessment('typescript', 'TypeScript')
      );

      expect(service.currentSession()).toEqual(session);
    });

    it('should generate questions with different types', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('rxjs', 'RxJS')
      );

      const types = session.questions.map((q) => q.type);
      expect(types).toContain('open-ended');
      expect(types).toContain('scenario');
    });
  });

  describe('cancelAssessment', () => {
    it('should cancel an active assessment session', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('angular', 'Angular')
      );

      service.cancelAssessment(session.sessionId);

      const currentSession = service.currentSession();
      expect(currentSession?.status).toBe('cancelled');
    });

    it('should clear the session after a brief delay', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('vue', 'Vue')
      );

      service.cancelAssessment(session.sessionId);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(service.currentSession()).toBeNull();
    });

    it('should handle cancelling non-existent session gracefully', () => {
      expect(() => {
        service.cancelAssessment('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('submitResponse', () => {
    let session: AssessmentSession;

    beforeEach(async () => {
      session = await firstValueFrom(
        service.initiateAssessment('typescript', 'TypeScript')
      );
    });

    it('should record a response and return null if more questions remain', async () => {
      const responseText = 'TypeScript is a typed superset of JavaScript.';

      const result = await firstValueFrom(
        service.submitResponse(session.sessionId, responseText)
      );

      expect(result).toBeNull();

      const updatedSession = service.currentSession();
      expect(updatedSession?.responses.length).toBe(1);
      expect(updatedSession?.responses[0].text).toBe(responseText);
      expect(updatedSession?.responses[0].questionId).toBe(
        session.questions[0].id
      );
    });

    it('should evaluate and complete the session when all questions are answered', async () => {

      for (let i = 0; i < session.questions.length; i++) {
        const isLastQuestion = i === session.questions.length - 1;
        const responseText = 'This is a detailed response with sufficient information to demonstrate understanding.';

        const result = await firstValueFrom(
          service.submitResponse(session.sessionId, responseText)
        );

        if (isLastQuestion) {

          expect(result).not.toBeNull();
          expect(result?.sessionId).toBe(session.sessionId);
          expect(result?.evaluatedState).toBeDefined();
          expect(result?.confidence).toBeGreaterThanOrEqual(0);
          expect(result?.confidence).toBeLessThanOrEqual(1);
          expect(result?.feedback).toBeDefined();

          const completedSession = service.currentSession();
          expect(completedSession?.status).toBe('completed');
        } else {

          expect(result).toBeNull();
        }
      }
    });

    it('should throw error for invalid session ID', async () => {
      await expect(
        firstValueFrom(service.submitResponse('invalid-id', 'response'))
      ).rejects.toThrow('Invalid session ID');
    });

    it('should throw error if session is not active', async () => {
      service.cancelAssessment(session.sessionId);

      await expect(
        firstValueFrom(service.submitResponse(session.sessionId, 'response'))
      ).rejects.toThrow('Session is not active');
    });

    it('should throw error if all questions already answered', async () => {

      for (let i = 0; i < session.questions.length; i++) {
        await firstValueFrom(
          service.submitResponse(session.sessionId, 'response')
        );
      }

      await expect(
        firstValueFrom(service.submitResponse(session.sessionId, 'response'))
      ).rejects.toThrow('All questions already answered');
    });
  });

  describe('network/AI service error handling (Requirements 5.3, 5.4)', () => {
    type ServiceInternal = {
      callAIAgent: (...args: unknown[]) => unknown;
      evaluateResponses: (...args: unknown[]) => unknown;
    };

    it('exposes a null lastError before any operation', () => {
      expect(service.lastError()).toBeNull();
    });

    it('sets a user-friendly lastError and logs when the AI agent call fails during initiateAssessment', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      vi.spyOn(service as unknown as ServiceInternal, 'callAIAgent').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      await expect(
        firstValueFrom(service.initiateAssessment('typescript', 'TypeScript'))
      ).rejects.toThrow('Network error');

      expect(service.lastError()).toBe(
        'Assessment service temporarily unavailable. Please try again.'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AssessmentService] initiateAssessment failed:',
        expect.any(Error)
      );

      expect(service.currentSession()).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('does not update progress state (no session mutation to a new result) when evaluation returns a malformed response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const session = await firstValueFrom(
        service.initiateAssessment('rxjs', 'RxJS')
      );

      vi.spyOn(service as unknown as ServiceInternal, 'evaluateResponses').mockReturnValue({
        sessionId: session.sessionId,
        evaluatedState: 'Invalid_State',
        confidence: 0.5,
        feedback: 'test',
      });

      let lastResult: AssessmentResult | null | undefined;
      let lastError: unknown;
      for (let i = 0; i < session.questions.length; i++) {
        try {
          lastResult = await firstValueFrom(
            service.submitResponse(session.sessionId, 'A reasonably detailed answer here')
          );
        } catch (error) {
          lastError = error;
        }
      }

      expect(lastResult).toBeNull();
      expect(lastError).toBeInstanceOf(Error);
      expect(service.lastError()).toBe(
        'Assessment could not be completed due to a service error.'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AssessmentService] Malformed AI response received:',
        expect.objectContaining({ evaluatedState: 'Invalid_State' })
      );

      expect(service.currentSession()?.status).toBe('active');
      consoleErrorSpy.mockRestore();
    });

    it('clears lastError when a new operation is attempted', async () => {

      vi.spyOn(service as unknown as ServiceInternal, 'callAIAgent').mockReturnValueOnce(
        throwError(() => new Error('Network error'))
      );
      await expect(
        firstValueFrom(service.initiateAssessment('typescript', 'TypeScript'))
      ).rejects.toThrow();
      expect(service.lastError()).not.toBeNull();

      await firstValueFrom(service.initiateAssessment('typescript', 'TypeScript'));
      expect(service.lastError()).toBeNull();
    });

    it('clearError() resets lastError to null', async () => {

      vi.spyOn(service as unknown as ServiceInternal, 'callAIAgent').mockReturnValueOnce(
        throwError(() => new Error('Network error'))
      );
      await expect(
        firstValueFrom(service.initiateAssessment('typescript', 'TypeScript'))
      ).rejects.toThrow();
      expect(service.lastError()).not.toBeNull();

      service.clearError();
      expect(service.lastError()).toBeNull();
    });

    describe('retryEvaluation', () => {
      it('re-evaluates a fully-answered session without discarding responses', async () => {
        const session = await firstValueFrom(
          service.initiateAssessment('angular', 'Angular')
        );

        for (const question of session.questions) {
          await firstValueFrom(
            service.submitResponse(session.sessionId, `Answer for ${question.id}`)
          );
        }

        const responsesBeforeRetry = service.currentSession()?.responses.length;

        const result = await firstValueFrom(service.retryEvaluation(session.sessionId));

        expect(result).toBeDefined();
        expect(result.sessionId).toBe(session.sessionId);
        expect(service.currentSession()?.responses.length).toBe(responsesBeforeRetry);
        expect(service.currentSession()?.status).toBe('completed');
      });

      it('rejects with an error for an unknown session ID', async () => {
        await expect(
          firstValueFrom(service.retryEvaluation('unknown-session'))
        ).rejects.toThrow('Invalid session ID');
      });

      it('rejects when the session does not have all responses collected yet', async () => {
        const session = await firstValueFrom(
          service.initiateAssessment('vue', 'Vue')
        );

        await expect(
          firstValueFrom(service.retryEvaluation(session.sessionId))
        ).rejects.toThrow('Assessment is not ready for evaluation');
      });
    });
  });

  describe('evaluateResponses (mock evaluation)', () => {
    it('should evaluate short responses as In_Progress', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('concept', 'Concept')
      );

      for (let i = 0; i < session.questions.length - 1; i++) {
        await firstValueFrom(service.submitResponse(session.sessionId, 'Short'));
      }

      const result = await firstValueFrom(
        service.submitResponse(session.sessionId, 'Short')
      );

      expect(result?.evaluatedState).toBe('In_Progress');
    });

    it('should evaluate medium responses as Understood', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('concept', 'Concept')
      );

      const mediumResponse =
        'This is a medium-length response with enough detail to show understanding.';

      for (let i = 0; i < session.questions.length - 1; i++) {
        await firstValueFrom(
          service.submitResponse(session.sessionId, mediumResponse)
        );
      }

      const result = await firstValueFrom(
        service.submitResponse(session.sessionId, mediumResponse)
      );

      expect(result?.evaluatedState).toBe('Understood');
    });

    it('should evaluate long responses as Mastered', async () => {
      const session = await firstValueFrom(
        service.initiateAssessment('concept', 'Concept')
      );

      const longResponse =
        'This is a very detailed and comprehensive response that demonstrates deep understanding and mastery of the concept. ' +
        'It includes multiple examples, edge cases, and practical applications that show exceptional knowledge. ' +
        'The response is thorough and well-structured, covering all aspects of the topic in detail.';

      for (let i = 0; i < session.questions.length - 1; i++) {
        await firstValueFrom(
          service.submitResponse(session.sessionId, longResponse)
        );
      }

      const result = await firstValueFrom(
        service.submitResponse(session.sessionId, longResponse)
      );

      expect(result?.evaluatedState).toBe('Mastered');
    });
  });
});
