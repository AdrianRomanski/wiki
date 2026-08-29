---
title: "ADR-0010: Daily Course Progression, Authenticated Web Scraping Ingestion, and Action-Based Learning Architecture"
type: adr
status: accepted
date: 2026-08-29
tags: [architecture, gamification, courses, web-scraping, browser-automation, daily-quests, intelligence-xp, wisdom-xp, discipline-xp, firestore, clean-architecture]
---

# ADR-0010: Daily Course Progression, Authenticated Web Scraping Ingestion, and Action-Based Learning Architecture

## Status

**Accepted**

---

## Context & Problem Statement

Building upon the Character Dashboard ([ADR-0004](0004-character-dashboard-and-life-gamification-architecture.md)), Action-Based XP Engine ([ADR-0006](0006-action-based-xp-engine-and-early-wake-up-quests.md)), Book Reading Daily Quests ([ADR-0007](0007-book-reading-daily-quest-and-reading-log.md)), and Time-Series XP Event Logging ([ADR-0009](0009-firestore-time-series-xp-event-logging-for-data-visualization.md)), the **Life Gamification Platform** requires support for structured online course learning.

Modern high-value technical courses reside on authenticated platforms (e.g. Frontend Masters, Coursera, Udemy, specialized engineering platforms, private learning portals). These platforms host heterogeneous learning assets: video lessons, transcripts, slides, code sandboxes, and hands-on exercises/labs.

Manual entry of course curricula is slow and prone to omission. Furthermore, automated scripts cannot bypass authentication walls, SSO, multi-factor authentication (2FA), or CAPTCHAs without complex credential storage risks.

To achieve frictionless ingestion, deep learning retention, and habit reinforcement, the system requires:
1. **Authenticated Web Scraping with Human-in-the-Loop (HITL) Login**: The AI agent launches an interactive browser session. The user logs in manually through the browser interface (safely handling credentials, OAuth, SSO, and 2FA). Once authenticated, the agent automatically scrapes the entire course curriculum, video transcripts, metadata, and exercises.
2. **Discrete Modality Decomposition (Video vs. Exercise)**: Automatically parsing the curriculum into modules with items separated by type: **Video/Lecture** items and **Practical Exercise/Lab** items.
3. **Action-Based XP Reward Engine**: Granular, non-arbitrary XP payouts awarded for every verified action (watching a video, completing an exercise, completing modules).
4. **Daily Course Progression & Quest Integration**: Active courses surface as daily learning quests on the character dashboard, driving consistent daily study habits and maintaining learning streaks.

---

## Decision Drivers

- **Zero-Credential Risk via Human-in-the-Loop (HITL) Login**: The agent never stores, prompts for, or handles raw user passwords. It launches the browser, pauses for the user to authenticate manually, and resumes when authenticated.
- **Automated Web Scraping Execution**: Once authenticated, the agent traverses the curriculum DOM tree, extracting section modules, lesson titles, video durations, transcripts/captions, and exercise instructions.
- **Strict Modality Decomposition**: Explicitly distinguish conceptual content (**Videos / Lectures**) from active application (**Exercises / Coding Tasks / Labs**) to support distinct pedagogical paths and targeted stat development (INT, WIS, DIS).
- **Zero Arbitrary XP Rule**: XP is awarded strictly upon explicit action completion (e.g., marking a video finished with study notes, submitting exercise completion).
- **Time-Series Historical Logging**: Every course action completion logs an immutable record in `users/{userId}/xp_events` following [ADR-0009](0009-firestore-time-series-xp-event-logging-for-data-visualization.md) for analytics, daily velocity charts, and stat radars.
- **Hexagonal Architecture Decoupling**: Domain models and quest calculation logic reside in `libs/character/domain-models`, isolated from UI frameworks and Firestore storage adapters.

---

## Technical Specifications & Architecture

### 1. Ingestion Pipeline & Agent Workflow

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          1. User Initiates Course Ingestion                            │
│           (User provides target course URL, e.g., platform course syllabus)            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        2. Agent Launches Interactive Browser                           │
│                 (Navigates to login page via Chrome DevTools MCP)                      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        3. User Performs Manual Authentication                          │
│               (User logs in with SSO / 2FA / Password directly in browser)              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       4. Agent Resumes Autonomous Web Scraping                         │
│               - Traverses course curriculum tree and TOC accordions                    │
│               - Extracts module names, lesson titles, and video durations              │
│               - Scrapes video transcripts, captions, and slide links                   │
│               - Identifies & extracts exercise prompts, labs, starter repositories     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         5. Semantic Decomposition & Storage                            │
│                 - Normalizes data into `Course` domain schema                          │
│                 - Categorizes items into `video` vs `exercise`                         │
│                 - Persists to Cloud Firestore (`courses/{courseId}`)                   │
│                 - Initializes user tracking in `users/{userId}/course_progress`        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Domain Models (`libs/character/domain-models`)

```typescript
export type CourseItemType = 'video' | 'exercise';

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'archived';

export interface CourseItem {
  id: string;
  moduleId: string;
  title: string;
  type: CourseItemType;
  order: number;
  durationMinutes?: number;      // Extracted for video lessons
  sourceUrl?: string;             // Direct URL to lesson/video on the platform
  transcriptText?: string;        // Scraped transcript/captions text
  exercisePrompt?: string;        // Instructions for hands-on exercises/labs
  starterRepoUrl?: string;        // Link to starter repo / sandbox if present
  solutionUrl?: string;           // Link to reference solutions if present
  statRewards: {
    statType: StatType;           // INT, WIS, or DIS
    xp: number;
  }[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  items: CourseItem[];
}

export interface Course {
  id: string;
  title: string;
  instructor?: string;
  platform: string;              // e.g., "Frontend Masters", "Coursera", "Udemy", "Custom Portal"
  sourceUrl: string;             // Base URL of the course
  totalVideos: number;
  totalExercises: number;
  estimatedHours: number;
  modules: CourseModule[];
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

export interface CourseItemProgress {
  itemId: string;
  completed: boolean;
  completedAt?: string;          // ISO 8601
  notes?: string;
  xpAwarded: number;
}

export interface UserCourseProgress {
  userId: string;
  courseId: string;
  status: CourseStatus;
  startedAt?: string;
  completedAt?: string;
  lastStudiedAt?: string;
  completedItemIds: string[];
  itemProgress: Record<string, CourseItemProgress>;
  currentModuleId?: string;
  currentItemId?: string;
  totalXpEarned: number;
}
```

---

### 3. Action-Based XP Reward Matrix

Every completed course action grants explicit, calibrated XP:

| Action Type | Condition / Verification | Base XP Award | Target Stat Attributes |
|---|---|---|---|
| **Video Lecture Completed** | Mark video finished with optional learning notes | **+30 XP** | **+25 INT**, **+5 WIS** |
| **Hands-On Exercise Completed** | Solve/complete practical lab or coding exercise | **+50 XP** | **+35 INT**, **+15 DIS** |
| **Module Completion Milestone** | All items within a module completed | **+100 XP** | **+70 INT**, **+30 DIS** |
| **Full Course Completion Bonus** | 100% of videos and exercises completed | **+500 XP** | **+300 INT**, **+100 WIS**, **+100 DIS** |
| **Daily Course Quest Objective** | Complete at least 1 video or 1 exercise in a calendar day | **+20 Daily Quest Bonus** | **+10 DIS**, **+10 INT** |

---

### 4. Firestore Database Architecture

**Course Definitions Collection**:
- Path: `courses/{courseId}` (Global or per-workspace catalog)

**User Course Progress Collection**:
- Path: `users/{userId}/course_progress/{courseId}`

**Daily Study Log & Time-Series Event Integration**:
- Every item completion writes an entry to `users/{userId}/xp_events/{eventId}`:
  - `sourceType`: `'COURSE_PROGRESSION'`
  - `sourceId`: `courseId` / `itemId`
  - `statType`: `'INT'` | `'WIS'` | `'DIS'`
  - `date`: `YYYY-MM-DD`
  - `timestamp`: `ISO 8601`

---

## Daily Quest & Character Dashboard Integration

The Character Dashboard ([ADR-0004](0004-character-dashboard-and-life-gamification-architecture.md)) displays an **Active Course Progress Card**:
1. **Current Course & Next Up**: Displays the currently active course with direct links to the next uncompleted Video or Exercise.
2. **Daily Study Quest Progress**: Indicates whether the daily learning quota (e.g. 1 video or 1 exercise) was met today.
3. **Module Breakdown & Progress Bar**: Interactive accordion view showing module-by-module breakdown with distinct icons for videos (🎥) and exercises (💻 / 🛠️).
4. **Action Check-In Modal**: Quick modal to mark items as complete, enter reflection notes/takeaways, and immediately trigger XP particle animations.

---

## Considered Options

1. **Option 1: Manual Web UI Form Entry Only**
   - *Pros*: Simple CRUD without browser automation.
   - *Cons*: Extremely burdensome for users to input 50+ video lessons, durations, transcripts, and exercises manually.

2. **Option 2: Headless Scraping with Stored Credentials**
   - *Pros*: Fully autonomous without human intervention.
   - *Cons*: Security hazard; breaks on 2FA/SSO/CAPTCHA; violates credential safety practices.

3. **Option 3: Human-in-the-Loop Browser Login + Autonomous Agent Web Scraping (Chosen)**
   - *Pros*:
     - **Maximum Security**: User maintains 100% control over credentials and 2FA; agent never touches passwords.
     - **Frictionless Ingestion**: Agent extracts 100% of curriculum, video metadata, transcripts, and exercises in minutes.
     - **Pedagogical Balance**: Clear distinction between conceptual absorption (Videos $\rightarrow$ INT/WIS) and practical application (Exercises $\rightarrow$ INT/DIS).
     - **Habit Reinforcement**: Integrates seamlessly with Daily Quests and time-series XP analytics.
   - *Cons*: Requires user to complete the initial login step in the launched browser session.

---

## Decision Outcome

We decided on **Option 3: Human-in-the-Loop Browser Login + Autonomous Agent Web Scraping**.

### Architectural Changes

1. **Domain Models (`libs/character/domain-models`)**:
   - Create `course.model.ts` defining `Course`, `CourseModule`, `CourseItem`, `UserCourseProgress`, and `evaluateCourseItemCompletion()`.
   - Update `xp-event.model.ts` to include `'COURSE_PROGRESSION'` in `XpSourceType`.

2. **Agent Scraping & Ingestion Tooling**:
   - Leverage `chrome-devtools-mcp` (or browser subagent) to:
     - Launch interactive browser window to course URL.
     - Await manual user login confirmation.
     - Scrape syllabus hierarchy, video durations, transcripts, and exercise instructions.
     - Ingest structured JSON directly into Cloud Firestore.

3. **Data Access Layer (`libs/character/data-access`)**:
   - Implement `CourseRepositoryPort` and Firestore adapter for course catalog and user progress tracking.
   - Implement `CourseStateService` with reactive Angular Signals (`activeCourses`, `currentCourseProgress`, `completeItem`).

4. **UI Dashboard Layer (`libs/character/feature-dashboard`)**:
   - Add **Daily Course Progression Quest Card**.
   - Add **Course Curriculum Viewer Component** (differentiating videos vs exercises).
   - Add **Course Item Completion Modal**.

---

## Consequences

### Positive

- **Frictionless Ingestion**: Entire courses from authenticated platforms are ingested with accurate metadata, transcripts, and exercise prompts in minutes.
- **Secure by Design**: Zero handling or storage of user credentials by AI agents.
- **Balanced Skill Growth**: Rewards both theoretical learning (INT/WIS) and hands-on coding practice (INT/DIS).
- **Gamified Consistency**: Daily course quests and streak tracking encourage persistent learning habits.
- **Full Historical Visibility**: Every completed lesson and lab is logged into time-series analytics for visual trend tracking.

### Negative & Trade-offs

- Requires user to be present for the initial manual login step in the browser.
- Web scraping relies on LMS DOM structures which may vary across platforms, requiring robust heuristic parser rules.

---

## Graph Relationships & Cross References

- Implements [[Concept Name: Action-Based Learning & Skill Gamification]]
- Extends [[ADR-0004: Character Dashboard and Life Gamification Architecture]]
- Extends [[ADR-0006: Action-Based XP Engine and Early Wake-Up Daily Quests]]
- Extends [[ADR-0007: Book Reading Daily Quest, Active Reading Shelf, and Monthly Reading Archive]]
- Relates to [[ADR-0009: Firestore Time-Series XP Event Logging for Data Visualization]]
- Relates to [[ADR-0003: Model Context Protocol (MCP) Server for AI Agent Integration]]
