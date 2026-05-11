# @angular/material — Big Picture

**Version:** 21.2.10
**Research date:** 2026-05-11

---

## Entry Points

The library uses a fully modular export map. Every component is its own entry point — there is no single barrel import that pulls everything in. This is intentional for tree-shaking.

| Entry point | Purpose |
|---|---|
| `@angular/material` | Root barrel — re-exports everything (avoid in production) |
| `@angular/material/[component]` | Per-component import (recommended) |
| `@angular/material/core` | Shared primitives: ripple, options, error state, animations |
| `@angular/material/theming` | SCSS theming API (M2 + M3) |
| `@angular/material/prebuilt-themes/*.css` | Drop-in CSS themes (no SCSS setup needed) |
| `@angular/material/[component]/testing` | Harness-based test utilities |

**Module format:** ESM only (`fesm2022/*.mjs`). No CommonJS. `sideEffects: false` — fully tree-shakeable.

---

## Component Modules (28 total)

### Form Controls
Components that integrate with Angular Forms (`ControlValueAccessor`).

| Module | Key Exports |
|---|---|
| `autocomplete` | `MatAutocomplete`, `MatAutocompleteTrigger`, `MatAutocompleteModule`, `MatOption`, `MatOptgroup` |
| `checkbox` | `MatCheckbox`, `MatCheckboxChange`, `MatCheckboxModule` |
| `chips` | `MatChipGrid`, `MatChipListbox`, `MatChipInput`, `MatChipRow`, `MatChipOption`, `MatChipsModule` |
| `datepicker` | `MatDatepicker`, `MatDateRangePicker`, `MatCalendar`, `MatDatepickerInput`, `MatDatepickerModule` |
| `form-field` | `MatFormField`, `MatLabel`, `MatHint`, `MatError`, `MatPrefix`, `MatSuffix`, `MatFormFieldModule` |
| `input` | `MatInput`, `MatInputModule` |
| `radio` | `MatRadioGroup`, `MatRadioButton`, `MatRadioChange`, `MatRadioModule` |
| `select` | `MatSelect`, `MatSelectChange`, `MatSelectTrigger`, `MatSelectModule` |
| `slide-toggle` | `MatSlideToggle`, `MatSlideToggleChange`, `MatSlideToggleModule` |
| `slider` | `MatSlider`, `MatSliderThumb`, `MatSliderRangeThumb`, `MatSliderModule` |
| `timepicker` | `MatTimepicker`, `MatTimepickerInput`, `MatTimepickerToggle`, `MatTimepickerModule` |

### Navigation
| Module | Key Exports |
|---|---|
| `menu` | `MatMenu`, `MatMenuItem`, `MatMenuTrigger`, `MatContextMenuTrigger`, `MatMenuModule` |
| `sidenav` | `MatSidenav`, `MatSidenavContainer`, `MatDrawer`, `MatDrawerContainer`, `MatSidenavModule` |
| `tabs` | `MatTabGroup`, `MatTab`, `MatTabNav`, `MatTabLink`, `MatTabsModule` |
| `toolbar` | `MatToolbar`, `MatToolbarRow`, `MatToolbarModule` |
| `stepper` | `MatStepper`, `MatStep`, `MatStepHeader`, `MatStepLabel`, `MatStepperModule` |

### Layout
| Module | Key Exports |
|---|---|
| `card` | `MatCard`, `MatCardHeader`, `MatCardContent`, `MatCardActions`, `MatCardFooter`, `MatCardModule` |
| `divider` | `MatDivider`, `MatDividerModule` |
| `expansion` | `MatAccordion`, `MatExpansionPanel`, `MatExpansionPanelHeader`, `MatExpansionModule` |
| `grid-list` | `MatGridList`, `MatGridTile`, `MatGridListModule` |
| `list` | `MatList`, `MatNavList`, `MatSelectionList`, `MatListItem`, `MatListOption`, `MatListModule` |
| `tree` | `MatTree`, `MatTreeNode`, `MatTreeFlatDataSource`, `MatTreeFlattener`, `MatTreeModule` |

### Feedback & Overlays
| Module | Key Exports |
|---|---|
| `bottom-sheet` | `MatBottomSheet`, `MatBottomSheetRef`, `MatBottomSheetConfig`, `MatBottomSheetModule` |
| `dialog` | `MatDialog`, `MatDialogRef`, `MatDialogConfig`, `MatDialogContainer`, `MatDialogModule` |
| `snack-bar` | `MatSnackBar`, `MatSnackBarRef`, `MatSnackBarConfig`, `SimpleSnackBar`, `MatSnackBarModule` |
| `tooltip` | `MatTooltip`, `MatTooltipModule` |

### Data Display
| Module | Key Exports |
|---|---|
| `badge` | `MatBadge`, `MatBadgeModule` |
| `paginator` | `MatPaginator`, `MatPaginatorIntl`, `PageEvent`, `MatPaginatorModule` |
| `progress-bar` | `MatProgressBar`, `MatProgressBarModule` |
| `progress-spinner` | `MatProgressSpinner`, `MatSpinner`, `MatProgressSpinnerModule` |
| `sort` | `MatSort`, `MatSortHeader`, `MatSortHeaderIntl`, `MatSortModule` |
| `table` | `MatTable`, `MatTableDataSource`, `MatColumnDef`, `MatHeaderRow`, `MatRow`, `MatTableModule` |

### Buttons & Indicators
| Module | Key Exports |
|---|---|
| `button` | `MatButton`, `MatAnchor`, `MatFabButton`, `MatIconButton`, `MatMiniFabButton`, `MatButtonModule` |
| `button-toggle` | `MatButtonToggleGroup`, `MatButtonToggle`, `MatButtonToggleModule` |
| `icon` | `MatIcon`, `MatIconRegistry`, `MatIconModule` |

---

## Core Module (`@angular/material/core`)

Shared primitives used across all components. Import these directly rather than via individual component modules.

| Export | Purpose |
|---|---|
| `MatOption`, `MatOptgroup` | Shared option/group for select, autocomplete, etc. |
| `MatRipple`, `RippleRef` | Ink ripple effect directive |
| `ErrorStateMatcher`, `ShowOnDirtyErrorStateMatcher` | Form error display strategy |
| `DateAdapter`, `MAT_DATE_FORMATS`, `MAT_DATE_LOCALE` | Date abstraction layer for datepicker |
| `NativeDateAdapter`, `MatNativeDateModule` | Built-in date adapter (no external dep) |
| `provideNativeDateAdapter` | Functional provider for native date adapter |
| `MATERIAL_ANIMATIONS` | Animation configuration token |
| `MatPseudoCheckbox` | Internal checkbox used by list/select |
| `VERSION` | Library version string |

---

## Theming System

Angular Material supports two design systems simultaneously:

### Material Design 2 (M2) — Legacy
- SCSS-based, uses `mat.define-theme()` with M2 palettes
- Palettes: `$mat-red`, `$mat-blue`, etc.
- Configured via `mat.core()` mixin + `mat.define-light-theme()` / `mat.define-dark-theme()`

### Material Design 3 (M3) — Current default in v17+
- Token-based theming system
- `mat.define-theme()` with `color`, `typography`, `density` config objects
- Color sourced from `mat.define-theme({ color: { primary: mat.$violet-palette } })`
- Supports dynamic color via CSS custom properties

### Prebuilt Themes (no SCSS required)
Import one CSS file directly:
```
@angular/material/prebuilt-themes/indigo-pink.css
@angular/material/prebuilt-themes/azure-blue.css       ← M3 default
@angular/material/prebuilt-themes/rose-red.css
@angular/material/prebuilt-themes/cyan-orange.css
@angular/material/prebuilt-themes/magenta-violet.css
@angular/material/prebuilt-themes/deeppurple-amber.css
@angular/material/prebuilt-themes/pink-bluegrey.css
@angular/material/prebuilt-themes/purple-green.css
```

---

## Testing Harnesses

Every component ships a `[component]/testing` entry point with a `MatXxxHarness` class. These are CDK `ComponentHarness` subclasses that provide a stable, implementation-agnostic API for component interaction in tests.

Pattern:
```ts
import { MatButtonHarness } from '@angular/material/button/testing';
const btn = await loader.getHarness(MatButtonHarness);
await btn.click();
```

---

## Peer Dependencies

| Package | Required version |
|---|---|
| `@angular/cdk` | `21.2.10` (exact match) |
| `@angular/core` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/common` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/forms` | `^21.0.0 \|\| ^22.0.0` |
| `@angular/platform-browser` | `^21.0.0 \|\| ^22.0.0` |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` |

`@angular/cdk` is a hard peer dep at the exact same version — it provides the foundational primitives (overlay, a11y, drag-drop, etc.) that Material builds on.

---

## Public API Surface Summary

- **28 component modules**, each independently importable
- **1 core module** with shared primitives
- **1 theming entry point** (SCSS) + 8 prebuilt CSS themes
- **28 testing harness entry points** (one per component)
- **Schematics** for `ng add`, `ng generate`, `ng update`
- All components are **standalone-compatible** — no NgModule required, import directly into `imports: []`
- All components follow **OnPush** change detection
- Full **ARIA** support built in via `@angular/cdk/a11y`
- **No animations dependency** — animations are opt-in via `MATERIAL_ANIMATIONS` token (new in v17+)

---

## CDK Foundation (Key Entry Points)

Since `@angular/cdk` is a required peer dep, these CDK modules underpin Material:

| CDK module | Used by |
|---|---|
| `@angular/cdk/a11y` | Focus management, live announcer, keyboard traps |
| `@angular/cdk/overlay` | Dialog, menu, select, tooltip, autocomplete |
| `@angular/cdk/portal` | Dialog, bottom-sheet content projection |
| `@angular/cdk/drag-drop` | Available separately, not used internally by Material |
| `@angular/cdk/table` | MatTable builds on CdkTable |
| `@angular/cdk/stepper` | MatStepper builds on CdkStepper |
| `@angular/cdk/tree` | MatTree builds on CdkTree |
| `@angular/cdk/scrolling` | Virtual scroll (available via CDK, not Material directly) |
