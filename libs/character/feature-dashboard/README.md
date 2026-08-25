# Character Feature Dashboard (`libs/character/feature-dashboard`)

Smart container feature package orchestrating the Character Dashboard view and binding reactive state to presentational UI components.

---

## 🏛️ Architectural Layer & Component Rules

- **Scope & Tags**: `["scope:character", "layer:feature", "type:feature"]`
- **Prefix**: `character`
- **Selector**: `<character-dashboard>`
- **Allowed Dependencies**: `layer:feature`, `layer:ui`, `layer:data-access`, `layer:domain`.
- **Component Rules**: Smart container component injecting `CharacterStateService` (`inject(CharacterStateService)`), managing user interactions, and rendering presentational components (`<character-sheet>`).

---

## 💡 Capabilities & Integration Points

- **Reactive Binding**: Connects `CharacterStateService.character()` signal directly to `<character-sheet>`.
- **XP Payout Actions**:
  - `onResearchCompleted()`: Payouts +50 INT XP for completing Wiki research sessions.
  - `onAdrCreated()`: Payouts +75 WIS XP for creating Architecture Decision Records.
  - `onHabitStreakCompleted()`: Payouts +40 DIS XP for maintaining daily discipline habits.

```html
<character-dashboard></character-dashboard>
```

---

## 🧪 Testing & Verification

```bash
# Run ESLint check
npx nx lint character-feature-dashboard
```
