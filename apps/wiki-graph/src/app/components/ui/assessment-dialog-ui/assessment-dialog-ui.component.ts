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

  session = input<AssessmentSession | null>(null);

  errorMessage = input<string | null>(null);

  responseSubmitted = output<string>();

  cancelled = output<void>();

  retried = output<void>();

  currentQuestionIndex = signal(0);

  responseText = signal('');

  currentQuestion = computed(() => {
    const session = this.session();
    const index = this.currentQuestionIndex();
    return session?.questions[index] || null;
  });

  totalQuestions = computed(() => {
    return this.session()?.questions.length || 0;
  });

  isLastQuestion = computed(() => {
    return this.currentQuestionIndex() >= this.totalQuestions() - 1;
  });

  progressPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round(((this.currentQuestionIndex() + 1) / total) * 100);
  });

  submitResponse(): void {
    const response = this.responseText().trim();

    if (!response) {
      return; 
    }

    this.responseSubmitted.emit(response);

    this.responseText.set('');

    if (!this.isLastQuestion()) {
      this.nextQuestion();
    }
  }

  nextQuestion(): void {
    this.currentQuestionIndex.update((index) => index + 1);
  }

  cancel(): void {
    this.cancelled.emit();

    this.currentQuestionIndex.set(0);
    this.responseText.set('');
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

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

  isSubmitDisabled = computed(() => {
    return this.responseText().trim().length === 0;
  });

  retry(): void {
    this.retried.emit();
  }
}
