# @angular/cdk — Big Picture

**Library:** `@angular/cdk`
**Installed version:** `21.2.10`
**Research date:** `2026-05-12`

---

## Entry Points

The library is fully tree-shakeable (`"sideEffects": false`) and exposes 22 named sub-package entry points plus a root barrel, CSS prebuilts, and a schematics entry.

| Entry Point | Purpose |
|---|---|
| `@angular/cdk` | Root barrel — re-exports everything |
| `@angular/cdk/a11y` | Accessibility utilities (focus, live regions, key managers) |
| `@angular/cdk/accordion` | Expandable accordion primitives |
| `@angular/cdk/bidi` | Bidirectional text (LTR/RTL) support |
| `@angular/cdk/clipboard` | Clipboard read/write |
| `@angular/cdk/coercion` | Type coercion helpers |
| `@angular/cdk/collections` | Data sources, selection models, view repeaters |
| `@angular/cdk/dialog` | Accessible dialog/modal primitives |
| `@angular/cdk/drag-drop` | Drag-and-drop with sorting and transfer |
| `@angular/cdk/keycodes` | Keyboard key code constants |
| `@angular/cdk/layout` | Responsive breakpoint observation |
| `@angular/cdk/listbox` | ARIA listbox pattern |
| `@angular/cdk/menu` | ARIA menu/menubar/context-menu pattern |
| `@angular/cdk/observers` | DOM mutation and content observation |
| `@angular/cdk/overlay` | Floating panels, tooltips, dropdowns |
| `@angular/cdk/platform` | Browser/platform detection |
| `@angular/cdk/portal` | Dynamic content projection (component/template/DOM portals) |
| `@angular/cdk/scrolling` | Virtual scrolling and scroll utilities |
| `@angular/cdk/stepper` | Multi-step wizard primitives |
| `@angular/cdk/table` | Data table with sticky headers/columns |
| `@angular/cdk/testing` | Component harness testing infrastructure |
| `@angular/cdk/text-field` | Textarea autoresize and autofill detection |
| `@angular/cdk/tree` | Tree view (flat and nested) |
| `@angular/cdk/schematics` | Angular CLI schematics (code generation) |

**CSS prebuilts:**
- `@angular/cdk/a11y-prebuilt.css` — focus indicator styles
- `@angular/cdk/overlay-prebuilt.css` — overlay/panel base styles
- `@angular/cdk/text-field-prebuilt.css` — textarea autoresize styles

---

## Exported Symbols by Category

### Accessibility (`@angular/cdk/a11y`)

**Key Managers** — keyboard navigation abstractions:
- `ListKeyManager`, `ListKeyManagerOption`, `ListKeyManagerModifierKey`
- `FocusKeyManager`, `FocusableOption`
- `ActiveDescendantKeyManager`, `Highlightable`
- `TreeKeyManager`, `TreeKeyManagerItem`, `TreeKeyManagerOptions`, `TreeKeyManagerStrategy`, `TreeKeyManagerFactory`
- `NoopTreeKeyManager`, `NOOP_TREE_KEY_MANAGER_FACTORY_PROVIDER`, `TREE_KEY_MANAGER`

**Focus Trapping:**
- `FocusTrap`, `FocusTrapFactory`
- `ConfigurableFocusTrap`, `ConfigurableFocusTrapFactory`, `ConfigurableFocusTrapConfig`
- `EventListenerFocusTrapInertStrategy`, `FOCUS_TRAP_INERT_STRATEGY`, `FocusTrapInertStrategy`
- `CdkTrapFocus`

**Focus Monitoring:**
- `FocusMonitor`, `FocusMonitorOptions`, `FocusMonitorDetectionMode`, `FocusOptions`, `FocusOrigin`
- `CdkMonitorFocus`, `FOCUS_MONITOR_DEFAULT_OPTIONS`

**Live Announcer (ARIA live regions):**
- `LiveAnnouncer`, `LiveAnnouncerMessage`, `LiveAnnouncerDefaultOptions`
- `CdkAriaLive`, `AriaLivePoliteness`
- `LIVE_ANNOUNCER_DEFAULT_OPTIONS`, `LIVE_ANNOUNCER_ELEMENT_TOKEN`

**Aria Describer:**
- `AriaDescriber`, `CDK_DESCRIBEDBY_HOST_ATTRIBUTE`, `CDK_DESCRIBEDBY_ID_PREFIX`
- `addAriaReferencedId`, `removeAriaReferencedId`, `getAriaReferenceIds`

**Input Modality:**
- `InputModalityDetector`, `InputModalityDetectorOptions`, `INPUT_MODALITY_DETECTOR_OPTIONS`, `INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS`, `InputModality`

**High Contrast:**
- `HighContrastModeDetector`, `HighContrastMode`

**Utilities:**
- `InteractivityChecker`, `IsFocusableConfig`
- `isFakeMousedownFromScreenReader`, `isFakeTouchstartFromScreenReader`
- `_IdGenerator`, `MESSAGES_CONTAINER_ID`
- `A11yModule`

---

### Accordion (`@angular/cdk/accordion`)
- `CdkAccordion`, `CdkAccordionItem`, `CDK_ACCORDION`, `CdkAccordionModule`

---

### Bidi (`@angular/cdk/bidi`)
- `Directionality`, `Dir`, `Direction`, `DIR_DOCUMENT`, `BidiModule`

---

### Clipboard (`@angular/cdk/clipboard`)
- `Clipboard`, `CdkCopyToClipboard`, `CdkCopyToClipboardConfig`, `CDK_COPY_TO_CLIPBOARD_CONFIG`, `PendingCopy`, `ClipboardModule`

---

### Coercion (`@angular/cdk/coercion`)
- `coerceBooleanProperty`, `BooleanInput`
- `coerceNumberProperty`, `coerceArray`, `coerceCssPixelValue`, `coerceElement`, `coerceStringArray`
- `NumberInput`, `_isNumberValue`

---

### Collections (`@angular/cdk/collections`)

**Data Sources:**
- `DataSource`, `ArrayDataSource`, `CollectionViewer`, `ListRange`, `isDataSource`

**Selection:**
- `SelectionModel`, `SelectionChange`, `getMultipleValuesInSingleSelectionError`
- `UniqueSelectionDispatcher`, `UniqueSelectionDispatcherListener`

**View Repeaters (internal/advanced):**
- `_ViewRepeater`, `_DisposeViewRepeaterStrategy`, `_RecycleViewRepeaterStrategy`
- `_ViewRepeaterOperation`, `_ViewRepeaterItemChange`, `_ViewRepeaterItemInsertArgs`
- `_ViewRepeaterItemContext`, `_ViewRepeaterItemContextFactory`, `_ViewRepeaterItemValueResolver`, `_ViewRepeaterItemChanged`

---

### Dialog (`@angular/cdk/dialog`)
- `Dialog`, `DialogRef`, `DialogConfig`, `DialogModule`
- `CdkDialogContainer`, `DEFAULT_DIALOG_CONFIG`, `DIALOG_DATA`, `DIALOG_SCROLL_STRATEGY`
- `AutoFocusTarget`, `DialogRole`, `DialogCloseOptions`, `RestoreFocusValue`, `DialogContainer`
- `throwDialogContentAlreadyAttachedError`

---

### Drag & Drop (`@angular/cdk/drag-drop`)

**Directives:**
- `CdkDrag`, `CdkDragHandle`, `CdkDragPreview`, `CdkDragPlaceholder`
- `CdkDropList`, `CdkDropListGroup`

**Services/Refs:**
- `DragDrop`, `DragRef`, `DropListRef`, `DragDropRegistry`
- `createDragRef`, `createDropListRef`

**Utilities:**
- `moveItemInArray`, `transferArrayItem`, `copyArrayItem`

**Config/Tokens:**
- `CDK_DRAG_CONFIG`, `CDK_DRAG_HANDLE`, `CDK_DRAG_PARENT`, `CDK_DRAG_PLACEHOLDER`, `CDK_DRAG_PREVIEW`, `CDK_DROP_LIST`, `CDK_DROP_LIST_GROUP`

**Event Types:**
- `CdkDragDrop`, `CdkDragStart`, `CdkDragEnd`, `CdkDragMove`, `CdkDragRelease`
- `CdkDragEnter`, `CdkDragExit`, `CdkDragSortEvent`
- `DragAxis`, `DragConstrainPosition`, `DragDropConfig`, `DragRefConfig`, `DragStartDelay`, `DropListOrientation`, `Point`, `PreviewContainer`
- `DragDropModule`

---

### Keycodes (`@angular/cdk/keycodes`)
- Full set of key code constants: `ENTER`, `SPACE`, `TAB`, `ESCAPE`, `UP_ARROW`, `DOWN_ARROW`, `LEFT_ARROW`, `RIGHT_ARROW`, `HOME`, `END`, `PAGE_UP`, `PAGE_DOWN`, `BACKSPACE`, `DELETE`, all letter/number/function keys, numpad keys, media keys, modifier keys (`SHIFT`, `CONTROL`, `ALT`, `META`)
- `hasModifierKey` — utility to check if a keyboard event has a modifier key
- `ModifierKey` type

---

### Layout (`@angular/cdk/layout`)
- `BreakpointObserver`, `BreakpointState`, `Breakpoints` (predefined media query constants)
- `MediaMatcher`, `LayoutModule`

---

### Listbox (`@angular/cdk/listbox`)
- `CdkListbox`, `CdkOption`, `CdkListboxModule`, `ListboxValueChangeEvent`

---

### Menu (`@angular/cdk/menu`)

**Components/Directives:**
- `CdkMenu`, `CdkMenuBar`, `CdkMenuBase`, `CdkMenuGroup`
- `CdkMenuItem`, `CdkMenuItemCheckbox`, `CdkMenuItemRadio`, `CdkMenuItemSelectable`
- `CdkMenuTrigger`, `CdkMenuTriggerBase`, `CdkContextMenuTrigger`
- `CdkTargetMenuAim`, `TargetMenuAim`

**Services/Internals:**
- `MenuStack`, `MenuTracker`, `ContextMenuTracker`, `PointerFocusTracker`
- `MENU_STACK`, `MENU_AIM`, `MENU_TRIGGER`, `MENU_SCROLL_STRATEGY`, `CDK_MENU`
- `PARENT_OR_NEW_MENU_STACK_PROVIDER`, `PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER`
- `FocusNext`

**Types:**
- `Menu`, `MenuAim`, `MenuStackItem`, `MenuStackCloseEvent`, `CloseOptions`, `ContextMenuCoordinates`, `FocusableElement`, `Toggler`
- `CdkMenuModule`

---

### Observers (`@angular/cdk/observers`)
- `ContentObserver`, `CdkObserveContent`, `MutationObserverFactory`, `ObserversModule`

---

### Overlay (`@angular/cdk/overlay`)

**Core:**
- `Overlay`, `OverlayRef`, `OverlayConfig`, `OverlayContainer`, `FullscreenOverlayContainer`
- `OverlayModule`, `OVERLAY_DEFAULT_CONFIG`, `OverlayDefaultConfig`

**Position Strategies:**
- `GlobalPositionStrategy`, `createGlobalPositionStrategy`
- `FlexibleConnectedPositionStrategy`, `FlexibleConnectedPositionStrategyOrigin`
- `createFlexibleConnectedPositionStrategy`
- `OverlayPositionBuilder`, `PositionStrategy`
- `ConnectedPosition`, `ConnectionPositionPair`, `ConnectedOverlayPositionChange`
- `OriginConnectionPosition`, `OverlayConnectionPosition`
- `HorizontalConnectionPos`, `VerticalConnectionPos`
- `STANDARD_DROPDOWN_ADJACENT_POSITIONS`, `STANDARD_DROPDOWN_BELOW_POSITIONS`
- `FlexibleOverlayPopoverLocation`
- `validateHorizontalPosition`, `validateVerticalPosition`

**Scroll Strategies:**
- `BlockScrollStrategy`, `createBlockScrollStrategy`
- `CloseScrollStrategy`, `createCloseScrollStrategy`
- `NoopScrollStrategy`, `createNoopScrollStrategy`
- `RepositionScrollStrategy`, `createRepositionScrollStrategy`, `RepositionScrollStrategyConfig`
- `ScrollStrategyOptions`, `ScrollStrategy`
- `ScrollDispatcher`, `ViewportRuler`

**Directives:**
- `CdkOverlayOrigin`, `CdkConnectedOverlay`, `CdkConnectedOverlayConfig`
- `CDK_CONNECTED_OVERLAY_DEFAULT_CONFIG`

**Dispatchers:**
- `OverlayKeyboardDispatcher`, `OverlayOutsideClickDispatcher`

**Types:**
- `OverlaySizeConfig`, `ScrollingVisibility`, `ViewportMargin`
- `createOverlayRef`

---

### Platform (`@angular/cdk/platform`)
- `Platform`, `PlatformModule`
- `RtlScrollAxisType`, `getRtlScrollAxisType`
- `getSupportedInputTypes`, `supportsPassiveEventListeners`, `supportsScrollBehavior`
- `normalizePassiveListenerOptions`
- `_getEventTarget`, `_getFocusedElementPierceShadowDom`, `_getShadowRoot`
- `_supportsShadowDom`, `_isTestEnvironment`

---

### Portal (`@angular/cdk/portal`)

**Portal Types:**
- `ComponentPortal`, `TemplatePortal`, `DomPortal`
- `Portal`, `BasePortalOutlet`, `PortalOutlet`

**Directives:**
- `CdkPortal`, `CdkPortalOutlet`, `CdkPortalOutletAttachedRef`
- `DomPortalOutlet`

**Types:**
- `ComponentType`, `PortalModule`

---

### Scrolling (`@angular/cdk/scrolling`)

**Virtual Scroll:**
- `CdkVirtualScrollViewport`, `CdkVirtualForOf`, `CdkVirtualForOfContext`
- `CdkFixedSizeVirtualScroll`, `FixedSizeVirtualScrollStrategy`
- `CdkVirtualScrollRepeater`, `CdkVirtualScrollable`
- `CdkVirtualScrollableElement`, `CdkVirtualScrollableWindow`
- `VIRTUAL_SCROLL_STRATEGY`, `VIRTUAL_SCROLLABLE`, `CDK_VIRTUAL_SCROLL_VIEWPORT`
- `VirtualScrollStrategy`, `_fixedSizeVirtualScrollStrategyFactory`

**Scroll Utilities:**
- `CdkScrollable`, `CdkScrollableModule`, `ScrollDispatcher`, `ScrollingModule`
- `ViewportRuler`, `DEFAULT_RESIZE_TIME`, `DEFAULT_SCROLL_TIME`
- `ExtendedScrollToOptions`

**Internal axis types:** `_Bottom`, `_End`, `_Left`, `_Right`, `_Start`, `_Top`, `_Without`, `_XAxis`, `_XOR`, `_YAxis`

---

### Stepper (`@angular/cdk/stepper`)
- `CdkStepper`, `CdkStep`, `CdkStepLabel`, `CdkStepHeader`
- `CdkStepperNext`, `CdkStepperPrevious`
- `STEPPER_GLOBAL_OPTIONS`, `STEP_STATE`
- `StepperSelectionEvent`, `StepperOptions`, `StepperOrientation`, `StepState`, `StepContentPositionState`
- `CdkStepperModule`

---

### Table (`@angular/cdk/table`)

**Directives:**
- `CdkTable`, `CdkRow`, `CdkHeaderRow`, `CdkFooterRow`, `CdkNoDataRow`
- `CdkCell`, `CdkHeaderCell`, `CdkFooterCell`
- `CdkCellDef`, `CdkHeaderCellDef`, `CdkFooterCellDef`
- `CdkRowDef`, `CdkHeaderRowDef`, `CdkFooterRowDef`
- `CdkColumnDef`, `CdkTextColumn`, `CdkRecycleRows`

**Outlets:**
- `CdkCellOutlet`, `DataRowOutlet`, `HeaderRowOutlet`, `FooterRowOutlet`, `NoDataRowOutlet`

**Base Classes:**
- `BaseCdkCell`, `BaseRowDef`, `DataSource`

**Config/Tokens:**
- `CDK_TABLE`, `CDK_ROW_TEMPLATE`, `STICKY_POSITIONING_LISTENER`, `TEXT_COLUMN_OPTIONS`

**Types:**
- `CdkTableDataSourceInput`, `CellDef`, `RenderRow`, `RowContext`, `RowOutlet`
- `CdkCellOutletRowContext`, `CdkCellOutletMultiRowContext`
- `StickyOffset`, `StickySize`, `StickyUpdate`, `StickyPositioningListener`, `TextColumnOptions`
- `CdkTableModule`

---

### Testing (`@angular/cdk/testing`)

**Harness Infrastructure:**
- `ComponentHarness`, `ComponentHarnessConstructor`, `ContentContainerComponentHarness`
- `HarnessEnvironment`, `HarnessLoader`, `HarnessPredicate`, `HarnessQuery`
- `LocatorFactory`, `LocatorFnResult`

**Test Element:**
- `TestElement`, `TestKey`, `ElementDimensions`, `TextOptions`, `EventData`, `ModifierKeys`

**Utilities:**
- `parallel`, `manualChangeDetection`, `handleAutoChangeDetectionStatus`, `stopHandlingAutoChangeDetectionStatus`
- `_getTextWithExcludedElements`, `getNoKeysSpecifiedError`
- `AsyncFactoryFn`, `AsyncOptionPredicate`, `AsyncPredicate`
- `BaseHarnessFilters`, `AutoChangeDetectionStatus`

**Sub-entries:**
- `@angular/cdk/testing/testbed` — Angular TestBed integration
- `@angular/cdk/testing/selenium-webdriver` — Selenium WebDriver integration

---

### Text Field (`@angular/cdk/text-field`)
- `AutofillMonitor`, `CdkAutofill`, `AutofillEvent`
- `CdkTextareaAutosize`, `TextFieldModule`

---

### Tree (`@angular/cdk/tree`)

**Components/Directives:**
- `CdkTree`, `CdkTreeNode`, `CdkTreeNodeDef`, `CdkTreeNodeOutlet`, `CdkTreeNodeOutletContext`
- `CdkNestedTreeNode`, `CdkTreeNodePadding`, `CdkTreeNodeToggle`

**Tree Controls (legacy):**
- `BaseTreeControl`, `FlatTreeControl`, `FlatTreeControlOptions`
- `NestedTreeControl`, `NestedTreeControlOptions`, `TreeControl`

**Tokens:**
- `CDK_TREE_NODE_OUTLET_NODE`

**Error helpers:**
- `getMultipleTreeControlsError`, `getTreeControlMissingError`, `getTreeMissingMatchingNodeDefError`, `getTreeMultipleDefaultNodeDefsError`, `getTreeNoValidDataSourceError`

**Module:** `CdkTreeModule`

---

## Public API Surface Summary

The CDK exposes **~300+ public symbols** across 22 entry points, organized into three broad tiers:

**Behavior Primitives** — headless, unstyled building blocks for complex UI patterns:
- `a11y` (focus management, live regions, key managers)
- `drag-drop` (sortable lists, drag handles, transfer between lists)
- `overlay` (floating panels with flexible positioning and scroll strategies)
- `dialog` (accessible modal dialogs)
- `menu` (ARIA menu/menubar/context-menu)
- `listbox` (ARIA listbox)
- `stepper` (multi-step wizard)
- `accordion` (expand/collapse)
- `tree` (hierarchical data)
- `table` (data grid with sticky support)

**Utilities** — standalone helpers used across the ecosystem:
- `coercion` (type-safe input coercion)
- `keycodes` (keyboard constants)
- `platform` (browser detection)
- `bidi` (RTL/LTR)
- `layout` (responsive breakpoints)
- `observers` (DOM mutation)
- `clipboard` (copy to clipboard)
- `text-field` (autoresize, autofill)
- `collections` (data sources, selection models)

**Infrastructure** — lower-level plumbing used by Angular Material and advanced consumers:
- `portal` (dynamic content projection)
- `scrolling` (virtual scroll, scroll dispatching)
- `testing` (component harness framework)

---

## Peer Dependencies

| Package | Required Version |
|---|---|
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/common` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/platform-browser` | `^21.0.0 \|\| ^22.0.0` |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` |

No optional peer dependencies. All four are required for the CDK to function.
