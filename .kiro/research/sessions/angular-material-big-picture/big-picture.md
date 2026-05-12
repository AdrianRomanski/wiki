# @angular/material — Big Picture

**Version:** 21.2.10
**Research date:** 2026-05-11

---

## Entry Points

| Entry Point | Purpose |
|---|---|
| `@angular/material` | Root barrel — re-exports all modules |
| `@angular/material/theming` | Public theming API (M2 + M3 mixins, palettes) |
| `@angular/material/_theming` | Internal theming (private, avoid direct use) |
| `@angular/material/prebuilt-themes/*.css` | Drop-in prebuilt CSS themes (8 themes) |
| `@angular/material/[component]` | Individual component entry points |
| `@angular/material/[component]/testing` | Harness-based testing utilities per component |
| `@angular/material/core` | Shared primitives (date adapters, ripple, options, animations) |

**Module format:** ESM via `fesm2022/` bundles (`.mjs`). No CommonJS main.

---

## Peer Dependencies

| Package | Required Version |
|---|---|
| `@angular/cdk` | `21.2.10` (exact) |
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/common` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/forms` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/platform-browser` | `^21.0.0 \|\| ^22.0.0` |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` |

> `@angular/cdk` is a hard peer at the exact same version — always keep them in sync.

---

## Prebuilt Themes

8 ready-to-use CSS themes available via direct import:

- `indigo-pink.css`
- `deeppurple-amber.css`
- `pink-bluegrey.css`
- `purple-green.css`
- `azure-blue.css` *(M3)*
- `rose-red.css` *(M3)*
- `cyan-orange.css` *(M3)*
- `magenta-violet.css` *(M3)*

---

## Exported Symbols by Module

### autocomplete
- `MatAutocomplete` — panel component
- `MatAutocompleteTrigger` — directive that connects an input to the panel
- `MatAutocompleteOrigin` — marks a custom origin element
- `MatAutocompleteSelectedEvent` — event emitted on selection
- `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` — injection token for defaults
- `MAT_AUTOCOMPLETE_SCROLL_STRATEGY` — injection token for scroll strategy
- `MAT_AUTOCOMPLETE_VALUE_ACCESSOR` — CVA token
- `getMatAutocompleteMissingPanelError()` — error factory
- `MatAutocompleteModule`

### badge
- `MatBadgeModule` *(symbols in chunk file — directive applied via `matBadge` attribute)*

### bottom-sheet
- `MatBottomSheet` — service to open bottom sheets
- `MatBottomSheetRef<T>` — reference to an open bottom sheet
- `MatBottomSheetConfig<D>` — configuration object
- `MatBottomSheetContainer` — internal container component
- `MAT_BOTTOM_SHEET_DATA` — injection token for data passed to sheet
- `MAT_BOTTOM_SHEET_DEFAULT_OPTIONS` — injection token for defaults
- `MatBottomSheetModule`

### button
- `MatButton` — standard button
- `MatIconButton` — icon-only button
- `MatFabButton` — floating action button
- `MatMiniFabButton` — mini FAB
- `MatAnchor`, `MatFabAnchor`, `MatMiniFabAnchor`, `MatIconAnchor` — anchor variants
- `MatButtonBase` — base class
- `MAT_BUTTON_CONFIG`, `MAT_FAB_DEFAULT_OPTIONS` — injection tokens
- `MatButtonModule`

### button-toggle
- `MatButtonToggleModule` *(symbols in chunk — `MatButtonToggle`, `MatButtonToggleGroup`)*

### card
- `MatCard`, `MatCardTitle`, `MatCardSubtitle`, `MatCardContent`
- `MatCardHeader`, `MatCardFooter`, `MatCardActions`, `MatCardTitleGroup`
- `MatCardImage`, `MatCardSmImage`, `MatCardMdImage`, `MatCardLgImage`, `MatCardXlImage`
- `MatCardAvatar`
- `MAT_CARD_CONFIG`
- `MatCardModule`

### checkbox
- `MatCheckbox` — checkbox component (implements `ControlValueAccessor`)
- `MatCheckboxChange` — change event object
- `TransitionCheckState` — internal enum for animation states
- `MAT_CHECKBOX_DEFAULT_OPTIONS`
- `MatCheckboxModule`

### chips
- `MatChip`, `MatChipOption`, `MatChipRow` — chip variants
- `MatChipSet`, `MatChipListbox`, `MatChipGrid` — container variants
- `MatChipInput` — input for chip grid
- `MatChipAction`, `MatChipRemove`, `MatChipTrailingIcon`, `MatChipAvatar`, `MatChipEdit`, `MatChipEditInput`, `MatChipContent` — sub-parts
- `MatChipSelectionChange`, `MatChipListboxChange`, `MatChipGridChange` — events
- `MAT_CHIPS_DEFAULT_OPTIONS`, `MAT_CHIP`, `MAT_CHIP_AVATAR`, `MAT_CHIP_TRAILING_ICON`, `MAT_CHIP_EDIT`, `MAT_CHIP_REMOVE` — tokens
- `MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR`
- `MatChipsModule`

### core
- `VERSION` — library version constant
- `MATERIAL_ANIMATIONS` — injection token for animation config
- `_getAnimationsState()`, `_animationsDisabled()` — animation helpers
- `NativeDateAdapter`, `NativeDateModule`, `MatNativeDateModule`, `provideNativeDateAdapter()` — native date support
- `MAT_DATE_FORMATS`, `MAT_NATIVE_DATE_FORMATS` — date format tokens
- `_ErrorStateTracker` — shared error state logic
- `_StructuralStylesLoader`, `_MatInternalFormField` — internal utilities

### datepicker
- `MatDatepicker<D>`, `MatDateRangePicker<D>` — picker overlays
- `MatDatepickerInput<D>`, `MatDateRangeInput<D>` — input directives
- `MatDatepickerToggle<D>`, `MatDatepickerToggleIcon` — toggle button
- `MatCalendar<D>`, `MatCalendarHeader<D>`, `MatCalendarBody<D>`, `MatCalendarCell<D>` — calendar UI
- `MatMonthView<D>`, `MatYearView<D>`, `MatMultiYearView<D>` — calendar views
- `MatStartDate<D>`, `MatEndDate<D>` — range input parts
- `MatDatepickerActions`, `MatDatepickerApply`, `MatDatepickerCancel` — action row
- `DateRange<D>`, `MatSingleDateSelectionModel<D>`, `MatRangeDateSelectionModel<D>` — selection models
- `MatDatepickerInputEvent<D>`, `MatDatepickerIntl` — events and i18n
- `MAT_DATEPICKER_SCROLL_STRATEGY`, `MAT_DATE_RANGE_SELECTION_STRATEGY` — tokens
- `MAT_DATEPICKER_VALUE_ACCESSOR`, `MAT_DATEPICKER_VALIDATORS`
- `DefaultMatCalendarRangeStrategy<D>`
- `MatDatepickerModule`

### dialog
- `MatDialogTitle`, `MatDialogContent`, `MatDialogActions`, `MatDialogClose` — structural directives
- `MatDialogLayoutSection` — abstract base
- `MatDialogModule`
- *(MatDialog service and MatDialogRef in chunk file)*

### divider
- `MatDivider`
- `MatDividerModule`

### expansion
- `MatExpansionPanel`, `MatExpansionPanelHeader`, `MatExpansionPanelContent`
- `MatExpansionPanelActionRow`, `MatExpansionPanelDescription`, `MatExpansionPanelTitle`
- `MatAccordion`
- `MAT_ACCORDION`, `MAT_EXPANSION_PANEL`, `MAT_EXPANSION_PANEL_DEFAULT_OPTIONS`
- `MatExpansionModule`

### form-field
- `MatFormField` *(in chunk)*, `MatLabel`, `MatHint`, `MatError`, `MatPrefix`, `MatSuffix` *(in chunk)*
- `MatFormFieldControl<T>` — abstract base for custom form field controls
- Error factories: `getMatFormFieldPlaceholderConflictError()`, `getMatFormFieldDuplicatedHintError()`, `getMatFormFieldMissingControlError()`

### grid-list
- `MatGridList`, `MatGridTile`, `MatGridTileText`
- `MatGridAvatarCssMatStyler`, `MatGridTileHeaderCssMatStyler`, `MatGridTileFooterCssMatStyler`
- `TileCoordinator`, `TilePosition` — layout utilities
- `MatGridListModule`

### icon
- `MatIcon` *(in chunk)*, `MatIconRegistry` *(in chunk)*
- `MatIconModule` *(in chunk)*

### input
- `MatInput` — directive that makes a native `<input>` or `<textarea>` a Material form field control
- `MAT_INPUT_CONFIG`, `MAT_INPUT_VALUE_ACCESSOR`
- `getMatInputUnsupportedTypeError()`
- `MatInputModule`

### list
- `MatList`, `MatNavList`, `MatActionList`, `MatSelectionList`
- `MatListItem`, `MatListOption`
- `MatListItemTitle`, `MatListItemLine`, `MatListItemMeta`, `MatListItemAvatar`, `MatListItemIcon`
- `MatListItemGraphicBase`, `MatListBase`, `MatListItemBase` — abstract bases
- `MatSelectionListChange`
- `MAT_LIST_CONFIG`, `MAT_LIST`, `MAT_NAV_LIST`, `SELECTION_LIST`
- `MAT_SELECTION_LIST_VALUE_ACCESSOR`
- `MatListSubheaderCssMatStyler`
- `MatListModule`

### menu
- `MatMenu`, `MatMenuItem`, `MatMenuTrigger`, `MatContextMenuTrigger`
- `MatMenuContent` — lazy content
- `MatMenuTriggerBase` — abstract base
- `MAT_MENU_PANEL`, `MAT_MENU_CONTENT`, `MAT_MENU_DEFAULT_OPTIONS`, `MAT_MENU_SCROLL_STRATEGY`
- `MENU_PANEL_TOP_PADDING`
- `MatMenuModule`

### paginator
- `MatPaginator` *(in chunk)*, `MatPaginatorIntl` *(in chunk)*
- `MAT_PAGINATOR_DEFAULT_OPTIONS` *(in chunk)*
- `MatPaginatorModule`

### progress-bar
- `MatProgressBar`
- `MAT_PROGRESS_BAR_DEFAULT_OPTIONS`, `MAT_PROGRESS_BAR_LOCATION`
- `MatProgressBarModule`

### progress-spinner
- `MatProgressSpinner`, `MatSpinner` *(in chunk)*
- `MatProgressSpinnerModule`

### radio
- `MatRadioGroup`, `MatRadioButton`
- `MatRadioChange<T>`
- `MAT_RADIO_GROUP`, `MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR`, `MAT_RADIO_DEFAULT_OPTIONS`
- `MatRadioModule`

### select
- `MatSelect`, `MatSelectTrigger`
- `MatSelectChange<T>`
- `MAT_SELECT_CONFIG`, `MAT_SELECT_SCROLL_STRATEGY`, `MAT_SELECT_TRIGGER`
- `MatSelectModule`

### sidenav
- `MatSidenav`, `MatSidenavContainer`, `MatSidenavContent`
- `MatDrawer`, `MatDrawerContainer`, `MatDrawerContent`
- `MAT_DRAWER_DEFAULT_AUTOSIZE`
- `throwMatDuplicatedDrawerError()`
- `MatSidenavModule`

### slide-toggle
- `MatSlideToggle`
- `MatSlideToggleChange`
- `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS`
- `MatSlideToggleModule`

### slider
- `MatSlider`, `MatSliderThumb`, `MatSliderRangeThumb`, `MatSliderVisualThumb`
- `MatSliderChange`
- `_MatThumb`, `_MatTickMark` — internal enums
- `MatSliderModule`

### snack-bar
- `MatSnackBar` — service
- `MatSnackBarRef<T>` — reference to open snack bar
- `MatSnackBarConfig<D>`, `MatSnackBarContainer`
- `SimpleSnackBar` — default text+action snack bar
- `MatSnackBarLabel`, `MatSnackBarActions`, `MatSnackBarAction` — structural parts
- `MAT_SNACK_BAR_DATA`, `MAT_SNACK_BAR_DEFAULT_OPTIONS`
- `MatSnackBarModule`

### sort
- `MatSort` *(in chunk)* — directive applied to a table header
- `MatSortHeader` — individual sortable column header
- `MatSortHeaderIntl` — i18n
- `MatSortModule`

### stepper
- `MatStepper`, `MatStep`, `MatStepHeader`
- `MatStepLabel`, `MatStepContent<C>`, `MatStepperIcon`
- `MatStepperNext`, `MatStepperPrevious`
- `MatStepperIntl` — i18n
- `MatStepperModule`

### table
- `MatTable<T>`, `MatTableDataSource<T>`
- Cell defs: `MatCellDef`, `MatHeaderCellDef`, `MatFooterCellDef`
- Cells: `MatCell`, `MatHeaderCell`, `MatFooterCell`
- Column: `MatColumnDef`, `MatTextColumn<T>`
- Row defs: `MatRowDef<T>`, `MatHeaderRowDef`, `MatFooterRowDef`
- Rows: `MatRow`, `MatHeaderRow`, `MatFooterRow`, `MatNoDataRow`
- `MatRecycleRows` — performance directive
- `MatTableModule`

### tabs
- `MatTabGroup`, `MatTab`, `MatTabLabel`, `MatTabContent`
- `MatTabHeader`, `MatTabBody`, `MatTabBodyPortal`, `MatTabLabelWrapper`
- `MatTabNav`, `MatTabLink`, `MatTabNavPanel` — nav bar variant
- `MatInkBar`, `InkBarItem`, `_MAT_INK_BAR_POSITIONER`
- `MatTabChangeEvent`
- `MAT_TAB`, `MAT_TAB_LABEL`, `MAT_TAB_CONTENT`, `MAT_TAB_GROUP`, `MAT_TABS_CONFIG`
- `MatTabsModule`

### timepicker *(new in v21)*
- `MatTimepicker<D>`, `MatTimepickerInput<D>`, `MatTimepickerToggle<D>`
- `MAT_TIMEPICKER_CONFIG`, `MAT_TIMEPICKER_SCROLL_STRATEGY`
- `MatTimepickerModule`

### toolbar
- `MatToolbar`, `MatToolbarRow`
- `throwToolbarMixedModesError()`
- `MatToolbarModule`

### tooltip
- `MatTooltip`, `TooltipComponent`
- `MAT_TOOLTIP_DEFAULT_OPTIONS`, `MAT_TOOLTIP_SCROLL_STRATEGY`
- `SCROLL_THROTTLE_MS`, `TOOLTIP_PANEL_CLASS`
- `getMatTooltipInvalidPositionError()`
- `MatTooltipModule`

### tree
- `MatTree<T,K>`, `MatTreeNode<T,K>`, `MatNestedTreeNode<T,K>`
- `MatTreeNodeDef<T>`, `MatTreeNodePadding<T,K>`, `MatTreeNodeOutlet`, `MatTreeNodeToggle<T,K>`
- `MatTreeFlattener<T,F,K>`, `MatTreeFlatDataSource<T,F,K>`, `MatTreeNestedDataSource<T>`
- `MatTreeModule`

---

## Public API Surface Summary

Angular Material v21 exposes **35 component modules** (plus a root barrel), organized into:

| Category | Modules |
|---|---|
| Form controls | `checkbox`, `chips`, `datepicker`, `form-field`, `input`, `radio`, `select`, `slide-toggle`, `slider`, `timepicker` |
| Navigation | `menu`, `sidenav`, `tabs`, `toolbar`, `tree` |
| Layout | `card`, `divider`, `expansion`, `grid-list`, `list`, `stepper` |
| Buttons & indicators | `badge`, `bottom-sheet`, `button`, `button-toggle`, `icon`, `progress-bar`, `progress-spinner`, `snack-bar`, `tooltip` |
| Data display | `paginator`, `sort`, `table` |
| Overlays & dialogs | `autocomplete`, `bottom-sheet`, `dialog`, `snack-bar` |
| Shared primitives | `core` |

### Key API Patterns

- **Module-per-component** — import only what you need (e.g. `MatButtonModule`)
- **Standalone components** — all components are standalone-compatible in v21; no NgModule required
- **Injection tokens** — every configurable default is overridable via `InjectionToken` (e.g. `MAT_BUTTON_CONFIG`)
- **Testing harnesses** — every component ships a `*/testing` entry with `ComponentHarness` subclasses for robust testing
- **Material Design 3 (M3)** — v21 is fully M3 by default; M2 support available via `@use '@angular/material' as mat; @include mat.theme(...)` with `$density` and `$typography` overrides
- **Theming** — SCSS-based via `@angular/material/theming`; 8 prebuilt CSS themes available
- **Date adapters** — pluggable via `NativeDateAdapter` (built-in) or third-party (e.g. Luxon, date-fns via `@angular/material-date-fns-adapter`)
- **i18n** — `MatDatepickerIntl`, `MatPaginatorIntl`, `MatSortHeaderIntl`, `MatStepperIntl` are injectable services for string customization
- **Animations** — controlled via `MATERIAL_ANIMATIONS` token; can be disabled globally
