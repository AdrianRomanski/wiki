---
title: Angular CDK
type: entity
tags: [angular, cdk, component-toolkit, accessibility, overlay, drag-drop, virtual-scroll, testing]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Angular CDK

## Definition

The Angular Component Dev Kit (`@angular/cdk`) is a set of headless, unstyled behavior primitives and utilities for building Angular UI components. It provides the low-level building blocks that Angular Material is built on, but is fully usable independently for any design system or component library.

Version researched: **21.2.10**

## Properties

- **Fully tree-shakeable** — `sideEffects: false`; import only the entry points you need
- **Zero visual opinions** — no styles shipped by default (CSS prebuilts are opt-in)
- **22 named entry points** — each independently importable
- **~300+ public symbols** across all entry points
- **Layered architecture** — higher-level packages (`overlay`, `dialog`, `menu`) build on lower-level ones (`portal`, `scrolling`, `a11y`)

### Entry Points

| Entry Point | Purpose |
|---|---|
| `@angular/cdk/a11y` | Focus management, live regions, key managers, input modality |
| `@angular/cdk/accordion` | Expandable accordion primitives |
| `@angular/cdk/bidi` | Bidirectional text (LTR/RTL) |
| `@angular/cdk/clipboard` | Clipboard read/write |
| `@angular/cdk/coercion` | Type coercion helpers for Angular inputs |
| `@angular/cdk/collections` | Data sources, selection models, view repeaters |
| `@angular/cdk/dialog` | Accessible modal dialog primitives |
| `@angular/cdk/drag-drop` | Drag-and-drop with sorting and list transfer |
| `@angular/cdk/keycodes` | Keyboard key code constants |
| `@angular/cdk/layout` | Responsive breakpoint observation |
| `@angular/cdk/listbox` | ARIA listbox pattern |
| `@angular/cdk/menu` | ARIA menu/menubar/context-menu pattern |
| `@angular/cdk/observers` | DOM mutation and content observation |
| `@angular/cdk/overlay` | Floating panels with flexible positioning |
| `@angular/cdk/platform` | Browser/platform detection |
| `@angular/cdk/portal` | Dynamic content projection |
| `@angular/cdk/scrolling` | Virtual scrolling and scroll utilities |
| `@angular/cdk/stepper` | Multi-step wizard primitives |
| `@angular/cdk/table` | Data table with sticky header/column support |
| `@angular/cdk/testing` | Component harness testing infrastructure |
| `@angular/cdk/text-field` | Textarea autoresize and autofill detection |
| `@angular/cdk/tree` | Tree view (flat and nested) |

### Peer Dependencies

| Package | Required Version |
|---|---|
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/common` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/platform-browser` | `^21.0.0 \|\| ^22.0.0` |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` |

## Relationships

- Used by [[angular-material|Angular Material]] as its foundational layer
- Implements [[list-key-manager]] pattern for keyboard navigation
- Implements [[focus-trap]] for modal accessibility
- Implements [[live-announcer]] for screen reader announcements
- Implements [[overlay-positioning]] for floating UI
- Implements [[component-portal]] for dynamic content injection
- Implements [[virtual-scrolling]] for large data sets
- Implements [[selection-model]] for multi-select state
- Implements [[drag-drop]] for sortable lists
- Implements [[component-harness]] for UI testing

## Examples

```typescript
// Import only what you need — never from the root barrel
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Overlay } from '@angular/cdk/overlay';
import { SelectionModel } from '@angular/cdk/collections';
import { moveItemInArray } from '@angular/cdk/drag-drop';
```

## References

- [[angular-cdk-big-picture-2026-05-12]]
