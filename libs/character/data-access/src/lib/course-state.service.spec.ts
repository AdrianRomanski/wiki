import { Course } from '@wiki/character-domain-models';
import { CharacterStateService } from './character-state.service';
import { CourseStateService } from './course-state.service';

describe('CourseStateService', () => {
  let service: CourseStateService;
  let characterState: CharacterStateService;

  const mockCourseData: Partial<Course> & { title: string; modules: Course['modules'] } = {
    id: 'test-course-1',
    title: 'Modern Architecture',
    instructor: 'Alex Mercer',
    platform: 'Custom Sandbox',
    modules: [
      {
        id: 'm1',
        courseId: 'test-course-1',
        title: 'Module 1: Foundations',
        order: 1,
        items: [
          {
            id: 'i1',
            moduleId: 'm1',
            title: 'Foundations Lesson',
            type: 'video',
            order: 1,
            durationMinutes: 20,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    characterState = new CharacterStateService();
    service = new CourseStateService(characterState);
  });

  it('should initialize with empty courses if none exist in storage', () => {
    expect(service.courses().length).toBe(0);
    expect(service.activeCourse()).toBeNull();
    expect(service.activeCourseProgress().status).toBe('not_started');
    expect(service.nextUpItem()).toBeNull();
    expect(service.isDailyQuestDoneToday()).toBe(false);
  });

  it('should complete an item, update progress signals, and award XP to character state', () => {
    const course = service.addOrImportCourse(mockCourseData);
    expect(service.activeCourse()).toBeDefined();

    const firstItem = course.modules[0].items[0];
    const initialCharXp = characterState.character().totalXpEarned;

    const result = service.completeItem(course.id, firstItem.id, 'Great signal lecture');
    expect(result.canClaim).toBe(true);

    const progress = service.activeCourseProgress();
    expect(progress.completedItemIds).toContain(firstItem.id);
    expect(progress.status).toBe('completed');
    expect(service.isDailyQuestDoneToday()).toBe(true);

    const newCharXp = characterState.character().totalXpEarned;
    expect(newCharXp).toBeGreaterThan(initialCharXp);

    const lastXpEvent = characterState.xpEvents()[0];
    expect(lastXpEvent.sourceType).toBe('COURSE_PROGRESSION');
  });

  it('should allow importing and switching to a new course', () => {
    const imported = service.addOrImportCourse(mockCourseData);
    expect(service.selectedCourseId()).toBe(imported.id);
    expect(service.activeCourse()?.title).toBe('Modern Architecture');
    expect(service.nextUpItem()?.item.title).toBe('Foundations Lesson');
  });

  it('should reset course progress correctly', () => {
    const course = service.addOrImportCourse(mockCourseData);
    service.completeItem(course.id, course.modules[0].items[0].id);
    expect(service.activeCourseProgress().completedItemIds.length).toBe(1);

    service.resetCourseProgress(course.id);
    expect(service.activeCourseProgress().completedItemIds.length).toBe(0);
    expect(service.activeCourseProgress().status).toBe('not_started');
  });
});
