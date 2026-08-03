# Assessment Dialog UI Component

## Overview

The `AssessmentDialogUiComponent` is a presentational UI component that displays an interactive dialog for AI-driven knowledge assessment sessions. It follows the project's three-tier architecture, residing in the **UI tier** with strict separation of concerns.

## Requirements

**Validates: Requirements 5.1**

- ✅ Create standalone Angular component with dialog template
- ✅ Signal input for `session$` (current assessment session)
- ✅ Outputs for `responseSubmitted` and `cancelled` events
- ✅ Signals for `currentQuestionIndex$` and `responseText$` for UI state
- ✅ Template with question display, textarea for response, and navigation buttons

## Architecture Tier

**Tier:** UI (Presentation)

**Rules:**
- ✅ Receives state through signal inputs only
- ✅ Emits user interactions through outputs only
- ✅ No service injection
- ✅ Pure presentation logic
- ✅ Standalone component

## Component API

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `session` | `Signal<AssessmentSession \| null>` | Current assessment session or null if no active session |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `responseSubmitted` | `EventEmitter<string>` | Emitted when user submits a response to the current question |
| `cancelled` | `EventEmitter<void>` | Emitted when user cancels the assessment |

### Signals (Internal State)

| Signal | Type | Description |
|--------|------|-------------|
| `currentQuestionIndex` | `WritableSignal<number>` | Index of the current question (0-based) |
| `responseText` | `WritableSignal<string>` | User's response text for the current question |
| `currentQuestion` | `Signal<Question \| null>` | Computed: Current question being displayed |
| `totalQuestions` | `Signal<number>` | Computed: Total number of questions in the session |
| `isLastQuestion` | `Signal<boolean>` | Computed: Whether this is the last question |
| `progressPercentage` | `Signal<number>` | Computed: Progress percentage (0-100) |
| `isSubmitDisabled` | `Signal<boolean>` | Computed: Whether submit button should be disabled |

## Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { AssessmentDialogUiComponent } from './components/ui/assessment-dialog-ui/assessment-dialog-ui.component';
import type { AssessmentSession } from './models/assessment.models';

@Component({
  selector: 'app-smart-container',
  template: `
    <app-assessment-dialog-ui
      [session]="currentSession()"
      (responseSubmitted)="handleResponseSubmitted($event)"
      (cancelled)="handleCancelled()"
    />
  `,
  imports: [AssessmentDialogUiComponent],
  standalone: true,
})
export class SmartContainerComponent {
  currentSession = signal<AssessmentSession | null>(null);

  handleResponseSubmitted(response: string): void {
    console.log('Response submitted:', response);
    // Submit response to assessment service
  }

  handleCancelled(): void {
    console.log('Assessment cancelled');
    // Cancel assessment session
  }
}
```

## Features

### Question Navigation
- **Progress Indicator**: Visual progress bar showing current question number and percentage complete
- **Question Display**: Shows current question text with type badge (open-ended, scenario, application)
- **Auto-advance**: Automatically advances to next question after submitting (except on last question)

### Response Input
- **Rich Textarea**: Multi-line textarea for detailed responses with autofocus
- **Character Counter**: Real-time character count with minimum length hint
- **Validation**: Submit button disabled when response is empty or only whitespace

### User Actions
- **Submit Response**: Submits current response and advances to next question
- **Cancel Assessment**: Cancels entire assessment and resets UI state
- **Keyboard Support**: Escape key cancels assessment
- **Click Outside**: Clicking overlay cancels assessment

### Accessibility
- **Semantic HTML**: Uses proper dialog role and ARIA attributes
- **Focus Management**: Autofocus on textarea when dialog opens
- **Keyboard Navigation**: Full keyboard support (Tab, Escape, Enter)
- **Screen Reader Support**: Proper labeling and announcements

## Styling

The component includes comprehensive SCSS styles with:
- Modal overlay with backdrop blur
- Responsive design (mobile-friendly)
- Color-coded question type badges
- Smooth transitions and animations
- Focus indicators for keyboard navigation

## Testing

Comprehensive unit tests cover:
- Component initialization
- Session display logic
- Progress calculations
- Response input handling
- Submit button states
- Cancel functionality
- Keyboard navigation
- All computed properties

Run tests:
```bash
npx nx test wiki-graph
```

## File Structure

```
assessment-dialog-ui/
├── assessment-dialog-ui.component.ts       # Component logic
├── assessment-dialog-ui.component.html     # Template
├── assessment-dialog-ui.component.scss     # Styles
├── assessment-dialog-ui.component.spec.ts  # Unit tests
└── README.md                               # This file
```

## Design Decisions

1. **Standalone Component**: Follows Angular best practices for modern standalone components
2. **Signal-based State**: Uses Angular signals for reactive state management
3. **OnPush Change Detection**: Optimized for performance with OnPush strategy
4. **No External Dependencies**: Self-contained with no third-party dependencies
5. **Accessibility First**: Built with WCAG 2.1 Level AA compliance in mind

## Future Enhancements

Potential improvements for future iterations:
- Multi-select question types
- Rich text editor for responses
- Markdown preview
- Response drafts (auto-save)
- Question skip functionality
- Timed questions
- Hints or help text
