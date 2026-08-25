---
title: "ADR-0005: Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture"
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, cloud, firebase, firestore, open-source, persistence, authentication, hexagonal-architecture]
---

# ADR-0005: Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture

## Status

**Accepted**

---

## Context & Problem Statement

The Life Forge Platform (`apps/life-forge-app`) and Wiki Graph Visualizer (`apps/wiki-graph`) initially relied on local browser `localStorage` and git-backed markdown files (`wiki/character.md`) for state management. While this served initial prototyping well, expanding the platform into an **Open-Source Life Gamification & Knowledge Management Platform** for public deployment requires a robust, cloud-native architecture.

To enable multi-device synchronization, real-time progression tracking, and seamless open-source community adoption, we must address key infrastructure challenges:

1. **Cloud Deployment & CDN Distribution**: Providing fast, global single-page application (SPA) hosting with automated preview builds for pull requests.
2. **Persistent Multi-Device Storage**: Storing character progression, XP logs, quest states, and skill tree node unlocks in a scalable real-time database instead of isolated browser storage.
3. **Open-Source Ergonomics & Developer Experience**: Ensuring open-source contributors can clone, build, run, and test the codebase locally for $0, without needing a live Google Cloud account or exposing secrets.
4. **Hexagonal Domain Decoupling**: Maintaining strict boundaries between core domain logic (`libs/character/domain`) and storage adapters (`libs/character/data-access`), preventing tight coupling to Firebase SDKs.
5. **Data Privacy & Security**: Enforcing zero-trust user data isolation where each user strictly owns and controls their character stats and XP logs.

---

## Decision Drivers

- **Open-Source First Architecture**: Zero vendor lock-in. Developers can run the app locally using the Firebase Local Emulator Suite or swap storage backends (e.g. LocalStorage fallback) via standard Angular Dependency Injection.
- **Hexagonal Ports & Adapters**: Abstract all data persistence behind domain repository interfaces (`CharacterRepositoryPort`, `XpRepositoryPort`). Firebase Firestore acts as one adapter implementation alongside a offline `LocalStorageAdapter`.
- **Real-Time Data Synchronization & Atomic XP Transactions**: Utilize Cloud Firestore real-time listeners (`onSnapshot`) and atomic write batches / transactions for consistent XP awarding across multi-tab or multi-device sessions.
- **Granular Declarative Security**: Protect user data using declarative Cloud Firestore Security Rules matching authenticated user UIDs.
- **Zero-Friction Deployment Pipeline**: Standardized `firebase.json` configuration, multi-environment Angular build configs (`environment.ts`), and Nx target wrappers for build, emulate, and deploy commands.

---

## Considered Options

### Option 1: Firebase Hosting + Cloud Firestore + Firebase Auth (Chosen)
- *Pros*:
  - **Zero-maintenance infrastructure**: Serverless static hosting via global CDN with automated SSL certificates.
  - **Real-time reactive backend**: Native integration with Angular Signals / RxJS through AngularFire / Firebase JS SDK.
  - **Local Emulator Suite**: Flawless open-source dev experience running Auth and Firestore locally without cloud credentials.
  - **Generous Free Tier**: Ideal for open-source self-hosting and personal use at zero cost.
- *Cons*: NoSQL document schema requires careful indexing and collection modeling.

### Option 2: Self-Hosted Supabase (PostgreSQL + PostgREST + Auth) + Vercel
- *Pros*: Relational SQL schema with row-level security (RLS).
- *Cons*: Requires managing Supabase Docker containers locally or depending on Supabase Cloud projects for open-source contributors; higher local setup friction compared to Firebase Emulator CLI.

### Option 3: Monolithic Express API + MongoDB on AWS ECS
- *Pros*: Full backend control over custom REST endpoints.
- *Cons*: High operational overhead, deployment complexity, monthly hosting costs for open-source adopters, and violation of our serverless monorepo philosophy.

---

## Decision Outcome

We decided on **Option 1: Firebase Hosting + Cloud Firestore + Firebase Auth**, designed with strict **Hexagonal Architecture** and **Open-Source First principles**.

---

## Technical Architecture & Implementation Blueprint

### 1. Hexagonal Storage Ports & Adapters Architecture

To prevent domain logic from depending directly on Firebase SDK types, storage operations are defined as pure abstract TypeScript contracts in `libs/character/domain`:

```text
               ┌──────────────────────────────────────────────┐
               │              CHARACTER DOMAIN                │
               │   ┌──────────────────────────────────────┐   │
               │   │ CharacterStateService (Domain Logic) │   │
               │   └──────────────────┬───────────────────┘   │
               │                      │                       │
               │                      ▼                       │
               │   ┌──────────────────────────────────────┐   │
               │   │     CharacterRepositoryPort (Port)   │   │
               │   └──────────────────┬───────────────────┘   │
               └──────────────────────┼───────────────────────┘
                                      │
               ┌──────────────────────┴───────────────────────┐
               │    DEPENDENCY INJECTION PROVIDER ADAPTERS    │
               │                      │                       │
         ┌─────┴──────────────────────┴─────────────────────┐
         ▼                                                  ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  FirestoreCharacterAdapter   │          │   LocalStorageCharacterAdapter│
│  (Cloud Firestore Engine)    │          │   (Offline / Local Open Source)│
└──────────────────────────────┘          └──────────────────────────────┘
```

#### Angular DI Token Provider Setup (`libs/character/data-access`):
```typescript
export const CHARACTER_REPOSITORY = new InjectionToken<CharacterRepositoryPort>('CHARACTER_REPOSITORY');

export function provideCharacterRepository() {
  return makeEnvironmentProviders([
    {
      provide: CHARACTER_REPOSITORY,
      useFactory: (env: Environment) => {
        return env.useFirebase 
          ? new FirestoreCharacterAdapter() 
          : new LocalStorageCharacterAdapter();
      },
      deps: [ENVIRONMENT_CONFIG]
    }
  ]);
}
```

---

### 2. Cloud Firestore Schema & Data Modeling

Character progression and XP data are organized under a per-user collection hierarchy (`users/{userId}/*`):

#### Data Collections Overview

| Collection Path | Document ID | Purpose | Sample Data Structure |
|---|---|---|---|
| `users/{userId}` | `profile` | User identity & metadata | `{ displayName, email, createdAt, lastLoginAt }` |
| `users/{userId}/character` | `sheet` | Active character attributes & levels | `{ level: 5, currentXp: 450, xpToNextLevel: 1000, attributes: { INT: 14, WIS: 12, DIS: 15 }, title: "Architect Seeker" }` |
| `users/{userId}/xp_transactions` | `{txId}` | Immutable audit log of earned XP | `{ amount: 150, source: "quest_complete", category: "WIS", description: "Created ADR-0005", timestamp: Timestamp }` |
| `users/{userId}/quests` | `{questId}` | Quest progression & status | `{ title: "Setup Cloud Infrastructure", category: "DIS", rewardXp: 200, status: "completed", completedAt: Timestamp }` |
| `users/{userId}/skill_nodes` | `{nodeId}` | Unlocked skill tree nodes | `{ nodeKey: "angular-signals-mastery", status: "unlocked", unlockedAt: Timestamp }` |

---

### 3. Declarative Security Rules (`firestore.rules`)

Strict security rules ensure complete tenant isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User data trees
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /character/{document=**} {
        allow read, write: if isOwner(userId);
      }

      match /xp_transactions/{txId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) 
          && request.resource.data.amount is number
          && request.resource.data.amount > 0;
      }

      match /quests/{questId} {
        allow read, write: if isOwner(userId);
      }

      match /skill_nodes/{nodeId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

### 4. Authentication Strategy

To accommodate both quick open-source exploration and long-term user accounts, Firebase Authentication will support:

1. **Anonymous Auth (Instant Developer Mode)**: Automatically signs in users without a prompt, allowing instant testing with zero registration friction.
2. **Google OAuth & Email/Password Link**: Enables users to upgrade anonymous sessions into persistent cloud accounts across multiple devices.

---

### 5. Open-Source Developer Experience & Emulators

Open-source contributors must be able to run the entire system locally without registering a Firebase project.

#### `firebase.json` Configuration:
```json
{
  "hosting": {
    "public": "dist/apps/life-forge-app/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### Nx Command Wrappers:
- `npx nx run life-forge-app:build` — Compiles production-ready Angular assets.
- `npx nx run life-forge-app:emulate` — Launches Firebase Auth + Firestore emulators & serves app against emulator endpoints (`localhost:8080`).
- `npx nx run life-forge-app:deploy` — Deploys production bundle to Firebase Hosting CDN.

---

## Consequences

### Positive

- **Production-Ready Cloud Persistence**: Real-time cloud synchronization for character sheet, XP logs, quests, and skill trees.
- **Zero-Friction Open Source Setup**: Anyone can run `npm run firebase:emulate` to get full local Auth and Firestore database capabilities without creating GCP projects or spending money.
- **Clean Architecture & Testability**: Business logic inside `libs/character/domain` remains completely decoupled from Firebase, covered by unit tests using mock repository adapters.
- **Security & Multi-Tenant Support**: Declarative security rules prevent data leaks between accounts.

### Negative & Trade-offs

- **SDK Dependency**: Requires adding `@angular/fire` and `firebase` to workspace `package.json`.
- **Indexing Management**: Complex queries across XP transaction logs require defining composite indexes in `firestore.indexes.json`.

---

## Graph Relationships & Cross-References

- Implements [[Life Gamification]]
- Implements [[Firebase Deployment]]
- Implements [[Firestore Data Persistence]]
- Relates to [[Monorepo Structure & Hexagonal Architecture for Wiki Core]] (ADR-0001)
- Relates to [[Character Dashboard & Life Gamification Platform (Wiki as Character Brain)]] (ADR-0004)
