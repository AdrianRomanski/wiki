---
title: Headless ARIA Directives
type: concept
tags: [accessibility, aria, headless, angular, pattern, component-library]
sources: [angular-aria-big-picture-2026-05-30]
created: 2026-05-30
updated: 2026-05-30
---

# Headless ARIA Directives

## Explanation

Headless ARIA directives are Angular directives that implement **accessibility behavior without providing any visual styling**. They manage ARIA attributes, keyboard interactions, and focus — but leave all CSS, layout, and visual design entirely to the consumer.

The term "headless" comes from the idea that the component has no "head" (no visual presentation layer). It is purely behavioral.

This pattern separates two concerns that are often conflated in traditional component libraries:

1. **Accessibility semantics** — correct ARIA roles, states, properties, and keyboard interactions per the WAI-ARIA APG
2. **Visual design** — colors, spacing, typography, animations, and layout

By separating them, a single set of accessible directives can power any visual design system without fighting CSS specificity or overriding opinionated styles.

## Applications

- **Design system integration** — apply accessible behavior to your own styled elements without inheriting any library styles
- **Custom component libraries** — build a branded component library on top of proven accessibility primitives
- **Prototyping** — quickly add correct ARIA semantics to prototype UIs before finalizing design
- **Accessibility auditing** — use as a reference implementation to verify your own components' keyboard and ARIA behavior

### When to use headless directives vs. pre-styled components

| Situation | Recommendation |
|---|---|
| You have a design system with strict visual requirements | Headless directives (`@angular/aria`) |
| You want Material Design out of the box | Pre-styled components (`@angular/material`) |
| You need to match an existing brand | Headless directives |
| You're building a quick internal tool | Pre-styled components |

## Related Concepts

- [[UI Pattern Behavior Composition]] — the internal architecture that powers headless directives
- [[Deferred Content Lazy Rendering]] — performance pattern used by headless panels and popups
- [[Signal-Native Component Inputs]] — how headless directives accept reactive inputs

## Examples

A headless listbox — the directive provides all ARIA and keyboard behavior; the consumer owns all styling:

```ts
import { Listbox, Option } from '@angular/aria/listbox';

@Component({
  standalone: true,
  imports: [Listbox, Option],
  template: `
    <!-- cdkListbox adds role="listbox", keyboard navigation, aria-selected -->
    <ul cdkListbox class="my-listbox">
      <!-- cdkOption adds role="option", aria-selected, click/keyboard handling -->
      @for (item of items; track item.id) {
        <li cdkOption [cdkOptionValue]="item.id" class="my-option">
          {{ item.label }}
        </li>
      }
    </ul>
  `,
  styles: [`
    /* Consumer owns 100% of the visual design */
    .my-listbox { border: 1px solid #ccc; border-radius: 4px; }
    .my-option[aria-selected="true"] { background: #e0f0ff; }
    .my-option:focus { outline: 2px solid #0066cc; }
  `]
})
export class MyListboxComponent {
  items = [{ id: 1, label: 'Option A' }, { id: 2, label: 'Option B' }];
}
```

## References

- [[Angular Aria]]
- [[Angular Aria Big Picture Research — 2026-05-30]]
