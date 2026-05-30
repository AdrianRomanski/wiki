---
title: Angular Aria Big Picture Research — 2026-05-30
type: source
author: Kiro Research Session
date: 2026-05-30
url: https://github.com/angular/components/tree/v21.2.13/src/aria
tags: [angular, accessibility, aria, research, big-picture]
created: 2026-05-30
updated: 2026-05-30
---

# Angular Aria Big Picture Research — 2026-05-30

## Metadata

- **Author:** Kiro Research Session (`angular-aria-big-picture`)
- **Date:** 2026-05-30
- **URL:** [github.com/angular/components — src/aria @ v21.2.13](https://github.com/angular/components/tree/v21.2.13/src/aria)
- **Type:** Research session (Big Picture)
- **Session artifacts:** `.kiro/research/sessions/angular-aria-big-picture/`

## Key Points

- `@angular/aria` v21.2.13 is Angular's first-party headless accessibility library, shipping 8 sub-packages and 31 standalone directives
- The library is **headless** — zero CSS, purely behavioral. All visual styling is the consumer's responsibility
- Built **signal-native** from the ground up using `SignalLike` / `WritableSignalLike` — no `@Input()` / `@Output()` in the interaction logic
- Three-layer architecture: Angular directives → UI Pattern classes → Behavior classes
- The same `ListNavigationBehavior` powers 5 different patterns (listbox, combobox, menu, tree, toolbar)
- `DeferredContent` / `DeferredContentAware` provide lazy rendering for hidden panels and popups
- `@angular/aria/private` is used by `@angular/material` but carries no public API stability guarantee
- Root `@angular/aria` entry only exports `VERSION` — all real symbols require sub-package imports
- Hard peer dependency on `@angular/cdk` at the exact same patch version
- `ɵɵ`-prefixed re-exports are a tree-shaking workaround ([#30663](https://github.com/angular/components/issues/30663)), not a public API

## Insights

The library represents a significant architectural shift from `@angular/cdk`'s approach. Where CDK provides utilities and primitives that developers compose manually, `@angular/aria` provides complete, opinionated ARIA pattern implementations. The behavior composition system means accessibility improvements propagate automatically across all patterns that share a behavior — a compelling maintenance advantage.

The signal-native design makes this library a strong fit for Angular 17+ applications already using signals. The `SignalLike` abstraction is particularly interesting: it keeps the behavior layer framework-agnostic while still leveraging Angular's reactivity system.

The `@angular/aria/private` entry point being used by `@angular/material` suggests the Angular team intends this as the foundation for all future Material components — making it worth understanding even if you're using Material rather than building custom components.

## Relevant Entities

- [[Angular Aria]]

## Relevant Concepts

- [[Headless ARIA Directives]]
- [[UI Pattern Behavior Composition]]
- [[Deferred Content Lazy Rendering]]
- [[Signal-Native Component Inputs]]

## Session Artifacts

- Analysis: `.kiro/research/sessions/angular-aria-big-picture/big-picture.md`
- Findings summary: `.kiro/research/sessions/angular-aria-big-picture/findings-summary.md`
- Session metadata: `.kiro/research/sessions/angular-aria-big-picture/session.json`

## Sources Fetched

| File | GitHub Permalink |
|---|---|
| `src/aria/package.json` | https://github.com/angular/components/blob/v21.2.13/src/aria/package.json |
| `src/aria/accordion/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/accordion/public-api.ts |
| `src/aria/combobox/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/combobox/public-api.ts |
| `src/aria/grid/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/grid/public-api.ts |
| `src/aria/listbox/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/listbox/public-api.ts |
| `src/aria/menu/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/menu/public-api.ts |
| `src/aria/tabs/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/tabs/public-api.ts |
| `src/aria/toolbar/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/toolbar/public-api.ts |
| `src/aria/tree/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/tree/public-api.ts |
| `src/aria/private/public-api.ts` | https://github.com/angular/components/blob/v21.2.13/src/aria/private/public-api.ts |
| `src/aria/private/ui-pattern-rules.md` | https://github.com/angular/components/blob/v21.2.13/src/aria/private/ui-pattern-rules.md |
