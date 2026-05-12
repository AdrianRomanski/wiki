---
title: Selection Model
type: concept
tags: [angular, cdk, state-management, multi-select, collections, table, listbox]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Selection Model

## Explanation

A Selection Model is a data structure from `@angular/cdk/collections` that tracks which items in a collection are selected. It handles single and multi-select modes, toggle, select-all, clear, and emits a `SelectionChange` event whenever the selection changes.

```typescript
class SelectionModel<T> {
  constructor(multiple?: boolean, initiallySelectedValues?: T[], emitChanges?: boolean)

  select(...values: T[]): void
  deselect(...values: T[]): void
  toggle(value: T): void
  clear(): void
  isSelected(value: T): boolean
  hasValue(): boolean
  isEmpty(): boolean
  selected: T[]           // currently selected values
  changed: Observable<SelectionChange<T>>
}
```

`SelectionChange<T>` carries `added` and `removed` arrays — useful for diffing what changed.

## Applications

- Table row checkboxes (single or multi-select)
- Listbox and option group selection
- File manager selection (click, shift-click, ctrl-click)
- Tag/chip selection
- Any UI where the user selects items from a list

## Related Concepts

- [[virtual-scrolling]] — large selectable lists often use virtual scroll
- [[list-key-manager]] — keyboard navigation and selection are often combined
- [[drag-drop]] — drag-to-select patterns can feed into a selection model

## Examples

Multi-select table checkboxes:

```typescript
import { SelectionModel } from '@angular/cdk/collections';

interface Row { id: number; name: string; }

@Component({ ... })
class TableComponent {
  rows: Row[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  selection = new SelectionModel<Row>(/* multiple */ true);

  isAllSelected() {
    return this.selection.selected.length === this.rows.length;
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.rows.forEach(r => this.selection.select(r));
    }
  }
}
```

```html
<table>
  <tr *ngFor="let row of rows">
    <td>
      <input type="checkbox"
        [checked]="selection.isSelected(row)"
        (change)="selection.toggle(row)" />
    </td>
    <td>{{ row.name }}</td>
  </tr>
</table>
```

Reacting to changes:

```typescript
this.selection.changed.subscribe(change => {
  console.log('Added:', change.added);
  console.log('Removed:', change.removed);
});
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
