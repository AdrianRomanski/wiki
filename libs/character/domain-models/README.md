# Character Domain Models (`libs/character/domain-models`)

Pure domain layer package managing core RPG character entities, progression formulas, level milestone curves, experience reward interfaces, and repository port definitions for the Life Gamification Platform.

---

## 🏛️ Architectural Layer & Boundary

- **Scope & Tags**: `["scope:character", "layer:domain", "type:util"]`
- **Prefix**: `character`
- **Allowed Dependencies**: Pure standard library utilities; zero dependencies on outer UI, data-access, or feature layers (`layer:domain` level).

---

## 🔑 Key Models & Pure Functions

### 1. Domain Entities (`character.model.ts`)
- `Character`: Core entity representing character state (`id`, `name`, `level`, `currentXp`, `xpToNextLevel`, `totalXpEarned`, `attributes`, `title`).
- `CharacterAttributes`: Core stats (`intelligence`, `wisdom`, `discipline`).
- `XpReward`: Experience payout payload (`amount`, `statCategory`, `sourceDescription`).
- `XpTransaction`: Immutable XP audit trail record (`id`, `userId`, `amount`, `statCategory`, `sourceDescription`, `timestamp`).
- `CharacterRepositoryPort`: Abstract contract defining persistence methods for domain adapters (`loadCharacter`, `saveCharacter`, `logXpTransaction`).

### 2. Progression Calculator (`progression-calculator.ts`)
- `calculateXpForLevel(level)`: Quadratic XP threshold formula ($XP = 100 \times \text{level}^{1.5}$).
- `calculateLevelProgress(currentXp, xpToNextLevel)`: Percent completion for level progress bar ($0 - 100\%$).
- `processXpGain(character, reward)`: Pure function evaluating XP payouts, leveling up, stat allocations, and RPG title promotions.
- `getCharacterTitle(level)`: Maps level thresholds to RPG titles (*Novice Scholar* $\rightarrow$ *Apprentice Researcher* $\rightarrow$ *Master Architect* $\rightarrow$ *Legendary Sage*).

### 3. Early Morning Quest Model (`early-wakeup-quest.model.ts`)
- `evaluateEarlyWakeupQuest(date)`: Pure evaluation function implementing ADR-0006 decaying morning XP windows:
  - **05:00 AM** (05:00 - 05:29): **+100 DIS XP** (Prime Tier)
  - **05:30 AM** (05:30 - 05:59): **+80 DIS XP** (High Tier)
  - **06:00 AM** (06:00 - 06:29): **+60 DIS XP** (Moderate Tier)
  - **06:30 AM** (06:30 - 06:59): **+40 DIS XP** (Standard Tier)
  - **07:00 AM** (07:00 - 07:29): **+20 DIS XP** (Final Window Tier)
  - **Later** (07:30 AM onwards): **0 XP** (Window Closed / Expired)
- `EARLY_WAKEUP_SLOTS`: Record map containing slot metadata, labels, and XP reward multipliers.

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit suite
npx nx test character-domain-models

# Run ESLint check
npx nx lint character-domain-models
```
