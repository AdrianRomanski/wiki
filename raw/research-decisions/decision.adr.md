---
title: "Choose Focus Trap Library for Keyboard Navigation"
date: 2024-05-10
status: Accepted
context: "Research Session test-session-focus-trap-2024"
deciders: ["accessibility-team", "frontend-lead"]
tags: ["angular", "accessibility", "focus-management", "keyboard-navigation"]
---

# Choose Focus Trap Library for Keyboard Navigation

## Context and Problem Statement

We need a robust focus trap solution for modal dialogs and overlays in our Angular application. The solution must handle keyboard navigation, prevent focus from escaping the trap, and work seamlessly with Angular's change detection.

## Decision Drivers

- Ease of integration with Angular
- Bundle size impact
- Accessibility compliance (WCAG 2.1 AA)
- Maintenance and community support
- TypeScript support

## Considered Options

1. @angular/cdk/a11y
2. focus-trap
3. Custom solution

## Comparison Matrix

### Complexity Comparison

| Criterion | CDK | focus-trap | Custom | Winner |
|-----------|-----|------------|--------|--------|
| Implementation | 3/10 | 6/10 | 8/10 | CDK |
| Configuration | 2/10 | 5/10 | 9/10 | CDK |
| Maintenance | 1/10 | 4/10 | 10/10 | CDK |

### Modularity Comparison

| Criterion | CDK | focus-trap | Custom | Winner |
|-----------|-----|------------|--------|--------|
| Code Organization | 9/10 | 7/10 | 5/10 | CDK |
| Reusability | 10/10 | 8/10 | 4/10 | CDK |
| Testability | 9/10 | 7/10 | 6/10 | CDK |

### Bundle Size Impact

| Library | Minified | Gzipped | Winner |
|---------|----------|---------|--------|
| CDK | 45KB | 12KB | CDK |
| focus-trap | 8KB | 3KB | focus-trap |
| Custom | 2KB | 1KB | Custom |

## Decision Outcome

**Chosen option**: @angular/cdk/a11y

### Rationale

The Angular CDK provides the most comprehensive and well-tested focus trap solution. While it has a larger bundle size, it offers:

- Native Angular integration
- Excellent TypeScript support
- Battle-tested accessibility features
- Active maintenance by the Angular team
- Comprehensive documentation

### Positive Consequences

- Reduced implementation complexity
- Better Angular integration
- Strong TypeScript support
- Well-documented API
- Active community support

### Negative Consequences

- Larger bundle size compared to alternatives
- Requires @angular/cdk dependency
- Learning curve for CDK-specific patterns

## Research Links

- [Comparison Report](./comparison-report.md)
- [Final Report](./final-report.md)
- [Prototype: CDK](./prototypes/cdk/)
- [Prototype: focus-trap](./prototypes/focus-trap/)
