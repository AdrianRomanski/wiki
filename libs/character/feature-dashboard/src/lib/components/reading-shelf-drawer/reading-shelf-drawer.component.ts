import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Book } from '@wiki/character-domain-models';

@Component({
  selector: 'character-reading-shelf-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reading-shelf-drawer-container">
      <button
        type="button"
        class="drawer-toggle-header"
        (click)="isOpen.set(!isOpen())"
        [attr.aria-expanded]="isOpen()"
      >
        <div class="toggle-title">
          <span class="drawer-icon">📚</span>
          <strong>Reading Bookshelf & Archive</strong>
          <span class="count-badge">
            {{ currentlyReadingBooks().length }} Active, {{ completedBooks().length }} Completed
          </span>
        </div>
        <div class="toggle-action">
          <span class="toggle-label">{{ isOpen() ? 'Hide Shelf & Archive' : 'View Shelf & Archive' }}</span>
          <span class="toggle-arrow">{{ isOpen() ? '▴' : '▾' }}</span>
        </div>
      </button>

      @if (isOpen()) {
        <div class="drawer-body">
          <div class="shelf-toolbar">
            <button
              type="button"
              class="btn-toggle-add"
              (click)="isAddBookFormOpen.set(!isAddBookFormOpen())"
            >
              {{ isAddBookFormOpen() ? '✖ Cancel Add Book' : '➕ Add New Book to Shelf' }}
            </button>
          </div>

          @if (isAddBookFormOpen()) {
            <div class="inline-add-book-card">
              <header class="card-header">
                <h5>➕ Add New Book to Shelf</h5>
              </header>
              <form (submit)="$event.preventDefault(); submitAddBook()">
                <div class="form-row">
                  <div class="form-group col-title">
                    <label for="drawerBookTitle">Book Title *</label>
                    <input
                      id="drawerBookTitle"
                      type="text"
                      class="form-control"
                      placeholder="e.g. Clean Code"
                      [ngModel]="newTitle()"
                      (ngModelChange)="newTitle.set($event)"
                      required
                    />
                  </div>
                  <div class="form-group col-author">
                    <label for="drawerBookAuthor">Author *</label>
                    <input
                      id="drawerBookAuthor"
                      type="text"
                      class="form-control"
                      placeholder="e.g. Robert Martin"
                      [ngModel]="newAuthor()"
                      (ngModelChange)="newAuthor.set($event)"
                      required
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group col-pages">
                    <label for="drawerBookPages">Total Pages *</label>
                    <input
                      id="drawerBookPages"
                      type="number"
                      class="form-control"
                      placeholder="400"
                      min="1"
                      [ngModel]="newTotalPages()"
                      (ngModelChange)="newTotalPages.set(+$event)"
                      required
                    />
                  </div>
                  <div class="form-group col-pages">
                    <label for="drawerBookStart">Starting Page</label>
                    <input
                      id="drawerBookStart"
                      type="number"
                      class="form-control"
                      placeholder="0"
                      min="0"
                      [ngModel]="newInitialPage()"
                      (ngModelChange)="newInitialPage.set(+$event)"
                    />
                  </div>
                </div>

                <div class="form-footer">
                  <button
                    type="submit"
                    class="btn-submit-add"
                    [disabled]="!newTitle() || !newAuthor() || !newTotalPages()"
                  >
                    Save to Shelf
                  </button>
                </div>
              </form>
            </div>
          }

          <div class="active-shelf-section">
            <h5 class="sub-heading">Active Books ({{ currentlyReadingBooks().length }})</h5>

            @if (currentlyReadingBooks().length === 0) {
              <p class="empty-note">No books currently being read.</p>
            } @else {
              <div class="books-grid">
                @for (book of currentlyReadingBooks(); track book.id) {
                  <div class="book-card">
                    <div class="book-info">
                      <strong class="book-title">{{ book.title }}</strong>
                      <span class="book-author">by {{ book.author }}</span>
                      <span class="book-pages-summary">Page {{ book.currentPage }} / {{ book.totalPages }}</span>
                    </div>
                    <button
                      type="button"
                      class="btn-select-book"
                      (click)="selectBookForQuestRequested.emit(book.id)"
                    >
                      Set as Active Quest Book
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="archive-section">
            <div class="archive-header">
              <h5 class="sub-heading">🏆 Completed Books Archive</h5>
              <div class="archive-filters">
                <select
                  class="filter-select"
                  [ngModel]="selectedMonth()"
                  (ngModelChange)="monthChanged.emit(+$event)"
                >
                  @for (m of monthOptions(); track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
                <select
                  class="filter-select"
                  [ngModel]="selectedYear()"
                  (ngModelChange)="yearChanged.emit(+$event)"
                >
                  <option [value]="2026">2026</option>
                  <option [value]="2025">2025</option>
                </select>
              </div>
            </div>

            @if (completedBooks().length === 0) {
              <p class="empty-note">No books completed in this period.</p>
            } @else {
              <ul class="completed-books-list">
                @for (book of completedBooks(); track book.id) {
                  <li class="completed-book-item">
                    <span class="check-icon">✅</span>
                    <div class="completed-details">
                      <strong>{{ book.title }}</strong> by {{ book.author }} ({{ book.totalPages }} pages)
                      <span class="completed-date">Finished on {{ book.completedAt | date: 'mediumDate' }}</span>
                    </div>
                    <span class="xp-badge">+200 WIS XP</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reading-shelf-drawer-container {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .drawer-toggle-header {
      width: 100%;
      background: none;
      border: none;
      color: #f1f5f9;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;

      &:hover {
        background: rgba(168, 85, 247, 0.08);
      }

      .toggle-title {
        display: flex;
        align-items: center;
        gap: 10px;

        .drawer-icon { font-size: 1.1rem; }
        .count-badge {
          font-size: 0.75rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
        }
      }

      .toggle-action {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #c084fc;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    .drawer-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .shelf-toolbar {
      display: flex;
      justify-content: flex-end;

      .btn-toggle-add {
        background: rgba(168, 85, 247, 0.15);
        border: 1px solid rgba(168, 85, 247, 0.35);
        color: #e9d5ff;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(168, 85, 247, 0.3);
          color: #ffffff;
        }
      }
    }

    .inline-add-book-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      h5 { margin: 0 0 6px 0; color: #f8fafc; font-size: 0.9rem; }

      .form-row {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;

        @media (max-width: 600px) {
          flex-direction: column;
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;

        label { font-size: 0.75rem; color: #94a3b8; }
        .form-control {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: #f8fafc;
          padding: 6px 10px;
          font-size: 0.85rem;

          &:focus { outline: none; border-color: #c084fc; }
        }
      }

      .form-footer {
        display: flex;
        justify-content: flex-end;

        .btn-submit-add {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border: none;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;

          &:disabled { opacity: 0.5; cursor: not-allowed; }
        }
      }
    }

    .sub-heading {
      margin: 0 0 8px 0;
      color: #f1f5f9;
      font-size: 0.9rem;
    }

    .empty-note {
      color: #64748b;
      font-size: 0.8rem;
      margin: 4px 0;
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;

      .book-card {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;

        .book-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .book-title { color: #f8fafc; font-size: 0.85rem; }
          .book-author { color: #94a3b8; font-size: 0.75rem; }
          .book-pages-summary { color: #c084fc; font-size: 0.75rem; font-weight: 600; margin-top: 4px; }
        }

        .btn-select-book {
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #e9d5ff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(168, 85, 247, 0.3);
            color: #ffffff;
          }
        }
      }
    }

    .archive-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 12px;

      .archive-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .archive-filters {
          display: flex;
          gap: 6px;

          .filter-select {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #f8fafc;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
          }
        }
      }

      .completed-books-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .completed-book-item {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;

          .completed-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            font-size: 0.8rem;
            color: #f1f5f9;

            .completed-date { font-size: 0.7rem; color: #94a3b8; }
          }

          .xp-badge {
            font-size: 0.7rem;
            font-weight: 700;
            color: #34d399;
            background: rgba(16, 185, 129, 0.15);
            padding: 2px 6px;
            border-radius: 4px;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingShelfDrawerComponent {
  readonly currentlyReadingBooks = input<Book[]>([]);
  readonly completedBooks = input<Book[]>([]);
  readonly selectedMonth = input<number>(new Date().getMonth() + 1);
  readonly selectedYear = input<number>(new Date().getFullYear());
  readonly monthOptions = input<{ value: number; label: string }[]>([]);

  readonly addBookRequested = output<{
    title: string;
    author: string;
    totalPages: number;
    initialPage?: number;
    notes?: string;
  }>();
  readonly selectBookForQuestRequested = output<string>();
  readonly monthChanged = output<number>();
  readonly yearChanged = output<number>();

  readonly isOpen = signal<boolean>(false);
  readonly isAddBookFormOpen = signal<boolean>(false);

  readonly newTitle = signal<string>('');
  readonly newAuthor = signal<string>('');
  readonly newTotalPages = signal<number | null>(null);
  readonly newInitialPage = signal<number>(0);

  submitAddBook(): void {
    const title = this.newTitle().trim();
    const author = this.newAuthor().trim();
    const totalPages = this.newTotalPages();

    if (!title || !author || !totalPages || totalPages <= 0) return;

    this.addBookRequested.emit({
      title,
      author,
      totalPages,
      initialPage: this.newInitialPage() || 0,
    });

    this.newTitle.set('');
    this.newAuthor.set('');
    this.newTotalPages.set(null);
    this.newInitialPage.set(0);
    this.isAddBookFormOpen.set(false);
  }
}
