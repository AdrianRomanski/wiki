---
title: Angular Aria
type: entity
tags: [angular, accessibility, aria, component-library, headless, signals]
sources: [angular-aria-big-picture-2026-05-30]
created: 2026-05-30
updated: 2026-05-30
---

# Angular Aria

## Definition

`@angular/aria` is Angular's first-party library for building **fully accessible, headless UI components** that conform to the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/). It lives in the `angular/components` monorepo alongside `@angular/cdk` and `@angular/material`, published as a separate npm package.

The library is **headless** — it provides zero CSS and handles only ARIA semantics, keyboard interactions, and focus management. All visual styling is left to the consumer.

## Properties

- **Version:** 21.2.13 (latest stable as of 2026-05-30)
- **Repository:** https://github.com/angular/components (`src/aria/`)
- **npm:** `@angular/aria`
- **Architecture:** Three-layer — Angular directives → UI Pattern classes → Behavior classes
- **Reactivity:** Signal-native (`SignalLike` / `WritableSignalLike` throughout)
- **Module system:** Standalone-only, no NgModules
- **Styling:** None — fully headless
- **Peer dependencies:** `@angular/cdk` (exact version match), `@angular/core` `^21 || ^22`

### Sub-packages & Exported Directives

| Import path | Key directives | ARIA pattern |
|---|---|---|
| `@angular/aria/accordion` | `AccordionGroup`, `AccordionPanel`, `AccordionTrigger`, `AccordionContent` | Disclosure / Accordion |
| `@angular/aria/combobox` | `Combobox`, `ComboboxInput`, `ComboboxPopup`, `ComboboxDialog`, `ComboboxPopupContainer` | Combobox |
| `@angular/aria/grid` | `Grid`, `GridRow`, `GridCell`, `GridCellWidget` | Grid |
| `@angular/aria/listbox` | `Listbox`, `Option` | Listbox |
| `@angular/aria/menu` | `Menu`, `MenuBar`, `MenuItem`, `MenuTrigger`, `MenuContent` | Menu / Menubar |
| `@angular/aria/tabs` | `Tabs`, `TabList`, `Tab`, `TabPanel`, `TabContent` | Tabs |
| `@angular/aria/toolbar` | `Toolbar`, `ToolbarWidget`, `ToolbarWidgetGroup` | Toolbar |
| `@angular/aria/tree` | `Tree`, `TreeItem`, `TreeItemGroup` | Tree View |

> The root `@angular/aria` entry only exports `VERSION`. Always import from sub-packages.

## Relationships

- Built on top of [[Angular CDK]] (overlay, a11y utilities)
- Implements [[Headless ARIA Directives]] pattern
- Uses [[UI Pattern Behavior Composition]] architecture internally
- Uses [[Deferred Content Lazy Rendering]] for panels and popups
- Inputs use [[Signal-Native Component Inputs]] via `SignalLike` / `WritableSignalLike`
- `@angular/material` builds on `@angular/aria/private` for its accessible components

## Examples

```ts
// Import from sub-packages, never from the root
import { Listbox, Option } from '@angular/aria/listbox';
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';

@Component({
  standalone: true,
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  template: `
    <div cdkTabs>
      <div cdkTabList>
        <button cdkTab>Overview</button>
        <button cdkTab>Details</button>
      </div>
      <div cdkTabPanel>Overview content</div>
      <div cdkTabPanel>Details content</div>
    </div>
  `
})
export class MyTabsComponent {}
```

## References

- [[Angular Aria Big Picture Research — 2026-05-30]]
