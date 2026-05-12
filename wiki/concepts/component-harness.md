---
title: Component Harness
type: concept
tags: [angular, cdk, testing, harness, component-testing, testbed, accessibility]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Component Harness

## Explanation

A component harness is a testing abstraction from `@angular/cdk/testing` that provides a stable, environment-agnostic API for interacting with a UI component in tests. Instead of querying DOM elements directly, tests use harness methods that describe user interactions at a semantic level.

This decouples tests from DOM structure — if the component's internal HTML changes, only the harness needs updating, not every test.

### Core Classes

| Class | Role |
|---|---|
| `ComponentHarness` | Base class for all harnesses; extend this to create your own |
| `HarnessLoader` | Loads harnesses for components in the test fixture |
| `HarnessPredicate<H>` | Filters harness instances by criteria (e.g., by text, by selector) |
| `HarnessEnvironment` | Abstract base for environment-specific implementations |
| `TestElement` | Abstraction over a DOM element; provides `click()`, `text()`, `getAttribute()`, etc. |
| `TestKey` | Enum of keyboard keys for `sendKeys()` |

### Environments

- `@angular/cdk/testing/testbed` — Angular TestBed integration (unit tests)
- `@angular/cdk/testing/selenium-webdriver` — Selenium WebDriver integration (e2e tests)

The same harness works in both environments — write once, run anywhere.

### `parallel()` utility

`parallel()` runs multiple async harness operations concurrently, similar to `Promise.all`, but works correctly with Angular's change detection.

## Applications

- Writing stable component tests that survive DOM refactors
- Testing Angular Material components (all Material components ship harnesses)
- Building reusable test utilities for your own design system components
- E2e tests that share logic with unit tests

## Related Concepts

- [[virtual-scrolling]] — virtual scroll tests need harnesses that account for DOM recycling
- [[focus-trap]] — harnesses can verify focus behavior in modal tests

## Examples

Creating a harness for a custom button component:

```typescript
import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export class MyButtonHarness extends ComponentHarness {
  static hostSelector = 'my-button';

  // Filter by button text
  static with(options: { text?: string } = {}) {
    return new HarnessPredicate(MyButtonHarness, options)
      .addOption('text', options.text,
        (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  async click() {
    return (await this.host()).click();
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }
}
```

Using the harness in a test:

```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

it('should click the submit button', async () => {
  const fixture = TestBed.createComponent(MyFormComponent);
  const loader = TestbedHarnessEnvironment.loader(fixture);

  const button = await loader.getHarness(MyButtonHarness.with({ text: 'Submit' }));
  expect(await button.isDisabled()).toBe(false);
  await button.click();
  // assert form submission
});
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
