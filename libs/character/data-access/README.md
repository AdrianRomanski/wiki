# Character Data Access (`libs/character/data-access`)

Reactive state management and persistence adapters (Cloud Firestore, LocalStorage & Wiki Markdown storage) for the Character Domain (`scope:character`).

---

## 🏛️ Architectural Layer & Boundary

- **Scope & Tags**: `["scope:character", "layer:data-access", "type:data-access"]`
- **Prefix**: `character`
- **Allowed Dependencies**: `@wiki/character-domain-models` (`layer:domain`), pure RxJS / Angular Signals, storage adapters.

---

## ⚙️ Core Services & Persistence Adapters

### 1. `CharacterStateService`
Angular `@Injectable()` service utilizing Angular Signals (`signal()`) to manage reactive character state throughout the application.

- `character`: Read-only signal exposed to presentational and container components.
- `awardXp(reward: XpReward)`: Evaluates progression math, updates the reactive signal, logs XP audit transactions to Firestore, and syncs changes locally.
- `resetCharacter(id, name)`: Resets character to default Level 1 state.

### 2. `BookStateService`
Angular `@Injectable()` reactive state service for managing reading shelf state, reading quest logs, and book completion archives:

- `books`: Signal holding full catalog of user books.
- `readingLogs`: Signal tracking daily reading quest log history.
- `currentlyReadingBooks`: Computed signal filtering books with status `'reading'`.
- `completedBooks`: Computed signal filtering books with status `'completed'`.
- `addBook(bookData)`: Adds a new book to the shelf.
- `logReadingSession(bookId, finishedPage)`: Executes `evaluateBookReadingQuest`, updates book state, saves log entry, and awards WIS & DIS XP via `CharacterStateService`.
- `getCompletedBooksForMonth(year, month)`: Filters completed books for a given calendar month.

### 3. `AuthStateService` (ADR-0008)
Angular `@Injectable()` service managing Google Auth allowlist authorization and Level 1 character onboarding:
- `user`: Signal tracking authenticated `UserProfile` (`uid`, `email`, `level: 1`, `totalXp: 0`).
- `authStatus`: Signal tracking auth state (`idle` | `authenticating` | `authenticated` | `unauthorized` | `unauthenticated`).
- `allowlist`: Signal managing permitted email list.
- `ALLOWLIST_EMAILS`: Angular `InjectionToken<string[]>` for dynamic allowlist injection.
- `loginWithGoogle(mockEmail?)`: Executes Google OAuth login flow with allowlist security validation.
- `logout()`: Clears active session.
- `getBaselineLevel1Character()`: Generates a baseline Level 1 character profile.

### 4. `BookStorageAdapter`
LocalStorage persistence adapter for user's book catalog and reading session logs (`life_forge_books_v1` and `life_forge_reading_logs_v1`).

### 5. `XpEventStorageAdapter` (ADR-0009)
LocalStorage & in-memory fallback persistence adapter for time-series `XpEventLog` entries (`lifeforge_xp_events`):
- `saveXpEvent(event)`: Saves immutable time-series log with generated ID.
- `loadXpEvents()`: Loads stored XP event logs.
- `getXpEventsByDateRange(startDate, endDate)`: Filters logs by `YYYY-MM-DD` date range.

### 6. `FirestoreCharacterAdapter` (ADR-0009)
Hexagonal repository adapter implementing `CharacterRepositoryPort` and `XpEventRepositoryPort` for Cloud Firestore:
- `loadCharacter(userId)`: Fetches per-user character document (`users/{userId}/character/sheet`).
- `saveCharacter(character, userId)`: Updates character attributes with server timestamps.
- `logXpTransaction(transaction, userId)`: Writes immutable XP audit log documents (`users/{userId}/xp_transactions`).
- `logXpEvent(event, userId)`: Writes immutable time-series XP event documents (`users/{userId}/xp_events/{eventId}`).
- `getXpEventsByDateRange(startDate, endDate, userId)`: Executes range query on `users/{userId}/xp_events` filtered by `date` range and ordered by `timestamp`.
- `getXpEvents(userId)`: Fetches all XP events ordered by `timestamp` descending.

### 8. `CourseStateService` (ADR-0010)
Angular `@Injectable()` reactive state service managing course catalog, user progress, and action-based learning XP awards:
- `courses`: Signal holding loaded course curricula.
- `userProgressMap`: Signal tracking progress map per course ID.
- `activeCourse`: Computed signal returning currently selected course.
- `activeCourseProgress`: Computed signal for current course progress.
- `nextUpItem`: Computed signal identifying the next uncompleted video lecture or practical coding lab.
- `activeCourseStats`: Computed signal for percentage, completednpx nx configure-ai-agents videos, completed exercises.
- `dailyQuestEvaluation` & `isDailyQuestDoneToday`: Computed signals tracking daily study quest status.
- `selectCourse(courseId)`: Switches active course.
- `addOrImportCourse(courseData)`: Imports or adds structured course JSON curricula.
- `completeItem(courseId, itemId, notes)`: Evaluates item completion, awards INT, WIS, and DIS XP, logs `COURSE_PROGRESSION` time-series XP events via `CharacterStateService`, and syncs progress.
- `resetCourseProgress(courseId)`: Resets tracking for a specific course.

### 9. `CourseStorageAdapter` (ADR-0010)
LocalStorage persistence adapter for courses catalog and user course progress (`life_forge_courses_v1` and `life_forge_course_progress_v1`), seeded with a production-grade course (*Advanced Angular 19+ & Zoneless State Architecture*).

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit suite
npx nx test character-data-access

# Run ESLint check
npx nx lint character-data-access
```
