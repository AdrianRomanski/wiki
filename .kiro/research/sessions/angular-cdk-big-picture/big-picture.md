# @angular/cdk — Big Picture

**Version:** 21.2.10  
**Research date:** 2026-05-11  
**Scope:** Big Picture

---

## Entry Points

The CDK ships as a collection of independent sub-packages, each with its own entry point. You import only what you need — there is no single monolithic import.

| Entry Point | Purpose |
|---|---|
| `@angular/cdk` | Root barrel (re-exports everything) |
| `@angular/cdk/a11y` | Accessibility utilities |
| `@angular/cdk/accordion` | Expandable accordion primitives |
| `@angular/cdk/bidi` | Bidirectional text (LTR/RTL) support |
| `@angular/cdk/clipboard` | Clipboard read/write |
| `@angular/cdk/coercion` | Type coercion utilities |
| `@angular/cdk/collections` | Data structures (SelectionModel, DataSource) |
| `@angular/cdk/dialog` | Accessible dialog/modal primitives |
| `@angular/cdk/drag-drop` | Drag and drop with sorting |
| `@angular/cdk/keycodes` | Keyboard key code constants |
| `@angular/cdk/layout` | Responsive breakpoint detection |
| `@angular/cdk/listbox` | ARIA listbox pattern |
| `@angular/cdk/menu` | ARIA menu/menubar pattern |
| `@angular/cdk/observers` | DOM mutation and resize observation |
| `@angular/cdk/overlay` | Floating panels, tooltips, dropdowns |
| `@angular/cdk/platform` | Browser/platform detection |
| `@angular/cdk/portal` | Dynamic content projection |
| `@angular/cdk/scrolling` | Virtual scrolling and scroll utilities |
| `@angular/cdk/stepper` | Multi-step wizard primitives |
| `@angular/cdk/table` | Data table with sorting/filtering |
| `@angular/cdk/testing` | Component harness testing infrastructure |
| `@angular/cdk/testing/testbed` | Angular TestBed harness environment |
| `@angular/cdk/testing/selenium-webdriver` | Selenium harness environment |
| `@angular/cdk/text-field` | Textarea autosize and autofill detection |
| `@angular/cdk/tree` | Tree structure primitives |

**CSS-only entry points:**
- `@angular/cdk/a11y-prebuilt.css` — prebuilt a11y styles (focus indicators, visually-hidden)
- `@angular/cdk/overlay-prebuilt.css` — prebuilt overlay/panel styles
- `@angular/cdk/text-field-prebuilt.css` — prebuilt textarea styles

---

## Peer Dependencies

```json
{
  "@angular/core": "^21.0.0 || ^22.0.0",
  "@angular/common": "^21.0.0 || ^22.0.0",
  "@angular/platform-browser": "^21.0.0 || ^22.0.0",
  "rxjs": "^6.5.3 || ^7.4.0"
}
```

Direct dependencies: `parse5` (HTML parsing), `tslib` (TypeScript helpers).

---

## Exported Symbols by Category

### Accessibility (`@angular/cdk/a11y`)

**Focus management**
- `FocusTrap`, `ConfigurableFocusTrap`, `ConfigurableFocusTrapFactory`, `FocusTrapFactory` — trap keyboard focus within a region
- `CdkTrapFocus` — directive to declaratively trap focus
- `FocusKeyManager`, `ActiveDescendantKeyManager` — manage keyboard navigation through a list of focusable items
- `ListKeyManager` — base class for key managers
- `FocusMonitor`, `CdkMonitorFocus` — detect how an element received focus (mouse, keyboard, touch, program)
- `FocusOrigin`, `FocusOptions`, `FocusMonitorDetectionMode`

**Live regions / announcements**
- `LiveAnnouncer`, `CdkAriaLive` — announce messages to screen readers via ARIA live regions
- `AriaLivePoliteness` — `"polite"` | `"assertive"` | `"off"`

**Interactivity**
- `InteractivityChecker` — check if an element is focusable, tabbable, or visible
- `InputModalityDetector` — detect current input modality (keyboard, mouse, touch)

**ARIA utilities**
- `AriaDescriber` — manage `aria-describedby` relationships
- `addAriaReferencedId`, `removeAriaReferencedId`, `getAriaReferenceIds`
- `HighContrastModeDetector`, `HighContrastMode`

**Tree key management**
- `TreeKeyManager`, `NoopTreeKeyManager`, `TreeKeyManagerStrategy`

**Utilities**
- `isFakeMousedownFromScreenReader`, `isFakeTouchstartFromScreenReader`
- `_IdGenerator` — internal unique ID generator

**Module:** `A11yModule`

---

### Accordion (`@angular/cdk/accordion`)

- `CdkAccordion` — container that manages expanded state across items
- `CdkAccordionItem` — individual expandable item
- `CDK_ACCORDION` — injection token

**Module:** `CdkAccordionModule`

---

### Bidi (`@angular/cdk/bidi`)

- `Directionality` — service providing current text direction (`ltr`/`rtl`)
- `Dir` — directive to set/observe text direction on an element
- `Direction` — type alias `"ltr" | "rtl"`
- `DIR_DOCUMENT` — injection token for the document used to detect direction

**Module:** `BidiModule`

---

### Clipboard (`@angular/cdk/clipboard`)

- `Clipboard` — service to copy text to clipboard
- `CdkCopyToClipboard` — directive for declarative copy-on-click
- `PendingCopy` — handle for an in-progress copy operation
- `CDK_COPY_TO_CLIPBOARD_CONFIG` — injection token for default config

**Module:** `ClipboardModule`

---

### Coercion (`@angular/cdk/coercion`)

Pure utility functions — no Angular dependencies:
- `coerceBooleanProperty` — coerce any value to boolean (handles `""`, `"false"`, etc.)
- `coerceNumberProperty` — coerce to number with fallback
- `coerceArray` — wrap non-array values in an array
- `coerceCssPixelValue` — append `px` if value is a number
- `coerceElement` — unwrap `ElementRef` or return raw element
- `coerceStringArray` — coerce to string array

---

### Collections (`@angular/cdk/collections`)

**Data sources**
- `DataSource<T>` — abstract base for CDK data sources
- `ArrayDataSource<T>` — simple array-backed data source
- `CollectionViewer` — interface for components that display a collection

**Selection**
- `SelectionModel<T>` — manages single or multi-selection state
- `UniqueSelectionDispatcher` — coordinates single-selection across sibling components

**View repeaters (internal)**
- `_ViewRepeater`, `_DisposeViewRepeaterStrategy`, `_RecycleViewRepeaterStrategy`

---

### Dialog (`@angular/cdk/dialog`)

- `Dialog` — service to open accessible modal dialogs
- `DialogRef<R, C>` — reference to an open dialog; close/result/state
- `DialogConfig<D>` — configuration (data, position, size, ARIA role, etc.)
- `CdkDialogContainer` — the host container component
- `DIALOG_DATA` — injection token to pass data into dialog
- `DIALOG_SCROLL_STRATEGY` — injection token for scroll strategy
- `DEFAULT_DIALOG_CONFIG` — injection token for default config
- `DialogRole` — `"dialog"` | `"alertdialog"`

**Module:** `DialogModule`

---

### Drag & Drop (`@angular/cdk/drag-drop`)

**Directives**
- `CdkDrag` — makes an element draggable
- `CdkDropList` — container that accepts dropped items
- `CdkDropListGroup` — groups drop lists for cross-list transfers
- `CdkDragHandle` — designates a drag handle within a draggable
- `CdkDragPreview` — custom preview shown while dragging
- `CdkDragPlaceholder` — custom placeholder shown in the original position

**Services / refs**
- `DragDrop` — service to programmatically create drag/drop refs
- `DragRef`, `DropListRef` — low-level imperative API
- `DragDropRegistry` — tracks all active drag/drop instances
- `createDragRef`, `createDropListRef` — factory functions

**Utilities**
- `moveItemInArray` — reorder items within an array
- `transferArrayItem` — move item between two arrays
- `copyArrayItem` — copy item between two arrays

**Events / types**
- `CdkDragDrop`, `CdkDragStart`, `CdkDragEnd`, `CdkDragMove`, `CdkDragEnter`, `CdkDragExit`, `CdkDragSortEvent`, `CdkDragRelease`
- `DragAxis`, `DragConstrainPosition`, `DropListOrientation`, `Point`

**Module:** `DragDropModule`

---

### Keycodes (`@angular/cdk/keycodes`)

Numeric constants for every keyboard key (`ENTER`, `SPACE`, `TAB`, `ESCAPE`, `UP_ARROW`, `DOWN_ARROW`, `A`–`Z`, `F1`–`F12`, numpad keys, media keys, etc.).

- `hasModifierKey(event, ...modifiers)` — check if a keyboard event has specific modifier keys

---

### Layout (`@angular/cdk/layout`)

- `BreakpointObserver` — observe CSS media query breakpoints as Observables
- `Breakpoints` — named breakpoint constants (`Handset`, `Tablet`, `Web`, `HandsetPortrait`, etc.)
- `MediaMatcher` — low-level wrapper around `window.matchMedia`

**Module:** `LayoutModule`

---

### Listbox (`@angular/cdk/listbox`)

Implements the ARIA listbox pattern:
- `CdkListbox` — the listbox container (manages selection, keyboard nav)
- `CdkOption` — individual option within a listbox

**Module:** `CdkListboxModule`

---

### Menu (`@angular/cdk/menu`)

Full ARIA menu/menubar pattern implementation:
- `CdkMenu`, `CdkMenuBar` — menu and menubar containers
- `CdkMenuItem`, `CdkMenuItemCheckbox`, `CdkMenuItemRadio`, `CdkMenuItemSelectable` — menu item variants
- `CdkMenuGroup` — groups related menu items
- `CdkMenuTrigger`, `CdkContextMenuTrigger` — open menus on click or right-click
- `CdkMenuBase`, `CdkMenuTriggerBase` — base classes for extension
- `MenuStack` — manages the stack of open menus
- `CdkTargetMenuAim`, `TargetMenuAim`, `PointerFocusTracker` — pointer-based menu aim (diagonal movement)
- `MENU_AIM`, `MENU_STACK`, `MENU_TRIGGER`, `MENU_SCROLL_STRATEGY` — injection tokens

**Module:** `CdkMenuModule`

---

### Observers (`@angular/cdk/observers`)

- `ContentObserver` — observe changes to an element's content (MutationObserver wrapper)
- `CdkObserveContent` — directive to declaratively observe content changes
- `MutationObserverFactory` — injectable factory for MutationObserver

**Module:** `ObserversModule`

---

### Overlay (`@angular/cdk/overlay`)

The most complex CDK module — powers tooltips, dropdowns, dialogs, and any floating UI.

**Core**
- `Overlay` — service to create overlay panels
- `OverlayRef` — reference to an open overlay; attach/detach/dispose/position
- `OverlayConfig` — configuration (scroll strategy, position strategy, size, backdrop, etc.)
- `OverlayContainer`, `FullscreenOverlayContainer` — the DOM container for overlays

**Position strategies**
- `FlexibleConnectedPositionStrategy` — position relative to an origin element with fallback positions
- `GlobalPositionStrategy` — position relative to the viewport (center, top, etc.)
- `OverlayPositionBuilder` — factory for position strategies
- `ConnectedPosition`, `ConnectionPositionPair`, `ConnectedOverlayPositionChange`
- `createFlexibleConnectedPositionStrategy`, `createGlobalPositionStrategy`
- `STANDARD_DROPDOWN_ADJACENT_POSITIONS`, `STANDARD_DROPDOWN_BELOW_POSITIONS` — preset position arrays

**Scroll strategies**
- `BlockScrollStrategy` — block page scroll while overlay is open
- `CloseScrollStrategy` — close overlay on scroll
- `NoopScrollStrategy` — do nothing on scroll
- `RepositionScrollStrategy` — reposition overlay on scroll
- `ScrollStrategyOptions` — injectable factory for scroll strategies
- `createBlockScrollStrategy`, `createCloseScrollStrategy`, `createNoopScrollStrategy`, `createRepositionScrollStrategy`

**Directives**
- `CdkConnectedOverlay` — declarative overlay anchored to an origin
- `CdkOverlayOrigin` — marks an element as an overlay origin

**Dispatchers**
- `OverlayKeyboardDispatcher` — route keyboard events to the topmost overlay
- `OverlayOutsideClickDispatcher` — detect clicks outside an overlay

**Viewport**
- `ViewportRuler` — get viewport dimensions and scroll position
- `ScrollDispatcher` — track scrollable ancestors

**Module:** `OverlayModule`

---

### Platform (`@angular/cdk/platform`)

- `Platform` — detect browser environment (`isBrowser`, `EDGE`, `TRIDENT`, `FIREFOX`, `WEBKIT`, `IOS`, `ANDROID`, `SAFARI`)
- `RtlScrollAxisType` — enum for RTL scroll axis behavior
- `getSupportedInputTypes()` — set of supported `<input type>` values
- `getRtlScrollAxisType()` — detect how the browser handles RTL scroll
- `supportsScrollBehavior()`, `supportsPassiveEventListeners()`
- `normalizePassiveListenerOptions()` — normalize passive event listener options
- `_getEventTarget`, `_getFocusedElementPierceShadowDom`, `_getShadowRoot`, `_supportsShadowDom`
- `_isTestEnvironment()` — detect if running in a test environment

**Module:** `PlatformModule`

---

### Portal (`@angular/cdk/portal`)

Render content (components, templates, DOM nodes) into arbitrary locations in the DOM.

**Portals (content to render)**
- `ComponentPortal<T>` — render a component
- `TemplatePortal<C>` — render a `TemplateRef`
- `DomPortal` — render an existing DOM element
- `Portal<T>` — abstract base

**Outlets (where to render)**
- `PortalOutlet` — interface for portal destinations
- `BasePortalOutlet` — abstract base with attach/detach lifecycle
- `DomPortalOutlet` — render into an arbitrary DOM element
- `CdkPortalOutlet` — directive to use a portal outlet in a template
- `CdkPortal` — directive to declare a template as a portal

**Module:** `PortalModule`

---

### Scrolling (`@angular/cdk/scrolling`)

**Virtual scrolling**
- `CdkVirtualScrollViewport` — the scrollable viewport container
- `CdkVirtualForOf` — structural directive (like `*ngFor`) for virtual lists
- `CdkFixedSizeVirtualScroll` — fixed-height item virtual scroll strategy
- `FixedSizeVirtualScrollStrategy` — the strategy implementation
- `VirtualScrollStrategy` — interface for custom strategies
- `VIRTUAL_SCROLL_STRATEGY` — injection token for custom strategy
- `CdkVirtualScrollableElement`, `CdkVirtualScrollableWindow` — scrollable container variants

**Scroll utilities**
- `ScrollDispatcher` — track and notify about scroll events across scrollable elements
- `CdkScrollable` — marks an element as scrollable for the dispatcher
- `ViewportRuler` — viewport size and scroll position
- `DEFAULT_SCROLL_TIME`, `DEFAULT_RESIZE_TIME`

**Module:** `ScrollingModule`

---

### Stepper (`@angular/cdk/stepper`)

- `CdkStepper` — manages a sequence of steps
- `CdkStep` — individual step with label, content, and state
- `CdkStepLabel` — directive to provide a template-based step label
- `CdkStepHeader` — base for step header components
- `CdkStepperNext`, `CdkStepperPrevious` — navigation buttons
- `StepperSelectionEvent` — emitted when the active step changes
- `STEPPER_GLOBAL_OPTIONS` — injection token for global stepper config
- `STEP_STATE` — built-in step states (`number`, `edit`, `done`, `error`)

**Module:** `CdkStepperModule`

---

### Table (`@angular/cdk/table`)

- `CdkTable<T>` — the table component (renders rows from a data source)
- `CdkColumnDef` — defines a column by name
- `CdkCellDef`, `CdkHeaderCellDef`, `CdkFooterCellDef` — cell template definitions
- `CdkCell`, `CdkHeaderCell`, `CdkFooterCell` — rendered cell elements
- `CdkRowDef`, `CdkHeaderRowDef`, `CdkFooterRowDef` — row template definitions
- `CdkRow`, `CdkHeaderRow`, `CdkFooterRow` — rendered row elements
- `CdkNoDataRow` — shown when the data source is empty
- `CdkTextColumn` — simple text column shorthand
- `CdkRecycleRows` — opt-in row recycling for performance
- `CDK_TABLE` — injection token for the table
- `STICKY_POSITIONING_LISTENER` — injection token for sticky column coordination
- `TEXT_COLUMN_OPTIONS` — injection token for text column defaults

**Module:** `CdkTableModule`

---

### Testing (`@angular/cdk/testing`)

Component harness infrastructure — write tests that work across TestBed and real browsers.

**Core**
- `ComponentHarness` — base class for all component harnesses
- `HarnessEnvironment` — abstract environment (TestBed or Selenium)
- `HarnessLoader` — load harnesses for components in the DOM
- `HarnessPredicate<T>` — filter harnesses by criteria
- `TestElement` — abstraction over a DOM element in tests

**Utilities**
- `parallel()` — run multiple async harness operations in parallel
- `manualChangeDetection()` — control change detection in tests
- `handleAutoChangeDetectionStatus()`, `stopHandlingAutoChangeDetectionStatus()`

**Sub-entries**
- `@angular/cdk/testing/testbed` — Angular TestBed environment
- `@angular/cdk/testing/selenium-webdriver` — Selenium WebDriver environment

---

### Text Field (`@angular/cdk/text-field`)

- `AutofillMonitor` — detect browser autofill on inputs
- `CdkAutofill` — directive to emit events on autofill
- `CdkTextareaAutosize` — auto-resize a textarea to fit its content
- `AutofillEvent` — event emitted when autofill state changes

**Module:** `TextFieldModule`

---

### Tree (`@angular/cdk/tree`)

- `CdkTree<T>` — the tree component
- `CdkTreeNode<T>` — individual tree node
- `CdkTreeNodeDef<T>` — defines a node template
- `CdkTreeNodeOutlet` — where nodes are rendered
- `CdkNestedTreeNode<T>` — node with nested children
- `CdkTreeNodePadding<T>` — adds indentation based on node level
- `CdkTreeNodeToggle<T>` — toggle expand/collapse on click
- `FlatTreeControl<T>` — tree control for flat (flattened) data
- `NestedTreeControl<T>` — tree control for nested data
- `BaseTreeControl<T>` — abstract base
- `CDK_TREE_NODE_OUTLET_NODE` — injection token

**Module:** `CdkTreeModule`

---

## Public API Surface Summary

The CDK exposes **25 entry points** covering:

| Category | Modules |
|---|---|
| **Accessibility** | `a11y`, `keycodes`, `bidi` |
| **Layout & Scrolling** | `layout`, `scrolling`, `overlay` |
| **Data Display** | `table`, `tree`, `accordion`, `stepper` |
| **User Interaction** | `drag-drop`, `listbox`, `menu`, `clipboard`, `text-field` |
| **Content Projection** | `portal`, `dialog` |
| **Utilities** | `coercion`, `collections`, `platform`, `observers` |
| **Testing** | `testing`, `testing/testbed`, `testing/selenium-webdriver` |

Key design principles visible in the API:
- **Headless primitives** — behavior without styling; you bring the CSS
- **Injection token overrides** — nearly every default is overridable via DI
- **Standalone-friendly** — all modules export standalone-compatible directives
- **Tree-shakeable** — `"sideEffects": false` in package.json; import only what you use
- **Imperative + declarative** — most features offer both a directive API and a service/ref API
