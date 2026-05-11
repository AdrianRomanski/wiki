---
title: Angular Aria Grid Pattern
type: entity
tags: [angular, accessibility, aria, grid, keyboard-navigation, selection, angular-aria, developer-preview]
sources: [angular-aria-grid-deep-dive-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Aria Grid Pattern

## Definition

The Grid is the most complex pattern in [[@angular/aria]]. It implements the [WAI-ARIA Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — a 2D composite widget where cells are individually focusable, navigable with arrow keys, and optionally selectable. It is an **interactive grid**, not a display table. Think spreadsheet, calendar, color picker, or data grid with inline editing.

Entry point: `@angular/aria/grid`

## Properties

### Directive Hierarchy

```
ngGrid                    ← Grid container (role="grid")
  └── ngGridRow           ← One row (role="row")
        └── ngGridCell    ← One cell (primary focusable unit)
              └── ngGridCellWidget  ← Interactive element inside a cell
```

Wired together via Angular DI injection tokens (`GRID_ROW`, `GRID_CELL`) — no tight coupling between directives.

### Internal Architecture — 5 Layers

```
Layer 5: Angular Directives
         Grid, GridRow, GridCell, GridCellWidget
         — DOM wiring, signal inputs, host bindings
                    ↓
Layer 4: GridPattern
         — Orchestrates all behaviors, handles all events
         — keydown, pointerdown, pointermove, pointerup, focusin, focusout
                    ↓
Layer 3: Grid<T> (generic behavior class)
         — Composes the three sub-behaviors
         — up/down/left/right/first/last/gotoCell
         — select/deselect/toggle/selectAll
                    ↓
Layer 2: GridData + GridFocus + GridNavigation + GridSelection
         — GridData:       2D coordinate map, span tracking
         — GridFocus:      active cell, tabindex, activedescendant
         — GridNavigation: arrow key movement with wrap strategies
         — GridSelection:  range selection, undo, selectAll
                    ↓
Layer 1: Shared chunks
         — _keyboard-event-manager
         — _pointer-event-manager
         — _list-navigation (reused for widget nav inside cells)
```

### GridData — The Coordinate Engine

Builds and maintains a 2D coordinate map from the flat list of cells, accounting for `rowSpan` and `colSpan`. A `colspan=2` cell occupies two coordinate slots but is one logical unit — navigation skips the phantom coordinate automatically.

Internal structures:
- `_coordsMap` — cell → primary + all spanned coordinates
- `_cellMap` — coordinate string → cell (O(1) lookup)
- `_colCountsByRow` / `_rowCountByCol` — per-axis counts

### Navigation Wrap Strategies

Independent wrap per axis (`rowWrap` and `colWrap`):

| Value | Behavior |
|---|---|
| `loop` (default) | Wraps within the same row/column |
| `continuous` | Wraps to next/previous row (spreadsheet-style linear nav) |
| `nowrap` | Stops at boundary |

### Selection System

Three independent flags:

```
enableSelection      — master switch (off by default)
multi                — allow multiple cells selected
enableRangeSelection — allow Shift+click and drag-to-select
```

Selection modes:
- `follow` — selection tracks focus automatically
- `explicit` — user must press Space or click to select

Range selection tracks a **selection anchor** cell. `GridSelection` maintains an `_undoList` so the last batch operation can be reverted.

Per-cell `selectable` input (default `true`) — setting to `false` excludes a cell from all selection operations including `selectAll()`.

### GridCellWidget — The Mode Switch

The most unique feature. When a widget inside a cell is active, **grid navigation is suspended** and keyboard events go to the widget instead.

Three widget types:

| `widgetType` | Activated by | Example |
|---|---|---|
| `simple` | Enter, F2, click | button, checkbox, link |
| `complex` | Enter, F2, click | dropdown menu, date picker |
| `editable` | Any printable char, Enter, F2, click | text input, contenteditable |

A cell can contain **multiple widgets** — arrow keys then navigate between them (using `ListNavigation` internally). `orientation` on `GridCell` controls horizontal vs vertical widget navigation. Escape always exits back to grid navigation.

`focusTarget` input on `GridCellWidget` — redirects focus to a child element instead of the widget element itself.

### ARIA Attributes — Auto-Managed

**ngGrid:**
```
role="grid"
tabindex="0" | "-1"
aria-disabled
aria-multiselectable
aria-activedescendant   ← activedescendant mode only
```

**ngGridRow:**
```
role="row"
aria-rowindex           ← when rowIndex input provided
```

**ngGridCell:**
```
role="gridcell" | "columnheader" | "rowheader"
id                      ← auto-generated, used by activedescendant
tabindex="0" | "-1"
aria-selected
aria-disabled
aria-rowindex           ← 1-based, auto-calculated
aria-colindex           ← 1-based, auto-calculated
rowspan / colspan       ← HTML attributes
aria-rowspan / aria-colspan
data-active             ← CSS styling hook
data-anchor             ← marks range selection anchor cell
```

**ngGridCellWidget:**
```
id                      ← auto-generated
tabindex="0" | "-1"
data-active
data-active-control="widget" | "cell"
```

### Keyboard Navigation

**Grid navigation:**

| Key | Action |
|---|---|
| `↑ ↓ ← →` | Move between cells (RTL-aware) |
| `Home` / `End` | First / last cell in current row |
| `Ctrl+Home` / `Ctrl+End` | First / last cell in grid |

**Selection (when `enableSelection=true`):**

| Key | Action |
|---|---|
| `Space` | Toggle selection (explicit mode) |
| `Shift+↑↓←→` | Extend range selection |
| `Shift+Space` | Select entire row |
| `Ctrl+Space` | Select entire column |
| `Ctrl+A` | Select all cells |

**Widget interaction:**

| Key | Action |
|---|---|
| `Enter` / `F2` | Activate widget (enter edit mode) |
| `Escape` | Deactivate widget (return to grid) |
| Printable char | Activates `editable` widgets immediately |

### Input Reference

**ngGrid:**

| Input | Type | Default | Description |
|---|---|---|---|
| `enableSelection` | boolean | `false` | Master selection switch |
| `multi` | boolean | `false` | Multi-cell selection |
| `enableRangeSelection` | boolean | `false` | Shift+click / drag select |
| `selectionMode` | string | `'follow'` | `'follow'` \| `'explicit'` |
| `focusMode` | string | `'roving'` | `'roving'` \| `'activedescendant'` |
| `rowWrap` | string | `'loop'` | `'continuous'` \| `'loop'` \| `'nowrap'` |
| `colWrap` | string | `'loop'` | `'continuous'` \| `'loop'` \| `'nowrap'` |
| `disabled` | boolean | `false` | Disables entire grid |
| `softDisabled` | boolean | `true` | Disabled cells still focusable |

**ngGridCell:**

| Input | Type | Default | Description |
|---|---|---|---|
| `role` | string | `'gridcell'` | `'gridcell'` \| `'columnheader'` \| `'rowheader'` |
| `rowSpan` | number | `1` | Rows this cell spans |
| `colSpan` | number | `1` | Columns this cell spans |
| `selected` | boolean | `false` | Two-way binding for selection |
| `selectable` | boolean | `true` | Participates in selection |
| `disabled` | boolean | `false` | Disables this cell |
| `orientation` | string | `'horizontal'` | Widget navigation direction |

**ngGridCellWidget:**

| Input | Type | Default | Description |
|---|---|---|---|
| `widgetType` | string | `'simple'` | `'simple'` \| `'complex'` \| `'editable'` |
| `focusTarget` | element | `undefined` | Element to focus instead of widget |
| `disabled` | boolean | `false` | Disables this widget |

### Notable Implementation Details

**`softDisabled` defaults to `true`** — unlike every other pattern. Aligns with WAI-ARIA spec: disabled cells should still be reachable so screen readers can understand the full grid structure.

**`pointermove` runs outside NgZone** — drag-to-select doesn't trigger change detection on every mouse move. Only re-enters the zone when `acceptsPointerMove()` is true (drag in progress).

**Deletion recovery** — detects when the focused cell is removed from the DOM and automatically moves focus to the nearest valid cell via `restoreFocusEffect()`.

**`data-anchor` attribute** — CSS hook to style the range selection anchor differently from other selected cells.

**`afterRenderEffect` for all DOM writes** — ensures attribute batching happens after Angular finishes rendering, not mid-render.

## Relationships

- Part of [[@angular/aria]]
- Implements [[Headless Accessibility Pattern]]
- Implements [[WAI-ARIA Grid Pattern]]
- Uses [[Angular CDK]] for bidi and ID generation
- Related to [[Choose Angular Aria Grid for Cinema Seat Selection]] (ADR)

## Examples

### Basic selectable grid

```typescript
import { Grid, GridRow, GridCell } from '@angular/aria/grid';

@Component({
  standalone: true,
  imports: [Grid, GridRow, GridCell],
  template: `
    <table ngGrid
      [enableSelection]="true"
      [multi]="true"
      [enableRangeSelection]="true"
      selectionMode="explicit"
      colWrap="continuous">

      @for (row of rows(); track $index) {
        <tr ngGridRow>
          @for (cell of row; track cell.value) {
            <td ngGridCell
              [disabled]="cell.disabled ?? false"
              [(selected)]="cell.selected">
              {{ cell.value }}
            </td>
          }
        </tr>
      }
    </table>
  `
})
export class GridDemoComponent {
  rows = signal([
    [{ value: 'A1' }, { value: 'B1' }, { value: 'C1' }],
    [{ value: 'A2' }, { value: 'B2', disabled: true }, { value: 'C2' }],
  ]);
}
```

### Cell with editable widget

```typescript
template: `
  <table ngGrid>
    <tr ngGridRow>
      <td ngGridCell>Static cell</td>
      <td ngGridCell>
        <!-- Grid nav pauses when input is active -->
        <input ngGridCellWidget
          widgetType="editable"
          [value]="cellValue()"
          (input)="cellValue.set($event.target.value)"
          (activated)="onEditStart()"
          (deactivated)="onEditEnd()" />
      </td>
    </tr>
  </table>
`
```

## References

- [[Angular Aria Grid Deep Dive 2026-05-11]]
- [[@angular/aria]]
- [[Angular CDK]]
- [[Headless Accessibility Pattern]]
- [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
