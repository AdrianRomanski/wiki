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

### 3. `BookStorageAdapter`
LocalStorage persistence adapter for user's book catalog and reading session logs (`life_forge_books_v1` and `life_forge_reading_logs_v1`).

### 4. `FirestoreCharacterAdapter`
Hexagonal repository adapter implementing `CharacterRepositoryPort` for Cloud Firestore:
- `loadCharacter(userId)`: Fetches per-user character document (`users/{userId}/character/sheet`).
- `saveCharacter(character, userId)`: Updates character attributes with server timestamps.
- `logXpTransaction(transaction, userId)`: Writes immutable XP audit log documents (`users/{userId}/xp_transactions`).

### 5. `CharacterStorageAdapter`
Offline fallback storage adapter:
- `wiki/character.md`: Character sheet state (Level, XP, Attributes, Titles) stored as Markdown with YAML frontmatter inside the Wiki knowledge base.
- `parseCharacterFromMarkdown(markdown)`: Parses YAML frontmatter into a typed `Character` object.
- `serializeCharacterToMarkdown(character)`: Serializes `Character` state into Markdown format.

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit suite
npx nx test character-data-access

# Run ESLint check
npx nx lint character-data-access
```
