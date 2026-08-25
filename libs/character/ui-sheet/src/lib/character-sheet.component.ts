import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Character } from '@wiki/character-domain-models';

@Component({
  selector: 'character-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-sheet.component.html',
  styleUrls: ['./character-sheet.component.scss'],
})
export class CharacterSheetComponent {
  readonly character = input.required<Character>();
}
