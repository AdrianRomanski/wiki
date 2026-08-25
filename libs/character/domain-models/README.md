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

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit suite
npx nx test character-domain-models

# Run ESLint check
npx nx lint character-domain-models
```
