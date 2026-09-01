import '@angular/compiler';
import { createEnvironmentInjector, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { CharacterDashboardComponent } from './character-dashboard.component';

describe('CharacterDashboardComponent (ADR-0008 & ADR-0010)', () => {
  it('should instantiate dashboard component within injection context', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const component = new CharacterDashboardComponent();
      expect(component).toBeTruthy();
      expect(component.authState).toBeDefined();
      expect(component.characterState).toBeDefined();
      expect(component.bookState).toBeDefined();
      expect(component.courseState).toBeDefined();
    });
  });

  it('should handle course item checkin modal opening and completion submission', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const component = new CharacterDashboardComponent();

      // Ingest course first
      component.importScrapedCourse({
        id: 'course-ts-101',
        title: 'TypeScript Mastery',
        platform: 'Frontend Masters',
        sourceUrl: 'https://frontendmasters.com/ts',
        totalVideos: 1,
        totalExercises: 0,
        estimatedHours: 1,
        createdAt: '2026-08-30T00:00:00.000Z',
        updatedAt: '2026-08-30T00:00:00.000Z',
        modules: [
          {
            id: 'm1',
            courseId: 'course-ts-101',
            title: 'Generics',
            order: 1,
            items: [
              {
                id: 'i1',
                moduleId: 'm1',
                title: 'Conditional Types',
                type: 'video',
                order: 1,
              },
            ],
          },
        ],
      });

      const course = component.courseState.activeCourse();
      expect(course).toBeDefined();
      if (!course) return;

      const item = course.modules[0].items[0];
      const module = course.modules[0];

      component.openCourseCheckin({ courseId: course.id, item, module });
      expect(component.isCourseCheckinModalOpen()).toBe(true);
      expect(component.selectedCheckinItem()?.id).toBe(item.id);

      component.submitCourseItemCheckin({ itemId: item.id, notes: 'Mastered conditional types' });
      expect(component.isCourseCheckinModalOpen()).toBe(false);
      expect(component.courseFeedbackMessage()).toBeTruthy();
      expect(component.courseState.activeCourseProgress().completedItemIds).toContain(item.id);
    });
  });

  it('should handle course ingestion modal and import course data', () => {
    const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
    runInInjectionContext(injector, () => {
      const component = new CharacterDashboardComponent();
      component.openCourseImportModal();
      expect(component.isCourseImportModalOpen()).toBe(true);

      component.importScrapedCourse({
        id: 'course-rust-101',
        title: 'Rust System Programming',
        platform: 'Udemy',
        sourceUrl: 'https://udemy.com/rust',
        totalVideos: 1,
        totalExercises: 0,
        estimatedHours: 1,
        createdAt: '2026-08-30T00:00:00.000Z',
        updatedAt: '2026-08-30T00:00:00.000Z',
        modules: [
          {
            id: 'm1',
            courseId: 'course-rust-101',
            title: 'Borrowing',
            order: 1,
            items: [
              {
                id: 'i1',
                moduleId: 'm1',
                title: 'Lifetimes',
                type: 'video',
                order: 1,
              },
            ],
          },
        ],
      });

      expect(component.isCourseImportModalOpen()).toBe(false);
      expect(component.courseState.activeCourse()?.title).toBe('Rust System Programming');
    });
  });
});
