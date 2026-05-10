---
name: Angular Material Component Template
description: Template for creating components with Angular Material (pre-styled, accessible)
tags: [angular-material, accessibility, component, angular]
---

# Angular Material Component Template

Guide for using Angular Material components - pre-styled with built-in accessibility.

## Key Principles

1. **Import Material modules** - Use pre-built Material components
2. **Apply Material theme** - Configure colors and typography
3. **Customize with CSS** - Override Material styles as needed
4. **Leverage built-in accessibility** - Material handles ARIA automatically
5. **Use proper access modifiers**:
   - `public readonly` for inputs/outputs
   - `protected` for template-accessible members
   - `private` for internal-only logic

## Installation & Setup

```bash
# Install Angular Material
ng add @angular/material

# Or manually
npm install @angular/material @angular/cdk
```

### Theme Configuration (styles.scss)

```scss
@use '@angular/material' as mat;

// Include core styles
@include mat.core();

// Define theme
$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette);
$my-warn: mat.define-palette(mat.$red-palette);

$my-theme: mat.define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

// Apply theme
@include mat.all-component-themes($my-theme);
```

## Component Structure

### Basic Pattern (Using Material Components)

```typescript
import { Component, input, model, signal } from '@angular/core';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-material-tree',
  standalone: true,
  imports: [MatTreeModule, MatIconModule, MatButtonModule],
  templateUrl: './material-tree.html',
  styleUrl: './material-tree.scss'
})
export class MaterialTreeComponent {
  // === PUBLIC INPUTS/OUTPUTS ===
  public readonly label = input<string>('');
  public readonly disabled = input<boolean>(false);
  
  // === PROTECTED (Template-accessible) ===
  protected readonly dataSource = signal<TreeNode[]>([]);
  
  protected hasChild = (_: number, node: TreeNode): boolean => {
    return !!node.children && node.children.length > 0;
  };
  
  protected onNodeClick(node: TreeNode): void {
    this.handleNodeSelection(node);
  }
  
  // === PRIVATE (Internal) ===
  private handleNodeSelection(node: TreeNode): void {
    // Internal logic
  }
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
}
```

### Form Pattern (Material Form Controls)

```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './material-form.html',
  styleUrl: './material-form.scss'
})
export class MaterialFormComponent {
  protected readonly form: FormGroup;
  protected readonly isSubmitting = signal(false);
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      category: ['', Validators.required]
    });
  }
  
  protected onSubmit(): void {
    if (this.form.valid) {
      this.submitForm(this.form.value);
    }
  }
  
  private submitForm(data: any): void {
    this.isSubmitting.set(true);
    // Submit logic
  }
}
```

## Template Patterns

### Tree Component

```html
<!-- Material Tree with built-in accessibility -->
<mat-tree [dataSource]="dataSource()" [childrenAccessor]="hasChild">
  <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
    <button mat-icon-button disabled></button>
    {{ node.name }}
  </mat-tree-node>
  
  <mat-tree-node *matTreeNodeDef="let node; when: hasChild" matTreeNodePadding>
    <button mat-icon-button matTreeNodeToggle>
      <mat-icon>
        {{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
      </mat-icon>
    </button>
    {{ node.name }}
  </mat-tree-node>
</mat-tree>
```

### Tabs Component

```html
<mat-tab-group [selectedIndex]="selectedTab()" (selectedIndexChange)="onTabChange($event)">
  @for (tab of tabs(); track tab.id) {
    <mat-tab [label]="tab.label" [disabled]="tab.disabled">
      <ng-template matTabContent>
        {{ tab.content }}
      </ng-template>
    </mat-tab>
  }
</mat-tab-group>
```

### Menu Component

```html
<button mat-button [matMenuTriggerFor]="menu">
  Menu
</button>

<mat-menu #menu="matMenu">
  @for (item of menuItems(); track item.id) {
    <button mat-menu-item (click)="onMenuItemClick(item.id)" [disabled]="item.disabled">
      @if (item.icon) {
        <mat-icon>{{ item.icon }}</mat-icon>
      }
      <span>{{ item.label }}</span>
    </button>
  }
</mat-menu>
```

### Form with Validation

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- Text Input -->
  <mat-form-field appearance="outline">
    <mat-label>Name</mat-label>
    <input matInput formControlName="name" required>
    @if (form.get('name')?.hasError('required')) {
      <mat-error>Name is required</mat-error>
    }
    @if (form.get('name')?.hasError('minlength')) {
      <mat-error>Name must be at least 3 characters</mat-error>
    }
  </mat-form-field>
  
  <!-- Email Input -->
  <mat-form-field appearance="outline">
    <mat-label>Email</mat-label>
    <input matInput type="email" formControlName="email" required>
    @if (form.get('email')?.hasError('required')) {
      <mat-error>Email is required</mat-error>
    }
    @if (form.get('email')?.hasError('email')) {
      <mat-error>Invalid email format</mat-error>
    }
  </mat-form-field>
  
  <!-- Select -->
  <mat-form-field appearance="outline">
    <mat-label>Category</mat-label>
    <mat-select formControlName="category" required>
      <mat-option value="option1">Option 1</mat-option>
      <mat-option value="option2">Option 2</mat-option>
    </mat-select>
    @if (form.get('category')?.hasError('required')) {
      <mat-error>Category is required</mat-error>
    }
  </mat-form-field>
  
  <!-- Submit Button -->
  <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || isSubmitting()">
    @if (isSubmitting()) {
      <mat-spinner diameter="20"></mat-spinner>
    } @else {
      Submit
    }
  </button>
</form>
```

### Dialog Component

```typescript
// Dialog Component
import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      {{ data.message }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Confirm</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  
  protected onCancel(): void {
    this.dialogRef.close(false);
  }
  
  protected onConfirm(): void {
    this.dialogRef.close(true);
  }
}

// Usage in parent component
import { MatDialog } from '@angular/material/dialog';

export class ParentComponent {
  private dialog = inject(MatDialog);
  
  protected openDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User confirmed
      }
    });
  }
}
```

## Styling Customization

```scss
// Override Material styles

// Custom button styles
.mat-mdc-button {
  &.custom-button {
    border-radius: 8px;
    padding: 12px 24px;
  }
}

// Custom form field
.mat-mdc-form-field {
  &.custom-field {
    width: 100%;
    
    .mat-mdc-text-field-wrapper {
      background-color: #f5f5f5;
    }
  }
}

// Custom tab styles
.mat-mdc-tab-group {
  &.custom-tabs {
    .mat-mdc-tab-label {
      min-width: 120px;
    }
  }
}

// Ensure focus indicators remain visible
.mat-mdc-button:focus,
.mat-mdc-tab:focus,
.mat-mdc-menu-item:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## What Material Handles Automatically

### Accessibility Features
- ✅ ARIA roles and attributes
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ High contrast mode support
- ✅ RTL (right-to-left) support
- ✅ Touch target sizes (44x44px)
- ✅ Color contrast (WCAG AA compliant)

### Form Features
- ✅ Validation error messages
- ✅ Required field indicators
- ✅ Disabled state styling
- ✅ Loading states
- ✅ Error announcements

## What You Must Provide

### Required Configuration
- [ ] Material theme configured
- [ ] Proper form validation rules
- [ ] Accessible labels for all inputs
- [ ] Error messages for validation
- [ ] Loading states for async operations

### Custom Features
- [ ] Business logic and data handling
- [ ] Custom validation logic
- [ ] API integration
- [ ] State management
- [ ] Custom styling (if needed)

## Component Checklist

### Before Starting
- [ ] Install Angular Material: `ng add @angular/material`
- [ ] Configure theme in styles.scss
- [ ] Review Material documentation: [material.angular.io](https://material.angular.io)
- [ ] Check component examples in Material docs

### Implementation
- [ ] Import required Material modules
- [ ] Use Material components in template
- [ ] Configure component inputs (color, disabled, etc.)
- [ ] Add form validation (if applicable)
- [ ] Implement event handlers
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify focus indicators visible

### Testing
- [ ] All Material components render correctly
- [ ] Theme colors applied
- [ ] Forms validate properly
- [ ] Error messages display
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Works in high contrast mode
- [ ] RTL mode works (if applicable)

## Common Material Components

### Navigation
- `MatToolbar` - App bar / toolbar
- `MatSidenav` - Side navigation drawer
- `MatMenu` - Dropdown menu
- `MatTabs` - Tab navigation

### Forms
- `MatFormField` - Form field wrapper
- `MatInput` - Text input
- `MatSelect` - Dropdown select
- `MatCheckbox` - Checkbox
- `MatRadioButton` - Radio button
- `MatSlider` - Slider
- `MatDatepicker` - Date picker

### Buttons & Indicators
- `MatButton` - Button variants
- `MatIcon` - Material icons
- `MatBadge` - Notification badge
- `MatChip` - Chip/tag
- `MatProgressBar` - Progress bar
- `MatProgressSpinner` - Loading spinner

### Popups & Modals
- `MatDialog` - Modal dialog
- `MatSnackBar` - Toast notification
- `MatTooltip` - Tooltip
- `MatBottomSheet` - Bottom sheet

### Data Display
- `MatTable` - Data table
- `MatPaginator` - Pagination
- `MatSort` - Sortable headers
- `MatTree` - Tree view
- `MatList` - List
- `MatCard` - Card container

## Resources

- [Angular Material Documentation](https://material.angular.io)
- [Material Design Guidelines](https://m3.material.io/)
- [Angular Material GitHub](https://github.com/angular/components)
- [Material Accessibility Guide](https://material.angular.io/guide/accessibility)
