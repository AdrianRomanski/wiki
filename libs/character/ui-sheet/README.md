# Character UI Sheet (`libs/character/ui-sheet`)

Dumb, presentational Angular component library rendering the RPG Character Sheet UI.

---

## 🏛️ Architectural Layer & Component Rules

- **Scope & Tags**: `["scope:character", "layer:ui", "type:ui"]`
- **Prefix**: `character`
- **Selector**: `<character-sheet>`
- **Allowed Dependencies**: `layer:ui`, `layer:domain` (`@wiki/character-domain-models`).
- **Component Rules**: Pure presentational component. Strictly consumes inputs (`input.required<Character>()`) and emits outputs (`output()`). Never injects data services directly.

---

## 🎨 UI Features & Visual Layout

- **RPG Level Badge**: Glowing avatar container displaying character level and title.
- **Animated XP Bar**: Visual progress fill with percentage counter and remaining XP readout.
- **Attribute Grid**: Stat cards showcasing **Intelligence (INT)**, **Wisdom (WIS)**, and **Discipline (DIS)** with HSL color coding and micro-animations.

```html
<character-sheet [character]="characterData"></character-sheet>
```

---

## 🧪 Testing & Verification

```bash
# Run ESLint check
npx nx lint character-ui-sheet
```
