import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CharacterStateService } from '@wiki/character-data-access';
import { CharacterSheetComponent } from '@wiki/character-ui-sheet';

@Component({
  selector: 'character-dashboard',
  standalone: true,
  imports: [CommonModule, CharacterSheetComponent],
  templateUrl: './character-dashboard.component.html',
  styleUrls: ['./character-dashboard.component.scss'],
})
export class CharacterDashboardComponent {
  readonly characterState = inject(CharacterStateService);

  onResearchCompleted(): void {
    this.characterState.awardXp({
      amount: 50,
      statCategory: 'intelligence',
      sourceDescription: 'Completed Wiki Research Session',
    });
  }

  onAdrCreated(): void {
    this.characterState.awardXp({
      amount: 100,
      statCategory: 'wisdom',
      sourceDescription: 'Published Architecture Decision Record (ADR)',
    });
  }

  onDailyStreakFinished(): void {
    this.characterState.awardXp({
      amount: 75,
      statCategory: 'discipline',
      sourceDescription: 'Completed Daily Quest Streak',
    });
  }
}
