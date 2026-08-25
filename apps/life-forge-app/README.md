# LifeForge Application (`apps/life-forge-app`)

Primary production web application shell for the **Life Gamification Platform**, integrating the RPG Character Dashboard, Skill Progression Engine, Knowledge Cortex, and Cloud Persistence into a unified Single Page Application (SPA).

---

## 🏛️ Architectural Role & Component Hierarchy

`apps/life-forge-app` serves as the main application target (`scope:life-forge`, `layer:feature`, `type:feature`), orchestrating domain features across `scope:character` and `scope:wiki`. Built with Angular using **Zoneless Change Detection** (`provideZonelessChangeDetection()`) and Signals.

```text
┌───────────────────────────────────────────────────────────────────────┐
│                      LifeForge Platform Shell                         │
├───────────────────────────────────────────────────────────────────────┤
│ App Header Toolbar (Brand, Version, Navigation)                      │
├───────────────────────────────────────────────────────────────────────┤
│ Main Application Content (`<character-dashboard>`)                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Character Dashboard Feature (`libs/character/feature-dashboard`) │  │
│  │                                                                 │  │
│  │  ├── Character Sheet Component (`<character-sheet>`)             │  │
│  │  │    └── Level Badge, XP Progress Bar, Attributes (INT/WIS/DIS)│  │
│  │  └── Quick Action Panel (Simulate Wiki Research, Create ADRs)   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## ☁️ Cloud Infrastructure & Deployment

- **Hosting Platform**: Firebase Hosting (Global CDN, SSL, Custom Domains)
- **Database Engine**: Cloud Firestore (Real-time NoSQL document store)
- **Authentication**: Firebase Auth (Anonymous & OAuth SSO)
- **Live Target URL**: [https://life-forge-app-prod.web.app](https://life-forge-app-prod.web.app)
- **Firebase Project Console**: [life-forge-app-prod](https://console.firebase.google.com/project/life-forge-app-prod/overview)

---

## ⚙️ Key Technical Specifications

- **Framework**: Angular 19+ (Standalone Components, Signals, Zoneless)
- **State Hydration**: Dual-sync engine (`FirestoreCharacterAdapter` + `CharacterStorageAdapter` fallback)
- **Nx Tags**: `["scope:life-forge", "layer:feature", "type:feature"]`
- **Module Boundaries**: Allowed dependencies: `scope:life-forge`, `scope:character`, `scope:wiki`, `scope:shared`

---

## 🚀 Development & Deployment Commands

```bash
# Serve application locally (dev server at http://localhost:4200)
npx nx serve life-forge-app

# Build production bundle
npx nx run life-forge-app:build

# Deploy bundle and hosting to Firebase
npx nx run life-forge-app:deploy

# Run local emulators for Auth & Firestore
npx nx run life-forge-app:emulate
```
