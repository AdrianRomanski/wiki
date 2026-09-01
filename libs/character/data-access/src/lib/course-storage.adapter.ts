import { Course, UserCourseProgress } from '@wiki/character-domain-models';

const COURSES_STORAGE_KEY = 'life_forge_courses_v2';
const USER_COURSE_PROGRESS_STORAGE_KEY = 'life_forge_course_progress_v2';

export const INITIAL_COURSES: Course[] = [];

export interface CourseRepositoryPort {
  loadCourses(): Course[];
  saveCourses(courses: Course[]): void;
  loadUserCourseProgress(): Record<string, UserCourseProgress>;
  saveUserCourseProgress(progressMap: Record<string, UserCourseProgress>): void;
}

export class CourseStorageAdapter implements CourseRepositoryPort {
  loadCourses(): Course[] {
    if (typeof localStorage === 'undefined') {
      return INITIAL_COURSES;
    }
    try {
      const raw = localStorage.getItem(COURSES_STORAGE_KEY);
      if (!raw) {
        return INITIAL_COURSES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_COURSES;
    }
  }

  saveCourses(courses: Course[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch (err) {
      console.warn('Failed to save courses to LocalStorage:', err);
    }
  }

  loadUserCourseProgress(): Record<string, UserCourseProgress> {
    if (typeof localStorage === 'undefined') {
      return {};
    }
    try {
      const raw = localStorage.getItem(USER_COURSE_PROGRESS_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  saveUserCourseProgress(progressMap: Record<string, UserCourseProgress>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(USER_COURSE_PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
    } catch (err) {
      console.warn('Failed to save user course progress to LocalStorage:', err);
    }
  }
}
