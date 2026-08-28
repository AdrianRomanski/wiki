import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AuthStatus, UserProfile } from '@wiki/character-domain-models';

@Component({
  selector: 'character-auth-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-card" [class.authenticated]="authStatus() === 'authenticated'" [class.unauthorized]="authStatus() === 'unauthorized'">
      @if (authStatus() === 'authenticated' && user(); as activeUser) {
        <div class="auth-header">
          <div class="user-info">
            <div class="avatar-ring">
              <span class="avatar-text">{{ activeUser.displayName[0] ? activeUser.displayName[0].toUpperCase() : 'U' }}</span>
            </div>
            <div class="user-details">
              <div class="user-name">{{ activeUser.displayName }}</div>
              <div class="user-email">{{ activeUser.email }}</div>
            </div>
          </div>

          <div class="auth-badges">
            <span class="badge level-badge">Level 1 Baseline</span>
            <span class="badge status-badge">Permitted Account</span>
            <button type="button" class="logout-btn" (click)="logoutRequested.emit()">Sign Out</button>
          </div>
        </div>
      } @else if (authStatus() === 'unauthorized') {
        <div class="unauthorized-banner" role="alert">
          <div class="banner-icon">⛔</div>
          <div class="banner-content">
            <div class="banner-title">Access Denied</div>
            <div class="banner-message">
              This email is not on the permitted authorization list. Only authorized Google accounts can access character progression.
            </div>
          </div>
          <button type="button" class="retry-btn" (click)="loginRequested.emit()">Try Permitted Account</button>
        </div>
      } @else {
        <div class="login-prompt">
          <div class="prompt-text">
            <div class="prompt-title">Sign In Required</div>
            <div class="prompt-subtitle">Authenticate with a permitted Google/Gmail account to access character progression.</div>
          </div>
          <button type="button" class="login-btn" [disabled]="authStatus() === 'authenticating'" (click)="loginRequested.emit()">
            @if (authStatus() === 'authenticating') {
              <span class="spinner"></span> Authenticating...
            } @else {
              <span class="google-icon">G</span> Sign in with Google
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .auth-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      color: #f8fafc;
      transition: all 0.3s ease;
    }

    .auth-card.authenticated {
      border-color: rgba(59, 130, 246, 0.3);
      background: rgba(15, 23, 42, 0.85);
    }

    .auth-card.unauthorized {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(127, 29, 29, 0.2);
    }

    .auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-ring {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      font-size: 1rem;
      color: #f8fafc;
    }

    .user-email {
      font-size: 0.825rem;
      color: #94a3b8;
    }

    .auth-badges {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .level-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .status-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(96, 165, 250, 0.3);
    }

    .logout-btn {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.3);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .unauthorized-banner {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .banner-icon {
      font-size: 1.8rem;
    }

    .banner-content {
      flex: 1;
    }

    .banner-title {
      font-weight: 700;
      color: #f87171;
      font-size: 1rem;
    }

    .banner-message {
      font-size: 0.875rem;
      color: #cbd5e1;
      margin-top: 2px;
    }

    .retry-btn, .login-btn {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .retry-btn:hover, .login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .google-icon {
      font-weight: 900;
      background: #ffffff;
      color: #2563eb;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .login-prompt {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .prompt-title {
      font-weight: 700;
      font-size: 1rem;
      color: #f8fafc;
    }

    .prompt-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 2px;
    }
  `],
})
export class AuthCardComponent {
  readonly user = input<UserProfile | null>(null);
  readonly authStatus = input.required<AuthStatus>();

  readonly loginRequested = output<void>();
  readonly logoutRequested = output<void>();
}
