# @angular/aria Grid — Deep Dive Report

> Source: `node_modules/@angular/aria` v21.2.10  
> Entry point: `@angular/aria/grid`  
> Status: `@developerPreview 21.0`

---

## 1. What the Grid Pattern Is

The Grid is the most complex pattern in `@angular/aria`. It implements the [WAI-ARIA Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), which is a 2D composite widget — a table-like structure where cells are individually focusable, navigable with arrow keys, and optionally selectable.

It is NOT a data table for display only. It is an **interactive grid** — think spreadsheet, calendar, color picker, or data grid with inline editing.

```
┌──────────────────────────────────────────────────────────────────┐
│  role="grid"  (ngGrid)                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  role="row"  (ngGridRow)                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │  │
│  │  │ gridcell │  │ gridcell │  │ gridcell │  (ngGridCell)   │  │
│  │  │          │  │ [widget] │  │          │  (ngGridCell    │  │
│  │  │          │  │(ngGrid   │  │          │   Widget)       │  │
│  │  └──────────┘  └──────────┘  └──────────┘                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  role="row"  (ngGridRow)                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │  │
│  │  │ gridcell │  │ gridcell │  │ gridcell │                 │  │
│  │  └──────────┘  └──────────┘  └──────────┘                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Directive Hierarchy

Four directives, strictly nested:

```
ngGrid                    ← Grid container
  └── ngGridRow           ← One row
        └── ngGridCell    ← One cell (primary focusable unit)
              └── ngGridCellWidget  ← Interactive element inside a cell
```

Injection tokens wire them together without tight coupling:

```typescript
GRID_ROW  = new InjectionToken('GRID_ROW')   // GridRow provides itself
GRID_CELL = new InjectionToken('GRID_CELL')  // GridCell provides itself
```

`GridRow` injects `Grid` directly. `GridCell` injects `GRID_ROW`. `GridCellWidget` injects `GRID_CELL`. This creates a clean parent-child chain via DI.

---

## 3. Internal Architecture — 5 Behavior Layers

The grid is the most layered pattern in the library. From bottom to top:

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 5: Angular Directives (Grid, GridRow, GridCell,           │
│           GridCellWidget)                                        │
│           — DOM wiring, signal inputs, host bindings             │
│                          ↓                                       │
│  Layer 4: GridPattern                                            │
│           — Orchestrates all behaviors, handles events           │
│           — Owns: keydown, pointerdown, pointermove, pointerup   │
│           — Owns: focusin, focusout                              │
│                          ↓                                       │
│  Layer 3: Grid<T> (generic behavior class)                       │
│           — Composes the three sub-behaviors below               │
│           — Exposes: up/down/left/right/first/last/gotoCell      │
│           — Exposes: select/deselect/toggle/selectAll            │
│                          ↓                                       │
│  Layer 2: GridData + GridFocus + GridNavigation + GridSelection  │
│           — GridData:      2D coordinate map, span tracking      │
│           — GridFocus:     active cell, tabindex, activedesc.    │
│           — GridNavigation: arrow key movement with wrap         │
│           — GridSelection: range selection, undo, selectAll      │
│                          ↓                                       │
│  Layer 1: Shared chunks                                          │
│           — _keyboard-event-manager                              │
│           — _pointer-event-manager                               │
│           — _list-navigation (reused for widget nav in cells)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. GridData — The Coordinate Engine

`GridData` is the foundation. It builds and maintains a 2D coordinate map from the flat list of `GridCellPattern` objects, accounting for `rowSpan` and `colSpan`.

```
Logical grid (3×3 with a spanning cell):

  col:  0       1       2
row 0: [A]     [B]     [C]
row 1: [D colspan=2]   [E]
row 2: [F]     [G]     [H]

GridData maps:
  cell D → primary coords {row:1, col:0}
           spanned coords  [{row:1,col:0}, {row:1,col:1}]
  coords {row:1, col:1} → cell D  (same cell, different entry point)
```

Key internal structures:
- `_coordsMap` — cell → primary + all spanned coordinates
- `_cellMap` — coordinate string → cell (for O(1) lookup)
- `_colCountsByRow` — per-row column count
- `_rowCountByCol` — per-column row count

This is what makes span-aware navigation possible — when you press `→` from a spanning cell, the navigation engine knows to skip the spanned coordinates.

---

## 5. GridNavigation — Wrap Strategies

Navigation is 2D with independent wrap strategies per axis.

### rowWrap (vertical axis)

```
┌──────────────────────────────────────────────────────────────────┐
│  rowWrap="continuous"                                            │
│  ─────────────────────                                           │
│  ↓ from last row → jumps to first row (same column)             │
│  ↑ from first row → jumps to last row (same column)             │
│                                                                  │
│  rowWrap="loop"  (default)                                       │
│  ──────────────────────────                                      │
│  ↓ from last row → stays at last row                            │
│  ↑ from first row → stays at first row                          │
│                                                                  │
│  rowWrap="nowrap"                                                │
│  ────────────────                                                │
│  Navigation stops at boundary, no wrap at all                   │
└──────────────────────────────────────────────────────────────────┘
```

### colWrap (horizontal axis) — same three options

```
┌──────────────────────────────────────────────────────────────────┐
│  colWrap="continuous"                                            │
│  ─────────────────────                                           │
│  → from last col → jumps to first col of NEXT row               │
│  ← from first col → jumps to last col of PREVIOUS row           │
│  (spreadsheet-style linear navigation)                           │
│                                                                  │
│  colWrap="loop"  (default)                                       │
│  ──────────────────────────                                      │
│  → from last col → wraps to first col of SAME row               │
│  ← from first col → wraps to last col of SAME row               │
│                                                                  │
│  colWrap="nowrap"                                                │
│  ────────────────                                                │
│  Navigation stops at column boundary                            │
└──────────────────────────────────────────────────────────────────┘
```

The `peek()` method lets the navigation engine look ahead without moving focus — used internally to determine if a move is valid before committing.

---

## 6. Selection System

Selection is opt-in and has three independent flags:

```
enableSelection   — master switch, off by default
multi             — allow multiple cells selected simultaneously
enableRangeSelection — allow Shift+click and drag-to-select
```

### Selection Modes

```
┌──────────────────────────────────────────────────────────────────┐
│  selectionMode="follow"                                          │
│  ──────────────────────                                          │
│  Selection tracks focus. Moving to a cell selects it.           │
│  Good for: single-select grids, calendar date pickers           │
│                                                                  │
│  selectionMode="explicit"                                        │
│  ────────────────────────                                        │
│  User must press Space or click to select.                       │
│  Good for: multi-select data grids, spreadsheets                │
└──────────────────────────────────────────────────────────────────┘
```

### Range Selection

When `enableRangeSelection=true`, the grid tracks a **selection anchor**:

```
1. User clicks cell A → anchor set to A, A selected
2. User Shift+clicks cell D → range A→D selected
3. User Shift+↓ → range extends by one row
4. Ctrl+A → selectAll()
5. Undo → reverts last selection operation
```

The `GridSelection` class maintains an `_undoList` — a list of cells changed in the last operation — so `undo()` can revert exactly the last batch change.

### Per-Cell Selectability

Each cell has a `selectable` input (default `true`). Setting it to `false` excludes that cell from selection operations entirely, even when `selectAll()` is called.

---

## 7. GridCellWidget — The "Mode Switch"

This is the most unique feature of the grid pattern. A cell can contain interactive widgets (inputs, buttons, menus). When a widget is active, **grid navigation is suspended** and keyboard events go to the widget instead.

```
Normal mode:
  Arrow keys → move between cells
  Enter/F2   → activate widget (enter "edit mode")

Widget active mode:
  Arrow keys → handled by the widget (e.g. move cursor in input)
  Escape     → deactivate widget, return to grid navigation
```

### Three Widget Types

```
┌──────────────────────────────────────────────────────────────────┐
│  widgetType="simple"                                             │
│  ──────────────────                                              │
│  Activated by: Enter, F2, or click                              │
│  Example: button, checkbox, link                                 │
│  Behavior: single interaction, no internal navigation            │
│                                                                  │
│  widgetType="complex"                                            │
│  ───────────────────                                             │
│  Activated by: Enter, F2, or click                              │
│  Example: dropdown menu, date picker inside a cell              │
│  Behavior: has its own keyboard navigation while active          │
│                                                                  │
│  widgetType="editable"                                           │
│  ─────────────────────                                           │
│  Activated by: any printable character, Enter, F2, or click     │
│  Example: text input, contenteditable                            │
│  Behavior: typing immediately starts editing                     │
└──────────────────────────────────────────────────────────────────┘
```

### Multiple Widgets Per Cell

A cell can contain multiple widgets. When it does, the cell enters a **widget navigation mode** — arrow keys move between widgets within the cell (using `ListNavigation` internally), and Escape exits back to grid navigation.

```
Cell with 3 widgets:
  [btn1] [btn2] [btn3]

  Enter → activate widget navigation
  ← → → move between btn1, btn2, btn3
  Escape → exit widget navigation, back to grid
```

The `orientation` input on `GridCell` controls whether widget navigation is horizontal or vertical.

### focusTarget

`GridCellWidget` has a `focusTarget` input — an `ElementRef` or `HTMLElement` that receives focus instead of the widget element itself. Useful when the widget is a wrapper and the actual focusable element is a child.

---

## 8. ARIA Attributes — Auto-Managed

### On `ngGrid`

```
role="grid"                          ← static, always set
tabindex="0" or "-1"                 ← managed by GridFocus
aria-disabled="true|false"           ← when grid is disabled
aria-multiselectable="true"          ← when multi=true + enableSelection=true
aria-activedescendant="[cell-id]"    ← only in activedescendant focusMode
```

### On `ngGridRow`

```
role="row"                           ← static, always set
aria-rowindex="[1-based number]"     ← set when rowIndex input provided
```

### On `ngGridCell`

```
role="gridcell"                      ← default (or "columnheader"/"rowheader")
id="ng-grid-cell-[n]"               ← auto-generated, used by activedescendant
tabindex="0" or "-1"                 ← managed by GridFocus
aria-selected="true|false"           ← when enableSelection=true
aria-disabled="true|false"           ← when cell is disabled
aria-rowindex="[1-based]"            ← 1-based, auto-calculated from GridData
aria-colindex="[1-based]"            ← 1-based, auto-calculated from GridData
rowspan / colspan                    ← HTML attributes, mirrors rowSpan/colSpan
aria-rowspan / aria-colspan          ← ARIA equivalents, also set
data-active="true|false"             ← for CSS styling hooks
data-anchor="true|undefined"         ← marks the range selection anchor cell
```

### On `ngGridCellWidget`

```
id="ng-grid-cell-widget-[n]"        ← auto-generated
tabindex="0" or "-1"                 ← managed by widget navigation
data-active="true|false"             ← for CSS styling hooks
data-active-control="widget|cell"    ← indicates what currently has control
```

---

## 9. Event Handling

The grid handles 5 event types on the container, plus `pointermove` (registered outside Angular zone for performance):

```
keydown      → _pattern.onKeydown($event)
pointerdown  → _pattern.onPointerdown($event)
pointerup    → _pattern.onPointerup($event)
focusin      → _pattern.onFocusIn($event)
focusout     → _pattern.onFocusOut($event)

pointermove  → registered via addEventListener (passive, outside NgZone)
               only fires when _pattern.acceptsPointerMove() is true
               (i.e. during drag-to-select)
```

The `pointermove` optimization is notable — it avoids triggering Angular change detection on every mouse move. It only runs inside `ngZone.run()` when the user is actively dragging to select.

### Deletion Recovery

The grid has special logic for when rows or cells are deleted while a cell has focus:

```
_maybeDeletion  ← set on focusout (might be deletion)
_deletion       ← confirmed on next render if active cell is gone
restoreFocusEffect() ← moves focus to nearest valid cell after deletion
```

---

## 10. Lifecycle Effects

The grid uses `afterRenderEffect` (not `effect`) for all DOM side effects — this ensures they run after Angular has finished rendering:

```typescript
afterRenderEffect(() => this._pattern.setDefaultStateEffect());
  // Sets initial active cell before first focus

afterRenderEffect(() => this._pattern.resetStateEffect());
  // Resets active state if cells changed (stale state)

afterRenderEffect(() => this._pattern.resetFocusEffect());
  // Syncs tabindex to active cell element

afterRenderEffect(() => this._pattern.restoreFocusEffect());
  // Recovers focus after row/cell deletion

afterRenderEffect(() => this._pattern.focusEffect());
  // Moves DOM focus when active cell changes
```

`GridCell` uses `afterRenderEffect` with `{ write: ... }` phase to batch all attribute writes (role, id, rowspan, colspan, aria-*, tabindex, data-*) in a single render pass.

---

## 11. Complete Input Reference

### ngGrid

```
enableSelection     boolean   false      Master switch for selection
multi               boolean   false      Allow multi-cell selection
enableRangeSelection boolean  false      Allow Shift+click / drag select
selectionMode       string    'follow'   'follow' | 'explicit'
focusMode           string    'roving'   'roving' | 'activedescendant'
rowWrap             string    'loop'     'continuous' | 'loop' | 'nowrap'
colWrap             string    'loop'     'continuous' | 'loop' | 'nowrap'
disabled            boolean   false      Disables entire grid
softDisabled        boolean   true       Disabled cells still focusable
```

### ngGridRow

```
rowIndex            number    undefined  Override 1-based row index for aria
```

### ngGridCell

```
id                  string    auto       Overrides auto-generated id
role                string    'gridcell' 'gridcell' | 'columnheader' | 'rowheader'
rowSpan             number    1          Rows this cell spans
colSpan             number    1          Columns this cell spans
rowIndex            number    undefined  Override row index
colIndex            number    undefined  Override column index
disabled            boolean   false      Disables this cell
selected            boolean   false      Two-way binding for selection state
selectable          boolean   true       Whether cell participates in selection
orientation         string    'horizontal' Widget navigation direction
wrap                boolean   true       Widget navigation wraps
tabindex            number    undefined  Override tabindex
```

### ngGridCellWidget

```
id                  string    auto       Overrides auto-generated id
widgetType          string    'simple'   'simple' | 'complex' | 'editable'
disabled            boolean   false      Disables this widget
focusTarget         element   undefined  Element to focus instead of widget
tabindex            number    undefined  Override tabindex
```

### ngGridCellWidget Outputs

```
activated    FocusEvent | KeyboardEvent | undefined   Widget entered active mode
deactivated  FocusEvent | KeyboardEvent | undefined   Widget exited active mode
```

---

## 12. Keyboard Navigation Reference

### Grid-level navigation

```
↑               Move to cell above
↓               Move to cell below
←               Move to cell left (RTL-aware)
→               Move to cell right (RTL-aware)
Home            First cell in current row
End             Last cell in current row
Ctrl+Home       First cell in grid
Ctrl+End        Last cell in grid
```

### Selection shortcuts (when enableSelection=true)

```
Space           Toggle selection of active cell (explicit mode)
Shift+↑↓←→      Extend range selection
Shift+Space     Select entire row
Ctrl+Space      Select entire column
Ctrl+A          Select all cells
Ctrl+Shift+Home Select from active cell to first cell
Ctrl+Shift+End  Select from active cell to last cell
```

### Widget interaction

```
Enter / F2      Activate widget in cell (enter edit mode)
Escape          Deactivate widget (return to grid navigation)
[printable key] Activates editable widgets immediately
```

---

## 13. Minimal Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { Grid, GridRow, GridCell } from '@angular/aria/grid';

interface Cell {
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-grid-demo',
  standalone: true,
  imports: [Grid, GridRow, GridCell],
  template: `
    <table ngGrid
      [enableSelection]="true"
      [multi]="true"
      [enableRangeSelection]="true"
      selectionMode="explicit"
      colWrap="continuous">

      @for (row of rows(); track row) {
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
    [{ value: 'A3' }, { value: 'B3' }, { value: 'C3' }],
  ]);
}
```

### With inline widget (editable cell)

```typescript
template: `
  <table ngGrid>
    <tr ngGridRow>
      <td ngGridCell>
        Static cell
      </td>
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

---

## 14. Key Design Insights

**Span-aware navigation** — `GridData` builds a full coordinate map including all spanned cells. Navigation skips spanned coordinates automatically, so a `colspan=2` cell is treated as one logical unit.

**Widget mode is a navigation pause, not a focus trap** — when a widget is active, the grid's `pauseNavigation` signal is true. The grid's keydown handler checks this and routes events to the cell/widget instead. Escape always exits back to grid navigation.

**`softDisabled` defaults to `true`** — unlike other patterns where it defaults to `false`. This means disabled cells are focusable by default in a grid, which aligns with the WAI-ARIA grid spec (disabled cells should still be reachable for screen reader users to understand the grid structure).

**Deletion recovery is built-in** — the grid detects when the focused cell is removed from the DOM and automatically moves focus to the nearest valid cell. This is critical for grids with dynamic row/cell removal.

**`pointermove` runs outside NgZone** — drag-to-select doesn't trigger change detection on every pixel of mouse movement. It only re-enters the zone when `acceptsPointerMove()` is true (i.e. a drag is in progress).

**`data-anchor` attribute** — marks the range selection anchor cell. This is a CSS hook so you can style the anchor differently from other selected cells (e.g. a darker border to show where the range started).

---

## Sources

- `node_modules/@angular/aria/fesm2022/grid.mjs` — compiled directive implementation
- `node_modules/@angular/aria/types/_grid-chunk.d.ts` — full pattern layer types
- `node_modules/@angular/aria/types/grid.d.ts` — public directive API
- [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
