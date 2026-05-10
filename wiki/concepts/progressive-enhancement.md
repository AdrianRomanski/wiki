---
title: Progressive Enhancement
type: concept
tags: [accessibility, web-development, design-pattern]
sources: []
created: 2024-05-10
updated: 2024-05-10
---

# Progressive Enhancement

## Explanation

Progressive Enhancement is a web design strategy that emphasizes core content and functionality first, then progressively adds enhanced experiences for users with more capable browsers or devices. The approach ensures that basic content and features remain accessible to all users, regardless of their technology constraints.

**Core Principle**: Start with a solid foundation that works for everyone, then layer on enhancements.

**Layers:**
1. **Content Layer** (HTML) - Semantic, accessible markup
2. **Presentation Layer** (CSS) - Visual styling and layout
3. **Behavior Layer** (JavaScript) - Interactive enhancements

## Applications

### Web Accessibility

Progressive enhancement is fundamental to accessibility:
- Content remains accessible when JavaScript fails or is disabled
- Screen readers can access semantic HTML structure
- Keyboard navigation works without JavaScript enhancements
- Users with older browsers or assistive technologies aren't excluded

### Angular Applications

In Angular, progressive enhancement means:
- Using semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Providing ARIA attributes for enhanced screen reader support
- Ensuring keyboard navigation works before adding mouse interactions
- Testing with JavaScript disabled to verify core functionality

### Performance

Progressive enhancement improves performance:
- Core content loads first (HTML)
- Styling loads next (CSS)
- Enhancements load last (JavaScript)
- Users can access content while JavaScript loads

## Related Concepts

- [[semantic-html]] - Foundation of progressive enhancement
- [[aria-patterns]] - Enhanced accessibility layer
- [[keyboard-navigation]] - Core interaction pattern
- [[graceful-degradation]] - Contrasting approach (start rich, fall back)

## Examples

### Basic Button (Progressive Enhancement)

```html
<!-- Layer 1: Semantic HTML (works everywhere) -->
<button type="button">Save Changes</button>

<!-- Layer 2: CSS Enhancement (visual feedback) -->
<style>
  button:hover { background-color: #0056b3; }
  button:focus { outline: 2px solid #0056b3; }
</style>

<!-- Layer 3: JavaScript Enhancement (async save) -->
<script>
  button.addEventListener('click', async () => {
    await saveChanges();
    showSuccessMessage();
  });
</script>
```

### Angular Component Example

```typescript
@Component({
  selector: 'app-expandable-section',
  template: `
    <!-- Semantic HTML foundation -->
    <section>
      <h2>
        <button 
          type="button"
          [attr.aria-expanded]="isExpanded"
          (click)="toggle()">
          {{ title }}
        </button>
      </h2>
      
      <!-- Content visible by default (no JS required) -->
      <div [hidden]="!isExpanded">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class ExpandableSectionComponent {
  @Input() title: string;
  isExpanded = true; // Default to expanded (progressive enhancement)
  
  toggle() {
    this.isExpanded = !this.isExpanded;
  }
}
```

## References

- [[angular-cdk]] - Provides primitives that support progressive enhancement
