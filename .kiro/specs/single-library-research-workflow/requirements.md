# Requirements Document

## Introduction

The Single Library Research Workflow feature adds a structured, guided 4-step workflow to the `library-research.md` steering file for researching a single library (non-comparison mode). Currently the steering file only describes a comparison-oriented workflow with states START → RESEARCH → PROTOTYPE → COMPARE → FINALIZE. When a developer wants to deeply understand one library — without comparing it to alternatives — there is no guided step-by-step flow. This feature defines that workflow, its session states, its artifacts, and its finalization path, which ends with a decision to either publish findings to the wiki or discard them.

The workflow supports two scopes selected at session start: **Big Picture** (full library overview) and **Deep Dive** (focused analysis of a specific library area). When Deep Dive is selected, the entire session — EXPLORE analysis, prototypes, findings summary, and wiki pages — stays scoped to that area. If a prior Big Picture session exists for the same library, the Deep Dive session automatically references it as context.

## Glossary

- **Single_Library_Workflow**: The 4-step guided process for researching a single library without comparison
- **Research_Session**: A tracked research activity stored in `.kiro/research/sessions/[session-id]/` with a `session.json` file, state, and artifacts
- **Session_State**: The current step in the workflow, stored in `session.json` as the `state` field
- **Session_Scope**: The research mode chosen at session start — either `"big-picture"` or `"deep-dive"`, stored in `session.json` as the `scope` field
- **Focus_Area**: The specific part of a library targeted in a Deep Dive session (e.g., "grid pattern", "form validation"), stored in `session.json` as the `focusArea` field
- **Prior_Session**: An existing FINALIZED Research_Session for the same library, used as context when starting a Deep Dive
- **Steering_File**: The markdown file at `.kiro/steering/library-research.md` that defines research methodology and workflow instructions for the AI assistant
- **Wiki**: The `wiki/` directory containing knowledge base pages organized under `entities/`, `concepts/`, and `sources/` subdirectories
- **Wiki_Page**: A markdown file in the `wiki/` directory representing a documented entity, concept, or source
- **Research_Buddy**: The AI assistant skill invoked via `#research-buddy` that executes research workflows
- **Big_Picture**: A structured visualization of a library's exports, entry points, and capability categories derived from `node_modules`
- **Deep_Dive_Analysis**: A focused analysis of a specific library area, including its internal mechanics, edge cases, and integration patterns
- **Findings_Summary**: A markdown document capturing key insights, patterns, gotchas, and recommendations from the research session
- **EXPLORE**: The first workflow step — install the library, select scope, and generate either a Big_Picture or Deep_Dive_Analysis
- **PROTOTYPE**: The second workflow step — build minimal working examples scoped to the session's focus
- **SYNTHESIZE**: The third workflow step — consolidate findings into a summary document
- **FINALIZE**: The fourth workflow step — decide whether to publish findings to the wiki

## Requirements

### Requirement 1: Workflow State Machine Definition

**User Story:** As a developer, I want the steering file to define a clear state machine for single library research, so that the AI assistant guides me through each step in a consistent, predictable order.

#### Acceptance Criteria

1. THE Steering_File SHALL define a Single_Library_Workflow with exactly four sequential states: EXPLORE → PROTOTYPE → SYNTHESIZE → FINALIZE
2. THE Steering_File SHALL define the valid state transitions: EXPLORE transitions to PROTOTYPE, PROTOTYPE transitions to SYNTHESIZE, SYNTHESIZE transitions to FINALIZE
3. THE Steering_File SHALL define PAUSE and CONTINUE as cross-cutting states that can be applied at any step without advancing the workflow
4. WHEN a Research_Session is created for single library mode, THE Research_Buddy SHALL initialize `session.json` with `state` set to `"EXPLORE"`
5. WHEN a step is completed, THE Research_Buddy SHALL update `session.json` with the new `state` value before presenting the next step to the user
6. IF the user attempts to skip a step, THEN THE Research_Buddy SHALL confirm the skip and record the skipped state in `session.json` before advancing

### Requirement 2: EXPLORE Step — Scope Selection and Library Analysis

**User Story:** As a developer, I want the EXPLORE step to ask me whether I want a broad overview or a focused deep dive, so that the entire research session stays appropriately scoped from the start.

#### Acceptance Criteria

1. WHEN the EXPLORE step begins, THE Research_Buddy SHALL prompt the user for the library name and an optional version or documentation URL
2. WHEN the library name is provided, THE Research_Buddy SHALL ask the user to choose a Session_Scope: "Big Picture" (full library overview) or "Deep Dive" (focused on a specific area)
3. IF the user selects "Deep Dive", THEN THE Research_Buddy SHALL prompt the user to name the Focus_Area they want to investigate (e.g., "grid pattern", "form validation directives")
4. WHEN the library name is provided, THE Research_Buddy SHALL install the library to `node_modules` using `npm install` before proceeding
5. IF the library is already installed in `node_modules`, THEN THE Research_Buddy SHALL inform the user of the installed version and ask whether to reinstall or continue with the existing version
6. IF library installation fails, THEN THE Research_Buddy SHALL report the error and allow the user to correct the library name before retrying
7. WHEN the Session_Scope is "Big Picture", THE Research_Buddy SHALL generate a Big_Picture analysis by reading the library's entry points, type definitions, and exported symbols, categorized into logical groups
8. WHEN the Session_Scope is "Big Picture", THE Research_Buddy SHALL identify the main entry points, public API surface, and any peer dependencies, and save the result as `big-picture.md` in the session directory
9. WHEN the Session_Scope is "Deep Dive", THE Research_Buddy SHALL search `.kiro/research/sessions/` for any FINALIZED Prior_Session for the same library
10. IF a Prior_Session exists for the same library, THEN THE Research_Buddy SHALL load its `session.json`, `big-picture.md` (if present), and `findings-summary.md` (if present) as context, and record the Prior_Session id in the new session's `session.json` under a `priorSessionId` field
11. IF no Prior_Session exists for the same library, THEN THE Research_Buddy SHALL proceed without prior context and note this in the session
12. WHEN the Session_Scope is "Deep Dive", THE Research_Buddy SHALL generate a Deep_Dive_Analysis focused exclusively on the Focus_Area, including: internal mechanics, relevant exported symbols, edge cases, integration patterns, and any undocumented behaviors found in `node_modules`
13. WHEN the Deep_Dive_Analysis is complete, THE Research_Buddy SHALL save it as `deep-dive-[focus-area].md` in the session directory
14. WHEN the EXPLORE step is complete, THE Research_Buddy SHALL update `session.json` state to `"PROTOTYPE"` and present a summary of what was found

### Requirement 3: PROTOTYPE Step — Minimal Working Examples

**User Story:** As a developer, I want the PROTOTYPE step to guide me through building focused code examples, so that I can validate my understanding of the library through working code.

#### Acceptance Criteria

1. WHEN the PROTOTYPE step begins, THE Research_Buddy SHALL prompt the user to describe what pattern or use case they want to prototype
2. IF the Session_Scope is "Deep Dive", THEN THE Research_Buddy SHALL suggest prototype ideas derived from the Deep_Dive_Analysis of the Focus_Area before asking the user for input
3. WHEN the user provides a use case, THE Research_Buddy SHALL generate a minimal, runnable code example demonstrating that pattern
4. WHEN generating examples, THE Research_Buddy SHALL follow the minimal example principles: no extra features, inline templates where applicable, clear comments explaining each part
5. WHEN an example is created, THE Research_Buddy SHALL save it to `prototypes/` within the session directory using a descriptive filename
6. THE Research_Buddy SHALL allow the user to create multiple prototypes before advancing to the next step
7. WHEN the user indicates prototyping is complete, THE Research_Buddy SHALL update `session.json` state to `"SYNTHESIZE"` and present a list of all created prototypes

### Requirement 4: SYNTHESIZE Step — Findings Consolidation

**User Story:** As a developer, I want the SYNTHESIZE step to consolidate everything I learned into a single findings document, so that I have a clear, reusable summary of the library's strengths, weaknesses, and key patterns.

#### Acceptance Criteria

1. WHEN the SYNTHESIZE step begins, THE Research_Buddy SHALL generate a Findings_Summary by combining insights from the EXPLORE analysis and all prototypes created in the PROTOTYPE step
2. IF the Session_Scope is "Deep Dive", THEN the Findings_Summary SHALL be scoped to the Focus_Area and include a header clearly stating the library name and the specific area covered
3. IF the Session_Scope is "Deep Dive" and a Prior_Session exists, THEN the Findings_Summary SHALL include a "Prior Context" section summarizing what was already known from the Prior_Session and what new insights this Deep Dive added
4. WHEN generating the Findings_Summary, THE Research_Buddy SHALL include: key strengths, known limitations, recommended patterns, gotchas to avoid, and links to all session artifacts
5. WHEN generating the Findings_Summary, THE Research_Buddy SHALL include the library name, installed version, session scope, and research date in the document metadata
6. WHEN the Findings_Summary is generated, THE Research_Buddy SHALL save it as `findings-summary.md` in the session directory
7. WHEN the Findings_Summary is saved, THE Research_Buddy SHALL present it to the user for review
8. IF the user requests changes to the Findings_Summary, THEN THE Research_Buddy SHALL update the document before advancing
9. WHEN the user approves the Findings_Summary, THE Research_Buddy SHALL update `session.json` state to `"FINALIZE"`

### Requirement 5: FINALIZE Step — Wiki Decision and Publication

**User Story:** As a developer, I want the FINALIZE step to ask me whether to publish my findings to the wiki, so that valuable research is captured in the knowledge base without forcing publication of every exploratory session.

#### Acceptance Criteria

1. WHEN the FINALIZE step begins, THE Research_Buddy SHALL present the Findings_Summary and ask the user whether to publish the research to the wiki
2. WHEN asking about wiki publication, THE Research_Buddy SHALL explain what wiki pages will be created (entity page for the library, concept pages for key patterns, source page for the research session)
3. IF the user declines wiki publication, THEN THE Research_Buddy SHALL mark the session as `"FINALIZED"` in `session.json` without creating any wiki pages, and record `"wikiPages": []`
4. IF the user accepts wiki publication, THEN THE Research_Buddy SHALL generate wiki pages from the Findings_Summary and prototype artifacts
5. WHEN generating wiki pages, THE Research_Buddy SHALL create at minimum one entity page for the library under `wiki/entities/`
6. WHEN generating wiki pages, THE Research_Buddy SHALL create concept pages under `wiki/concepts/` for each significant pattern identified in the Findings_Summary
7. WHEN generating wiki pages, THE Research_Buddy SHALL create a source page under `wiki/sources/` documenting the research session as a reference
8. WHEN all wiki pages are created, THE Research_Buddy SHALL record the paths of all created pages in `session.json` under the `wikiPages` array
9. WHEN the session is finalized, THE Research_Buddy SHALL set `session.json` `state` to `"FINALIZED"` and record `finalizedAt` with the current date
10. WHEN finalization is complete, THE Research_Buddy SHALL display a summary listing all generated artifacts and their file paths

### Requirement 6: Session JSON Schema

**User Story:** As a developer, I want the session.json file to capture all relevant metadata for a single library research session, so that sessions can be resumed, referenced, and integrated with other tools.

#### Acceptance Criteria

1. THE Research_Buddy SHALL create `session.json` at the start of the EXPLORE step with the following required fields: `id`, `topic`, `state`, `scope`, `createdAt`, `libraries` (array with one entry), `version`, `sources`
2. WHEN the Session_Scope is "Deep Dive", THE Research_Buddy SHALL also record `focusArea` in `session.json`
3. IF a Prior_Session is found for the same library during a Deep Dive, THE Research_Buddy SHALL record its id in `session.json` under `priorSessionId`
4. WHEN the session is finalized, THE Research_Buddy SHALL add `finalizedAt` and `wikiPages` fields to `session.json`
5. THE `state` field in `session.json` SHALL only contain one of the following values: `"EXPLORE"`, `"PROTOTYPE"`, `"SYNTHESIZE"`, `"FINALIZE"`, `"PAUSED"`, `"FINALIZED"`
6. THE `scope` field in `session.json` SHALL only contain one of the following values: `"big-picture"` or `"deep-dive"`
7. THE `libraries` field SHALL contain exactly one library name for single library research sessions
8. WHEN the session is paused, THE Research_Buddy SHALL add a `pausedAt` timestamp and a `resumeFrom` field indicating which state to return to when resumed
9. WHEN the session is resumed, THE Research_Buddy SHALL remove `pausedAt` and `resumeFrom` and restore `state` to the value stored in `resumeFrom`

### Requirement 7: Steering File Integration

**User Story:** As a developer, I want the single library workflow to be documented in the steering file alongside the comparison workflow, so that the AI assistant knows how to guide me through both modes from a single reference document.

#### Acceptance Criteria

1. THE Steering_File SHALL document the Single_Library_Workflow states and transitions in a dedicated section separate from the comparison workflow
2. THE Steering_File SHALL specify the artifacts produced at each step of the Single_Library_Workflow and their expected file paths within the session directory
3. THE Steering_File SHALL describe both scope modes (Big Picture and Deep Dive) and how they affect each step of the workflow
4. THE Steering_File SHALL describe the wiki publication decision at the FINALIZE step, including the types of wiki pages to create and their target directories
5. THE Steering_File SHALL include the session directory structure for single library sessions, showing all expected files and subdirectories for both scope modes
6. WHEN a user invokes `start research: [topic]` for a single library, THE Research_Buddy SHALL follow the Single_Library_Workflow as defined in the Steering_File
7. THE Steering_File SHALL define the commands for each step: `explore [library]`, `deep dive [library] into [area]`, `prototype [pattern]`, `synthesize`, `finalize research`

### Requirement 8: Pause and Resume Support

**User Story:** As a developer, I want to pause a single library research session and resume it later without losing progress, so that I can spread research across multiple work sessions.

#### Acceptance Criteria

1. WHEN the user issues a pause command at any step, THE Research_Buddy SHALL save all current artifacts to the session directory and update `session.json` state to `"PAUSED"`
2. WHEN the session is paused, THE Research_Buddy SHALL record which step was active at the time of pause in the `resumeFrom` field of `session.json`
3. WHEN the user issues `continue research: [session-id]`, THE Research_Buddy SHALL read `session.json`, restore the session context, and resume from the step recorded in `resumeFrom`
4. WHEN resuming, THE Research_Buddy SHALL verify that the library still exists in `node_modules`
5. IF the library is missing from `node_modules` when resuming, THEN THE Research_Buddy SHALL offer to reinstall it before continuing
6. WHEN resuming, THE Research_Buddy SHALL display a summary of completed steps and artifacts created so far
