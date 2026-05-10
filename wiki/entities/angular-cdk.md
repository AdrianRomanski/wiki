---
title: Angular CDK
type: entity
tags: [angular, accessibility, component-library, cdk]
sources: []
created: 2024-05-10
updated: 2024-05-10
---

# Angular CDK

## Definition

The Angular Component Dev Kit (CDK) is a set of behavior primitives for building accessible, high-quality UI components in Angular. It provides well-tested, reusable abstractions for common interaction patterns without imposing specific styling or visual design.

## Properties

- **Package**: `@angular/cdk`
- **Purpose**: Behavior primitives for accessible components
- **Key Modules**:
  - `a11y` - Accessibility utilities (focus management, live announcer, high contrast detection)
  - `overlay` - Positioning and overlay management
  - `portal` - Dynamic component rendering
  - `drag-drop` - Drag and drop functionality
  - `table` - Data table primitives
  - `tree` - Tree structure primitives
- **Design Philosophy**: Unstyled, behavior-focused, accessible by default

## Relationships

- Part of [[angular-framework]]
- Implements [[aria-patterns]]
- Used by [[angular-material]]
- Supports [[keyboard-navigation]]
- Enables [[screen-reader]] compatibility

## Examples

### Focus Management

```typescript
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

export class DialogComponent implements OnInit, OnDestroy {
  private focusTrap: FocusTrap;

  constructor(
    private focusTrapFactory: FocusTrapFactory,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
    this.focusTrap.focusInitialElement();
  }

  ngOnDestroy() {
    this.focusTrap.destroy();
  }
}
```

### Live Announcer

```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y';

export class NotificationComponent {
  constructor(private liveAnnouncer: LiveAnnouncer) {}

  announceMessage(message: string) {
    this.liveAnnouncer.announce(message, 'polite');
  }
}
```

## References

- [Official CDK Documentation](https://material.angular.io/cdk/categories)
- [[progressive-enhancement]] - CDK supports progressive enhancement patterns
