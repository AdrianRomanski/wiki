---
title: Dump Projects
type: concept
tags:
  - anti-pattern
  - technical-debt
  - workspace-organization
created: 2026-05-30
updated: 2026-05-30
---

# Dump Projects

## Overview

Dump projects are an anti-pattern where code accumulates in projects with vague names (like `util` or `components`) when developers can't determine proper placement. These projects grow over time, accumulate technical debt, and eventually affect more and more of the workspace as their dependencies spread.

## Characteristics

### Vague Names
Common dump project names:
- `util` or `utils`
- `components`
- `common`
- `shared` (when used as catch-all)
- `helpers`
- `misc` or `miscellaneous`

### Unclear Purpose
- No well-defined responsibility
- Accepts any code that "doesn't fit elsewhere"
- Becomes catch-all for difficult-to-categorize code
- Purpose becomes more unclear over time

### Growing Size
- Continuously grows larger
- Accumulates unrelated functionality
- Becomes "bigger than you'd like"
- Difficult to split apart later

## How They Form

### Lack of Clear Structure
Without clear [[Workspace Structure Goals]] and [[Project Types]]:
- Developers unsure where code belongs
- No guidance for creating new projects
- Easier to add to existing project than create new one
- Decision fatigue leads to default choice

### Path of Least Resistance
- Creating new project seems like overhead
- Existing dump project "close enough"
- No enforcement of boundaries
- Short-term convenience over long-term maintainability

## Consequences

### Technical Debt Accumulation
- Unrelated code mixed together
- Difficult to understand project purpose
- Hard to refactor or split apart
- Grows harder to fix over time

### Increased CI Time
- Many projects depend on dump project
- Changes affect large portions of workspace
- More tasks run than necessary
- Unpredictable task graphs

### Slower Development
- Difficult to locate specific functionality
- Large files and directories to navigate
- Unclear what belongs where
- Merge conflicts more frequent

### Broken Virtuous Cycle
Dump projects break the [[Virtuous Cycle]]:
- Purpose becomes unclear
- Naming doesn't help location
- Changes scattered across project
- Purpose further degraded

## Prevention

### Clear Project Types
Define and enforce [[Project Types]]:
- Feature, UI, data-access, utility
- Each with specific purpose
- Clear guidelines for what belongs where
- Reduces ambiguity

### Naming Conventions
Use [[Scope-Type-Identifier Naming]]:
- Forces specific, descriptive names
- Encodes purpose in name
- Makes vague names obvious
- Encourages proper categorization

### Module Boundary Rules
Enforce [[Module Boundary Rules]]:
- Prevents inappropriate dependencies
- Makes dump projects less useful
- Encourages proper structure
- Automated through linting

### Workspace Generators
Provide tools to create projects easily:
- Reduces friction of creating new project
- Ensures consistent structure
- Applies correct tags
- Makes proper placement easier than dumping

## Remediation

### Identify Dump Projects
Look for:
- Projects with vague names
- Projects larger than expected
- Projects with many dependents
- Projects with unrelated functionality

### Analyze Contents
- Categorize code by actual purpose
- Identify natural groupings
- Determine proper [[Project Types]]
- Plan split strategy

### Refactor Gradually
- Create properly-named projects
- Move code in small batches
- Update imports incrementally
- Validate with tests
- Use [[Nx]] refactoring tools

### Prevent Recurrence
- Document what went wrong
- Update guidelines
- Add linting rules
- Create workspace generators
- Train team on proper structure

## Related Concepts

- [[Virtuous Cycle]] - Positive pattern that dump projects break
- [[Project Types]] - Clear categorization preventing dump projects
- [[Workspace Structure Goals]] - Goals that dump projects violate
- [[Scope-Type-Identifier Naming]] - Naming convention preventing vague names
- [[Module Boundary Rules]] - Enforcement reducing dump project utility

## Related Entities

- [[Nx]] - Tool providing features to prevent and remediate dump projects

## Sources

- [[The virtuous cycle of workspace structure]] - Identifies dump projects as anti-pattern and consequence of poor structure
