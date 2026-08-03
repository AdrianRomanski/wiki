import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { AssessmentSession } from '../../../models/assessment.models';

/**
 * Assessment Dialog UI Component
 * 
 * Presentational component for AI-driven knowledge assessment sessions.
 * Displays questions one at a time and collects user responses.
 * 
 * Follows the UI tier architectural rules:
 * - Receives state through signal inputs
 * - Emits user interactions through outputs
 * - No service injection
 * - Pure presentation logic
 * 
 * Requirements: 5.1
 */
@Component({
  selector: 'app-assessment-dialog-ui',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'assessment-dialog',
    '(keydown.escape)': 'cancel()',
  },
  templateUrl: './assessment-dialog-ui.component.html',
  styleUrl: './assessment-dialog-ui.component.scss',
})
export class AssessmentDialogUiComponent {
  /**
   * Current assessment session (or null if no active session)
   */
  session = input<AssessmentSession | null>(null);

  /**
   * User-friendly message describing the most recent assessment service
   * failure (unavailable service or malformed AI response), or null if
   * there is no error to display. When set, the dialog shows a
   * notification with a retry button instead of (or alongside) the normal
   * question UI.
   *
   * Requirements: 5.3, 5.4
   */
  errorMessage = input<string | null>(null);

  /**
   * Emitted when user submits a response to the current question
   */
  responseSubmitted = output<string>();

  /**
   * Emitted when user cancels the assessment
   */
  cancelled = output<void>();

  /**
   * Emitted when the user clicks "Retry" after a service failure. The
   * parent/container component is responsible for re-attempting the
   * failed operation (e.g. re-submitting the last response).
   *
   * Requirements: 5.3
   */
  retried = output<void>();

  /**
   * Index of the current question being displayed (0-based)
   */
  currentQuestionIndex = signal(0);

  /**
   * User's response text for the current question
   */
  responseText = signal('');

  /**
   * Computed: Current question being displayed
   */
  currentQuestion = computed(() => {
    const session = this.session();
    const index = this.currentQuestionIndex();
    return session?.questions[index] || null;
  });

  /**
   * Computed: Total number of questions in the session
   */
  totalQuestions = computed(() => {
    return this.session()?.questions.length || 0;
  });

  /**
   * Computed: Whether this is the last question
   */
  isLastQuestion = computed(() => {
    return this.currentQuestionIndex() >= this.totalQuestions() - 1;
  });

  /**
   * Computed: Progress percentage (0-100)
   */
  progressPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round(((this.currentQuestionIndex() + 1) / total) * 100);
  });

  /**
   * Submits the current response and advances to the next question.
   *
   * Emits `responseSubmitted` with the trimmed response text, then clears
   * the response input and moves on to the next question (unless the
   * current question is the last one in the session).
   *
   * Requirements: 5.2
   */
  submitResponse(): void {
    const response = this.responseText().trim();

    if (!response) {
      return; // Don't submit empty responses
    }

    // Emit the response
    this.responseSubmitted.emit(response);

    // Clear response text for next question
    this.responseText.set('');

    // Advance to next question if not on last question
    if (!this.isLastQuestion()) {
      this.nextQuestion();
    }
  }

  /**
   * Advances the dialog to the next question by incrementing the
   * current question index.
   *
   * Requirements: 5.2
   */
  nextQuestion(): void {
    this.currentQuestionIndex.update((index) => index + 1);
  }

  /**
   * Cancels the assessment session, emitting the `cancelled` event and
   * resetting local UI state so the dialog is ready for a future session.
   *
   * Requirements: 5.6
   */
  cancel(): void {
    this.cancelled.emit();

    // Reset UI state
    this.currentQuestionIndex.set(0);
    this.responseText.set('');
  }

  /**
   * Handles keydown events on the response textarea to support keyboard
   * shortcuts:
   * - Ctrl+Enter (or Cmd+Enter on macOS) submits the response, since the
   *   textarea is multiline and plain Enter is reserved for newlines.
   * - Escape cancels the assessment (also handled at the host level).
   *
   * Requirements: 5.6
   */
  handleResponseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submitResponse();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  /**
   * Checks if submit button should be disabled
   */
  isSubmitDisabled = computed(() => {
    return this.responseText().trim().length === 0;
  });

  /**
   * Emits the `retried` event so the container can re-attempt the
   * operation that failed (e.g. re-submit the last response or re-initiate
   * the assessment). The dialog itself does not know how to retry since it
   * has no access to AssessmentService.
   *
   * Requirements: 5.3
   */
  retry(): void {
    this.retried.emit();
  }
}
