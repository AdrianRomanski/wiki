---
title: "ADR-0008: Google Auth Allowlist, Local Environment Secrets, and Level 1 Baseline Onboarding"
type: adr
status: accepted
date: 2026-08-28
tags: [architecture, authentication, google-auth, allowlist, onboarding, progression, privacy, clean-architecture]
---

# ADR-0008: Google Auth Allowlist, Local Environment Secrets, and Level 1 Baseline Onboarding

## Status

**Accepted**

---

## Context & Problem Statement

Building upon the Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture ([ADR-0005](0005-firebase-deployment-and-firestore-persistence.md)), the **Life Gamification & Knowledge Management Platform** requires secure user identity verification, zero-trust access control, and a standardized character onboarding workflow.

Specifically, the application implements three core security and onboarding architectural imperatives:

1. **Restricted Access via Real Google Authentication & Allowlist Guard**: Application access must be strictly protected via Firebase Google OAuth (`GoogleAuthProvider` + `signInWithPopup`). Upon sign-in, the user's verified Gmail address is evaluated against an application allowlist. Access is granted strictly if the email is on the permitted list; unpermitted accounts trigger an immediate `signOut()` and display an Access Denied state.
2. **Decoupled Environment Privacy & Secret Isolation**: To prevent privacy leakage and adhere to open-source security standards, no personal email addresses are ever stored in version-controlled repository code, `firebase.json`, or public environment templates. The permitted email allowlist is injected dynamically via Angular dependency injection (`ALLOWLIST_EMAILS`) and backed by `apps/life-forge-app/src/environments/environment.local.ts` (strictly excluded via `.gitignore`).
3. **Full UI Gating & Deterministic Baseline Initialization (Level 1 Start)**:
   - **UI Gating**: All dashboard interface elements (Character Sheet, Early Wake-up Quest, Book Reading Shelf, and Monthly Archives) are strictly hidden until successful authentication and allowlist validation. Only the Auth Card is visible when unauthenticated.
   - **Level 1 Baseline**: Every newly authenticated, permitted user profile initializes at **Level 1** with 0 total XP and clean attribute vectors.

---

## Decision Drivers

- **Zero-Trust Access Control & UI Gating**: Mandatory authentication via Google OAuth coupled with an allowlist guard hiding all application components before login.
- **Privacy by Design & Secret Decoupling**: Complete removal of personal email addresses from repository source code, delegating secrets to gitignored local environment files (`environment.local.ts`).
- **Real OAuth Integration**: Utilize native Firebase `signInWithPopup` with `GoogleAuthProvider` for authentic identity verification.
- **Uniform Character Onboarding**: Guarantee that every permitted user profile initializes cleanly at **Level 1** (0 cumulative XP).
- **Hexagonal Architecture**: Decouple domain models (`evaluateEmailAllowlist`, `createBaselineLevel1Character`) from infrastructure adapters (`AuthStateService`, `ALLOWLIST_EMAILS`).

---

## Technical Specifications & Architecture Blueprint

### 1. Authentication, UI Gating & Allowlist Evaluation Flow

```text
┌────────────────────────────────────────────────────────┐
│               Unauthenticated State                     │
│  (Only AuthCard Component Visible; Dashboard Hidden)    │
└──────────────────────────┬─────────────────────────────┘
                           │ Click "Sign In with Google"
                           ▼
┌────────────────────────────────────────────────────────┐
│    Firebase OAuth Pop-Up (signInWithPopup)             │
└──────────────────────────┬─────────────────────────────┘
                           │ Returns Verified User Email
                           ▼
┌────────────────────────────────────────────────────────┐
│     Email Allowlist Guard (evaluateEmailAllowlist)     │
└──────────────┬──────────────────────────┬──────────────┘
               │ (Not Authorized)         │ (Authorized)
               ▼                          ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  Firebase signOut()         │ │  User Profile Authenticated │
│  Display Access Denied Card │ │  Initialize Level 1 State   │
└─────────────────────────────┘ │  Render Full Dashboard UI   │
                                └─────────────────────────────┘
```

### 2. Secret Isolation Architecture & Dependency Injection

- **`ALLOWLIST_EMAILS` Injection Token**: Defined in `@wiki/character-data-access`.
- **`environment.local.ts` (Gitignored)**: Configures `allowlist: ['permitted-user@gmail.com']`.
- **`environment.ts` (Public Template)**: Configures placeholder `allowlist: ['admin@local.dev']`.
- **`app.config.ts`**: Binds `ALLOWLIST_EMAILS` to `environment.allowlist`.

#### User Profile Baseline Model (`libs/character/domain-models`)

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level: 1; // Strictly Level 1
  totalXp: 0; // 0 baseline XP
  createdAt: string; // ISO 8601 timestamp
  lastLoginAt: string; // ISO 8601 timestamp
}
```

---

## Considered Options

1. **Option 1: Open Unauthenticated Access with Hardcoded Credentials**
   - *Pros*: Simple setup.
   - *Cons*: High security risk; privacy leakage; no identity verification.

2. **Option 2: Google OAuth + Gitignored Environment Allowlist + UI Gating + Level 1 Baseline (Chosen)**
   - *Pros*:
     - **Security & Privacy**: Zero personal email leakage in repository files; real OAuth popup verification.
     - **UI Protection**: Dashboard contents completely hidden prior to authentication.
     - **Consistency**: Deterministic Level 1 starting state for all new accounts.
   - *Cons*: Requires managing `environment.local.ts` during local setup.

---

## Decision Outcome

We decided on **Option 2: Google OAuth + Gitignored Environment Allowlist + UI Gating + Level 1 Baseline**.

---

## Consequences

### Positive

- **Verified Identity**: Real Google OAuth authentication via Firebase SDK.
- **Complete Privacy**: Zero personal email addresses in repository source code or commit history.
- **Strict UI Access Control**: Unauthenticated users see only the Sign-In / Access Denied UI card.
- **Deterministic Baseline**: Level 1 starting state for all new users.

### Negative & Trade-offs

- Requires configuring `environment.local.ts` during deployment.

---

## Graph Relationships & Cross References

- Implements [[Concept Name: Security, Identity, and UI Gating Architecture]]
- Extends [[ADR-0005: Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture]]
- Relates to [[ADR-0004: Character Dashboard and Life Gamification Architecture]]
- Relates to [[ADR-0009: Firestore Time-Series XP Event Logging for Data Visualization]]
