---
title: Live Announcer
type: concept
tags: [angular, cdk, accessibility, aria, screen-reader, aria-live, a11y]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Live Announcer

## Explanation

A Live Announcer pushes text messages to screen readers via an ARIA live region without moving keyboard focus. It is the programmatic equivalent of an `aria-live` attribute — useful for status updates, notifications, and dynamic content changes that happen outside the user's current focus point.

`@angular/cdk/a11y` provides:

- `LiveAnnouncer` — injectable service; call `.announce(message, politeness?, duration?)` 
- `CdkAriaLive` — directive version; wraps an element and announces its text content changes
- `AriaLivePoliteness` — `'polite'` | `'assertive'` | `'off'`

**Politeness levels:**
- `'polite'` (default) — waits for the screen reader to finish its current speech before announcing
- `'assertive'` — interrupts the screen reader immediately; use sparingly

Messages are cleared from the live region after a configurable duration (default: no auto-clear). The `LIVE_ANNOUNCER_DEFAULT_OPTIONS` token lets you set global defaults.

## Applications

- Form validation status ("3 errors found")
- Search result counts ("12 results for 'angular'")
- Loading state changes ("Content loaded")
- Toast/snackbar notifications
- Progress updates ("Upload 60% complete")
- Route change announcements in SPAs

## Related Concepts

- [[focus-trap]] — traps focus in modals; live announcer handles the verbal announcement
- [[list-key-manager]] — active item changes can be announced via live announcer

## Examples

```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({ ... })
class SearchComponent {
  constructor(private announcer: LiveAnnouncer) {}

  onResultsLoaded(count: number) {
    // Politely announce after current speech finishes
    this.announcer.announce(`${count} results found`, 'polite');
  }

  onError(message: string) {
    // Assertive — interrupts immediately (use sparingly)
    this.announcer.announce(message, 'assertive');
  }
}
```

Directive version — announces whenever the element's text content changes:

```html
<div cdkAriaLive="polite">{{ statusMessage }}</div>
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
