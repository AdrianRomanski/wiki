---
title: "ADR-0007: Book Reading Daily Quest, Active Reading Shelf, and Monthly Reading Archive"
type: adr
status: accepted
date: 2026-08-26
tags: [architecture, gamification, daily-quests, reading-log, wisdom-xp, discipline-xp, clean-architecture]
---

# ADR-0007: Book Reading Daily Quest, Active Reading Shelf, and Monthly Reading Archive

## Status

**Accepted**

---

## Context & Problem Statement

Following [ADR-0006](0006-action-based-xp-engine-and-early-wake-up-quests.md), all XP progression in the **Life Gamification Platform** must be strictly action-based and tied to real-world discipline and active learning. Reading books is one of the most critical real-world habits for gaining Knowledge, Wisdom (WIS), and Discipline (DIS).

Users need a structured way in the application to:
1. Track books they are actively reading.
2. Add new books to their active reading shelf with progress metadata.
3. Track and update the reading status (`reading`, `completed`, `paused`) for every book.
4. Execute and claim a **Daily Reading Quest** by selecting a book and reporting where they finished reading (page count progress).
5. View an archive of completed books grouped/filtered by month (e.g., "Completed in August 2026").

---

## Decision Drivers

- **Zero Arbitrary XP Rule**: Daily reading XP must require selecting an active book and reporting valid page progress.
- **Active Shelf Management**: Clear visual presentational list of all books with status `'reading'`.
- **Book Progress Lifecycle**: Automatic transition from `reading` to `completed` with a completion timestamp (`completedAt`) when the final page is reached.
- **Monthly Completion Analytics**: Archive listing books finished in a target calendar month.
- **Stat Payout Matrix**:
  - **Daily Reading Quest Session**: **+40 WIS XP** + **+10 DIS XP** for submitting progress.
  - **Book Completion Bonus**: Extra **+200 WIS XP** awarded when a book transitions to `completed`.

---

## Domain & System Model Specifications

### 1. `Book` Domain Model (`libs/character/domain-models`)

```typescript
export type BookStatus = 'reading' | 'completed' | 'paused';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastReadAt?: string;
  notes?: string;
}
```

### 2. `ReadingLogEntry` Model

```typescript
export interface ReadingLogEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  date: string; // YYYY-MM-DD
  startPage: number;
  endPage: number;
  pagesRead: number;
  xpAwarded: number;
  timestamp: string;
}
```

### 3. Quest Evaluation & Calculation Engine

- `evaluateBookReadingQuest(book: Book, endPage: number, date?: Date)`: Pure domain function validating that `endPage > currentPage` and `endPage <= totalPages`, calculating pages read, checking for book completion, and producing XP reward objects.
- `filterCompletedBooksByMonth(books: Book[], year: number, month: number)`: Pure domain helper function returning completed books matching the selected month.

---

## Considered Options

1. **Option 1: Static Book List without Quest Integration**
   - *Pros*: Simple UI.
   - *Cons*: Fails to connect reading to the XP progression engine.

2. **Option 2: Generic "I Read Today" Button**
   - *Pros*: Simple one-click daily check-in.
   - *Cons*: Violates the action-verification rule; no record of which book was read or progress made.

3. **Option 3: Active Reading Shelf with Daily Page-Progress Quest & Monthly Archive (Chosen)**
   - *Pros*: Fully satisfies user requirements; enforces verified page progress; updates book lifecycle automatically; provides monthly completion stats.
   - *Cons*: Requires user to enter the ending page number.

---

## Decision Outcome

We decided on **Option 3: Active Reading Shelf with Daily Page-Progress Quest & Monthly Archive**.

### Architectural Changes

1. **Domain Layer (`libs/character/domain-models`)**:
   - Added `book-reading-quest.model.ts` with `Book`, `BookStatus`, `ReadingLogEntry`, `evaluateBookReadingQuest()`, and `filterCompletedBooksByMonth()`.

2. **Data Access Layer (`libs/character/data-access`)**:
   - Implemented `BookStorageAdapter` for LocalStorage persistence.
   - Implemented `BookStateService` providing Signal-based state (`books`, `currentlyReadingBooks`, `completedBooksByMonth`, `addBook`, `logReadingSession`).
   - Integrated with `CharacterStateService` to grant WIS and DIS XP on reading session submission.

3. **UI Layer (`libs/character/feature-dashboard`)**:
   - Added **Book Reading Daily Quest Card** to dashboard.
   - Added **Currently Reading Shelf** view with progress bars.
   - Added **Add New Book Modal / Form**.
   - Added **Log Daily Reading Quest Modal**.
   - Added **Monthly Completed Books Archive**.

---

## Consequences

### Positive

- **Habit Integrity**: Directly incentivizes daily reading with tangible WIS & DIS XP rewards.
- **Organized Shelf**: Clear visibility into current active books and historical monthly completions.
- **Automatic Completion Handling**: Books automatically transition to `completed` upon reaching `totalPages` with completion bonuses.

### Negative & Trade-offs

- Requires client storage space for reading log session history.

---

## Graph Relationships & Cross References

- Implements [[Concept Name: Action-Based XP Engine]]
- Extends [[ADR-0006: Action-Based XP Engine and Early Wake-Up Daily Quests]]
- Relates to [[Character Dashboard Architecture]]
