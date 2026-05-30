---
title: Module Boundary Rules
type: concept
tags:
  - architecture
  - boundaries
  - enforcement
created: 2026-05-30
updated: 2026-05-30
---

# Module Boundary Rules

## Overview

Module boundary rules define which [[Project Types]] can depend on which other types, maintaining separation of concerns in [[Modulith Architecture]]. These rules can be automatically enforced through [[Nx]]'s tagging system, preventing architectural drift without requiring manual code review.

## Five Core Rules

### Rule 1: Scope Boundaries
**Projects within a scope may only depend on projects within that scope or within the `shared` scope.**

**Purpose:**
- Prevents unintended coupling between business domains
- Makes cross-scope dependencies explicit and intentional
- Supports team autonomy

**Example:**
- ✅ `products-feature-details` → `products-data-access-catalog`
- ✅ `products-feature-details` → `shared-ui-forms`
- ❌ `products-feature-details` → `checkout-data-access-taxes`

### Rule 2: Feature Library Dependencies
**`feature` libraries may depend on any type of project.**

**Purpose:**
- Feature libraries are composition points
- They bring together UI, data-access, and utilities
- They implement complete business features

**Example:**
- ✅ `products-feature-details` → `products-ui-product-card`
- ✅ `products-feature-details` → `products-data-access-catalog`
- ✅ `products-feature-details` → `shared-util-dates`

### Rule 3: UI Library Dependencies
**`ui` libraries may depend only on utility projects.**

**Purpose:**
- Keeps UI components pure and presentational
- Prevents UI from directly accessing data sources
- Ensures UI components are reusable

**Example:**
- ✅ `shared-ui-forms` → `shared-util-validation`
- ❌ `shared-ui-forms` → `products-data-access-catalog`
- ❌ `shared-ui-forms` → `products-feature-details`

### Rule 4: Data-Access Library Dependencies
**`data-access` libraries may depend on data-access and utility libraries.**

**Purpose:**
- Allows data-access libraries to compose other data services
- Permits use of utilities for data transformation
- Prevents data-access from depending on UI or features

**Example:**
- ✅ `products-data-access-catalog` → `shared-data-access-auth`
- ✅ `products-data-access-catalog` → `shared-util-formatting`
- ❌ `products-data-access-catalog` → `products-ui-product-card`
- ❌ `products-data-access-catalog` → `products-feature-details`

### Rule 5: Utility Library Dependencies
**`util` libraries may only depend on other utility libraries.**

**Purpose:**
- Keeps utilities pure and reusable
- Prevents circular dependencies
- Ensures utilities have no business logic dependencies

**Example:**
- ✅ `shared-util-dates` → `shared-util-formatting`
- ❌ `shared-util-dates` → `products-data-access-catalog`
- ❌ `shared-util-dates` → `shared-ui-forms`

## Dependency Graph

```
feature ──┬──> ui ────> util
          ├──> data-access ──> util
          └──> util

(within scope or from shared scope)
```

## Benefits

### Architectural Integrity
- Enforces [[Modulith Architecture]] principles
- Prevents inappropriate coupling
- Maintains separation of concerns

### Code Quality
- Encourages proper abstraction
- Prevents circular dependencies
- Promotes reusability

### Team Velocity
- Clear rules reduce decision paralysis
- Automated enforcement catches violations early
- Reduces code review burden

### Maintainability
- Changes have predictable impact
- Dependency graph remains manageable
- Avoids [[Dump Projects]] anti-pattern

## Implementation

### Tag-Based Enforcement
Each project receives two tags:
- **Scope tag:** `scope:products`, `scope:checkout`, `scope:shared`
- **Type tag:** `type:feature`, `type:ui`, `type:data-access`, `type:util`

### Nx Lint Rules
Configure in `.eslintrc.json` or `nx.json`:

```json
{
  "depConstraints": [
    {
      "sourceTag": "scope:*",
      "onlyDependOnLibsWithTags": ["scope:*", "scope:shared"]
    },
    {
      "sourceTag": "type:ui",
      "onlyDependOnLibsWithTags": ["type:util"]
    },
    {
      "sourceTag": "type:data-access",
      "onlyDependOnLibsWithTags": ["type:data-access", "type:util"]
    },
    {
      "sourceTag": "type:util",
      "onlyDependOnLibsWithTags": ["type:util"]
    }
  ]
}
```

### CI/CD Integration
- Run `nx lint` in CI pipeline
- Fail builds on boundary violations
- Provide clear error messages

## Exceptions and Extensions

### When to Add Rules
- Organization-specific constraints
- Platform-specific boundaries (frontend/backend)
- Security or compliance requirements

### When to Relax Rules
- Temporary migration scenarios
- Specific justified exceptions
- Document rationale for exceptions

## Related Concepts

- [[Project Types]] - Types that rules are based on
- [[Tag-Based Enforcement]] - Mechanism for enforcing rules
- [[Scope-Type-Identifier Naming]] - Naming convention that supports rules
- [[Modulith Architecture]] - Architecture pattern these rules maintain
- [[Virtuous Cycle]] - Self-reinforcing structure enabled by rules

## Related Entities

- [[Nx]] - Tool providing boundary enforcement features

## Sources

- [[The virtuous cycle of workspace structure]] - Defines the five core module boundary rules
