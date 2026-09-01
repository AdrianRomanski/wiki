import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course } from '@wiki/character-domain-models';

const SAMPLE_COURSE_TEMPLATE = JSON.stringify(
  {
    id: 'course-sample',
    title: 'Modern Architecture & Clean Code',
    instructor: 'Alex Mercer',
    platform: 'Custom Sandbox',
    sourceUrl: 'https://example.com/courses/modern-arch',
    totalVideos: 2,
    totalExercises: 1,
    estimatedHours: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'mod-1',
        courseId: 'course-sample',
        title: 'Module 1: Foundations',
        order: 1,
        description: 'Core concepts and architectural foundations',
        items: [
          {
            id: 'item-1',
            moduleId: 'mod-1',
            title: 'Clean Architecture Principles',
            type: 'video',
            order: 1,
            durationMinutes: 30
          },
          {
            id: 'item-2',
            moduleId: 'mod-1',
            title: 'Exercise 1: Refactoring to Clean Architecture',
            type: 'exercise',
            order: 2,
            durationMinutes: 60
          }
        ]
      }
    ]
  },
  null,
  2
);

@Component({
  selector: 'character-course-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="closed.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <h3>📥 Ingest Scraped Course Curriculum</h3>
            <button type="button" class="close-btn" (click)="closed.emit()">✖</button>
          </header>

          <div class="modal-body">
            <p class="modal-desc">
              Paste structured JSON extracted from an external course, or load a sample curriculum template.
            </p>

            <div class="template-actions">
              <button type="button" class="btn-sample" (click)="loadSampleJson()">
                📋 Load Sample Curriculum Template
              </button>
            </div>

            <div class="form-group">
              <label for="courseJson">Course Curriculum JSON (Domain Compliant):</label>
              <textarea
                id="courseJson"
                class="form-control code-area"
                rows="10"
                placeholder="Paste course JSON here..."
                [ngModel]="jsonInput()"
                (ngModelChange)="onJsonChange($event)"
              ></textarea>
            </div>

            @if (errorMessage(); as err) {
              <div class="error-box">
                ❌ {{ err }}
              </div>
            }
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closed.emit()">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="submitImport()"
            >
              🚀 Import Course & Activate
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      animation: modalFadeIn 0.25s ease-out;

      .modal-header {
        padding: 18px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          font-size: 1.15rem;
          color: #f8fafc;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;

          &:hover {
            color: #f8fafc;
          }
        }
      }

      .modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .modal-desc {
          margin: 0;
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        .template-actions {
          display: flex;
          gap: 8px;

          .btn-sample {
            background: rgba(59, 130, 246, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #93c5fd;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: rgba(59, 130, 246, 0.35);
              color: #ffffff;
            }
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;

          label {
            font-size: 0.8rem;
            font-weight: 700;
            color: #cbd5e1;
          }

          .code-area {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 10px 12px;
            color: #38bdf8;
            font-family: 'JetBrains Mono', monospace, Consolas, sans-serif;
            font-size: 0.8rem;
            line-height: 1.4;
            resize: vertical;

            &:focus {
              outline: none;
              border-color: #60a5fa;
              box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
            }
          }
        }

        .error-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 10px;
          color: #f87171;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);

        .btn {
          font-family: inherit;
          cursor: pointer;
          border-radius: 8px;
          font-weight: 600;
          padding: 8px 16px;
          font-size: 0.85rem;
          transition: all 0.2s ease;

          &.btn-outline {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #cbd5e1;

            &:hover {
              background: rgba(51, 65, 85, 1);
              color: #ffffff;
            }
          }

          &.btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #ffffff;
            border: none;

            &:hover {
              background: linear-gradient(135deg, #60a5fa, #3b82f6);
            }
          }
        }
      }
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseImportModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();
  readonly imported = output<Course>();

  readonly jsonInput = signal<string>('');
  readonly errorMessage = signal<string | null>(null);

  loadSampleJson(): void {
    this.jsonInput.set(SAMPLE_COURSE_TEMPLATE);
    this.errorMessage.set(null);
  }

  onJsonChange(val: string): void {
    this.jsonInput.set(val);
    this.errorMessage.set(null);
  }

  submitImport(): void {
    const raw = this.jsonInput().trim();
    if (!raw) {
      this.errorMessage.set('Please paste course JSON data.');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.title || !Array.isArray(parsed.modules)) {
        this.errorMessage.set('Invalid format: Course must have a "title" and "modules" array.');
        return;
      }

      this.imported.emit(parsed as Course);
      this.jsonInput.set('');
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('Malformed JSON syntax. Please verify the JSON format.');
    }
  }
}
