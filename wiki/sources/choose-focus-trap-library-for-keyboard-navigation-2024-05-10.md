---
title: [[Choose Focus Trap Library for Keyboard Navigation]]
type: source
tags:
  - research
  - adr
  - decision
  - angular
  - accessibility
  - focus-management
  - keyboard-navigation
created: '2024-05-10'
updated: '2026-05-10'
date: '2024-05-10'
---
# [[Choose Focus Trap Library for Keyboard Navigation]]

## Metadata
**Date**: 2024-05-10
**Status**: Accepted
**Raw Source**: `/home/adrian-romanski/projects/demo/deep-dive-angular-aria/raw/research-decisions/decision.adr.md`
**Deciders**: accessibility-team, frontend-lead

## Context
We need a robust focus trap solution for modal dialogs and overlays in our Angular application. The solution must handle keyboard navigation, prevent focus from escaping the trap, and work seamlessly with Angular's change detection.

## Key Points
- Ease of integration with Angular
- Bundle size impact
- Accessibility compliance (WCAG 2.1 AA)
- Maintenance and community support
- TypeScript support

## Considered Options
- [[@angular/cdk/a11y]]
- [[focus-trap]]
- [[Custom solution]]

## Insights
**Chosen option**: [[@angular/cdk/a11y]]

## Comparison Matrices

### Complexity Comparison

| Criterion | CDK | [[focus-trap]] | Custom | Winner | Winner |
| --- | --- | --- | --- | --- | --- |
| Implementation | 3/10 | 6/10 | 8/10 | CDK |
| Configuration | 2/10 | 5/10 | 9/10 | CDK |
| Maintenance | 1/10 | 4/10 | 10/10 | CDK |

### Modularity Comparison

| Criterion | CDK | [[focus-trap]] | Custom | Winner | Winner |
| --- | --- | --- | --- | --- | --- |
| Code Organization | 9/10 | 7/10 | 5/10 | CDK |
| Reusability | 10/10 | 8/10 | 4/10 | CDK |
| Testability | 9/10 | 7/10 | 6/10 | CDK |

### Bundle Size Impact

| Criterion | Minified | Gzipped | Winner | Winner |
| --- | --- | --- | --- | --- |
| CDK | 45KB | 12KB | CDK |
| [[focus-trap]] | 8KB | 3KB | [[focus-trap]] |
| Custom | 2KB | 1KB | Custom |

## Research Context

**Research Session**: [`.kiro/research/sessions/test-session-[[focus-trap]]-2024`](../.kiro/research/sessions/test-session-[[focus-trap]]-2024)

**Research Artifacts**:
- [Comparison Report](.././comparison-report.md)
- [Final Report](.././final-report.md)
- Prototypes:
  - [cdk](.././prototypes/cdk/)
  - [[[focus-trap]]](.././prototypes/[[focus-trap]]/)

## Relevant Entities
- [[@angular/cdk/a11y]]
- [[focus-trap]]
- [[Custom solution]]
