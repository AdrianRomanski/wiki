---
title: Project Types
type: concept
tags:
  - workspace-organization
  - project-structure
  - categorization
created: 2026-05-30
updated: 2026-05-30
---

# Project Types

## Overview

Project types provide a taxonomy for categorizing code modules in [[Nx]] workspaces. By having a limited set of well-defined types, teams can better categorize projects, understand their purpose at a glance, and enforce architectural boundaries. This supports the [[Workspace Structure Goals]] of well-defined purpose and quick code location.

## Four Core Types

### Feature Libraries

**Purpose:** Implement container components with access to data sources for specific business use cases or pages.

**Characteristics:**
- Contain container/smart components
- Have access to data sources and state
- Implement specific business features or pages
- Compose UI and data-access libraries

**Dependencies:** May depend on any type of project

**Example Names:**
- `products-feature-details`
- `checkout-feature-cart`
- `dashboard-feature-analytics`

### UI Libraries

**Purpose:** Contain only presentational components.

**Characteristics:**
- Pure presentational components
- No data access or business logic
- Defined by inputs and outputs
- Reusable across features

**Dependencies:** May depend only on utility libraries

**Example Names:**
- `shared-ui-forms`
- `shared-ui-buttons`
- `products-ui-product-card`

### Data-Access Libraries

**Purpose:** Contain code for interacting with back-end systems.

**Characteristics:**
- API client code
- State management
- Data transformation
- Backend integration logic

**Dependencies:** May depend on data-access and utility libraries

**Example Names:**
- `checkout-data-access-taxes`
- `products-data-access-catalog`
- `shared-data-access-auth`

### Utility Libraries

**Purpose:** Contain low-level utilities used by many libraries and applications.

**Characteristics:**
- Pure functions and utilities
- No dependencies on other project types
- Highly reusable
- Framework-agnostic when possible

**Dependencies:** May depend only on other utility libraries

**Example Names:**
- `shared-util-dates`
- `shared-util-formatting`
- `shared-util-validation`

## Additional Types

Organizations may need additional types beyond the core four:

### Model Libraries
- Share interfaces between backend and frontend
- Type definitions and data structures
- No runtime code

### Platform-Specific Libraries
- Specify platform: frontend, backend, mobile
- Enable platform-specific optimizations
- Support multi-platform applications

### State Management Libraries
- Dedicated state management code
- May be separate type or part of data-access
- Depends on organizational preferences

## Benefits

### Separation of Concerns
- UI libraries focus on presentation
- Data-access libraries handle backend interaction
- Feature libraries compose them together
- Utilities provide shared functionality

### DRY Code
- Different features can reuse same UI components
- Different features can reuse same data-access logic
- Utilities shared across entire workspace

### Quick Code Location
- Type in name indicates what code contains
- Engineers know where to look for specific functionality
- Reduces time spent searching

### Enforced Architecture
- [[Module Boundary Rules]] based on types
- Prevents inappropriate dependencies
- Maintains [[Modulith Architecture]] integrity

## Implementation

### Naming Convention
Types appear in [[Scope-Type-Identifier Naming]]:
- Pattern: `scope-type-identifier`
- Example: `products-feature-details`
- Type is always second segment

### Directory Structure
Projects grouped by scope, prefixed with type:
```
libs/
  products/
    feature-details/
    ui-product-card/
    data-access-catalog/
  shared/
    ui-forms/
    util-dates/
```

### Tag-Based Enforcement
- Each project tagged with its type
- [[Tag-Based Enforcement]] validates dependencies
- Automated through [[Nx]] linting rules

## Related Concepts

- [[Scope-Type-Identifier Naming]] - Naming convention incorporating types
- [[Module Boundary Rules]] - Dependency rules based on types
- [[Modulith Architecture]] - Architecture pattern using these types
- [[Workspace Structure Goals]] - Goals that types help achieve

## Related Entities

- [[Nx]] - Tool for implementing and enforcing project types

## Sources

- [[The virtuous cycle of workspace structure]] - Defines the four core project types and their purposes
