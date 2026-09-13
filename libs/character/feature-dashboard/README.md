# Character Feature Dashboard (`libs/character/feature-dashboard`)

Smart container feature package orchestrating the Character Dashboard view and binding reactive state to presentational UI components.

---

## Architectural Layer & Component Rules

- **Scope & Tags**: `["scope:character", "layer:feature", "type:feature"]`
- **Prefix**: `character`
- **Selector**: `<character-dashboard>`
- **Allowed Dependencies**: `layer:feature`, `layer:ui` (`character-ui-sheet`, `character-ui-auth`), `layer:data-access`, `layer:domain`.
- **Component Rules**: Smart container component injecting `CharacterStateService`, `AuthStateService`, and `BookStateService`, managing user interactions, and rendering presentational components (`<character-sheet>`, `<character-auth-card>`).

---

## Capabilities & Integration Points

- **Reactive Binding**: Connects `CharacterStateService.character()` signal directly to `<character-sheet>`.
- **ADHD-Friendly Streamlined Focus & 1-Click Habits (ADR-0013)**:
  - **Zero Modal Disruptions**: Daily check-ins for active quests (study, reading, waking) execute directly on the card in **1 click** with zero popup modals or blocking backdrops.
  - `<character-daily-study-quest-card>`: Displays the immediate focus lesson and awards calibrated INT, WIS & DIS XP via a direct `[⚡ Complete Next Lesson]` 1-click button with an optional non-blocking inline notes drawer.
  - `<character-daily-reading-quest-card>`: Features an inline reading volume stepper `[ - ] [ 15 ] [ + ] pages read today` and a 1-click `[ 📖 Log {pages} Pages ]` button for frictionless habit execution without modal calculations.
  - `<character-daily-wakeup-quest-card>`: 1-click claim button for decaying Discipline XP with collapsed demo time simulator controls.
  - **Progressive Disclosure Drawers**: Expansive historical logs and multi-nested trees are kept out of primary visual real estate behind collapsible drawers:
    - `<character-course-curriculum-drawer>`: On-demand course syllabus accordion.
    - `<character-reading-shelf-drawer>`: Bookshelf library, inline Add Book form, and monthly completed archive.
    - `<character-xp-analytics-drawer>`: Collapsible time-series event audit log.

```html
<character-dashboard></character-dashboard>
```

---

## Testing & Verification

```bash
# Run Vitest unit tests
npx nx test character-feature-dashboard

# Run ESLint check
npx nx lint character-feature-dashboard
```
