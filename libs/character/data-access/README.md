# Character Data Access (`libs/character/data-access`)

Reactive state management and persistence adapters (Cloud Firestore & Wiki Markdown storage) for the Character Domain (`scope:character`).

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

### 2. `FirestoreCharacterAdapter`
Hexagonal repository adapter implementing `CharacterRepositoryPort` for Cloud Firestore:
- `loadCharacter(userId)`: Fetches per-user character document (`users/{userId}/character/sheet`).
- `saveCharacter(character, userId)`: Updates character attributes with server timestamps.
- `logXpTransaction(transaction, userId)`: Writes immutable XP audit log documents (`users/{userId}/xp_transactions`).

### 3. `CharacterStorageAdapter`
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
