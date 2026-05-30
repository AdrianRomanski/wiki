---
title: Signal-Native Component Inputs
type: concept
tags: [angular, signals, architecture, pattern, typescript, reactivity]
sources: [angular-aria-big-picture-2026-05-30]
created: 2026-05-30
updated: 2026-05-30
---

# Signal-Native Component Inputs

## Explanation

Signal-Native Component Inputs is an architectural pattern where a component or class accepts **all inputs as signals** rather than plain values or `@Input()` properties. This enables reactive, fine-grained updates without requiring Angular's change detection to diff the entire component tree.

In `@angular/aria`, this pattern is implemented via two custom types defined in `@angular/aria/private`:

- **`SignalLike<T>`** — a read-only signal wrapper. Equivalent to Angular's `Signal<T>` but avoids importing from `@angular/core` in the behavior layer, keeping behaviors framework-agnostic.
- **`WritableSignalLike<T>`** — a read-write signal wrapper. Equivalent to Angular's `WritableSignal<T>`.

All UI Pattern classes and Behavior classes accept only `SignalLike` / `WritableSignalLike` inputs. Plain values are never accepted.

### Why avoid `Signal<T>` directly in behaviors?

The behavior layer is designed to be framework-agnostic — it contains no Angular imports. Using `SignalLike<T>` instead of `Signal<T>` means the behavior classes could theoretically be used outside Angular (e.g. in a Lit or React adapter) without modification. The `signal-like.ts` utility re-exports Angular's `signal`, `computed`, and `effect` under these types, acting as the single bridge.

### Contrast with `@Input()` / `@Output()`

| Approach | Reactivity | Framework coupling | Behavior reuse |
|---|---|---|---|
| `@Input()` / `@Output()` | Zone-based change detection | Angular-only | Difficult |
| `Signal<T>` from `@angular/core` | Fine-grained, push-based | Angular-only | Possible |
| `SignalLike<T>` (custom wrapper) | Fine-grained, push-based | Framework-agnostic | Easy |

## Applications

- **Building on `@angular/aria/private`** — if you extend or compose UI Pattern classes, all your inputs must be signals
- **Signal-first component design** — use this pattern in your own components to enable fine-grained reactivity without zone.js
- **Framework-agnostic libraries** — wrap signal primitives in custom types to decouple library logic from Angular's API surface
- **Testing** — signal inputs make unit testing easier: create a `signal(value)`, pass it in, update it, and assert on computed outputs without triggering Angular change detection

## Related Concepts

- [[UI Pattern Behavior Composition]] — the architecture that requires signal inputs throughout
- [[Headless ARIA Directives]] — the public layer that bridges Angular signals to UI Patterns

## Examples

Passing signal inputs to a UI Pattern (advanced usage via `@angular/aria/private`):

```ts
import { signal, computed } from '@angular/core';
// SignalLike is just Signal<T> under the hood — Angular signals satisfy the interface
import type { SignalLike, WritableSignalLike } from '@angular/aria/private';

// All inputs are signals — the pattern reacts to changes automatically
const activeIndex = signal(0);
const items = signal(['Apple', 'Banana', 'Cherry']);
const selectedValues = signal<string[]>([]);

// The pattern uses computed() internally — it only re-evaluates
// when a signal it reads actually changes
const pattern = new ListboxPattern({
  items,
  activeIndex,
  selectedValues,
  // ...other required inputs as signals
});

// Updating a signal triggers reactive re-computation in the pattern
activeIndex.set(2); // pattern immediately reflects the new active item
```

Creating a signal-native Angular component:

```ts
import { Component, signal, computed } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ double() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  // Signal input — reactive, no @Input() needed
  readonly count = signal(0);

  // Derived signal — recomputes only when count changes
  readonly double = computed(() => this.count() * 2);

  increment() { this.count.update(n => n + 1); }
}
```

## References

- [[Angular Aria]]
- [[Angular Aria Big Picture Research — 2026-05-30]]
