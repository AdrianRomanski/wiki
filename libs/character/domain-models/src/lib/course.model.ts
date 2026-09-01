import { XpReward } from './character.model';
import { StatType } from './xp-event.model';

export type CourseItemType = 'video' | 'exercise';

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'archived';

export interface CourseItemStatReward {
  statType: StatType;
  xp: number;
}

export interface CourseItem {
  id: string;
  moduleId: string;
  title: string;
  type: CourseItemType;
  order: number;
  durationMinutes?: number;
  sourceUrl?: string;
  transcriptText?: string;
  exercisePrompt?: string;
  starterRepoUrl?: string;
  solutionUrl?: string;
  statRewards?: CourseItemStatReward[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  items: CourseItem[];
}

export interface Course {
  id: string;
  title: string;
  instructor?: string;
  platform: string;
  sourceUrl: string;
  totalVideos: number;
  totalExercises: number;
  estimatedHours: number;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseItemProgress {
  itemId: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  xpAwarded: number;
}

export interface UserCourseProgress {
  userId: string;
  courseId: string;
  status: CourseStatus;
  startedAt?: string;
  completedAt?: string;
  lastStudiedAt?: string;
  completedItemIds: string[];
  itemProgress: Record<string, CourseItemProgress>;
  currentModuleId?: string;
  currentItemId?: string;
  totalXpEarned: number;
}

export interface CourseItemCompletionEvaluation {
  canClaim: boolean;
  message: string;
  item?: CourseItem;
  module?: CourseModule;
  isModuleCompleted: boolean;
  isCourseCompleted: boolean;
  isDailyQuestTriggered: boolean;
  rewards: XpReward[];
  updatedProgress?: UserCourseProgress;
}

export interface CourseDailyQuestEvaluation {
  completedToday: boolean;
  itemsCompletedToday: number;
  canClaimBonus: boolean;
}

export const VIDEO_COMPLETION_BASE_XP = 30;
export const EXERCISE_COMPLETION_BASE_XP = 50;
export const MODULE_COMPLETION_MILESTONE_XP = 100;
export const COURSE_COMPLETION_BONUS_XP = 500;
export const DAILY_COURSE_QUEST_BONUS_XP = 20;

export function getBaseItemRewards(item: CourseItem): XpReward[] {
  if (item.statRewards && item.statRewards.length > 0) {
    return item.statRewards.map((sr) => ({
      amount: sr.xp,
      statCategory: sr.statType === 'INT' ? 'intelligence' : sr.statType === 'WIS' ? 'wisdom' : 'discipline',
      sourceDescription: `Course Item: ${item.title} (${sr.statType})`,
    }));
  }

  if (item.type === 'video') {
    return [
      {
        amount: 25,
        statCategory: 'intelligence',
        sourceDescription: `Watched Lecture: "${item.title}"`,
      },
      {
        amount: 5,
        statCategory: 'wisdom',
        sourceDescription: `Conceptual Insight: "${item.title}"`,
      },
    ];
  }

  return [
    {
      amount: 35,
      statCategory: 'intelligence',
      sourceDescription: `Solved Practical Exercise: "${item.title}"`,
    },
    {
      amount: 15,
      statCategory: 'discipline',
      sourceDescription: `Applied Practice & Focus: "${item.title}"`,
    },
  ];
}

export function getAllCourseItems(course: Course): CourseItem[] {
  const items: CourseItem[] = [];
  for (const module of course.modules) {
    for (const item of module.items) {
      items.push(item);
    }
  }
  return items;
}

export function getNextUncompletedItem(
  course: Course,
  progress: UserCourseProgress
): { item: CourseItem; module: CourseModule } | null {
  for (const module of course.modules) {
    for (const item of module.items) {
      if (!progress.completedItemIds.includes(item.id)) {
        return { item, module };
      }
    }
  }
  return null;
}

export function isModuleCompleted(
  module: CourseModule,
  completedItemIds: string[]
): boolean {
  if (!module.items.length) return false;
  return module.items.every((item) => completedItemIds.includes(item.id));
}

export function evaluateCourseDailyQuest(
  progress: UserCourseProgress,
  todayDate: string = new Date().toISOString().split('T')[0]
): CourseDailyQuestEvaluation {
  const itemsToday = Object.values(progress.itemProgress).filter(
    (ip) => ip.completed && ip.completedAt && ip.completedAt.startsWith(todayDate)
  );

  return {
    completedToday: itemsToday.length > 0,
    itemsCompletedToday: itemsToday.length,
    canClaimBonus: itemsToday.length === 1,
  };
}

export function calculateCourseProgressStats(
  course: Course,
  progress?: UserCourseProgress
): {
  totalItems: number;
  completedItems: number;
  percentComplete: number;
  totalVideos: number;
  completedVideos: number;
  totalExercises: number;
  completedExercises: number;
} {
  const allItems = getAllCourseItems(course);
  const completedIds = progress?.completedItemIds ?? [];
  const completedSet = new Set(completedIds);

  const totalVideos = allItems.filter((i) => i.type === 'video').length;
  const completedVideos = allItems.filter((i) => i.type === 'video' && completedSet.has(i.id)).length;
  const totalExercises = allItems.filter((i) => i.type === 'exercise').length;
  const completedExercises = allItems.filter((i) => i.type === 'exercise' && completedSet.has(i.id)).length;

  const totalItems = allItems.length;
  const completedItems = completedSet.size;
  const percentComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    totalItems,
    completedItems,
    percentComplete,
    totalVideos,
    completedVideos,
    totalExercises,
    completedExercises,
  };
}

export function evaluateCourseItemCompletion(
  course: Course,
  currentProgress: UserCourseProgress,
  itemId: string,
  notes?: string,
  now: Date = new Date()
): CourseItemCompletionEvaluation {
  const targetItem = getAllCourseItems(course).find((i) => i.id === itemId);
  if (!targetItem) {
    return {
      canClaim: false,
      message: `Course item with ID "${itemId}" not found in course "${course.title}".`,
      isModuleCompleted: false,
      isCourseCompleted: false,
      isDailyQuestTriggered: false,
      rewards: [],
    };
  }

  const targetModule = course.modules.find((m) => m.id === targetItem.moduleId);
  if (!targetModule) {
    return {
      canClaim: false,
      message: `Parent module for item "${targetItem.title}" not found.`,
      isModuleCompleted: false,
      isCourseCompleted: false,
      isDailyQuestTriggered: false,
      rewards: [],
    };
  }

  if (currentProgress.completedItemIds.includes(itemId)) {
    return {
      canClaim: false,
      message: `Item "${targetItem.title}" is already marked as completed.`,
      item: targetItem,
      module: targetModule,
      isModuleCompleted: false,
      isCourseCompleted: false,
      isDailyQuestTriggered: false,
      rewards: [],
    };
  }

  const timestamp = now.toISOString();
  const todayDate = timestamp.split('T')[0];
  const newCompletedIds = [...currentProgress.completedItemIds, itemId];
  const rewards: XpReward[] = [...getBaseItemRewards(targetItem)];

  const itemsCompletedTodayCount = Object.values(currentProgress.itemProgress).filter(
    (ip) => ip.completed && ip.completedAt && ip.completedAt.startsWith(todayDate)
  ).length;

  const isDailyQuestTriggered = itemsCompletedTodayCount === 0;
  if (isDailyQuestTriggered) {
    rewards.push(
      {
        amount: 10,
        statCategory: 'discipline',
        sourceDescription: `Daily Course Study Quest: First action today on "${course.title}"`,
      },
      {
        amount: 10,
        statCategory: 'intelligence',
        sourceDescription: `Daily Course Study Quest: Intelligence streak bonus`,
      }
    );
  }

  const wasModuleCompletedBefore = isModuleCompleted(targetModule, currentProgress.completedItemIds);
  const isModuleCompletedNow = isModuleCompleted(targetModule, newCompletedIds);
  const triggerModuleMilestone = !wasModuleCompletedBefore && isModuleCompletedNow;

  if (triggerModuleMilestone) {
    rewards.push(
      {
        amount: 70,
        statCategory: 'intelligence',
        sourceDescription: `🏆 Module Mastered: "${targetModule.title}" in "${course.title}"`,
      },
      {
        amount: 30,
        statCategory: 'discipline',
        sourceDescription: `🏆 Module Milestone Discipline Bonus: "${targetModule.title}"`,
      }
    );
  }

  const allItems = getAllCourseItems(course);
  const isCourseCompleted = allItems.length > 0 && allItems.every((item) => newCompletedIds.includes(item.id));

  if (isCourseCompleted && currentProgress.status !== 'completed') {
    rewards.push(
      {
        amount: 300,
        statCategory: 'intelligence',
        sourceDescription: `🎓 Full Course Graduation: "${course.title}" (100% Curriculum Mastered)`,
      },
      {
        amount: 100,
        statCategory: 'wisdom',
        sourceDescription: `🎓 Course Comprehensive Wisdom Bonus: "${course.title}"`,
      },
      {
        amount: 100,
        statCategory: 'discipline',
        sourceDescription: `🎓 Course Completion Iron Discipline: "${course.title}"`,
      }
    );
  }

  const totalItemXp = rewards.reduce((acc, r) => acc + r.amount, 0);

  const updatedItemProgress: CourseItemProgress = {
    itemId,
    completed: true,
    completedAt: timestamp,
    notes: notes?.trim() || undefined,
    xpAwarded: totalItemXp,
  };

  const nextUncompleted = getNextUncompletedItem(course, {
    ...currentProgress,
    completedItemIds: newCompletedIds,
  });

  const updatedProgress: UserCourseProgress = {
    ...currentProgress,
    status: isCourseCompleted ? 'completed' : 'in_progress',
    startedAt: currentProgress.startedAt || timestamp,
    completedAt: isCourseCompleted ? timestamp : currentProgress.completedAt,
    lastStudiedAt: timestamp,
    completedItemIds: newCompletedIds,
    itemProgress: {
      ...currentProgress.itemProgress,
      [itemId]: updatedItemProgress,
    },
    currentModuleId: nextUncompleted ? nextUncompleted.module.id : targetModule.id,
    currentItemId: nextUncompleted ? nextUncompleted.item.id : targetItem.id,
    totalXpEarned: currentProgress.totalXpEarned + totalItemXp,
  };

  let message = `✅ Completed "${targetItem.title}" (+${totalItemXp} XP)!`;
  if (triggerModuleMilestone) {
    message += ` 🎉 Module "${targetModule.title}" fully mastered!`;
  }
  if (isCourseCompleted) {
    message += ` 🏆 Course "${course.title}" 100% finished!`;
  }

  return {
    canClaim: true,
    message,
    item: targetItem,
    module: targetModule,
    isModuleCompleted: isModuleCompletedNow,
    isCourseCompleted,
    isDailyQuestTriggered,
    rewards,
    updatedProgress,
  };
}
