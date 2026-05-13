---
title: Mat Table DataSource
type: concept
tags: [angular, angular-material, table, data-display, sorting, pagination, filtering]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Mat Table DataSource

## Explanation

`MatTable` is a layout primitive — it renders rows and columns but has no built-in sorting, pagination, or filtering. `MatTableDataSource<T>` is the glue layer that connects the table to `MatSort`, `MatPaginator`, and a filter string. It manages the data pipeline: filter → sort → paginate → render.

The wiring must happen in `ngAfterViewInit` because `@ViewChild` references are not available until after the view is initialized.

## Applications

- Displaying tabular data with client-side sort, filter, and pagination
- Connecting `MatSort` headers to data ordering
- Connecting `MatPaginator` to slice the data set
- Applying a text filter across all string fields

## Related Concepts

- [[Per-Module Imports]]
- [[Injection Token Configuration]]

## Examples

### Full wiring — table + sort + paginator + filter
```ts
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';

interface User { name: string; age: number; }

@Component({
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field>
      <input matInput (input)="applyFilter($event)" placeholder="Filter" />
    </mat-form-field>

    <mat-table [dataSource]="dataSource" matSort>
      <ng-container matColumnDef="name">
        <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
        <mat-cell *matCellDef="let row">{{ row.name }}</mat-cell>
      </ng-container>

      <ng-container matColumnDef="age">
        <mat-header-cell *matHeaderCellDef mat-sort-header>Age</mat-header-cell>
        <mat-cell *matCellDef="let row">{{ row.age }}</mat-cell>
      </ng-container>

      <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
      <mat-row *matRowDef="let row; columns: displayedColumns"></mat-row>
      <tr class="mat-row" *matNoDataRow>No data matching filter.</tr>
    </mat-table>

    <mat-paginator [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
  `
})
export class UserTableComponent implements AfterViewInit {
  displayedColumns = ['name', 'age'];
  dataSource = new MatTableDataSource<User>([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    // Must wire in ngAfterViewInit — ViewChild refs not available earlier
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    // Reset to first page after filtering
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
}
```

### Gotchas

- `matSort` directive must be on the `<mat-table>` element — not a wrapper div
- `matColumnDef` is required on every `<ng-container>` — missing it causes a runtime error
- `MatSort` and `MatPaginator` modules must be imported alongside `MatTableModule`
- For server-side data, skip `MatTableDataSource` and implement a custom `DataSource<T>` using `@angular/cdk/table`

## References

- [[Angular Material]]
- [[Angular Material Big Picture Research — 2026-05-11]]
