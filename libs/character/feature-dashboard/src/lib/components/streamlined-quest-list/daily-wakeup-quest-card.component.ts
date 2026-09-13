import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  EarlyWakeupEvaluation,
  WakeupSlotConfig,
} from '@wiki/character-domain-models';

@Component({
  selector: 'character-daily-wakeup-quest-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-quest-card wakeup-quest-card">
      <div class="quest-card-header">
        <span class="quest-badge wakeup-badge">Daily Quest</span>
        <h3>🌅 Early Morning Waking Quest</h3>
      </div>
      <p class="quest-desc">
        Wake up early and click once to claim your Discipline XP! Zero forms, zero friction.
      </p>

      <div class="status-banner" [class]="'status-banner slot-' + evaluation().slot">
        <div class="time-display">
          <span class="time-label">Current Time:</span>
          <span class="time-value">{{ formattedTime() }}</span>
        </div>
        <div class="evaluation-info">
          <span class="tier-tag">{{ evaluation().tierName }}</span>
          @if (evaluation().xpAmount > 0) {
            <span class="xp-potential">
              +{{ evaluation().xpAmount }} DIS XP Available
            </span>
          } @else {
            <span class="xp-potential expired">
              0 XP (Outside Window)
            </span>
          }
        </div>
      </div>

      <div class="slot-matrix">
        @for (slot of timeSlots(); track slot.slot) {
          <div class="matrix-item" [class.active]="evaluation().slot === slot.slot">
            <span class="slot-time">{{ slot.label }}</span>
            <span class="slot-xp">+{{ slot.xpReward }} XP</span>
          </div>
        }
        <div
          class="matrix-item expired-item"
          [class.active]="evaluation().slot === 'EXPIRED' || evaluation().slot === 'TOO_EARLY'"
        >
          <span class="slot-time">Later (7:30+)</span>
          <span class="slot-xp">0 XP</span>
        </div>
      </div>

      <div class="claim-action-area">
        <button
          type="button"
          class="claim-btn"
          [disabled]="claimedToday() || !evaluation().canClaim || evaluation().xpAmount <= 0"
          (click)="claimRequested.emit()"
        >
          @if (claimedToday()) {
            ✔ Claimed for Today
          } @else if (evaluation().xpAmount > 0) {
            ⚡ Claim +{{ evaluation().xpAmount }} DIS XP Now
          } @else {
            ⏰ Waking Window Expired (0 XP)
          }
        </button>

        @if (claimMessage(); as msg) {
          <div
            class="claim-feedback"
            [class.success]="msg.includes('🎉')"
            [class.error]="msg.includes('❌') || msg.includes('⚠️')"
          >
            {{ msg }}
          </div>
        }
      </div>

      <div class="simulation-collapsible">
        <button
          type="button"
          class="toggle-sim-btn"
          (click)="isSimOpen.set(!isSimOpen())"
          [attr.aria-expanded]="isSimOpen()"
        >
          <span>🧪 Time Simulator (Demo Controls) {{ isSimOpen() ? '▴' : '▾' }}</span>
        </button>

        @if (isSimOpen()) {
          <div class="sim-controls-panel">
            <div class="sim-buttons">
              <button
                type="button"
                class="sim-btn"
                [class.active]="simulatedHour() === 5 && simulatedMinute() === 10"
                (click)="setSimulatedTimeRequested.emit({ hour: 5, minute: 10 })"
              >
                05:10 AM (+100 XP)
              </button>
              <button
                type="button"
                class="sim-btn"
                [class.active]="simulatedHour() === 5 && simulatedMinute() === 45"
                (click)="setSimulatedTimeRequested.emit({ hour: 5, minute: 45 })"
              >
                05:45 AM (+80 XP)
              </button>
              <button
                type="button"
                class="sim-btn"
                [class.active]="simulatedHour() === 6 && simulatedMinute() === 15"
                (click)="setSimulatedTimeRequested.emit({ hour: 6, minute: 15 })"
              >
                06:15 AM (+60 XP)
              </button>
              <button
                type="button"
                class="sim-btn"
                [class.active]="simulatedHour() === 6 && simulatedMinute() === 45"
                (click)="setSimulatedTimeRequested.emit({ hour: 6, minute: 45 })"
              >
                06:45 AM (+40 XP)
              </button>
              <button
                type="button"
                class="sim-btn"
                [class.active]="simulatedHour() === 7 && simulatedMinute() === 15"
                (click)="setSimulatedTimeRequested.emit({ hour: 7, minute: 15 })"
              >
                07:15 AM (+20 XP)
              </button>
              <button
                type="button"
                class="sim-btn expired-btn"
                [class.active]="simulatedHour() === 8 && simulatedMinute() === 30"
                (click)="setSimulatedTimeRequested.emit({ hour: 8, minute: 30 })"
              >
                08:30 AM (0 XP)
              </button>
            </div>

            @if (simulatedHour() !== null) {
              <div class="sim-footer">
                <button
                  type="button"
                  class="reset-sim-btn"
                  (click)="resetSimulationRequested.emit()"
                >
                  🔄 Reset to Real Local Time
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .wakeup-quest-card {
      background: rgba(18, 24, 38, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s ease;
    }

    .quest-card-header {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .quest-badge.wakeup-badge {
        align-self: flex-start;
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #f8fafc;
      }
    }

    .quest-desc {
      color: #94a3b8;
      font-size: 0.85rem;
      line-height: 1.4;
      margin: 0;
    }

    .status-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 16px;

      &.slot-EARLY_BIRD {
        border-color: rgba(52, 211, 153, 0.4);
        background: rgba(16, 185, 129, 0.1);
      }
      &.slot-DISCIPLINE_MASTER {
        border-color: rgba(59, 130, 246, 0.4);
        background: rgba(59, 130, 246, 0.1);
      }
      &.slot-RISING_WARRIOR {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.1);
      }

      .time-display {
        display: flex;
        flex-direction: column;

        .time-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .time-value {
          font-size: 1.15rem;
          font-weight: 700;
          color: #f8fafc;
        }
      }

      .evaluation-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;

        .tier-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: #fbbf24;
          text-transform: uppercase;
        }

        .xp-potential {
          font-size: 0.95rem;
          font-weight: 700;
          color: #34d399;

          &.expired {
            color: #ef4444;
          }
        }
      }
    }

    .slot-matrix {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;

      @media (max-width: 650px) {
        grid-template-columns: repeat(3, 1fr);
      }

      .matrix-item {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 6px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        transition: all 0.2s;

        .slot-time {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .slot-xp {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fbbf24;
        }

        &.active {
          border-color: #fbbf24;
          background: rgba(245, 158, 11, 0.15);

          .slot-time { color: #f8fafc; }
          .slot-xp { color: #fef08a; }
        }

        &.expired-item {
          .slot-xp { color: #ef4444; }
          &.active {
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
          }
        }
      }
    }

    .claim-action-area {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .claim-btn {
        width: 100%;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border: none;
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
        }

        &:disabled {
          background: rgba(51, 65, 85, 0.6);
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }
      }

      .claim-feedback {
        font-size: 0.85rem;
        padding: 8px 12px;
        border-radius: 8px;
        text-align: center;

        &.success {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        &.error {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      }
    }

    .simulation-collapsible {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 10px;

      .toggle-sim-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        padding: 2px 0;
        text-align: left;
        transition: color 0.2s;

        &:hover {
          color: #cbd5e1;
        }
      }

      .sim-controls-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px;

        .sim-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;

          .sim-btn {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
            padding: 6px 4px;
            border-radius: 6px;
            font-size: 0.7rem;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              border-color: #fbbf24;
              color: #ffffff;
            }

            &.active {
              background: rgba(245, 158, 11, 0.25);
              border-color: #fbbf24;
              color: #fbbf24;
              font-weight: 700;
            }

            &.expired-btn.active {
              background: rgba(239, 68, 68, 0.2);
              border-color: #ef4444;
              color: #f87171;
            }
          }
        }

        .sim-footer {
          display: flex;
          justify-content: flex-end;

          .reset-sim-btn {
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #94a3b8;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            cursor: pointer;

            &:hover {
              color: #ffffff;
              border-color: #ffffff;
            }
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyWakeupQuestCardComponent {
  readonly evaluation = input.required<EarlyWakeupEvaluation>();
  readonly formattedTime = input.required<string>();
  readonly claimedToday = input<boolean>(false);
  readonly timeSlots = input<WakeupSlotConfig[]>([]);
  readonly claimMessage = input<string | null>(null);
  readonly simulatedHour = input<number | null>(null);
  readonly simulatedMinute = input<number | null>(null);

  readonly claimRequested = output<void>();
  readonly setSimulatedTimeRequested = output<{ hour: number; minute: number }>();
  readonly resetSimulationRequested = output<void>();

  readonly isSimOpen = signal<boolean>(false);
}
