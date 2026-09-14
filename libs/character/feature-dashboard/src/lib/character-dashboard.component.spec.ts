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

  describe('ADR-0013: ADHD-Friendly 1-Click Habits & Progressive Disclosure', () => {
    it('should complete study quest in 1-click with zero modal dialogs', () => {
      const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
      runInInjectionContext(injector, () => {
        const component = new CharacterDashboardComponent();

        component.importScrapedCourse({
          id: 'course-algo-101',
          title: 'Algorithms & Data Structures',
          platform: 'Frontend Masters',
          sourceUrl: 'https://frontendmasters.com/algo',
          totalVideos: 1,
          totalExercises: 0,
          estimatedHours: 1,
          createdAt: '2026-08-30T00:00:00.000Z',
          updatedAt: '2026-08-30T00:00:00.000Z',
          modules: [
            {
              id: 'm1',
              courseId: 'course-algo-101',
              title: 'Graph Traversal',
              order: 1,
              items: [
                {
                  id: 'item-bfs-1',
                  moduleId: 'm1',
                  title: 'Breadth-First Search',
                  type: 'video',
                  order: 1,
                },
              ],
            },
          ],
        });

        component.onCompleteNextLesson({
          courseId: 'course-algo-101',
          itemId: 'item-bfs-1',
          notes: 'Queue-based BFS implementation',
        });

        expect(component.isCourseCheckinModalOpen()).toBe(false);
        expect(component.globalFeedbackMessage()).toBeTruthy();
        expect(component.courseState.activeCourseProgress().completedItemIds).toContain('item-bfs-1');
        expect(component.courseState.isDailyQuestDoneToday()).toBe(true);
      });
    });

    it('should complete reading quest in 1-click with inline page delta tracking', () => {
      const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
      runInInjectionContext(injector, () => {
        const component = new CharacterDashboardComponent();

        component.onAddBook({
          title: 'Site Reliability Engineering',
          author: 'Google SRE Team',
          totalPages: 450,
          initialPage: 50,
        });

        const activeBook = component.activeBookForQuest();
        expect(activeBook?.title).toBe('Site Reliability Engineering');
        expect(activeBook?.currentPage).toBe(50);

        component.onCompleteReadingQuest({
          bookId: activeBook!.id,
          pagesReadThisDay: 15,
          notes: 'Error budgets and SLOs',
        });

        expect(component.isLogQuestModalOpen()).toBe(false);
        expect(component.globalFeedbackMessage()).toBeTruthy();

        const updatedBook = component.bookState.books().find((b) => b.id === activeBook!.id);
        expect(updatedBook?.currentPage).toBe(65);
        expect(updatedBook?.notes).toBe('Error budgets and SLOs');
      });
    });

    it('should claim early morning waking quest directly in 1-click', () => {
      const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
      runInInjectionContext(injector, () => {
        const component = new CharacterDashboardComponent();

        component.setSimulatedTime(5, 15);
        expect(component.currentEvaluation().canClaim).toBe(true);
        expect(component.currentEvaluation().xpAmount).toBe(100);

        component.claimEarlyWakeUpXp();
        expect(component.claimedToday()).toBe(true);
        expect(component.claimMessage()).toContain('Earned +100 DIS XP');
      });
    });
  });

  describe('ADR-0014: Elimination of Redundant Dashboard Header and Auth Card Clutter', () => {
    it('should delegate login and logout actions from dashboard', () => {
      const injector = createEnvironmentInjector([], null as unknown as EnvironmentInjector);
      runInInjectionContext(injector, () => {
        const component = new CharacterDashboardComponent();

        let loggedOut = false;
        component.authState.logout = async () => {
          loggedOut = true;
        };

        component.onLogout();
        expect(loggedOut).toBe(true);

        let loginInitiated = false;
        component.authState.loginWithGoogle = async () => {
          loginInitiated = true;
          return true;
        };

        component.onLogin();
        expect(loginInitiated).toBe(true);
      });
    });
  });
});
