import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { XpEvent } from '@wiki/character-domain-models';

@Component({
  selector: 'character-xp-analytics-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="xp-analytics-drawer-container">
      <button
        type="button"
        class="drawer-toggle-header"
        (click)="isOpen.set(!isOpen())"
        [attr.aria-expanded]="isOpen()"
      >
        <div class="toggle-title">
          <span class="drawer-icon">📊</span>
          <strong>Time-Series XP Audit Log</strong>
          <span class="count-badge">{{ totalEventsCount() }} Total Events</span>
        </div>
        <div class="toggle-action">
          <span class="toggle-label">{{ isOpen() ? 'Hide Audit Log' : 'View Audit Log' }}</span>
          <span class="toggle-arrow">{{ isOpen() ? '▴' : '▾' }}</span>
        </div>
      </button>

      @if (isOpen()) {
        <div class="drawer-body">
          @if (recentEvents().length === 0) {
            <p class="empty-events-note">
              No XP events logged yet. Complete quests to record time-series progression data!
            </p>
          } @else {
            <ul class="xp-events-list">
              @for (evt of recentEvents(); track evt.id) {
                <li class="xp-event-item">
                  <span class="stat-tag" [class]="'stat-' + evt.statType.toLowerCase()">
                    {{ evt.statType }}
                  </span>
                  <div class="event-details">
                    <span class="event-desc">{{ evt.description }}</span>
                    <div class="event-meta">
                      <span class="event-source">{{ evt.sourceType }}</span>
                      <span class="event-time">{{ evt.date }} • {{ evt.timestamp | date: 'shortTime' }}</span>
                    </div>
                  </div>
                  <span class="xp-amount-tag">+{{ evt.xpAwarded }} XP</span>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .xp-analytics-drawer-container {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(52, 211, 153, 0.2);
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .drawer-toggle-header {
      width: 100%;
      background: none;
      border: none;
      color: #f1f5f9;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;

      &:hover {
        background: rgba(52, 211, 153, 0.08);
      }

      .toggle-title {
        display: flex;
        align-items: center;
        gap: 10px;

        .drawer-icon { font-size: 1.1rem; }
        .count-badge {
          font-size: 0.75rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
        }
      }

      .toggle-action {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #34d399;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    .drawer-body {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .empty-events-note {
      color: #64748b;
      font-size: 0.8rem;
      margin: 0;
      text-align: center;
    }

    .xp-events-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .xp-event-item {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 12px;

        .stat-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 4px;
          text-transform: uppercase;

          &.stat-int { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
          &.stat-wis { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
          &.stat-dis { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
          &.stat-str { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        }

        .event-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .event-desc {
            font-size: 0.85rem;
            color: #f1f5f9;
          }

          .event-meta {
            display: flex;
            gap: 8px;
            font-size: 0.7rem;
            color: #94a3b8;
          }
        }

        .xp-amount-tag {
          font-size: 0.8rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 8px;
          border-radius: 6px;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpAnalyticsDrawerComponent {
  readonly recentEvents = input<XpEvent[]>([]);
  readonly totalEventsCount = input<number>(0);

  readonly isOpen = signal<boolean>(false);
}
