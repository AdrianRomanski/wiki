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
- **Action-Based Quest Claiming (ADR-0006)**:
  - `claimEarlyWakeUpXp()`: Evaluates local/simulated time and awards decaying Discipline (DIS) XP (05:00 AM $\rightarrow$ 100 XP, 05:30 AM $\rightarrow$ 80 XP, 06:00 AM $\rightarrow$ 60 XP, 06:30 AM $\rightarrow$ 40 XP, 07:00 AM $\rightarrow$ 20 XP, 07:30+ $\rightarrow$ 0 XP).
  - `currentEvaluation`: `computed` signal dynamically evaluating active quest tier, payout potential, and claim eligibility.
  - `setSimulatedTime()` / `resetSimulation()`: Testing controls for simulating morning slots interactively.

```html
<character-dashboard></character-dashboard>
```

---

## 🧪 Testing & Verification

```bash
# Run ESLint check
npx nx lint character-feature-dashboard
```
