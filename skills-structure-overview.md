# Skills Directory Structure Overview

## 📁 Directory Organization

```
.kiro/skills/
│
├── 📄 README.md                              # Documentation
│
├── 🌐 GENERIC SKILLS (Any Library/Framework)
│   ├── accessible-component-template.md      # Universal component template
│   ├── accessibility-testing-checklist.md    # Universal testing checklist
│   ├── research-buddy.md                     # Research methodology
│   └── research-prototype-workflow.md        # Prototyping workflow
│
├── 📦 angular-aria/                          # Angular Aria Specific
│   ├── component-template.md                 # How to use Angular Aria
│   └── testing-checklist.md                  # Angular Aria testing
│
└── 📦 angular-material/                      # Angular Material Specific
    ├── component-template.md                 # How to use Material
    └── testing-checklist.md                  # Material testing
```

## 🎯 Purpose

This structure supports **comparing multiple accessibility libraries** while maintaining generic skills that work everywhere.

### Current Libraries
1. **Angular Aria** - Headless, custom styling
2. **Angular Material** - Pre-styled, Material Design

### Future Libraries (Easy to Add)
- Radix UI (React)
- Headless UI (React/Vue)
- PrimeNG (Angular)
- Chakra UI (React)
- etc.

## 🔄 Workflow

### For Angular Aria Components
1. Use `angular-aria/component-template.md`
2. Test with `angular-aria/testing-checklist.md`
3. Reference generic skills as needed

### For Angular Material Components
1. Use `angular-material/component-template.md`
2. Test with `angular-material/testing-checklist.md`
3. Reference generic skills as needed

### For Other Libraries
1. Use `accessible-component-template.md` (generic)
2. Test with `accessibility-testing-checklist.md` (generic)
3. Create library-specific skills if needed

## 📊 Comparison Matrix

| Aspect | Angular Aria | Angular Material |
|--------|-------------|------------------|
| **Styling** | ❌ None (headless) | ✅ Pre-styled |
| **Bundle Size** | ✅ Minimal | ⚠️ Larger |
| **Customization** | ✅ Full control | ⚠️ Requires overrides |
| **Dev Speed** | ⚠️ Slower | ✅ Faster |
| **Design System** | ✅ Any | ⚠️ Material only |
| **Accessibility** | ✅ Built-in | ✅ Built-in |
| **Components** | ⚠️ Core patterns | ✅ More options |
| **Learning Curve** | ⚠️ Steeper | ✅ Easier |

## 🎓 Research Approach

### Phase 1: Angular Aria
- Build components with Angular Aria
- Document findings
- Test accessibility thoroughly

### Phase 2: Angular Material
- Build same components with Material
- Document findings
- Test accessibility thoroughly

### Phase 3: Comparison
- Compare developer experience
- Compare customization options
- Compare bundle sizes
- Compare accessibility features
- Prepare meetup presentation

## 🚀 Adding New Libraries

To add a new library (e.g., `radix-ui`):

```bash
mkdir .kiro/skills/radix-ui
```

Create two files:
1. `component-template.md` - How to use the library
2. `testing-checklist.md` - Library-specific testing

Update `README.md` with the new library info.

## 📝 Key Principles

1. **Generic First** - Generic skills work everywhere
2. **Library-Specific When Needed** - Add library folders for specific guidance
3. **Always Check Docs** - Online docs + node_modules source code
4. **Test Thoroughly** - Keyboard, screen reader, visual testing
5. **Document Findings** - Capture insights for comparison

## 🎯 Project Goals

- ✅ Learn Angular Aria patterns
- ✅ Learn Angular Material patterns
- ✅ Compare both libraries
- ✅ Build accessible components
- ✅ Prepare meetup demo
- ✅ Document best practices

---

*This structure enables systematic comparison of accessibility libraries while maintaining reusable generic skills.*
