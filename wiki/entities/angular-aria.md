---
title: "@angular/aria"
type: entity
tags: [angular, accessibility, aria, headless, component-library, angular-aria, developer-preview]
sources: [angular-aria-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# @angular/aria

## Definition

`@angular/aria` is Angular's official **headless accessibility library** — part of the Angular Components monorepo (same repo as [[Angular CDK]] and Angular Material). It ships WAI-ARIA-compliant interaction patterns with zero styling. You own the markup and CSS; the library owns keyboard behavior and ARIA attribute management.

Version: `21.2.10` · Status: `@developerPreview` since Angular v21

## Properties

### Core Philosophy

```
You provide:              Library provides:
─────────────             ──────────────────
HTML structure      →     Keyboard navigation
CSS styling         →     ARIA attributes
Business logic      →     Focus management
                    →     Screen reader support
                    →     RTL support
```

### Position in the Angular Ecosystem

```
Angular Material  (styled, opinionated)
       ↑ built on
@angular/aria     (headless interaction patterns)
       ↑ uses primitives from
Angular CDK       (overlay, drag-drop, a11y, portal…)
       ↑ built on
@angular/core
```

### The 8 Interaction Patterns

Each is a separate, tree-shakeable entry point:

| Entry Point | Pattern | Use Cases |
|---|---|---|
| `/accordion` | Expandable sections | FAQ, collapsible panels |
| `/listbox` | Single/multi-select list | Option pickers, multi-select |
| `/menu` | Dropdown menus + menu bar | Context menus, nav menus |
| `/tabs` | Tabbed content panels | Settings, content sections |
| `/tree` | Hierarchical data | File explorer, org chart |
| `/grid` | 2D interactive grid | Spreadsheet, data grid, calendar |
| `/toolbar` | Grouped action widgets | Editor toolbar, action bar |
| `/combobox` | Input + popup | Autocomplete, select, multiselect |

### Cross-Cutting Features

All patterns share these capabilities:

- **Focus strategies**: `roving` (tabindex moves) or `activedescendant` (container keeps focus)
- **Selection strategies**: `follow` (tracks focus) or `explicit` (Space/Enter to select)
- **Disabled levels**: `disabled` (skipped in nav) or `softDisabled` (focusable but inactive)
- **Lazy rendering**: `ng-template` + deferred content for hidden panels/menus
- **Signal-first API**: all inputs are `InputSignal`, state is `Signal`, two-way via `ModelSignal`
- **RTL support**: built-in via `@angular/cdk/bidi`

### Internal Architecture

Every directive follows the same 3-layer structure:

```
Angular Directive
  └── UIPattern (plain TS class — the actual logic)
        └── Shared behavior chunks
              ├── _keyboard-event-manager
              ├── _pointer-event-manager
              ├── _list-navigation
              ├── _list-typeahead
              ├── _deferred-content
              └── _expansion
```

## Relationships

- Part of the same monorepo as [[Angular CDK]] and Angular Material
- Depends on `@angular/cdk` for bidi, a11y primitives, and ID generation
- The [[Angular Aria Grid Pattern]] is the most complex pattern in this library
- Implements [[Headless Accessibility Pattern]]
- Related to [[WAI-ARIA Grid Pattern]] and other WAI-ARIA APG patterns

## Examples

### Basic Listbox

```typescript
import { Listbox, Option } from '@angular/aria/listbox';

@Component({
  standalone: true,
  imports: [Listbox, Option],
  template: `
    <ul ngListbox [(values)]="selected" [multi]="true">
      @for (item of items; track item.id) {
        <li ngOption [value]="item.id" [label]="item.name">
          {{ item.name }}
        </li>
      }
    </ul>
  `
})
export class MyListboxComponent {
  selected = signal<string[]>([]);
  items = [{ id: '1', name: 'Option A' }, { id: '2', name: 'Option B' }];
}
```

### Basic Tabs

```typescript
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';

@Component({
  standalone: true,
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  template: `
    <div ngTabs>
      <ul ngTabList [(selectedTab)]="activeTab">
        <li ngTab value="a">Tab A</li>
        <li ngTab value="b">Tab B</li>
      </ul>
      <div ngTabPanel value="a">
        <ng-template ngTabContent>Content A</ng-template>
      </div>
      <div ngTabPanel value="b">
        <ng-template ngTabContent>Content B</ng-template>
      </div>
    </div>
  `
})
export class MyTabsComponent {
  activeTab = signal<string | undefined>('a');
}
```

## References

- [[Angular Aria Big Picture 2026-05-11]]
- [[Angular CDK]]
- [[Angular Aria Grid Pattern]]
- [[Headless Accessibility Pattern]]
