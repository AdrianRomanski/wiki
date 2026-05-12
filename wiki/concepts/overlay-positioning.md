---
title: Overlay Positioning
type: concept
tags: [angular, cdk, overlay, positioning, floating-ui, tooltip, dropdown, popover]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Overlay Positioning

## Explanation

Overlay positioning is the strategy that determines where a floating panel (tooltip, dropdown, popover, menu) appears relative to a trigger element or the viewport. `@angular/cdk/overlay` provides a complete system for creating, positioning, and managing floating panels.

### Core Classes

| Class | Role |
|---|---|
| `Overlay` | Service; creates `OverlayRef` instances |
| `OverlayRef` | Handle to a specific overlay panel; attach/detach content, update position |
| `OverlayConfig` | Configuration object (position strategy, scroll strategy, size, backdrop) |
| `OverlayPositionBuilder` | Factory for position strategies |

### Position Strategies

**`FlexibleConnectedPositionStrategy`** — positions the overlay relative to a trigger element. Supports:
- Multiple fallback positions (tries each in order until one fits in the viewport)
- Viewport margin (keeps panel away from viewport edges)
- Push behavior (nudges panel into view if no position fits)
- Offset (pixel offset from the origin)

**`GlobalPositionStrategy`** — positions the overlay relative to the viewport (center, top, bottom, etc.). Used for modals and full-screen overlays.

### Scroll Strategies

Determines what happens to the overlay when the page scrolls:

| Strategy | Behavior |
|---|---|
| `NoopScrollStrategy` | Does nothing (default) |
| `BlockScrollStrategy` | Prevents page scroll while overlay is open |
| `CloseScrollStrategy` | Closes the overlay on scroll |
| `RepositionScrollStrategy` | Repositions the overlay on scroll |

### Directives

- `CdkOverlayOrigin` — marks a trigger element as the overlay origin
- `CdkConnectedOverlay` — declarative overlay that connects to a `CdkOverlayOrigin`

## Applications

- Tooltips
- Dropdown menus and selects
- Autocomplete panels
- Date pickers
- Popovers and rich tooltips
- Context menus

## Related Concepts

- [[component-portal]] — portals are used to project content into overlay panels
- [[focus-trap]] — overlays that act as dialogs should trap focus
- [[list-key-manager]] — overlay panels often contain keyboard-navigable lists

## Examples

Programmatic overlay with connected position strategy:

```typescript
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({ ... })
class TriggerComponent {
  constructor(private overlay: Overlay, private el: ElementRef) {}

  open() {
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.el)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
        { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom' }, // fallback
      ]);

    const config = new OverlayConfig({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
    });

    const ref = this.overlay.create(config);
    ref.attach(new ComponentPortal(MyPanelComponent));
    ref.backdropClick().subscribe(() => ref.detach());
  }
}
```

Declarative:

```html
<button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="open = !open">
  Toggle
</button>

<ng-template
  cdkConnectedOverlay
  [cdkConnectedOverlayOrigin]="trigger"
  [cdkConnectedOverlayOpen]="open"
  [cdkConnectedOverlayPositions]="positions">
  <my-panel />
</ng-template>
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
