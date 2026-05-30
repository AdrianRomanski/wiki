---
title: Tag-Based Enforcement
type: concept
tags:
  - automation
  - enforcement
  - tooling
created: 2026-05-30
updated: 2026-05-30
---

# Tag-Based Enforcement

## Overview

Tag-based enforcement uses minimal tags (scope and type) on projects to automatically enforce [[Module Boundary Rules]] and maintain workspace structure. This automation enables the [[Virtuous Cycle]] by catching violations early without requiring manual code review, making good structure easier to maintain than bad structure.

## Tag Structure

### Minimal Tag Set
Each project should have exactly two tags:
- **Scope tag:** Identifies business domain or area
- **Type tag:** Identifies [[Project Types|project type]]

### Tag Format

**Scope tags:**
```
scope:products
scope:checkout
scope:dashboard
scope:shared
```

**Type tags:**
```
type:feature
type:ui
type:data-access
type:util
```

### Example Project Tags
```json
{
  "name": "products-feature-details",
  "tags": ["scope:products", "type:feature"]
}
```

## Enforcement Rules

### Scope Constraints
Projects may only depend on:
- Projects within same scope
- Projects in `shared` scope

**Configuration:**
```json
{
  "sourceTag": "scope:*",
  "onlyDependOnLibsWithTags": ["scope:*", "scope:shared"]
}
```

### Type Constraints

**Feature libraries:** May depend on any type
```json
{
  "sourceTag": "type:feature",
  "onlyDependOnLibsWithTags": ["type:*"]
}
```

**UI libraries:** May depend only on utilities
```json
{
  "sourceTag": "type:ui",
  "onlyDependOnLibsWithTags": ["type:util"]
}
```

**Data-access libraries:** May depend on data-access and utilities
```json
{
  "sourceTag": "type:data-access",
  "onlyDependOnLibsWithTags": ["type:data-access", "type:util"]
}
```

**Utility libraries:** May depend only on utilities
```json
{
  "sourceTag": "type:util",
  "onlyDependOnLibsWithTags": ["type:util"]
}
```

## Implementation

### Project Configuration
Tags defined in `project.json`:
```json
{
  "name": "products-feature-details",
  "tags": ["scope:products", "type:feature"],
  "sourceRoot": "libs/products/feature-details/src"
}
```

### Nx Configuration
Constraints defined in `nx.json` or `.eslintrc.json`:
```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "scope:*",
          "onlyDependOnLibsWithTags": ["scope:*", "scope:shared"]
        },
        {
          "sourceTag": "type:ui",
          "onlyDependOnLibsWithTags": ["type:util"]
        }
        // ... more rules
      ]
    }
  ]
}
```

### Linting
Run enforcement through [[Nx]] linting:
```bash
nx lint project-name
nx run-many --target=lint --all
```

### CI/CD Integration
```yaml
# Example CI configuration
- name: Lint all projects
  run: nx run-many --target=lint --all
  
- name: Check module boundaries
  run: nx lint --skip-nx-cache
```

## Benefits

### Automated Enforcement
- No manual code review needed for structure
- Violations caught immediately
- Consistent enforcement across team
- Scales with workspace size

### Early Detection
- Violations caught during development
- IDE integration shows errors immediately
- CI/CD prevents merging violations
- Faster feedback loop

### Clear Error Messages
```
✖ A project tagged with "type:ui" can only depend on projects
  tagged with "type:util"
  
  Violation: products-ui-product-card → products-data-access-catalog
```

### Reduced Cognitive Load
- Developers don't need to memorize rules
- Tooling guides correct structure
- Mistakes caught automatically
- Focus on feature development

## Tag Management

### Keep Tags Minimal
**Recommended:** 2 tags per project (scope + type)

**Avoid:**
- Too many tags (frustrating to manage)
- Overlapping tag meanings
- Tags that duplicate other information
- Tags that change frequently

### Tag Naming Conventions
- Use consistent prefixes (`scope:`, `type:`)
- Use kebab-case for multi-word tags
- Keep names short and clear
- Document tag meanings

### Tag Evolution
- Add new scopes as organization grows
- Rarely add new types (stick to core four)
- Update tags during refactoring
- Maintain tag documentation

## Workspace Generators

### Automatic Tag Application
Generators should:
- Prompt for scope and type
- Apply tags automatically
- Validate tag values
- Update configuration files

**Example generator:**
```typescript
export default async function (tree: Tree, options: Schema) {
  const scope = options.scope;
  const type = options.type;
  
  const tags = [`scope:${scope}`, `type:${type}`];
  
  await libraryGenerator(tree, {
    ...options,
    tags: tags.join(',')
  });
}
```

## Related Concepts

- [[Module Boundary Rules]] - Rules that tags enforce
- [[Project Types]] - Types used in tags
- [[Scope-Type-Identifier Naming]] - Naming convention aligned with tags
- [[Virtuous Cycle]] - Self-reinforcing structure enabled by enforcement
- [[Modulith Architecture]] - Architecture maintained through enforcement

## Related Entities

- [[Nx]] - Tool providing tag-based enforcement features

## Sources

- [[The virtuous cycle of workspace structure]] - Describes tag-based enforcement as key to maintaining structure
