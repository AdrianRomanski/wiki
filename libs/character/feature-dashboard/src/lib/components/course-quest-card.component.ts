import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  calculateCourseProgressStats,
  Course,
  CourseItem,
  CourseModule,
  UserCourseProgress,
} from '@wiki/character-domain-models';

@Component({
  selector: 'character-course-quest-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-quest-card course-quest-card">
      <div class="quest-card-header">
        <div class="header-top-row">
          <span class="quest-badge course-badge">Daily Study Quest</span>
          <div class="header-actions">
            @if (availableCourses().length > 1) {
              <select
                class="course-select"
                [value]="course()?.id || ''"
                (change)="onCourseChange($event)"
                aria-label="Select active course"
              >
                @for (c of availableCourses(); track c.id) {
                  <option [value]="c.id">{{ c.title }}</option>
                }
              </select>
            }
            <button
              type="button"
              class="btn-icon"
              title="Import or Add Course"
              (click)="openImportCourseRequested.emit()"
            >
              📥 Ingest Course
            </button>
          </div>
        </div>
        <div class="title-with-platform">
          <h3>🎓 {{ course()?.title || 'Structured Technical Course Learning' }}</h3>
          @if (course(); as c) {
            <span class="platform-tag">{{ c.platform }} • {{ c.instructor }}</span>
          }
        </div>
      </div>

      <p class="quest-desc">
        Earn calibrated XP (<strong>+25 INT / +5 WIS</strong> for videos, <strong>+35 INT / +15 DIS</strong> for practical labs) plus a <strong>+20 Daily Quest Bonus</strong> on your first daily lesson!
      </p>

      @if (!course()) {
        <!-- Empty State when no course has been added yet -->
        <div class="empty-courses-state">
          <div class="empty-icon">📚</div>
          <div class="empty-text">
            <strong>No Active Courses Ingested</strong>
            <p>Ingest a course syllabus from Frontend Masters, Udemy, Coursera, or custom engineering portals to track daily progress and earn INT, WIS & DIS XP.</p>
          </div>
          <button
            type="button"
            class="btn-ingest-primary"
            (click)="openImportCourseRequested.emit()"
          >
            📥 Ingest Your First Course
          </button>
        </div>
      } @else {
        <!-- Daily Quest Objective Banner -->
        <div
          class="daily-quest-banner"
          [class.completed]="isDailyQuestDone()"
        >
          <div class="banner-icon">
            @if (isDailyQuestDone()) {
              <span>✨</span>
            } @else {
              <span>🎯</span>
            }
          </div>
          <div class="banner-content">
            <div class="banner-title">
              @if (isDailyQuestDone()) {
                <strong>Daily Course Quest Complete!</strong>
              } @else {
                <strong>Daily Objective: Complete 1 Lesson or Lab</strong>
              }
            </div>
            <span class="banner-sub">
              @if (isDailyQuestDone()) {
                +20 Daily Bonus (+10 DIS, +10 INT) claimed today
              } @else {
                Advance your technical mastery to maintain your study streak
              }
            </span>
          </div>
          <span class="bonus-pill" [class.claimed]="isDailyQuestDone()">
            {{ isDailyQuestDone() ? '✔ Claimed' : '+20 Quest XP' }}
          </span>
        </div>

        <!-- Course Progress Bar & Overview -->
        @if (course(); as c) {
          <div class="course-overview-stats">
            <div class="stats-row">
              <div class="stat-pill">
                <span class="stat-num">{{ stats().completedItems }}/{{ stats().totalItems }}</span>
                <span class="stat-lbl">Items Done</span>
              </div>
              <div class="stat-pill">
                <span class="stat-num">🎥 {{ stats().completedVideos }}/{{ stats().totalVideos }}</span>
                <span class="stat-lbl">Lectures</span>
              </div>
              <div class="stat-pill">
                <span class="stat-num">💻 {{ stats().completedExercises }}/{{ stats().totalExercises }}</span>
                <span class="stat-lbl">Labs</span>
              </div>
              <div class="stat-pill highlight">
                <span class="stat-num">{{ stats().percentComplete }}%</span>
                <span class="stat-lbl">Mastery</span>
              </div>
            </div>

            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                [style.width.%]="stats().percentComplete"
              ></div>
            </div>
          </div>

          <!-- Next Up Item Card -->
          @if (nextItem(); as next) {
            <div class="next-up-container">
              <div class="next-up-header">
                <span class="next-label">⏭️ Next Up:</span>
                <span class="module-title">{{ next.module.title }}</span>
              </div>

              <div class="next-item-card" [class.exercise-type]="next.item.type === 'exercise'">
                <div class="item-type-icon">
                  {{ next.item.type === 'video' ? '🎥' : '💻' }}
                </div>
                <div class="item-details">
                  <div class="item-title-row">
                    <h4 class="item-title">{{ next.item.title }}</h4>
                    <span class="item-duration">
                      {{ next.item.durationMinutes ? next.item.durationMinutes + ' min' : (next.item.type === 'video' ? 'Lecture' : 'Lab') }}
                    </span>
                  </div>
                  <div class="item-xp-preview">
                    @if (next.item.type === 'video') {
                      <span class="xp-badge int">+25 INT</span>
                      <span class="xp-badge wis">+5 WIS</span>
                    } @else {
                      <span class="xp-badge int">+35 INT</span>
                      <span class="xp-badge dis">+15 DIS</span>
                    }
                    @if (!isDailyQuestDone()) {
                      <span class="xp-badge daily">+20 Daily Bonus</span>
                    }
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    type="button"
                    class="btn-complete-next"
                    (click)="openCheckinRequested.emit({ courseId: c.id, item: next.item, module: next.module })"
                  >
                    ⚡ Check In & Claim XP
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="course-completed-banner">
              <span class="trophy-icon">🏆</span>
              <div>
                <strong>100% Course Completed!</strong>
                <p>You have mastered all modules and claimed the +500 XP Graduation Bonus.</p>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .course-quest-card {
      background: rgba(18, 24, 38, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .header-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .quest-badge.course-badge {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .course-select {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      max-width: 200px;

      &:focus {
        outline: none;
        border-color: #60a5fa;
      }
    }

    .btn-icon {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(59, 130, 246, 0.3);
        color: #ffffff;
      }
    }

    .title-with-platform {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #f8fafc;
      }

      .platform-tag {
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

    .empty-courses-state {
      background: rgba(15, 23, 42, 0.6);
      border: 1px dashed rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;

      .empty-icon {
        font-size: 2.2rem;
      }

      .empty-text {
        strong {
          display: block;
          font-size: 1rem;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        p {
          margin: 0;
          color: #94a3b8;
          font-size: 0.85rem;
          max-width: 440px;
          line-height: 1.4;
        }
      }

      .btn-ingest-primary {
        margin-top: 4px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border: none;
        color: #ffffff;
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
        }
      }
    }

    .daily-quest-banner {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;

      &.completed {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .banner-icon {
        font-size: 1.3rem;
      }

      .banner-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .banner-title {
          font-size: 0.9rem;
          color: #f8fafc;
        }

        .banner-sub {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }

      .bonus-pill {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 8px;
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);

        &.claimed {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.4);
        }
      }
    }

    .course-overview-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;

        .stat-pill {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;

          .stat-num {
            font-size: 0.9rem;
            font-weight: 700;
            color: #f1f5f9;
          }

          .stat-lbl {
            font-size: 0.7rem;
            color: #94a3b8;
          }

          &.highlight {
            border-color: rgba(59, 130, 246, 0.4);
            background: rgba(59, 130, 246, 0.1);

            .stat-num {
              color: #60a5fa;
            }
          }
        }
      }

      .progress-bar-track {
        height: 6px;
        background: rgba(30, 41, 59, 1);
        border-radius: 4px;
        overflow: hidden;

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }
    }

    .next-up-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;

      .next-up-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;

        .next-label {
          font-weight: 700;
          color: #60a5fa;
          text-transform: uppercase;
        }

        .module-title {
          color: #94a3b8;
        }
      }

      .next-item-card {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;

        &.exercise-type {
          border-color: rgba(168, 85, 247, 0.4);
          background: rgba(24, 15, 42, 0.8);
        }

        .item-type-icon {
          font-size: 1.5rem;
        }

        .item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .item-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .item-title {
              margin: 0;
              font-size: 0.95rem;
              color: #f8fafc;
            }

            .item-duration {
              font-size: 0.75rem;
              color: #94a3b8;
            }
          }

          .item-xp-preview {
            display: flex;
            gap: 6px;

            .xp-badge {
              font-size: 0.65rem;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;

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
              &.daily {
                background: rgba(16, 185, 129, 0.2);
                color: #34d399;
              }
            }
          }
        }

        .btn-complete-next {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.3);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
          }
        }
      }
    }

    .course-completed-banner {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;

      .trophy-icon {
        font-size: 2rem;
      }

      strong {
        color: #34d399;
        font-size: 1rem;
      }

      p {
        margin: 4px 0 0 0;
        color: #cbd5e1;
        font-size: 0.8rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseQuestCardComponent {
  readonly course = input<Course | null>(null);
  readonly progress = input<UserCourseProgress | null>(null);
  readonly nextItem = input<{ item: CourseItem; module: CourseModule } | null>(null);
  readonly isDailyQuestDone = input<boolean>(false);
  readonly availableCourses = input<Course[]>([]);

  readonly openCheckinRequested = output<{
    courseId: string;
    item: CourseItem;
    module: CourseModule;
  }>();
  readonly selectCourseRequested = output<string>();
  readonly openImportCourseRequested = output<void>();

  readonly stats = computed(() => {
    const c = this.course();
    const p = this.progress();
    if (!c) {
      return {
        totalItems: 0,
        completedItems: 0,
        percentComplete: 0,
        totalVideos: 0,
        completedVideos: 0,
        totalExercises: 0,
        completedExercises: 0,
      };
    }
    return calculateCourseProgressStats(c, p || undefined);
  });

  onCourseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.selectCourseRequested.emit(target.value);
    }
  }
}
