---
title: Scope-Type-Identifier Naming
type: concept
tags:
  - naming-convention
  - workspace-organization
  - best-practices
created: 2026-05-30
updated: 2026-05-30
---

# Scope-Type-Identifier Naming

## Overview

Scope-Type-Identifier is a naming convention pattern that combines scope, type, and identifier to create self-documenting project names. This pattern encodes architectural decisions directly into project names, making structure immediately visible in the file tree and import paths, supporting the [[Workspace Structure Goals]] of well-defined purpose and quick code location.

## Pattern Structure

### Format
```
scope-type-identifier
```

### Components

**Scope:** The business domain, application, or organizational area
- Examples: `products`, `checkout`, `dashboard`, `shared`
- Aligns with team boundaries
- Groups related functionality

**Type:** The [[Project Types|project type]] category
- Values: `feature`, `ui`, `data-access`, `util`
- Indicates project's architectural role
- Drives [[Module Boundary Rules]]

**Identifier:** The specific name for this project
- Examples: `details`, `cart`, `forms`, `dates`
- Describes specific functionality
- Should be concise and descriptive

## Examples

### Feature Libraries
- `products-feature-details` - Product details page feature
- `checkout-feature-cart` - Shopping cart feature
- `dashboard-feature-analytics` - Analytics dashboard feature

### UI Libraries
- `shared-ui-forms` - Shared form components
- `products-ui-product-card` - Product card component
- `shared-ui-buttons` - Shared button components

### Data-Access Libraries
- `checkout-data-access-taxes` - Tax calculation API client
- `products-data-access-catalog` - Product catalog API client
- `shared-data-access-auth` - Authentication service

### Utility Libraries
- `shared-util-dates` - Date formatting utilities
- `shared-util-validation` - Validation functions
- `shared-util-formatting` - General formatting utilities

## Import Paths

### Standard Format
```typescript
@org/scope/type-identifier
```

Examples:
- `@org/products/feature-details`
- `@org/checkout/data-access-taxes`
- `@org/shared/ui-forms`

### TypeScript Monorepo Format
For new TypeScript experience (single `/` in package.json):
```typescript
@org/scope-type-identifier
```

Examples:
- `@org/products-feature-details`
- `@org/checkout-data-access-taxes`
- `@org/shared-ui-forms`

## Directory Structure

Projects grouped by scope, with type-prefixed folders:

```
libs/
  products/               <-- scope grouping
    feature-details/      <-- type prefix
    ui-product-card/
    data-access-catalog/
  
  checkout/               <-- scope grouping
    feature-cart/         <-- type prefix
    data-access-taxes/
  
  shared/                 <-- scope grouping
    ui-forms/             <-- type prefix
    util-dates/
```

## Benefits

### Self-Documenting
- Purpose clear from name alone
- No need to inspect code or read docs
- Reduces cognitive load

### Quick Code Location
- Engineers can predict project names
- File tree navigation is intuitive
- Import paths reveal structure

### Enforced Consistency
- Standard pattern across workspace
- Workspace generators enforce convention
- [[Tag-Based Enforcement]] validates structure

### Architectural Visibility
- Scope boundaries visible in names
- Type relationships clear from imports
- [[Modulith Architecture]] structure apparent

## Implementation

### Workspace Generators
Create generators that:
- Prompt for scope, type, and identifier
- Generate project with correct name
- Apply appropriate tags
- Set up directory structure

### Linting Rules
Enforce naming through:
- Custom lint rules for project names
- Validation in CI/CD pipeline
- Pre-commit hooks

### Documentation
- Document scope definitions
- Maintain list of valid scopes
- Provide naming examples

## Scope Definition

### Common Scope Patterns

**Application-Based:**
- Each application is a scope
- Shared code in `shared` scope
- Example: `web-app`, `mobile-app`, `shared`

**Domain-Based:**
- Business domains as scopes
- Aligns with [[Domain Driven Design]]
- Example: `products`, `orders`, `customers`, `shared`

**Team-Based:**
- Team ownership as scopes
- Reduces cross-team dependencies
- Example: `team-alpha`, `team-beta`, `shared`

### Shared Scope
- Code usable by multiple scopes
- No scope-specific business logic
- Truly reusable components and utilities

## Related Concepts

- [[Project Types]] - Type component of naming pattern
- [[Module Boundary Rules]] - Enforced based on scope and type
- [[Workspace Structure Goals]] - Goals this naming pattern achieves
- [[Virtuous Cycle]] - Self-reinforcing structure enabled by clear naming
- [[Tag-Based Enforcement]] - Tags derived from scope and type

## Related Entities

- [[Nx]] - Tool for implementing this naming convention
- [[Domain Driven Design]] - Methodology for defining scopes

## Sources

- [[The virtuous cycle of workspace structure]] - Defines the scope-type-identifier naming pattern
