import { Component, signal, computed, WritableSignal } from '@angular/core';
import { Grid, GridRow, GridCell } from '@angular/aria/grid';

export interface Seat {
  id: string;
  row: string;
  number: number;
  occupied: boolean;
  selected: WritableSignal<boolean>;
}

export interface SeatRow {
  label: string;
  seats: Seat[];
}

@Component({
  selector: 'lib-feat-seat-selection',
  imports: [Grid, GridRow, GridCell],
  templateUrl: './feat-seat-selection.html',
  styleUrl: './feat-seat-selection.css',
})
export class FeatSeatSelection {
  readonly seatRows = signal<SeatRow[]>(this.generateSeats(8, 12));

  readonly selectedCount = computed(() =>
    this.seatRows().reduce((count, row) =>
      count + row.seats.filter(s => s.selected()).length, 0)
  );

  private generateSeats(rows: number, cols: number): SeatRow[] {
    const labels = 'ABCDEFGH';
    return Array.from({ length: rows }, (_, r) => ({
      label: labels[r],
      seats: Array.from({ length: cols }, (_, c) => ({
        id: `${labels[r]}${c + 1}`,
        row: labels[r],
        number: c + 1,
        occupied: Math.random() < 0.25,
        selected: signal(false),
      })),
    }));
  }
}
