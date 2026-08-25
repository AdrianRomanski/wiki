# Character Data Access (`libs/character/data-access`)

Reactive state management and Wiki-backed Markdown storage adapter layer for the Character Domain (`scope:character`).

---

## 🏛️ Architectural Layer & Boundary

- **Scope & Tags**: `["scope:character", "layer:data-access", "type:data-access"]`
- **Prefix**: `character`
- **Allowed Dependencies**: `@wiki/character-domain-models` (`layer:domain`), pure RxJS / Angular Signals, storage adapters.

---

## ⚙️ Core Services & Persistence Adapters

### 1. `CharacterStateService`
Angular `@Injectable()` service utilizing Angular Signals (`signal()`, `asReadonly()`) to manage reactive character state throughout the application.

- `character`: Read-only signal exposed to container and smart components.
- `awardXp(reward: XpReward)`: Triggers pure progression math, updates the reactive signal, and synchronizes changes to the persistence adapter.
- `resetCharacter(id, name)`: Resets character to default Level 1 state.

### 2. `CharacterStorageAdapter` & Wiki Markdown Serialization
- `wiki/character.md`: Character sheet state (Level, XP, Attributes, Titles) is stored as a human-readable Markdown file with YAML frontmatter inside the Wiki knowledge base.
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
