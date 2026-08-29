import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AuthStatus, UserProfile } from '@wiki/character-domain-models';

@Component({
  selector: 'character-auth-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  readonly user = input<UserProfile | null>(null);
  readonly authStatus = input.required<AuthStatus>();

  readonly loginRequested = output<void>();
  readonly logoutRequested = output<void>();
}
