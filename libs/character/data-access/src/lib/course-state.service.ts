import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  calculateCourseProgressStats,
  Course,
  CourseDailyQuestEvaluation,
  CourseItem,
  CourseItemCompletionEvaluation,
  CourseModule,
  evaluateCourseDailyQuest,
  evaluateCourseItemCompletion,
  getNextUncompletedItem,
  UserCourseProgress,
} from '@wiki/character-domain-models';
import { AuthStateService } from './auth-state.service';
import { CharacterStateService } from './character-state.service';
import { CourseStorageAdapter } from './course-storage.adapter';
import { FirestoreCharacterAdapter } from './firestore-character.adapter';

@Injectable({
  providedIn: 'root',
})
export class CourseStateService {
  private readonly storageAdapter = new CourseStorageAdapter();
  private readonly characterState: CharacterStateService;
  private readonly firestoreAdapter?: FirestoreCharacterAdapter;
  private readonly authStateService?: AuthStateService;

  readonly courses = signal<Course[]>(this.storageAdapter.loadCourses());
  readonly userProgressMap = signal<Record<string, UserCourseProgress>>(
    this.storageAdapter.loadUserCourseProgress()
  );
  readonly selectedCourseId = signal<string | null>(
    this.courses().length > 0 ? this.courses()[0].id : null
  );

  constructor(
    customCharacterState?: CharacterStateService,
    customFirestoreAdapter?: FirestoreCharacterAdapter,
    customAuthState?: AuthStateService
  ) {
    if (customCharacterState) {
      this.characterState = customCharacterState;
    } else {
      try {
        this.characterState = inject(CharacterStateService);
      } catch {
        this.characterState = new CharacterStateService();
      }
    }

    if (customFirestoreAdapter !== undefined) {
      this.firestoreAdapter = customFirestoreAdapter;
    } else {
      try {
        this.firestoreAdapter = inject(FirestoreCharacterAdapter, { optional: true }) || undefined;
      } catch {
        this.firestoreAdapter = undefined;
      }
    }

    if (customAuthState !== undefined) {
      this.authStateService = customAuthState;
    } else {
      try {
        this.authStateService = inject(AuthStateService, { optional: true }) || undefined;
      } catch {
        this.authStateService = undefined;
      }
    }

    this.loadFromFirestore();

    if (this.authStateService) {
      try {
        effect(() => {
          const user = this.authStateService?.user();
          if (user?.uid) {
            this.loadFromFirestore(user.uid);
          }
        });
      } catch { /* empty */ }
    }
  }

  async loadFromFirestore(userId?: string): Promise<void> {
    if (!this.firestoreAdapter) return;
    try {
      const cloudCourses = await this.firestoreAdapter.loadCourses(userId);
      if (cloudCourses && cloudCourses.length > 0) {
        this.courses.set(cloudCourses);
        this.storageAdapter.saveCourses(cloudCourses);
        if (!this.selectedCourseId() || !cloudCourses.some((c) => c.id === this.selectedCourseId())) {
          this.selectedCourseId.set(cloudCourses[0].id);
        }
      }
    } catch (err) {
      console.warn('Firestore course sync load note:', err);
    }
  }

  readonly activeCourse = computed<Course | null>(() => {
    const id = this.selectedCourseId();
    if (!id) return this.courses()[0] || null;
    return this.courses().find((c) => c.id === id) || this.courses()[0] || null;
  });

  readonly activeCourseProgress = computed<UserCourseProgress>(() => {
    const course = this.activeCourse();
    if (!course) {
      return {
        userId: 'anonymous',
        courseId: '',
        status: 'not_started',
        completedItemIds: [],
        itemProgress: {},
        totalXpEarned: 0,
      };
    }

    const progress = this.userProgressMap()[course.id];
    if (progress) {
      return progress;
    }

    return {
      userId: 'anonymous',
      courseId: course.id,
      status: 'not_started',
      completedItemIds: [],
      itemProgress: {},
      totalXpEarned: 0,
    };
  });

  readonly nextUpItem = computed<{ item: CourseItem; module: CourseModule } | null>(() => {
    const course = this.activeCourse();
    const progress = this.activeCourseProgress();
    if (!course) return null;
    return getNextUncompletedItem(course, progress);
  });

  readonly activeCourseStats = computed(() => {
    const course = this.activeCourse();
    const progress = this.activeCourseProgress();
    if (!course) {
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
    return calculateCourseProgressStats(course, progress);
  });

  readonly dailyQuestEvaluation = computed<CourseDailyQuestEvaluation>(() => {
    const progress = this.activeCourseProgress();
    return evaluateCourseDailyQuest(progress);
  });

  readonly isDailyQuestDoneToday = computed<boolean>(() => {
    return this.dailyQuestEvaluation().completedToday;
  });

  selectCourse(courseId: string): void {
    if (this.courses().some((c) => c.id === courseId)) {
      this.selectedCourseId.set(courseId);
    }
  }

  addOrImportCourse(courseData: Partial<Course> & { title: string; modules: CourseModule[] }): Course {
    const now = new Date().toISOString();
    const courseId =
      courseData.id || `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const normalizedModules = courseData.modules.map((mod, modIdx) => {
      const moduleId = mod.id || `mod-${courseId}-${modIdx + 1}`;
      const normalizedItems = mod.items.map((item, itemIdx) => ({
        ...item,
        id: item.id || `item-${moduleId}-${itemIdx + 1}`,
        moduleId,
        order: item.order || itemIdx + 1,
      }));

      return {
        ...mod,
        id: moduleId,
        courseId,
        order: mod.order || modIdx + 1,
        items: normalizedItems,
      };
    });

    let totalVideos = 0;
    let totalExercises = 0;
    let estimatedMinutes = 0;

    for (const mod of normalizedModules) {
      for (const item of mod.items) {
        if (item.type === 'video') {
          totalVideos++;
          estimatedMinutes += item.durationMinutes || 20;
        } else {
          totalExercises++;
          estimatedMinutes += item.durationMinutes || 45;
        }
      }
    }

    const newCourse: Course = {
      id: courseId,
      title: courseData.title.trim(),
      instructor: courseData.instructor?.trim() || 'Expert Instructor',
      platform: courseData.platform?.trim() || 'Online Learning Platform',
      sourceUrl: courseData.sourceUrl?.trim() || 'https://example.com/course',
      totalVideos,
      totalExercises,
      estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10,
      modules: normalizedModules,
      createdAt: courseData.createdAt || now,
      updatedAt: now,
    };

    const updatedCourses = [newCourse, ...this.courses().filter((c) => c.id !== newCourse.id)];
    this.courses.set(updatedCourses);
    this.storageAdapter.saveCourses(updatedCourses);
    this.selectedCourseId.set(newCourse.id);

    if (this.firestoreAdapter) {
      this.firestoreAdapter.saveCourse(newCourse).catch((err) => {
        console.warn('Failed to save imported course to Firestore:', err);
      });
    }

    return newCourse;
  }

  completeItem(
    courseId: string,
    itemId: string,
    notes?: string
  ): CourseItemCompletionEvaluation {
    const course = this.courses().find((c) => c.id === courseId);
    if (!course) {
      return {
        canClaim: false,
        message: `Course with ID "${courseId}" could not be found.`,
        isModuleCompleted: false,
        isCourseCompleted: false,
        isDailyQuestTriggered: false,
        rewards: [],
      };
    }

    const currentProgress =
      this.userProgressMap()[courseId] || {
        userId: 'anonymous',
        courseId,
        status: 'not_started',
        completedItemIds: [],
        itemProgress: {},
        totalXpEarned: 0,
      };

    const evaluation = evaluateCourseItemCompletion(course, currentProgress, itemId, notes);

    if (evaluation.canClaim && evaluation.updatedProgress) {
      const updatedMap = {
        ...this.userProgressMap(),
        [courseId]: evaluation.updatedProgress,
      };

      this.userProgressMap.set(updatedMap);
      this.storageAdapter.saveUserCourseProgress(updatedMap);

      for (const reward of evaluation.rewards) {
        this.characterState.awardXp(reward, 'COURSE_PROGRESSION', courseId);
      }
    }

    return evaluation;
  }

  resetCourseProgress(courseId: string): void {
    const updatedMap = { ...this.userProgressMap() };
    delete updatedMap[courseId];
    this.userProgressMap.set(updatedMap);
    this.storageAdapter.saveUserCourseProgress(updatedMap);
  }
}
