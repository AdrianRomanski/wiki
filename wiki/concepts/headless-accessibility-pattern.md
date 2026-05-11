---
title: Headless Accessibility Pattern
type: concept
tags: [accessibility, aria, headless, pattern, keyboard-navigation, design-system]
sources: [angular-aria-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Headless Accessibility Pattern

## Explanation

A headless accessibility pattern is a library or component that provides **interaction behavior and ARIA semantics without any visual styling**. The consumer owns the HTML structure and CSS; the library owns keyboard navigation, focus management, and ARIA attribute management.

The contract is a clean separation of concerns:

```
Library provides:              Consumer provides:
─────────────────              ──────────────────
Keyboard navigation      ←→    HTML structure
ARIA roles & states      ←→    CSS styling
Focus management         ←→    Business logic
Screen reader support    ←→    Data
RTL support              ←→    Design system tokens
```

This is distinct from:
- **Styled component libraries** (e.g. Angular Material) — ship both behavior and visual design
- **Unstyled component libraries** — ship HTML structure but may not handle accessibility
- **Native HTML elements** — have built-in semantics but limited customization

## Applications

### When to use a headless accessibility library

- Building a **custom design system** where brand requirements prevent using pre-styled components
- Enterprise component libraries that must match specific visual specifications
- Applications requiring **WCAG compliance** with full visual control
- Teams that want accessibility handled correctly without deep ARIA expertise

### When NOT to use

- Rapid prototyping or internal tools → use pre-styled components (Angular Material, etc.)
- Simple forms with native controls → `<select>`, `<input>`, `<button>` have built-in semantics
- When the pre-styled library's look is acceptable → less code, less maintenance

### Real-world examples

- [[@angular/aria]] — Angular's official headless accessibility library (8 patterns)
- Radix UI — React headless primitives
- Headless UI — Tailwind Labs headless components
- React Aria — Adobe's headless accessibility hooks

## Related Concepts

- [[Keyboard Navigation]] — the primary interaction model headless libraries implement
- [[Progressive Enhancement]] — headless patterns often align with this philosophy
- [[WAI-ARIA Grid Pattern]] — one of the patterns headless libraries implement

## Examples

### The headless contract in practice (`@angular/aria`)

```html
<!-- You write this HTML structure -->
<ul ngListbox [(values)]="selected">
  <li ngOption value="a" label="Option A">
    <!-- Your custom markup, icons, badges, etc. -->
    <span class="my-icon">★</span> Option A
  </li>
</ul>

<!-- The library sets these automatically -->
<!-- role="listbox" -->
<!-- aria-activedescendant="ng-listbox-option-1" -->
<!-- tabindex="0" -->
<!-- On each option: role="option", aria-selected, tabindex="-1" -->
```

```css
/* You write all the CSS */
[ngListbox] { border: 1px solid #ccc; }
[ngOption][data-active="true"] { background: #e0f0ff; }
[ngOption][aria-selected="true"] { font-weight: bold; }
```

### Comparison: headless vs styled vs native

```
┌──────────────────────────────────────────────────────────────────┐
│  @angular/aria (headless)                                        │
│  ✓ Full visual control                                           │
│  ✓ WCAG compliance built-in                                      │
│  ✗ You must write all CSS                                        │
│  ✗ More setup than pre-styled                                    │
│                                                                  │
│  Angular Material (styled)                                       │
│  ✓ Ready to use immediately                                      │
│  ✓ Accessible by default                                         │
│  ✗ Material Design aesthetic is fixed                            │
│  ✗ Customization has limits                                      │
│                                                                  │
│  Native HTML (<select>, <input>)                                 │
│  ✓ Zero dependencies                                             │
│  ✓ Built-in browser accessibility                                │
│  ✗ Very limited visual customization                             │
│  ✗ No complex patterns (tree, grid, combobox)                    │
└──────────────────────────────────────────────────────────────────┘
```

## References

- [[@angular/aria]]
- [[Angular Aria Grid Pattern]]
- [[Progressive Enhancement]]
