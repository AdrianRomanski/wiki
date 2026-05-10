---
title: Standalone Components
type: concept
tags: [angular, architecture, standalone, modern-angular]
sources: [seat-selection-component-2026-05-10]
created: 2026-05-10
updated: 2026-05-10
---

# Standalone Components

## Explanation

Standalone Components are a modern Angular feature (introduced in Angular 14, stable in Angular 15) that allows components to be self-contained without requiring NgModules. This architectural pattern simplifies Angular applications by eliminating the need for module declarations and making components more portable and reusable.

**Key Characteristics**:
- No NgModule required
- Direct imports of dependencies
- Simplified component tree
- Better tree-shaking
- Easier testing

**Traditional vs Standalone**:

```typescript
// Traditional (NgModule-based)
@NgModule({
  declarations: [MyComponent],
  imports: [CommonModule, FormsModule],
  exports: [MyComponent]
})
export class MyModule {}

// Standalone (Modern)
@Component({
  selector: 'my-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: '...'
})
export class MyComponent {}
```

## Applications

### Angular Aria Research Project

The Angular Aria research project uses standalone components throughout:

**Example from Seat Selection Feature**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'lib-feat-seat-selection',
  imports: [],  // Direct imports, no NgModule
  templateUrl: './feat-seat-selection.html',
  styleUrl: './feat-seat-selection.css',
})
export class FeatSeatSelection {}
```

**Benefits for Accessibility Components**:
- Each accessible component is self-contained
- Easy to share accessibility patterns across projects
- Simpler testing of ARIA implementations
- Better code organization for complex accessible widgets

### Component Libraries

Standalone components are ideal for component libraries:
- No need to export NgModules
- Consumers import only what they need
- Better tree-shaking reduces bundle size
- Simpler API for library users

### Micro-Frontends

Standalone components enable micro-frontend architectures:
- Each component is independently deployable
- No shared module dependencies
- Clear boundaries between features
- Easier to maintain and update

## Related Concepts

- [[angular-cdk]] - CDK components use standalone architecture
- [[progressive-enhancement]] - Standalone components support progressive enhancement
- [[tree-shaking]] - Standalone components improve tree-shaking
- [[component-composition]] - Standalone components simplify composition patterns

## Examples

### Basic Standalone Component

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Hello, {{ name }}!</h1>
      <p *ngIf="showMessage">Welcome to standalone components</p>
    </div>
  `
})
export class GreetingComponent {
  name = 'Developer';
  showMessage = true;
}
```

### Standalone Component with Dependencies

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule
  ],
  template: `
    <form>
      <input [(ngModel)]="value" />
      <button mat-raised-button>Submit</button>
    </form>
  `
})
export class FormComponent {
  value = '';
}
```

### Accessible Standalone Component

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expandable-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h2>
        <button
          type="button"
          [attr.aria-expanded]="isExpanded"
          [attr.aria-controls]="contentId"
          (click)="toggle()">
          {{ title }}
        </button>
      </h2>
      <div
        [id]="contentId"
        [hidden]="!isExpanded"
        role="region"
        [attr.aria-labelledby]="buttonId">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class ExpandableSectionComponent {
  @Input() title = '';
  @Input() contentId = 'content-' + Math.random();
  @Input() buttonId = 'button-' + Math.random();
  
  isExpanded = false;
  
  toggle() {
    this.isExpanded = !this.isExpanded;
  }
}
```

## Migration Path

### From NgModule to Standalone

Angular provides schematics to migrate existing components:

```bash
# Migrate a single component
ng generate @angular/core:standalone --path=src/app/my-component

# Migrate entire application
ng generate @angular/core:standalone --mode=convert-to-standalone
```

### Best Practices

1. **Start with new components**: Make all new components standalone
2. **Migrate incrementally**: Convert existing components gradually
3. **Test thoroughly**: Ensure accessibility features still work
4. **Update imports**: Replace NgModule imports with direct imports
5. **Simplify routing**: Use standalone components in routes

## References

- [[Angular CDK]] - Uses standalone components
- [[seat-selection-component-2026-05-10]] - Example from research project
- [Angular Standalone Components Guide](https://angular.io/guide/standalone-components)
- [Angular Migration Guide](https://angular.io/guide/standalone-migration)

## Research Notes

This concept was identified during the Angular Aria research project while analyzing the seat selection feature. The use of standalone components simplifies the architecture and makes accessibility patterns more portable across different Angular applications.

**Key Insight**: Standalone components are particularly valuable for accessibility-focused component libraries because they eliminate the complexity of NgModule configuration while maintaining all the benefits of Angular's dependency injection and change detection systems.
