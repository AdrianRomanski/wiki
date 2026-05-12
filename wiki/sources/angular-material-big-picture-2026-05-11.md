---
title: Angular Material Big Picture Research — 2026-05-11
type: source
date: 2026-05-11
tags: [angular, angular-material, component-library, material-design, research]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material Big Picture Research — 2026-05-11

## Metadata

- **Library**: `@angular/material`
- **Version**: 21.2.10
- **Scope**: Big Picture
- **Research date**: 2026-05-11
- **Type**: Library research session
- **Session ID**: `angular-material-big-picture`
- **Sources used**:
  - `node_modules/@angular/material/package.json`
  - `node_modules/@angular/material/types/*.d.ts`

## Key Points

- Angular Material v21 ships **35 component modules** covering form controls, navigation, layout, data display, overlays, and shared primitives
- **ESM only** — `fesm2022/` bundles, no CommonJS main entry
- **`@angular/cdk` must match at the exact patch version** — `21.2.10`; any mismatch causes runtime errors
- **Material Design 3 by default** in v21; M2 still supported via SCSS theming but on a deprecation path
- **8 prebuilt CSS themes** — 4 M2 classics + 4 new M3 themes
- Every component ships a `/testing` entry with `ComponentHarness` subclasses
- All components are standalone-compatible — no NgModule wrappers required
- Every configurable default is overridable via `InjectionToken`
- **New in v21**: `MatTimepicker` — fills a long-standing gap, shares the date adapter with `MatDatepicker`
- `MatTable` is a layout primitive — sorting, pagination, and filtering must be wired manually via `MatTableDataSource`, `MatSort`, and `MatPaginator`
- `MatFormFieldControl<T>` enables custom inputs to integrate fully into `<mat-form-field>`

## Insights

- The root barrel import (`@angular/material`) should be avoided in production — always import per-module for tree-shaking
- The SCSS-only theming system means projects using plain CSS must use a prebuilt theme; there is no CSS custom property API at the application level
- The `@angular/cdk` exact version coupling is the most common source of upgrade pain — always update both packages together
- Chip variants (`MatChipListbox`, `MatChipGrid`, `MatChipSet`) have different accessibility roles and are not interchangeable — choice depends on use case
- `MatSort` must be placed on the `<mat-table>` element itself, not a wrapper — a common silent failure

## Relevant Entities

- [[Angular Material]]

## Relevant Concepts

- [[Per-Module Imports]]
- [[Injection Token Configuration]]
- [[Material Testing Harnesses]]
- [[Mat Table DataSource]]
- [[Custom Form Field Control]]

## Session Artifacts

- `.kiro/research/sessions/angular-material-big-picture/session.json`
- `.kiro/research/sessions/angular-material-big-picture/big-picture.md`
- `.kiro/research/sessions/angular-material-big-picture/findings-summary.md`
