---
title: Custom Form Field Control
type: concept
tags: [angular, angular-material, forms, form-field, accessibility, best-practice]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Custom Form Field Control

## Explanation

`MatFormFieldControl<T>` is an abstract class from `@angular/material/form-field` that lets you integrate any custom input component into `<mat-form-field>`. Implementing it gives your component full support for Material's label (floating/static), hint text, error messages, prefix/suffix slots, and required/disabled states — all without any extra wiring.

The component must also implement `ControlValueAccessor` from `@angular/forms` to participate in Angular's form system.

## Applications

- Building custom inputs (phone number, color picker, tag input) that look and behave like native Material form fields
- Wrapping third-party input widgets inside `<mat-form-field>`
- Creating composite inputs (e.g. a date-range input with two fields) that share a single form field label

## Related Concepts

- [[Per-Module Imports]]
- [[Injection Token Configuration]]

## Examples

### Minimal custom form field control
```ts
import { Component, Optional, Self, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  template: `<input [value]="value()" (input)="onInput($event)" />`,
  providers: [
    { provide: MatFormFieldControl, useExisting: PhoneInputComponent }
  ]
})
export class PhoneInputComponent
  implements MatFormFieldControl<string>, ControlValueAccessor {

  // Required by MatFormFieldControl
  static nextId = 0;
  id = `phone-input-${PhoneInputComponent.nextId++}`;
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'phone-input';
  autofilled = false;

  value = signal('');
  placeholder = 'Phone number';
  required = false;
  disabled = false;

  get empty() { return !this.value(); }
  get shouldLabelFloat() { return this.focused || !this.empty; }
  get errorState() { return this.touched && !!this.ngControl?.errors; }

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (ngControl) ngControl.valueAccessor = this;
  }

  // ControlValueAccessor
  private onChange = (_: string) => {};
  private onTouched = () => {};
  writeValue(val: string) { this.value.set(val ?? ''); }
  registerOnChange(fn: (_: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
    this.stateChanges.next();
  }

  setDescribedByIds(_ids: string[]) {}
  onContainerClick() {}
  ngOnDestroy() { this.stateChanges.complete(); }
}
```

### Usage in a form
```html
<mat-form-field appearance="outline">
  <mat-label>Phone</mat-label>
  <app-phone-input formControlName="phone" />
  <mat-hint>Include country code</mat-hint>
  <mat-error>Invalid phone number</mat-error>
</mat-form-field>
```

### Required members of MatFormFieldControl<T>

| Member | Type | Purpose |
|---|---|---|
| `value` | `T \| null` | Current value |
| `stateChanges` | `Observable<void>` | Notify form field of state changes |
| `id` | `string` | Unique element ID |
| `placeholder` | `string` | Placeholder text |
| `focused` | `boolean` | Whether control is focused |
| `empty` | `boolean` | Whether control has no value |
| `shouldLabelFloat` | `boolean` | Whether label should float |
| `required` | `boolean` | Whether field is required |
| `disabled` | `boolean` | Whether field is disabled |
| `errorState` | `boolean` | Whether field is in error state |
| `setDescribedByIds()` | method | Set aria-describedby IDs |
| `onContainerClick()` | method | Handle click on form field container |

## References

- [[Angular Material]]
- [[angular-material-big-picture-2026-05-11]]
