import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Course, CourseItem, CourseModule, UserCourseProgress } from '@wiki/character-domain-models';

@Component({
  selector: 'character-course-curriculum-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="curriculum-accordion-card">
      <div class="curriculum-header">
        <h4 class="section-title">📑 Course Curriculum & Modules</h4>
        <span class="module-count-badge">{{ course().modules.length }} Modules</span>
      </div>

      <div class="modules-list">
        @for (module of course().modules; track module.id; let modIdx = $index) {
          <div class="module-item" [class.module-done]="isModuleFullyDone(module)">
            <div class="module-header" (click)="toggleModule(module.id)">
              <div class="module-title-area">
                <span class="module-chevron">{{ isModuleExpanded(module.id) ? '▼' : '▶' }}</span>
                <span class="module-idx">Module {{ modIdx + 1 }}</span>
                <span class="module-name">{{ module.title }}</span>
              </div>
              <div class="module-meta">
                <span class="module-items-count">
                  {{ getCompletedCountInModule(module) }}/{{ module.items.length }} Done
                </span>
                @if (isModuleFullyDone(module)) {
                  <span class="module-mastered-tag">🏆 Mastered (+100 XP)</span>
                }
              </div>
            </div>

            @if (isModuleExpanded(module.id)) {
              <div class="module-content">
                @if (module.description) {
                  <p class="module-desc">{{ module.description }}</p>
                }

                <div class="items-list">
                  @for (item of module.items; track item.id; let itemIdx = $index) {
                    <div
                      class="curriculum-item"
                      [class.item-completed]="isItemCompleted(item.id)"
                      [class.item-exercise]="item.type === 'exercise'"
                      (click)="itemClicked.emit({ item, module })"
                    >
                      <div class="item-status-icon">
                        @if (isItemCompleted(item.id)) {
                          <span class="check-icon">✅</span>
                        } @else {
                          <span class="type-icon">{{ item.type === 'video' ? '🎥' : '💻' }}</span>
                        }
                      </div>

                      <div class="item-info">
                        <div class="item-title-row">
                          <span class="item-title">{{ item.title }}</span>
                          @if (item.durationMinutes) {
                            <span class="item-duration">{{ item.durationMinutes }}m</span>
                          }
                        </div>

                        <div class="item-badges-row">
                          <span class="item-type-badge" [class.exercise]="item.type === 'exercise'">
                            {{ item.type === 'video' ? 'Video Lecture' : 'Coding Lab / Exercise' }}
                          </span>
                          @if (isItemCompleted(item.id)) {
                            <span class="completed-tag">
                              Completed • +{{ getItemXpAwarded(item.id) }} XP
                            </span>
                          } @else {
                            <span class="reward-preview">
                              {{ item.type === 'video' ? '+25 INT, +5 WIS' : '+35 INT, +15 DIS' }}
                            </span>
                          }
                        </div>

                        @if (getItemNotes(item.id); as notes) {
                          <div class="item-notes-preview">
                            <span class="notes-quote">📝 "{{ notes }}"</span>
                          </div>
                        }
                      </div>

                      <div class="item-action-indicator">
                        @if (!isItemCompleted(item.id)) {
                          <button type="button" class="btn-checkin-small">
                            Check In
                          </button>
                        } @else {
                          <span class="view-notes-btn">View Details</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .curriculum-accordion-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .curriculum-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #f1f5f9;
      }

      .module-count-badge {
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .modules-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .module-item {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.4);
      overflow: hidden;
      transition: border-color 0.2s;

      &.module-done {
        border-color: rgba(16, 185, 129, 0.3);
      }
    }

    .module-header {
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      background: rgba(30, 41, 59, 0.6);

      &:hover {
        background: rgba(51, 65, 85, 0.6);
      }

      .module-title-area {
        display: flex;
        align-items: center;
        gap: 8px;

        .module-chevron {
          font-size: 0.75rem;
          color: #94a3b8;
          width: 14px;
        }

        .module-idx {
          font-size: 0.75rem;
          font-weight: 700;
          color: #60a5fa;
          text-transform: uppercase;
        }

        .module-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: #f8fafc;
        }
      }

      .module-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .module-items-count {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .module-mastered-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
      }
    }

    .module-content {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .module-desc {
        margin: 0;
        font-size: 0.8rem;
        color: #94a3b8;
        line-height: 1.4;
      }
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .curriculum-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateX(2px);
      }

      &.item-completed {
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.2);
      }

      &.item-exercise {
        border-left: 3px solid #a855f7;
      }

      .item-status-icon {
        font-size: 1rem;
        width: 24px;
        text-align: center;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .item-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .item-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: #f1f5f9;
          }

          .item-duration {
            font-size: 0.75rem;
            color: #94a3b8;
          }
        }

        .item-badges-row {
          display: flex;
          align-items: center;
          gap: 6px;

          .item-type-badge {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 4px;
            background: rgba(59, 130, 246, 0.15);
            color: #93c5fd;

            &.exercise {
              background: rgba(168, 85, 247, 0.15);
              color: #d8b4fe;
            }
          }

          .completed-tag {
            font-size: 0.65rem;
            color: #34d399;
          }

          .reward-preview {
            font-size: 0.65rem;
            color: #fbbf24;
          }
        }

        .item-notes-preview {
          margin-top: 2px;
          .notes-quote {
            font-size: 0.7rem;
            color: #94a3b8;
            font-style: italic;
          }
        }
      }

      .item-action-indicator {
        .btn-checkin-small {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #93c5fd;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;

          &:hover {
            background: #2563eb;
            color: #ffffff;
          }
        }

        .view-notes-btn {
          font-size: 0.7rem;
          color: #64748b;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCurriculumAccordionComponent {
  readonly course = input.required<Course>();
  readonly progress = input.required<UserCourseProgress>();

  readonly itemClicked = output<{ item: CourseItem; module: CourseModule }>();

  private readonly expandedModuleIds = signal<Set<string>>(new Set<string>(['mod-signals-core']));

  isModuleExpanded(moduleId: string): boolean {
    if (this.expandedModuleIds().size === 0 && this.course().modules.length > 0) {
      return this.course().modules[0].id === moduleId;
    }
    return this.expandedModuleIds().has(moduleId);
  }

  toggleModule(moduleId: string): void {
    const updated = new Set(this.expandedModuleIds());
    if (updated.has(moduleId)) {
      updated.delete(moduleId);
    } else {
      updated.add(moduleId);
    }
    this.expandedModuleIds.set(updated);
  }

  isItemCompleted(itemId: string): boolean {
    return this.progress().completedItemIds.includes(itemId);
  }

  getItemXpAwarded(itemId: string): number {
    return this.progress().itemProgress[itemId]?.xpAwarded || 0;
  }

  getItemNotes(itemId: string): string | undefined {
    return this.progress().itemProgress[itemId]?.notes;
  }

  getCompletedCountInModule(module: CourseModule): number {
    const completedSet = new Set(this.progress().completedItemIds);
    return module.items.filter((i) => completedSet.has(i.id)).length;
  }

  isModuleFullyDone(module: CourseModule): boolean {
    if (!module.items.length) return false;
    const completedSet = new Set(this.progress().completedItemIds);
    return module.items.every((i) => completedSet.has(i.id));
  }
}
