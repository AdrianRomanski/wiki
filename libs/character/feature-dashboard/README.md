# Character Feature Dashboard (`libs/character/feature-dashboard`)

Smart container feature package orchestrating the Character Dashboard view and binding reactive state to presentational UI components.

---

## 🏛️ Architectural Layer & Component Rules

- **Scope & Tags**: `["scope:character", "layer:feature", "type:feature"]`
- **Prefix**: `character`
- **Selector**: `<character-dashboard>`
- **Allowed Dependencies**: `layer:feature`, `layer:ui`, `layer:data-access`, `layer:domain`.
- **Component Rules**: Smart container component injecting `CharacterStateService` and `BookStateService`, managing user interactions, and rendering presentational components (`<character-sheet>`).

---

## 💡 Capabilities & Integration Points

- **Reactive Binding**: Connects `CharacterStateService.character()` signal directly to `<character-sheet>`.
- **Early Morning Waking Quest (ADR-0006)**:
  - `claimEarlyWakeUpXp()`: Evaluates local/simulated time and awards decaying Discipline (DIS) XP (05:00 AM $\rightarrow$ 100 XP, 05:30 AM $\rightarrow$ 80 XP, 06:00 AM $\rightarrow$ 60 XP, 06:30 AM $\rightarrow$ 40 XP, 07:00 AM $\rightarrow$ 20 XP, 07:30+ $\rightarrow$ 0 XP).
  - `currentEvaluation`: `computed` signal dynamically evaluating active quest tier, payout potential, and claim eligibility.
  - `setSimulatedTime()` / `resetSimulation()`: Testing controls for simulating morning slots interactively.
- **Google Auth Allowlist & Level 1 Onboarding (ADR-0008)**:
  - Embeds `<character-auth-card>` at the top of the dashboard.
  - Connects `AuthStateService.user()` and `AuthStateService.authStatus()` signals to auth card presentation.
  - `onLogin()` / `onLogout()`: Executes Google Sign-In with allowlist authorization check and Level 1 baseline profile onboarding.
- **Book Reading Daily Quest & Active Shelf (ADR-0007)**:
  - **Currently Reading Shelf**: Displays all active books (`status: 'reading'`) with title, author, progress bar, percentage read, and quick log actions.
  - **Add New Book Modal**: Form dialog to add a new book to the user's shelf.
  - **Log Daily Reading Quest Modal**: Interactive dialog allowing the user to select an active book, input ending page progress, and claim **+40 WIS & +10 DIS XP** (plus **+200 WIS XP** completion bonus when finishing a book).
  - **Completed Books Archive**: Filterable view by Month and Year displaying books completed in the selected calendar month.

```html
<character-dashboard></character-dashboard>
```

---

## 🧪 Testing & Verification

```bash
# Run ESLint check
npx nx lint character-feature-dashboard
```
