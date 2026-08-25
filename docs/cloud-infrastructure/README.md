# Cloud Infrastructure & Firebase Deployment (`docs/cloud-infrastructure`)

Comprehensive documentation of the cloud infrastructure, database schemas, security rules, and open-source setup procedures for the Life Forge Platform.

---

## ☁️ Architecture Overview

The cloud deployment for `apps/life-forge-app` utilizes Google Cloud Platform and Firebase services designed for global performance and serverless scalability.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Firebase Cloud Platform                         │
├────────────────────────────────────────────────────────────────────────┤
│ Firebase Hosting (CDN, Single Page App Route Rewrites)                 │
│  └── Output: `dist/apps/life-forge-app/browser`                       │
├────────────────────────────────────────────────────────────────────────┤
│ Cloud Firestore (NoSQL Document Database)                              │
│  ├── `users/{userId}/character/sheet` (Character attributes & Level)   │
│  └── `users/{userId}/xp_transactions/{txId}` (Immutable XP audit log) │
├────────────────────────────────────────────────────────────────────────┤
│ Firebase Authentication                                                │
│  └── Anonymous Sign-In & OAuth Providers                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Key Infrastructure Files

- **`firebase.json`**: Root configuration specifying static hosting public directory, SPA rewrite rules, and local emulator ports.
- **`firestore.rules`**: Declarative security rules guaranteeing per-user UID isolation (`request.auth.uid == userId`).
- **`.firebaserc`**: Active project binding (`life-forge-app-prod`).
- **[ADR-0005](file:///home/adrian-romanski/projects/demo/wiki/docs/adr/0005-firebase-deployment-and-firestore-persistence.md)**: Architectural Decision Record governing cloud infrastructure.

---

## 🛠️ Open-Source Local Setup & Emulators

Open-source contributors can run the entire infrastructure locally without creating Google Cloud accounts:

```bash
# Start local emulators (Auth on 9099, Firestore on 8080, UI on 4000)
npx nx run life-forge-app:emulate

# Build production bundle
npx nx run life-forge-app:build

# Deploy hosting and database rules to live project
npx nx run life-forge-app:deploy
```
