import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Book,
  BOOK_COMPLETION_BONUS_XP,
  DAILY_READING_BASE_XP,
  DAILY_READING_DISCIPLINE_XP,
  DEFAULT_READING_PAGES_PER_DAY,
  ReadingQuestCompletionPayload,
} from '@wiki/character-domain-models';

@Component({
  selector: 'character-daily-reading-quest-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="action-quest-card reading-quest-card">
      <div class="quest-card-header">
        <div class="header-top-row">
          <span class="quest-badge reading-badge">Daily Reading Quest</span>
          @if (readingBooks().length > 1) {
            <select
              class="book-select"
              [value]="activeBook()?.id || ''"
              (change)="onBookSelectChange($event)"
              aria-label="Select active book"
            >
              @for (b of readingBooks(); track b.id) {
                <option [value]="b.id">{{ b.title }}</option>
              }
            </select>
          }
        </div>
        <div class="title-with-book">
          <h3>📚 {{ activeBook()?.title || 'Daily Book Reading Quest' }}</h3>
          @if (activeBook(); as book) {
            <span class="author-tag">by {{ book.author }}</span>
          }
        </div>
      </div>

      <p class="quest-desc">
        Earn <strong>+40 WIS & +10 DIS XP</strong> daily by logging pages read. Finish a book for a <strong>+200 WIS XP</strong> bonus!
      </p>

      @if (!activeBook()) {
        <div class="empty-shelf-state">
          <div class="empty-icon">📖</div>
          <div class="empty-text">
            <strong>No Active Book on Shelf</strong>
            <p>Add a book to your shelf to start tracking daily page reading and earn Wisdom XP.</p>
          </div>
          <button
            type="button"
            class="btn-add-book-prompt"
            (click)="openAddBookRequested.emit()"
          >
            ➕ Add Your First Book
          </button>
        </div>
      } @else {
        @if (activeBook(); as book) {
          <div class="book-progress-box">
            <div class="progress-labels">
              <span class="page-count">Page {{ book.currentPage }} of {{ book.totalPages }}</span>
              <span class="progress-pct">{{ progressPercent() }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="progressPercent()"></div>
            </div>
          </div>

          <div class="inline-stepper-container">
            <label class="stepper-label" for="pagesReadInput">
              How many pages did you read today?
            </label>

            <div class="stepper-controls">
              <button
                type="button"
                class="stepper-btn"
                (click)="decrementPages()"
                [disabled]="pagesReadInput() <= 1"
                aria-label="Decrease pages read"
              >
                −
              </button>

              <div class="input-wrapper">
                <input
                  id="pagesReadInput"
                  type="number"
                  class="pages-number-input"
                  [min]="1"
                  [max]="remainingPages()"
                  [ngModel]="pagesReadInput()"
                  (ngModelChange)="onPagesInputChange($event)"
                />
                <span class="input-unit">pages</span>
              </div>

              <button
                type="button"
                class="stepper-btn"
                (click)="incrementPages()"
                [disabled]="pagesReadInput() >= remainingPages()"
                aria-label="Increase pages read"
              >
                +
              </button>

              <div class="quick-chips">
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="pagesReadInput() === 10"
                  (click)="setPages(10)"
                >
                  10p
                </button>
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="pagesReadInput() === 15"
                  (click)="setPages(15)"
                >
                  15p
                </button>
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="pagesReadInput() === 25"
                  (click)="setPages(25)"
                >
                  25p
                </button>
              </div>
            </div>
          </div>

          <div class="action-area">
            <button
              type="button"
              class="btn-one-click-reading"
              (click)="onLogPagesClick()"
            >
              @if (willFinishBook()) {
                🏆 Finish Book & Log {{ pagesReadInput() }} Pages (+250 XP)!
              } @else {
                📖 Log {{ pagesReadInput() }} Pages (+40 WIS & +10 DIS XP)
              }
            </button>

            <div class="optional-notes-section">
              <button
                type="button"
                class="toggle-notes-btn"
                (click)="isNotesOpen.set(!isNotesOpen())"
                [attr.aria-expanded]="isNotesOpen()"
              >
                <span>{{ isNotesOpen() ? '▴ Hide notes / reflections' : '▾ Add notes or reflections (strictly optional)' }}</span>
              </button>

              @if (isNotesOpen()) {
                <div class="inline-notes-box">
                  <textarea
                    class="notes-textarea"
                    placeholder="Optional quotes, reflections, or page bookmarks..."
                    rows="2"
                    [ngModel]="optionalNotes()"
                    (ngModelChange)="optionalNotes.set($event)"
                  ></textarea>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .reading-quest-card {
      background: rgba(18, 24, 38, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .header-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .quest-badge.reading-badge {
      background: rgba(168, 85, 247, 0.2);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.4);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .book-select {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      max-width: 180px;

      &:focus {
        outline: none;
        border-color: #c084fc;
      }
    }

    .title-with-book {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #f8fafc;
      }

      .author-tag {
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }

    .quest-desc {
      color: #94a3b8;
      font-size: 0.85rem;
      line-height: 1.4;
      margin: 0;
    }

    .book-progress-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: #cbd5e1;

        .progress-pct {
          font-weight: 700;
          color: #c084fc;
        }
      }

      .progress-track {
        height: 6px;
        background: rgba(30, 41, 59, 1);
        border-radius: 4px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #6366f1);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }

    .inline-stepper-container {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.25);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .stepper-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #e2e8f0;
      }

      .stepper-controls {
        display: flex;
        align-items: center;
        gap: 8px;

        .stepper-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #e9d5ff;
          font-size: 1.2rem;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: rgba(168, 85, 247, 0.3);
            color: #ffffff;
            transform: scale(1.05);
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 0 10px;

          .pages-number-input {
            width: 50px;
            height: 36px;
            background: transparent;
            border: none;
            color: #f8fafc;
            font-size: 1.1rem;
            font-weight: 700;
            text-align: center;

            &:focus {
              outline: none;
            }

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
          }

          .input-unit {
            font-size: 0.8rem;
            color: #94a3b8;
          }
        }

        .quick-chips {
          display: flex;
          gap: 6px;
          margin-left: 8px;

          .chip-btn {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              color: #f8fafc;
              border-color: rgba(168, 85, 247, 0.4);
            }

            &.active {
              background: rgba(168, 85, 247, 0.25);
              border-color: #c084fc;
              color: #f8fafc;
            }
          }
        }
      }
    }

    .action-area {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .btn-one-click-reading {
        width: 100%;
        background: linear-gradient(135deg, #9333ea, #7c3aed);
        border: none;
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(147, 51, 234, 0.35);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5);
          background: linear-gradient(135deg, #a855f7, #9333ea);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .optional-notes-section {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .toggle-notes-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 4px 0;
          text-align: left;
          transition: color 0.2s;

          &:hover {
            color: #cbd5e1;
          }
        }

        .inline-notes-box {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .notes-textarea {
            width: 100%;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            color: #f8fafc;
            padding: 8px 12px;
            font-size: 0.85rem;
            resize: vertical;
            box-sizing: border-box;

            &:focus {
              outline: none;
              border-color: #c084fc;
            }
          }
        }
      }
    }

    .empty-shelf-state {
      background: rgba(15, 23, 42, 0.6);
      border: 1px dashed rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;

      .empty-icon { font-size: 2rem; }
      .empty-text {
        strong { color: #f8fafc; font-size: 0.95rem; }
        p { margin: 2px 0 0 0; color: #94a3b8; font-size: 0.8rem; }
      }

      .btn-add-book-prompt {
        background: linear-gradient(135deg, #9333ea, #7c3aed);
        border: none;
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReadingQuestCardComponent {
  readonly activeBook = input<Book | undefined>(undefined);
  readonly readingBooks = input<Book[]>([]);

  readonly completeReadingQuestRequested = output<ReadingQuestCompletionPayload>();
  readonly selectBookRequested = output<string>();
  readonly openAddBookRequested = output<void>();

  readonly pagesReadInput = signal<number>(DEFAULT_READING_PAGES_PER_DAY);
  readonly isNotesOpen = signal<boolean>(false);
  readonly optionalNotes = signal<string>('');

  readonly remainingPages = computed<number>(() => {
    const book = this.activeBook();
    if (!book) return DEFAULT_READING_PAGES_PER_DAY;
    return Math.max(1, book.totalPages - book.currentPage);
  });

  readonly progressPercent = computed<number>(() => {
    const book = this.activeBook();
    if (!book || book.totalPages <= 0) return 0;
    return Math.round((book.currentPage / book.totalPages) * 100);
  });

  readonly willFinishBook = computed<boolean>(() => {
    const book = this.activeBook();
    if (!book) return false;
    return book.currentPage + this.pagesReadInput() >= book.totalPages;
  });

  incrementPages(): void {
    const nextVal = Math.min(this.remainingPages(), this.pagesReadInput() + 5);
    this.pagesReadInput.set(nextVal);
  }

  decrementPages(): void {
    const nextVal = Math.max(1, this.pagesReadInput() - 5);
    this.pagesReadInput.set(nextVal);
  }

  setPages(count: number): void {
    const clamped = Math.min(this.remainingPages(), Math.max(1, count));
    this.pagesReadInput.set(clamped);
  }

  onPagesInputChange(val: number): void {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      this.pagesReadInput.set(Math.min(this.remainingPages(), num));
    }
  }

  onBookSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.selectBookRequested.emit(target.value);
    }
  }

  onLogPagesClick(): void {
    const book = this.activeBook();
    if (!book) return;

    this.completeReadingQuestRequested.emit({
      bookId: book.id,
      pagesReadThisDay: this.pagesReadInput(),
      notes: this.optionalNotes().trim() || undefined,
    });

    this.optionalNotes.set('');
    this.isNotesOpen.set(false);
  }
}
