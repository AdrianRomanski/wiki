import { Component } from '@angular/core';
import { CharacterDashboardComponent } from '@wiki/character-feature-dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CharacterDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
