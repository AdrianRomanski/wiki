---
title: Angular Material Theming
type: concept
tags: [angular, angular-material, theming, material-design, scss, css-custom-properties, m2, m3]
sources: [angular-material-big-picture-2026-05-11]
created: 2026-05-11
updated: 2026-05-11
---

# Angular Material Theming

## Explanation

Angular Material supports two design systems simultaneously in v17+:

- **M2 (Material Design 2)** — legacy SCSS palette system using `mat.define-light-theme()` / `mat.define-dark-theme()` and `mat.core()` mixin
- **M3 (Material Design 3)** — current default, token-based system using `mat.define-theme()` with CSS custom properties, enabling dynamic color

The two systems are mutually exclusive per application — mixing them in the same stylesheet produces conflicting CSS custom properties.

For teams that don't need custom branding, 8 prebuilt CSS themes are available as drop-in files requiring zero SCSS setup.

## Applications

- Applying consistent brand colors across all Material components
- Supporting light/dark mode via CSS custom property overrides
- Zero-config theming via prebuilt CSS files
- Dynamic color theming (M3 only) via CSS custom property manipulation at runtime

## Related Concepts

- [[angular-material-modular-imports]]
- [[Angular Material]]

## Examples

### Prebuilt theme (zero SCSS setup)
```html
<!-- In angular.json styles array -->
"styles": ["node_modules/@angular/material/prebuilt-themes/azure-blue.css"]
```

Available prebuilt themes: `azure-blue`, `indigo-pink`, `rose-red`, `cyan-orange`, `magenta-violet`, `deeppurple-amber`, `pink-bluegrey`, `purple-green`.

### M3 custom theme (SCSS)
```scss
@use '@angular/material' as mat;

// Define theme with M3 tokens
$my-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$violet-palette,
  ),
  typography: (
    brand-family: 'Inter',
  ),
  density: (
    scale: 0,
  )
));

html {
  @include mat.all-component-themes($my-theme);
}
```

### M2 custom theme (SCSS, legacy)
```scss
@use '@angular/material' as mat;

@include mat.core();

$my-theme: mat.define-light-theme((
  color: (
    primary: mat.define-palette(mat.$indigo-palette),
    accent: mat.define-palette(mat.$pink-palette),
  )
));

@include mat.all-component-themes($my-theme);
```

## References

- [[angular-material-big-picture-2026-05-11]]
- [[Angular Material]]
