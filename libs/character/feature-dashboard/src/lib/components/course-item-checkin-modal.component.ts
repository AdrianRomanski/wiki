import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course, CourseItem, CourseModule } from '@wiki/character-domain-models';

@Component({
  selector: 'character-course-item-checkin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen() && item(); as itm) {
      <div class="modal-backdrop" (click)="closed.emit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="header-titles">
              <span class="type-badge" [class.exercise]="itm.type === 'exercise'">
                {{ itm.type === 'video' ? '🎥 Video Lecture' : '💻 Practical Exercise / Lab' }}
              </span>
              <h3>{{ itm.title }}</h3>
              @if (module(); as m) {
                <span class="module-subtitle">{{ m.title }}</span>
              }
            </div>
            <button type="button" class="close-btn" (click)="closed.emit()">✖</button>
          </header>

          <div class="modal-body">
            @if (itm.durationMinutes) {
              <div class="meta-row">
                <span class="meta-label">⏱️ Duration / Estimate:</span>
                <span class="meta-value">{{ itm.durationMinutes }} minutes</span>
              </div>
            }

            @if (itm.sourceUrl) {
              <div class="meta-row">
                <span class="meta-label">🔗 Source URL:</span>
                <a [href]="itm.sourceUrl" target="_blank" rel="noopener noreferrer" class="source-link">
                  Open Lesson on Platform ↗
                </a>
              </div>
            }

            @if (itm.exercisePrompt) {
              <div class="detail-box exercise-box">
                <span class="box-label">🛠️ Hands-On Task Instructions:</span>
                <p>{{ itm.exercisePrompt }}</p>
                @if (itm.starterRepoUrl) {
                  <a [href]="itm.starterRepoUrl" target="_blank" rel="noopener noreferrer" class="repo-link">
                    📦 Starter Repository / Lab Sandbox ↗
                  </a>
                }
              </div>
            }

            @if (itm.transcriptText) {
              <div class="detail-box transcript-box">
                <span class="box-label">📝 Transcript Excerpt / Highlights:</span>
                <p>{{ itm.transcriptText }}</p>
              </div>
            }

            <!-- XP Reward Matrix Preview -->
            <div class="xp-reward-preview-box">
              <span class="box-label">⚡ XP Rewards for Completion:</span>
              <div class="rewards-grid">
                @if (itm.type === 'video') {
                  <div class="reward-pill int">+25 INT XP (Conceptual Learning)</div>
                  <div class="reward-pill wis">+5 WIS XP (Deep Understanding)</div>
                } @else {
                  <div class="reward-pill int">+35 INT XP (Applied Problem Solving)</div>
                  <div class="reward-pill dis">+15 DIS XP (Hands-On Implementation)</div>
                }
              </div>
            </div>

            <!-- Learning Reflections / Study Notes -->
            <div class="form-group">
              <label for="studyNotes">📝 Reflection Notes / Takeaways (Optional):</label>
              <textarea
                id="studyNotes"
                class="form-control"
                rows="3"
                placeholder="What key concept or code pattern did you learn? e.g. Used signal-based effects instead of subscription chains..."
                [ngModel]="notesText()"
                (ngModelChange)="notesText.set($event)"
                [disabled]="isCompleted()"
              ></textarea>
            </div>

            @if (isCompleted()) {
              <div class="already-done-notice">
                ✅ You have already completed this item and earned your XP reward.
              </div>
            }
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closed.emit()">
              Close
            </button>
            @if (!isCompleted()) {
              <button
                type="button"
                class="btn btn-primary"
                (click)="submit()"
              >
                ⚡ Complete & Claim XP
              </button>
            }
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
      max-width: 540px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      animation: modalFadeIn 0.25s ease-out;

      .modal-header {
        padding: 18px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .type-badge {
            align-self: flex-start;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.4);

            &.exercise {
              background: rgba(168, 85, 247, 0.2);
              color: #c084fc;
              border-color: rgba(168, 85, 247, 0.4);
            }
          }

          h3 {
            margin: 0;
            font-size: 1.15rem;
            color: #f8fafc;
          }

          .module-subtitle {
            font-size: 0.8rem;
            color: #94a3b8;
          }
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
        gap: 14px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .meta-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;

        .meta-label {
          color: #94a3b8;
        }

        .meta-value {
          color: #f1f5f9;
          font-weight: 600;
        }

        .source-link {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .detail-box {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .box-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #cbd5e1;
          text-transform: uppercase;
        }

        p {
          margin: 0;
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        .repo-link {
          margin-top: 4px;
          align-self: flex-start;
          font-size: 0.8rem;
          font-weight: 600;
          color: #c084fc;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        &.exercise-box {
          border-color: rgba(168, 85, 247, 0.3);
          background: rgba(24, 15, 42, 0.6);
        }
      }

      .xp-reward-preview-box {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .box-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #93c5fd;
        }

        .rewards-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .reward-pill {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 6px;

            &.int {
              background: rgba(59, 130, 246, 0.2);
              color: #60a5fa;
            }
            &.wis {
              background: rgba(168, 85, 247, 0.2);
              color: #c084fc;
            }
            &.dis {
              background: rgba(234, 179, 8, 0.2);
              color: #facc15;
            }
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

        .form-control {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 10px 12px;
          color: #f8fafc;
          font-size: 0.85rem;
          font-family: inherit;
          resize: vertical;

          &:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }

      .already-done-notice {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 8px;
        padding: 10px;
        color: #34d399;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
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
export class CourseItemCheckinModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly item = input<CourseItem | null>(null);
  readonly module = input<CourseModule | null>(null);
  readonly course = input<Course | null>(null);
  readonly isCompleted = input<boolean>(false);

  readonly closed = output<void>();
  readonly submitted = output<{ itemId: string; notes: string }>();

  readonly notesText = signal<string>('');

  submit(): void {
    const itm = this.item();
    if (!itm) return;
    this.submitted.emit({
      itemId: itm.id,
      notes: this.notesText(),
    });
    this.notesText.set('');
  }
}
