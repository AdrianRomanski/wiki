---
title: Angular Material Testing Harnesses
type: concept
tags: [angular, angular-material, testing, harness, component-harness, cdk]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material Testing Harnesses

## Explanation

Every Angular Material component ships a `[component]/testing` entry point containing a `MatXxxHarness` class. These are subclasses of `ComponentHarness` from `@angular/cdk/testing` and provide a stable, implementation-agnostic API for interacting with components in tests.

The key benefit: harness APIs are stable across internal refactors. Tests written against `MatButtonHarness` won't break if the button's internal DOM structure changes.

## Applications

- Writing unit and integration tests that interact with Material components without relying on internal DOM structure
- Querying components by label, text, or state rather than CSS selectors
- Simulating user interactions (click, type, select) through a high-level API

## Related Concepts

- [[angular-material-modular-imports]]
- [[Angular Material]]
- [[Angular CDK]]

## Examples

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';

describe('MyComponent', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    // ... TestBed setup
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('clicks a button', async () => {
    const btn = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    await btn.click();
  });

  it('fills an input', async () => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('hello');
    expect(await input.getValue()).toBe('hello');
  });

  it('selects an option', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: 'Option A' });
  });
});
```

## References

- [[angular-material-big-picture-2026-05-11]]
- [[Angular Material]]
