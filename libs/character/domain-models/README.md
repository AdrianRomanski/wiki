# Character Domain Models (`libs/character/domain-models`)

Pure domain layer package managing core RPG character entities, progression formulas, level milestone curves, and experience reward interfaces for the Life Gamification Platform.

---

## 🏛️ Architectural Layer & Boundary

- **Scope & Tags**: `["scope:character", "layer:domain", "type:util"]`
- **Prefix**: `character`
- **Allowed Dependencies**: Pure standard library utilities; zero dependencies on outer UI, data-access, or feature layers (`layer:domain` level).

---

## 🔑 Key Models & Pure Functions

### 1. Domain Entities (`character.model.ts`)
- `Character`: Represents the complete character state (`id`, `name`, `level`, `currentXp`, `xpToNextLevel`, `totalXpEarned`, `attributes`, `title`).
- `CharacterAttributes`: Core character stats:
  - `intelligence`: Wiki research, concept mastery, learning speed.
  - `wisdom`: Architectural governance, ADR creation, design patterns.
  - `discipline`: Habit consistency, quest execution, daily streaks.
- `XpReward`: Experience point payout payload (`amount`, `statCategory`, `sourceDescription`).

### 2. Progression Calculator (`progression-calculator.ts`)
- `calculateXpForLevel(level)`: Quadratic XP threshold formula ($XP = 100 \times \text{level}^{1.5}$).
- `calculateLevelProgress(currentXp, xpToNextLevel)`: Percent completion for level progress bar ($0 - 100\%$).
- `processXpGain(character, reward)`: Pure function evaluating XP payouts, leveling up, stat allocations, and RPG title promotions.
- `getCharacterTitle(level)`: Maps level thresholds to RPG titles (*Novice Scholar* $\rightarrow$ *Apprentice Researcher* $\rightarrow$ *Master Architect* $\rightarrow$ *Legendary Sage*).

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit suite
npx nx test character-domain-models

# Run ESLint check
npx nx lint character-domain-models
```
