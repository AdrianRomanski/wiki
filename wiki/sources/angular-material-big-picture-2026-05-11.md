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

- **Library:** `@angular/material`
- **Version:** 21.2.10
- **Scope:** Big Picture
- **Research date:** 2026-05-11
- **Session ID:** `angular-material-big-picture`
- **Type:** library research (node_modules analysis)
- **Raw sources:** `node_modules/@angular/material/package.json`, `node_modules/@angular/material/fesm2022/`

## Key Points

- 28 component modules, each a standalone entry point — no root barrel needed in production
- ESM only (`fesm2022/*.mjs`), `sideEffects: false` — fully tree-shakeable
- All components are standalone-compatible and OnPush
- Dual theming: M2 (SCSS palettes, legacy) and M3 (CSS custom property tokens, current default since v17)
- 8 prebuilt CSS themes for zero-config setup
- Every component ships a `[component]/testing` harness entry point
- Animations are opt-in via `MATERIAL_ANIMATIONS` token — no `BrowserAnimationsModule` required
- `@angular/cdk@21.2.10` is a hard peer dep at exact version match
- `MatOption` / `MatOptgroup` come from `@angular/material/core`, not from individual component modules
- Datepicker requires an external date adapter for real-world use (`@angular/material-luxon-adapter` or `@angular/material-date-fns-adapter`)
- No built-in virtual scroll or data grid — `MatTable` is display-only

## Insights

The library is well-architected for modern Angular: standalone, OnPush, tree-shakeable, and zoneless-ready. The main friction points are the exact CDK version lock and the M2→M3 theming migration path. For new projects, start with M3 and a prebuilt theme to avoid theming complexity entirely.

## Relevant Entities

- [[Angular Material]]
- [[Angular CDK]]

## Relevant Concepts

- [[angular-material-modular-imports]]
- [[angular-material-theming]]
- [[angular-material-testing-harnesses]]
- [[Standalone Components]]

## Session Artifacts

- `.kiro/research/sessions/angular-material-big-picture/big-picture.md`
- `.kiro/research/sessions/angular-material-big-picture/findings-summary.md`
