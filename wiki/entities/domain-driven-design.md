---
title: Domain Driven Design
type: entity
tags:
  - methodology
  - architecture
  - design-patterns
created: 2026-05-30
updated: 2026-05-30
---

# Domain Driven Design

## Overview

Domain Driven Design (DDD) is an architectural methodology that organizes code around business domains rather than technical concerns. It can enhance [[Modulith Architecture]] by providing a framework for defining scopes and boundaries based on business context.

## Core Principles

### Business Domain Focus
- Organize code around business capabilities and domains
- Use ubiquitous language shared between developers and domain experts
- Define bounded contexts that align with business areas

### Strategic Design
- Context mapping to understand relationships between domains
- Identifying core, supporting, and generic subdomains
- Aligning team structure with domain boundaries

## Application to Monorepos

### Scope Definition
DDD provides a framework for defining scopes in [[Scope-Type-Identifier Naming]] conventions:
- Each bounded context becomes a scope
- Shared kernel becomes the `shared` scope
- Domain boundaries inform [[Module Boundary Rules]]

### Team Alignment
- Teams organized around bounded contexts
- Code co-location matches team responsibilities
- Reduces cross-team dependencies and merge conflicts

## Related Concepts

- [[Modulith Architecture]] - Can be enhanced by DDD principles
- [[Workspace Structure Goals]] - DDD helps achieve goal of co-locating related code
- [[Architecture]] - DDD is one architectural approach

## Related Entities

- [[Nx]] - Tool for implementing DDD-informed workspace structure

## Sources

- [[The virtuous cycle of workspace structure]] - Mentions DDD as complementary to modulith architecture
