---
title: Angular Aria Big Picture
type: source
date: 2026-05-11
tags: [angular, accessibility, aria, angular-aria, headless, research]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Aria Big Picture

## Metadata

- **Date**: 2026-05-11
- **Type**: research report
- **Raw Source**: `.kiro/research/sessions/angular-aria-overview/report.md`
- **Version researched**: `@angular/aria` v21.2.10

## Key Points

- `@angular/aria` is Angular's official headless accessibility library — part of the Angular Components monorepo alongside Angular Material and CDK
- Ships 8 interaction patterns, each a separate tree-shakeable entry point: accordion, listbox, menu, tabs, tree, grid, toolbar, combobox
- All patterns are `@developerPreview` since Angular v21; Angular roadmap plans to promote to stable
- Every directive follows a 3-layer architecture: Angular Directive → UIPattern (plain TS) → shared behavior chunks
- Fully signal-based API — `InputSignal`, `ModelSignal`, `Signal` — compatible with zoneless Angular
- Two focus strategies across all patterns: `roving` (tabindex moves) and `activedescendant` (container keeps focus)
- Two selection strategies: `follow` (tracks focus) and `explicit` (Space/Enter to select)
- Two disabled levels: `disabled` (skipped in nav) and `softDisabled` (focusable but inactive)
- Lazy content rendering via `ng-template` + deferred content for hidden panels and menus
- Combobox is a meta-pattern that composes Listbox or Tree with an input

## Insights

The library sits between CDK (low-level primitives) and Angular Material (styled components). It gives teams the accessibility correctness of Material without the visual constraints — the right choice when a custom design system is required.

The signal-first API means the library is fully compatible with zoneless Angular and OnPush change detection from day one. No zone.js dependency in the interaction logic.

The `softDisabled` concept is important for accessibility: disabled items that are still focusable allow screen reader users to discover the full structure of a widget, even if they can't interact with every item.

## Relevant Entities

- [[@angular/aria]]
- [[Angular CDK]]
- [[Angular Aria Grid Pattern]]

## Relevant Concepts

- [[Headless Accessibility Pattern]]
- [[Keyboard Navigation]]
- [[Progressive Enhancement]]
