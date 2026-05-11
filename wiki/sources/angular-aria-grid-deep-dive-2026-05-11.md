---
title: Angular Aria Grid Deep Dive
type: source
date: 2026-05-11
tags: [angular, accessibility, aria, grid, keyboard-navigation, selection, range-selection, angular-aria, research]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Aria Grid Deep Dive

## Metadata

- **Date**: 2026-05-11
- **Type**: research report (deep dive)
- **Raw Sources**:
  - `.kiro/research/sessions/angular-aria-overview/grid-deep-dive.md`
  - `node_modules/@angular/aria/fesm2022/grid.mjs`
  - `node_modules/@angular/aria/types/_grid-chunk.d.ts`
  - `node_modules/@angular/aria/types/grid.d.ts`
- **Version researched**: `@angular/aria` v21.2.10

## Key Points

- The Grid is the most complex pattern in `@angular/aria` — implements the WAI-ARIA Grid pattern for 2D interactive widgets
- Four directives: `ngGrid` → `ngGridRow` → `ngGridCell` → `ngGridCellWidget`, wired via DI injection tokens
- 5-layer internal architecture: Directives → GridPattern → Grid<T> → (GridData + GridFocus + GridNavigation + GridSelection) → shared chunks
- `GridData` builds a full 2D coordinate map including all spanned coordinates — foundation for span-aware navigation
- Independent wrap strategies per axis: `rowWrap` and `colWrap`, each with `continuous` / `loop` / `nowrap`
- Selection is opt-in with three flags: `enableSelection`, `multi`, `enableRangeSelection`
- `GridCellWidget` implements a "mode switch" — grid navigation pauses when a widget is active; three widget types: `simple`, `complex`, `editable`
- A cell can contain multiple widgets; arrow keys navigate between them using `ListNavigation` internally
- `softDisabled` defaults to `true` on the grid (unlike all other patterns) — aligns with WAI-ARIA spec
- `pointermove` registered outside NgZone for performance — only re-enters zone during active drag-to-select
- Built-in deletion recovery — detects when focused cell is removed from DOM and restores focus to nearest valid cell
- All DOM attribute writes batched in `afterRenderEffect` with `{ write: ... }` phase

## Insights

The `GridData` coordinate engine is the key insight. It's what makes span-aware navigation possible without the directive layer needing to know about spans at all — the pattern layer handles it transparently.

The widget mode switch is architecturally elegant: `pauseNavigation` is a signal on `GridPattern`. When true, the keydown handler routes events to the cell/widget. This means the grid and widget behaviors are fully decoupled — the grid doesn't need to know what kind of widget is inside a cell.

The `pointermove` optimization is worth noting for performance-sensitive grids: drag-to-select doesn't trigger Angular change detection on every mouse move. This is a real concern for large grids.

The `data-anchor` attribute is a subtle but useful CSS hook — it lets you style the range selection anchor cell differently from other selected cells, which is important UX for spreadsheet-style grids.

## Relevant Entities

- [[Angular Aria Grid Pattern]]
- [[@angular/aria]]
- [[Angular CDK]]

## Relevant Concepts

- [[Headless Accessibility Pattern]]
- [[WAI-ARIA Grid Pattern]]
