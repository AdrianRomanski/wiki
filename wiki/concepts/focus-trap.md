---
title: Focus Trap
type: concept
tags: [angular, cdk, accessibility, focus-management, aria, modal, a11y]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Focus Trap

## Explanation

A focus trap constrains keyboard focus to a specific region of the DOM — typically a modal dialog, drawer, or popover. When focus reaches the last focusable element and the user presses Tab, focus wraps back to the first element inside the trap rather than escaping to the rest of the page.

This is a WCAG requirement for modal dialogs (Success Criterion 2.1.2 — No Keyboard Trap, and the ARIA Authoring Practices Guide for the dialog pattern).

`@angular/cdk/a11y` provides two implementations:

| Class | Description |
|---|---|
| `FocusTrap` | Basic focus trap; created via `FocusTrapFactory` |
| `ConfigurableFocusTrap` | Supports pluggable inert strategies; created via `ConfigurableFocusTrapFactory` |
| `CdkTrapFocus` | Directive version — declarative, no service injection needed |

The `EventListenerFocusTrapInertStrategy` uses `aria-hidden` and `tabindex="-1"` to make content outside the trap unreachable. The `FOCUS_TRAP_INERT_STRATEGY` token lets you swap in a custom strategy.

## Applications

- Modal dialogs
- Side drawers and panels
- Confirmation prompts
- Any overlay that should prevent background interaction

## Related Concepts

- [[list-key-manager]] — navigates within the trapped region
- [[live-announcer]] — announces dialog open/close to screen readers
- [[overlay-positioning]] — overlays typically contain a focus trap

## Examples

Declarative (directive):

```html
<!-- Focus is trapped inside this div while [cdkTrapFocus]="true" -->
<div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
  <button>First</button>
  <input type="text" />
  <button (click)="close()">Close</button>
</div>
```

Programmatic:

```typescript
import { FocusTrapFactory } from '@angular/cdk/a11y';

class MyDialog {
  private trap: FocusTrap;

  constructor(
    private focusTrapFactory: FocusTrapFactory,
    private el: ElementRef
  ) {}

  open() {
    this.trap = this.focusTrapFactory.create(this.el.nativeElement);
    this.trap.focusInitialElementWhenReady();
  }

  close() {
    this.trap.destroy();
  }
}
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
