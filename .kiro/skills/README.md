# Skills Directory Structure

This directory contains skills for building and testing accessible Angular components.

## Directory Organization

```
.kiro/skills/
├── README.md                              # This file
├── accessible-component-template.md       # Generic template for any library
├── accessibility-testing-checklist.md     # Generic testing checklist
├── research-buddy.md                      # Research methodology
├── research-prototype-workflow.md         # Prototyping workflow
│
├── angular-aria/                          # Angular Aria specific skills
│   ├── component-template.md              # Angular Aria component template
│   └── testing-checklist.md               # Angular Aria testing checklist
│
└── angular-material/                      # Angular Material specific skills
    ├── component-template.md              # Angular Material component template
    └── testing-checklist.md               # Angular Material testing checklist
```

## Generic Skills (Root Level)

These skills work with **any accessibility library** across frameworks:

### `accessible-component-template.md`
- Universal component template
- Works with Angular Aria, Radix, Headless UI, React Aria, etc.
- Shows both library-based and manual ARIA implementation
- Framework-agnostic patterns

### `accessibility-testing-checklist.md`
- Universal testing checklist
- Component pattern tests (Tree, Menu, Tabs, etc.)
- Keyboard navigation, ARIA, screen reader testing
- Works with any library or framework

### `research-buddy.md` & `research-prototype-workflow.md`
- Research methodology and workflow
- Applies to any library exploration

## Library-Specific Skills

### Angular Aria (`angular-aria/`)

**When to use**: Building custom design systems with full styling control

**Features**:
- Headless directives (no styling)
- Full ARIA implementation
- Keyboard navigation built-in
- Minimal bundle size
- Requires custom CSS

**Files**:
- `component-template.md` - How to use Angular Aria directives
- `testing-checklist.md` - What Angular Aria handles vs what you provide

### Angular Material (`angular-material/`)

**When to use**: Quick development with Material Design

**Features**:
- Pre-styled components
- Material Design look
- Built-in theming
- Larger component library
- Accessibility built-in

**Files**:
- `component-template.md` - How to use Material components
- `testing-checklist.md` - Testing Material components

## Comparison: Angular Aria vs Angular Material

| Feature | Angular Aria | Angular Material |
|---------|-------------|------------------|
| **Styling** | Headless (you provide CSS) | Pre-styled (Material Design) |
| **Bundle Size** | Minimal | Larger |
| **Customization** | Full control | Limited (requires overrides) |
| **Development Speed** | Slower (need to style) | Faster (pre-styled) |
| **Design System** | Any design | Material Design |
| **Accessibility** | Built-in | Built-in |
| **Components** | Core patterns | More components |
| **Best For** | Custom design systems | Rapid development, Material apps |

## How to Use These Skills

### Starting a New Component

1. **Choose your library** based on requirements:
   - Custom design? → Angular Aria
   - Material Design? → Angular Material
   - Other framework? → Use generic skills

2. **Use the component template**:
   - Generic: `accessible-component-template.md`
   - Angular Aria: `angular-aria/component-template.md`
   - Angular Material: `angular-material/component-template.md`

3. **Test with the checklist**:
   - Generic: `accessibility-testing-checklist.md`
   - Angular Aria: `angular-aria/testing-checklist.md`
   - Angular Material: `angular-material/testing-checklist.md`

### Research Workflow

1. Check online documentation
2. Inspect `node_modules` for actual implementation
3. Follow `research-buddy.md` methodology
4. Use `research-prototype-workflow.md` for prototyping

## Adding New Library Skills

When adding skills for a new library (e.g., Radix, Headless UI):

1. Create a new directory: `.kiro/skills/[library-name]/`
2. Add `component-template.md` - How to use the library
3. Add `testing-checklist.md` - Library-specific testing
4. Update this README with the new library

### Template Structure

```
.kiro/skills/[library-name]/
├── component-template.md      # How to use the library
└── testing-checklist.md       # Testing specifics
```

## Project Context

This is a **research project** for comparing accessibility libraries in Angular:

- **Goal**: Compare Angular Aria vs Angular Material
- **Approach**: Build same components with both libraries
- **Focus**: Accessibility, developer experience, customization
- **Output**: Meetup presentation with working demos

## Resources

### Angular Aria
- [Documentation](https://angular.dev/guide/aria)
- [API Reference](https://angular.dev/api/aria)

### Angular Material
- [Documentation](https://material.angular.io)
- [Accessibility Guide](https://material.angular.io/guide/accessibility)

### General Accessibility
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
