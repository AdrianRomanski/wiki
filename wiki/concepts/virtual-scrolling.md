---
title: Virtual Scrolling
type: concept
tags: [angular, cdk, performance, scrolling, large-lists, virtual-dom]
sources: [angular-cdk-big-picture-2026-05-12]
created: 2026-05-12
updated: 2026-05-12
---

# Virtual Scrolling

## Explanation

Virtual scrolling renders only the items currently visible in the viewport, plus a small buffer. As the user scrolls, items outside the viewport are removed from the DOM and replaced with new ones. This keeps DOM node count constant regardless of data set size — critical for lists with thousands of items.

`@angular/cdk/scrolling` provides:

| Class/Directive | Role |
|---|---|
| `CdkVirtualScrollViewport` | The scrollable container; host element must have an explicit CSS height |
| `CdkVirtualForOf` | Structural directive (like `*ngFor`) that renders only visible items |
| `CdkFixedSizeVirtualScroll` | Built-in strategy for uniform item heights |
| `VirtualScrollStrategy` | Interface for custom strategies (variable heights, dynamic loading) |
| `VIRTUAL_SCROLL_STRATEGY` | Injection token to provide a custom strategy |

### How It Works

1. `CdkVirtualScrollViewport` measures the viewport height
2. The `VirtualScrollStrategy` calculates which items are in view based on scroll position and item size
3. `CdkVirtualForOf` renders only those items, with spacer elements above and below to maintain correct scroll height
4. On scroll, the strategy recalculates and `CdkVirtualForOf` swaps items in/out

### Limitation

The built-in `CdkFixedSizeVirtualScroll` only supports uniform item heights. Variable-height items require a custom `VirtualScrollStrategy` — non-trivial to implement correctly.

## Applications

- Long data tables (thousands of rows)
- Infinite scroll feeds
- Large option lists in selects/autocompletes
- Log viewers
- Any list where rendering all items at once causes performance issues

## Related Concepts

- [[selection-model]] — often combined with virtual scroll for selectable large lists
- [[component-harness]] — testing virtual scroll requires careful harness setup due to DOM recycling

## Examples

Fixed-size virtual scroll:

```html
<!-- Host element MUST have an explicit height -->
<cdk-virtual-scroll-viewport itemSize="48" style="height: 400px;">
  <div *cdkVirtualFor="let item of items" class="item">
    {{ item.name }}
  </div>
</cdk-virtual-scroll-viewport>
```

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `...` // as above
})
class MyListComponent {
  items = Array.from({ length: 10_000 }, (_, i) => ({ name: `Item ${i}` }));
}
```

Custom variable-height strategy (skeleton):

```typescript
import { VirtualScrollStrategy, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

class VariableHeightStrategy implements VirtualScrollStrategy {
  attach(viewport: CdkVirtualScrollViewport) { /* ... */ }
  detach() { /* ... */ }
  onContentScrolled() { /* recalculate visible range */ }
  onDataLengthChanged() { /* ... */ }
  onContentRendered() { /* ... */ }
  onRenderedOffsetChanged() { /* ... */ }
  scrollToIndex(index: number, behavior: ScrollBehavior) { /* ... */ }
}
```

## References

- [[angular-cdk]]
- [[angular-cdk-big-picture-2026-05-12]]
