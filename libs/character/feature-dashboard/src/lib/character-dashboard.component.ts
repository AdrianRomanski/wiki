import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CharacterStateService } from '@wiki/character-data-access';
import { CharacterSheetComponent } from '@wiki/character-ui-sheet';
import {
  EARLY_WAKEUP_SLOTS,
  EarlyWakeupEvaluation,
  evaluateEarlyWakeupQuest,
} from '@wiki/character-domain-models';

@Component({
  selector: 'character-dashboard',
  standalone: true,
  imports: [CommonModule, CharacterSheetComponent],
  templateUrl: './character-dashboard.component.html',
  styleUrls: ['./character-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterDashboardComponent {
  readonly characterState = inject(CharacterStateService);

  readonly timeSlots = Object.values(EARLY_WAKEUP_SLOTS);
  readonly claimedToday = signal<boolean>(false);
  readonly claimMessage = signal<string | null>(null);

  // Default to live current system time
  readonly simulatedHour = signal<number | null>(null);
  readonly simulatedMinute = signal<number | null>(null);

  readonly currentEvaluation = computed<EarlyWakeupEvaluation>(() => {
    const hour = this.simulatedHour();
    const minute = this.simulatedMinute();
    if (hour !== null && minute !== null) {
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      return evaluateEarlyWakeupQuest(d);
    }
    return evaluateEarlyWakeupQuest(new Date());
  });

  readonly formattedCurrentTime = computed<string>(() => {
    const hour = this.simulatedHour();
    const minute = this.simulatedMinute();
    if (hour !== null && minute !== null) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      return `${h}:${m} (Simulated)`;
    }
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  claimEarlyWakeUpXp(): void {
    if (this.claimedToday()) {
      this.claimMessage.set('⚠️ You have already claimed today\'s early wake-up quest.');
      return;
    }

    const evalResult = this.currentEvaluation();
    if (!evalResult.canClaim || evalResult.xpAmount <= 0) {
      this.claimMessage.set(`❌ Cannot claim XP: ${evalResult.message}`);
      return;
    }

    this.characterState.awardXp({
      amount: evalResult.xpAmount,
      statCategory: 'discipline',
      sourceDescription: `Early Morning Waking Quest (${evalResult.slot} AM slot)`,
    });

    this.claimedToday.set(true);
    this.claimMessage.set(`🎉 Success! Earned +${evalResult.xpAmount} DIS XP for waking up early (${evalResult.tierName})!`);
  }

  setSimulatedTime(hour: number, minute: number): void {
    this.simulatedHour.set(hour);
    this.simulatedMinute.set(minute);
    this.claimMessage.set(null);
  }

  resetSimulation(): void {
    this.simulatedHour.set(null);
    this.simulatedMinute.set(null);
    this.claimMessage.set(null);
  }
}
