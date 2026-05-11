import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeatSeatSelection } from '@deep-dive-angular-aria/feat-seat-selection';

@Component({
  imports: [FeatSeatSelection, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'deep-dive-angular-aria';
}
