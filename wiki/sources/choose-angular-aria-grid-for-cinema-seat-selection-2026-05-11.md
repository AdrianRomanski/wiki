---
title: Choose Angular Aria Grid for Cinema Seat Selection
type: source
tags:
  - research
  - adr
  - decision
  - angular
  - accessibility
  - angular-aria
  - grid
  - seat-selection
created: '2026-05-11'
updated: '2026-05-11'
date: '2026-05-11'
---
# Choose Angular Aria Grid for Cinema Seat Selection

## Metadata
**Date**: 2026-05-11
**Status**: Accepted
**Raw Source**: `.kiro/research/sessions/cinema-seat-selection/decision.adr.md`

## Context
We need a cinema seat selection feature that displays a grid of chairs in a cinema room. Users must navigate seats with keyboard (arrow keys in 2D), select/deselect multiple seats, distinguish seat states (available, occupied, selected), and have full WCAG accessibility.

## Key Points
- 2D keyboard navigation (↑↓←→) is essential for seat grid
- Multi-select required for choosing multiple seats
- Disabled/occupied seats must be focusable but not selectable
- Full ARIA compliance (role="grid", aria-selected, aria-disabled)
- Custom cinema-themed styling needed (not Material Design)

## Considered Options
- [[Angular Aria]] (`@angular/aria/grid`)
- Angular Material (`@angular/material`)

## Insights
**Chosen option**: [[Angular Aria]] — `@angular/aria/grid` directives (`Grid`, `GridRow`, `GridCell`)

The WAI-ARIA Grid pattern maps directly to cinema seat selection. Angular Aria provides all interaction logic (keyboard nav, focus management, selection) with zero boilerplate. Angular Material has no 2D interactive grid component — `mat-grid-list` is layout-only.

## Comparison Matrices

### Complexity Comparison (Lower is Better)

| Criterion | Angular Aria | Angular Material |
| --- | --- | --- |
| Implementation | 2/10 | 8/10 |
| Boilerplate | 1/10 | 9/10 |
| Learning Curve | 2/10 | 6/10 |
| Edge Cases | 1/10 | 7/10 |

### Modularity Comparison (Higher is Better)

| Criterion | Angular Aria | Angular Material |
| --- | --- | --- |
| Code Organization | 9/10 | 5/10 |
| Styling Freedom | 10/10 | 4/10 |
| Reusability | 9/10 | 6/10 |

### Bundle Size Impact

| Library | Status | Impact |
| --- | --- | --- |
| @angular/aria | Already installed | None |
| @angular/material | Not installed | ~200KB+ new dependency |

### Token Usage (AI Assistance Cost)

| Phase | Angular Aria | Angular Material (est.) |
| --- | --- | --- |
| Implementation | ~800 tokens | ~4000+ tokens |
| Debugging | ~50 tokens | ~500+ tokens |
| Total | ~850 tokens | ~4500+ tokens |

## Prototype Validation

Tested with Chrome DevTools MCP:
- ✅ 8×12 seat grid renders with proper ARIA semantics
- ✅ Keyboard navigation (arrow keys, Space to select)
- ✅ Multi-select works
- ✅ Disabled seats can't be selected
- ✅ Lighthouse: 94 accessibility, 100 best practices
- ✅ Live region announces selection count

## Consequences

### Positive
- Zero accessibility boilerplate
- Full styling control for cinema theme
- No new dependencies
- Signal-based reactivity with `[(selected)]`
- Range selection available for future features

### Negative
- Developer preview (v21) — API may change
- No pre-built visual styles
- Fewer community examples than Material

## Research Context

**Research Session**: `.kiro/research/sessions/cinema-seat-selection/`

**Research Artifacts**:
- [Comparison Report](../../.kiro/research/sessions/cinema-seat-selection/comparison-report.md)
- [Test Report](../../.kiro/research/sessions/cinema-seat-selection/prototype-test-report.md)
- Prototype: `libs/feat-seat-selection/src/lib/feat-seat-selection/`

## Relevant Entities
- [[Angular Aria]]
- [[Angular CDK]]

## Relevant Concepts
- [[Keyboard Navigation]]
- [[Progressive Enhancement]]
