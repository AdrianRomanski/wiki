import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  Course,
  CourseItem,
  CourseModule,
  UserCourseProgress,
} from '@wiki/character-domain-models';
import { CourseCurriculumAccordionComponent } from '../course-curriculum-accordion.component';

@Component({
  selector: 'character-course-curriculum-drawer',
  standalone: true,
  imports: [CommonModule, CourseCurriculumAccordionComponent],
  template: `
    @if (course(); as c) {
      <div class="curriculum-drawer-container">
        <button
          type="button"
          class="drawer-toggle-header"
          (click)="isOpen.set(!isOpen())"
          [attr.aria-expanded]="isOpen()"
        >
          <div class="toggle-title">
            <span class="drawer-icon">📚</span>
            <strong>Course Curriculum & Syllabus</strong>
            <span class="count-badge">
              {{ c.modules.length }} Modules ({{ completedItemCount() }}/{{ totalItemCount() }} Done)
            </span>
          </div>
          <div class="toggle-action">
            <span class="toggle-label">{{ isOpen() ? 'Hide Syllabus' : 'View Full Syllabus' }}</span>
            <span class="toggle-arrow">{{ isOpen() ? '▴' : '▾' }}</span>
          </div>
        </button>

        @if (isOpen()) {
          <div class="drawer-body">
            <character-course-curriculum-accordion
              [course]="c"
              [progress]="progress()"
              (itemClicked)="itemClicked.emit($event)"
            ></character-course-curriculum-accordion>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .curriculum-drawer-container {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(59, 130, 246, 0.2);
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
        background: rgba(59, 130, 246, 0.08);
      }

      .toggle-title {
        display: flex;
        align-items: center;
        gap: 10px;

        .drawer-icon {
          font-size: 1.1rem;
        }

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
        color: #60a5fa;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    .drawer-body {
      padding: 0 16px 16px 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCurriculumDrawerComponent {
  readonly course = input<Course | null>(null);
  readonly progress = input<UserCourseProgress | null>(null);

  readonly itemClicked = output<{
    item: CourseItem;
    module: CourseModule;
  }>();

  readonly isOpen = signal<boolean>(false);

  readonly totalItemCount = computed<number>(() => {
    const c = this.course();
    if (!c) return 0;
    return c.modules.reduce((acc, m) => acc + m.items.length, 0);
  });

  readonly completedItemCount = computed<number>(() => {
    const p = this.progress();
    return p?.completedItemIds.length || 0;
  });
}
