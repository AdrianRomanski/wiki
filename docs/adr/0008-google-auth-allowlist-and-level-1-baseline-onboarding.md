---
title: "ADR-0008: Google Auth Allowlist and Level 1 Baseline Character Onboarding"
type: adr
status: accepted
date: 2026-08-28
tags: [architecture, authentication, google-auth, allowlist, onboarding, progression, clean-architecture]
---

# ADR-0008: Google Auth Allowlist and Level 1 Baseline Character Onboarding

## Status

**Accepted**

---

## Context & Problem Statement

Building upon the Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture ([ADR-0005](0005-firebase-deployment-and-firestore-persistence.md)), the **Life Gamification & Knowledge Management Platform** requires secure user identity verification and a standardized character initialization workflow.

Specifically, the application must address two core identity and onboarding requirements:

1. **Restricted Access via Google Authentication & Allowlist Guard**: Application access must be strictly protected via Google/Gmail authentication (`GoogleAuthProvider`). Access must be restricted to explicitly authorized email accounts evaluated against an application allowlist. To maintain privacy and adhere to repository documentation standards, specific personal email addresses are decoupled from version-controlled ADR documents and managed dynamically via environment variables or Firestore authorization controls.
2. **Deterministic Baseline Initialization (Level 1 Start)**: Every newly authenticated user account must begin progression at **Level 1** with 0 total XP and a clean attribute vector, establishing a uniform starting point for all characters.

---

## Decision Drivers

- **Zero-Trust Access Control**: Enforce mandatory authentication via Google OAuth coupled with an allowlist guard before any character state or wiki functionality is accessible.
- **Privacy by Design**: Maintain abstract architectural documentation by avoiding hardcoded email addresses in repository ADR files, delegating identity allowlists to runtime configuration / Firestore security rules.
- **Uniform Character Onboarding**: Guarantee that every permitted user profile initializes at **Level 1** (0 cumulative XP) with zero pre-loaded attributes or unearned bonuses.
- **Hexagonal Decoupling**: Abstract authentication and allowlist validation behind domain port interfaces (`AuthenticationPort`, `AllowlistGuardPort`), enabling local development offline testing via emulator mocks.

---

## Technical Specifications & Architecture Blueprint

### 1. Authentication & Allowlist Authorization Guard

The authentication pipeline integrates Firebase Authentication using Google OAuth (`GoogleAuthProvider`). Upon successful login, the user's identity is evaluated against an **Email Allowlist Guard**:

```text
┌──────────────────────────────┐
│   Google OAuth Sign-In       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Email Allowlist Guard       │ ──(Not Authorized)──► ┌──────────────────────────────┐
└──────────────┬───────────────┘                       │ Access Denied Screen          │
               │ (Authorized)                          └──────────────────────────────┘
               ▼
┌──────────────────────────────┐
│ Existing User Profile Check  │
└───────┬──────────────┬───────┘
        │              │
  (First Login)   (Existing User)
        │              │
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│ Initialize   │ │ Load         │
│ Level 1      │ │ Firestore    │
│ Profile      │ │ State        │
└──────────────┘ └──────────────┘
```

#### User Progression Profile Baseline Schema (`libs/character/domain-models`)

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level: 1; // Always initializes at Level 1
  totalXp: 0; // Baseline cumulative XP
  stats: {
    STR: 0;
    INT: 0;
    WIS: 0;
    DIS: 0;
    VIT: 0;
  };
  createdAt: string; // ISO 8601 timestamp
  lastLoginAt: string; // ISO 8601 timestamp
}
```

### 2. Domain Ports & Security Evaluation

- `AuthenticationPort`: Defines Google OAuth sign-in, sign-out, and active user session stream (`user$`).
- `AllowlistGuardPort`: Pure domain interface verifying whether a given email address is in the permitted account set.

---

## Considered Options

1. **Option 1: Open Unauthenticated Access**
   - *Pros*: Simple setup.
   - *Cons*: No privacy; user progression cannot be tied to a verified identity.

2. **Option 2: Google Auth + Configurable Allowlist Guard + Level 1 Onboarding Baseline (Chosen)**
   - *Pros*:
     - **Security**: Only permitted accounts can access character state.
     - **Privacy**: No personal email addresses hardcoded in public repository files.
     - **Determinism**: Every permitted user starts cleanly at Level 1 with 0 XP.
   - *Cons*: Requires setting allowlist environment configuration during deployment.

---

## Decision Outcome

We decided on **Option 2: Google Auth + Configurable Allowlist Guard + Level 1 Onboarding Baseline**.

---

## Consequences

### Positive

- **Enhanced Access Security**: Only permitted Google/Gmail accounts can log in and access the application.
- **Privacy Compliance**: ADR documents remain clean of specific PII or hardcoded emails.
- **Consistent Onboarding**: Guarantees Level 1 starting state for all new accounts.

### Negative & Trade-offs

- Requires managing an allowlist configuration in environment variables or Firestore security rules.

---

## Graph Relationships & Cross References

- Implements [[Concept Name: Security and Identity Architecture]]
- Extends [[ADR-0005: Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture]]
- Relates to [[ADR-0004: Character Dashboard and Life Gamification Architecture]]
- Relates to [[ADR-0009: Firestore Time-Series XP Event Logging for Data Visualization]]
