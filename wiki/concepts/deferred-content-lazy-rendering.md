---
title: Deferred Content Lazy Rendering
type: concept
tags: [angular, performance, accessibility, aria, pattern, lazy-loading]
sources: [angular-aria-big-picture-2026-05-30]
created: 2026-05-30
updated: 2026-05-30
---

# Deferred Content Lazy Rendering

## Explanation

Deferred Content Lazy Rendering is a pattern used in `@angular/aria` to avoid rendering hidden panel and popup content until it is first shown. It uses two directives from `@angular/aria/private`:

- **`DeferredContent`** — applied to an `<ng-template>` inside a panel or popup. Marks the content as lazily renderable.
- **`DeferredContentAware`** — applied to the host component or directive that controls when the template is rendered. The host decides when to instantiate the template.

The pattern is used across accordion panels, menu content, tab panels, and tree nodes — any place where content may never be shown during a session.

### Why it matters for accessibility

Hidden content that is rendered but visually hidden (via `display: none` or `visibility: hidden`) can still be traversed by screen readers in some configurations. Deferring rendering entirely ensures hidden content is genuinely absent from the DOM until needed, preventing false positives in accessibility tree traversal.

### Performance benefit

For pages with many collapsed accordion panels, closed menu items, or inactive tabs, deferred rendering keeps the initial DOM lean. Content is only instantiated when the user first opens the panel — subsequent opens reuse the already-rendered content.

## Applications

- **Accordion panels** — panel body content is not rendered until the panel is first expanded
- **Menu content** — menu items are not rendered until the menu is first opened
- **Tab panels** — tab panel content is not rendered until the tab is first activated
- **Tree nodes** — child node groups are not rendered until the parent node is first expanded
- **Combobox popups** — popup listbox content is deferred until the combobox is first opened

## Related Concepts

- [[Headless ARIA Directives]] — the pattern that uses deferred content for performance
- [[UI Pattern Behavior Composition]] — the architecture layer that controls deferred content rendering

## Examples

Using deferred content in an accordion panel:

```ts
import { AccordionGroup, AccordionPanel, AccordionTrigger, AccordionContent } from '@angular/aria/accordion';

@Component({
  standalone: true,
  imports: [AccordionGroup, AccordionPanel, AccordionTrigger, AccordionContent],
  template: `
    <div cdkAccordionGroup>
      <div cdkAccordionPanel>
        <button cdkAccordionTrigger>Section 1</button>

        <!-- cdkAccordionContent wraps an ng-template -->
        <!-- Content inside is NOT rendered until the panel is first opened -->
        <ng-template cdkAccordionContent>
          <div>
            This content is lazily rendered on first expand.
            Heavy components, images, or data fetching can go here
            without impacting initial page load.
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class MyAccordionComponent {}
```

Using deferred content in a tab panel:

```ts
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';

@Component({
  standalone: true,
  imports: [Tabs, TabList, Tab, TabPanel, TabContent],
  template: `
    <div cdkTabs>
      <div cdkTabList>
        <button cdkTab>Tab 1</button>
        <button cdkTab>Tab 2</button>
      </div>

      <div cdkTabPanel>
        <!-- Tab 1 content — rendered immediately (first tab is active) -->
        <p>Always visible content</p>
      </div>

      <div cdkTabPanel>
        <!-- Tab 2 content — deferred until first activation -->
        <ng-template cdkTabContent>
          <p>Lazily rendered when Tab 2 is first clicked</p>
        </ng-template>
      </div>
    </div>
  `
})
export class MyTabsComponent {}
```

## References

- [[Angular Aria]]
- [[Angular Aria Big Picture Research — 2026-05-30]]
