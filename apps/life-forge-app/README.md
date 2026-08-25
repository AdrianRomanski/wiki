# LifeForge Application (`apps/life-forge-app`)

The primary web application shell for the **Life Gamification Platform**, bringing together the Character Dashboard, RPG Progression Engine, Knowledge Wiki Brain, and AI Questmaster into a unified, responsive interface.

---

## 🏛️ Architectural Role & Component Hierarchy

`apps/life-forge-app` serves as the main application orchestrator target (`scope:life-forge`, `layer:feature`, `type:feature`), linking domain features across `scope:character` and `scope:wiki`. It runs on Angular with stable **Zoneless Change Detection** (`provideZonelessChangeDetection()`).

```text
+-----------------------------------------------------------------------+
|                      LifeForge Platform Shell                         |
+-----------------------------------------------------------------------+
| App Header Toolbar (Brand, Version, Navigation)                      |
+-----------------------------------------------------------------------+
| Main Application Content (`<character-dashboard>`)                    |
|                                                                       |
|  ┌─────────────────────────────────────────────────────────────────┐  |
|  │ Character Dashboard Feature (`libs/character/feature-dashboard`) │  |
|  │                                                                 │  |
|  │  ├── Character Sheet Component (`<character-sheet>`)             │  |
|  │  │    └── Level Badge, XP Progress Bar, Attributes (INT/WIS/DIS)│  |
|  │  └── Quick Action Panel (Simulate Wiki Research, Create ADRs)   │  |
|  └─────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------+
```

---

## ⚙️ Key Technical Specifications

- **Framework**: Angular (Standalone Components, Signals, Zoneless Change Detection)
- **State Hydration**: Direct synchronicity with Wiki knowledge repository (`wiki/character.md`)
- **Tags & Boundaries**: `["scope:life-forge", "layer:feature", "type:feature"]`
- **Module Boundary Rules**: Allowed dependencies: `scope:life-forge`, `scope:character`, `scope:wiki`, `scope:shared`

---

## 🚀 Commands & Development Workflow

```bash
# Serve application locally (dev server at http://localhost:4200)
npx nx serve life-forge-app

# Build production bundle
npx nx run life-forge-app:build

# Run ESLint module boundary validation
npx nx run life-forge-app:lint
```
