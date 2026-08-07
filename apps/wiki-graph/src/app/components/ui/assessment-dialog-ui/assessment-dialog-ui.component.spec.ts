import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssessmentDialogUiComponent } from './assessment-dialog-ui.component';
import type { AssessmentSession, Question } from '../../../models/assessment.models';

describe('AssessmentDialogUiComponent', () => {
  let component: any;
  let fixture: ComponentFixture<AssessmentDialogUiComponent>;

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      text: 'What is TypeScript?',
      type: 'open-ended',
    },
    {
      id: 'q2',
      text: 'Describe a scenario where you would use TypeScript.',
      type: 'scenario',
    },
  ];

  const mockSession: AssessmentSession = {
    sessionId: 'test-session-123',
    conceptId: 'typescript',
    conceptTitle: 'TypeScript',
    questions: mockQuestions,
    responses: [],
    status: 'active',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssessmentDialogUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssessmentDialogUiComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should start with null session', () => {
      expect(component.session()).toBeNull();
    });

    it('should start at question index 0', () => {
      expect(component.currentQuestionIndex()).toBe(0);
    });

    it('should start with empty response text', () => {
      expect(component.responseText()).toBe('');
    });
  });

  describe('Session Display', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should display the dialog when session is active', () => {
      const dialogOverlay = fixture.nativeElement.querySelector('.dialog-overlay');
      expect(dialogOverlay).toBeTruthy();
    });

    it('should display concept title in header', () => {
      const title = fixture.nativeElement.querySelector('.dialog-title');
      expect(title.textContent).toContain('TypeScript');
    });

    it('should display current question', () => {
      const questionText = fixture.nativeElement.querySelector('.question-text');
      expect(questionText.textContent).toContain('What is TypeScript?');
    });

    it('should display question type badge', () => {
      const badge = fixture.nativeElement.querySelector('.question-type-badge');
      expect(badge.textContent.trim()).toBe('open-ended');
      expect(badge.getAttribute('data-type')).toBe('open-ended');
    });

    it('should not display dialog when session is null', () => {
      fixture.componentRef.setInput('session', null);
      fixture.detectChanges();
      const dialogOverlay = fixture.nativeElement.querySelector('.dialog-overlay');
      expect(dialogOverlay).toBeFalsy();
    });
  });

  describe('Progress Display', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should show progress text with correct question number', () => {
      const progressText = fixture.nativeElement.querySelector('.progress-text');
      expect(progressText.textContent).toContain('Question 1 of 2');
    });

    it('should calculate progress percentage correctly', () => {
      expect(component.progressPercentage()).toBe(50); 
    });

    it('should update progress when advancing to next question', () => {
      component.currentQuestionIndex.set(1);
      fixture.detectChanges();
      expect(component.progressPercentage()).toBe(100); 
    });
  });

  describe('Current Question Computation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should compute current question correctly', () => {
      const currentQuestion = component.currentQuestion();
      expect(currentQuestion).toEqual(mockQuestions[0]);
    });

    it('should update current question when index changes', () => {
      component.currentQuestionIndex.set(1);
      const currentQuestion = component.currentQuestion();
      expect(currentQuestion).toEqual(mockQuestions[1]);
    });

    it('should return null when session is null', () => {
      fixture.componentRef.setInput('session', null);
      expect(component.currentQuestion()).toBeNull();
    });
  });

  describe('Response Input', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should bind response text to textarea', async () => {
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      expect(textarea.value).toBe('');

      component.responseText.set('My test response');
      fixture.detectChanges();

      await Promise.resolve();
      fixture.detectChanges();
      expect(textarea.value).toBe('My test response');
    });

    it('should update response text when user types', () => {
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      textarea.value = 'User typed text';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.responseText()).toBe('User typed text');
    });

    it('should display character count', () => {
      component.responseText.set('Hello');
      fixture.detectChanges();
      const charCount = fixture.nativeElement.querySelector('.character-count');
      expect(charCount.textContent).toContain('5 characters');
    });

    it('should show minimum warning for short responses', () => {
      component.responseText.set('Short');
      fixture.detectChanges();
      const charCount = fixture.nativeElement.querySelector('.character-count');
      expect(charCount.classList.contains('minimum-warning')).toBe(true);
      expect(charCount.textContent).toContain('aim for at least 20 characters');
    });
  });

  describe('Submit Button State', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should disable submit button when response is empty', () => {
      component.responseText.set('');
      fixture.detectChanges();
      const submitButton: HTMLButtonElement = fixture.nativeElement.querySelector('.button-primary');
      expect(submitButton.disabled).toBe(true);
    });

    it('should disable submit button when response is only whitespace', () => {
      component.responseText.set('   ');
      fixture.detectChanges();
      expect(component.isSubmitDisabled()).toBe(true);
    });

    it('should enable submit button when response has content', () => {
      component.responseText.set('Valid response');
      fixture.detectChanges();
      const submitButton: HTMLButtonElement = fixture.nativeElement.querySelector('.button-primary');
      expect(submitButton.disabled).toBe(false);
    });

    it('should show "Next Question" text for non-final questions', () => {
      component.responseText.set('Valid response');
      fixture.detectChanges();
      const submitButton = fixture.nativeElement.querySelector('.button-primary');
      expect(submitButton.textContent).toContain('Next Question');
    });

    it('should show "Submit Assessment" text for final question', () => {
      component.currentQuestionIndex.set(1); 
      component.responseText.set('Valid response');
      fixture.detectChanges();
      const submitButton = fixture.nativeElement.querySelector('.button-primary');
      expect(submitButton.textContent).toContain('Submit Assessment');
    });
  });

  describe('Submit Response Action', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should emit responseSubmitted event with trimmed response text', () => {
      let emittedResponse: string | undefined;
      component.responseSubmitted.subscribe((response: string) => {
        emittedResponse = response;
      });

      component.responseText.set('  My response  ');
      component.submitResponse();

      expect(emittedResponse).toBe('My response');
    });

    it('should not emit responseSubmitted for empty response', () => {
      let emitCount = 0;
      component.responseSubmitted.subscribe(() => {
        emitCount++;
      });

      component.responseText.set('');
      component.submitResponse();

      expect(emitCount).toBe(0);
    });

    it('should clear response text after submission', () => {
      component.responseText.set('My response');
      component.submitResponse();
      expect(component.responseText()).toBe('');
    });

    it('should advance to next question after submission (non-final)', () => {
      component.responseText.set('Valid response');
      component.submitResponse();
      expect(component.currentQuestionIndex()).toBe(1);
    });

    it('should not advance question index on final question', () => {
      component.currentQuestionIndex.set(1); 
      component.responseText.set('Valid response');
      component.submitResponse();
      expect(component.currentQuestionIndex()).toBe(1); 
    });
  });

  describe('nextQuestion()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should increment the current question index', () => {
      expect((component as any).currentQuestionIndex()).toBe(0);
      (component as any).nextQuestion();
      expect((component as any).currentQuestionIndex()).toBe(1);
    });
  });

  describe('Cancel Action', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should emit cancelled event', () => {
      let cancelEmitted = false;
      component.cancelled.subscribe(() => {
        cancelEmitted = true;
      });

      (component as any).cancel();
      expect(cancelEmitted).toBe(true);
    });

    it('should reset question index to 0', () => {
      (component as any).currentQuestionIndex.set(1);
      (component as any).cancel();
      expect((component as any).currentQuestionIndex()).toBe(0);
    });

    it('should clear response text', () => {
      (component as any).responseText.set('Some response text');
      (component as any).cancel();
      expect((component as any).responseText()).toBe('');
    });

    it('should trigger cancel on close button click', () => {
      let cancelEmitted = false;
      component.cancelled.subscribe(() => {
        cancelEmitted = true;
      });

      const closeButton = fixture.nativeElement.querySelector('.close-button');
      closeButton.click();
      expect(cancelEmitted).toBe(true);
    });

    it('should trigger cancel on overlay click', () => {
      let cancelEmitted = false;
      component.cancelled.subscribe(() => {
        cancelEmitted = true;
      });

      const overlay = fixture.nativeElement.querySelector('.dialog-overlay');
      overlay.click();
      expect(cancelEmitted).toBe(true);
    });

    it('should not trigger cancel on dialog container click', () => {
      let cancelEmitted = false;
      component.cancelled.subscribe(() => {
        cancelEmitted = true;
      });

      const dialogContainer = fixture.nativeElement.querySelector('.dialog-container');
      dialogContainer.click();
      expect(cancelEmitted).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.detectChanges();
    });

    it('should cancel on Escape key press', () => {
      let cancelEmitted = false;
      component.cancelled.subscribe(() => {
        cancelEmitted = true;
      });

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      fixture.nativeElement.dispatchEvent(event);
      fixture.detectChanges();

      expect(cancelEmitted).toBe(true);
    });

    it('should submit response on Ctrl+Enter key press in textarea', () => {
      (component as any).responseText.set('Valid response');
      fixture.detectChanges();

      let emittedResponse: string | undefined;
      component.responseSubmitted.subscribe((response: string) => {
        emittedResponse = response;
      });

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      textarea.dispatchEvent(event);
      fixture.detectChanges();

      expect(emittedResponse).toBe('Valid response');
    });

    it('should submit response on Cmd+Enter (metaKey) key press in textarea', () => {
      (component as any).responseText.set('Valid response');
      fixture.detectChanges();

      let emittedResponse: string | undefined;
      component.responseSubmitted.subscribe((response: string) => {
        emittedResponse = response;
      });

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
      textarea.dispatchEvent(event);
      fixture.detectChanges();

      expect(emittedResponse).toBe('Valid response');
    });

    it('should not submit response on plain Enter key press in textarea (allows newline)', () => {
      (component as any).responseText.set('Valid response');
      fixture.detectChanges();

      let emitCount = 0;
      component.responseSubmitted.subscribe(() => {
        emitCount++;
      });

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      textarea.dispatchEvent(event);
      fixture.detectChanges();

      expect(emitCount).toBe(0);
    });

    it('should not submit on Ctrl+Enter when response is empty', () => {
      (component as any).responseText.set('');
      fixture.detectChanges();

      let emitCount = 0;
      component.responseSubmitted.subscribe(() => {
        emitCount++;
      });

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.response-input');
      const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
      textarea.dispatchEvent(event);
      fixture.detectChanges();

      expect(emitCount).toBe(0);
    });
  });

  describe('Error Notification and Retry (Requirements 5.3, 5.4)', () => {
    it('does not show the dialog when there is no session and no error', () => {
      fixture.componentRef.setInput('session', null);
      fixture.componentRef.setInput('errorMessage', null);
      fixture.detectChanges();

      const dialogOverlay = fixture.nativeElement.querySelector('.dialog-overlay');
      expect(dialogOverlay).toBeFalsy();
    });

    it('shows the dialog with an error banner when errorMessage is set even without a session', () => {
      fixture.componentRef.setInput('session', null);
      fixture.componentRef.setInput('errorMessage', 'Assessment service temporarily unavailable. Please try again.');
      fixture.detectChanges();

      const dialogOverlay = fixture.nativeElement.querySelector('.dialog-overlay');
      expect(dialogOverlay).toBeTruthy();

      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.textContent).toContain(
        'Assessment service temporarily unavailable. Please try again.'
      );
    });

    it('shows the error banner alongside an active session and hides the question UI', () => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.componentRef.setInput('errorMessage', 'Assessment could not be completed due to a service error.');
      fixture.detectChanges();

      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeTruthy();

      const questionText = fixture.nativeElement.querySelector('.question-text');
      expect(questionText).toBeFalsy();
    });

    it('does not show the error banner when errorMessage is null', () => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.componentRef.setInput('errorMessage', null);
      fixture.detectChanges();

      const errorBanner = fixture.nativeElement.querySelector('.error-banner');
      expect(errorBanner).toBeFalsy();
    });

    it('emits retried when the Retry button is clicked', () => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.componentRef.setInput('errorMessage', 'Assessment service temporarily unavailable. Please try again.');
      fixture.detectChanges();

      let retried = false;
      component.retried.subscribe(() => {
        retried = true;
      });

      const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.error-banner .button-primary'
      );
      retryButton.click();

      expect(retried).toBe(true);
    });

    it('emits cancelled when the Cancel button in the error banner is clicked', () => {
      fixture.componentRef.setInput('session', mockSession);
      fixture.componentRef.setInput('errorMessage', 'Assessment service temporarily unavailable. Please try again.');
      fixture.detectChanges();

      let cancelled = false;
      component.cancelled.subscribe(() => {
        cancelled = true;
      });

      const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.error-banner .button-secondary'
      );
      cancelButton.click();

      expect(cancelled).toBe(true);
    });

    it('retry() emits the retried output directly', () => {
      let retried = false;
      component.retried.subscribe(() => {
        retried = true;
      });

      (component as any).retry();

      expect(retried).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute totalQuestions correctly', () => {
      fixture.componentRef.setInput('session', mockSession);
      expect((component as any).totalQuestions()).toBe(2);
    });

    it('should return 0 for totalQuestions when session is null', () => {
      fixture.componentRef.setInput('session', null);
      expect((component as any).totalQuestions()).toBe(0);
    });

    it('should compute isLastQuestion correctly', () => {
      fixture.componentRef.setInput('session', mockSession);

      (component as any).currentQuestionIndex.set(0);
      expect((component as any).isLastQuestion()).toBe(false);

      (component as any).currentQuestionIndex.set(1);
      expect((component as any).isLastQuestion()).toBe(true);
    });
  });
});
