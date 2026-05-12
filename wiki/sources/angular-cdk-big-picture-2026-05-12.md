---
title: Angular CDK Big Picture Research — 2026-05-12
type: source
date: 2026-05-12
tags: [angular, cdk, research, big-picture, accessibility, overlay, drag-drop, virtual-scroll, testing]
created: 2026-05-12
updated: 2026-05-12
---

# Angular CDK Big Picture Research — 2026-05-12

## Metadata

- **Library**: `@angular/cdk`
- **Version**: `21.2.10`
- **Scope**: Big Picture
- **Research date**: `2026-05-12`
- **Session ID**: `angular-cdk-big-picture`
- **Type**: Library source code analysis

## Key Points

- `@angular/cdk` exposes 22 named entry points and ~300+ public symbols; fully tree-shakeable (`sideEffects: false`)
- Three tiers: Behavior Primitives (a11y, drag-drop, overlay, dialog, menu, listbox, stepper, accordion, tree, table), Utilities (coercion, keycodes, platform, bidi, layout, observers, clipboard, text-field, collections), and Infrastructure (portal, scrolling, testing)
- The `a11y` package is the most comprehensive accessibility toolkit in the Angular ecosystem — covers 4 key manager strategies, focus trapping, live regions, input modality detection, and high contrast mode
- `overlay` builds on `portal` + `scrolling`; `dialog` builds on `overlay`; `menu` builds on `overlay` + `a11y` — the layered architecture is intentional and each layer is independently usable
- `@angular/cdk/testing` provides a harness framework used by Angular Material itself — environment-agnostic, works with TestBed and Selenium WebDriver
- No built-in variable-height virtual scroll — requires custom `VirtualScrollStrategy`
- `_` prefixed exports are internal API and can change without semver notice
- `coerceBooleanProperty` treats the string `"false"` as `true` — a common gotcha

## Insights

The CDK is best understood as three layers: accessibility primitives, UI behavior primitives, and infrastructure plumbing. Teams building design systems should start with `a11y`, `overlay`, and `portal` as their core dependencies, then add `drag-drop`, `table`, or `scrolling` as needed. The testing harness framework is underutilized — it's production-proven and significantly improves test stability.

## Relevant Entities

- [[angular-cdk]]

## Relevant Concepts

- [[list-key-manager]]
- [[focus-trap]]
- [[live-announcer]]
- [[overlay-positioning]]
- [[component-portal]]
- [[virtual-scrolling]]
- [[selection-model]]
- [[drag-drop]]
- [[component-harness]]

## Session Artifacts

- `.kiro/research/sessions/angular-cdk-big-picture/session.json`
- `.kiro/research/sessions/angular-cdk-big-picture/big-picture.md`
- `.kiro/research/sessions/angular-cdk-big-picture/findings-summary.md`
