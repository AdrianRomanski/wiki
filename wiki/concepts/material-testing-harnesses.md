---
title: Material Testing Harnesses
type: concept
tags: [angular, angular-material, testing, component-harness, best-practice]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Material Testing Harnesses

## Explanation

Every Angular Material component ships a `/testing` entry point that exports a `ComponentHarness` subclass. Harnesses provide a stable, semantic API for interacting with components in tests — without relying on CSS selectors or internal DOM structure. This makes tests resilient to Material version upgrades and internal rendering changes.

Harnesses are built on `@angular/cdk/testing` and work with both `TestbedHarnessEnvironment` (unit tests) and `SeleniumWebDriverHarnessEnvironment` (e2e tests).

## Applications

- Unit testing component interactions (clicking buttons, filling inputs, selecting options)
- Asserting component state (is a checkbox checked? is a button disabled?)
- Querying nested Material components within a host component
- Writing e2e tests that share the same harness API as unit tests

## Related Concepts

- [[Per-Module Imports]]
- [[Injection Token Configuration]]

## Examples

### Basic setup
```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

let loader: HarnessLoader;

beforeEach(() => {
  // ... TestBed setup
  loader = TestbedHarnessEnvironment.loader(fixture);
});
```

### Click a button by text
```ts
const button = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
await button.click();
```

### Fill an input
```ts
const input = await loader.getHarness(MatInputHarness.with({ placeholder: 'Name' }));
await input.setValue('Alice');
expect(await input.getValue()).toBe('Alice');
```

### Check a checkbox state
```ts
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';

const checkbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Accept terms' }));
expect(await checkbox.isChecked()).toBe(false);
await checkbox.check();
expect(await checkbox.isChecked()).toBe(true);
```

### Select an option from MatSelect
```ts
import { MatSelectHarness } from '@angular/material/select/testing';

const select = await loader.getHarness(MatSelectHarness);
await select.open();
const options = await select.getOptions();
await options[1].click();
expect(await select.getValueText()).toBe('Option 2');
```

### Available harnesses (one per component)
Every module under `@angular/material/[component]/testing` exports a harness, e.g.:
- `MatButtonHarness`, `MatIconButtonHarness`
- `MatInputHarness`, `MatFormFieldHarness`
- `MatSelectHarness`, `MatOptionHarness`
- `MatCheckboxHarness`, `MatRadioGroupHarness`, `MatRadioButtonHarness`
- `MatSlideToggleHarness`, `MatSliderHarness`
- `MatDialogHarness`, `MatSnackBarHarness`
- `MatTableHarness`, `MatRowHarness`, `MatCellHarness`
- `MatPaginatorHarness`, `MatSortHarness`
- `MatTabGroupHarness`, `MatTabHarness`
- `MatMenuHarness`, `MatMenuItemHarness`
- `MatStepperHarness`, `MatStepHarness`
- `MatDatepickerInputHarness`, `MatCalendarHarness`
- `MatTimepickerInputHarness`
- `MatChipListboxHarness`, `MatChipGridHarness`, `MatChipHarness`
- `MatTreeHarness`, `MatTreeNodeHarness`

## References

- [[Angular Material]]
- [[Angular Material Big Picture Research — 2026-05-11]]
