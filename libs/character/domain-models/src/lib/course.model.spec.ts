import {
  calculateCourseProgressStats,
  Course,
  evaluateCourseDailyQuest,
  evaluateCourseItemCompletion,
  getNextUncompletedItem,
  isModuleCompleted,
  UserCourseProgress,
} from './course.model';

describe('Course Domain Models & Progression Evaluator', () => {
  const mockCourse: Course = {
    id: 'course-angular-mastery',
    title: 'Advanced Angular & State Architecture',
    instructor: 'Alex Mercer',
    platform: 'Frontend Masters',
    sourceUrl: 'https://frontendmasters.com/courses/advanced-angular',
    totalVideos: 2,
    totalExercises: 2,
    estimatedHours: 4.5,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
    modules: [
      {
        id: 'mod-1',
        courseId: 'course-angular-mastery',
        title: 'Module 1: Signals & Reactive Foundations',
        order: 1,
        items: [
          {
            id: 'item-1',
            moduleId: 'mod-1',
            title: 'Deep Dive into Signal Internals',
            type: 'video',
            order: 1,
            durationMinutes: 25,
          },
          {
            id: 'item-2',
            moduleId: 'mod-1',
            title: 'Lab 1: Custom Signal Store Implementation',
            type: 'exercise',
            order: 2,
            durationMinutes: 45,
          },
        ],
      },
      {
        id: 'mod-2',
        courseId: 'course-angular-mastery',
        title: 'Module 2: Zoneless & Performance Architecture',
        order: 2,
        items: [
          {
            id: 'item-3',
            moduleId: 'mod-2',
            title: 'Zoneless Change Detection in Practice',
            type: 'video',
            order: 1,
            durationMinutes: 30,
          },
          {
            id: 'item-4',
            moduleId: 'mod-2',
            title: 'Lab 2: Migrating Legacy Apps to Zoneless',
            type: 'exercise',
            order: 2,
            durationMinutes: 50,
          },
        ],
      },
    ],
  };

  const initialProgress: UserCourseProgress = {
    userId: 'user-123',
    courseId: 'course-angular-mastery',
    status: 'not_started',
    completedItemIds: [],
    itemProgress: {},
    totalXpEarned: 0,
  };

  it('should correctly evaluate video lecture completion with INT and WIS rewards', () => {
    const fixedDate = new Date('2026-08-30T10:00:00.000Z');
    const result = evaluateCourseItemCompletion(
      mockCourse,
      initialProgress,
      'item-1',
      'Understood equality check signals',
      fixedDate
    );

    expect(result.canClaim).toBe(true);
    expect(result.item?.id).toBe('item-1');
    expect(result.isDailyQuestTriggered).toBe(true);
    expect(result.isModuleCompleted).toBe(false);
    expect(result.isCourseCompleted).toBe(false);

    const intRewards = result.rewards.filter((r) => r.statCategory === 'intelligence');
    const wisRewards = result.rewards.filter((r) => r.statCategory === 'wisdom');
    const disRewards = result.rewards.filter((r) => r.statCategory === 'discipline');

    const totalInt = intRewards.reduce((sum, r) => sum + r.amount, 0);
    const totalWis = wisRewards.reduce((sum, r) => sum + r.amount, 0);
    const totalDis = disRewards.reduce((sum, r) => sum + r.amount, 0);

    expect(totalInt).toBe(35);
    expect(totalWis).toBe(5);
    expect(totalDis).toBe(10);

    expect(result.updatedProgress?.completedItemIds).toEqual(['item-1']);
    expect(result.updatedProgress?.status).toBe('in_progress');
    expect(result.updatedProgress?.totalXpEarned).toBe(50);
  });

  it('should correctly evaluate exercise completion with INT and DIS rewards', () => {
    const fixedDate = new Date('2026-08-30T14:00:00.000Z');
    const progressWithItem1: UserCourseProgress = {
      ...initialProgress,
      status: 'in_progress',
      completedItemIds: ['item-1'],
      itemProgress: {
        'item-1': {
          itemId: 'item-1',
          completed: true,
          completedAt: '2026-08-29T10:00:00.000Z',
          xpAwarded: 50,
        },
      },
      totalXpEarned: 50,
    };

    const result = evaluateCourseItemCompletion(
      mockCourse,
      progressWithItem1,
      'item-2',
      'Built reactive custom signal store',
      fixedDate
    );

    expect(result.canClaim).toBe(true);
    expect(result.item?.id).toBe('item-2');
    expect(result.isModuleCompleted).toBe(true);
    expect(result.isDailyQuestTriggered).toBe(true);

    const totalXp = result.rewards.reduce((sum, r) => sum + r.amount, 0);
    expect(totalXp).toBe(170);
  });

  it('should award graduation bonus when 100% of course items are completed', () => {
    const fixedDate = new Date('2026-08-30T16:00:00.000Z');
    const almostDoneProgress: UserCourseProgress = {
      ...initialProgress,
      status: 'in_progress',
      completedItemIds: ['item-1', 'item-2', 'item-3'],
      itemProgress: {
        'item-1': { itemId: 'item-1', completed: true, completedAt: '2026-08-29T10:00:00.000Z', xpAwarded: 50 },
        'item-2': { itemId: 'item-2', completed: true, completedAt: '2026-08-29T11:00:00.000Z', xpAwarded: 170 },
        'item-3': { itemId: 'item-3', completed: true, completedAt: '2026-08-30T10:00:00.000Z', xpAwarded: 50 },
      },
      totalXpEarned: 270,
    };

    const result = evaluateCourseItemCompletion(
      mockCourse,
      almostDoneProgress,
      'item-4',
      'Full zoneless migration finished with tests',
      fixedDate
    );

    expect(result.canClaim).toBe(true);
    expect(result.isModuleCompleted).toBe(true);
    expect(result.isCourseCompleted).toBe(true);
    expect(result.isDailyQuestTriggered).toBe(false);
    expect(result.updatedProgress?.status).toBe('completed');

    const totalXp = result.rewards.reduce((sum, r) => sum + r.amount, 0);
    expect(totalXp).toBe(650);
  });

  it('should reject already completed items', () => {
    const progressWithItem1: UserCourseProgress = {
      ...initialProgress,
      completedItemIds: ['item-1'],
      itemProgress: {
        'item-1': { itemId: 'item-1', completed: true, completedAt: '2026-08-29T10:00:00.000Z', xpAwarded: 50 },
      },
    };

    const result = evaluateCourseItemCompletion(mockCourse, progressWithItem1, 'item-1');
    expect(result.canClaim).toBe(false);
    expect(result.message).toContain('already marked as completed');
  });

  it('should find next uncompleted item correctly', () => {
    const next1 = getNextUncompletedItem(mockCourse, initialProgress);
    expect(next1?.item.id).toBe('item-1');

    const next2 = getNextUncompletedItem(mockCourse, {
      ...initialProgress,
      completedItemIds: ['item-1', 'item-2'],
    });
    expect(next2?.item.id).toBe('item-3');

    const nextAllDone = getNextUncompletedItem(mockCourse, {
      ...initialProgress,
      completedItemIds: ['item-1', 'item-2', 'item-3', 'item-4'],
    });
    expect(nextAllDone).toBeNull();
  });

  it('should calculate course progress statistics accurately', () => {
    const stats0 = calculateCourseProgressStats(mockCourse, initialProgress);
    expect(stats0.totalItems).toBe(4);
    expect(stats0.completedItems).toBe(0);
    expect(stats0.percentComplete).toBe(0);
    expect(stats0.totalVideos).toBe(2);
    expect(stats0.totalExercises).toBe(2);

    const stats50 = calculateCourseProgressStats(mockCourse, {
      ...initialProgress,
      completedItemIds: ['item-1', 'item-2'],
    });
    expect(stats50.completedItems).toBe(2);
    expect(stats50.percentComplete).toBe(50);
    expect(stats50.completedVideos).toBe(1);
    expect(stats50.completedExercises).toBe(1);
  });

  it('should evaluate daily quest status', () => {
    const emptyEvaluation = evaluateCourseDailyQuest(initialProgress, '2026-08-30');
    expect(emptyEvaluation.completedToday).toBe(false);
    expect(emptyEvaluation.itemsCompletedToday).toBe(0);

    const activeProgress: UserCourseProgress = {
      ...initialProgress,
      itemProgress: {
        'item-1': { itemId: 'item-1', completed: true, completedAt: '2026-08-30T09:15:00.000Z', xpAwarded: 50 },
      },
    };
    const activeEvaluation = evaluateCourseDailyQuest(activeProgress, '2026-08-30');
    expect(activeEvaluation.completedToday).toBe(true);
    expect(activeEvaluation.itemsCompletedToday).toBe(1);
  });
});
