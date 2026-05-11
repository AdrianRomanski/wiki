# Implementation Plan: Single Library Research Workflow

## Overview

Edit `.kiro/steering/library-research.md` to add a "Single Library Workflow" section alongside the existing Comparison Workflow section. No application code changes are required — the entire implementation is a structured markdown update to the steering file.

## Tasks

- [x] 1. Add Single Library Workflow section structure to steering file
  - Insert a new top-level section "Single Library Workflow" in `.kiro/steering/library-research.md`, clearly separated from the existing Comparison Workflow section
  - Add the state machine definition: EXPLORE → PROTOTYPE → SYNTHESIZE → FINALIZE → FINALIZED, with PAUSE/CONTINUE as cross-cutting states
  - Include a state transition table listing valid transitions and the condition that triggers each
  - _Requirements: 1.1, 1.2, 1.3, 7.1_

- [x] 2. Document EXPLORE step with both scope modes
  - Add EXPLORE step documentation covering: prompting for library name and optional version/URL, scope selection (Big Picture vs Deep Dive), and focus area prompt for Deep Dive
  - Document Big Picture behavior: install library, read entry points and type definitions, generate `big-picture.md`
  - Document Deep Dive behavior: prompt for focus area, search for prior FINALIZED session for the same library, load prior context if found, generate `deep-dive-[focus-area].md`
  - Document library installation behavior: run `npm install`, handle already-installed case (report version, ask to reinstall or continue), handle installation failure (report error, allow retry)
  - Document state transition: update `session.json` state to `"PROTOTYPE"` when EXPLORE is complete
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 7.2, 7.3_

- [x] 3. Document PROTOTYPE step
  - Add PROTOTYPE step documentation covering: prompting user for a pattern or use case to prototype
  - Document Deep Dive behavior: suggest prototype ideas derived from the Deep Dive analysis before asking for user input
  - Document example generation rules: minimal code, no extra features, inline templates where applicable, clear comments, runnable as-is
  - Document that multiple prototypes can be created before advancing, each saved to `prototypes/` with a descriptive kebab-case filename
  - Document state transition: update `session.json` state to `"SYNTHESIZE"` when user indicates prototyping is complete, present list of all created prototypes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.2_

- [x] 4. Document SYNTHESIZE step
  - Add SYNTHESIZE step documentation covering: generating `findings-summary.md` from EXPLORE analysis and all prototypes
  - Document required sections in the findings summary: key strengths, known limitations, recommended patterns, gotchas to avoid, links to all session artifacts, document metadata (library name, version, scope, research date)
  - Document Deep Dive scoping: summary header must state library name and focus area; if a prior session exists, include a "Prior Context" section summarizing what was already known and what new insights were added
  - Document review loop: present findings summary to user, allow changes before advancing
  - Document state transition: update `session.json` state to `"FINALIZE"` when user approves
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 7.2_

- [x] 5. Document FINALIZE step and wiki publication decision
  - Add FINALIZE step documentation covering: present findings summary and ask user whether to publish to the wiki
  - Document what the assistant must explain before asking: which wiki pages will be created (entity page under `wiki/entities/`, concept pages under `wiki/concepts/`, source page under `wiki/sources/`)
  - Document the "decline" path: mark session `"FINALIZED"`, record `"wikiPages": []`, no wiki pages created
  - Document the "accept" path: generate entity page, one concept page per significant pattern, one source page; record all created paths in `wikiPages`
  - Document Deep Dive entity page scoping: use `wiki/entities/[library]-[focus-area].md` unless a library entity page already exists
  - Document wiki page creation failure handling: report which pages succeeded/failed, record only successful paths, offer retry, still mark session FINALIZED
  - Document finalization fields added to `session.json`: `state: "FINALIZED"`, `finalizedAt`, `wikiPages`
  - Document completion summary: display all generated artifacts and their file paths
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 7.4_

- [x] 6. Document session.json schema with new fields
  - Add or update the `session.json` schema documentation in the steering file to include all fields required by the single library workflow
  - Document required fields at creation: `id`, `topic`, `state`, `scope`, `createdAt`, `libraries` (exactly one entry), `version`, `sources`
  - Document conditional fields: `focusArea` (Deep Dive only), `priorSessionId` (when prior session found)
  - Document pause fields: `pausedAt`, `resumeFrom`
  - Document finalization fields: `finalizedAt`, `wikiPages`
  - Document allowed values for `state` (`"EXPLORE"`, `"PROTOTYPE"`, `"SYNTHESIZE"`, `"FINALIZE"`, `"PAUSED"`, `"FINALIZED"`) and `scope` (`"big-picture"`, `"deep-dive"`)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 7. Document session directory structure for both scopes
  - Add a session directory structure diagram to the steering file showing all expected files and subdirectories
  - Show Big Picture layout: `session.json`, `big-picture.md`, `findings-summary.md`, `prototypes/`
  - Show Deep Dive layout: `session.json`, `deep-dive-[focus-area].md`, `findings-summary.md`, `prototypes/`
  - Document naming rules: session-id (kebab-case), focus area filename (kebab-cased), prototype filenames (descriptive kebab-case)
  - _Requirements: 7.5_

- [x] 8. Document commands for the single library workflow
  - Add a commands reference to the steering file listing all single library workflow commands
  - Document: `explore [library]`, `deep dive [library] into [area]`, `prototype [pattern]`, `synthesize`, `finalize research`
  - Document existing session management commands as they apply to this workflow: `start research: [topic]`, `pause research`, `continue research: [session-id]`
  - _Requirements: 7.6, 7.7_

- [x] 9. Document pause and resume behavior
  - Add pause/resume documentation to the steering file covering: saving all current artifacts, updating `session.json` state to `"PAUSED"`, recording `resumeFrom` with the active step
  - Document resume behavior: read `session.json`, restore session context, resume from `resumeFrom` step, verify library still exists in `node_modules`
  - Document missing library at resume: offer to reinstall before continuing, do not change session state until user confirms
  - Document resume display: show summary of completed steps and artifacts created so far
  - Document `session.json` cleanup on resume: remove `pausedAt` and `resumeFrom`, restore `state` to the `resumeFrom` value
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 10. Final checkpoint — verify steering file completeness
  - Confirm the Single Library Workflow section is clearly separated from the Comparison Workflow section
  - Confirm all four steps are documented with inputs, outputs, and transitions
  - Confirm both scope modes are described for each step that behaves differently
  - Confirm all commands are listed
  - Confirm session directory structure is shown for both scopes
  - Confirm wiki publication decision and page types are described
  - Confirm pause/resume behavior is documented
  - Confirm `session.json` schema (including `scope`, `focusArea`, `priorSessionId`) is specified
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

## Notes

- This is a steering file edit only — no application code, no build step, no deployment
- The design has Correctness Properties, but since the implementation is a markdown document, property-based tests are not applicable; verification is manual per the design's Steering File Review Checklist
- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
