---
title: "ADR-0006: Action-Based XP Engine, Elimination of Quick XP, and Early Wake-Up Daily Quests"
type: adr
status: accepted
date: 2026-08-25
tags: [architecture, gamification, xp-engine, daily-quests, waking-up, habits, clean-architecture]
---

# ADR-0006: Action-Based XP Engine, Elimination of Quick XP, and Early Wake-Up Daily Quests

## Status

**Accepted**

---

## Context & Problem Statement

In the initial implementation of the Character Dashboard (`libs/character/feature-dashboard`), temporary "Quick XP Actions" buttons allowed simulating XP gain (e.g. clicking buttons to receive +50 INT XP or +100 WIS XP). While useful for initial UI demonstration, arbitrary or unearned XP grants violate the foundational vision of the **Life Gamification Platform**.

Engineers and lifelong learners using LifeForge require strict alignment between real-world discipline and character progression:

1. **"No XP for Nothing"**: Experience points (XP) must strictly represent tangible, deliberate habit execution and verified real-world accomplishments.
2. **Direct In-App Verification**: Users must interact directly with the application interface while performing or completing an action to claim XP.
3. **Decaying Time Windows for Habits**: Core habits—starting with **Waking Up Early**—have peak real-world effectiveness during specific morning hours. The progression system must reflect this decay through strict time-bound reward windows, where missing the window yields zero XP.

---

## Decision Drivers

- **Zero Unearned XP Rule**: Complete deprecation and removal of all generic "Quick XP" buttons and arbitrary XP generation across domain models, UI components, and state management services.
- **Actionable Experience Engine**: Every XP grant must be backed by a specific quest or habit completion event model with validation constraints.
- **Direct Application Interaction**: XP is claimed directly via in-app UI interactions tied to active habit status.
- **Time-Decaying Daily Quest Matrix**: Implement an **Early Morning Waking Daily Quest** with strict decaying XP windows based on local system time.

---

## Early Morning Quest Payout Matrix

The "Waking Up Early" daily quest rewards Discipline (DIS) XP based on the exact time of direct in-app claiming:

| Time Window | Tier Name | DIS XP Reward | Description / Condition |
|---|---|---|---|
| **05:00 - 05:29 AM** | Prime Tier | **+100 DIS XP** | Maximum reward for extreme early birds |
| **05:30 - 05:59 AM** | High Tier | **+80 DIS XP** | High reward for early morning risers |
| **06:00 - 06:29 AM** | Moderate Tier | **+60 DIS XP** | Moderate reward for standard morning risers |
| **06:30 - 06:59 AM** | Standard Tier | **+40 DIS XP** | Standard reward for baseline early wake-ups |
| **07:00 - 07:29 AM** | Final Tier | **+20 DIS XP** | Final baseline window before cutoff |
| **07:30 AM onwards** | Expired | **0 XP** | Window closed for the day; no XP awarded |

> [!IMPORTANT]
> If a user attempts to claim the Early Morning Waking Quest before 05:00 AM or after 07:29 AM, the quest evaluates to **0 XP** and displays an inactive/expired state.

---

## Considered Options

1. **Option 1: Retain Quick XP alongside Daily Quests**
   - *Pros*: Simple UI fallback for testing.
   - *Cons*: Encourages cheating and unearned XP; breaks core RPG motivation; dilutes stat integrity.

2. **Option 2: Passive/Background XP Generation**
   - *Pros*: Automated tracking without manual clicks.
   - *Cons*: Passive systems lack conscious user engagement; fails to reinforce intentional habit execution.

3. **Option 3: Action-Based Experience Engine with In-App Time-Decaying Claiming (Chosen)**
   - *Pros*: Strict "No XP for Nothing" enforcement; direct in-app user action required; rewards disciplined early wake-up habits with clear time cutoffs.
   - *Cons*: Users who wake up late miss the window and receive 0 XP for that day.

---

## Decision Outcome

We decided on **Option 3: Action-Based Experience Engine with In-App Time-Decaying Claiming**.

### Architectural Changes

1. **Domain Model (`libs/character/domain-models`)**:
   - Implemented `calculateEarlyWakeupXp(date: Date): EarlyWakeupXpResult` pure evaluation function.
   - Exported `EARLY_WAKEUP_TIME_SLOTS` containing exact minute boundaries, XP values, and tier metadata.

2. **UI & Presentational Layer (`libs/character/feature-dashboard`)**:
   - Completely deleted the `.quick-actions-card` element from `character-dashboard.component.html`.
   - Removed `onResearchCompleted()`, `onAdrCreated()`, and `onDailyStreakFinished()` methods.
   - Added the `🌅 Early Morning Waking Quest` card displaying the active time slot badge, available DIS XP, and a direct `Claim Quest XP` button.

3. **State Management (`libs/character/data-access`)**:
   - Connected `CharacterStateService` to award DIS XP only when valid action results are produced by domain model evaluations.

---

## Consequences

### Positive

- **High Progression Integrity**: Guarantees that every level-up and stat point reflects deliberate, real-world effort.
- **Strong Habit Reinforcement**: incentivizes consistent morning discipline with highest rewards allocated to 5:00 AM risers.
- **Clean UI**: Eliminates clutter from simulated action buttons in favor of dedicated daily habit cards.

### Negative & Trade-offs

- **Strict Cutoffs**: Users waking up at 7:30 AM or later receive no XP for the quest.
- **Time Zone Reliance**: Relies on system local time for slot determination (future iterations will validate via server/device attestation).

---

## Graph Relationships & Cross-References

- Implements [[Action-Based Experience Engine]]
- Implements [[Early Morning Waking Quest]]
- Relates to [[Character Dashboard & Life Gamification Platform (Wiki as Character Brain)]] (ADR-0004)
- Relates to [[Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture]] (ADR-0005)
