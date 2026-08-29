# Character UI Auth Library

UI presentation library containing pure authentication cards and state visualizers.

## Components

- **`AuthCardComponent`**: Presentational authentication card rendering Google OAuth sign-in triggers, Level 1 permitted account badges, and access denied states.

## Usage

```html
<character-auth-card
  [user]="user"
  [authStatus]="status"
  (loginRequested)="onLogin()"
  (logoutRequested)="onLogout()"
>
</character-auth-card>
```
