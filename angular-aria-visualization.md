# Angular Aria Visualization

## 🎯 What is Angular Aria?

**Angular Aria** is a collection of **headless, accessible directives** that implement WAI-ARIA patterns for building WCAG-compliant components.

```
┌─────────────────────────────────────────────────────────────┐
│                     ANGULAR ARIA                            │
│                  (@angular/aria v21+)                       │
│                                                             │
│  "Headless" = Logic + Accessibility, You provide styling   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        YOUR APPLICATION                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   HTML     │  │    CSS     │  │  Business  │               │
│  │ Structure  │  │  Styling   │  │   Logic    │               │
│  └─────┬──────┘  └────────────┘  └────────────┘               │
│        │                                                        │
│        │ You provide these ↑                                   │
├────────┼────────────────────────────────────────────────────────┤
│        ↓ Angular Aria provides ↓                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           ANGULAR ARIA DIRECTIVES                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • Keyboard Navigation (↑↓←→, Enter, Esc, Space)        │  │
│  │  • ARIA Attributes (roles, states, properties)          │  │
│  │  • Focus Management (roving, activedescendant)          │  │
│  │  • Screen Reader Support (announcements, labels)        │  │
│  │  • RTL Support (right-to-left languages)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Categories

### 1️⃣ Search and Selection
```
┌─────────────────────────────────────────────────────────┐
│  COMBOBOX                                               │
│  ├─ Searchable dropdown with keyboard navigation       │
│  └─ Example: Autocomplete, filterable select           │
│                                                         │
│  LISTBOX                                                │
│  ├─ Single/multi-select list with arrow key nav        │
│  └─ Example: Multi-select picker, option list          │
│                                                         │
│  TREE                                                   │
│  ├─ Hierarchical data with expand/collapse             │
│  └─ Example: File explorer, org chart                  │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ Navigation and Actions
```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR                                                │
│  ├─ Horizontal/vertical button groups                  │
│  └─ Example: Text editor toolbar, action bar           │
│                                                         │
│  MENU                                                   │
│  ├─ Dropdown menu with keyboard shortcuts              │
│  └─ Example: Context menu, dropdown actions            │
│                                                         │
│  TABS                                                   │
│  ├─ Tab navigation with panel switching                │
│  └─ Example: Settings tabs, content sections           │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ Content Organization
```
┌─────────────────────────────────────────────────────────┐
│  ACCORDION                                              │
│  ├─ Expandable/collapsible sections                    │
│  └─ Example: FAQ, collapsible panels                   │
│                                                         │
│  DISCLOSURE                                             │
│  ├─ Show/hide content toggle                           │
│  └─ Example: "Read more", expandable details           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Key Features Handled by Angular Aria

### Keyboard Navigation
```
┌──────────────────────────────────────────────────────┐
│  Key          │  Action                              │
├──────────────────────────────────────────────────────┤
│  ↑ ↓ ← →      │  Navigate items                      │
│  Enter/Space  │  Select/activate                     │
│  Escape       │  Close/cancel                        │
│  Home/End     │  First/last item                     │
│  Tab          │  Move focus in/out                   │
│  Type ahead   │  Jump to matching item               │
└──────────────────────────────────────────────────────┘
```

### ARIA Attributes (Auto-managed)
```
┌──────────────────────────────────────────────────────┐
│  role="tree"                                         │
│  aria-expanded="true"                                │
│  aria-selected="true"                                │
│  aria-disabled="false"                               │
│  aria-activedescendant="item-3"                      │
│  aria-current="page"                                 │
│  aria-label="Navigation tree"                        │
│  tabindex="0" / tabindex="-1"                        │
└──────────────────────────────────────────────────────┘
```

### Focus Management Strategies
```
┌─────────────────────────────────────────────────────────┐
│  ROVING TABINDEX                                        │
│  ├─ Focus moves to active item                         │
│  ├─ Only one item is tabbable at a time                │
│  └─ Best for: Lists, trees, toolbars                   │
│                                                         │
│  ACTIVEDESCENDANT                                       │
│  ├─ Container keeps focus                              │
│  ├─ aria-activedescendant points to active item        │
│  └─ Best for: Combobox, complex widgets                │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Example: Tree Component

```typescript
// Component Code
<ul ngTree [(value)]="selectedItems" [multi]="true">
  <ng-template
    [ngTemplateOutlet]="treeNodes"
    [ngTemplateOutletContext]="{nodes: treeData, parent: tree}"
  />
</ul>

<ng-template #treeNodes let-nodes="nodes" let-parent="parent">
  @for (node of nodes; track node.name) {
    <li ngTreeItem [parent]="parent" [value]="node.name" [label]="node.name">
      {{ node.name }}
      @if (node.children) {
        <ul role="group">
          <ng-template ngTreeItemGroup [ownedBy]="treeItem" #group="ngTreeItemGroup">
            <ng-template
              [ngTemplateOutlet]="treeNodes"
              [ngTemplateOutletContext]="{nodes: node.children, parent: group}"
            />
          </ng-template>
        </ul>
      }
    </li>
  }
</ng-template>
```

### What Angular Aria Handles Automatically:
```
✅ Keyboard navigation (↑↓←→ to navigate, Enter to expand/collapse)
✅ ARIA roles (role="tree", role="treeitem", role="group")
✅ ARIA states (aria-expanded, aria-selected, aria-level)
✅ Focus management (roving tabindex or activedescendant)
✅ Multi-selection logic (Ctrl+click, Shift+click)
✅ Screen reader announcements
✅ RTL support
```

### What You Provide:
```
🎨 CSS styling (colors, spacing, icons)
📐 HTML structure (ul/li or custom elements)
🧠 Business logic (data source, selection handlers)
```

---

## 🎯 When to Use Angular Aria

### ✅ Good Fit
- Building a **custom design system**
- Need **WCAG compliance** with **custom styling**
- Enterprise component libraries
- Specific brand requirements

### ❌ Not the Best Fit
- Need **pre-styled components** → Use **Angular Material**
- Simple forms with native controls → Use `<button>`, `<input>`
- Rapid prototyping → Use pre-built UI libraries

---

## 🔄 Angular Aria vs Alternatives

```
┌────────────────────────────────────────────────────────────┐
│                    COMPARISON                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ANGULAR ARIA                                              │
│  ├─ Headless (no styling)                                 │
│  ├─ Full accessibility built-in                           │
│  ├─ You control the look                                  │
│  └─ Best for: Custom design systems                       │
│                                                            │
│  ANGULAR MATERIAL                                          │
│  ├─ Pre-styled components                                 │
│  ├─ Material Design look                                  │
│  ├─ Accessible by default                                 │
│  └─ Best for: Quick development, Material Design apps     │
│                                                            │
│  NATIVE HTML                                               │
│  ├─ <select>, <button>, <input>                           │
│  ├─ Built-in accessibility                                │
│  ├─ Limited customization                                 │
│  └─ Best for: Simple forms                                │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Installation
```bash
npm install @angular/aria
```

### Basic Usage Pattern
```typescript
import { TreeDirective, TreeItemDirective } from '@angular/aria/tree';

@Component({
  selector: 'app-my-tree',
  standalone: true,
  imports: [TreeDirective, TreeItemDirective],
  template: `
    <ul ngTree [(value)]="selected">
      <li ngTreeItem value="item1">Item 1</li>
      <li ngTreeItem value="item2">Item 2</li>
    </ul>
  `
})
export class MyTreeComponent {
  selected = signal<string[]>([]);
}
```

---

## 📚 Key Concepts

### Signals-Based API (Modern Angular)
```typescript
// Input signals
readonly multi = input<boolean>(false);
readonly disabled = input<boolean>(false);

// Model signals (two-way binding)
readonly values = model<V[]>([]);

// Computed signals
readonly isExpanded = computed(() => ...);
```

### Selection Modes
```
┌──────────────────────────────────────────────────────┐
│  EXPLICIT                                            │
│  └─ User explicitly selects (click, spacebar)       │
│                                                      │
│  FOLLOW                                              │
│  └─ Selection follows focus automatically           │
└──────────────────────────────────────────────────────┘
```

---

## 🎓 Learning Path for Your Research

1. **Start Simple**: Build a basic Toolbar or Disclosure
2. **Add Complexity**: Try Tabs or Accordion
3. **Advanced**: Implement Tree or Combobox
4. **Custom Styling**: Apply your design system
5. **Test Accessibility**: Keyboard-only navigation, screen readers

---

## 📖 Resources

- [Official Docs](https://angular.dev/guide/aria/overview)
- [API Reference](https://angular.dev/api/aria)
- [Accessibility Guide](https://angular.dev/best-practices/a11y)
- [WAI-ARIA Patterns](https://www.w3.org/WAI/ARIA/apg/)

---

*Content synthesized from [Angular documentation](https://angular.dev/guide/aria/overview) for research purposes.*
