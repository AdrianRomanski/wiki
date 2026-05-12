---
title: Component Portal
type: concept
tags: [angular, cdk, portal, dynamic-content, overlay, dependency-injection]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Component Portal

## Explanation

A portal is a piece of UI that can be dynamically rendered at a location in the DOM that is separate from where it is declared. `@angular/cdk/portal` decouples content declaration from content rendering location.

### Portal Types

| Class | What it renders |
|---|---|
| `ComponentPortal` | An Angular component (creates a new component instance) |
| `TemplatePortal` | An `ng-template` (renders an existing template) |
| `DomPortal` | A raw DOM element (moves an existing DOM node) |

### Outlet Types

| Class | Description |
|---|---|
| `CdkPortalOutlet` | Directive; marks a location in a template where a portal renders |
| `DomPortalOutlet` | Renders a portal into any arbitrary DOM element (e.g., `document.body`) |
| `BasePortalOutlet` | Abstract base class for custom outlets |

### Directives

- `CdkPortal` — marks an `ng-template` as a portal; use with `TemplatePortal`
- `CdkPortalOutlet` — the render target in a template

## Applications

- Overlay panels (tooltips, dropdowns, dialogs) — content is declared in a component but rendered in the overlay container
- Toast/snackbar notifications rendered at the document root
- Dynamic tab content
- Sidebar panels that render content defined elsewhere in the component tree
- Any scenario where content needs to "escape" its DOM parent

## Related Concepts

- [[overlay-positioning]] — overlays use portals to project content into floating panels
- [[focus-trap]] — portal content in dialogs should be wrapped in a focus trap

## Examples

Rendering a component into an overlay:

```typescript
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay } from '@angular/cdk/overlay';

const ref = this.overlay.create(config);
const portal = new ComponentPortal(TooltipComponent);
const componentRef = ref.attach(portal);
// componentRef.instance gives access to the component
```

Rendering a template at a different location:

```typescript
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, TemplateRef } from '@angular/core';

// In the component that owns the template
const portal = new TemplatePortal(this.templateRef, this.viewContainerRef);
this.portalOutlet.attach(portal);
```

Declarative outlet in a template:

```html
<!-- Declare the portal content -->
<ng-template cdkPortal>
  <p>This content will render wherever the outlet is.</p>
</ng-template>

<!-- The outlet — renders whatever portal is attached -->
<ng-template [cdkPortalOutlet]="activePortal"></ng-template>
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
