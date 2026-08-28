---
title: "ADR-0009: Firestore Time-Series XP Event Logging for Data Visualization"
type: adr
status: accepted
date: 2026-08-28
tags: [architecture, firestore, xp-engine, time-series, data-visualization, analytics, clean-architecture]
---

# ADR-0009: Firestore Time-Series XP Event Logging for Data Visualization

## Status

**Accepted**

---

## Context & Problem Statement

Building upon the Action-Based XP Engine ([ADR-0006](0006-action-based-xp-engine-and-early-wake-up-quests.md)) and Google Auth Allowlist ([ADR-0008](0008-google-auth-allowlist-and-level-1-baseline-onboarding.md)), the **Life Gamification Platform** requires historical progression data tracking.

While aggregate XP totals show a user's current character level and stat levels, they do not preserve the historical timeline of *when* or *how* XP was earned. To support rich data visualizations, interactive analytics, daily/weekly XP velocity trend graphs, stat distribution radar charts, and calendar activity heatmaps, the system must store every XP-earning event as a discrete, immutable record in Cloud Firestore with date and timestamp metadata.

---

## Decision Drivers

- **Immutable Historical Audit Log**: Write every XP-earning transaction (from daily quests, habit completions, reading logs, etc.) to Cloud Firestore as an individual event document.
- **Explicit Time-Series Metadata**: Store both calendar date (`date`: `YYYY-MM-DD`) for fast daily aggregation/filtering and exact ISO 8601 timestamp (`timestamp`) for chronological ordering.
- **Visualization First Schema**: Structure XP event logs so client-side charting libraries (Chart.js, D3.js, SVG/Canvas visualizers) can execute range queries, daily rollups, and stat distribution breakdowns directly without complex transformations.
- **Hexagonal Storage Adaptation**: Abstract event logging behind `XpEventRepositoryPort` in `libs/character/domain-models`, decoupling domain logic from Firestore SDK specifics.

---

## Technical Specifications & Data Architecture

### 1. Firestore `xp_events` Sub-Collection Schema

**Collection Path**: `users/{userId}/xp_events/{eventId}`

```typescript
export type StatType = 'STR' | 'INT' | 'WIS' | 'DIS' | 'VIT';

export type XpSourceType = 
  | 'EARLY_WAKE_UP_QUEST'
  | 'BOOK_READING_QUEST'
  | 'HABIT_COMPLETION'
  | 'KNOWLEDGE_WIKI_STREAK'
  | 'CUSTOM_ACTION';

export interface XpEventLog {
  id: string;
  userId: string;
  xpAwarded: number;
  statType: StatType;
  sourceType: XpSourceType;
  sourceId?: string;
  description: string;
  date: string;       // Format: "YYYY-MM-DD" (ideal for day-level grouping & date range filtering)
  timestamp: string;  // Format: ISO 8601 timestamp (e.g. "2026-08-28T21:40:21Z" for time-series charts)
}
```

### 2. Data Visualization Query Patterns

The `xp_events` collection supports several key data visualization features:

```text
                                  ┌──────────────────────────────┐
                                  │      xp_events Collection    │
                                  └──────────────┬───────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          ▼                                      ▼                                      ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐       ┌──────────────────────────────┐
│   Daily XP Velocity Trend    │       │   Stat Distribution Radar    │       │   Calendar Activity Heatmap  │
│  (Group by date range)       │       │   (Group by statType)        │       │   (Bucket by timestamp day)  │
└──────────────────────────────┘       └──────────────────────────────┘       └──────────────────────────────┘
```

- **Daily XP Velocity & Trend Lines**: Query by date range (`where('date', '>=', startDate).where('date', '<=', endDate)`) to aggregate cumulative and per-day XP totals.
- **Stat Distribution Radar Charts**: Group by `statType` over selected time windows to visualize stat growth balance (e.g., proportion of WIS vs DIS XP earned this month).
- **Activity Heatmap Grid**: Bucket exact `timestamp` values into calendar day matrix slots to render GitHub-style habit activity heatmaps.

---

## Considered Options

1. **Option 1: Aggregate XP Totals Only (No Event Logs)**
   - *Pros*: Low database document storage.
   - *Cons*: Impossible to build historical charts, daily velocity graphs, or activity heatmaps.

2. **Option 2: Granular Time-Series Firestore XP Event Logging (Chosen)**
   - *Pros*:
     - **Visualization Ready**: Provides rich date and timestamp data for line charts, heatmaps, and radar graphs.
     - **Auditability**: Complete history of every XP award and source.
     - **Decoupled Architecture**: Abstracted behind domain repository interfaces.
   - *Cons*: Requires creating one Firestore document per XP transaction (comfortably within Firebase free tier limits).

---

## Decision Outcome

We decided on **Option 2: Granular Time-Series Firestore XP Event Logging**.

---

## Consequences

### Positive

- **Rich Data Visualizations**: Enables daily XP velocity charts, stat growth radars, and activity heatmaps.
- **Complete Progression Audit**: Every XP gain is logged with date, timestamp, stat category, and source description.
- **Flexible Analytics**: Date-based (`YYYY-MM-DD`) and timestamp-based fields allow fast client-side aggregation.

### Negative & Trade-offs

- Document creation on every XP event requires proper indexing in Firestore.

---

## Graph Relationships & Cross References

- Implements [[Concept Name: Time-Series Progression Analytics]]
- Extends [[ADR-0006: Action-Based XP Engine and Early Wake-Up Daily Quests]]
- Extends [[ADR-0008: Google Auth Allowlist and Level 1 Baseline Character Onboarding]]
- Relates to [[ADR-0005: Cloud Infrastructure, Firebase Deployment & Firestore Data Persistence Architecture]]
- Relates to [[ADR-0004: Character Dashboard and Life Gamification Architecture]]
