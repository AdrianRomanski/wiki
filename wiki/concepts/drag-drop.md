---
title: Drag and Drop
type: concept
tags: [angular, cdk, drag-drop, sorting, interaction, ux]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Drag and Drop

## Explanation

The CDK drag-and-drop system (`@angular/cdk/drag-drop`) provides directives and utilities for making elements draggable and droppable, with built-in support for list sorting and transferring items between lists.

### Key Directives

| Directive | Role |
|---|---|
| `CdkDrag` | Makes an element draggable |
| `CdkDropList` | Container that accepts dropped items; manages sort order |
| `CdkDropListGroup` | Groups multiple drop lists so items can transfer between them |
| `CdkDragHandle` | Restricts dragging to a specific handle element |
| `CdkDragPreview` | Custom preview shown while dragging |
| `CdkDragPlaceholder` | Custom placeholder shown at the drop position |

### Array Utilities

After a drop event, use these to mutate the source array:

- `moveItemInArray(array, fromIndex, toIndex)` — reorders within the same list
- `transferArrayItem(from, to, fromIndex, toIndex)` — moves item between two lists
- `copyArrayItem(from, to, fromIndex, toIndex)` — copies item to another list

### Events

`CdkDragDrop<T>` carries `previousIndex`, `currentIndex`, `item`, `container`, `previousContainer` — everything needed to update your data model.

## Applications

- Sortable task/kanban boards
- Reorderable lists (playlists, priority queues)
- File upload zones
- Dashboard widget rearrangement
- Form builder with draggable fields

## Related Concepts

- [[selection-model]] — drag-to-select patterns can combine with selection model
- [[overlay-positioning]] — drag previews use overlay-like rendering

## Examples

Sortable list:

```html
<div cdkDropList (cdkDropListDropped)="onDrop($event)">
  <div *ngFor="let item of items" cdkDrag>{{ item }}</div>
</div>
```

```typescript
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

onDrop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.items, event.previousIndex, event.currentIndex);
}
```

Transfer between two lists:

```html
<div cdkDropList #todoList="cdkDropList" [cdkDropListConnectedTo]="[doneList]"
     (cdkDropListDropped)="onDrop($event)">
  <div *ngFor="let item of todo" cdkDrag>{{ item }}</div>
</div>

<div cdkDropList #doneList="cdkDropList" [cdkDropListConnectedTo]="[todoList]"
     (cdkDropListDropped)="onDrop($event)">
  <div *ngFor="let item of done" cdkDrag>{{ item }}</div>
</div>
```

```typescript
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

onDrop(event: CdkDragDrop<string[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
}
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
