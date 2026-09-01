import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AuthStateService,
  BookStateService,
  CharacterStateService,
  CourseStateService,
} from '@wiki/character-data-access';
import {
  Book,
  Course,
  CourseItem,
  CourseModule,
  EARLY_WAKEUP_SLOTS,
  EarlyWakeupEvaluation,
  evaluateEarlyWakeupQuest,
} from '@wiki/character-domain-models';
import { AuthCardComponent } from '@wiki/character-ui-auth';
import { CharacterSheetComponent } from '@wiki/character-ui-sheet';
import { CourseCurriculumAccordionComponent } from './components/course-curriculum-accordion.component';
import { CourseImportModalComponent } from './components/course-import-modal.component';
import { CourseItemCheckinModalComponent } from './components/course-item-checkin-modal.component';
import { CourseQuestCardComponent } from './components/course-quest-card.component';

@Component({
  selector: 'character-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CharacterSheetComponent,
    AuthCardComponent,
    CourseQuestCardComponent,
    CourseCurriculumAccordionComponent,
    CourseItemCheckinModalComponent,
    CourseImportModalComponent,
  ],
  templateUrl: './character-dashboard.component.html',
  styleUrls: ['./character-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterDashboardComponent {
  readonly authState = inject(AuthStateService, { optional: true }) || new AuthStateService();
  readonly characterState = inject(CharacterStateService, { optional: true }) || new CharacterStateService();
  readonly bookState = inject(BookStateService, { optional: true }) || new BookStateService();
  readonly courseState = inject(CourseStateService, { optional: true }) || new CourseStateService();

  readonly timeSlots = Object.values(EARLY_WAKEUP_SLOTS);
  readonly claimedToday = signal<boolean>(false);
  readonly claimMessage = signal<string | null>(null);
  readonly simulatedHour = signal<number | null>(null);
  readonly simulatedMinute = signal<number | null>(null);

  readonly isAddBookModalOpen = signal<boolean>(false);
  readonly isLogQuestModalOpen = signal<boolean>(false);
  readonly selectedBookIdForQuest = signal<string | null>(null);

  readonly newBookTitle = signal<string>('');
  readonly newBookAuthor = signal<string>('');
  readonly newBookTotalPages = signal<number | null>(null);
  readonly newBookInitialPage = signal<number>(0);
  readonly newBookNotes = signal<string>('');

  readonly questFinishedPage = signal<number | null>(null);
  readonly readingQuestFeedback = signal<string | null>(null);

  // Course progression modal signals
  readonly isCourseCheckinModalOpen = signal<boolean>(false);
  readonly selectedCheckinItem = signal<CourseItem | null>(null);
  readonly selectedCheckinModule = signal<CourseModule | null>(null);
  readonly isCourseImportModalOpen = signal<boolean>(false);
  readonly courseFeedbackMessage = signal<string | null>(null);

  readonly selectedMonth = signal<number>(new Date().getMonth() + 1);
  readonly selectedYear = signal<number>(new Date().getFullYear());

  readonly monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  readonly activeBookForQuest = computed<Book | undefined>(() => {
    const id = this.selectedBookIdForQuest();
    return this.bookState.books().find((b) => b.id === id) || this.bookState.currentlyReadingBooks()[0];
  });

  readonly completedBooksInSelectedMonth = computed<Book[]>(() => {
    return this.bookState.getCompletedBooksForMonth(
      this.selectedYear(),
      this.selectedMonth()
    );
  });

  readonly recentXpEvents = computed(() => this.characterState.xpEvents().slice(0, 10));
  readonly totalXpEventsCount = computed(() => this.characterState.xpEvents().length);

  readonly currentEvaluation = computed<EarlyWakeupEvaluation>(() => {
    const hour = this.simulatedHour();
    const minute = this.simulatedMinute();
    if (hour !== null && minute !== null) {
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      return evaluateEarlyWakeupQuest(d);
    }
    return evaluateEarlyWakeupQuest(new Date());
  });

  readonly formattedCurrentTime = computed<string>(() => {
    const hour = this.simulatedHour();
    const minute = this.simulatedMinute();
    if (hour !== null && minute !== null) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      return `${h}:${m} (Simulated)`;
    }
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  onLogin(): void {
    this.authState.loginWithGoogle();
  }

  onLogout(): void {
    this.authState.logout();
  }

  claimEarlyWakeUpXp(): void {
    if (this.claimedToday()) {
      this.claimMessage.set("⚠️ You have already claimed today's early wake-up quest.");
      return;
    }

    const evalResult = this.currentEvaluation();
    if (!evalResult.canClaim || evalResult.xpAmount <= 0) {
      this.claimMessage.set(`❌ Cannot claim XP: ${evalResult.message}`);
      return;
    }

    this.characterState.awardXp(
      {
        amount: evalResult.xpAmount,
        statCategory: 'discipline',
        sourceDescription: `Early Morning Waking Quest (${evalResult.slot} AM slot)`,
      },
      'EARLY_WAKE_UP_QUEST',
      evalResult.slot
    );

    this.claimedToday.set(true);
    this.claimMessage.set(
      `🎉 Success! Earned +${evalResult.xpAmount} DIS XP for waking up early (${evalResult.tierName})!`
    );
  }

  setSimulatedTime(hour: number, minute: number): void {
    this.simulatedHour.set(hour);
    this.simulatedMinute.set(minute);
    this.claimMessage.set(null);
  }

  resetSimulation(): void {
    this.simulatedHour.set(null);
    this.simulatedMinute.set(null);
    this.claimMessage.set(null);
  }

  openAddBookModal(): void {
    this.newBookTitle.set('');
    this.newBookAuthor.set('');
    this.newBookTotalPages.set(null);
    this.newBookInitialPage.set(0);
    this.newBookNotes.set('');
    this.isAddBookModalOpen.set(true);
  }

  closeAddBookModal(): void {
    this.isAddBookModalOpen.set(false);
  }

  submitAddBook(): void {
    const title = this.newBookTitle().trim();
    const author = this.newBookAuthor().trim();
    const totalPages = this.newBookTotalPages();

    if (!title || !author || !totalPages || totalPages <= 0) {
      return;
    }

    this.bookState.addBook({
      title,
      author,
      totalPages,
      initialPage: this.newBookInitialPage() || 0,
      notes: this.newBookNotes().trim(),
    });

    this.closeAddBookModal();
  }

  openLogQuestModal(bookId?: string): void {
    if (bookId) {
      this.selectedBookIdForQuest.set(bookId);
    } else {
      const activeBooks = this.bookState.currentlyReadingBooks();
      if (activeBooks.length > 0) {
        this.selectedBookIdForQuest.set(activeBooks[0].id);
      }
    }

    const currentBook = this.activeBookForQuest();
    if (currentBook) {
      this.questFinishedPage.set(currentBook.currentPage + 10);
    } else {
      this.questFinishedPage.set(null);
    }
    this.readingQuestFeedback.set(null);
    this.isLogQuestModalOpen.set(true);
  }

  closeLogQuestModal(): void {
    this.isLogQuestModalOpen.set(false);
    this.readingQuestFeedback.set(null);
  }

  submitLogQuest(): void {
    const book = this.activeBookForQuest();
    const finishedPage = this.questFinishedPage();

    if (!book || !finishedPage) {
      this.readingQuestFeedback.set('❌ Please select a book and enter a valid ending page.');
      return;
    }

    const evaluation = this.bookState.logReadingSession(book.id, finishedPage);
    this.readingQuestFeedback.set(evaluation.message);

    if (evaluation.canClaim) {
      setTimeout(() => {
        this.closeLogQuestModal();
      }, 1800);
    }
  }

  // Course progression handlers
  openCourseCheckin(event: { courseId: string; item: CourseItem; module: CourseModule }): void {
    this.selectedCheckinItem.set(event.item);
    this.selectedCheckinModule.set(event.module);
    this.isCourseCheckinModalOpen.set(true);
  }

  closeCourseCheckinModal(): void {
    this.isCourseCheckinModalOpen.set(false);
    this.selectedCheckinItem.set(null);
    this.selectedCheckinModule.set(null);
  }

  submitCourseItemCheckin(event: { itemId: string; notes: string }): void {
    const activeCourse = this.courseState.activeCourse();
    if (!activeCourse) return;

    const evaluation = this.courseState.completeItem(
      activeCourse.id,
      event.itemId,
      event.notes
    );

    this.courseFeedbackMessage.set(evaluation.message);
    this.closeCourseCheckinModal();

    setTimeout(() => {
      this.courseFeedbackMessage.set(null);
    }, 4000);
  }

  selectCourse(courseId: string): void {
    this.courseState.selectCourse(courseId);
  }

  openCourseImportModal(): void {
    this.isCourseImportModalOpen.set(true);
  }

  closeCourseImportModal(): void {
    this.isCourseImportModalOpen.set(false);
  }

  importScrapedCourse(course: Course): void {
    this.courseState.addOrImportCourse(course);
    this.closeCourseImportModal();
    this.courseFeedbackMessage.set(`🎉 Successfully ingested course "${course.title}"!`);
    setTimeout(() => {
      this.courseFeedbackMessage.set(null);
    }, 4000);
  }
}
